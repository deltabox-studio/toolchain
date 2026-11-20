/** Discovery defaults and option normalization shared by the loader modules. */

import path from 'node:path';

import type { ConfigSchema } from '../types/index.js';
import type {
    ConfigParentSearch,
    LoadConfigFileOptions,
    LoadConfigOptions,
} from '../types/loader.js';

/**
 * The config files the loader looks for, in priority order. These are neutral
 * (`config.*`); an application such as `dbx` passes `names` or
 * `configFileOptions.filename` for its own filename.
 */
export const DEFAULT_CONFIG_NAMES = [
    'config.ts',
    'config.mts',
    'config.cts',
    'config.js',
    'config.mjs',
    'config.cjs',
    'config.json',
] as const;

/** The directories the loader checks, relative to `cwd`, in priority order. */
export const DEFAULT_CONFIG_LOCATIONS = ['.', 'config', 'configs'] as const;

/** The default extension allow-list for `configFileOptions`. */
export const DEFAULT_CONFIG_EXTENSIONS = [
    '.js',
    '.cjs',
    '.mjs',
    '.ts',
    '.cts',
    '.mts',
    '.yaml',
    '.yml',
    '.json',
] as const;

/** Any input the object/parser loader APIs accept. */
export type AnyLoadInput =
    | LoadConfigFileOptions<ConfigSchema, Record<string, any>>
    | LoadConfigOptions<unknown>;

/** Fully resolved discovery settings. */
export interface ResolvedConfigFileOptions {
    required: boolean;
    followSymlinks: boolean;
    names: readonly string[];
    locations: Array<{ cwd?: string; path: string | string[] }>;
    packageJsonKeys?: readonly string[];
    allowedExtensions?: readonly string[];
    tsconfig?: string | false;
    parent?: ConfigParentSearch;
    accept?: (file: string) => boolean;
}

/** Normalize `parent` into a search descriptor. */
function normalizeParent(
    parent: boolean | ConfigParentSearch | undefined
): ConfigParentSearch | undefined {
    if (!parent) return undefined;
    return parent === true ? { stopAtRepoRoot: true } : parent;
}

/**
 * Strip a trailing config extension from a `filename` option while preserving
 * dots in the base name (`dbx.config` -> `dbx.config`, `custom.config.ts` ->
 * `custom.config`).
 */
function stripConfigExtension(filename: string, allowed: readonly string[]): string {
    const known = [...new Set([...allowed, ...DEFAULT_CONFIG_EXTENSIONS])]
        .map(extension => extension.toLowerCase())
        .sort((a, b) => b.length - a.length);
    const lower = filename.toLowerCase();
    const match = known.find(extension => lower.endsWith(extension));
    return match ? filename.slice(0, -match.length) : filename;
}

/**
 * Resolve discovery options from either the parser-based
 * (``configFileOptions``) or object-based API.
 */
export function normalizeConfigFileOptions(options: AnyLoadInput): ResolvedConfigFileOptions {
    const legacy = options as LoadConfigOptions<unknown>;
    const file = (options as LoadConfigFileOptions).configFileOptions;
    if (!file) {
        const parent = normalizeParent(legacy.parent);
        return {
            required: legacy.required === true,
            followSymlinks: legacy.followSymlinks ?? true,
            names: legacy.names ?? DEFAULT_CONFIG_NAMES,
            locations: (legacy.locations ?? DEFAULT_CONFIG_LOCATIONS).map(location => ({
                path: location,
            })),
            ...(legacy.packageJsonKeys ? { packageJsonKeys: legacy.packageJsonKeys } : {}),
            ...(legacy.tsconfig !== undefined ? { tsconfig: legacy.tsconfig } : {}),
            ...(parent ? { parent } : {}),
            ...(legacy.accept ? { accept: legacy.accept } : {}),
        };
    }
    if (typeof file.filename !== 'string' || file.filename.trim() === '') {
        throw new Error('`configFileOptions.filename` must be a non-empty string.');
    }
    const allowed = (file.allowedFileExtensions ?? [...DEFAULT_CONFIG_EXTENSIONS]).map(
        extension => {
            const normalized = extension.toLowerCase();
            return normalized.startsWith('.') ? normalized : `.${normalized}`;
        }
    );
    const filename = stripConfigExtension(file.filename, allowed);
    const names = allowed.map(extension => `${filename}${extension}`);
    const locations = file.commonLocation
        ? Array.isArray(file.commonLocation)
            ? file.commonLocation
            : [file.commonLocation]
        : DEFAULT_CONFIG_LOCATIONS.map(location => ({ path: location }));
    const packageJsonKey =
        file.packageJson && file.packageJson.enabled !== false ? [file.packageJson.key] : undefined;
    const parent = normalizeParent(file.parent);
    return {
        required: file.required === true,
        followSymlinks: file.followSymlinks ?? true,
        names,
        locations,
        ...(packageJsonKey ? { packageJsonKeys: packageJsonKey } : {}),
        ...(file.allowedFileExtensions ? { allowedExtensions: allowed } : {}),
        ...(file.tsconfig !== undefined ? { tsconfig: file.tsconfig } : {}),
        ...(parent ? { parent } : {}),
        ...(file.accept ? { accept: file.accept } : {}),
    };
}

/** Resolve a relative tsconfig setting against the load root. */
export function resolveTsconfigSetting(
    tsconfig: string | false | undefined,
    rootCwd: string
): string | false | undefined {
    if (tsconfig === undefined || tsconfig === false) return tsconfig;
    const value: unknown = tsconfig;
    if (typeof value !== 'string') {
        throw new TypeError(
            `Invalid \`tsconfig\` option: expected a path string or \`false\`, received ${typeof value}.`
        );
    }
    return path.resolve(rootCwd, value);
}

/** Normalize an `accept` filter into a predicate. */
export function acceptFile(resolved: ResolvedConfigFileOptions, file: string): boolean {
    return resolved.accept ? resolved.accept(file) : true;
}
