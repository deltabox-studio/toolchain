/**
 * Parse a configuration value from a file object, an env source or CLI args
 * into a validated config.
 *
 * `parseConfig` is the source-aware entry point; the wrappers below target one
 * source explicitly. All of them share {@link CollectOptions} (env prefix,
 * include/exclude, validation) and the same Zod validation at the end.
 */

import type { ZodType } from 'zod';

import { type CollectFilter, type CollectOptions, collect, pathOf } from './collect.js';
import { parseEnvTree, readEnvPath } from './env.js';
import { isSchemaType, isZodSchema } from './schema.js';
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

/** A collected definition plus the schema scope it came from. */
interface ParsedDef {
    def: ConfigDef;
    scope?: string;
}

/** Whether the schema is a scope map (`{ server, client }`) rather than one schema. */
function isScopedSchema(schema: ConfigSchema): boolean {
    return !Array.isArray(schema) && !isZodSchema(schema) && !isSchemaType(schema);
}

/**
 * Rewrite an include/exclude filter for one scope: scoped patterns such as
 * `server.port` become `port`, and patterns for another scope are dropped.
 * Predicate filters see the scope-qualified path.
 */
function scopeFilter(
    filter: CollectFilter | undefined,
    scope: string,
    scopes: string[]
): CollectFilter | undefined {
    if (filter === undefined) return undefined;
    if (typeof filter === 'function') {
        return def => filter({ ...def, path: `${scope}.${pathOf(def)}` });
    }
    const patterns = Array.isArray(filter) ? filter : [filter];
    const kept: string[] = [];
    for (const pattern of patterns) {
        if (scopes.some(other => other !== scope && pattern.startsWith(`${other}.`))) continue;
        kept.push(pattern.startsWith(`${scope}.`) ? pattern.slice(scope.length + 1) : pattern);
    }
    return kept;
}

/** Collect definitions while preserving each schema scope (meta.scope also kept). */
function collectScoped(schema: ConfigSchema, options: CollectOptions): ParsedDef[] {
    if (!isScopedSchema(schema)) return collect(schema, options).map(def => ({ def }));
    const entries = Object.entries(schema as Record<string, ConfigSchema>);
    const scopes = entries.map(([scope]) => scope);
    return entries.flatMap(([scope, value]) =>
        collect(value, {
            ...options,
            include: scopeFilter(options.include, scope, scopes),
            exclude: scopeFilter(options.exclude, scope, scopes),
        }).map(def => ({ def, scope }))
    );
}

/** Write a definition's dotted path under its schema scope (as a literal key). */
function setPathInScope(target: Record<string, unknown>, entry: ParsedDef, value: unknown): void {
    const path = pathOf(entry.def);
    if (!entry.scope) {
        setPath(target, path, value);
        return;
    }
    const current = target[entry.scope];
    if (typeof current !== 'object' || current === null) target[entry.scope] = {};
    setPath(target[entry.scope] as Record<string, unknown>, path, value);
}

/** Build a config object from env/CLI definitions (nesting scoped schemas). */
function buildFromDefs(
    entries: ParsedDef[],
    read: (entry: ParsedDef) => string | undefined
): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    for (const entry of entries) {
        const { def } = entry;
        const readValue = read(entry);
        // A blank env/CLI value means "unset" so schema defaults (and required
        // validation) behave consistently across types.
        const raw =
            typeof readValue === 'string' && readValue.trim() === '' ? undefined : readValue;
        if (raw !== undefined) {
            setPathInScope(config, entry, coerce(raw, def));
            continue;
        }
        // Seed the schema's own defaults so `schema.parse` sees the same shape
        // an explicit env/CLI value would produce (secrets stay unset).
        if (def.default !== undefined && !def.secret) {
            setPathInScope(config, entry, def.default);
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
    env?: Record<string, string | undefined>,
    options: ParseConfigOptions & { schema?: ZodType<T> } = {}
): T {
    const source = env ?? options.envSource ?? process.env;
    const prefix = options.envPrefix === null ? '' : (options.envPrefix ?? 'APP_');
    const tree = parseEnvTree(source, prefix);
    // Validate against the env source actually being parsed, not a stale option.
    const entries = collectScoped(schema, {
        ...options,
        envSource: source,
    } as CollectOptions);
    const value = buildFromDefs(entries, ({ def }) => {
        // The env var name is the source of truth; the dotted path only
        // shapes the object (it needn't match the env var's segments).
        if (def.name && source[def.name] !== undefined) return source[def.name];
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
    const entries = collectScoped(schema, options).filter(
        entry => entry.def.name || entry.def.cliFlag
    );
    // A flag may be shared by several scopes; keep every target so one value
    // feeds all of them (env parsing behaves the same way).
    const byFlag = new Map<string, ParsedDef[]>();
    const addFlag = (flag: string, entry: ParsedDef): void => {
        const current = byFlag.get(flag);
        if (current) current.push(entry);
        else byFlag.set(flag, [entry]);
    };
    for (const entry of entries) {
        const def = entry.def;
        const long =
            def.cliFlag ?? (def.name ? `--${def.name.toLowerCase().replace(/_/g, '-')}` : '');
        if (long) addFlag(long, entry);
        const short = def.meta?.cliFlagShort;
        if (short) addFlag(short.startsWith('-') ? short : `-${short}`, entry);
    }
    const values = new Map<ParsedDef, string[]>();
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index]!;
        if (token === '--') break;
        if (!token.startsWith('-')) continue;
        const [flag, inline] = token.includes('=') ? token.split('=', 2) : [token, undefined];
        const entriesForFlag = flag ? byFlag.get(flag) : undefined;
        if (!entriesForFlag || entriesForFlag.length === 0) continue;
        const def = entriesForFlag[0]!.def;
        let value = inline;
        if (value === undefined) {
            const next = argv[index + 1];
            const booleanLiteral =
                next !== undefined && /^(?:true|false|1|0|yes|no|on|off)$/i.test(next);
            // Booleans only consume a recognised literal. Numbers may be
            // negative (including `-.5`). Other values consume a token unless
            // it is another option, in which case the value is missing.
            const numeric = next !== undefined && /^-\.?\d/.test(next);
            const takesNext =
                next !== undefined &&
                (def.type === 'boolean' ? booleanLiteral : !next.startsWith('-') || numeric);
            if (def.type === 'boolean') value = takesNext ? next : 'true';
            else if (takesNext) value = next;
            else value = '';
            if (takesNext) index += 1;
        }
        for (const entry of entriesForFlag) {
            values.set(entry, [...(values.get(entry) ?? []), value]);
        }
    }
    const config: Record<string, unknown> = {};
    const seen = new Set<ParsedDef>();
    for (const [entry, list] of values) {
        // Blank values mean "unset", matching the env parser; an array drops
        // blank elements and is unset when nothing remains.
        const cleaned = list.filter(item => item.trim() !== '');
        if (cleaned.length === 0) continue;
        const def = entry.def;
        const value =
            def.type === 'array' && cleaned.length > 1
                ? cleaned
                : coerce(cleaned[cleaned.length - 1]!, def);
        setPathInScope(config, entry, value);
        seen.add(entry);
    }
    for (const entry of entries) {
        if (seen.has(entry)) continue;
        const def = entry.def;
        if (def.default !== undefined && !def.secret) {
            setPathInScope(config, entry, def.default);
        }
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
        const env = (input ?? options.envSource) as Record<string, string> | undefined;
        return parseEnvConfig(schema as unknown as ConfigSchema, env, {
            ...options,
            schema,
        });
    }
    if (options.source === 'cli') {
        const argv = (input as string[] | undefined) ?? options.argv ?? [];
        return parseCliConfig(schema as unknown as ConfigSchema, argv, {
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
