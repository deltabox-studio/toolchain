/**
 * Config collection: walks any supported config schema (Zod or untyped) and
 * collects every leaf plus its `.meta()` env/cli/type metadata. This drives the
 * `.env` file, types, docs, JSON metadata and CLI option generators.
 */

import type { Schema } from 'untyped';
import type { ZodType } from 'zod';

import { parseEnvTree, readEnvPath } from './env.js';
import { isZodSchema, metaOf, normalizeConfigSchema } from './schema.js';
import type { ConfigDef, ConfigSchema, ConfigValueType } from './types/index.js';

/** The default env-var prefix used when none is configured. */
export const DEFAULT_ENV_PREFIX = 'APP_';

/** The validation problems {@link CollectOptions.validate} can report. */
export type CollectTrigger = 'missing-required' | 'empty-value';

/** How validation problems are reported. */
export interface CollectErrorOptions {
    /** How to report a problem (default `warn`). `throw` raises an Error. */
    level?: 'warn' | 'error' | 'throw';
    /** Sinks for `warn`/`error` (default `console`). */
    logger?: {
        warn?: (message: string) => void;
        error?: (message: string) => void;
    };
    /** Rewrite the problem message (wins over `defaultMessage`). */
    rewriteMessage?: (message: string, def: ConfigDef) => string;
    /** Build the problem message when no `rewriteMessage` is set. */
    defaultMessage?: (def: ConfigDef) => string;
    /** The problems to report (default: every trigger). */
    triggers?: CollectTrigger[];
}

/** A path filter: a glob/list of globs, or a predicate on the definition. */
export type CollectFilter = string | string[] | ((def: ConfigDef) => boolean);

/** Options for {@link collect}. */
export interface CollectOptions {
    /** The env-var prefix (default {@link DEFAULT_ENV_PREFIX}); `null` disables it. */
    envPrefix?: string | null;
    /**
     * Custom env-name -> dotted-path derivation, used when a leaf does not set
     * an explicit `envPath` (eg. to handle dual `PROXIFIED_`/`VITE_` prefixes).
     */
    envPathOf?: (env: string) => string;
    /** Maximum schema nesting depth to walk (default: unlimited). */
    maxDepth?: number;
    /** Only keep these config paths (a glob/list of globs or a predicate). */
    include?: CollectFilter;
    /** Drop these config paths (a glob/list of globs or a predicate). */
    exclude?: CollectFilter;
    /** A flat env source used by {@link CollectOptions.validate}. */
    envSource?: Record<string, string | undefined>;
    /** Validate the collected definitions against `envSource`. */
    validate?: boolean;
    /** How validation problems are reported. */
    errorOptions?: CollectErrorOptions;
    /** An optional narrowing predicate applied after the include/exclude filters. */
    filter?: (def: ConfigDef) => boolean;
}

/** A narrowed collection: `filter` both selects and types the definitions. */
export interface CollectNarrowOptions<T extends ConfigDef> extends CollectOptions {
    filter: (def: ConfigDef) => def is T;
}

function normalizeJsonType(type: unknown): ConfigValueType | undefined {
    const candidates = Array.isArray(type) ? type : [type];
    if (candidates.includes('array')) return 'array';
    if (candidates.includes('object')) return 'object';
    if (candidates.includes('boolean')) return 'boolean';
    if (candidates.includes('number') || candidates.includes('integer')) return 'number';
    if (candidates.includes('string')) return 'string';
    return undefined;
}

function schemaChildren(schema: ZodType | Schema): Record<string, ZodType | Schema> | undefined {
    if (isZodSchema(schema)) {
        return (schema as ZodType & { shape?: Record<string, ZodType> }).shape;
    }
    return (schema as Schema).properties as Record<string, Schema> | undefined;
}

function schemaType(schema: ZodType | Schema): ConfigValueType | undefined {
    if (isZodSchema(schema)) {
        try {
            const json = schema.toJSONSchema() as { type?: unknown };
            return normalizeJsonType(json.type);
        } catch {
            return undefined;
        }
    }
    return normalizeJsonType((schema as Schema).type);
}

function schemaDefault(schema: ZodType | Schema): unknown {
    if (isZodSchema(schema)) {
        try {
            return (schema.toJSONSchema() as { default?: unknown }).default;
        } catch {
            return undefined;
        }
    }
    return (schema as Schema).default;
}

function defaultFromChildren(children: Record<string, ZodType | Schema>): unknown {
    const entries = Object.entries(children)
        .map(([key, child]) => [key, schemaDefault(child)] as const)
        .filter(([, value]) => value !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Convert a simple `*`/`**` glob to a regular expression. */
function globToRegExp(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const source = escaped
        .replace(/\*\*/g, '\u0000')
        .replace(/\*/g, '[^.]*')
        .replace(/\u0000/g, '.*');
    return new RegExp(`^${source}$`);
}

function matchesFilter(def: ConfigDef, filter: CollectFilter | undefined): boolean {
    if (filter === undefined) return true;
    if (typeof filter === 'function') return filter(def);
    const patterns = Array.isArray(filter) ? filter : [filter];
    return patterns.some(pattern => globToRegExp(pattern).test(pathOf(def)));
}

function walkSchema(
    schema: ZodType | Schema,
    out: ConfigDef[],
    scope: string,
    envPrefix: string,
    options: CollectOptions,
    pathParts: string[] = []
): void {
    const depth = pathParts.length;
    if (options.maxDepth !== undefined && depth > options.maxDepth) return;
    const meta = metaOf(schema);
    const children = schemaChildren(schema);
    const envName = meta?.envName ?? meta?.env;
    const path =
        meta?.envPath ??
        meta?.path ??
        (envName ? options.envPathOf?.(envName) : undefined) ??
        pathParts.join('.');
    const cliFlag =
        meta?.cliFlag ??
        (envName
            ? `--${envName
                  .slice(envName.startsWith(envPrefix) ? envPrefix.length : 0)
                  .toLowerCase()
                  .replace(/_/g, '-')}`
            : undefined);
    const fallbackDefault = children ? defaultFromChildren(children) : undefined;
    const fallbackType = children ? 'object' : schemaType(schema);

    if (!children || envName || meta?.cliFlag) {
        const def: ConfigDef = {
            path: path || (meta?.id ?? 'config'),
            ...(envName ? { name: envName } : {}),
            ...(cliFlag ? { cliFlag } : {}),
            ...(meta?.description ? { description: meta.description } : {}),
            ...(schemaDefault(schema) !== undefined
                ? { default: schemaDefault(schema) }
                : fallbackDefault !== undefined
                  ? { default: fallbackDefault }
                  : {}),
            ...(meta?.required ? { required: true } : {}),
            ...(meta?.secret ? { secret: true } : {}),
            ...(meta?.public ? { public: true } : {}),
            ...(meta?.scope ? { scope: meta.scope } : { scope }),
            ...(fallbackType ? { type: fallbackType } : {}),
            ...(meta ? { meta } : {}),
        };
        const included = options.include === undefined || matchesFilter(def, options.include);
        const excluded = options.exclude !== undefined && matchesFilter(def, options.exclude);
        if (included && !excluded) out.push(def);
    }
    if (!children) return;
    for (const [key, child] of Object.entries(children)) {
        walkSchema(child, out, scope, envPrefix, options, [...pathParts, key]);
    }
}

function report(message: string, def: ConfigDef, options: CollectOptions): void {
    const errors = options.errorOptions ?? {};
    const text = errors.rewriteMessage?.(message, def) ?? errors.defaultMessage?.(def) ?? message;
    const level = errors.level ?? 'warn';
    if (level === 'throw') throw new Error(text);
    if (level === 'error') (errors.logger?.error ?? console.error)(text);
    else (errors.logger?.warn ?? console.warn)(text);
}

function validateCollected(defs: ConfigDef[], options: CollectOptions): void {
    if (options.validate !== true) return;
    const triggers = new Set<CollectTrigger>(
        options.errorOptions?.triggers ?? ['missing-required', 'empty-value']
    );
    const tree = parseEnvTree(options.envSource ?? {}, options.envPrefix ?? DEFAULT_ENV_PREFIX);
    for (const def of defs) {
        if (!def.name) continue;
        const value = readEnvPath(tree, def.meta?.envPath ?? def.meta?.path ?? def.path);
        if (value === undefined && def.required && triggers.has('missing-required')) {
            report(`Missing required config \`${def.path}\` (${def.name}).`, def, options);
        }
        if (typeof value === 'string' && value.trim() === '' && triggers.has('empty-value')) {
            report(`Empty config value for \`${def.path}\` (${def.name}).`, def, options);
        }
    }
}

/** Collect every config leaf from scoped schemas. */
export function collect(schema: ConfigSchema, options?: CollectOptions): ConfigDef[];
export function collect<T extends ConfigDef>(
    schema: ConfigSchema,
    options: CollectNarrowOptions<T>
): T[];
export function collect(schema: ConfigSchema, options: CollectOptions = {}): ConfigDef[] {
    const envPrefix = options.envPrefix === null ? '' : (options.envPrefix ?? DEFAULT_ENV_PREFIX);
    const scopes = normalizeConfigSchema(schema);
    const out: ConfigDef[] = [];
    for (const [scopeName, scopeSchema] of Object.entries(scopes)) {
        const before = out.length;
        walkSchema(scopeSchema, out, scopeName, envPrefix, options);
        for (let i = before; i < out.length; i++) {
            if (!out[i]!.scope || out[i]!.scope === 'default') out[i]!.scope = scopeName;
        }
    }
    // Two leaves may declare the same env name; keep the first so generated
    // interfaces/env files do not contain duplicate members.
    const seen = new Set<string>();
    const unique = out.filter(def => {
        if (!def.name) return true;
        if (seen.has(def.name)) return false;
        seen.add(def.name);
        return true;
    });
    const filtered = options.filter === undefined ? unique : unique.filter(options.filter);
    validateCollected(filtered, options);
    return filtered;
}

/** Collect the config paths marked `required` for a scope. */
export function collectRequired(
    schema: ConfigSchema,
    scope?: string,
    options: CollectOptions = {}
): ConfigDef[] {
    return collect(schema, options).filter(
        def => def.required && (scope === undefined || def.scope === scope)
    );
}

/** Normalize a config path for the collected definitions. */
export function pathOf(def: ConfigDef): string {
    return def.meta?.envPath ?? def.meta?.path ?? def.path;
}
