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

function findCandidate(options: LoadConfigOptions): Candidate | undefined {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const names = options.names ?? DEFAULT_CONFIG_NAMES;
    const locations = options.locations ?? DEFAULT_CONFIG_LOCATIONS;
    for (const location of locations) {
        const dir = path.resolve(cwd, location);
        for (const name of names) {
            const file = realpath(path.join(dir, name), true);
            if (fs.existsSync(file)) return { file, kind: 'file' };
        }
        const pkg = readPackageJsonConfig(dir, options.packageJsonKeys);
        if (pkg) return { file: pkg.file, value: pkg.value, key: pkg.key, kind: 'package.json' };
    }
    return undefined;
}

/** Load a config synchronously (JSON / CJS / package.json only). */
export function loadConfigSync<T = unknown>(
    options: LoadConfigOptions<T> = {}
): LoadedConfig<T> | undefined {
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
    const extension = path.extname(candidate.file).toLowerCase();
    if (['.ts', '.mts', '.cts'].includes(extension)) {
        throw new Error(
            `Cannot load a TypeScript config synchronously (${candidate.file}); use \`loadConfigAsync\` or pass a \`loader\`.`
        );
    }
    const value =
        extension === '.json'
            ? JSON.parse(fs.readFileSync(candidate.file, 'utf-8').replace(/^\uFEFF/, ''))
            : ((createRequire(import.meta.url)(candidate.file) as { default?: unknown }).default ??
              createRequire(import.meta.url)(candidate.file));
    return { config: validate(options.schema, value), path: candidate.file, source: 'file' };
}

/** Import a config module natively (JS/JSON), optionally through a custom loader. */
async function importConfig(file: string, options: LoadConfigOptions): Promise<unknown> {
    if (options.loader) return options.loader(file);
    if (file.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
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
