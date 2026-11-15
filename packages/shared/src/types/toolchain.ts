import type { ToolchainConfigSections } from '../config-types.js';
import type { Replacements } from '../template.js';
import type { Awaitable } from './common.js';
import type { ManagedFile, SyncContext, SyncSummary, SyncTask } from './sync.js';

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
 * A config section that is enabled with `true`, disabled with `false`, or
 * configured with an options object.
 */
export type ToolchainSection<T> = boolean | T;

/** Where a `toolchain.enabled` value applies. */
export type ToolchainEnabledScope = 'global' | 'workspace';

/** A normalized `toolchain.enabled` value. */
export interface ResolvedToolchainEnabled {
    enabled: boolean;
    scope: ToolchainEnabledScope;
}

/** The object form of the top-level `enabled` setting. */
export interface ToolchainEnabledSetting {
    disabled?: boolean;
    scope: ToolchainEnabledScope;
}
