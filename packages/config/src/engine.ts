/**
 * `createConfigEngine` binds a config schema, an env prefix and a project root
 * into a reusable object whose grouped methods are the generators.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { CliCommand, CliCommandContext, CliOption } from '@deltabox/toolchain/shared';

import { createConfigProgram } from './cli/program/index.js';
import { collectDefinitions, DEFAULT_ENV_PREFIX } from './collect.js';
import { buildConfigJson } from './config-json.js';
import { cliScopeSchemas } from './generators/cli-schema.js';
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
import { generateConfigProgram } from './generators/program.js';
import { generateConfigTypes } from './generators/types.js';
import { findProjectRoot } from './root.js';
import { normalizeBaseGroups } from './schema.js';
import type {
    ConfigCliOptions,
    ConfigCommandBuilder,
    ConfigEngine,
    ConfigEngineCliProgram,
    ConfigEngineJsonSchemaDoc,
    ConfigEngineOptions,
    ConfigMarkdownOptions,
    ConfigProgramCommand,
    ConfigProgramCommands,
    ConfigProgramOptions,
    ConfigScopeCommand,
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

    const isThenable = (value: unknown): value is PromiseLike<unknown> =>
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { then?: unknown }).then === 'function';

    const normalizeOptionInput = (input: unknown): CliOption => {
        if (typeof input === 'string') return { flags: input, description: '' };
        if (Array.isArray(input)) {
            const [flags, description, defaultValue] = input as [
                string,
                string | undefined,
                string | undefined,
            ];
            return {
                flags,
                description: description ?? '',
                ...(defaultValue !== undefined ? { default: defaultValue } : {}),
            };
        }
        return input as CliOption;
    };

    interface CommandState<C extends CliCommandContext> {
        name: string;
        description: string;
        version?: string;
        argv?: readonly string[];
        bin?: string;
        options: CliOption[];
        globalOptions: CliOption[];
        inherit?: boolean;
        commands: CliCommand<any, C>[];
        onError?: (error: unknown, context: C) => void | Promise<void>;
        overrides?:
            | Record<string, unknown>
            | ((values: Record<string, unknown>) => Record<string, unknown>);
    }

    const makeCommandChain = <C extends CliCommandContext>(
        scope: string
    ): ConfigScopeCommand<TSchema, string, C> => {
        const state: CommandState<C> = {
            name: scope,
            description: '',
            options: [],
            globalOptions: [],
            commands: [],
        };

        const buildChildCommand = (
            childScope: string,
            descriptionOrSetup?: unknown,
            setup?: unknown
        ): CliCommand<any, C> => {
            const child = makeCommandChain<C>(childScope);
            if (typeof descriptionOrSetup === 'function') {
                return (
                    descriptionOrSetup as (
                        command: ConfigScopeCommand<TSchema, string, C>
                    ) => CliCommand<any, C>
                )(child);
            }
            if (typeof descriptionOrSetup === 'string') child.description(descriptionOrSetup);
            if (typeof setup === 'function') {
                return (
                    setup as (command: ConfigScopeCommand<TSchema, string, C>) => CliCommand<any, C>
                )(child);
            }
            return child.run();
        };

        const appendCommandInput = (input: unknown): void => {
            if (Array.isArray(input)) {
                const [childScope, descriptionOrSetup, setup] = input as [string, unknown, unknown];
                state.commands.push(buildChildCommand(childScope, descriptionOrSetup, setup));
                return;
            }
            if (input && typeof input === 'object' && 'run' in input) {
                state.commands.push(input as CliCommand<any, C>);
                return;
            }
            const definition = input as {
                scope: string;
                description?: string;
                setup?: unknown;
                globalOptions?: readonly unknown[];
                inherit?: boolean;
            };
            const command = buildChildCommand(
                definition.scope,
                definition.description,
                definition.setup
            );
            if (definition.globalOptions) {
                command.globalOptions = definition.globalOptions.map(normalizeOptionInput);
            }
            if (definition.inherit !== undefined) command.inherit = definition.inherit;
            state.commands.push(command);
        };

        const chain = {
            name(value: string) {
                state.name = value;
                return chain;
            },
            description(value: string) {
                state.description = value;
                return chain;
            },
            version(value: string) {
                state.version = value;
                return chain;
            },
            argv(values: readonly string[]) {
                state.argv = values;
                return chain;
            },
            bin(location: string) {
                state.bin = location;
                return chain;
            },
            option(...args: unknown[]) {
                const input = args.length > 1 ? args : args[0];
                state.options.push(normalizeOptionInput(input));
                return chain;
            },
            options(...args: unknown[]) {
                const inputs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
                for (const input of inputs) state.options.push(normalizeOptionInput(input));
                return chain;
            },
            globalOption(...args: unknown[]) {
                const input = args.length > 1 ? args : args[0];
                state.globalOptions.push(normalizeOptionInput(input));
                return chain;
            },
            globalOptions(...args: unknown[]) {
                const inputs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
                for (const input of inputs) {
                    state.globalOptions.push(normalizeOptionInput(input));
                }
                return chain;
            },
            inherit(value = true) {
                state.inherit = value;
                return chain;
            },
            command(childScope: string, descriptionOrSetup?: unknown, setup?: unknown) {
                state.commands.push(buildChildCommand(childScope, descriptionOrSetup, setup));
                return chain;
            },
            commands(...args: unknown[]) {
                const inputs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
                for (const input of inputs) appendCommandInput(input);
                return chain;
            },
            subcommand(childScope: string, descriptionOrSetup?: unknown, setup?: unknown) {
                state.commands.push(buildChildCommand(childScope, descriptionOrSetup, setup));
                return chain;
            },
            subcommands(...args: unknown[]) {
                const inputs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
                for (const input of inputs) appendCommandInput(input);
                return chain;
            },
            onError(handler: (error: unknown, context: C) => void | Promise<void>) {
                state.onError = handler;
                return chain;
            },
            __setOverrides(value: CommandState<C>['overrides']) {
                state.overrides = value;
                return chain;
            },
            run(
                handler?: (context: {
                    config: unknown;
                    values: Record<string, unknown>;
                    context: C;
                }) => void | Promise<void>
            ) {
                let command: CliCommand<any, C>;
                if (handler) {
                    const spec = {
                        scope,
                        name: state.name,
                        description: state.description,
                        options: state.options,
                        ...(state.overrides ? { overrides: state.overrides } : {}),
                        ...(state.argv ? { argv: state.argv } : {}),
                        ...(state.bin ? { bin: state.bin } : {}),
                        run: handler,
                    };
                    const [built] = generateConfigProgram<TSchema, C>(schema, {
                        envPrefix,
                        ...(envPathOf ? { envPathOf } : {}),
                        commands: [spec] as never,
                    });
                    command = built ?? {
                        name: state.name,
                        description: state.description,
                        options: state.options,
                        run: () => {},
                    };
                } else {
                    command = {
                        name: state.name,
                        description: state.description,
                        options: state.options,
                        run: () => {},
                    };
                }
                command.scope = scope;
                if (state.commands.length > 0) command.commands = state.commands as never;
                if (state.version) command.version = state.version;
                if (state.argv) command.argv = [...state.argv];
                if (state.bin) command.bin = state.bin;
                if (state.globalOptions.length > 0) {
                    command.globalOptions = [...state.globalOptions];
                }
                if (state.inherit !== undefined) command.inherit = state.inherit;
                if (state.onError) command.onError = state.onError;
                return command;
            },
        };
        return chain as unknown as ConfigScopeCommand<TSchema, string, C>;
    };

    const buildCommand = <C extends CliCommandContext>(
        scope: string,
        spec: ConfigProgramCommand<any, C, readonly CliOption[]>
    ): CliCommand<readonly CliOption[], C> => {
        const chain = makeCommandChain<C>(scope);
        if (spec.name) chain.name(spec.name);
        if (spec.description) chain.description(spec.description);
        if (spec.version) chain.version(spec.version);
        if (spec.argv) chain.argv(spec.argv);
        if (spec.bin) chain.bin(spec.bin);
        for (const option of spec.options ?? []) chain.option(option);
        if (spec.onError) chain.onError(spec.onError);
        if (spec.overrides) {
            (chain as unknown as { __setOverrides?: (value: unknown) => void }).__setOverrides?.(
                spec.overrides
            );
        }
        let command: CliCommand<any, C> = spec.run ? chain.run(spec.run as never) : chain.run();
        if (spec.aliases) command = { ...command, aliases: [...spec.aliases] };
        if (spec.group) command = { ...command, group: spec.group };
        if (spec.args) command = { ...command, args: [...spec.args] };
        if (spec.hidden) command = { ...command, hidden: true };
        if (spec.passthrough) command = { ...command, passthrough: true };
        if (spec.globalOptions) {
            command = { ...command, globalOptions: [...spec.globalOptions] };
        }
        if (spec.inherit !== undefined) command = { ...command, inherit: spec.inherit };
        if (spec.commands) command = { ...command, commands: [...spec.commands] as never };
        return command;
    };

    const makeCommandBuilder = <C extends CliCommandContext>(): ConfigCommandBuilder<
        TSchema,
        C
    > => {
        const defaultScope = cliScopeSchemas(schema)[0]?.name ?? 'config';
        return ((scope?: string, spec?: ConfigProgramCommand<any, C, readonly CliOption[]>) => {
            if (!spec) return makeCommandChain<C>(scope ?? defaultScope);
            return buildCommand(scope ?? defaultScope, spec);
        }) as ConfigCommandBuilder<TSchema, C>;
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
            program: {
                create: (<
                    Context extends CliCommandContext = CliCommandContext,
                    Commands extends ConfigProgramCommands<Context> = readonly CliCommand<
                        any,
                        Context
                    >[],
                >(
                    build: (command: ConfigCommandBuilder<TSchema, Context>) => Commands,
                    programOptions?: ConfigProgramOptions<Context, readonly CliOption[]>
                ) => {
                    const builder = makeCommandBuilder<Context>();
                    const finalize = (commands: unknown) => {
                        const normalized = Array.isArray(commands) ? commands : [commands];
                        const resolved =
                            normalized.length > 0
                                ? commands
                                : generateConfigProgram<TSchema, Context>(schema, {
                                      envPrefix,
                                      ...(envPathOf ? { envPathOf } : {}),
                                  });
                        return createConfigProgram(resolved as never, programOptions);
                    };
                    const result = build(builder);
                    return (isThenable(result) ? result.then(finalize) : finalize(result)) as never;
                }) as never,
                createCommand: ((
                    scope: string,
                    spec: ConfigProgramCommand<any, CliCommandContext, readonly CliOption[]>
                ) => buildCommand(scope, spec)) as ConfigEngineCliProgram<TSchema>['createCommand'],
            },
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
