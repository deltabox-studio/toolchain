import type { Schema } from 'untyped';
import type { ZodType } from 'zod';

export type ConfigMeta = ConfigBaseMeta & ConfigEnvMeta;

export interface ConfigBaseMeta {
    /** Human-readable description (added to the generated types' JSDocs, generated .env and markdown files). */
    description?: string;
    /** Whether the var has no safe default and must be set. */
    required?: boolean;
    /** Mark this config as deprecated (the JSON Schema `deprecated` flag). */
    deprecated?: boolean;
    /** Add custom example(s) that will be added to the generated documentation. */
    example?: string[] | string;
    /** Whether the value is a secret (never emitted/logged). */
    secret?: boolean;
    /** The scope the variable belongs to. */
    scope?: string;
    /** Whether the variable is safe to expose to the browser (frontend). */
    public?: boolean;
    /**
     * The resolved-config default, when it differs from the raw env default
     * (e.g. the positive field behind a negative-named CLI flag).
     */
    defaultValue?: unknown;
}

/**
 * The metadata a consumer attaches to a Zod leaf via `.meta()` to describe the
 * environment variable that backs a configuration value.
 */
export interface ConfigEnvMeta {
    /** The env var name, e.g. `MYAPP_AUTH_PASSWORD` (optional for non-env configs). */
    env?: string;
    /** The dotted config path, e.g. `auth.password`. */
    path?: string;
}

/** The value type an env var resolves to. */
export type EnvValueType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/** A collected env-var definition. */
export interface EnvVarDef {
    name: string;
    path: string;
    description?: string;
    default?: unknown;
    required?: boolean;
    secret?: boolean;
    public?: boolean;
    scope: string;
    envType?: EnvValueType;
}

/** One configuration scope: its Zod schema and an optional resolved schema. */
export interface ConfigScopeDef {
    /** The Zod schema (the single source of truth). */
    zodSchema: ZodType;
    /** A pre-resolved untyped schema (resolved from the Zod schema if omitted). */
    jsonSchema?: Schema;
}

/** The scopes registered with an engine, keyed by scope name. */
export type ConfigScopes = Record<string, ConfigScopeDef>;

/** Options shared by every generator. */
export interface ConfigEngineOptions {
    /** The scopes to walk, keyed by scope name (eg. `{ server, frontend, cli }`). */
    scopes: ConfigScopes;
    /** The env-var prefix (eg. `MYAPP_`). Kept as a replacement token in code. */
    envPrefix?: string;
    /**
     * The object key that holds the "flat" base config fields, hoisted out of
     * the nested groups in the generated types/docs (default `base`).
     */
    baseGroup?: string;
    /** The monorepo/project root used for default output paths. */
    root?: string;
    /**
     * Custom env-name -> dotted-path derivation for leaves without an explicit
     * `path` (eg. to handle dual `PREFIX_`/`VITE_` prefixes).
     */
    envPathOf?: (env: string) => string;
}

/** Derive the dotted config path from an env var name + prefix. */
export function envPathOf(env: string, prefix = 'APP_'): string {
    return env
        .slice(env.startsWith(prefix) ? prefix.length : 0)
        .toLowerCase()
        .replace(/_/g, '.');
}
