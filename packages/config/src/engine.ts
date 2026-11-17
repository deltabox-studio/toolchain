/**
 * `createConfigEngine` binds a config schema, an env prefix and a project root
 * into a reusable object whose grouped methods are the generators.
 */

import fs from 'node:fs';
import path from 'node:path';

import { collectDefinitions, DEFAULT_ENV_PREFIX } from './collect.js';
import { type BuildConfigJsonOptions, buildConfigJson, type ConfigJsonDoc } from './config-json.js';
import {
    type CliOptionDef,
    type GenerateCliOptionsOptions,
    generateCliOptions,
} from './generators/cli.js';
import { type EnvFileOptions, generateEnvFile } from './generators/env-file.js';
import { type GenerateEnvTypesOptions, generateConfigEnv } from './generators/env.js';
import {
    type GenerateJsonSchemaOptions,
    generateConfigJsonSchema,
    generateJsonSchemaFile,
} from './generators/json.js';
import { type GenerateMarkdownOptions, generateConfigMarkdown } from './generators/markdown.js';
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
export interface ConfigEngineMarkdown<TSchema extends ConfigSchema = ConfigSchema> {
    /** Render the markdown reference files, keyed by file name. */
    generate<const O extends ConfigMarkdownOptions<TSchema> = {}>(
        options?: O
    ): Record<MarkdownFileKeys<TSchema, O>, string>;
    /** Render and write the markdown reference files; returns the written paths. */
    write(options: ConfigMarkdownOptions<TSchema> & { outputDir: string }): string[];
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
    /** The scopes the document requires. */
    required: TScope[];
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
    const root = options.root ?? findProjectRoot();
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
                const content = generateEnvFile(schema, { envPrefix, envPathOf, ...opts });
                fs.mkdirSync(path.dirname(opts.output), { recursive: true });
                fs.writeFileSync(opts.output, content, 'utf-8');
                return opts.output;
            },
            types: {
                generate: generateEnvTypes,
                write: opts => {
                    const contents = generateEnvTypes(opts);
                    return Object.keys(contents).map(file => path.join(opts.outputDir, file));
                },
            },
        },
        types: {
            generate: generateTypes,
            write: opts => {
                const contents = generateTypes(opts);
                const extension = opts.extension ?? 'ts';
                return Object.keys(contents).map(scope =>
                    path.join(opts.outputDir, `${scope}.${extension}`)
                );
            },
        },
        markdown: {
            generate: generateMarkdown,
            write: opts => {
                const contents = generateMarkdown(opts);
                return Object.keys(contents).map(file => path.join(opts.outputDir, file));
            },
        },
        cli: {
            generate: generateCli,
            write: opts => {
                generateCli({ ...opts, output: opts.output });
                return opts.output;
            },
        },
        jsonSchema: {
            generate: generateSchema,
            write: opts => generateJsonSchemaFile(schema, { baseGroup: baseGroupName, ...opts }),
        },
        configJson: {
            build: (opts = {}) => buildConfigJson(schema, { envPrefix, envPathOf, ...opts }),
        },
    };
}

export type { ConfigEngineOptions };
