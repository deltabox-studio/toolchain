import type { CliCommand } from '@deltabox/toolchain/shared';

import type {
    CliOptionDef,
    ConfigCliOptionsResult,
    ConfigEngineCliProgram,
    GenerateCliOptionsOptions,
    GenerateConfigCliOptions,
} from './cli/index.js';
import type { ConfigDef, ConfigGroup } from './definition.js';
import type {
    BuildConfigJsonOptions,
    ConfigJsonDoc,
    GenerateEnvFileOptions,
    GenerateCliDocsOptions,
    GenerateEnvMarkdownOptions,
    GenerateEnvTypesOptions,
    GenerateJsonSchemaOptions,
    GenerateMarkdownFileOptions,
    GenerateMarkdownOptions,
    GenerateTypesOptions,
} from './generators.js';
import type { ConfigScopeKeys } from './resolved.js';
import type { ConfigSchema } from './schema.js';

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
export interface ConfigEngineOptions<TSchema extends ConfigSchema = ConfigSchema> {
    /** The scopes to walk, keyed by scope name (eg. `{ server, frontend, cli }`). */
    schema: TSchema;
    /** The env-var prefix (eg. `MYAPP_`). Kept as a replacement token in code. */
    envPrefix?: string;
    /**
     * The schema's object key (or keys) that hold the "flat" base config fields,
     * hoisted out of the nested groups in the generated types/docs. Multiple
     * keys are merged in declaration order.
     * @default "base"
     */
    baseGroup?: ConfigGroup;
    /** Flattens the schema by `n` levels. */
    flatten?: ConfigEngineFlatten;
    /**
     * The monorepo/project root used for default output paths.
     * @default nearest project root
     */
    root?: string;
    /**
     * Custom env-name -> dotted-path derivation for leaves without an explicit
     * `path` (eg. to handle dual `PREFIX_`/`VITE_` prefixes).
     */
    envPathOf?: (env: string) => string;
}

/** The file keys `generateConfigEnv` returns for the given options. */
export type EnvTypeFileKeys<O> =
    | (O extends { envFile: infer F } ? (F extends string ? F : 'env.ts') : 'env.ts')
    | (O extends { dtsFile: infer F } ? (F extends string ? F : 'dbx-env.d.ts') : 'dbx-env.d.ts');

/** The file keys `generateConfigMarkdown` returns for the given options. */
export type MarkdownFileKeys<TSchema, O> = O extends { combined: true }
    ? O extends { indexFilename: infer F }
        ? F extends string
            ? F
            : 'index.md'
        : 'index.md'
    :
          | `${ConfigScopeKeys<TSchema>}.md`
          | (O extends { indexFilename: infer F }
                ? F extends string
                    ? F
                    : 'index.md'
                : 'index.md');

/** Config type options with per-scope records narrowed to the schema's scopes. */
export type ConfigTypesOptions<TSchema> = Omit<
    GenerateTypesOptions,
    'interfaceNames' | 'aliases' | 'overrides'
> & {
    interfaceNames?: Partial<Record<ConfigScopeKeys<TSchema>, string>>;
    aliases?: Partial<Record<ConfigScopeKeys<TSchema>, string>>;
    overrides?: Partial<Record<ConfigScopeKeys<TSchema>, string>>;
};

/** CLI options with the scope narrowed to the schema's scopes. */
export type ConfigCliOptions<TSchema> = Omit<GenerateCliOptionsOptions, 'scope'> & {
    scope?: ConfigScopeKeys<TSchema>;
};

/** Markdown options with the CLI scope narrowed to the schema's scopes. */
export type ConfigMarkdownOptions<TSchema> = Omit<GenerateMarkdownOptions, 'cliScope'> & {
    cliScope?: ConfigScopeKeys<TSchema>;
};

/** `.env` file and env typings generation. */
export interface ConfigEngineEnvTypes {
    /** Render the env typing files, keyed by file name. */
    generate<const O extends GenerateEnvTypesOptions = {}>(
        options?: O
    ): Record<EnvTypeFileKeys<O>, string>;
    /** Render and write the env typing files; returns the written paths. */
    write(options: GenerateEnvTypesOptions & { outputDir: string }): string[];
}

/** `.env` file and env typing generation. */
export interface ConfigEngineEnv {
    /** Render the `.env` file content. */
    generate(options?: GenerateEnvFileOptions): string;
    /** Render and write the `.env` file; returns the written path. */
    write(options: GenerateEnvFileOptions & { output: string }): string;
    /** Env typings (`env.ts` and its ambient `.d.ts`). */
    types: ConfigEngineEnvTypes;
}

/** Config TypeScript interface generation. */
export interface ConfigEngineTypes<TSchema extends ConfigSchema = ConfigSchema> {
    /** Render the config type files, keyed by scope name. */
    generate(options?: ConfigTypesOptions<TSchema>): Record<ConfigScopeKeys<TSchema>, string>;
    /** Render and write the config type files; returns the written paths. */
    write(options: ConfigTypesOptions<TSchema> & { outputDir: string }): string[];
}

/** Rendered markdown pages for CLI commands, env vars and single files. */
export interface ConfigEngineMarkdownCli {
    /** Render the command reference page. */
    generate(commands: readonly CliCommand[], options?: GenerateCliDocsOptions): string;
    /** Render and write the command reference page; returns the written path. */
    write(
        commands: readonly CliCommand[],
        options: GenerateCliDocsOptions & { output: string }
    ): string;
}

export interface ConfigEngineMarkdownEnv {
    /** Render the environment-variable reference page. */
    generate(options?: GenerateEnvMarkdownOptions): string;
    /** Render and write the environment-variable page; returns the written path. */
    write(options: GenerateEnvMarkdownOptions & { output: string }): string;
}

export interface ConfigEngineMarkdownFile {
    /** Render one markdown page with frontmatter and a title. */
    generate(options: GenerateMarkdownFileOptions): string;
    /** Render and write one markdown page; returns the written path. */
    write(options: GenerateMarkdownFileOptions & { output: string }): string;
}

/** Markdown reference generation. */
export interface ConfigEngineMarkdown<TSchema extends ConfigSchema = ConfigSchema> {
    /** Render the markdown reference files, keyed by file name. */
    generate(
        options?: ConfigMarkdownOptions<TSchema>
    ): Record<MarkdownFileKeys<TSchema, ConfigMarkdownOptions<TSchema>>, string>;
    /** Render and write the markdown reference files; returns the written paths. */
    write(options: ConfigMarkdownOptions<TSchema> & { outputDir: string }): string[];
    /** Command reference docs. */
    cli: ConfigEngineMarkdownCli;
    /** Environment-variable reference docs. */
    env: ConfigEngineMarkdownEnv;
    /** A single generic markdown page. */
    file: ConfigEngineMarkdownFile;
}

/** CLI option definition generation. */
export interface ConfigEngineCli<TSchema extends ConfigSchema = ConfigSchema> {
    /** Render the env-backed CLI option definitions. */
    generate(options?: ConfigCliOptions<TSchema>): CliOptionDef[];
    /** Render and write the env-backed CLI option definitions as JSON; returns the written path. */
    write(options: ConfigCliOptions<TSchema> & { output: string }): string;
    /**
     * Render scoped command/option definitions from the config fields. Each
     * schema scope becomes a command; its fields become options.
     */
    options(options?: GenerateConfigCliOptions): ConfigCliOptionsResult;
    /** High-level program generation (schema-derived options + typed run config). */
    program: ConfigEngineCliProgram<TSchema>;
}

/** A combined JSON Schema document keyed by the schema's scopes. */
export interface ConfigEngineJsonSchemaDoc<TScope extends string = string> {
    /** The JSON Schema draft URL. */
    $schema: string;
    /** The document id. */
    $id: string;
    /** The document title. */
    title: string;
    /** The document description. */
    description: string;
    /** The root type (always `object`). */
    type: 'object';
    /** One property per config scope. */
    properties: Record<TScope, unknown>;
    /** The scopes the document requires (empty: config sections are opt-in by presence). */
    required: TScope[];
    /** Reusable definitions when `preserveDefs` is enabled. */
    $defs?: Record<string, unknown>;
}

/** JSON Schema document generation. */
export interface ConfigEngineJsonSchema<TSchema extends ConfigSchema = ConfigSchema> {
    /** Render the combined JSON Schema document. */
    generate(
        options?: GenerateJsonSchemaOptions
    ): Promise<ConfigEngineJsonSchemaDoc<ConfigScopeKeys<TSchema>>>;
    /** Render and write the JSON Schema document; returns the written path. */
    write(options: GenerateJsonSchemaOptions & { output: string }): Promise<string>;
}

/** `config.json` metadata document generation. */
export interface ConfigEngineConfigJson {
    /** Build the `config.json` metadata document. */
    build(options?: BuildConfigJsonOptions): ConfigJsonDoc;
}

/** A reusable config engine bound to a schema, env prefix and project root. */
export interface ConfigEngine<TSchema extends ConfigSchema = ConfigSchema> {
    /** The schema every generator reads from. */
    readonly schema: TSchema;
    /** The resolved env-var prefix. */
    readonly envPrefix: string;
    /** The resolved schema key(s) holding the flat base config fields. */
    readonly baseGroup: ConfigGroup;
    /** The resolved monorepo/project root. */
    readonly root: string;
    /** Collect every config definition from the schema. */
    collect(): ConfigDef[];
    /** Collect the definitions marked `required`, optionally for one scope. */
    requiredVars(scope?: ConfigScopeKeys<TSchema>): ConfigDef[];
    /** `.env` file and env typing generation. */
    env: ConfigEngineEnv;
    /** Config TypeScript interface generation. */
    types: ConfigEngineTypes<TSchema>;
    /** Markdown reference generation. */
    markdown: ConfigEngineMarkdown<TSchema>;
    /** CLI option definition generation. */
    cli: ConfigEngineCli<TSchema>;
    /** JSON Schema document generation. */
    jsonSchema: ConfigEngineJsonSchema<TSchema>;
    /** `config.json` metadata document generation. */
    configJson: ConfigEngineConfigJson;
}
