/**
 * Resolve the workspace custom groups for Oxfmt's `sortImports`.
 *
 * The project graph lists every discovered project that has a `dbx.config.*`;
 * their package names/scopes become the patterns of a single `workspace` custom
 * group, so consumers do not have to list their own packages by hand. Pass an
 * inline `project` (or `toolchain`) to add a project that is not in the graph,
 * or a `config` path to resolve from a specific `dbx.config.*` file instead of
 * the one discovered from `cwd`.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
    type DbxConfig,
    type FmtCustomGroup,
    fmtCustomGroupsForProjects,
    type PackageJson,
    projectFromPackageJson,
    readJsonAt,
    readJsoncAt,
    splitPackageName,
    type ToolchainConfigSections,
    type ToolchainProjectConfig,
} from '@deltabox/toolchain/shared';

import { buildProjectGraph } from './graph.js';
import { loadToolchainConfig } from './loader.js';

/**
 * The environment variable the VS Code extension sets from
 * {@link FORMAT_IMPORT_GROUP_DEFAULTS_SETTING}. `0`/`false` disables the
 * resolved import groups (the default is enabled).
 */
export const FORMAT_IMPORT_GROUP_DEFAULTS_ENV = 'DBX_ENABLE_FORMAT_IMPORT_GROUP_DEFAULTS';

/** The VS Code setting that toggles the resolved import groups. */
export const FORMAT_IMPORT_GROUP_DEFAULTS_SETTING =
    'deltabox.toolchain.enableFormatImportGroupDefaults';

/** Read the setting from a `.vscode/settings.json` (folder beats workspace). */
function settingAt(dir: string): boolean | undefined {
    try {
        const settings = readJsoncAt<Record<string, unknown>>(dir, '.vscode/settings.json');
        const value = settings?.[FORMAT_IMPORT_GROUP_DEFAULTS_SETTING];
        return typeof value === 'boolean' ? value : undefined;
    } catch {
        return undefined;
    }
}

/** Whether the resolved import groups are enabled (env > folder > workspace). */
function importGroupsEnabled(cwd: string, root: string): boolean {
    const env = process.env[FORMAT_IMPORT_GROUP_DEFAULTS_ENV]?.trim().toLowerCase();
    if (env) return !['0', 'false', 'off', 'no', 'disabled'].includes(env);
    for (const dir of new Set([path.resolve(cwd), path.resolve(root)])) {
        const value = settingAt(dir);
        if (value !== undefined) return value;
    }
    return true;
}

/** The options {@link resolveFmtCustomGroups} accepts. */
export interface ResolveFmtCustomGroupsOptions extends Pick<ToolchainConfigSections, 'project'> {
    /** Project root to discover the project graph from (default: `process.cwd()`). */
    cwd?: string;
    /** Load this `dbx.config.*` file when resolving the project identity. */
    config?: string;
}

/** A loaded `dbx.config` and/or inline `project`, like `ResolveViteInput`. */
export type ResolveFmtCustomGroupsInput = DbxConfig & ResolveFmtCustomGroupsOptions;

/** Walk up to the nearest repository boundary (`.git`), else `cwd`. */
function findRepoRoot(cwd: string): string {
    let dir = path.resolve(cwd);
    for (;;) {
        if (fs.existsSync(path.join(dir, '.git'))) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) return path.resolve(cwd);
        dir = parent;
    }
}

/** The `package.json` project metadata for a directory, if any. */
function packageProject(dir: string): ToolchainProjectConfig {
    const pkg = readJsonAt<PackageJson>(dir, 'package.json');
    return pkg ? projectFromPackageJson(pkg) : {};
}

/** Fixtures are discovered as dbx projects but are not importable packages. */
const FIXTURE_DIR = /(^|\/)(?:test-)?fixtures?(?:\/|$)/i;

/**
 * Resolve the `sortImports.customGroups` definitions for every dbx project in
 * the repository. The default uses the project graph (so it is safe to call
 * from inside a `dbx.config.*`); `config` or an inline `project` adds a project
 * whose identity is not in the graph.
 */
export async function resolveFmtCustomGroups(
    input?: ResolveFmtCustomGroupsInput | null
): Promise<FmtCustomGroup[]> {
    const options = input ?? {};
    const cwd = options.cwd ? path.resolve(options.cwd) : process.cwd();
    const root = findRepoRoot(cwd);
    if (!importGroupsEnabled(cwd, root)) return [];
    const projects = buildProjectGraph(root)
        .dbxProjects.filter(node => !FIXTURE_DIR.test(node.dir))
        .map(node => splitPackageName(node.name));

    let custom: ToolchainProjectConfig | undefined;
    if (options.config) {
        const file = path.isAbsolute(options.config)
            ? options.config
            : path.resolve(cwd, options.config);
        const loaded = await loadToolchainConfig(root, {
            config: file,
            skipHooks: true,
            tolerant: true,
        });
        custom = { ...packageProject(path.dirname(file)), ...loaded.config.project };
    } else {
        const inline = {
            ...options.toolchain?.project,
            ...options.project,
        };
        if (Object.keys(inline).length > 0) custom = inline;
    }
    if (custom) projects.push(custom);

    return fmtCustomGroupsForProjects(projects);
}
