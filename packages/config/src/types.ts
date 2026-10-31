import type { Schema as SchemaType } from 'untyped';
import type { ZodType } from 'zod';

export type ConfigMeta = ConfigBaseMeta & ConfigEnvMeta & ConfigTypeMeta & ConfigCliMeta;

/**
 * The metadata attached to a Zod leaf via `.meta()` to describe the
 * generated config that backs the config value.
 */
export interface ConfigBaseMeta {
    /** Identifier for this config eg. `ToolchainLoggerConfig`.  */
    id?: string;
    /** Human-readable description (added to the generated types' JSDocs, generated .env and markdown files). */
    description?: string;
    /** Whether the var has no safe default and must be set. */
    required?: boolean;
    /** Mark this config as deprecated (`@deprecated` in the generated types). */
    deprecated?: boolean;
    /** Optional deprecation message shown after `@deprecated` / `**Deprecated**`. */
    deprecationMessage?: string;
    /** Add custom example(s) that will be added to the generated documentation. */
    example?: string[] | string;
    /** Version or date this option was introduced (`@since`). */
    since?: string;
    /** Related link(s) for the option (`@see`). */
    see?: string[] | string;
    /** Extra notes shown after the description (`@remarks`). */
    remarks?: string;
    /** Mark the option as experimental (`@experimental`). */
    experimental?: boolean;
    /** Mark the option as alpha (`@alpha`). */
    alpha?: boolean;
    /** Mark the option as beta (`@beta`). */
    beta?: boolean;
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
 * The metadata attached to a Zod leaf via `.meta()` to describe the
 * generated environment variable that backs the config value.
 */
export interface ConfigEnvMeta {
    /** The env var name, e.g. `MYAPP_AUTH_PASSWORD` (optional for non-env configs). */
    envName?: string;
    /**
     * The env var name, e.g. `MYAPP_AUTH_PASSWORD` (optional for non-env configs).
     * @deprecated use `envName` instead.
     */
    env?: string;
    /** Use a different dotted config path, e.g. `auth.password` instead of the resolved one. */
    envPath?: string;
    /**
     * Use a different dotted config path, e.g. `auth.password` instead of the resolved one.
     * @deprecated use `envPath` instead.
     */
    path?: string;
}

/**
 * The metadata attached to a Zod leaf via `.meta()` to describe the
 * generated type that backs the config value.
 */
export interface ConfigTypeMeta {
    /**
     * The generated type/interface name eg. `ToolchainTsconfigConfig`.
     *
     * Defaults to the zod schema's `.meta({ id: <value> })` ({@link ConfigBaseMeta.id})
     * and falls back to `<PascalScope>Config`.
     */
    typeName?: string;
}

/**
 * The metadata attached to a Zod leaf via `.meta()` to describe the
 * generated cli flag that backs the config value.
 */
export interface ConfigCliMeta {
    /** Use a different CLI flag, e.g. CLI flag, e.g. `--base-url` instead of the resolved one. */
    cliFlag?: string;
    /** Shorthand CLI flag, e.g. `-u`. */
    cliFlagShort?: string;
}

/** The value type a config value resolves to. */
export type ConfigValueType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/** A collected config definition (env/cli metadata is optional). */
export interface ConfigDef {
    /** The env var name, when the value is env-backed. */
    name?: string;
    /** The dotted config path. */
    path: string;
    /** The CLI flag, when the value is CLI-backed or derives from an env var. */
    cliFlag?: string;
    description?: string;
    default?: unknown;
    required?: boolean;
    secret?: boolean;
    public?: boolean;
    scope: string;
    type?: ConfigValueType;
    /** The raw config metadata attached to the schema leaf. */
    meta?: ConfigMeta;
}

/**
 * The schema's object key that holds the config fields.
 */
export type ConfigGroup = 'base' | (string & {}) | ConfigGroup[];

/** A config scope. */
export type ConfigScope = string;

/** A resolved untyped schema carrying the toolchain's config metadata. */
export type ConfigSchemaType = SchemaType & ConfigMeta;

/** A Zod schema or a resolved untyped schema. */
export type ConfigSchemaInput = ZodType | ConfigSchemaType;

/** A single schema, a list of schemas, or scoped schemas keyed by scope name. */
export type ConfigSchema<Scope extends ConfigScope = ConfigScope> =
    | ConfigSchemaInput
    | ConfigSchemaInput[]
    | Record<Scope, ConfigSchemaInput | ConfigSchemaInput[]>;

/** Normalized schemas, keyed by scope name. */
export type ConfigSchemaMap = Record<string, ConfigSchemaType>;

/** The scopes registered with an engine, keyed by scope name. */
export type ConfigScopes = Record<string, ConfigSchema | ConfigSchema[]>;

/**
 * Flatten the schema by `n` levels.
 *
 * - When `true` the `baseGroup` will be ignored
 * and the schema will flatten all top-level keys (for objects).
 *
 *  - When defined as `{ level: <number> }` the `baseGroup` will be ignored
 * and the schema will flatten keys `n` levels deep (for objects).
 *
 *  - When defined as `{ maxDepth: <number> }` the `baseGroup` will be ignored
 * and the schema will flatten keys `n` levels deep and stops at `maxDepth` (for objects).
 */
export type ConfigEngineFlatten =
    | boolean
    | { level: number; maxDepth?: never }
    | { maxDepth: number; level?: never };

/** Options shared by every generator. */
export interface ConfigEngineOptions {
    /** The scopes to walk, keyed by scope name (eg. `{ server, frontend, cli }`). */
    schema: ConfigSchema;
    /** The env-var prefix (eg. `MYAPP_`). Kept as a replacement token in code. */
    envPrefix?: string;
    /**
     * The schema's object key that holds the "flat" base config fields, hoisted out of
     * the nested groups in the generated types/docs (default `base`).
     */
    baseGroup?: ConfigGroup;
    /**
     * Flattens the schema by `n` levels.
     *
     * - When `true` the `baseGroup` will be ignored
     * and the schema will flatten all top-level keys (for objects).
     *
     *  - When defined as `{ level: <number> }` the `baseGroup` will be ignored
     * and the schema will flatten keys `n` levels deep (for objects).
     */
    flatten?: boolean | { level: number; maxLevel?: never } | { maxLevel: number; level?: never };
    /** The monorepo/project root used for default output paths. */
    root?: string;
    /**
     * Custom env-name -> dotted-path derivation for leaves without an explicit
     * `path` (eg. to handle dual `PREFIX_`/`VITE_` prefixes).
     */
    envPathOf?: (env: string) => string;
}
