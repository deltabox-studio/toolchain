/**
 * `createConfigEngine` binds a config schema, an env prefix and a project root
 * into a reusable object whose grouped methods are the generators.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { ToolchainCommand } from '@deltabox/toolchain/shared';

import { collectDefinitions, DEFAULT_ENV_PREFIX } from './collect.js';
import { type BuildConfigJsonOptions, buildConfigJson, type ConfigJsonDoc } from './config-json.js';
import {
    type CliOptionDef,
    type GenerateCliOptionsOptions,
    generateCliOptions,
} from './generators/cli.js';
import { type GenerateCliDocsOptions, generateCliDocs } from './generators/commands.js';
import { type EnvFileOptions, generateEnvFile } from './generators/env-file.js';
import { type GenerateEnvTypesOptions, generateConfigEnv } from './generators/env.js';
import {
    type GenerateJsonSchemaOptions,
    generateConfigJsonSchema,
    generateJsonSchemaFile,
} from './generators/json.js';
import {
    type GenerateEnvMarkdownOptions,
    type GenerateMarkdownFileOptions,
    type GenerateMarkdownOptions,
    generateConfigMarkdown,
    generateEnvMarkdown,
    generateMarkdownFile,
} from './generators/markdown.js';
import { type GenerateTypesOptions, generateConfigTypes } from './generators/types.js';
import { findProjectRoot } from './root.js';
import type {
    ConfigDef,
    ConfigEngineOptions,
    ConfigSchema,
    ConfigScopeKeys,
} from './types/index.js';

/** The file keys `generateConfigEnv` returns for the given options. */
type EnvTypeFileKeys<O> =
    | (O extends { envFile: infer F } ? (F extends string ? F : 'env.ts') : 'env.ts')
    | (O extends { dtsFile: infer F } ? (F extends string ? F : 'dbx-env.d.ts') : 'dbx-env.d.ts');

/** The file keys `generateConfigMarkdown` returns for the given options. */
type MarkdownFileKeys<TSchema, O> = O extends { combined: true }
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
type ConfigTypesOptions<TSchema> = Omit<
    GenerateTypesOptions,
    'interfaceNames' | 'aliases' | 'overrides'
> & {
    interfaceNames?: Partial<Record<ConfigScopeKeys<TSchema>, string>>;
    aliases?: Partial<Record<ConfigScopeKeys<TSchema>, string>>;
    overrides?: Partial<Record<ConfigScopeKeys<TSchema>, string>>;
};

/** CLI options with the scope narrowed to the schema's scopes. */
type ConfigCliOptions<TSchema> = Omit<GenerateCliOptionsOptions, 'scope'> & {
    scope?: ConfigScopeKeys<TSchema>;
};

/** Markdown options with the CLI scope narrowed to the schema's scopes. */
type ConfigMarkdownOptions<TSchema> = Omit<GenerateMarkdownOptions, 'cliScope'> & {
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
    generate(options?: EnvFileOptions): string;
    /** Render and write the `.env` file; returns the written path. */
    write(options: EnvFileOptions & { output: string }): string;
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

/** Markdown reference generation. */
/** Rendered markdown pages for CLI commands, env vars and single files. */
export interface ConfigEngineMarkdownCli {
    /** Render the command reference page. */
    generate(commands: readonly ToolchainCommand[], options?: GenerateCliDocsOptions): string;
    /** Render and write the command reference page; returns the written path. */
    write(
        commands: readonly ToolchainCommand[],
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

export interface ConfigEngineMarkdown<TSchema extends ConfigSchema = ConfigSchema> {
    /** Render the markdown reference files, keyed by file name. */
    generate<const O extends ConfigMarkdownOptions<TSchema> = {}>(
        options?: O
    ): Record<MarkdownFileKeys<TSchema, O>, string>;
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
    /** Render the CLI option definitions. */
    generate(options?: ConfigCliOptions<TSchema>): CliOptionDef[];
    /** Render and write the CLI option definitions as JSON; returns the written path. */
    write(options: ConfigCliOptions<TSchema> & { output: string }): string;
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
    /** The resolved schema key holding the flat base config fields. */
    readonly baseGroup: string;
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

/**
 * Bind a config schema, env prefix and project root into a reusable engine.
 *
 * The schema type is preserved (`ConfigEngine<TSchema>`), so `engine.schema`
 * keeps the exact schema passed in instead of widening to `ConfigSchema`.
 */
export function createConfigEngine<const TSchema extends ConfigSchema>(
    options: ConfigEngineOptions<TSchema>
): ConfigEngine<TSchema> {
    const schema = options.schema;
    const envPrefix = options.envPrefix ?? DEFAULT_ENV_PREFIX;
    const baseGroup = options.baseGroup ?? 'base';
    // Default to the consuming project, not the installed package directory.
    const root = options.root ?? findProjectRoot(process.cwd());
    const envPathOf = options.envPathOf;
    const baseGroupName = Array.isArray(baseGroup)
        ? String((baseGroup as unknown[])[0] ?? 'base')
        : String(baseGroup);

    const generateEnvTypes = (opts: GenerateEnvTypesOptions = {}) =>
        generateConfigEnv(schema, { envPrefix, envPathOf, ...opts });

    const generateTypes = (opts: ConfigTypesOptions<TSchema> = {}) =>
        generateConfigTypes(schema, {
            baseGroup: baseGroupName,
            ...opts,
        } as GenerateTypesOptions);

    const generateMarkdown = (opts: ConfigMarkdownOptions<TSchema> = {}) =>
        generateConfigMarkdown(schema, {
            baseGroup: baseGroupName,
            envPrefix,
            envPathOf,
            ...opts,
        } as GenerateMarkdownOptions);

    const generateCli = (opts: ConfigCliOptions<TSchema> = {}) =>
        generateCliOptions(schema, { envPrefix, envPathOf, ...opts } as GenerateCliOptionsOptions);

    const generateSchema = (opts: GenerateJsonSchemaOptions = {}) =>
        generateConfigJsonSchema(schema, {
            baseGroup: baseGroupName,
            ...opts,
        }) as unknown as Promise<ConfigEngineJsonSchemaDoc<ConfigScopeKeys<TSchema>>>;

    const writeText = (output: string, content: string): string => {
        const file = path.resolve(root, output);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content, 'utf-8');
        return file;
    };

    return {
        schema,
        envPrefix,
        baseGroup: baseGroupName,
        root,
        collect: () => collectDefinitions(schema, { envPrefix, envPathOf }),
        requiredVars: scope =>
            collectDefinitions(schema, { envPrefix, envPathOf }).filter(
                def => def.required && (scope === undefined || def.scope === scope)
            ),
        env: {
            generate: (opts = {}) => generateEnvFile(schema, { envPrefix, envPathOf, ...opts }),
            write: opts => {
                const output = path.resolve(root, opts.output);
                const content = generateEnvFile(schema, { envPrefix, envPathOf, ...opts });
                fs.mkdirSync(path.dirname(output), { recursive: true });
                fs.writeFileSync(output, content, 'utf-8');
                return output;
            },
            types: {
                generate: generateEnvTypes,
                write: opts => {
                    const outputDir = path.resolve(root, opts.outputDir);
                    const contents = generateEnvTypes({ ...opts, outputDir });
                    return Object.keys(contents).map(file => path.join(outputDir, file));
                },
            },
        },
        types: {
            generate: generateTypes,
            write: opts => {
                const outputDir = path.resolve(root, opts.outputDir);
                const contents = generateTypes({ ...opts, outputDir });
                const extension = opts.extension ?? 'ts';
                return Object.keys(contents).map(scope =>
                    path.join(outputDir, `${scope}.${extension}`)
                );
            },
        },
        markdown: {
            generate: generateMarkdown,
            write: opts => {
                const outputDir = path.resolve(root, opts.outputDir);
                const contents = generateMarkdown({ ...opts, outputDir });
                return Object.keys(contents).map(file => path.join(outputDir, file));
            },
            cli: {
                generate: (commands, opts) => generateCliDocs(commands, opts),
                write: (commands, opts) => {
                    const { output, ...rest } = opts;
                    return writeText(output, generateCliDocs(commands, rest));
                },
            },
            env: {
                generate: opts =>
                    generateEnvMarkdown(collectDefinitions(schema, { envPrefix, envPathOf }), {
                        envPrefix,
                        ...opts,
                    }),
                write: opts => {
                    const { output, ...rest } = opts;
                    const definitions = collectDefinitions(schema, { envPrefix, envPathOf });
                    return writeText(
                        output,
                        generateEnvMarkdown(definitions, { envPrefix, ...rest })
                    );
                },
            },
            file: {
                generate: opts => generateMarkdownFile(opts),
                write: opts => {
                    const { output, ...rest } = opts;
                    return writeText(output, generateMarkdownFile(rest));
                },
            },
        },
        cli: {
            generate: generateCli,
            write: opts => {
                const output = path.resolve(root, opts.output);
                generateCli({ ...opts, output });
                return output;
            },
        },
        jsonSchema: {
            generate: generateSchema,
            write: opts =>
                generateJsonSchemaFile(schema, {
                    baseGroup: baseGroupName,
                    ...opts,
                    output: path.resolve(root, opts.output),
                }),
        },
        configJson: {
            build: (opts = {}) => buildConfigJson(schema, { envPrefix, envPathOf, ...opts }),
        },
    };
}

export type { ConfigEngineOptions };
