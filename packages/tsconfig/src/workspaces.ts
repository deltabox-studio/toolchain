/**
 * Resolve the workspaces a root `tsconfig` sync should wire.
 *
 * A root config defines the defaults; a nested `dbx.config.*` may override any
 * `tsconfig` option for its own workspace (including disabling it). Nested
 * configs are loaded through the core loader so custom file names and `extends`
 * chains are honoured exactly like the CLI does everywhere else.
 */

import fs from 'node:fs';
import path from 'node:path';

import { globSync } from 'glob';

import { buildProjectGraph, findConfigFile, loadToolchainConfig } from '@deltabox/toolchain/core';
import {
    deepMerge,
    isIgnoredPath,
    type PackageJson,
    readJsonAt,
    resolveIgnorePatterns,
    sectionConfig,
    splitPackageName,
    sectionEnabled,
    type ToolchainConfig,
    type ToolchainTsconfigAliasRewrite,
    type ToolchainTsconfigConfig,
} from '@deltabox/toolchain/shared';

import { type TsconfigFileNames, tsconfigFileNames } from './files.js';

/** A workspace (or the root) with its effective tsconfig settings. */
export interface TsconfigWorkspace {
    /** Absolute workspace directory. */
    dir: string;
    /** Repo-relative posix path (`.` for the root). */
    relativeDir: string;
    /** `package.json` name, when present. */
    packageName?: string;
    /** `package.json`, when present (used to resolve entry points). */
    packageJson?: PackageJson;
    /** Whether this workspace's effective `tsconfig` section is enabled. */
    enabled: boolean;
    /** Whether this workspace's own config defines a `tsconfig` section. */
    ownTsconfig: boolean;
    /** Whether this is the repository root. */
    isRoot: boolean;
    /** Effective file names (custom `defaultFile`/`buildFile` included). */
    names: TsconfigFileNames;
    /** Absolute source default tsconfig path. */
    defaultTsconfigPath: string;
    /** Absolute generated tsconfig path. */
    targetTsconfigPath: string;
    /** Absolute build tsconfig path. */
    buildTsconfigPath: string;
    /** Effective merged `tsconfig` options (root defaults + nested overrides). */
    options: ToolchainTsconfigConfig;
}

export interface ResolveTsconfigWorkspacesOptions {
    /** Repo root. */
    cwd: string;
    /** The merged root config. */
    rootConfig: ToolchainConfig;
    /** Skip projects without a source default tsconfig (default false). */
    requireDefaultFile?: boolean;
    /** Explicit glob(s) for the workspace default tsconfig files. */
    glob?: string | string[];
    /** Extra glob(s) to exclude. */
    exclude?: string | string[];
    /** Respect `.gitignore` files (default true). */
    gitignore?: boolean;
}

function posix(value: string): string {
    return value.replace(/\\/g, '/');
}

function rel(cwd: string, dir: string): string {
    return posix(path.relative(cwd, dir)) || '.';
}

/**
 * Resolve every project in the graph with its effective `tsconfig` settings.
 * Root `tsconfig` options are the defaults; a nested config's own `tsconfig`
 * section overrides them for that workspace.
 */
export async function resolveTsconfigWorkspaces(
    options: ResolveTsconfigWorkspacesOptions
): Promise<TsconfigWorkspace[]> {
    const cwd = path.resolve(options.cwd);
    const graph = buildProjectGraph(cwd);
    const rootSection = options.rootConfig.tsconfig;
    const rootEnabled = sectionEnabled(rootSection);
    const rootOptions = (sectionConfig(rootSection) ?? {}) as ToolchainTsconfigConfig;

    const nodes = [...graph.projects];
    if (!nodes.some(node => node.dir === '.')) {
        nodes.unshift({
            dir: '.',
            hasConfig: Boolean(options.rootConfig),
            dependencies: [],
        });
    }
    // The graph only contains package/config dirs. Also include directories that
    // carry a default tsconfig (eg. a workspace without a package.json, or test
    // fixtures) so generation does not depend on a package manifest.
    const rootDefault = rootOptions.defaultFile ?? 'tsconfig.default.json';
    const scanGlob = options.glob ?? `**/${rootDefault}`;
    const scanIgnore = resolveIgnorePatterns(cwd, {
        ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
        ...(options.gitignore !== undefined ? { gitignore: options.gitignore } : {}),
    });
    for (const file of globSync(scanGlob, { cwd, nodir: true, ignore: scanIgnore })) {
        const dir = path.dirname(path.resolve(cwd, file));
        const relative = rel(cwd, dir);
        if (nodes.some(node => node.dir === relative)) continue;
        nodes.push({
            dir: relative,
            hasConfig: Boolean(findConfigFile(dir)),
            dependencies: [],
        });
    }
    const ignore = resolveIgnorePatterns(cwd, {
        ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
        ...(options.gitignore !== undefined ? { gitignore: options.gitignore } : {}),
    });
    const explicitGlob = options.glob
        ? new Set(
              globSync(options.glob, {
                  cwd,
                  nodir: true,
                  ignore,
              }).map(file => posix(file))
          )
        : undefined;

    const workspaces: TsconfigWorkspace[] = [];
    for (const node of nodes) {
        const dir = path.resolve(cwd, node.dir);
        const isRoot = node.dir === '.';
        const relativeDir = rel(cwd, dir);
        const packageJson = readJsonAt<PackageJson>(dir, 'package.json');
        const ownConfig = await loadOwnConfig(dir, isRoot, node.hasConfig);
        const configuredProject = isRoot ? options.rootConfig.project : ownConfig?.project;
        const packageName = configuredPackageName(packageJson?.name, configuredProject);
        const ownSection = ownConfig?.tsconfig;
        const ownEnabled = ownSection === undefined ? true : sectionEnabled(ownSection);
        const enabled = rootEnabled && ownEnabled;
        const override =
            ownSection !== undefined && typeof ownSection === 'object'
                ? (sectionConfig(ownSection) ?? {})
                : {};
        const merged = deepMerge(
            rootOptions as Record<string, unknown>,
            override as Record<string, unknown>
        ) as typeof rootOptions;
        const names = tsconfigFileNames({
            ...options.rootConfig,
            tsconfig: merged,
        });
        const defaultTsconfigPath = path.resolve(dir, names.defaultFile);
        const hasDefault = fs.existsSync(defaultTsconfigPath);
        const relativeDefault = posix(path.relative(cwd, defaultTsconfigPath));
        if (isIgnoredPath(relativeDefault, ignore)) continue;
        if (explicitGlob && !explicitGlob.has(relativeDefault)) continue;
        if (options.requireDefaultFile && !hasDefault) continue;

        workspaces.push({
            dir,
            relativeDir,
            ...(packageName ? { packageName } : {}),
            ...(packageJson ? { packageJson } : {}),
            enabled,
            ownTsconfig: ownSection !== undefined,
            isRoot,
            names,
            defaultTsconfigPath,
            targetTsconfigPath: path.resolve(dir, 'tsconfig.json'),
            buildTsconfigPath: path.resolve(dir, names.buildFile),
            options: merged,
        });
    }

    return workspaces;
}

async function loadOwnConfig(
    dir: string,
    isRoot: boolean,
    hasConfig: boolean
): Promise<ToolchainConfig | undefined> {
    if (isRoot) return undefined;
    if (!hasConfig) return undefined;
    try {
        const loaded = await loadToolchainConfig(dir, { tolerant: true, skipHooks: true });
        return loaded.ownConfig;
    } catch {
        return undefined;
    }
}

/** The package name the `project` task will write (config identity wins). */
function configuredPackageName(
    current: string | undefined,
    project: { name?: string; scope?: string } | undefined
): string | undefined {
    if (!project?.name) return current;
    if (project.name.startsWith('@')) return project.name;
    const existing = splitPackageName(current);
    const scope = project.scope ?? existing.scope;
    return scope ? `${scope}/${project.name}` : project.name;
}
/** The effective `auto` switch, its include/exclude filters and alias rewrite. */
export interface AutoSwitch {
    enabled: boolean;
    include: string[];
    exclude: string[];
    rewriteAlias?: ToolchainTsconfigAliasRewrite;
}

function autoSwitch(value: unknown, fallback: boolean): AutoSwitch {
    if (value === undefined) return { enabled: fallback, include: [], exclude: [] };
    if (typeof value === 'boolean') return { enabled: value, include: [], exclude: [] };
    if (value && typeof value === 'object') {
        const record = value as {
            include?: unknown;
            exclude?: unknown;
            rewriteAlias?: unknown;
        };
        return {
            enabled: true,
            include: Array.isArray(record.include)
                ? record.include.filter((item): item is string => typeof item === 'string')
                : [],
            exclude: Array.isArray(record.exclude)
                ? record.exclude.filter((item): item is string => typeof item === 'string')
                : [],
            ...(record.rewriteAlias !== undefined
                ? { rewriteAlias: record.rewriteAlias as ToolchainTsconfigAliasRewrite }
                : {}),
        };
    }
    return { enabled: fallback, include: [], exclude: [] };
}

/** The auto switches for one workspace (main `auto`, then `aliasAuto`/`refsAuto`). */
export function resolveAutoSwitches(options: Record<string, unknown>): {
    auto: AutoSwitch;
    aliasAuto: AutoSwitch;
    refsAuto: AutoSwitch;
} {
    const auto = autoSwitch(options.auto, false);
    return {
        auto,
        aliasAuto: autoSwitch(options.aliasAuto, auto.enabled),
        refsAuto: autoSwitch(options.refsAuto, auto.enabled),
    };
}

/** Whether `relativeDir` matches an auto include/exclude filter. */
export function matchesAutoFilter(relativeDir: string, filter: AutoSwitch): boolean {
    const dir = relativeDir === '.' ? '' : relativeDir;
    if (filter.include.length > 0 && !filter.include.some(pattern => matchGlob(pattern, dir))) {
        return false;
    }
    return !filter.exclude.some(pattern => matchGlob(pattern, dir));
}

/** A small, dependency-free glob matcher for auto include/exclude filters. */
export function matchGlob(pattern: string, value: string): boolean {
    const normalized = pattern.replace(/\\/g, '/').replace(/^\.\//, '');
    const target = value.replace(/\\/g, '/').replace(/^\.\//, '');
    const source = normalized
        .split('')
        .map(char => {
            if (char === '*') return '.*';
            if (char === '?') return '.';
            return char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        })
        .join('');
    // `**/` should also match zero directories.
    const flexible = source.replace(/\.\*\.\*\//g, '(?:.*/)?').replace(/\\\*\\\*/g, '.*');
    try {
        return new RegExp(`^${flexible}$`).test(target);
    } catch {
        return normalized === target;
    }
}
