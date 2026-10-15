/**
 * `createConfigEngine` — binds a set of config scopes, an env prefix and a
 * project root into a single object whose methods are the generators, so a
 * consumer configures the tooling once and reuses it everywhere.
 */

import fs from 'node:fs';
import path from 'node:path';

import { collectEnvVars, collectRequiredEnvVars, DEFAULT_ENV_PREFIX } from './collect.js';
import { type BuildConfigJsonOptions, buildConfigJson, type ConfigJsonDoc } from './config-json.js';
import { type EnvFileOptions, generateEnvFile } from './env-file.js';
import {
    generateCliOptions as buildCliOptions,
    type CliOptionDef,
    type GenerateCliOptionsOptions,
} from './generators/cli.js';
import { type GenerateEnvTypesOptions, generateEnvTypes } from './generators/env.js';
import {
    type GenerateJsonSchemaOptions,
    generateConfigJsonSchema,
    generateJsonSchemaFile,
} from './generators/json.js';
import { type GenerateMarkdownOptions, generateConfigMarkdown } from './generators/markdown.js';
import {
    type GenerateTypesOptions,
    generateConfigTypes,
    renderAllConfigTypes,
} from './generators/types.js';
import { findProjectRoot } from './root.js';
import type { ConfigEngineOptions, ConfigScopes, EnvVarDef } from './types.js';

/** The bound, reusable config engine. */
export interface ConfigEngine {
    readonly scopes: ConfigScopes;
    readonly envPrefix: string;
    readonly baseGroup: string;
    readonly root: string;
    /** Every env-var-backed leaf across the registered scopes. */
    collectEnvVars(): EnvVarDef[];
    /** The names of the required env vars for a scope. */
    requiredEnvVars(scope: string): string[];
    /** Render `.env` content. */
    renderEnvFile(options?: EnvFileOptions): string;
    /** Write a `.env` file. Returns the path written. */
    writeEnvFile(options: EnvFileOptions & { output: string }): string;
    /** Build the config metadata JSON document. */
    buildConfigJson(options?: BuildConfigJsonOptions): ConfigJsonDoc;
    /** Build (and optionally write) the untyped JSON Schema document. */
    generateJsonSchema(options?: GenerateJsonSchemaOptions): Promise<Record<string, unknown>>;
    /** Write the JSON Schema document. Returns the path written. */
    writeJsonSchema(options: GenerateJsonSchemaOptions & { output: string }): Promise<string>;
    /** Render every config type file, keyed by scope name. */
    renderConfigTypes(options?: GenerateTypesOptions): Record<string, string>;
    /** Write the config type files into `outputDir`. */
    writeConfigTypes(options: GenerateTypesOptions & { outputDir: string }): string[];
    /** Write the env type files into `outputDir`. */
    writeEnvTypes(options: GenerateEnvTypesOptions & { outputDir: string }): string[];
    /** Write the markdown reference into `outDir`. */
    writeMarkdown(options: GenerateMarkdownOptions & { outDir: string }): string[];
    /** Generate (and optionally write) the CLI option definitions. */
    generateCliOptions(options?: GenerateCliOptionsOptions): CliOptionDef[];
}

/** Create a reusable config engine. */
export function createConfigEngine(options: ConfigEngineOptions): ConfigEngine {
    const scopes = options.scopes;
    const envPrefix = options.envPrefix ?? DEFAULT_ENV_PREFIX;
    const baseGroup = options.baseGroup ?? 'base';
    const root = options.root ?? findProjectRoot();
    const envPathOf = options.envPathOf;

    return {
        scopes,
        envPrefix,
        baseGroup,
        root,
        collectEnvVars: () => collectEnvVars(scopes, envPrefix, { envPathOf }),
        requiredEnvVars: (scope: string) =>
            collectRequiredEnvVars(scopes, scope, envPrefix, { envPathOf }),
        renderEnvFile: (opts: EnvFileOptions = {}) =>
            generateEnvFile(scopes, { envPrefix, envPathOf, ...opts }),
        writeEnvFile: (opts: EnvFileOptions & { output: string }) => {
            const content = generateEnvFile(scopes, { envPrefix, envPathOf, ...opts });
            fs.mkdirSync(path.dirname(opts.output), { recursive: true });
            fs.writeFileSync(opts.output, content, 'utf-8');
            return opts.output;
        },
        buildConfigJson: (opts: BuildConfigJsonOptions = {}) =>
            buildConfigJson(scopes, { envPrefix, envPathOf, ...opts }),
        generateJsonSchema: (opts: GenerateJsonSchemaOptions = {}) =>
            generateConfigJsonSchema(scopes, { baseGroup, ...opts }),
        writeJsonSchema: (opts: GenerateJsonSchemaOptions & { output: string }) =>
            generateJsonSchemaFile(scopes, { baseGroup, ...opts }),
        renderConfigTypes: (opts: GenerateTypesOptions = {}) =>
            renderAllConfigTypes(scopes, { baseGroup, ...opts }),
        writeConfigTypes: (opts: GenerateTypesOptions & { outputDir: string }) =>
            generateConfigTypes(scopes, { baseGroup, ...opts }),
        writeEnvTypes: (opts: GenerateEnvTypesOptions & { outputDir: string }) =>
            generateEnvTypes(scopes, { envPrefix, envPathOf, ...opts }),
        writeMarkdown: (opts: GenerateMarkdownOptions & { outDir: string }) =>
            generateConfigMarkdown(scopes, { baseGroup, envPrefix, envPathOf, ...opts }),
        generateCliOptions: (opts: GenerateCliOptionsOptions = {}) =>
            buildCliOptions(scopes, { envPrefix, envPathOf, ...opts }),
    };
}

export type { ConfigEngineOptions, ConfigScopes };
