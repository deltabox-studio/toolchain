/**
 * The `dbx()` Vite/Vite+ plugin contract.
 *
 * The plugin can carry the whole toolchain config inline (`dbx({ toolchain })`),
 * so a Vite project does not need a `dbx.config.*` at all. The plugin marks
 * itself with a shared symbol and the config loader reads that marker back by
 * importing the `vite.config.*` module — no Vite APIs are required, and
 * functions/hooks in the config survive because the real module is evaluated.
 */

import type { ToolchainConfigSections } from './config-types.js';

/** The Vite plugin name `dbx()` registers. */
export const DBX_PLUGIN_NAME = 'deltabox-toolchain';

/**
 * The marker property on a `dbx()` plugin. `Symbol.for` keeps the identity even
 * when the plugin and the loader are loaded from different module graphs.
 */
export const DBX_PLUGIN_SYMBOL = Symbol.for('@deltabox/toolchain/vite-plugin');

/** The config the plugin carries (the `vite` section is deliberately omitted). */
export type DbxPluginToolchain = Omit<ToolchainConfigSections, 'vite'>;

/** The data a `dbx()` plugin hands back to the CLI/loader. */
export interface DbxPluginDescriptor {
    /** The inline toolchain config (never contains a `vite` section). */
    toolchain: DbxPluginToolchain;
    /** The project root the plugin was configured for. */
    cwd?: string;
    /** Run `dbx sync` before dev/build. */
    sync?: boolean;
    /** Run `dbx sync --check` and fail when generated files are stale. */
    check?: boolean;
    /** Re-sync on watched changes. */
    watch?: boolean;
    /** Debounce (ms) for watch-triggered syncs. */
    debounce?: number;
}

/** A structural view of a plugin that may be a `dbx()` instance. */
export interface DbxPluginLike {
    name?: string;
    [DBX_PLUGIN_SYMBOL]?: DbxPluginDescriptor;
}

/** Whether `value` is a `dbx()` plugin instance. */
export function isDbxPlugin(value: unknown): value is DbxPluginLike {
    return (
        Boolean(value) &&
        typeof value === 'object' &&
        DBX_PLUGIN_SYMBOL in (value as Record<symbol, unknown>)
    );
}

/** The descriptor a `dbx()` plugin carries, if any. */
export function dbxPluginDescriptor(value: unknown): DbxPluginDescriptor | undefined {
    return isDbxPlugin(value) ? value[DBX_PLUGIN_SYMBOL] : undefined;
}

/**
 * Every `dbx()` descriptor in a resolved Vite config (nested plugin arrays are
 * flattened, promises are ignored because the loader resolves the config first).
 */
export function collectDbxPluginDescriptors(config: unknown): DbxPluginDescriptor[] {
    const plugins =
        config && typeof config === 'object'
            ? (config as { plugins?: unknown }).plugins
            : undefined;
    const out: DbxPluginDescriptor[] = [];
    const visit = (value: unknown): void => {
        if (Array.isArray(value)) {
            for (const item of value) visit(item);
            return;
        }
        const descriptor = dbxPluginDescriptor(value);
        if (descriptor) out.push(descriptor);
    };
    visit(plugins);
    return out;
}
