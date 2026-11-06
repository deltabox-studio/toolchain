import {
    applyReplacementsDeep,
    isPlainObject,
    type Replacements,
    type SyncTask,
    type ToolchainConfig,
    sectionConfig,
    sectionEnabled,
} from '@deltabox/toolchain/shared';

import biomeConfigJson from './config.json' with { type: 'json' };
import vscodeSettingsJson from './vscode-settings.json' with { type: 'json' };

/** The generic Biome configuration (with `{{name}}` / `{{scope}}` tokens). */
export const biomeConfig = biomeConfigJson;

/** The recommended Biome VS Code settings. */
export const biomeVscodeSettings = vscodeSettingsJson;

/**
 * Array directive that removes an entry from the base array during the merge.
 * The value after the prefix is JSON (or a raw string when it is not valid
 * JSON), so nested groups can be targeted with `$remove:["a","b"]`.
 */
export const BIOME_REMOVE_PREFIX = '$remove:';

/** Array directive that drops the base array before the patch entries are added. */
export const BIOME_RESET = '$reset';

/** Build the directive that removes `entry` from the default array. */
export function removeBiomeEntry(entry: unknown): string {
    return `${BIOME_REMOVE_PREFIX}${JSON.stringify(entry)}`;
}

function parseBiomeRemoval(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}

function sameBiomeEntry(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((entry, index) => sameBiomeEntry(entry, b[index]));
    }
    if (isPlainObject(a) && isPlainObject(b)) {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        return (
            aKeys.length === bKeys.length &&
            aKeys.every(key => key in b && sameBiomeEntry(a[key], b[key]))
        );
    }
    return false;
}

/**
 * Resolve the array directives in `patch` against `base`: `$remove:` entries
 * prune matching base entries, `$reset` drops the base array, and the remaining
 * entries are unioned on top. Directives never appear in the result.
 */
export function resolveBiomeArray(base: readonly unknown[], patch: readonly unknown[]): unknown[] {
    const removals: unknown[] = [];
    const additions: unknown[] = [];
    let reset = false;
    for (const entry of patch) {
        if (entry === BIOME_RESET) {
            reset = true;
        } else if (typeof entry === 'string' && entry.startsWith(BIOME_REMOVE_PREFIX)) {
            removals.push(parseBiomeRemoval(entry.slice(BIOME_REMOVE_PREFIX.length)));
        } else {
            additions.push(entry);
        }
    }
    const kept = (reset ? [] : base).filter(
        entry => !removals.some(target => sameBiomeEntry(entry, target))
    );
    return [...new Set([...kept, ...additions])];
}

/**
 * Merge an override over a base config: object keys merge recursively and
 * arrays are unioned, with `$remove:` / `$reset` directives resolved first so
 * defaults can be pruned or replaced (see {@link resolveBiomeArray}).
 */
export function mergeBiomeConfig(base: unknown, patch: unknown): unknown {
    if (Array.isArray(patch)) {
        return resolveBiomeArray(Array.isArray(base) ? base : [], patch);
    }
    if (isPlainObject(patch)) {
        const out: Record<string, unknown> = isPlainObject(base) ? { ...base } : {};
        for (const [key, value] of Object.entries(patch)) {
            out[key] = mergeBiomeConfig(out[key], value);
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
 * and merging the consumer's `overrides` over the defaults. Pass several
 * patches to apply them in order (later patches see earlier results).
 */
export function renderBiomeConfig(
    replacements: Replacements = {},
    overrides: Record<string, unknown> | Record<string, unknown>[] = {}
): Record<string, unknown> {
    let out = applyReplacementsDeep(
        withoutUnscopedGroups(biomeConfig, replacements) as Record<string, unknown>,
        replacements
    ) as Record<string, unknown>;
    const patches = Array.isArray(overrides) ? overrides : [overrides];
    for (const patch of patches) {
        const resolved = applyReplacementsDeep(
            withoutUnscopedGroups(patch, replacements) as Record<string, unknown>,
            replacements
        ) as Record<string, unknown>;
        out = mergeBiomeConfig(out, resolved) as Record<string, unknown>;
    }
    return out;
}

/** Serialize the rendered Biome config to JSON text. */
export function renderBiomeJson(
    replacements: Replacements = {},
    overrides: Record<string, unknown> | Record<string, unknown>[] = {},
    indent = 4
): string {
    return `${JSON.stringify(renderBiomeConfig(replacements, overrides), null, indent)}\n`;
}

/** Serialize the recommended VS Code settings to JSON text. */
export function renderVscodeSettings(indent = 4): string {
    return `${JSON.stringify(biomeVscodeSettings, null, indent)}\n`;
}

/**
 * Collect the deprecated `biome.overrides` and `fmt.biome` / `lint.biome` as an
 * ordered patch list, so each one is resolved against the previous result.
 */
function biomeOverrides(config: ToolchainConfig): Record<string, unknown>[] {
    const patches: Record<string, unknown>[] = [];
    const biome = sectionEnabled(config.biome) ? sectionConfig(config.biome) : undefined;
    const fmt = sectionEnabled(config.fmt) ? sectionConfig(config.fmt)?.biome : undefined;
    const lint = sectionEnabled(config.lint) ? sectionConfig(config.lint)?.biome : undefined;
    if (isPlainObject(biome?.overrides)) patches.push(biome.overrides);
    if (isPlainObject(fmt)) patches.push(fmt);
    if (isPlainObject(lint)) patches.push(lint);
    return patches;
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
