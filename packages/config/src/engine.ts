/**
 * `createConfigEngine` binds a config schema, an env prefix and a project root
 * into a reusable object whose grouped methods are the generators.
 */

import fs from 'node:fs';
import path from 'node:path';

import { collectDefinitions, DEFAULT_ENV_PREFIX } from './collect.js';
import { buildConfigJson } from './config-json.js';
import { generateConfigCliOptions, generateCliOptions } from './generators/cli.js';
import { generateCliDocs } from './generators/commands.js';
import { generateEnvFile } from './generators/env-file.js';
import { generateConfigEnv } from './generators/env.js';
import { generateConfigJsonSchema, generateJsonSchemaFile } from './generators/json.js';
import {
    generateConfigMarkdown,
    generateEnvMarkdown,
    generateMarkdownFile,
} from './generators/markdown.js';
import { generateConfigTypes } from './generators/types.js';
import { findProjectRoot } from './root.js';
import { normalizeBaseGroups } from './schema.js';
import type {
    ConfigCliOptions,
    ConfigEngine,
    ConfigEngineJsonSchemaDoc,
    ConfigEngineOptions,
    ConfigMarkdownOptions,
    ConfigSchema,
    ConfigScopeKeys,
    ConfigTypesOptions,
    GenerateCliOptionsOptions,
    GenerateEnvTypesOptions,
    GenerateJsonSchemaOptions,
    GenerateMarkdownOptions,
    GenerateTypesOptions,
} from './types/index.js';

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
    // Keep every configured base group; the generators merge them in order.
    const baseGroups = normalizeBaseGroups(baseGroup);

    const generateEnvTypes = (opts: GenerateEnvTypesOptions = {}) =>
        generateConfigEnv(schema, { envPrefix, envPathOf, ...opts });

    const generateTypes = (opts: ConfigTypesOptions<TSchema> = {}) =>
        generateConfigTypes(schema, {
            baseGroup: baseGroups,
            ...opts,
        } as GenerateTypesOptions);

    const generateMarkdown = (opts: ConfigMarkdownOptions<TSchema> = {}) =>
        generateConfigMarkdown(schema, {
            baseGroup: baseGroups,
            envPrefix,
            envPathOf,
            ...opts,
        } as GenerateMarkdownOptions);

    const generateCli = (opts: ConfigCliOptions<TSchema> = {}) =>
        generateCliOptions(schema, { envPrefix, envPathOf, ...opts } as GenerateCliOptionsOptions);

    const generateSchema = (opts: GenerateJsonSchemaOptions = {}) =>
        generateConfigJsonSchema(schema, {
            baseGroup: baseGroups,
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
        baseGroup,
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
            options: (opts = {}) =>
                generateConfigCliOptions(schema, { envPrefix, envPathOf, ...opts }),
        },
        jsonSchema: {
            generate: generateSchema,
            write: opts =>
                generateJsonSchemaFile(schema, {
                    baseGroup: baseGroups,
                    ...opts,
                    output: path.resolve(root, opts.output),
                }),
        },
        configJson: {
            build: (opts = {}) => buildConfigJson(schema, { envPrefix, envPathOf, ...opts }),
        },
    };
}
