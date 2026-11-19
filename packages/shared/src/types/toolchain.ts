import type { ToolchainConfigSections } from '../config-types.js';

/**
 * The complete tooling configuration a consumer declares (under
 * `dbx.toolchain`).
 *
 * Every section is **opt-in by presence** (see {@link sectionEnabled}): define a
 * section to enable it; omit it to leave that area untouched. Within a defined
 * section, `enabled: false` disables it explicitly. Lifecycle `hooks` are
 * generated from the function schemas in `config-schema/hooks.ts`.
 */
export type ToolchainConfig = ToolchainConfigSections;

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
