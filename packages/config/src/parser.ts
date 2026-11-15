/**
 * Parse a configuration value from a file object, an env source or CLI args
 * into a validated config.
 *
 * `parseConfig` is the source-aware entry point; the wrappers below target one
 * source explicitly. All of them share {@link CollectOptions} (env prefix,
 * include/exclude, validation) and the same Zod validation at the end.
 */

import type { ZodType } from 'zod';

import { type CollectOptions, collect, pathOf } from './collect.js';
import { parseEnvTree, readEnvPath } from './env.js';
import { isZodSchema } from './schema.js';
import type { ConfigDef, ConfigSchema } from './types/index.js';

/** The value source `parseConfig` understands. */
export type ConfigSource = 'file' | 'env' | 'cli';

/** A validation problem raised by {@link parseConfig}. */
export class ConfigParseError extends Error {
    /** The schema issues / collected problems, when available. */
    readonly issues: unknown[];

    constructor(message: string, issues: unknown[] = []) {
        super(message);
        this.name = 'ConfigParseError';
        this.issues = issues;
    }
}

/** Options for {@link parseConfig} and the per-source wrappers. */
export interface ParseConfigOptions extends CollectOptions {
    /** The input source (default `file`). */
    source?: ConfigSource;
    /** The CLI argv to parse when `source: 'cli'` (default `process.argv`). */
    argv?: string[];
    /** The env source when `source: 'env'` (default `process.env`). */
    envSource?: Record<string, string | undefined>;
}

/** Coerce an env/CLI string into the definition's declared type. */
function coerce(value: string, def: ConfigDef): unknown {
    switch (def.type) {
        case 'boolean': {
            const normalized = value.trim().toLowerCase();
            if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
            if (['false', '0', 'no', 'off'].includes(normalized)) return false;
            return value;
        }
        case 'number': {
            const number = Number(value);
            return Number.isFinite(number) ? number : value;
        }
        case 'array':
            return value
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
        default:
            return value;
    }
}

/** Assign a dotted path into a nested object. */
function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.').filter(Boolean);
    let node = target;
    for (const part of parts.slice(0, -1)) {
        const next = node[part];
        if (typeof next !== 'object' || next === null) node[part] = {};
        node = node[part] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (last !== undefined) node[last] = value;
}

/** Validate the built config with the consumer's Zod schema. */
function validate<T>(schema: ZodType<T> | undefined, value: unknown): T {
    if (!schema) return value as T;
    const result = schema.safeParse(value);
    if (!result.success) {
        const issues = result.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));
        throw new ConfigParseError(
            `Invalid config:\n${issues.map(issue => `  - ${issue.path}: ${issue.message}`).join('\n')}`,
            issues
        );
    }
    return result.data;
}

/** Build a config object from env/CLI definitions. */
function buildFromDefs(
    defs: ConfigDef[],
    read: (def: ConfigDef) => string | undefined
): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    for (const def of defs) {
        const raw = read(def);
        if (raw !== undefined) {
            setPath(config, pathOf(def), coerce(raw, def));
            continue;
        }
        // Seed the schema's own defaults so `schema.parse` sees the same shape
        // an explicit env/CLI value would produce (secrets stay unset).
        if (def.default !== undefined && !def.secret) {
            setPath(config, pathOf(def), def.default);
        }
    }
    return config;
}

/** Parse an env source (`PREFIX_*` vars) into a config. */
export function parseEnvConfig<T>(
    schema: ZodType<T>,
    env?: Record<string, string | undefined>,
    options?: ParseConfigOptions
): T;
export function parseEnvConfig<T = Record<string, unknown>>(
    schema: ConfigSchema,
    env?: Record<string, string | undefined>,
    options?: ParseConfigOptions & { schema?: ZodType<T> }
): T;
export function parseEnvConfig<T = Record<string, unknown>>(
    schema: ConfigSchema,
    env: Record<string, string | undefined> = process.env,
    options: ParseConfigOptions & { schema?: ZodType<T> } = {}
): T {
    const prefix = options.envPrefix === null ? '' : (options.envPrefix ?? 'APP_');
    const tree = parseEnvTree(env, prefix);
    const defs = collect(schema, options);
    const value = buildFromDefs(defs, def => {
        // The env var name is the source of truth; the dotted path only shapes
        // the resulting object (it needn't match the env var's segment order).
        if (def.name && env[def.name] !== undefined) return env[def.name];
        return readEnvPath(tree, def.meta?.envPath ?? def.meta?.path ?? def.path) as
            | string
            | undefined;
    });
    return validate(
        options.schema ?? (isZodSchema(schema) ? (schema as unknown as ZodType<T>) : undefined),
        value
    );
}

/** Parse CLI argv (`--flag value`, `--flag=value`) into a config. */
export function parseCliConfig<T>(
    schema: ZodType<T>,
    argv?: string[],
    options?: ParseConfigOptions
): T;
export function parseCliConfig<T = Record<string, unknown>>(
    schema: ConfigSchema,
    argv?: string[],
    options?: ParseConfigOptions & { schema?: ZodType<T> }
): T;
export function parseCliConfig<T = Record<string, unknown>>(
    schema: ConfigSchema,
    argv: string[] = process.argv.slice(2),
    options: ParseConfigOptions & { schema?: ZodType<T> } = {}
): T {
    const defs = collect(schema, options).filter(def => def.name || def.cliFlag);
    const byFlag = new Map<string, ConfigDef>();
    for (const def of defs) {
        const long =
            def.cliFlag ?? (def.name ? `--${def.name.toLowerCase().replace(/_/g, '-')}` : '');
        if (long) byFlag.set(long, def);
        const short = def.meta?.cliFlagShort;
        if (short) byFlag.set(short.startsWith('-') ? short : `-${short}`, def);
    }
    const values = new Map<ConfigDef, string[]>();
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index]!;
        if (!token.startsWith('-')) continue;
        const [flag, inline] = token.includes('=') ? token.split('=', 2) : [token, undefined];
        const def = flag ? byFlag.get(flag) : undefined;
        if (!def) continue;
        const next = argv[index + 1];
        const value = inline ?? (next !== undefined && !next.startsWith('-') ? next : 'true');
        if (inline === undefined && value !== 'true') index += 1;
        values.set(def, [...(values.get(def) ?? []), value]);
    }
    const config: Record<string, unknown> = {};
    for (const [def, list] of values) {
        const value =
            def.type === 'array' && list.length > 1 ? list : coerce(list[list.length - 1]!, def);
        setPath(config, pathOf(def), value);
    }
    return validate(
        options.schema ?? (isZodSchema(schema) ? (schema as unknown as ZodType<T>) : undefined),
        config
    );
}

/** Parse a config value from `source` (default `file`) and validate it. */
export function parseConfig<T = unknown>(
    schema: ZodType<T>,
    input: unknown,
    options: ParseConfigOptions = {}
): T {
    if (options.source === 'env') {
        return parseEnvConfig(schema as unknown as ConfigSchema, input as Record<string, string>, {
            ...options,
            schema,
        });
    }
    if (options.source === 'cli') {
        return parseCliConfig(schema as unknown as ConfigSchema, (input as string[]) ?? [], {
            ...options,
            schema,
        });
    }
    return validate(schema, input);
}

/** Synchronous alias of {@link parseConfig} (file objects are already resolved). */
export function parseConfigSync<T = unknown>(
    schema: ZodType<T>,
    input: unknown,
    options: ParseConfigOptions = {}
): T {
    return parseConfig(schema, input, options);
}

/** Async alias of {@link parseConfig}, for loaders that produce a promise. */
export async function parseConfigAsync<T = unknown>(
    schema: ZodType<T>,
    input: unknown,
    options: ParseConfigOptions = {}
): Promise<T> {
    return parseConfig(schema, await input, options);
}
