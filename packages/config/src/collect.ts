/**
 * Env-var collection: walks the Zod config schemas (the single source of truth)
 * and collects every prefixed leaf with its metadata. This drives `.env`
 * generation, the env type files, the config metadata JSON and the JSON Schema.
 */

import type { ZodType } from 'zod';

import { envMetaOf } from './schema.js';
import { type ConfigScopes, type EnvValueType, type EnvVarDef, envPathOf } from './types.js';

/** The default env-var prefix used when none is configured. */
export const DEFAULT_ENV_PREFIX = 'APP_';

/** Options for {@link collectEnvVars}. */
export interface CollectEnvVarsOptions {
    /**
     * Custom env-name -> dotted-path derivation, used when a leaf does not set
     * an explicit `path` (eg. to handle dual `PROXIFIED_`/`VITE_` prefixes).
     */
    envPathOf?: (env: string) => string;
}

function normalizeJsonType(type: unknown): EnvValueType | undefined {
    const candidates = Array.isArray(type) ? type : [type];
    if (candidates.includes('array')) return 'array';
    if (candidates.includes('object')) return 'object';
    if (candidates.includes('boolean')) return 'boolean';
    if (candidates.includes('number')) return 'number';
    if (candidates.includes('string')) return 'string';
    return undefined;
}

function walkEnvSchema(
    schema: ZodType,
    out: EnvVarDef[],
    envPrefix: string,
    options: CollectEnvVarsOptions
): void {
    const meta = envMetaOf(schema);
    if (meta?.env) {
        let jsonSchema: { default?: unknown; type?: unknown } | undefined;
        try {
            jsonSchema = (schema as ZodType & { toJSONSchema?: () => unknown }).toJSONSchema?.() as
                | { default?: unknown; type?: unknown }
                | undefined;
        } catch {
            // leaf types that can't be lowered to JSON Schema keep no default/type
        }
        out.push({
            name: meta.env,
            path: meta.path ?? options.envPathOf?.(meta.env) ?? envPathOf(meta.env, envPrefix),
            ...(meta.description ? { description: meta.description } : {}),
            ...(jsonSchema?.default !== undefined ? { default: jsonSchema.default } : {}),
            ...(meta.required ? { required: true } : {}),
            ...(meta.secret ? { secret: true } : {}),
            scope: meta.scope ?? 'default',
            ...(meta.public ? { public: true } : {}),
            ...(normalizeJsonType(jsonSchema?.type)
                ? { envType: normalizeJsonType(jsonSchema?.type) }
                : {}),
        });
        return;
    }
    const shape = (schema as ZodType & { shape?: Record<string, ZodType> }).shape;
    if (!shape) return;
    for (const child of Object.values(shape)) walkEnvSchema(child, out, envPrefix, options);
}

/** Collect every env-var-backed leaf from the scope schemas. */
export function collectEnvVars(
    scopes: ConfigScopes,
    envPrefix = DEFAULT_ENV_PREFIX,
    options: CollectEnvVarsOptions = {}
): EnvVarDef[] {
    const out: EnvVarDef[] = [];
    for (const [scopeName, scope] of Object.entries(scopes)) {
        const before = out.length;
        walkEnvSchema(scope.zodSchema, out, envPrefix, options);
        // Default the scope on leaves that didn't declare one.
        for (let i = before; i < out.length; i++) {
            if (!out[i]!.scope || out[i]!.scope === 'default') out[i]!.scope = scopeName;
        }
    }
    return out;
}

/** Collect the env var names marked `required` for a scope. */
export function collectRequiredEnvVars(
    scopes: ConfigScopes,
    scope: string,
    envPrefix = DEFAULT_ENV_PREFIX,
    options: CollectEnvVarsOptions = {}
): string[] {
    return collectEnvVars(scopes, envPrefix, options)
        .filter(def => def.scope === scope && def.required)
        .map(def => def.name);
}
