/**
 * Parse a configuration value from env vars, CLI args or a file object into a
 * validated, correlated typed config.
 *
 * `parseConfig` merges overrides over the source-aware `collect` output; the
 * wrappers below target one source explicitly. All of them share
 * {@link CollectOptions} (env prefix, include/exclude, validation).
 */

import { type ResolveConfigOptions, resolveConfig } from './collect.js';
import type { EnvSource } from './env.js';
import { ConfigParseError } from './errors.js';
import type {
    ConfigSchema,
    ConfigSource,
    ParseConfigOptions,
    ResolvedConfig,
} from './types/index.js';

export { ConfigParseError };

function sourceOptions(
    options: ParseConfigOptions | undefined,
    source: ConfigSource
): ResolveConfigOptions & ParseConfigOptions {
    return {
        ...options,
        source,
        sources: source === 'file' ? [] : [source],
        validate: options?.validate ?? true,
    };
}

/** Parse an env source (`PREFIX_*` vars) into a validated config. */
export function parseEnvConfig<
    P extends ConfigSchema,
    const Options extends ParseConfigOptions = {},
>(schema: P, env?: EnvSource, options?: Options): ResolvedConfig<P, {}, Options> {
    const merged = sourceOptions(options, 'env');
    return resolveConfig<P, {}, Options>(
        schema,
        {
            ...merged,
            envSource: env ?? options?.envSource,
        } as Options,
        undefined
    );
}

/** Parse CLI argv (`--flag value`, `--flag=value`) into a validated config. */
export function parseCliConfig<
    P extends ConfigSchema,
    const Options extends ParseConfigOptions = {},
>(schema: P, argv?: string[], options?: Options): ResolvedConfig<P, {}, Options> {
    const merged = sourceOptions(options, 'cli');
    return resolveConfig<P, {}, Options>(
        schema,
        {
            ...merged,
            argv: argv ?? options?.argv,
        } as Options,
        undefined
    );
}

/**
 * Parse a config from the enabled sources (env + CLI by default, or `source`),
 * merge `overrides` over the result and validate it.
 */
export function parseConfig<P extends ConfigSchema, const Options extends ParseConfigOptions = {}>(
    parser: P,
    input: string[] | undefined,
    options: Options & { source: 'cli' }
): ResolvedConfig<P, {}, Options>;
export function parseConfig<P extends ConfigSchema, const Options extends ParseConfigOptions = {}>(
    parser: P,
    input: EnvSource | undefined,
    options: Options & { source: 'env' }
): ResolvedConfig<P, {}, Options>;
export function parseConfig<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined,
    const Options extends ParseConfigOptions = {},
>(parser: P, overrides?: O, options?: Options): ResolvedConfig<P, O, Options>;
export function parseConfig(
    parser: ConfigSchema,
    input?: unknown,
    options?: ParseConfigOptions
): unknown {
    const source = options?.source;
    let overrides = input as Record<string, any> | null | undefined;
    let envSource = options?.envSource;
    let argv = options?.argv;
    if (source === 'cli') {
        argv = (input as string[] | undefined) ?? argv;
        overrides = undefined;
    } else if (source === 'env') {
        envSource = (input as EnvSource | undefined) ?? envSource;
        overrides = undefined;
    }
    const merged: ResolveConfigOptions & ParseConfigOptions = {
        ...options,
        ...(source ? { source } : {}),
        sources: source === 'file' ? [] : source ? [source] : ['env', 'cli'],
        validate: options?.validate ?? true,
        ...(envSource ? { envSource } : {}),
        ...(argv ? { argv } : {}),
    };
    return resolveConfig(parser as ConfigSchema, merged, overrides);
}

/** Synchronous alias of {@link parseConfig}. */
export function parseConfigSync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined,
    const Options extends ParseConfigOptions = {},
>(parser: P, overrides?: O, options?: Options): ResolvedConfig<P, O, Options> {
    const run = parseConfig as unknown as (
        parser: ConfigSchema,
        overrides?: unknown,
        options?: ParseConfigOptions
    ) => ResolvedConfig<P, O, Options>;
    return run(parser, overrides, options);
}

/** Async alias of {@link parseConfig}, for loaders that produce a promise. */
export async function parseConfigAsync<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined,
    const Options extends ParseConfigOptions = {},
>(
    parser: P,
    overrides?: O | Promise<O>,
    options?: Options
): Promise<ResolvedConfig<P, O, Options>> {
    const run = parseConfig as unknown as (
        parser: ConfigSchema,
        overrides?: unknown,
        options?: ParseConfigOptions
    ) => ResolvedConfig<P, O, Options>;
    return run(parser, await overrides, options);
}

/** Synchronous alias of {@link parseEnvConfig}. */
export function parseEnvConfigSync<
    P extends ConfigSchema,
    const Options extends ParseConfigOptions = {},
>(schema: P, env?: EnvSource, options?: Options): ResolvedConfig<P, {}, Options> {
    const run = parseEnvConfig as unknown as (
        schema: ConfigSchema,
        env?: EnvSource,
        options?: ParseConfigOptions
    ) => ResolvedConfig<P, {}, Options>;
    return run(schema, env, options);
}

/** Async alias of {@link parseEnvConfig}. */
export async function parseEnvConfigAsync<
    P extends ConfigSchema,
    const Options extends ParseConfigOptions = {},
>(
    schema: P,
    env?: EnvSource | Promise<EnvSource>,
    options?: Options
): Promise<ResolvedConfig<P, {}, Options>> {
    const run = parseEnvConfig as unknown as (
        schema: ConfigSchema,
        env?: EnvSource,
        options?: ParseConfigOptions
    ) => ResolvedConfig<P, {}, Options>;
    return run(schema, await env, options);
}

/** Synchronous alias of {@link parseCliConfig}. */
export function parseCliConfigSync<
    P extends ConfigSchema,
    const Options extends ParseConfigOptions = {},
>(schema: P, argv?: string[], options?: Options): ResolvedConfig<P, {}, Options> {
    const run = parseCliConfig as unknown as (
        schema: ConfigSchema,
        argv?: string[],
        options?: ParseConfigOptions
    ) => ResolvedConfig<P, {}, Options>;
    return run(schema, argv, options);
}

/** Async alias of {@link parseCliConfig}. */
export async function parseCliConfigAsync<
    P extends ConfigSchema,
    const Options extends ParseConfigOptions = {},
>(
    schema: P,
    argv?: string[] | Promise<string[]>,
    options?: Options
): Promise<ResolvedConfig<P, {}, Options>> {
    const run = parseCliConfig as unknown as (
        schema: ConfigSchema,
        argv?: string[],
        options?: ParseConfigOptions
    ) => ResolvedConfig<P, {}, Options>;
    return run(schema, await argv, options);
}
