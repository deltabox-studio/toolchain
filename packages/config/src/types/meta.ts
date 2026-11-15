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
    /**
     * A hand-written TypeScript type for values JSON Schema cannot express
     * (functions/callbacks). Emitted in generated types and markdown.
     */
    tsType?: string;
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
