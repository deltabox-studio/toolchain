import type { PartialDeep, Promisable } from 'type-fest';

import type {
    CliArgument,
    CliCommand,
    CliCommandContext,
    CliOption,
    CliOptionValues,
} from '@deltabox/toolchain/shared';

import type { ConfigProgramFormatOptions } from '../format.js';
import type { ConfigScopeKeys, ConfigScopeOf } from '../resolved.js';
import type { ConfigSchema } from '../schema.js';
import type { GenerateConfigCliOptions } from './options.js';

/** The typed argument passed to a program command's `run`. */
export interface ConfigProgramRunContext<
    TConfig = unknown,
    TContext extends CliCommandContext = CliCommandContext,
    TOptions extends readonly CliOption[] = readonly CliOption[],
> {
    /** The resolved, validated config section, inferred from the engine schema. */
    config: TConfig;
    /** The explicit CLI values typed on the command line. */
    values: CliOptionValues<TOptions>;
    /** The host-provided command context. */
    context: TContext;
}

/**
 * The base command shape. Prefer {@link ConfigScopeCommand}, which infers
 * `TConfig` from the engine schema and a literal `scope`.
 */
export interface ConfigProgramCommand<
    TConfig = unknown,
    TContext extends CliCommandContext = CliCommandContext,
    TOptions extends readonly CliOption[] = readonly CliOption[],
    TGlobalOptions extends readonly CliOption[] = readonly CliOption[],
> {
    /** The schema scope the command reads (inferred for single-scope engines). */
    scope?: string;
    /** The command name (defaults to `cliCommand.name`, then the scope). */
    name?: string;
    /** Human-readable description (defaults to `cliCommand.description`). */
    description?: string;
    /** Command aliases. */
    aliases?: readonly string[];
    /** Command version (`<name> --version`). */
    version?: string;
    /** Hide the command from generated docs. */
    hidden?: boolean;
    /** Forward unknown options/operands (provider passthroughs). */
    passthrough?: boolean;
    /** Explicit argv for `program.invoke()`. @default `process.argv.slice(2)` */
    argv?: readonly string[];
    /** Execute this binary instead of the in-process handler. */
    bin?: string;
    /** Optional subcommands. */
    commands?: readonly CliCommand<any, TContext>[];
    /** Handler for errors thrown while running this command. */
    onError?: (error: unknown, context: TContext) => void | Promise<void>;
    /** Positional arguments. */
    args?: readonly CliArgument[];
    /**
     * Runtime-only options appended after the schema-derived options. An option
     * with a `path` intentionally maps a runtime flag back to a config field.
     */
    options?: TOptions;
    /**
     * Options inherited by subcommands. A subcommand sees them only when it
     * opts in with {@link inherit}.
     */
    globalOptions?: TGlobalOptions;
    /** Inherit the immediate parent command's global options. */
    inherit?: boolean;
    /**
     * Overrides merged after the CLI values but before validation. A function
     * receives the explicit CLI values.
     */
    overrides?:
        | PartialDeep<TConfig>
        | ((
              values: CliOptionValues<readonly [...TGlobalOptions, ...TOptions]>
          ) => PartialDeep<TConfig>);
    /** Run with the validated config + the explicit CLI values. */
    run<Context extends CliCommandContext = TContext>(
        context: ConfigProgramRunContext<
            TConfig,
            TContext & Context,
            readonly [...TGlobalOptions, ...TOptions]
        >
    ): void | Promise<void>;
}

/** A shorthand option accepted by the chain: flags string, tuple or descriptor. */
export type ConfigOptionInput =
    | string
    | CliOption
    | readonly [flags: string, description?: string, defaultValue?: string];

/** Normalize one option shorthand into a descriptor. */
type NormalizeOptionInput<Input> = Input extends string
    ? { flags: Input; description: '' }
    : Input extends readonly [
            infer Flags extends string,
            infer Description extends string,
            infer Default extends string,
        ]
      ? { flags: Flags; description: Description; default: Default }
      : Input extends readonly [infer Flags extends string, infer Description extends string]
        ? { flags: Flags; description: Description }
        : Input extends readonly [infer Flags extends string]
          ? { flags: Flags; description: '' }
          : Input extends CliOption
            ? Input
            : never;

/** Normalize a shorthand option list while preserving literal flags. */
export type NormalizeOptionInputs<Inputs extends readonly ConfigOptionInput[]> = {
    [Index in keyof Inputs]: NormalizeOptionInput<Inputs[Index]>;
};

/** A setup callback that builds one subcommand from a scoped chain. */
type ConfigCommandSetup<TSchema extends ConfigSchema, TContext extends CliCommandContext> = (
    command: ConfigScopeCommand<TSchema, ConfigScopeKeys<TSchema>, TContext>
) => CliCommand<any, TContext>;

/** A subcommand definition accepted by `.commands()` / `.subcommands()`. */
export type ConfigCommandInput<TSchema extends ConfigSchema, TContext extends CliCommandContext> =
    | CliCommand<any, TContext>
    | readonly [scope: ConfigScopeKeys<TSchema>]
    | readonly [scope: ConfigScopeKeys<TSchema>, description: string]
    | readonly [scope: ConfigScopeKeys<TSchema>, setup: ConfigCommandSetup<TSchema, TContext>]
    | readonly [
          scope: ConfigScopeKeys<TSchema>,
          description: string,
          setup: ConfigCommandSetup<TSchema, TContext>,
      ]
    | {
          scope: ConfigScopeKeys<TSchema>;
          description?: string;
          setup?: ConfigCommandSetup<TSchema, TContext>;
          globalOptions?: readonly ConfigOptionInput[];
          inherit?: boolean;
      };

type ConfigCommandOfSetup<
    Setup,
    TContext extends CliCommandContext,
    Scope extends string,
> = Setup extends (command: any) => infer Command
    ? Command extends CliCommand<any, TContext>
        ? Command
        : CliCommand<[], TContext, [], Scope, Scope>
    : CliCommand<[], TContext, [], Scope, Scope>;

type ConfigCommandOfTuple<
    Input extends readonly unknown[],
    TContext extends CliCommandContext,
> = Input extends readonly [infer Scope extends string, unknown, infer Setup]
    ? ConfigCommandOfSetup<Setup, TContext, Scope>
    : Input extends readonly [infer Scope extends string, infer Second]
      ? Second extends string
          ? CliCommand<[], TContext, [], Scope, Scope>
          : ConfigCommandOfSetup<Second, TContext, Scope>
      : Input extends readonly [infer Scope extends string]
        ? CliCommand<[], TContext, [], Scope, Scope>
        : never;

type ConfigCommandOfInput<Input, TContext extends CliCommandContext> =
    Input extends CliCommand<any, TContext>
        ? Input
        : Input extends readonly unknown[]
          ? ConfigCommandOfTuple<Input, TContext>
          : Input extends { scope: infer Scope extends string; setup?: infer Setup }
            ? ConfigCommandOfSetup<Setup, TContext, Scope>
            : never;

/** Resolve the commands produced by a `.commands()` input list. */
export type ConfigCommandsOfInputs<
    Inputs extends readonly unknown[],
    TContext extends CliCommandContext,
> = {
    [Index in keyof Inputs]: ConfigCommandOfInput<Inputs[Index], TContext>;
};

type ShorthandOption<Flags extends string, Description extends string, Default> = {
    flags: Flags;
    description: Description;
} & ([Default] extends [never] ? {} : { default: Default extends string ? Default : never });

/**
 * Chainable command builder. Terminal `run()` returns a `CliCommand`.
 */
export interface ConfigScopeCommand<
    TSchema extends ConfigSchema,
    K extends string = ConfigScopeKeys<TSchema>,
    TContext extends CliCommandContext = CliCommandContext,
    TOptions extends readonly CliOption[] = readonly CliOption[],
    TCommands extends readonly CliCommand<any, TContext>[] = [],
    TName extends string = K,
    TGlobalOptions extends readonly CliOption[] = [],
> {
    /** Set the command name. */
    name<const N extends string>(
        name: N
    ): ConfigScopeCommand<TSchema, K, TContext, TOptions, TCommands, N, TGlobalOptions>;
    /** Set the command description. */
    description(
        description: string
    ): ConfigScopeCommand<TSchema, K, TContext, TOptions, TCommands, TName, TGlobalOptions>;
    /** Set the command version (`<name> --version`). */
    version(
        version: string
    ): ConfigScopeCommand<TSchema, K, TContext, TOptions, TCommands, TName, TGlobalOptions>;
    /** Set the explicit argv used by `program.invoke()`. */
    argv(
        values: readonly string[]
    ): ConfigScopeCommand<TSchema, K, TContext, TOptions, TCommands, TName, TGlobalOptions>;
    /** Execute this binary instead of the in-process handler. */
    bin(
        location: string
    ): ConfigScopeCommand<TSchema, K, TContext, TOptions, TCommands, TName, TGlobalOptions>;
    /** Append one runtime option; `values` is re-inferred. */
    option<const O extends CliOption>(
        option: O
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        readonly [...TOptions, O],
        TCommands,
        TName,
        TGlobalOptions
    >;
    /** Commander-style shorthand (`option('--json', 'Print JSON.')`). */
    option<
        const Flags extends string,
        const Description extends string = '',
        const Default extends string = never,
    >(
        flags: Flags,
        description?: Description,
        defaultValue?: Default
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        readonly [...TOptions, ShorthandOption<Flags, Description, Default>],
        TCommands,
        TName,
        TGlobalOptions
    >;
    /** Append one option from any shorthand form. */
    option<const Input extends ConfigOptionInput>(
        input: Input
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        readonly [...TOptions, NormalizeOptionInput<Input>],
        TCommands,
        TName,
        TGlobalOptions
    >;
    /** Append several options from one array. */
    options<const Inputs extends readonly ConfigOptionInput[]>(
        options: Inputs
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        readonly [...TOptions, ...NormalizeOptionInputs<Inputs>],
        TCommands,
        TName,
        TGlobalOptions
    >;
    /** Append several options passed as separate arguments. */
    options<const Inputs extends readonly ConfigOptionInput[]>(
        ...options: Inputs
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        readonly [...TOptions, ...NormalizeOptionInputs<Inputs>],
        TCommands,
        TName,
        TGlobalOptions
    >;
    /** Append one global option (available to this command and opted-in children). */
    globalOption<const O extends CliOption>(
        option: O
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        TCommands,
        TName,
        readonly [...TGlobalOptions, O]
    >;
    /** Commander-style global option shorthand. */
    globalOption<
        const Flags extends string,
        const Description extends string = '',
        const Default extends string = never,
    >(
        flags: Flags,
        description?: Description,
        defaultValue?: Default
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        TCommands,
        TName,
        readonly [...TGlobalOptions, ShorthandOption<Flags, Description, Default>]
    >;
    /** Append one global option from any shorthand form. */
    globalOption<const Input extends ConfigOptionInput>(
        input: Input
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        TCommands,
        TName,
        readonly [...TGlobalOptions, NormalizeOptionInput<Input>]
    >;
    /** Append several global options from one array. */
    globalOptions<const Inputs extends readonly ConfigOptionInput[]>(
        options: Inputs
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        TCommands,
        TName,
        readonly [...TGlobalOptions, ...NormalizeOptionInputs<Inputs>]
    >;
    /** Append several global options passed as separate arguments. */
    globalOptions<const Inputs extends readonly ConfigOptionInput[]>(
        ...options: Inputs
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        TCommands,
        TName,
        readonly [...TGlobalOptions, ...NormalizeOptionInputs<Inputs>]
    >;
    /** Inherit the immediate parent command's global options. */
    inherit(
        value?: boolean
    ): ConfigScopeCommand<TSchema, K, TContext, TOptions, TCommands, TName, TGlobalOptions>;
    /** Add a typed subcommand. */
    command<
        K2 extends ConfigScopeKeys<TSchema>,
        const C extends CliCommand<any, TContext> = CliCommand<any, TContext>,
    >(
        scope: K2,
        setup: (
            command: ConfigScopeCommand<
                TSchema,
                K2,
                TContext,
                readonly CliOption[],
                [],
                K2,
                TGlobalOptions
            >
        ) => C
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        readonly [...TCommands, C],
        TName,
        TGlobalOptions
    >;
    /** Commander-style shorthand (`command('serve', 'Serve.', setup)`). */
    command<
        K2 extends ConfigScopeKeys<TSchema>,
        const Description extends string = '',
        const C extends CliCommand<any, TContext> = CliCommand<[], TContext, [], K2, K2>,
    >(
        scope: K2,
        description: Description,
        setup?: (
            command: ConfigScopeCommand<
                TSchema,
                K2,
                TContext,
                readonly CliOption[],
                [],
                K2,
                TGlobalOptions
            >
        ) => C
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        readonly [...TCommands, C],
        TName,
        TGlobalOptions
    >;
    /** Add several subcommands from one array. */
    commands<const Inputs extends readonly ConfigCommandInput<TSchema, TContext>[]>(
        commands: Inputs
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        readonly [...TCommands, ...ConfigCommandsOfInputs<Inputs, TContext>],
        TName,
        TGlobalOptions
    >;
    /** Add several subcommands passed as separate arguments. */
    commands<const Inputs extends readonly ConfigCommandInput<TSchema, TContext>[]>(
        ...commands: Inputs
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        readonly [...TCommands, ...ConfigCommandsOfInputs<Inputs, TContext>],
        TName,
        TGlobalOptions
    >;
    /** Alias of {@link command}. */
    subcommand<
        K2 extends ConfigScopeKeys<TSchema>,
        const C extends CliCommand<any, TContext> = CliCommand<any, TContext>,
    >(
        scope: K2,
        setup: (
            command: ConfigScopeCommand<
                TSchema,
                K2,
                TContext,
                readonly CliOption[],
                [],
                K2,
                TGlobalOptions
            >
        ) => C
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        readonly [...TCommands, C],
        TName,
        TGlobalOptions
    >;
    /** Commander-style shorthand for {@link subcommand}. */
    subcommand<
        K2 extends ConfigScopeKeys<TSchema>,
        const Description extends string = '',
        const C extends CliCommand<any, TContext> = CliCommand<[], TContext, [], K2, K2>,
    >(
        scope: K2,
        description: Description,
        setup?: (
            command: ConfigScopeCommand<
                TSchema,
                K2,
                TContext,
                readonly CliOption[],
                [],
                K2,
                TGlobalOptions
            >
        ) => C
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        readonly [...TCommands, C],
        TName,
        TGlobalOptions
    >;
    /** Add several subcommands from one array. */
    subcommands<const Inputs extends readonly ConfigCommandInput<TSchema, TContext>[]>(
        commands: Inputs
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        readonly [...TCommands, ...ConfigCommandsOfInputs<Inputs, TContext>],
        TName,
        TGlobalOptions
    >;
    /** Add several subcommands passed as separate arguments. */
    subcommands<const Inputs extends readonly ConfigCommandInput<TSchema, TContext>[]>(
        ...commands: Inputs
    ): ConfigScopeCommand<
        TSchema,
        K,
        TContext,
        TOptions,
        readonly [...TCommands, ...ConfigCommandsOfInputs<Inputs, TContext>],
        TName,
        TGlobalOptions
    >;
    /** Handler for errors thrown by this command or its subcommands. */
    onError(
        handler: (error: unknown, context: TContext) => void | Promise<void>
    ): ConfigScopeCommand<TSchema, K, TContext, TOptions, TCommands, TName, TGlobalOptions>;
    /**
     * Finish the command. Omit the handler for a pure grouping command; the
     * run context is inferred from the scope and accumulated options.
     */
    run(
        handler?: (
            context: ConfigProgramRunContext<
                ConfigScopeOf<TSchema, K>,
                TContext,
                readonly [...TGlobalOptions, ...TOptions]
            >
        ) => void | Promise<void>
    ): CliCommand<TOptions, TContext, TCommands, K, TName, TGlobalOptions>;
}

/** Every command spec a schema can generate, discriminated by `scope`. */
export type ConfigProgramCommandFor<
    TSchema extends ConfigSchema,
    TContext extends CliCommandContext = CliCommandContext,
> = {
    [K in ConfigScopeKeys<TSchema>]: ConfigScopeCommand<TSchema, K, TContext>;
}[ConfigScopeKeys<TSchema>];

/** Options for {@link ConfigEngineCliProgram.create}. */
export interface GenerateConfigProgramOptions<
    TSchema extends ConfigSchema = ConfigSchema,
    TContext extends CliCommandContext = CliCommandContext,
> extends GenerateConfigCliOptions {
    /**
     * Explicit command specs. When omitted, one command is generated per
     * command-eligible scope (`cliCommand: false` opts a scope out).
     */
    commands?: readonly (ConfigProgramCommand<unknown, TContext> & {
        scope?: ConfigScopeKeys<TSchema>;
    })[];
}

/**
 * Builds one command spec with the engine's scope/context types. Used by the
 * callback form of {@link ConfigEngineCliProgram.create}.
 */
export interface ConfigCommandBuilder<
    TSchema extends ConfigSchema,
    TContext extends CliCommandContext = CliCommandContext,
> {
    <K extends ConfigScopeKeys<TSchema> = ConfigScopeKeys<TSchema>>(
        scope?: K
    ): ConfigScopeCommand<TSchema, K, TContext>;
    <
        K extends ConfigScopeKeys<TSchema>,
        const TOptions extends readonly CliOption[] = readonly CliOption[],
        const TName extends string = K,
        const TGlobalOptions extends readonly CliOption[] = readonly CliOption[],
    >(
        scope: K,
        command: ConfigProgramCommand<
            ConfigScopeOf<TSchema, K>,
            TContext,
            TOptions,
            TGlobalOptions
        > & {
            name?: TName;
            globalOptions?: TGlobalOptions;
        }
    ): CliCommand<TOptions, TContext, [], K, TName, TGlobalOptions>;
    /** Build a runtime-only command (no config scope). */
    <const TName extends string = string>(
        name: string
    ): ConfigScopeCommand<TSchema, string, TContext, readonly CliOption[], [], TName, []>;
    /** Build a runtime-only command spec (no config scope). */
    <
        const TOptions extends readonly CliOption[] = readonly CliOption[],
        const TName extends string = string,
        const TGlobalOptions extends readonly CliOption[] = readonly CliOption[],
    >(
        name: string,
        command: ConfigProgramCommand<unknown, TContext, TOptions, TGlobalOptions> & {
            name?: TName;
            globalOptions?: TGlobalOptions;
        }
    ): CliCommand<TOptions, TContext, [], string, TName, TGlobalOptions>;
}

/**
 * The command shapes a program builder may return: one command or a readonly
 * list of commands. The list case keeps tuple/entry inference.
 */
export type ConfigProgramCommands<TContext extends CliCommandContext = CliCommandContext> =
    | CliCommand<any, TContext>
    | readonly CliCommand<any, TContext>[];

/**
 * Resolve the normalized program command type. An empty list resolves to
 * `CliCommand<[], TContext>[]` (the engine's generated fallback), a single
 * command stays a single command and tuples keep their per-entry options.
 */
export type ResolveConfigProgramCommands<
    TCommands,
    TContext extends CliCommandContext = CliCommandContext,
> = TCommands extends readonly []
    ? CliCommand<[], TContext>[]
    : TCommands extends CliCommand<any, TContext>
      ? TCommands
      : TCommands extends readonly CliCommand<any, TContext>[]
        ? TCommands
        : never;

type IsAny<T> = 0 extends 1 & T ? true : false;

/** One resolved command entry available to hooks and invocation. */
export type ConfigProgramCommandEntry<TCommands, TGlobalOptions extends readonly CliOption[] = []> =
    IsAny<TCommands> extends true
        ? never
        : TCommands extends readonly (infer Item)[]
          ? IsAny<Item> extends true
              ? never
              : ConfigProgramCommandEntry<Item, TGlobalOptions>
          : TCommands extends CliCommand<
                  infer TOptions extends readonly CliOption[],
                  infer TContext,
                  infer TSubcommands,
                  infer TScope,
                  infer TName,
                  infer TCommandGlobals extends readonly CliOption[]
              >
            ?
                  | {
                        name: TName;
                        scope: TScope;
                        values: CliOptionValues<
                            readonly [...TGlobalOptions, ...TCommandGlobals, ...TOptions]
                        >;
                        context: TContext;
                        command: TCommands;
                    }
                  | (IsAny<TSubcommands> extends true
                        ? never
                        : ConfigProgramCommandEntry<TSubcommands, TGlobalOptions>)
            : never;

type IsBroad<T> = string extends T ? true : false;

type LiteralScope<T> = IsBroad<Exclude<T, undefined>> extends true ? never : Exclude<T, undefined>;

type ConfigProgramScopes<TCommands> =
    ConfigProgramCommandEntry<TCommands> extends infer Entry
        ? Entry extends { name: infer TName; scope?: infer TScope }
            ? LiteralScope<TName> | LiteralScope<TScope>
            : never
        : never;

/** The valid hook targets for a program: `all` or a declared command name/scope. */
export type ConfigProgramCommandTarget<TCommands> =
    | 'all'
    | (ConfigProgramScopes<TCommands> extends never ? string : ConfigProgramScopes<TCommands>);

/** The command entry a hook target resolves to. */
export type ConfigProgramEntryFor<
    TCommands,
    TTarget extends string,
    TGlobalOptions extends readonly CliOption[] = [],
> =
    ConfigProgramCommandEntry<TCommands, TGlobalOptions> extends infer Entry
        ? Entry extends { name: infer TName; scope?: infer TScope }
            ? IsBroad<TName> extends true
                ? IsBroad<Exclude<TScope, undefined>> extends true
                    ? Entry
                    : TTarget extends Exclude<TScope, undefined>
                      ? Entry
                      : never
                : TTarget extends TName
                  ? Entry
                  : TTarget extends Exclude<TScope, undefined>
                    ? Entry
                    : never
            : never
        : never;

/** The payload type a hook callback receives. */
export type ConfigProgramHookPayload<
    TCommands,
    TTarget extends string = 'all',
    TGlobalOptions extends readonly CliOption[] = [],
> = TTarget extends 'all'
    ? ConfigProgramCommandEntry<TCommands, TGlobalOptions>
    : ConfigProgramEntryFor<TCommands, TTarget, TGlobalOptions>;

/** A hook callback (promisable). */
export type ConfigProgramHookHandler<
    TCommands,
    TTarget extends string = 'all',
    TGlobalOptions extends readonly CliOption[] = [],
> = (payload: ConfigProgramHookPayload<TCommands, TTarget, TGlobalOptions>) => void | Promise<void>;

/** One hook declaration. */
export type ConfigProgramHookItem<TCommands, TGlobalOptions extends readonly CliOption[] = []> = {
    [Target in ConfigProgramCommandTarget<TCommands>]: {
        phase: 'before' | 'after';
        target: Target;
        handler: ConfigProgramHookHandler<TCommands, Target, TGlobalOptions>;
    };
}[ConfigProgramCommandTarget<TCommands>];

/**
 * Decide whether configured CLI colours are printed. A boolean is static; a
 * function receives the parsed program global options and the invocation
 * context and may be async.
 */
export type ConfigProgramDisableColors<
    TContext extends CliCommandContext = CliCommandContext,
    TGlobalOptions extends readonly CliOption[] = [],
> =
    | boolean
    | ((args: CliOptionValues<TGlobalOptions>, context: TContext) => Promisable<boolean>)
    | Promisable<(args: CliOptionValues<TGlobalOptions>, context: TContext) => boolean>;

export type ConfigProgramOptions<
    TContext extends CliCommandContext = CliCommandContext,
    TGlobalOptions extends readonly CliOption[] = [],
> = {
    /** Explicit argv for `program.invoke()`. @default `process.argv.slice(2)` */
    argv?: readonly string[];
    /** The program name. @default `'program'` */
    name?: string;
    /** Human-readable description. */
    description?: string;
    /** Program version. */
    version?: string;
    /**
     * Options inherited by commands. A subcommand sees them only when it
     * opts in with {@link inherit}.
     */
    globalOptions?: TGlobalOptions;
    /** The host-provided command context. */
    context?: TContext;
    /**
     * Disable the configured CLI colours (help, error, command and option
     * hooks). A boolean is static; a function receives the parsed program
     * global options and the invocation context and may be async.
     * @default `false`
     */
    disableColors?: ConfigProgramDisableColors<TContext, TGlobalOptions>;
    /**
     * Print the full help text after an invalid-argv error (unknown option or
     * command, missing value). The error message is always thrown; the caller
     * decides whether to render it with {@link ConfigProgram.formatError}.
     * @default `false`
     */
    helpOnError?: boolean;
    /** Write to a different stdout */
    writeOut?: (text: string) => void;
    /** Write to a different stderr */
    writeErr?: (text: string) => void;
    /** Program help/error formatting options. */
    format?: ConfigProgramFormatOptions;
};

/**
 * A built CLI program: the resolved commands plus the commander-like runtime
 * (`invoke`, hooks and help/error formatting).
 */
export interface ConfigProgram<
    TCommands,
    TContext extends CliCommandContext = CliCommandContext,
    TGlobalOptions extends readonly CliOption[] = [],
> {
    /** The normalized commands (a single command stays a single command). */
    readonly commands: TCommands;
    /** The program-level global options (parsed for every command). */
    readonly globals: TGlobalOptions;
    /**
     * Whether the host should print the full help text after an invalid-argv
     * error ({@link ConfigProgramOptions.helpOnError}).
     */
    readonly helpOnError: boolean;
    /** Set the program name shown in help. */
    name(value: string): this;
    /** Set the program description shown in help. */
    description(value: string): this;
    /** Set the program version (`--version`). */
    version(value: string): this;
    /** Route help/version output (defaults to `process.stdout.write`). */
    output(writeOut: (text: string) => void, writeErr?: (text: string) => void): this;
    /** Append one program-level global option. */
    globalOption<const O extends CliOption>(
        option: O
    ): ConfigProgram<TCommands, TContext, readonly [...TGlobalOptions, O]>;
    /** Commander-style program global option shorthand. */
    globalOption<
        const Flags extends string,
        const Description extends string = '',
        const Default extends string = never,
    >(
        flags: Flags,
        description?: Description,
        defaultValue?: Default
    ): ConfigProgram<
        TCommands,
        TContext,
        readonly [...TGlobalOptions, ShorthandOption<Flags, Description, Default>]
    >;
    /** Append one program-level global option from any shorthand form. */
    globalOption<const Input extends ConfigOptionInput>(
        input: Input
    ): ConfigProgram<
        TCommands,
        TContext,
        readonly [...TGlobalOptions, NormalizeOptionInput<Input>]
    >;
    /** Append several program-level global options from one array. */
    globalOptions<const Inputs extends readonly ConfigOptionInput[]>(
        options: Inputs
    ): ConfigProgram<
        TCommands,
        TContext,
        readonly [...TGlobalOptions, ...NormalizeOptionInputs<Inputs>]
    >;
    /** Append several program-level global options passed separately. */
    globalOptions<const Inputs extends readonly ConfigOptionInput[]>(
        ...options: Inputs
    ): ConfigProgram<
        TCommands,
        TContext,
        readonly [...TGlobalOptions, ...NormalizeOptionInputs<Inputs>]
    >;
    /** Set the explicit argv used by {@link invoke}. */
    argv(values: readonly string[]): this;
    /** Set the host context handed to commands and hooks. */
    withContext(context: TContext): this;
    /** Merge help/error formatting options. */
    configure(options: ConfigProgramFormatOptions): this;
    /** Render help for the program or a named command. */
    formatHelp(command?: string | CliCommand<any, TContext>): string;
    /** Render an error using the configured template. */
    formatError(error: unknown): string;
    /** Run the program synchronously (use {@link invokeAsync} for async work). */
    invoke(argv?: readonly string[] | TContext, context?: TContext): void;
    /** Run the program, awaiting async hooks/handlers. */
    invokeAsync(argv?: readonly string[] | TContext, context?: TContext): Promise<void>;
    /** Register a before/after hook for every command. */
    hook(
        phase: 'before' | 'after',
        target: 'all',
        handler: ConfigProgramHookHandler<TCommands, 'all', TGlobalOptions>
    ): this;
    /** Register a before/after hook for one command scope. */
    hook<const TTarget extends Exclude<ConfigProgramCommandTarget<TCommands>, 'all'>>(
        phase: 'before' | 'after',
        target: TTarget,
        handler: ConfigProgramHookHandler<TCommands, TTarget, TGlobalOptions>
    ): this;
    /** Register several hooks at once. */
    hooks<const TItems extends readonly ConfigProgramHookItem<TCommands, TGlobalOptions>[]>(
        ...items: TItems
    ): this;
}

/** The high-level CLI program generator bound to a config engine. */
export interface ConfigEngineCliProgram<
    TSchema extends ConfigSchema = ConfigSchema,
    TContext extends CliCommandContext = CliCommandContext,
> {
    /**
     * Build the program's commands. The callback may be async (its result is
     * awaited before invocation). Return one command or an array; an empty
     * array generates one command per command-eligible scope.
     */
    create<
        Context extends CliCommandContext = TContext,
        const Commands extends ConfigProgramCommands<Context> = readonly CliCommand<any, Context>[],
        const Global extends readonly CliOption[] = [],
    >(
        build: (command: ConfigCommandBuilder<TSchema, Context>) => Commands,
        options?: Omit<ConfigProgramOptions<Context, Global>, 'globalOptions'> & {
            globalOptions?: Global;
        }
    ): ConfigProgram<ResolveConfigProgramCommands<Commands, Context>, Context, Global>;
    /**
     * Build the program's commands asynchronously. The callback is awaited and
     * the resolved program is returned.
     */
    create<
        Context extends CliCommandContext = TContext,
        const Commands extends ConfigProgramCommands<Context> = readonly CliCommand<any, Context>[],
        const Global extends readonly CliOption[] = [],
    >(
        build: (command: ConfigCommandBuilder<TSchema, Context>) => Promisable<Commands>,
        options?: Omit<ConfigProgramOptions<Context, Global>, 'globalOptions'> & {
            globalOptions?: Global;
        }
    ): Promise<ConfigProgram<ResolveConfigProgramCommands<Commands, Context>, Context, Global>>;
    /** Build one typed command without creating a whole program. */
    createCommand<
        K extends ConfigScopeKeys<TSchema>,
        const TOptions extends readonly CliOption[] = readonly CliOption[],
        const TName extends string = K,
        const TGlobalOptions extends readonly CliOption[] = readonly CliOption[],
    >(
        scope: K,
        command: ConfigProgramCommand<
            ConfigScopeOf<TSchema, K>,
            TContext,
            TOptions,
            TGlobalOptions
        > & {
            name?: TName;
            globalOptions?: TGlobalOptions;
        }
    ): CliCommand<TOptions, TContext, [], K, TName, TGlobalOptions>;
    /** Build one runtime-only command without a config scope. */
    createCommand<
        const TOptions extends readonly CliOption[] = readonly CliOption[],
        const TName extends string = string,
        const TGlobalOptions extends readonly CliOption[] = readonly CliOption[],
    >(
        name: string,
        command: ConfigProgramCommand<unknown, TContext, TOptions, TGlobalOptions> & {
            name?: TName;
            globalOptions?: TGlobalOptions;
        }
    ): CliCommand<TOptions, TContext, [], string, TName, TGlobalOptions>;
}
