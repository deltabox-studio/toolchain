import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { logger, type ToolchainChangelogConfig } from '@deltabox/toolchain-shared';

import { deriveBump, readCommits } from './git.js';
import { relatedWorkspacePaths } from './graph.js';
import { repoRoot } from './repo.js';
import type { BumpType, CommitRecord } from './types.js';
import { bumpVersion } from './version.js';

/** How/where a changelog run applies its version bump. */
export type VersioningTarget = 'uniform' | 'root-only' | 'individual';

/** The normalized `changelog.versioning` config. */
export interface ResolvedVersioning {
    /** Whether versions are written to `package.json` at all. */
    enabled: boolean;
    /** Where the bump is applied. */
    target: VersioningTarget;
    /** Explicit workspace globs (when configured). */
    workspaces?: string[];
}

/**
 * Normalize the `changelog.versioning` union (`boolean | { target, workspaces }`)
 * into a concrete plan input. `true`/absent means uniform with defaults; `false`
 * disables writing versions while still generating changelog entries.
 */
export function resolveVersioning(changelog?: ToolchainChangelogConfig): ResolvedVersioning {
    const versioning = changelog?.versioning;
    if (versioning === false) return { enabled: false, target: 'uniform' };
    if (versioning === undefined || versioning === true) {
        return { enabled: true, target: 'uniform' };
    }
    return {
        enabled: true,
        target: versioning.target ?? 'uniform',
        ...(versioning.workspaces ? { workspaces: versioning.workspaces } : {}),
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
                workspaces?: string[];
            };
            patterns = pkg.workspaces;
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
            const next = bumpVersion(readPackageVersion(dir) ?? '0.0.0', deriveBump(commits));
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
