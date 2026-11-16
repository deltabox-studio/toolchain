/**
 * Config-file discovery and loading.
 *
 * The loader is deliberately small and dependency-free: it finds a config by
 * name in a list of common locations, falls back to a `package.json` key, and
 * imports it natively (JSON, CJS/ESM). TypeScript needs `loadConfigAsync` (or a
 * custom `loader`) because Node cannot `require` a `.ts` file synchronously.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { ZodType } from 'zod';

/** The config files the loader looks for, in priority order. */
export const DEFAULT_CONFIG_NAMES = [
    'dbx.config.ts',
    'dbx.config.mts',
    'dbx.config.cts',
    'dbx.config.js',
    'dbx.config.mjs',
    'dbx.config.cjs',
    'dbx.config.json',
] as const;

/** The directories the loader checks, relative to `cwd`, in priority order. */
export const DEFAULT_CONFIG_LOCATIONS = ['.', 'config', 'configs'] as const;

/** Where a resolved config came from. */
export type ConfigSourceKind = 'file' | 'package.json' | 'none';

/** A loaded config plus its origin. */
export interface LoadedConfig<T = unknown> {
    /** The config value (validated when a schema was provided). */
    config: T;
    /** The absolute config file (or the `package.json`). */
    path?: string;
    /** The source kind. */
    source: ConfigSourceKind;
    /** The `package.json` key that held the config, when `source` is that. */
    key?: string;
}

/** Options for the loaders. */
export interface LoadConfigOptions<T = unknown> {
    /** The directory to search from (default `process.cwd()`). */
    cwd?: string;
    /** Config file names to try, in order. */
    names?: readonly string[];
    /** Directories to search, relative to `cwd`. */
    locations?: readonly string[];
    /** `package.json` keys to try (eg. `['toolchain']`); omit to skip. */
    packageJsonKeys?: readonly string[];
    /** Throw instead of returning `undefined` when nothing is found. */
    required?: boolean;
    /** Validate/normalize the loaded value. */
    schema?: ZodType<T>;
    /** A custom module loader (eg. `tsx`, `jiti`) for TS configs. */
    loader?: (file: string) => unknown | Promise<unknown>;
    /** Re-evaluate an already-imported module (watch/regenerate runs). */
    fresh?: boolean;
}

function validate<T>(schema: ZodType<T> | undefined, value: unknown): T {
    return schema ? schema.parse(value) : (value as T);
}

function realpath(file: string, resolveSymlinks: boolean): string {
    if (!resolveSymlinks) return file;
    try {
        return fs.realpathSync(file);
    } catch {
        return file;
    }
}

function readPackageJsonConfig(
    dir: string,
    keys: readonly string[] | undefined
): { value: unknown; key: string; file: string } | undefined {
    if (!keys || keys.length === 0) return undefined;
    const file = path.join(dir, 'package.json');
    if (!fs.existsSync(file)) return undefined;
    try {
        const pkg = JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '')) as Record<
            string,
            unknown
        >;
        for (const key of keys) {
            if (pkg[key] !== undefined) return { value: pkg[key], key, file };
        }
    } catch {
        // A malformed package.json is not a config candidate.
    }
    return undefined;
}

interface Candidate {
    file: string;
    value?: unknown;
    key?: string;
    kind: 'file' | 'package.json';
}

/** Every candidate in priority order (config files, then package.json, per location). */
function findCandidates(options: LoadConfigOptions): Candidate[] {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const names = options.names ?? DEFAULT_CONFIG_NAMES;
    const locations = options.locations ?? DEFAULT_CONFIG_LOCATIONS;
    const out: Candidate[] = [];
    for (const location of locations) {
        const dir = path.resolve(cwd, location);
        for (const name of names) {
            const file = realpath(path.join(dir, name), true);
            if (fs.existsSync(file)) out.push({ file, kind: 'file' });
        }
        const pkg = readPackageJsonConfig(dir, options.packageJsonKeys);
        if (pkg) out.push({ file: pkg.file, value: pkg.value, key: pkg.key, kind: 'package.json' });
    }
    return out;
}

function findCandidate(options: LoadConfigOptions): Candidate | undefined {
    return findCandidates(options)[0];
}

function isPromise(value: unknown): value is Promise<unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { then?: unknown }).then === 'function'
    );
}

function loaded<T>(
    options: LoadConfigOptions<T>,
    candidate: Candidate,
    value: unknown
): LoadedConfig<T> {
    if (candidate.kind === 'package.json') {
        return {
            config: validate(options.schema, value),
            path: candidate.file,
            source: 'package.json',
            ...(candidate.key ? { key: candidate.key } : {}),
        };
    }
    return { config: validate(options.schema, value), path: candidate.file, source: 'file' };
}

/** Load a config synchronously (JSON / CJS / package.json, or a sync `loader`). */
export function loadConfigSync<T = unknown>(
    options: LoadConfigOptions<T> = {}
): LoadedConfig<T> | undefined {
    const candidates = findCandidates(options);
    if (candidates.length === 0) {
        if (options.required) throw new Error('No config file found.');
        return undefined;
    }
    const typescript: string[] = [];
    const unsupported: string[] = [];
    let lastError: unknown;
    for (const candidate of candidates) {
        if (candidate.kind === 'package.json') {
            return loaded(options, candidate, candidate.value);
        }
        if (options.loader) {
            const value = options.loader(candidate.file);
            if (isPromise(value)) {
                throw new Error(
                    `The custom loader returned a promise for ${candidate.file}; use \`loadConfigAsync\`.`
                );
            }
            return loaded(options, candidate, value);
        }
        const extension = path.extname(candidate.file).toLowerCase();
        if (['.ts', '.mts', '.cts'].includes(extension)) {
            typescript.push(candidate.file);
            continue;
        }
        if (extension === '.json') {
            const value = JSON.parse(
                fs.readFileSync(candidate.file, 'utf-8').replace(/^\uFEFF/, '')
            );
            return loaded(options, candidate, value);
        }
        if (['.js', '.cjs', '.mjs'].includes(extension)) {
            try {
                const require = createRequire(import.meta.url);
                if (options.fresh) {
                    try {
                        delete require.cache[candidate.file];
                    } catch {
                        // not a require-cached module
                    }
                }
                const required = require(candidate.file) as { default?: unknown };
                return loaded(options, candidate, required.default ?? required);
            } catch (error) {
                lastError = error;
                continue;
            }
        }
        unsupported.push(candidate.file);
    }
    if (typescript.length > 0) {
        throw new Error(
            `Cannot load a TypeScript config synchronously (${typescript[0]}); use \`loadConfigAsync\` or pass a synchronous \`loader\`.`
        );
    }
    if (unsupported.length > 0) {
        throw new Error(
            `Unsupported config file synchronously (${unsupported[0]}); use \`loadConfigAsync\` or pass a \`loader\`.`
        );
    }
    throw lastError ?? new Error('No config file could be loaded synchronously.');
}

/** Import a config module natively (JS/JSON), optionally through a custom loader. */
async function importConfig(file: string, options: LoadConfigOptions): Promise<unknown> {
    if (options.loader) return options.loader(file);
    if (file.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
    }
    if (options.fresh) {
        // CJS modules are cached by require, which an ESM query cannot bust.
        try {
            delete createRequire(import.meta.url).cache[file];
        } catch {
            // not a require-cached module
        }
    }
    const url = pathToFileURL(file).href;
    const specifier = options.fresh ? `${url}?dbx=${Date.now()}` : url;
    const mod = (await import(specifier)) as { default?: unknown };
    return mod.default ?? mod;
}

/** Load a config asynchronously (JSON, CJS, ESM and TypeScript). */
export async function loadConfigAsync<T = unknown>(
    options: LoadConfigOptions<T> = {}
): Promise<LoadedConfig<T> | undefined> {
    const candidate = findCandidate(options);
    if (!candidate) {
        if (options.required) throw new Error('No config file found.');
        return undefined;
    }
    if (candidate.kind === 'package.json') {
        return {
            config: validate(options.schema, candidate.value),
            path: candidate.file,
            source: 'package.json',
            ...(candidate.key ? { key: candidate.key } : {}),
        };
    }
    const value = await importConfig(candidate.file, options);
    return { config: validate(options.schema, value), path: candidate.file, source: 'file' };
}

/** Load a config (async; handles every supported extension). */
export function loadConfig<T = unknown>(
    options: LoadConfigOptions<T> = {}
): Promise<LoadedConfig<T> | undefined> {
    return loadConfigAsync(options);
}
