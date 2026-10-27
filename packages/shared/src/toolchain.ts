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
 * The `ci.changelog` pipeline config, when enabled. `ci.changelog` may be a
 * boolean or a raw workflow string, in which case there are no extra options and
 * this returns `undefined`.
 */
export function resolveChangelogConfig(config: ToolchainConfig = {}): ChangelogConfig | undefined {
    const setting = resolveCiConfig(config)?.changelog;
    return setting !== undefined && typeof setting === 'object' ? setting : undefined;
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
 * A migration error for a config that still uses a deprecated shape. The legacy
 * shape stays in the schema so older configs still type-check, but the loader
 * refuses to run it so a consumer cannot silently keep using it.
 */
export function deprecatedConfigMessage(config: ToolchainConfig = {}): string | undefined {
    if (config.changelog === undefined) return undefined;
    return (
        '`toolchain.changelog` is deprecated: move the changelog pipeline to ' +
        '`toolchain.ci.changelog` and its generated workflows to the top-level ' +
        '`toolchain.ci` section (eg. `ci: { ci: true, changelog: true, release: true }`).'
    );
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
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** Log a line (respects `--quiet`). */
    log: (message: string) => void;
    /** Emit a warning (respects `--quiet`, which suppresses warnings too). */
    warn: (message: string) => void;
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
