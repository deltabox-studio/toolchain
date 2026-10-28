/**
 * `createConfigEngine` binds a config schema, an env prefix and a project root
 * into a reusable object whose methods are the generators.
 */

import fs from 'node:fs';
import path from 'node:path';

import { collectVars, DEFAULT_ENV_PREFIX } from './collect.js';
import { type BuildConfigJsonOptions, buildConfigJson, type ConfigJsonDoc } from './config-json.js';
import { type EnvFileOptions, generateEnvFile } from './env-file.js';
import {
    type GenerateCliOptionsOptions,
    generateCliOptions,
    type CliOptionDef,
} from './generators/cli.js';
import { type GenerateEnvTypesOptions, generateConfigEnv } from './generators/env.js';
import {
    type GenerateJsonSchemaOptions,
    generateConfigJsonSchema,
    generateJsonSchemaFile,
} from './generators/json.js';
import { type GenerateMarkdownOptions, generateConfigMarkdown } from './generators/markdown.js';
import { type GenerateTypesOptions, generateConfigTypes } from './generators/types.js';
import { findProjectRoot } from './root.js';
import type { ConfigDef, ConfigEngineOptions, ConfigSchema } from './types.js';

export interface ConfigEngine {
    readonly schema: ConfigSchema;
    readonly envPrefix: string;
    readonly baseGroup: string;
    readonly root: string;
    collectVars(): ConfigDef[];
    requiredVars(scope?: string): ConfigDef[];
    generateEnvFile(options?: EnvFileOptions): string;
    buildConfigJson(options?: BuildConfigJsonOptions): ConfigJsonDoc;
    generateJsonSchema(options?: GenerateJsonSchemaOptions): Promise<Record<string, unknown>>;
    writeJsonSchema(options: GenerateJsonSchemaOptions & { output: string }): Promise<string>;
    generateConfigTypes(options?: GenerateTypesOptions): Record<string, string>;
    generateConfigEnv(options?: GenerateEnvTypesOptions): Record<string, string>;
    generateConfigMarkdown(options?: GenerateMarkdownOptions): Record<string, string>;
    generateConfigCli(options?: GenerateCliOptionsOptions): CliOptionDef[];
    writeEnvFile(options: EnvFileOptions & { output: string }): string;
    writeConfigTypes(options: GenerateTypesOptions & { outputDir: string }): string[];
    writeEnvTypes(options: GenerateEnvTypesOptions & { outputDir: string }): string[];
    writeMarkdown(options: GenerateMarkdownOptions & { outputDir: string }): string[];
    generateCliOptions(options?: GenerateCliOptionsOptions): CliOptionDef[];
}

export function createConfigEngine(options: ConfigEngineOptions): ConfigEngine {
    const schema = options.schema;
    const envPrefix = options.envPrefix ?? DEFAULT_ENV_PREFIX;
    const baseGroup = options.baseGroup ?? 'base';
    const root = options.root ?? findProjectRoot();
    const envPathOf = options.envPathOf;
    const baseGroupName = Array.isArray(baseGroup)
        ? String((baseGroup as unknown[])[0] ?? 'base')
        : String(baseGroup);

    return {
        schema,
        envPrefix,
        baseGroup: baseGroupName,
        root,
        collectVars: () => collectVars(schema, envPrefix, { envPathOf }),
        requiredVars: scope =>
            collectVars(schema, envPrefix, { envPathOf }).filter(
                def => def.required && (scope === undefined || def.scope === scope)
            ),
        generateEnvFile: (opts = {}) => generateEnvFile(schema, { envPrefix, envPathOf, ...opts }),
        buildConfigJson: (opts = {}) => buildConfigJson(schema, { envPrefix, envPathOf, ...opts }),
        generateJsonSchema: (opts = {}) =>
            generateConfigJsonSchema(schema, { baseGroup: baseGroupName, ...opts }),
        writeJsonSchema: (opts: GenerateJsonSchemaOptions & { output: string }) =>
            generateJsonSchemaFile(schema, { baseGroup: baseGroupName, ...opts }),
        generateConfigTypes: (opts = {}) =>
            generateConfigTypes(schema, { baseGroup: baseGroupName, ...opts }),
        generateConfigEnv: (opts = {}) =>
            generateConfigEnv(schema, { envPrefix, envPathOf, ...opts }),
        generateConfigMarkdown: (opts = {}) =>
            generateConfigMarkdown(schema, {
                baseGroup: baseGroupName,
                envPrefix,
                envPathOf,
                ...opts,
            }),
        generateConfigCli: (opts = {}) =>
            generateCliOptions(schema, { envPrefix, envPathOf, ...opts }),
        writeEnvFile: opts => {
            const content = generateEnvFile(schema, { envPrefix, envPathOf, ...opts });
            fs.mkdirSync(path.dirname(opts.output), { recursive: true });
            fs.writeFileSync(opts.output, content, 'utf-8');
            return opts.output;
        },
        writeConfigTypes: opts => {
            const contents = generateConfigTypes(schema, { baseGroup: baseGroupName, ...opts });
            return Object.keys(contents).map(scope => path.join(opts.outputDir, `${scope}.ts`));
        },
        writeEnvTypes: opts => {
            const contents = generateConfigEnv(schema, { envPrefix, envPathOf, ...opts });
            return Object.keys(contents).map(file => path.join(opts.outputDir, file));
        },
        writeMarkdown: opts => {
            const contents = generateConfigMarkdown(schema, {
                baseGroup: baseGroupName,
                envPrefix,
                envPathOf,
                ...opts,
            });
            return Object.keys(contents).map(file => path.join(opts.outputDir, file));
        },
        generateCliOptions: (opts = {}) =>
            generateCliOptions(schema, { envPrefix, envPathOf, ...opts }),
    };
}

export type { ConfigEngineOptions };
