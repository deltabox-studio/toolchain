/**
 * Config collection: walks any supported config schema (Zod or untyped) and
 * collects every leaf plus its `.meta()` env/cli/type metadata. This drives the
 * `.env` file, types, docs, JSON metadata and CLI option generators.
 */

import type { Schema } from 'untyped';
import type { ZodType } from 'zod';

import { isZodSchema, metaOf, normalizeConfigSchema } from './schema.js';
import type { ConfigDef, ConfigSchema, ConfigValueType } from './types.js';

/** The default env-var prefix used when none is configured. */
export const DEFAULT_ENV_PREFIX = 'APP_';

/** Options for {@link collectVars}. */
export interface CollectVarsOptions {
    /**
     * Custom env-name -> dotted-path derivation, used when a leaf does not set
     * an explicit `envPath` (eg. to handle dual `PROXIFIED_`/`VITE_` prefixes).
     */
    envPathOf?: (env: string) => string;
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

function walkSchema(
    schema: ZodType | Schema,
    out: ConfigDef[],
    scope: string,
    envPrefix: string,
    options: CollectVarsOptions,
    pathParts: string[] = []
): void {
    void options;
    const meta = metaOf(schema);
    const children = schemaChildren(schema);
    const path = meta?.envPath ?? meta?.path ?? pathParts.join('.');
    const envName = meta?.envName ?? meta?.env;
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
        out.push({
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
        });
    }
    if (!children) return;
    for (const [key, child] of Object.entries(children)) {
        walkSchema(child, out, scope, envPrefix, options, [...pathParts, key]);
    }
}

/** Collect every config leaf from scoped schemas. */
export function collectVars(
    schema: ConfigSchema,
    envPrefix = DEFAULT_ENV_PREFIX,
    options: CollectVarsOptions = {}
): ConfigDef[] {
    const scopes = normalizeConfigSchema(schema);
    const out: ConfigDef[] = [];
    for (const [scopeName, scopeSchema] of Object.entries(scopes)) {
        const before = out.length;
        walkSchema(scopeSchema, out, scopeName, envPrefix, options);
        for (let i = before; i < out.length; i++) {
            if (!out[i]!.scope || out[i]!.scope === 'default') out[i]!.scope = scopeName;
        }
    }
    return out;
}

/** Collect the config paths marked `required` for a scope. */
export function collectRequired(
    schema: ConfigSchema,
    scope?: string,
    envPrefix = DEFAULT_ENV_PREFIX,
    options: CollectVarsOptions = {}
): ConfigDef[] {
    return collectVars(schema, envPrefix, options).filter(
        def => def.required && (scope === undefined || def.scope === scope)
    );
}

/** Normalize a config path for the collected definitions. */
export function pathOf(def: ConfigDef): string {
    return def.meta?.envPath ?? def.meta?.path ?? def.path;
}
