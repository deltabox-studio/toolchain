import type { CliArgument } from '@deltabox/toolchain/shared';

import type { ConfigValueType } from './definition.js';

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
    /**
     * Whether this value may be read from / documented as an environment
     * variable. Set `false` to keep a CLI-only value out of the generated env
     * reference and the runtime env collector.
     * @default true
     */
    envExpose?: boolean;
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
 * Normalized metadata for one config-backed CLI option.
 *
 * Every field is optional: unset values are derived from the schema (the
 * dotted path, the value type, its default and description) or the legacy
 * `cliFlag` / `cliFlagShort` aliases.
 */
export interface ConfigCliOptionMeta {
    /** The long flag, e.g. `--base-url` (defaults to the kebab-case config path). */
    flag?: string;
    /** The shorthand flag, e.g. `-u`. */
    short?: string;
    /** Human-readable description (defaults to the schema `.describe()`). */
    description?: string;
    /** The value type, when the schema is an ambiguous union/array. */
    type?: ConfigValueType | 'boolean' | (string & {});
    /** Coerce one raw CLI string into the config value (overrides the type). */
    parse?: (value: string) => unknown;
    /** The resolved default value shown in help/docs. */
    default?: unknown;
    /** Allowed values, when the schema is an enum. */
    choices?: readonly string[];
    /** Collect repeated occurrences into an array (`--tag a --tag b`). */
    multiple?: boolean;
    /** Whether the config value is required. */
    required?: boolean;
    /** Keep the option registered but out of the generated docs. */
    hidden?: boolean;
}

/**
 * Metadata for a config scope exposed as a CLI command (the object/scope
 * schema carries it). `false` opts the scope out of automatic command
 * generation.
 */
export interface ConfigCliCommandMeta {
    /** The command name (defaults to the schema scope key). */
    name?: string;
    /** Human-readable description (defaults to the scope `.describe()`). */
    description?: string;
    /** Command aliases registered by the CLI. */
    aliases?: readonly string[];
    /** Keep the command registered but out of the generated docs. */
    hidden?: boolean;
    /** Forward unknown options/operands (provider passthroughs). */
    passthrough?: boolean;
    /** Positional arguments the command accepts. */
    args?: readonly CliArgument[];
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
    /**
     * Normalized CLI option metadata. `false` prunes this field (and its
     * subtree) from generated CLI options; it does not hide the value from the
     * env/types/docs generators.
     */
    cli?: false | ConfigCliOptionMeta;
    /** Command metadata for object/scope schemas; `false` opts the scope out. */
    cliCommand?: false | ConfigCliCommandMeta;
}
