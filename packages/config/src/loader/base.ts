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
import type { ConfigSchema, ParseConfigOptions, ResolvedConfig } from '../types/index.js';
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

function parseLoaded(options: AnyLoadInput, value: unknown): unknown {
    const parse = options as LoadConfigFileOptions;
    if (parse.parser) {
        const overrides = parse.overrides;
        const merged =
            overrides && value && typeof value === 'object' && typeof overrides === 'object'
                ? deepMerge(value as Record<string, any>, overrides)
                : (overrides ?? value);
        return parseConfig(
            parse.parser,
            merged as never,
            {
                ...parse,
                source: 'file',
            } as ParseConfigOptions
        );
    }
    const schema = (options as LoadConfigOptions<unknown>).schema;
    return schema ? schema.parse(value) : value;
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
    O extends Record<string, any> | null | undefined,
    const Options extends ParseConfigOptions = {},
>(
    options: LoadConfigFileOptions<P, O> & Options
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
