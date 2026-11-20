import type { ParseArgsOptionsConfig } from 'node:util';

import type {
    ToolchainArgument,
    ToolchainCommandContext,
    ToolchainOption,
} from '@deltabox/toolchain/shared';

import type { CollectOptions, ParseConfigOptions } from './collect.js';
import type { ConfigValueType } from './definition.js';
import type { ConfigMeta } from './meta.js';
import type { ConfigSchema } from './schema.js';

/** Flag-shaping options shared by every CLI helper. */
export interface CliFlagOptions {
    /** The env-var prefix. @default "APP_" */
    envPrefix?: string;
    /** Shorthand flags keyed by env var name (eg. `{ APP_TOKEN: 't' }`). */
    shortFlags?: Record<string, string>;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectOptions['envPathOf'];
}

/** A generated CLI option definition. */
export interface CliOptionDef {
    /** CLI flag, e.g. `--base-url`. */
    flag: string;
    /** Shorthand flag, e.g. `-u`. */
    short?: string;
    /** The env var the flag reads, e.g. `APP_CLI_BASE_URL`. */
    env?: string;
    /** The resolved value type (`string`, `number`, `boolean`, `array`, ...). */
    type: ConfigValueType | (string & {});
    /** Human-readable description. */
    description?: string;
    /** Never echo a real value for this option (secrets). */
    secret?: boolean;
    /** The resolved default value. */
    default?: string;
    /** Whether the config value is required. */
    required?: boolean;
    /** Collect repeated occurrences into an array (`--tag a --tag b`). */
    multiple?: boolean;
    /** Allowed values, when the config is an enum. */
    choices?: readonly string[];
    /** The config scope the option belongs to. */
    scope?: string;
    /** The dotted config path, when the option maps to a config field. */
    path?: string;
    /**
     * Coerce one raw CLI string into the config value. Generated from the config
     * type (`number`, `boolean`, `array`, ...); callers can override it.
     */
    parse?: (value: string) => unknown;
}

/** A config scope exposed as a CLI command. */
export interface CliCommandDef {
    /** Command name (the schema scope key). */
    name: string;
    /** The command's config value type. */
    type: ConfigValueType | 'object' | (string & {});
    /** Whether the whole command config is required. */
    required?: boolean;
    /** Human-readable description. */
    description?: string;
    /** The resolved default value. */
    default?: unknown;
    /** The dotted config path (the scope key). */
    path: string;
    /** The config scope. */
    scope: string;
    /** The config metadata attached to the scope. */
    meta?: ConfigMeta;
    /** Coerce the command value, for primitive commands. */
    parse?: (value: unknown) => unknown;
    /** The command's CLI options. */
    options: CliOptionDef[];
    /** The command's options as `[flag, def]` entries. */
    optionsEntries: Array<[string, CliOptionDef]>;
}

/** The scoped result of {@link generateConfigCliOptions}. */
export interface ConfigCliOptionsResult {
    /** Commands keyed by scope name. */
    command: Record<string, CliCommandDef>;
    /** The same commands as `[scope, command]` entries. */
    commandEntries: Array<[string, CliCommandDef]>;
    /** Every option across every command, in declaration order. */
    options: CliOptionDef[];
    /** The flat options as `[flag, def]` entries. */
    optionsEntries: Array<[string, CliOptionDef]>;
}

/** CLI option generation options (env-backed `cli` scope). */
export interface GenerateCliOptionsOptions extends CliFlagOptions {
    /** The scope whose env vars become flags. @default "cli" */
    scope?: string;
    /** Output file path to write the options as JSON. */
    output?: string | false;
}

/** Config-field CLI option generation options. */
export interface GenerateConfigCliOptions extends CliFlagOptions {
    /** Only include definitions under this dotted path prefix. */
    pathPrefix?: string;
    /** Override the flag for a dotted path (eg. `{ aliases: '--aliases' }`). */
    flags?: Record<string, string>;
    /** Override the value type/parser for a dotted path. */
    types?: Record<string, ConfigValueType | 'boolean'>;
}

/** The typed `values` of a parsed CLI args result. */
export type CliArgsValues = Record<string, string | undefined>;

/** A parsed CLI args result (node `parseArgs` output). */
export interface CliArgsResult {
    values: CliArgsValues;
    positionals: string[];
}

/** A generated `node:util` `parseArgs` option entry. */
export interface CliArgsOptionConfig {
    type: 'string';
    short?: string;
    default?: string;
}

/** A generated CLI args parser bound to a set of option definitions. */
export interface CliArgsParser {
    options: ParseArgsOptionsConfig;
    parse: (args?: string[]) => CliArgsResult;
    /** Map a parsed result into a `{ [flag]: value }` record of provided flags. */
    toConfig: (result?: CliArgsResult) => CliArgsValues;
}

/** Options for a generated config CLI command. */
export interface ConfigCliCommandOptions<TSchema extends ConfigSchema = ConfigSchema> {
    /** Command name. */
    name: string;
    /** Command description. */
    description: string;
    /** The config schema parsed by the command. */
    schema: TSchema;
    /** Generate options for this scoped command instead of every scope. */
    commandName?: string;
    /** Generate options for all fields under this dotted path prefix. */
    pathPrefix?: string;
    /** The env prefix used by the generated options. */
    envPrefix?: string;
    /** Override flags by dotted path. */
    flags?: Record<string, string>;
    /** Override value types by dotted path. */
    types?: Record<string, ConfigValueType | 'boolean'>;
    /** Extra command-specific options (eg. `--json`, `--cwd`). */
    options?: ToolchainOption[];
    /** Positional arguments. */
    args?: ToolchainArgument[];
    /** Hide the command from generated docs. */
    hidden?: boolean;
    /** Forward unknown options/operands (provider passthroughs). */
    passthrough?: boolean;
    /** Extra parse options passed to `parseConfig`. */
    parseOptions?: Omit<ParseConfigOptions, 'source'>;
    /** Parse the provided values into the config object. @default parseConfig */
    parse?: (values: Record<string, unknown>, options: ConfigCliCommandOptions<TSchema>) => unknown;
    /** Run with the parsed config + the raw provided values. */
    run: (
        values: Record<string, unknown>,
        parsed: unknown,
        context: ToolchainCommandContext
    ) => void | Promise<void>;
}
