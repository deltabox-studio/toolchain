/**
 * Config-file discovery and loading.
 *
 * The loader finds a config by name in common locations, falls back to a
 * `package.json` key, and imports it with the best available strategy: native
 * import/require for JS/CJS/MJS, JSON parsing, YAML parsing and a
 * TypeScript-capable loader for TS. `loadConfig` resolves the loaded value
 * through `parseConfig` when a parser is provided.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { ZodType } from 'zod';

import { deepMerge } from '@deltabox/toolchain-shared';

import { parseConfig } from '../parser.js';
import type { ConfigSchema, ParseConfigOptions, ResolvedConfig } from '../types/index.js';

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

/** Where a resolved config came from. */
export type ConfigSourceKind = 'file' | 'package.json' | 'none';

/** A loaded config plus its origin. */
export interface LoadedConfig<T = unknown> {
    /** The config value (validated/parsed when a parser or schema was provided). */
    config: T;
    /** The absolute config file (or the `package.json`). */
    path?: string;
    /** The source kind. */
    source: ConfigSourceKind;
    /** The `package.json` key that held the config, when `source` is that. */
    key?: string;
}

/** Config-file discovery options. */
export interface ConfigFileOptions {
    /** The filename without its extension, eg. `dbx.config`. */
    filename: string;
    /** Throw instead of returning `undefined` when nothing is found. */
    required?: boolean;
    /** Resolve symlinks (default true). */
    followSymlinks?: boolean;
    /** Read the config from a `package.json` key. */
    packageJson?: { enabled?: boolean; key: string };
    /** The extensions tried for {@link ConfigFileOptions.filename}. */
    allowedFileExtensions?: string[];
    /** Where to look; `path` entries may be globs. */
    commonLocation?:
        | { cwd?: string; path: string | string[] }
        | Array<{ cwd?: string; path: string | string[] }>;
}

/** A named loader package plus its options. */
export interface LoaderConfig {
    /** The loader module (package or path). */
    name?: string;
    /** Alias for {@link LoaderConfig.name}. */
    loader?: string;
    /** Options forwarded to the loader. */
    options?: Record<string, unknown>;
}

/** A loader module name, config or custom function. */
export type LoaderValue =
    | string
    | LoaderConfig
    | ((file: string, options?: Record<string, unknown>) => unknown | Promise<unknown>);

/** Extensions a loader can be selected for. */
export type LoaderExtension = 'js' | 'ts' | 'yaml' | 'json';

/** A loader setting: one loader or a per-extension map. */
export type LoaderSetting = LoaderValue | Partial<Record<LoaderExtension, LoaderValue>>;

/** Loader selection options. */
export interface LoaderOptions {
    /** A loader, per-extension loaders, or a list of both (first match wins). */
    loader?: LoaderSetting | LoaderSetting[];
}

/** Legacy loader options, kept for the existing object API. */
export interface LoadConfigOptions<T = unknown> extends LoaderOptions {
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
    /** Re-evaluate an already-imported module (watch/regenerate runs). */
    fresh?: boolean;
}

/** The new parser-based loader options. */
export type LoadConfigFileOptions<
    P extends ConfigSchema = ConfigSchema,
    O extends Record<string, any> | null | undefined = Record<string, any> | null | undefined,
> = {
    /** Resolve the loaded value through `parseConfig`. */
    parser: P;
    /** Overrides merged over the resolved config. */
    overrides?: O;
    /** Config-file discovery options. */
    configFileOptions?: ConfigFileOptions;
    /** The directory to search from (default `process.cwd()`). */
    cwd?: string;
    /** Re-evaluate an already-imported module (watch/regenerate runs). */
    fresh?: boolean;
} & LoaderOptions &
    Omit<ParseConfigOptions, 'envSource' | 'argv'>;

type AnyLoadInput =
    | LoadConfigFileOptions<ConfigSchema, Record<string, any>>
    | LoadConfigOptions<unknown>;

interface ResolvedConfigFileOptions {
    required: boolean;
    followSymlinks: boolean;
    names: readonly string[];
    locations: Array<{ cwd?: string; path: string | string[] }>;
    packageJsonKeys?: readonly string[];
    allowedExtensions?: readonly string[];
}

function normalizeConfigFileOptions(options: AnyLoadInput): ResolvedConfigFileOptions {
    const legacy = options as LoadConfigOptions<unknown>;
    const file = (options as LoadConfigFileOptions).configFileOptions;
    if (!file) {
        return {
            required: legacy.required === true,
            followSymlinks: true,
            names: legacy.names ?? DEFAULT_CONFIG_NAMES,
            locations: (legacy.locations ?? DEFAULT_CONFIG_LOCATIONS).map(location => ({
                path: location,
            })),
            packageJsonKeys: legacy.packageJsonKeys,
        };
    }
    const filename = file.filename.replace(/\.[^./\\]+$/, '');
    const allowed = file.allowedFileExtensions ?? [...DEFAULT_CONFIG_EXTENSIONS];
    const names = allowed.map(extension => `${filename}${extension}`);
    const locations = file.commonLocation
        ? Array.isArray(file.commonLocation)
            ? file.commonLocation
            : [file.commonLocation]
        : [{ path: '.' }];
    const packageJsonKey =
        file.packageJson && file.packageJson.enabled !== false ? [file.packageJson.key] : undefined;
    return {
        required: file.required === true,
        followSymlinks: file.followSymlinks ?? true,
        names,
        locations,
        ...(packageJsonKey ? { packageJsonKeys: packageJsonKey } : {}),
        ...(file.allowedFileExtensions ? { allowedExtensions: allowed } : {}),
    };
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

function hasGlob(value: string): boolean {
    return /[*?[\]{}]/.test(value);
}

function pathGlobToRegExp(pattern: string): RegExp {
    const normalized = pattern.replace(/\\/g, '/').replace(/^\.\//, '');
    const escaped = normalized.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const source = escaped
        .replace(/\*\*\//g, '\u0000')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\u0000/g, '(?:.*/)?');
    return new RegExp(`^${source}$`);
}

function walkDirectories(root: string, depth = 0): string[] {
    if (depth > 8) return [root];
    const out = [root];
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        out.push(...walkDirectories(path.join(root, entry.name), depth + 1));
    }
    return out;
}

function expandLocation(
    location: { cwd?: string; path: string | string[] },
    rootCwd: string
): string[] {
    const base = path.resolve(rootCwd, location.cwd ?? '.');
    const patterns = Array.isArray(location.path) ? location.path : [location.path];
    const out = new Set<string>();
    for (const pattern of patterns) {
        if (!hasGlob(pattern)) {
            out.add(path.resolve(base, pattern));
            continue;
        }
        const expression = pathGlobToRegExp(pattern);
        for (const dir of walkDirectories(base)) {
            const relative = path.relative(base, dir).replace(/\\/g, '/');
            if (expression.test(relative) || expression.test(`${relative}/`)) out.add(dir);
        }
    }
    return [...out];
}

function findCandidates(options: AnyLoadInput): Candidate[] {
    const resolved = normalizeConfigFileOptions(options);
    const rawCwd = (options as { cwd?: string }).cwd;
    const rootCwd = path.resolve(rawCwd ?? process.cwd());
    const out: Candidate[] = [];
    for (const location of resolved.locations) {
        for (const dir of expandLocation(location, rootCwd)) {
            for (const name of resolved.names) {
                const file = path.join(dir, name);
                if (!fs.existsSync(file)) continue;
                if (resolved.allowedExtensions) {
                    const extension = path.extname(file).toLowerCase();
                    if (!resolved.allowedExtensions.includes(extension)) continue;
                }
                out.push({ file: realpath(file, resolved.followSymlinks), kind: 'file' });
            }
            const pkg = readPackageJsonConfig(dir, resolved.packageJsonKeys);
            if (pkg) {
                out.push({
                    file: pkg.file,
                    value: pkg.value,
                    key: pkg.key,
                    kind: 'package.json',
                });
            }
        }
    }
    return out;
}

function isPromise(value: unknown): value is Promise<unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { then?: unknown }).then === 'function'
    );
}

function extensionKind(file: string): LoaderExtension | undefined {
    const extension = path.extname(file).toLowerCase();
    if (['.ts', '.mts', '.cts', '.tsx'].includes(extension)) return 'ts';
    if (['.js', '.mjs', '.cjs', '.jsx'].includes(extension)) return 'js';
    if (['.yaml', '.yml'].includes(extension)) return 'yaml';
    if (extension === '.json') return 'json';
    return undefined;
}

/** The loader setting that applies to a file's extension. */
function selectLoader(
    setting: LoaderSetting | LoaderSetting[] | undefined,
    extension: LoaderExtension | undefined
): LoaderValue | undefined {
    if (setting === undefined) return undefined;
    const list = Array.isArray(setting) ? setting : [setting];
    for (const entry of list) {
        if (typeof entry === 'function' || typeof entry === 'string') return entry;
        if (!entry || typeof entry !== 'object') continue;
        if ('name' in entry || 'loader' in entry) return entry as LoaderConfig;
        if (extension && extension in entry) {
            const selected = (entry as Partial<Record<LoaderExtension, LoaderValue>>)[extension];
            if (selected !== undefined) return selected;
        }
    }
    return undefined;
}

function moduleLoader(mod: unknown): LoaderValue | undefined {
    const value = (mod as { default?: unknown } | undefined)?.default ?? mod;
    return typeof value === 'function' ? (value as LoaderValue) : undefined;
}

function requireLoader(name: string): LoaderValue | undefined {
    try {
        const require = createRequire(import.meta.url);
        return moduleLoader(require(name));
    } catch {
        return undefined;
    }
}

async function importLoader(name: string): Promise<LoaderValue | undefined> {
    try {
        return moduleLoader(await import(name));
    } catch {
        return undefined;
    }
}

function loaderOptions(setting: LoaderValue): Record<string, unknown> | undefined {
    return typeof setting === 'object' && !Array.isArray(setting)
        ? (setting as LoaderConfig).options
        : undefined;
}

function loaderName(setting: LoaderValue): string | undefined {
    return typeof setting === 'string'
        ? setting
        : typeof setting === 'object' && !Array.isArray(setting)
          ? ((setting as LoaderConfig).name ?? (setting as LoaderConfig).loader)
          : undefined;
}

function parseJson(file: string): unknown {
    return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
}

function parseYamlSync(file: string): unknown {
    const require = createRequire(import.meta.url);
    for (const name of ['yaml', 'js-yaml']) {
        try {
            const mod = require(name) as { parse?: (value: string) => unknown };
            if (typeof mod.parse === 'function') {
                return mod.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
            }
        } catch {
            // try the next installed YAML parser
        }
    }
    throw new Error(
        `Cannot parse YAML config ${file}; install \`yaml\` or \`js-yaml\` or pass a custom loader.`
    );
}

async function parseYamlAsync(file: string): Promise<unknown> {
    for (const name of ['yaml', 'js-yaml']) {
        const mod = (await import(name).catch(() => undefined)) as
            | { parse?: (value: string) => unknown }
            | undefined;
        if (mod && typeof mod.parse === 'function') {
            return mod.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
        }
    }
    throw new Error(
        `Cannot parse YAML config ${file}; install \`yaml\` or \`js-yaml\` or pass a custom loader.`
    );
}

function invokeSyncLoader(file: string, setting: LoaderValue): unknown {
    if (typeof setting === 'function') return setting(file);
    const name = loaderName(setting);
    if (!name) throw new Error(`Invalid loader for ${file}.`);
    const loader = requireLoader(name);
    if (!loader) {
        throw new Error(`Cannot load the \`${name}\` loader synchronously for ${file}.`);
    }
    const value =
        typeof loader === 'function'
            ? loader(file, loaderOptions(setting))
            : loaderOptions(setting);
    if (isPromise(value)) {
        throw new Error(
            `The custom loader returned a promise for ${file}; use \`loadConfigAsync\`.`
        );
    }
    return value;
}

async function invokeAsyncLoader(file: string, setting: LoaderValue): Promise<unknown> {
    if (typeof setting === 'function') return setting(file);
    const name = loaderName(setting);
    if (!name) throw new Error(`Invalid loader for ${file}.`);
    const loader = await importLoader(name);
    if (!loader) throw new Error(`Cannot load the \`${name}\` loader for ${file}.`);
    return typeof loader === 'function'
        ? loader(file, loaderOptions(setting))
        : loaderOptions(setting);
}

function parseLoaded(options: AnyLoadInput, value: unknown): unknown {
    const parse = options as LoadConfigFileOptions;
    if (parse.parser) {
        const overrides = parse.overrides;
        const merged =
            overrides && value && typeof value === 'object' && typeof overrides === 'object'
                ? deepMerge(value as Record<string, any>, overrides)
                : (overrides ?? value);
        return parseConfig(parse.parser, merged as never, parse as ParseConfigOptions);
    }
    const schema = (options as LoadConfigOptions<unknown>).schema;
    return schema ? schema.parse(value) : value;
}

function loaded(options: AnyLoadInput, candidate: Candidate, value: unknown): LoadedConfig {
    const config = parseLoaded(options, value);
    if (candidate.kind === 'package.json') {
        return {
            config,
            path: candidate.file,
            source: 'package.json',
            ...(candidate.key ? { key: candidate.key } : {}),
        };
    }
    return { config, path: candidate.file, source: 'file' };
}

function required(options: AnyLoadInput): boolean {
    return normalizeConfigFileOptions(options).required;
}

/** Load a config synchronously (JSON / YAML / CJS / package.json, or a sync `loader`). */
export function loadConfigSync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined,
    const Options extends ParseConfigOptions = {},
>(
    options: LoadConfigFileOptions<P, O> & Options
): LoadedConfig<ResolvedConfig<P, O, Options>> | undefined;
export function loadConfigSync<T = unknown>(
    options?: LoadConfigOptions<T>
): LoadedConfig<T> | undefined;
export function loadConfigSync(options: AnyLoadInput = {}): LoadedConfig<any> | undefined {
    const candidates = findCandidates(options);
    if (candidates.length === 0) {
        if (required(options)) throw new Error('No config file found.');
        return undefined;
    }
    const typescript: string[] = [];
    const unsupported: string[] = [];
    let lastError: unknown;
    for (const candidate of candidates) {
        if (candidate.kind === 'package.json') {
            return loaded(options, candidate, candidate.value);
        }
        const extension = extensionKind(candidate.file);
        const selected = selectLoader((options as LoaderOptions).loader, extension);
        if (selected) {
            return loaded(options, candidate, invokeSyncLoader(candidate.file, selected));
        }
        if (extension === 'json') {
            return loaded(options, candidate, parseJson(candidate.file));
        }
        if (extension === 'yaml') {
            return loaded(options, candidate, parseYamlSync(candidate.file));
        }
        if (extension === 'ts') {
            typescript.push(candidate.file);
            continue;
        }
        if (extension === 'js') {
            try {
                const require = createRequire(import.meta.url);
                if ((options as { fresh?: boolean }).fresh) {
                    try {
                        delete require.cache[candidate.file];
                    } catch {
                        // not a require-cached module
                    }
                }
                const requiredModule = require(candidate.file) as { default?: unknown };
                return loaded(options, candidate, requiredModule.default ?? requiredModule);
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

/** Import a config module natively, optionally through a custom loader. */
async function importConfig(
    file: string,
    options: AnyLoadInput,
    setting: LoaderValue | undefined,
    extension: LoaderExtension | undefined
): Promise<unknown> {
    if (setting) return invokeAsyncLoader(file, setting);
    if (extension === 'json') return parseJson(file);
    if (extension === 'yaml') return parseYamlAsync(file);
    if (extension === 'js') {
        if ((options as { fresh?: boolean }).fresh) {
            // CJS modules are cached by require, which an ESM query cannot bust.
            try {
                delete createRequire(import.meta.url).cache[file];
            } catch {
                // not a require-cached module
            }
        }
        const url = pathToFileURL(file).href;
        const specifier = (options as { fresh?: boolean }).fresh ? `${url}?dbx=${Date.now()}` : url;
        const mod = (await import(specifier)) as { default?: unknown };
        return mod.default ?? mod;
    }
    // TypeScript: native import first (Node >= 22.5 type stripping), then the
    // installed transpiler loaders (tsx, then jiti) when Node cannot load it.
    const url = pathToFileURL(file).href;
    const specifier = (options as { fresh?: boolean }).fresh ? `${url}?dbx=${Date.now()}` : url;
    try {
        const mod = (await import(specifier)) as { default?: unknown };
        return mod.default ?? mod;
    } catch (error) {
        const code = (error as { code?: unknown } | null)?.code;
        if (code !== 'ERR_UNKNOWN_FILE_EXTENSION' && code !== 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX') {
            throw error;
        }
        const tsxName = process.env.DBX_TS_LOADER ?? 'tsx/esm/api';
        const tsx = await import(tsxName).catch(() => undefined);
        if (tsx && typeof (tsx as { tsImport?: unknown }).tsImport === 'function') {
            const mod = (await (
                tsx as { tsImport: (url: string, options?: unknown) => Promise<unknown> }
            ).tsImport(url, { parentURL: import.meta.url })) as { default?: unknown };
            return mod.default ?? mod;
        }
        const jitiName = process.env.DBX_JITI_LOADER ?? 'jiti';
        const jitiModule = (await import(jitiName).catch(() => undefined)) as
            | { createJiti?: (url: string) => { import: (file: string) => Promise<unknown> } }
            | undefined;
        if (jitiModule?.createJiti) {
            const mod = await jitiModule.createJiti(import.meta.url).import(file);
            return (mod as { default?: unknown }).default ?? mod;
        }
        throw error;
    }
}

/** Load a config asynchronously (JSON, YAML, CJS, ESM and TypeScript). */
export async function loadConfigAsync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: LoadConfigFileOptions<P, O> & Options
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export async function loadConfigAsync<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export async function loadConfigAsync(
    input: AnyLoadInput = {}
): Promise<LoadedConfig<any> | undefined> {
    const options = input;
    const candidate = findCandidates(options)[0];
    if (!candidate) {
        if (required(options)) throw new Error('No config file found.');
        return undefined;
    }
    if (candidate.kind === 'package.json') {
        return loaded(options, candidate, candidate.value);
    }
    const extension = extensionKind(candidate.file);
    const selected = selectLoader((options as LoaderOptions).loader, extension);
    const value = await importConfig(candidate.file, options, selected, extension);
    return loaded(options, candidate, value);
}

type LoadInput<P extends ConfigSchema, O extends Record<string, any> | null | undefined, Options> =
    | (LoadConfigFileOptions<P, O> & Options)
    | Promise<LoadConfigFileOptions<P, O> & Options>
    | (() =>
          | (LoadConfigFileOptions<P, O> & Options)
          | Promise<LoadConfigFileOptions<P, O> & Options>);

async function resolveInput(input: unknown): Promise<AnyLoadInput> {
    let value = await input;
    if (typeof value === 'function') value = await (value as () => unknown)();
    return (value ?? {}) as AnyLoadInput;
}

/** Load a config (async; handles every supported extension). */
export function loadConfig<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: LoadInput<P, O, Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export function loadConfig<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export function loadConfig(input?: unknown): Promise<LoadedConfig<any> | undefined> {
    return resolveInput(input).then(options => loadConfigAsync(options as never));
}
