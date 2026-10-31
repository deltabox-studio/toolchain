/**
 * `resolveVite` — the runtime half of the generated `vite.config.ts` shim.
 *
 * `dbx sync` writes a `vite.config.ts` that calls `resolveVite(...)`, so the
 * whole Vite+ config stays in `dbx.config.*`'s `toolchain.vite` and the generated
 * file never drifts (it is a fixed, one-line shim). Pass a loaded `dbxConfig` to
 * skip the lookup; otherwise the nearest `dbx.config.*` (from `cwd`) is loaded —
 * and a missing one throws rather than silently producing an empty config.
 */

import type { ViteUserConfig } from 'vite-plus';

import { loadToolchainConfig } from '@deltabox/toolchain-core';
import {
    applyReplacementsDeep,
    type DbxConfig,
    deepMerge,
    resolveTokens,
    sectionConfig,
    type ToolchainConfig,
    type ToolchainConfigSections,
} from '@deltabox/toolchain-shared';

import { viteConfigObject } from './sync.js';

/**
 * The options `resolveVite` accepts. `vite` supplies the config inline (merged
 * over the loaded `toolchain.vite` as overrides); `cwd` selects the
 * `dbx.config.*` to look up.
 */
export interface ResolveViteOptions extends Pick<ToolchainConfigSections, 'vite'> {
    /** Project root to look for `dbx.config.*` in (default: `process.cwd()`). */
    cwd?: string;
}

/**
 * The single object `resolveVite` accepts: a loaded `dbx.config` (to skip the
 * lookup), inline `vite` overrides, and/or the `cwd` to look one up in.
 */
export type ResolveViteInput = DbxConfig & ResolveViteOptions;

/**
 * Resolve the Vite+ config from `dbx.config.*`'s `toolchain.vite`.
 *
 * Returns a promise (the config file is imported asynchronously). Vite awaits a
 * config's default export, so `export default defineConfig(resolveVite(...))`
 * works — the promise is resolved before the config is used.
 *
 * The generic `T` lets the generated shim pick the config type of whichever
 * package it imports `defineConfig` from (`vite` or `vite-plus`), so the same
 * resolver works with both; it defaults to `vite-plus`'s type for direct use.
 */
export async function resolveVite<T extends object = ViteUserConfig>(
    options: ResolveViteInput = {}
): Promise<T> {
    const { cwd, vite: viteOverride, ...dbxConfig } = options;
    let toolchain: ToolchainConfig;
    if (Object.keys(dbxConfig).length > 0) {
        toolchain = (dbxConfig as DbxConfig).toolchain ?? {};
    } else {
        const loaded = await loadToolchainConfig(cwd ?? process.cwd());
        if (!loaded.path) {
            throw new Error(
                'resolveVite: no dbx.config.* found — create one, or pass a config to resolveVite().'
            );
        }
        toolchain = loaded.config;
    }
    const baseVite = sectionConfig(toolchain.vite) ?? {};
    const vite =
        viteOverride === undefined
            ? baseVite
            : deepMerge(baseVite, sectionConfig(viteOverride) ?? {});
    return applyReplacementsDeep(viteConfigObject(vite), resolveTokens(toolchain)) as T;
}
