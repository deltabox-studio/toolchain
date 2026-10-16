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

import type { ProjectType, ToolingConfigSections } from './config-types.js';
import type { Replacements } from './template.js';
import type { Awaitable } from './types.js';

export * from './config-schema.js';
export * from './config-types.js';

/** A summary of a sync run, handed to {@link ToolingHooks.afterSync}. */
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
export interface ToolingHooks {
    /** Runs after the config is loaded + tokens resolved. */
    afterLoad?: (info: {
        cwd: string;
        config: ToolingConfig;
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
        config: ToolingConfig;
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
export type ToolingConfig = ToolingConfigSections & { hooks?: ToolingHooks };

/**
 * The root shape of a `dbx.config.*` file. The `@deltabox/toolchain` settings
 * live under the `toolchain` key, so `dbx.config` can host other dbx concerns
 * alongside it.
 */
export interface DbxConfig {
    toolchain?: ToolingConfig;
}

/**
 * Identity helper that gives a config file full type-checking + autocomplete.
 * Mirrors Vite's `defineConfig`: `export default defineConfig({ toolchain: { ... } })`.
 */
export function defineConfig(config: DbxConfig): DbxConfig {
    return config;
}

/**
 * A config section that is enabled with `true`, disabled with `false`, or
 * configured with an options object.
 */
export type ToolingSection<T> = boolean | T;

/**
 * Whether an optional top-level config section is enabled.
 *
 * Sections are **opt-in by presence**: a section only runs when it is defined
 * in `dbx.config.*` (and not explicitly disabled). A consumer can
 * enable a tooling area with the boolean shorthand (`biome: true`) when it needs
 * no options, or configure it with an object (`biome: { overrides: { ... } }`).
 * Either way the tooling never touches an area the consumer did not ask for.
 */
export function sectionEnabled(
    section: ToolingSection<{ enabled?: boolean }> | undefined
): boolean {
    if (section === undefined) return false;
    if (typeof section === 'boolean') return section;
    return section.enabled !== false;
}

/**
 * The options object for a section (`undefined` when it is a boolean/absent).
 * Not every section declares `enabled` (eg. `providers`), so the constraint is
 * any object rather than `{ enabled?: boolean }`.
 */
export function sectionConfig<T extends object>(
    section: ToolingSection<T> | undefined
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

/**
 * Flatten a {@link ToolingConfig} into the `{{ token }}` replacements every
 * template understands. Defaults are chosen so a bare config still renders.
 */
export function resolveTokens(config: ToolingConfig = {}): Replacements {
    const project = config.project ?? {};
    const changelog = sectionConfig(config.changelog) ?? {};
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
        mainBranch: changelog.branches?.main ?? 'main',
        devBranch: changelog.branches?.dev ?? 'dev',
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
    config: ToolingConfig;
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** Log a line (respects `--quiet`). */
    log: (message: string) => void;
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
    enabled?: (config: ToolingConfig) => boolean;
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
