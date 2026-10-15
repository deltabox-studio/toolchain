import {
    applyReplacementsDeep,
    isPlainObject,
    type Replacements,
    type SyncTask,
    sectionConfig,
    sectionEnabled,
} from '@deltabox/toolchain-shared';

import biomeConfigJson from './config.json' with { type: 'json' };
import vscodeSettingsJson from './vscode-settings.json' with { type: 'json' };

/** The generic Biome configuration (with `{{name}}` / `{{scope}}` tokens). */
export const biomeConfig: Record<string, unknown> = biomeConfigJson;

/** The recommended Biome VS Code settings. */
export const biomeVscodeSettings: Record<string, unknown> = vscodeSettingsJson;

/**
 * Merge an override over a base config: object keys merge recursively and
 * arrays are unioned (so `files.includes` can be extended, not replaced).
 */
export function mergeBiomeConfig(base: unknown, patch: unknown): unknown {
    if (Array.isArray(base) && Array.isArray(patch)) {
        return [...new Set([...base, ...patch])];
    }
    if (isPlainObject(base) && isPlainObject(patch)) {
        const out: Record<string, unknown> = { ...base };
        for (const [key, value] of Object.entries(patch)) {
            out[key] = key in out ? mergeBiomeConfig(out[key], value) : value;
        }
        return out;
    }
    return patch;
}

/**
 * Render the Biome config for a project by resolving its replacement tokens
 * (`{{name}}` = unscoped project name, `{{scope}}` = npm scope, eg. `@acme`)
 * and merging the consumer's `overrides` over the defaults.
 */
export function renderBiomeConfig(
    replacements: Replacements = {},
    overrides: Record<string, unknown> = {}
): Record<string, unknown> {
    const base = applyReplacementsDeep(biomeConfig, replacements);
    const patch = applyReplacementsDeep(overrides, replacements);
    return mergeBiomeConfig(base, patch) as Record<string, unknown>;
}

/** Serialize the rendered Biome config to JSON text. */
export function renderBiomeJson(
    replacements: Replacements = {},
    overrides: Record<string, unknown> = {},
    indent = 4
): string {
    return `${JSON.stringify(renderBiomeConfig(replacements, overrides), null, indent)}\n`;
}

/** Serialize the recommended VS Code settings to JSON text. */
export function renderVscodeSettings(indent = 4): string {
    return `${JSON.stringify(biomeVscodeSettings, null, indent)}\n`;
}

/**
 * The biome sync task: writes `biome.json` from the generic config, resolving
 * the `{{name}}` / `{{scope}}` tokens and merging `config.biome.overrides`.
 */
export function biomeSyncTask(): SyncTask {
    return {
        name: 'biome',
        projectTypes: ['monorepo-root', 'monorepo-workspace', 'project'],
        enabled: config => sectionEnabled(config.biome),
        run: ctx => [
            {
                path: 'biome.json',
                content: renderBiomeJson(
                    ctx.tokens,
                    sectionConfig(ctx.config.biome)?.overrides ?? {}
                ),
            },
        ],
    };
}
