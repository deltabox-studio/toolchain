import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type ChangelogConfig, logger } from '@deltabox/toolchain-shared';

import { parseCcSubject } from './format.js';
import { deriveBump, readCommits } from './git.js';
import { relatedWorkspacePaths } from './graph.js';
import { repoRoot } from './repo.js';
import type { BumpType, CommitRecord } from './types.js';
import { bumpVersion } from './version.js';

/** How/where a changelog run applies its version bump. */
export type VersioningTarget = 'uniform' | 'root-only' | 'individual';

/** The normalized `ci.changelog.versioning` config. */
export interface ResolvedVersioning {
    /** Whether versions are written to `package.json` at all. */
    enabled: boolean;
    /** Where the bump is applied. */
    target: VersioningTarget;
    /** Explicit workspace globs (when configured). */
    workspaces?: string[];
    /** Custom bump rules keyed by version index. */
    bump?: Record<string, unknown>;
    /** Apply a bump per matching change instead of once. */
    allowOverBump?: boolean;
    /** Changelog provider id, callback, or custom provider object. */
    provider?: unknown;
    /** Commit formatting options. */
    commit?: unknown;
}

/**
 * Normalize the `ci.changelog.versioning` union (`boolean | { target, workspaces }`)
 * into a concrete plan input. `true`/absent means uniform with defaults; `false`
 * disables writing versions while still generating changelog entries.
 */
export function resolveVersioning(changelog?: ChangelogConfig): ResolvedVersioning {
    const versioning = changelog?.versioning;
    if (versioning === false) return { enabled: false, target: 'uniform' };
    if (versioning === undefined || versioning === true) {
        return { enabled: true, target: 'uniform' };
    }
    return {
        enabled: true,
        target: versioning.target ?? 'uniform',
        ...(versioning.workspaces ? { workspaces: versioning.workspaces } : {}),
        ...(versioning.bump ? { bump: versioning.bump } : {}),
        ...(versioning.allowOverBump ? { allowOverBump: true } : {}),
        ...(versioning.provider ? { provider: versioning.provider } : {}),
        ...(versioning.commit ? { commit: versioning.commit } : {}),
    };
}

/** The packages a changelog run versions. */
export interface VersionPackages {
    /** The repository root. */
    root: string;
    /** Whether the root has a `package.json`. */
    rootHasPackage: boolean;
    /** Workspace directories (root excluded) that have a `package.json`. */
    workspaces: string[];
}

/** Read the `version` field of a directory's `package.json` (if any). */
export function readPackageVersion(dir: string): string | undefined {
    try {
        const pkg = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')) as {
            version?: unknown;
        };
        return typeof pkg.version === 'string' ? pkg.version : undefined;
    } catch {
        return undefined;
    }
}

/** Write `version` into a directory's `package.json` in place (minimal diff). */
export function writePackageVersion(dir: string, version: string): void {
    const file = resolve(dir, 'package.json');
    const content = readFileSync(file, 'utf8');
    const next = content.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
    if (next !== content) {
        writeFileSync(file, next, 'utf8');
        logger.info(`  bumped ${file}`);
    }
}

/**
 * Resolve the packages to version: the explicit `workspaces` globs, else the
 * root `package.json` `workspaces` field, else the root `package.json` alone.
 * Warns (never throws) when neither a root `package.json` nor a matching
 * workspace is found, so a broken checkout can't wedge a release.
 */
export function discoverVersionPackages(workspaces?: string[], root = repoRoot()): VersionPackages {
    const rootHasPackage = existsSync(resolve(root, 'package.json'));
    let patterns = workspaces;
    if (patterns === undefined && rootHasPackage) {
        try {
            const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
                workspaces?: unknown;
            };
            const value = pkg.workspaces;
            // Yarn/npm use an array; Bun uses `{ packages, catalog }`.
            patterns = Array.isArray(value)
                ? value.filter((entry): entry is string => typeof entry === 'string')
                : value &&
                    typeof value === 'object' &&
                    Array.isArray((value as { packages?: unknown }).packages)
                  ? ((value as { packages: unknown[] }).packages.filter(
                        (entry): entry is string => typeof entry === 'string'
                    ) as string[])
                  : undefined;
        } catch {
            patterns = undefined;
        }
    }

    const dirs = new Set<string>();
    for (const pattern of patterns ?? []) {
        if (pattern === '.') {
            dirs.add(root);
            continue;
        }
        for (const match of globSync(pattern, { cwd: root })) {
            const dir = resolve(root, match);
            if (existsSync(resolve(dir, 'package.json'))) dirs.add(dir);
        }
    }
    dirs.delete(root);

    if (!rootHasPackage && dirs.size === 0) {
        logger.warn(
            '[changelog] versioning: no root package.json and no matching workspaces — nothing to version.'
        );
    }
    return { root, rootHasPackage, workspaces: [...dirs] };
}

/** Context handed to custom bump callbacks. */
export interface BumpRuleContext {
    env: NodeJS.ProcessEnv;
    logger: typeof logger;
    packageJson?: Record<string, unknown>;
}

/** Whether a bump rule matches a commit. */
function bumpRuleMatches(rule: unknown, record: CommitRecord, context: BumpRuleContext): boolean {
    if (rule === true) return true;
    if (rule === false || rule === undefined || rule === null) return false;
    if (typeof rule === 'string') {
        if (rule.startsWith('/') && rule.lastIndexOf('/') > 0) {
            const last = rule.lastIndexOf('/');
            try {
                return new RegExp(rule.slice(1, last), rule.slice(last + 1)).test(
                    `${record.subject}\n${record.body}`
                );
            } catch {
                return false;
            }
        }
        return `${record.subject}\n${record.body}`.includes(rule);
    }
    if (Array.isArray(rule)) return rule.some(item => bumpRuleMatches(item, record, context));
    if (typeof rule === 'function') {
        return Boolean(
            (rule as (ctx: BumpRuleContext & { commit: CommitRecord }) => unknown)({
                ...context,
                commit: record,
            })
        );
    }
    if (typeof rule === 'object') {
        const source = rule as Record<string, unknown>;
        const parsed = parseCcSubject(record.subject);
        if (
            source.breaking === true &&
            !parsed.breaking &&
            !/BREAKING[ -]CHANGE/i.test(record.body)
        )
            return false;
        if (typeof source.type === 'string' && parsed.type !== source.type) return false;
        if (Array.isArray(source.types) && !source.types.includes(parsed.type)) return false;
        if (typeof source.scope === 'string' && parsed.scope !== source.scope) return false;
        if (Array.isArray(source.scopes) && !source.scopes.includes(parsed.scope)) return false;
        if (
            typeof source.pattern === 'string' &&
            !new RegExp(source.pattern).test(`${record.subject}\n${record.body}`)
        )
            return false;
        if (
            typeof source.match === 'string' &&
            !`${record.subject}\n${record.body}`.includes(source.match)
        )
            return false;
        return true;
    }
    return false;
}

const BUMP_ORDER: BumpType[] = ['patch', 'minor', 'major'];

/** Resolve a bump from custom rules, falling back to Conventional Commits. */
export function deriveCustomBump(
    records: CommitRecord[],
    rules?: Record<string, unknown>,
    allowOverBump = false,
    context: BumpRuleContext = { env: process.env, logger }
): BumpType {
    if (!rules || Object.keys(rules).length === 0) return deriveBump(records);
    let result: BumpType = 'patch';
    let matches = 0;
    for (const level of BUMP_ORDER) {
        const rule = rules[level];
        for (const record of records) {
            const matched =
                typeof rule === 'function'
                    ? (() => {
                          const value = (
                              rule as (
                                  ctx: BumpRuleContext & {
                                      commit: CommitRecord;
                                      level: string;
                                  }
                              ) => string | boolean
                          )({ ...context, commit: record, level });
                          return typeof value === 'string' ? value === level : Boolean(value);
                      })()
                    : bumpRuleMatches(rule, record, context);
            if (!matched) continue;
            matches += 1;
            if (BUMP_ORDER.indexOf(level) > BUMP_ORDER.indexOf(result)) result = level;
        }
    }
    if (allowOverBump && matches > 1) {
        // Repeated over-bumping is intentionally opt-in.
        for (let i = 1; i < matches; i += 1) {
            if (result === 'major') break;
            result = result === 'patch' ? 'minor' : 'major';
        }
    }
    return result;
}
/** The version bump plan for a changelog run. */
export interface VersionPlan {
    /** The version heading for the root changelog. */
    rootVersion: string;
    /** `package.json` writes to apply (empty when versioning is disabled). */
    writes: Map<string, string>;
    /** Workspace dirs to give a changelog entry, and the version to head it with. */
    entries: Map<string, string>;
}

export interface PlanVersionsOptions {
    versioning: ResolvedVersioning;
    /** The starting root version (`--base-version` when provided). */
    rootVersion: string;
    /** The bump derived from all scanned commits. */
    bump: BumpType;
    /** Custom bump rules (used for per-workspace derivation). */
    bumpRules?: Record<string, unknown>;
    /** Allow over-bumping (default false). */
    allowOverBump?: boolean;
    /** The git revision range the commits were read from. */
    range: string;
    /** The repository root (default: resolved from cwd). */
    root?: string;
    /** Read the commits touching a workspace dir (injected for tests). */
    commitsFor?: (dir: string) => CommitRecord[];
}

/**
 * Compute which packages get which version, and which changelogs get an entry.
 *
 * - `uniform`: the root (when present) and every workspace share one version.
 * - `root-only`: only the root is versioned; workspaces get no entry.
 * - `individual`: the root tracks the overall bump; each workspace that has
 *   commits in the range is bumped on its own.
 *
 * A disabled `versioning` writes no `package.json` but still heads the
 * changelogs as `uniform` would, so the entries stay complete.
 */
export function planVersions(options: PlanVersionsOptions): VersionPlan {
    const { versioning, bump, range } = options;
    const root = options.root ?? repoRoot();
    const { rootHasPackage, workspaces } = discoverVersionPackages(versioning.workspaces, root);
    // A workspace's "related" commits include those touching its own files and
    // those of every workspace it depends on (see `relatedWorkspacePaths`).
    const commitsFor =
        options.commitsFor ??
        ((dir: string) => readCommits(range, relatedWorkspacePaths(dir, root)));

    const rootVersion = bumpVersion(options.rootVersion, bump);
    const writes = new Map<string, string>();
    const entries = new Map<string, string>();
    // A disabled pipeline behaves like `uniform` for the changelog headings.
    const target = versioning.enabled ? versioning.target : 'uniform';

    if (rootHasPackage && versioning.enabled) writes.set(root, rootVersion);

    if (target === 'individual') {
        for (const dir of workspaces) {
            const commits = commitsFor(dir);
            if (commits.length === 0) continue;
            const next = bumpVersion(
                readPackageVersion(dir) ?? '0.0.0',
                deriveCustomBump(commits, options.bumpRules, options.allowOverBump)
            );
            entries.set(dir, next);
            if (versioning.enabled) writes.set(dir, next);
        }
    } else if (target === 'uniform') {
        for (const dir of workspaces) {
            entries.set(dir, rootVersion);
            if (versioning.enabled) writes.set(dir, rootVersion);
        }
    }
    // `root-only`: workspaces get neither a version nor a changelog entry.

    return { rootVersion, writes, entries };
}
