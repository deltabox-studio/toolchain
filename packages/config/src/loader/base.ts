/**
 * Config-file discovery and loading.
 *
 * `loadConfig` finds a config by name in common locations (or an ancestor
 * directory), falls back to a `package.json` key, and imports it with the best
 * available strategy. When a parser (or legacy `schema`) is provided the loaded
 * value is resolved through `parseConfig` (or validated directly).
 */

import { createRequire } from 'node:module';

import { deepMerge } from '@deltabox/toolchain/shared';

import { parseConfig } from '../parser.js';
import type {
    ConfigSchema,
    ConfigSource,
    ConfigSourceSelection,
    ParseConfigOptions,
    ResolvedConfig,
} from '../types/index.js';
import type {
    LoadConfigFileOptions,
    LoadConfigOptions,
    LoadedConfig,
    LoaderOptions,
} from '../types/loader.js';
import { discoverConfig } from './discover.js';
import { extensionKind, importModule, parseJson, parseYamlAsync, parseYamlSync } from './import.js';
import { invokeAsyncLoader, invokeSyncLoader, isPromise, selectLoader } from './loaders.js';
import { type AnyLoadInput, resolveTsconfigSetting } from './options.js';

/**
 * Resolve a Vite-style function export when the caller asked to parse the
 * config. Without a parser/schema the raw value is returned (core's plugin probe
 * needs the function to pass its own environment).
 */
function resolveExportSync(value: unknown, file: string): unknown {
    const resolved = typeof value === 'function' ? (value as () => unknown)() : value;
    if (isPromise(resolved)) {
        throw new Error(`The config ${file} returned a promise; use \`loadConfigAsync\`.`);
    }
    return resolved;
}

async function resolveExportAsync(value: unknown): Promise<unknown> {
    const resolved = await value;
    return typeof resolved === 'function' ? await (resolved as () => unknown)() : resolved;
}

/** Whether the options ask the loader to parse/validate the value. */
function parsesConfig(options: AnyLoadInput): boolean {
    const parse = options as LoadConfigFileOptions;
    return Boolean(parse.parser || (options as LoadConfigOptions<unknown>).schema);
}

/**
 * Resolve the loaders' source list. A loader always reads the file; `env` and
 * `cli` layer over it in that order, and an explicit `source` narrows the set.
 * @default ['file', 'env', 'cli']
 */
function loaderSources(options: AnyLoadInput): ConfigSource[] {
    const selection = (options as { source?: ConfigSourceSelection }).source;
    if (selection === undefined) return ['file', 'env', 'cli'];
    const list = Array.isArray(selection) ? selection : [selection];
    return [...new Set(['file', ...list])] as ConfigSource[];
}

function parseLoaded(options: AnyLoadInput, value: unknown): unknown {
    if (!parsesConfig(options)) {
        const overrides = (options as LoadConfigOptions<unknown>).overrides;
        return overrides && value && typeof value === 'object' && !Array.isArray(value)
            ? deepMerge(value as Record<string, unknown>, overrides)
            : value;
    }
    const parse = options as LoadConfigFileOptions & LoadConfigOptions<unknown>;
    const base =
        value && typeof value === 'object' && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : undefined;
    // A primitive/array file value has no paths for the collector to merge; keep
    // the old direct validation contract instead of dropping it.
    if (base === undefined && value !== undefined) {
        const target = (parse.parser ?? parse.schema) as { parse?: (input: unknown) => unknown };
        return typeof target?.parse === 'function' ? target.parse(value) : value;
    }
    const overrides = parse.overrides;
    const run = parseConfig as unknown as (
        parser: unknown,
        overrides?: unknown,
        options?: ParseConfigOptions
    ) => unknown;
    return run(parse.parser ?? parse.schema, overrides, {
        ...(parse.envPrefix !== undefined ? { envPrefix: parse.envPrefix } : {}),
        ...(parse.envPathOf ? { envPathOf: parse.envPathOf } : {}),
        ...(parse.include !== undefined ? { include: parse.include } : {}),
        ...(parse.exclude !== undefined ? { exclude: parse.exclude } : {}),
        ...(parse.filter ? { filter: parse.filter } : {}),
        ...(parse.maxDepth !== undefined ? { maxDepth: parse.maxDepth } : {}),
        ...(parse.envSource ? { envSource: parse.envSource } : {}),
        ...(parse.argv ? { argv: parse.argv } : {}),
        ...(parse.errorOptions ? { errorOptions: parse.errorOptions } : {}),
        ...(base ? { base } : {}),
        source: loaderSources(options),
        validate: parse.validate ?? true,
    });
}

function loaded(
    options: AnyLoadInput,
    candidate: { file: string; kind: 'file' | 'package.json'; key?: string },
    value: unknown
): LoadedConfig {
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

/** Load a config synchronously (JSON / YAML / CJS / package.json, or a sync `loader`). */
export function loadConfigSync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    options: LoadConfigFileOptions<P, O> & NoInfer<Options>
): LoadedConfig<ResolvedConfig<P, O, Options>> | undefined;
export function loadConfigSync<T = unknown>(
    options?: LoadConfigOptions<T>
): LoadedConfig<T> | undefined;
export function loadConfigSync(options: AnyLoadInput = {}): LoadedConfig<any> | undefined {
    const { candidates, options: resolved } = discoverConfig(options);
    if (candidates.length === 0) {
        if (resolved.required) throw new Error('No config file found.');
        return undefined;
    }
    const typescript: string[] = [];
    const unsupported: string[] = [];
    const parse = parsesConfig(options);
    let lastError: unknown;
    for (const candidate of candidates) {
        const finish = (value: unknown): LoadedConfig =>
            loaded(options, candidate, parse ? resolveExportSync(value, candidate.file) : value);
        if (candidate.kind === 'package.json') {
            return finish(candidate.value);
        }
        const extension = extensionKind(candidate.file);
        const selected = selectLoader((options as LoaderOptions).loader, extension);
        if (selected) {
            return finish(invokeSyncLoader(candidate.file, selected));
        }
        if (extension === 'json') {
            return finish(parseJson(candidate.file));
        }
        if (extension === 'yaml') {
            return finish(parseYamlSync(candidate.file));
        }
        if (extension === 'ts') {
            typescript.push(candidate.file);
            continue;
        }
        if (extension === 'js') {
            let requiredModule: { default?: unknown } | null | undefined;
            try {
                const require = createRequire(import.meta.url);
                if ((options as { fresh?: boolean }).fresh) {
                    try {
                        delete require.cache[candidate.file];
                    } catch {
                        // not a require-cached module
                    }
                }
                requiredModule = require(candidate.file) as
                    | { default?: unknown }
                    | null
                    | undefined;
            } catch (error) {
                lastError = error;
                throw error;
            }
            const value =
                requiredModule && typeof requiredModule === 'object' && 'default' in requiredModule
                    ? requiredModule.default
                    : requiredModule;
            return finish(value);
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

/** Load a config asynchronously (JSON, YAML, CJS, ESM and TypeScript). */
export async function loadConfigAsync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: LoadConfigFileOptions<P, O> & NoInfer<Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export async function loadConfigAsync<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export async function loadConfigAsync(
    input: AnyLoadInput = {}
): Promise<LoadedConfig<any> | undefined> {
    const { candidates, options: resolved, rootCwd } = discoverConfig(input);
    const candidate = candidates[0];
    if (!candidate) {
        if (resolved.required) throw new Error('No config file found.');
        return undefined;
    }
    if (candidate.kind === 'package.json') {
        return loaded(input, candidate, candidate.value);
    }
    const extension = extensionKind(candidate.file);
    const selected = selectLoader((input as LoaderOptions).loader, extension);
    const value = selected
        ? await invokeAsyncLoader(candidate.file, selected)
        : extension === 'yaml'
          ? await parseYamlAsync(candidate.file)
          : await importModule(candidate.file, {
                fresh: (input as { fresh?: boolean }).fresh,
                tsconfig: resolveTsconfigSetting(resolved.tsconfig, rootCwd),
            });
    return loaded(input, candidate, parsesConfig(input) ? await resolveExportAsync(value) : value);
}

type LoadInput<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    Options = {},
> =
    | (LoadConfigFileOptions<P, O> & NoInfer<Options>)
    | Promise<LoadConfigFileOptions<P, O> & NoInfer<Options>>
    | (() =>
          | (LoadConfigFileOptions<P, O> & NoInfer<Options>)
          | Promise<LoadConfigFileOptions<P, O> & NoInfer<Options>>);

async function resolveInput(input: unknown): Promise<AnyLoadInput> {
    let value = await input;
    if (typeof value === 'function') value = await (value as () => unknown)();
    return (value ?? {}) as AnyLoadInput;
}

/** Load a config (async; handles every supported extension). */
export function loadConfig<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: LoadInput<P, O, Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export function loadConfig<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export function loadConfig(input?: unknown): Promise<LoadedConfig<any> | undefined> {
    const run = loadConfigAsync as unknown as (
        options?: unknown
    ) => Promise<LoadedConfig<any> | undefined>;
    return resolveInput(input).then(options => run(options));
}

/** A loader input plus the source set a source-specific loader forces. */
function withSources(input: unknown, sources: readonly ConfigSource[]): AnyLoadInput {
    return { ...(input as Record<string, unknown>), source: sources } as AnyLoadInput;
}

/** The source-specific loader family: file plus one ambient source. */
const SOURCE_LOADERS = {
    file: ['file'],
    env: ['file', 'env'],
    cli: ['file', 'cli'],
} as const satisfies Record<string, readonly ConfigSource[]>;

type SourceLoaderKind = keyof typeof SOURCE_LOADERS;

type SourceLoadInput<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    Options = {},
> =
    | (LoadConfigFileOptions<P, O> & NoInfer<Options>)
    | Promise<LoadConfigFileOptions<P, O> & NoInfer<Options>>
    | (() =>
          | (LoadConfigFileOptions<P, O> & NoInfer<Options>)
          | Promise<LoadConfigFileOptions<P, O> & NoInfer<Options>>);

function sourceLoaderSync(kind: SourceLoaderKind, options: unknown): LoadedConfig<any> | undefined {
    return loadConfigSync(withSources(options ?? {}, SOURCE_LOADERS[kind]));
}

async function sourceLoaderAsync(
    kind: SourceLoaderKind,
    options: unknown
): Promise<LoadedConfig<any> | undefined> {
    return loadConfigAsync(withSources(options ?? {}, SOURCE_LOADERS[kind]));
}

function sourceLoader(
    kind: SourceLoaderKind,
    input?: unknown
): Promise<LoadedConfig<any> | undefined> {
    return resolveInput(input).then(options => sourceLoaderAsync(kind, options));
}

/** Synchronous loader for the file value plus env vars. */
export function loadEnvConfigSync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    options: LoadConfigFileOptions<P, O> & NoInfer<Options>
): LoadedConfig<ResolvedConfig<P, O, Options>> | undefined;
export function loadEnvConfigSync<T = unknown>(
    options?: LoadConfigOptions<T>
): LoadedConfig<T> | undefined;
export function loadEnvConfigSync(options: unknown = {}): LoadedConfig<any> | undefined {
    return sourceLoaderSync('env', options);
}

/** Asynchronous loader for the file value plus env vars. */
export async function loadEnvConfigAsync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: LoadConfigFileOptions<P, O> & NoInfer<Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export async function loadEnvConfigAsync<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export async function loadEnvConfigAsync(
    input?: AnyLoadInput
): Promise<LoadedConfig<any> | undefined> {
    return sourceLoaderAsync('env', input ?? {});
}

/** Load the file value plus env vars (async wrapper; accepts a promise/function). */
export function loadEnvConfig<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: SourceLoadInput<P, O, Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export function loadEnvConfig<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export function loadEnvConfig(input?: unknown): Promise<LoadedConfig<any> | undefined> {
    return sourceLoader('env', input);
}

/** Synchronous loader for the file value plus CLI args. */
export function loadCliConfigSync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    options: LoadConfigFileOptions<P, O> & NoInfer<Options>
): LoadedConfig<ResolvedConfig<P, O, Options>> | undefined;
export function loadCliConfigSync<T = unknown>(
    options?: LoadConfigOptions<T>
): LoadedConfig<T> | undefined;
export function loadCliConfigSync(options: unknown = {}): LoadedConfig<any> | undefined {
    return sourceLoaderSync('cli', options);
}

/** Asynchronous loader for the file value plus CLI args. */
export async function loadCliConfigAsync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: LoadConfigFileOptions<P, O> & NoInfer<Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export async function loadCliConfigAsync<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export async function loadCliConfigAsync(
    input?: AnyLoadInput
): Promise<LoadedConfig<any> | undefined> {
    return sourceLoaderAsync('cli', input ?? {});
}

/** Load the file value plus CLI args (async wrapper; accepts a promise/function). */
export function loadCliConfig<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: SourceLoadInput<P, O, Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export function loadCliConfig<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export function loadCliConfig(input?: unknown): Promise<LoadedConfig<any> | undefined> {
    return sourceLoader('cli', input);
}

/** Synchronous loader for the file value only. */
export function loadFileConfigSync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    options: LoadConfigFileOptions<P, O> & NoInfer<Options>
): LoadedConfig<ResolvedConfig<P, O, Options>> | undefined;
export function loadFileConfigSync<T = unknown>(
    options?: LoadConfigOptions<T>
): LoadedConfig<T> | undefined;
export function loadFileConfigSync(options: unknown = {}): LoadedConfig<any> | undefined {
    return sourceLoaderSync('file', options);
}

/** Asynchronous loader for the file value only. */
export async function loadFileConfigAsync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: LoadConfigFileOptions<P, O> & NoInfer<Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export async function loadFileConfigAsync<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export async function loadFileConfigAsync(
    input?: AnyLoadInput
): Promise<LoadedConfig<any> | undefined> {
    return sourceLoaderAsync('file', input ?? {});
}

/** Load the file value only (async wrapper; accepts a promise/function). */
export function loadFileConfig<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined = undefined,
    const Options extends ParseConfigOptions = {},
>(
    input: SourceLoadInput<P, O, Options>
): Promise<LoadedConfig<ResolvedConfig<P, O, Options>> | undefined>;
export function loadFileConfig<T = unknown>(
    options?: LoadConfigOptions<T>
): Promise<LoadedConfig<T> | undefined>;
export function loadFileConfig(input?: unknown): Promise<LoadedConfig<any> | undefined> {
    return sourceLoader('file', input);
}
