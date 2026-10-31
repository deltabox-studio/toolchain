import {
    applyReplacementsDeep,
    isPlainObject,
    type Replacements,
    type SyncTask,
    type ToolchainConfig,
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

/** Scope-only import groups (eg. `@acme/**`) have no meaning without a scope. */
function withoutUnscopedGroups(value: unknown, replacements: Replacements): unknown {
    if (replacements.scope) return value;
    if (Array.isArray(value)) {
        return value
            .filter(
                entry =>
                    entry !== '{{scope}}' && entry !== '{{scope}}/**' && entry !== '!{{scope}}/**'
            )
            .map(entry => withoutUnscopedGroups(entry, replacements));
    }
    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([key, entry]) => [
                key,
                withoutUnscopedGroups(entry, replacements),
            ])
        );
    }
    return value;
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
    const base = applyReplacementsDeep(
        withoutUnscopedGroups(biomeConfig, replacements) as Record<string, unknown>,
        replacements
    );
    const patch = applyReplacementsDeep(
        withoutUnscopedGroups(overrides, replacements) as Record<string, unknown>,
        replacements
    );
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

/** Merge the deprecated `biome.overrides` with `fmt.biome` / `lint.biome`. */
function biomeOverrides(config: ToolchainConfig): Record<string, unknown> {
    const biome = sectionEnabled(config.biome) ? sectionConfig(config.biome) : undefined;
    let out = (biome?.overrides ?? {}) as Record<string, unknown>;
    const fmt = sectionEnabled(config.fmt) ? sectionConfig(config.fmt)?.biome : undefined;
    const lint = sectionEnabled(config.lint) ? sectionConfig(config.lint)?.biome : undefined;
    if (isPlainObject(fmt)) {
        out = mergeBiomeConfig(out, fmt) as Record<string, unknown>;
    }
    if (isPlainObject(lint)) {
        out = mergeBiomeConfig(out, lint) as Record<string, unknown>;
    }
    return out;
}

/**
 * The biome sync task: writes `biome.json` from the generic config, resolving
 * the `{{name}}` / `{{scope}}` tokens and merging `config.biome.overrides` /
 * `fmt.biome` / `lint.biome`.
 */
export function biomeSyncTask(): SyncTask {
    return {
        name: 'biome',
        projectTypes: ['monorepo-root', 'monorepo-workspace', 'project'],
        enabled: config => {
            const fmt = sectionEnabled(config.fmt) ? sectionConfig(config.fmt) : undefined;
            const lint = sectionEnabled(config.lint) ? sectionConfig(config.lint) : undefined;
            return (
                sectionEnabled(config.biome) ||
                (fmt?.biome !== undefined && fmt.biome !== false) ||
                (lint?.biome !== undefined && lint.biome !== false)
            );
        },
        run: ctx => {
            const fmt = sectionEnabled(ctx.config.fmt) ? sectionConfig(ctx.config.fmt) : undefined;
            const lint = sectionEnabled(ctx.config.lint)
                ? sectionConfig(ctx.config.lint)
                : undefined;
            if (
                !sectionEnabled(ctx.config.biome) &&
                (fmt?.biome === undefined || fmt.biome === false) &&
                (lint?.biome === undefined || lint.biome === false)
            ) {
                return [];
            }
            return [
                {
                    path: 'biome.json',
                    content: renderBiomeJson(ctx.tokens, biomeOverrides(ctx.config)),
                },
            ];
        },
    };
}
