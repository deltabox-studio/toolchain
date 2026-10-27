/**
 * The shared tooling-configuration model and the sync/watch task contract.
 *
 * A consumer drops a `dbx.config.{ts,js,mjs,cjs,json}` file at the repo root
 * exporting `{ toolchain: { ...sections } }`; each `@deltabox/toolchain` package
 * exposes a {@link SyncTask} that turns that config into generated/managed files
 * (workflows, `biome.json`, tsconfigs, VS Code settings, ...). The core package
 * loads the config and runs the tasks (optionally watching for changes).
 *
 * The config *sections* are defined as Zod schemas in `config-schema.ts` (the
 * single source of truth); their TypeScript types are generated into
 * `config-types.ts`. Only `hooks` (functions) is hand-written.
 */

import type {
    ChangelogConfig,
    ProjectType,
    ToolchainCiConfig,
    ToolchainConfigSections,
} from './config-types.js';
import { deepMerge, isPlainObject } from './object-utils.js';
import type { Replacements } from './template.js';
import type { Awaitable } from './types.js';

export * from './config-schema/index.js';
export * from './config-types.js';

/** A summary of a sync run, handed to {@link ToolchainHooks.afterSync}. */
export interface SyncSummary {
    written: string[];
    changed: string[];
    removed: string[];
    upToDate: boolean;
}

/**
 * Lifecycle hooks, declared as functions in `dbx.config.ts` (so they only work
 * from a `.ts`/`.js` config, not JSON). Return values are awaited.
 */
export interface ToolchainHooks {
    /** Runs after the config is loaded + tokens resolved. */
    afterLoad?: (info: {
        cwd: string;
        config: ToolchainConfig;
        tokens: Replacements;
        path?: string;
    }) => Awaitable<void>;
    /** Runs once before the sync tasks. */
    beforeSync?: (ctx: SyncContext) => Awaitable<void>;
    /** Runs before each task. */
    beforeTask?: (info: { task: SyncTask; ctx: SyncContext }) => Awaitable<void>;
    /** Runs after each task (with the files it produced, if any). */
    afterTask?: (info: {
        task: SyncTask;
        ctx: SyncContext;
        files?: ManagedFile[];
    }) => Awaitable<void>;
    /** Runs once after the sync tasks with the result summary. */
    afterSync?: (info: {
        cwd: string;
        config: ToolchainConfig;
        result: SyncSummary;
    }) => Awaitable<void>;
    /** Runs on every watch-triggered change. */
    onChange?: (info: { path?: string }) => Awaitable<void>;
}

/**
 * The complete tooling configuration a consumer declares (under
 * `dbx.toolchain`).
 *
 * Every section is **opt-in by presence** (see {@link sectionEnabled}): define a
 * section to enable it; omit it to leave that area untouched. Within a defined
 * section, `enabled: false` disables it explicitly.
 */
export type ToolchainConfig = ToolchainConfigSections & { hooks?: ToolchainHooks };

/**
 * The root shape of a `dbx.config.*` file. The `@deltabox/toolchain` settings
 * live under the `toolchain` key, so `dbx.config` can host other dbx concerns
 * alongside it.
 */
export interface DbxConfig {
    toolchain?: ToolchainConfig;
}

/** A `dbx.config` callback: returns the config synchronously or as a promise. */
export type DbxConfigFunction = () => DbxConfig | Promise<DbxConfig>;

/** Everything {@link defineConfig} accepts: an object, a promise, or a callback. */
export type DbxConfigInput = DbxConfig | Promise<DbxConfig> | DbxConfigFunction;

/**
 * Identity helper that gives a config file full type-checking + autocomplete.
 * Mirrors Vite's `defineConfig`: the argument may be an object, a promise, or a
 * sync/async callback returning the config. The loader resolves it, so a config
 * can do async work before returning `{ toolchain }`.
 */
export function defineConfig(config: Promise<DbxConfig>): Promise<DbxConfig>;
export function defineConfig(config: DbxConfigFunction): DbxConfigFunction;
export function defineConfig(config: DbxConfig): DbxConfig;
export function defineConfig(config: DbxConfigInput): DbxConfigInput {
    return config;
}

/**
 * A config section that is enabled with `true`, disabled with `false`, or
 * configured with an options object.
 */
export type ToolchainSection<T> = boolean | T;

/**
 * Whether an optional top-level config section is enabled.
 *
 * Sections are **opt-in by presence**: a section only runs when it is defined
 * in `dbx.config.*` (and not explicitly disabled). A consumer can
 * enable a tooling area with the boolean shorthand (`biome: true`) when it needs
 * no options, or configure it with an object (`biome: { overrides: { ... } }`).
 * Either way the tooling never touches an area the consumer did not ask for.
 */
export function sectionEnabled(section: boolean | object | undefined): boolean {
    if (section === undefined) return false;
    if (typeof section === 'boolean') return section;
    return (section as { enabled?: boolean }).enabled !== false;
}

/**
 * The options object for a section (`undefined` when it is a boolean/absent).
 * Not every section declares `enabled` (eg. `providers`), so the constraint is
 * any object rather than `{ enabled?: boolean }`.
 */
export function sectionConfig<T extends object>(
    section: ToolchainSection<T> | undefined
): T | undefined {
    return section !== undefined && typeof section === 'object' ? section : undefined;
}

/** The file names a config loader looks for, in priority order. */
export const CONFIG_FILE_NAMES = [
    'dbx.config.ts',
    'dbx.config.mts',
    'dbx.config.js',
    'dbx.config.mjs',
    'dbx.config.cjs',
    'dbx.config.json',
] as const;

/** Derive the `owner/name` slug from a repository URL. */
export function repoSlugFromUrl(repo: string | undefined): string | undefined {
    if (!repo) return undefined;
    const match = repo.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/);
    return match?.[1] && match[2] ? `${match[1]}/${match[2]}` : undefined;
}

/** Normalize a `branches.main` / `branches.dev` value (`string | string[]`) to an array. */
function branchList(value: string | string[] | undefined): string[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

/**
 * The `ci` section's options, when the section is enabled. It is opt-in by
 * presence, and `enabled: false` disables every nested workflow.
 */
export function resolveCiConfig(config: ToolchainConfig = {}): ToolchainCiConfig | undefined {
    return sectionEnabled(config.ci) ? sectionConfig(config.ci) : undefined;
}

/**
 * The changelog pipeline options, merging the manual `toolchain.changelog`
 * section under `ci.changelog`. `ci.changelog` wins when it sets the same
 * option; when it is enabled but not configured (`true`, a raw workflow string,
 * or workflow-only options) the manual section's options still apply.
 */
export function resolveChangelogConfig(config: ToolchainConfig = {}): ChangelogConfig | undefined {
    const legacy = sectionConfig(config.changelog);
    const legacyOptions = legacy && sectionEnabled(legacy) ? legacy : undefined;
    const setting = resolveCiConfig(config)?.changelog;
    if (setting === undefined || setting === false || setting === true) return legacyOptions;
    if (typeof setting === 'string') return legacyOptions;
    if (!sectionEnabled(setting)) return legacyOptions;
    return legacyOptions ? (deepMerge(legacyOptions, setting) as ChangelogConfig) : setting;
}

/** Formatter tools, highest priority first. */
export const FORMATTER_PRECEDENCE = ['oxc', 'biome', 'prettier', 'dprint'] as const;
/** Linter tools, highest priority first. */
export const LINTER_PRECEDENCE = ['oxc', 'biome', 'eslint'] as const;

export type FormatterTool = (typeof FORMATTER_PRECEDENCE)[number];
export type LinterTool = (typeof LINTER_PRECEDENCE)[number];

function sectionOptions(value: unknown): Record<string, unknown> | undefined {
    return sectionEnabled(value as boolean | object | undefined)
        ? (sectionConfig(value as never) as Record<string, unknown> | undefined)
        : undefined;
}

/** The configured formatters, in precedence order (oxc includes `vite.fmt`). */
export function resolveFmtTools(config: ToolchainConfig = {}): FormatterTool[] {
    const fmt = sectionOptions(config.fmt) ?? {};
    const vite = sectionOptions(config.vite);
    const active = new Set<FormatterTool>();
    if (vite?.fmt !== undefined && vite.fmt !== false) active.add('oxc');
    if (fmt.oxc !== undefined && fmt.oxc !== false) active.add('oxc');
    if (fmt.biome !== undefined) active.add('biome');
    if (fmt.prettier !== undefined) active.add('prettier');
    if (fmt.dprint !== undefined) active.add('dprint');
    return FORMATTER_PRECEDENCE.filter(tool => active.has(tool));
}

/** The configured linters, in precedence order (oxc includes `vite.lint`). */
export function resolveLintTools(config: ToolchainConfig = {}): LinterTool[] {
    const lint = sectionOptions(config.lint) ?? {};
    const vite = sectionOptions(config.vite);
    const active = new Set<LinterTool>();
    if (vite?.lint !== undefined && vite.lint !== false) active.add('oxc');
    if (lint.oxc !== undefined && lint.oxc !== false) active.add('oxc');
    if (lint.biome !== undefined) active.add('biome');
    if (lint.eslint !== undefined) active.add('eslint');
    return LINTER_PRECEDENCE.filter(tool => active.has(tool));
}

/** The winning formatter for editor defaults. */
export function resolveFmtTool(config: ToolchainConfig = {}): FormatterTool | undefined {
    return resolveFmtTools(config)[0];
}

/** The winning linter for editor defaults. */
export function resolveLintTool(config: ToolchainConfig = {}): LinterTool | undefined {
    return resolveLintTools(config)[0];
}

/** Merge `vite.fmt` over `fmt.oxc` (leaves/arrays in `vite.fmt` win). */
export function resolveOxcFmtConfig(config: ToolchainConfig = {}): unknown {
    const fmt = sectionOptions(config.fmt)?.oxc;
    const vite = sectionOptions(config.vite)?.fmt;
    if (vite === undefined) return fmt;
    if (vite === false) return false;
    if (vite === true) return fmt ?? true;
    if (fmt === undefined) return vite;
    return isPlainObject(fmt) && isPlainObject(vite) ? deepMerge(fmt, vite) : vite;
}

/** Merge `vite.lint` over `lint.oxc` (leaves/arrays in `vite.lint` win). */
export function resolveOxcLintConfig(config: ToolchainConfig = {}): unknown {
    const lint = sectionOptions(config.lint)?.oxc;
    const vite = sectionOptions(config.vite)?.lint;
    if (vite === undefined) return lint;
    if (vite === false) return false;
    if (vite === true) return lint ?? true;
    if (lint === undefined) return vite;
    return isPlainObject(lint) && isPlainObject(vite) ? deepMerge(lint, vite) : vite;
}

/** Whether the changelog workflow/pipeline is enabled (`ci.changelog`). */
export function changelogSectionEnabled(config: ToolchainConfig = {}): boolean {
    const setting = resolveCiConfig(config)?.changelog;
    if (setting === undefined) return false;
    if (typeof setting === 'boolean') return setting;
    // A raw YAML string is enabled when it has content (an empty string disables it).
    if (typeof setting === 'string') return setting.trim().length > 0;
    return sectionEnabled(setting);
}

/**
 * Whether commitlint is enabled for the changelog pipeline. It defaults to
 * `true`; set `ci.changelog.commitlint: false` (or `{ enabled: false }`) to
 * generate changelogs without the Conventional-Commits rules.
 */
export function resolveCommitlintEnabled(changelog?: ChangelogConfig): boolean {
    const commitlint = changelog?.commitlint;
    if (commitlint === undefined) return true;
    if (typeof commitlint === 'boolean') return commitlint;
    return commitlint.enabled !== false;
}

/**
 * The resolved changelog branches. `main` defaults to `['main']`; `dev` has **no
 * default** and reuses `main` when omitted, so a single-branch repo needs no
 * `dev`. Each side accepts a glob or an array of globs.
 */
export function resolveChangelogBranches(changelog?: ChangelogConfig): {
    main: string[];
    dev: string[];
} {
    const branches = changelog?.branches ?? {};
    const main = branchList(branches.main);
    if (main.length === 0) main.push('main');
    const dev = branchList(branches.dev);
    return { main, dev: dev.length > 0 ? dev : main };
}

/**
 * Flatten a {@link ToolchainConfig} into the `{{ token }}` replacements every
 * template understands. Defaults are chosen so a bare config still renders.
 */
export function resolveTokens(config: ToolchainConfig = {}): Replacements {
    const project = config.project ?? {};
    const changelog = resolveChangelogConfig(config) ?? {};
    const branches = resolveChangelogBranches(changelog);
    const name = project.name ?? 'app';
    return {
        name,
        scope: project.scope ?? '',
        author: project.author ?? '',
        license: project.license ?? 'MIT',
        homepage: project.homepage ?? '',
        repo: project.repo ?? '',
        repoSlug: repoSlugFromUrl(project.repo) ?? '',
        description: project.description ?? '',
        nodeVersion: project.nodeVersion ?? '22',
        packageManager: project.packageManager ?? 'yarn',
        yarnVersion: project.packageManagerVersion ?? '4.17.1',
        packageManagerVersion: project.packageManagerVersion ?? '4.17.1',
        mainBranch: branches.main[0] ?? 'main',
        devBranch: branches.dev[0] ?? 'main',
    };
}

/** A file written by a sync task (its parent directory is created as needed). */
export interface ManagedFile {
    /** Path relative to the project root. */
    path: string;
    /** The file content. */
    content: string;
    /**
     * A comment inserted at the top marking the file as managed (skipped for
     * JSON files, which are tracked via the manifest instead).
     */
    header?: string;
}

/** The context handed to every {@link SyncTask}. */
export interface SyncContext {
    /** The project root. */
    cwd: string;
    /** The detected/configured project kind. */
    projectType: ProjectType;
    /** The loaded config. */
    config: ToolchainConfig;
    /** The project's own (unmerged) config, when loaded. */
    ownConfig?: ToolchainConfig;
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** Log a line (respects `--quiet`). */
    log: (message: string) => void;
    /** Emit a warning (respects `--quiet` and `logger.suppress`). */
    warn: (message: string, id?: string) => void;
}

/** A unit of sync work exposed by a package. */
export interface SyncTask {
    /** Stable id, used in logs + the manifest. */
    name: string;
    /**
     * Repo-relative globs to watch; a change re-runs this task. The config file
     * itself is always watched, and re-runs every task.
     */
    watch?: string[];
    /**
     * File names/suffixes the task does **not** own but that may appear in an
     * older manifest. They are never deleted (even though they are no longer
     * generated) and are dropped from the manifest, so a consumer can edit them
     * freely — eg. `tsconfig.build.json`.
     */
    keep?: string[];
    /** Whether the task runs for the given config (default: always). */
    enabled?: (config: ToolchainConfig) => boolean;
    /**
     * The project kinds the task applies to (default: all). A task is skipped
     * when the resolved project type is not in this list.
     */
    projectTypes?: ProjectType[];
    /**
     * Run the task. Returns the managed files to write, and/or performs side
     * effects directly (eg. the tsconfig task regenerates files itself).
     */
    run: (ctx: SyncContext) => Awaitable<ManagedFile[] | void>;
}
