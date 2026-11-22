import type { Simplify } from 'type-fest';

import type { ProjectType } from '../config-types.js';
import type { Replacements } from '../template.js';
import type { Awaitable } from './common.js';
import type { SyncTask } from './sync.js';
import type { ToolchainConfig } from './toolchain.js';

/** A CLI option a tooling command exposes (framework-agnostic). */
export interface CliOption {
    /** Commander-style flags, eg. `-o, --out <path>`. */
    flags: string;
    /** Human-readable description. */
    description: string;
    /** Optional default value (stringified). */
    default?: string;
    /** Collect repeated occurrences into an array (eg. `--from a --from b`). */
    multiple?: boolean;
    /**
     * The dotted config path this runtime flag intentionally maps to. When set,
     * the generated command passes the parsed value through config validation.
     */
    path?: string;
    /** The config value type used to parse {@link path}. @default `string` */
    type?: string;
    /** Coerce one raw CLI string before it is applied at {@link path}. */
    parse?: (value: string) => unknown;
    /** Allowed values; used for validation and misspelling suggestions. */
    choices?: readonly string[];
    /**
     * Optional help group. Options sharing a group are rendered under their own
     * heading (eg. `Advanced:`) instead of the default `Options:` section.
     */
    group?: string;
    /** Keep the option registered but out of the generated docs. */
    hidden?: boolean;
}

type OptionLongName<F extends string> = F extends `${string}--${infer Rest}` ? Rest : never;

type OptionNameOnly<S extends string> = S extends `${infer Head} ${string}`
    ? Head
    : S extends `${infer Head}=${string}`
      ? Head
      : S extends `${infer Head}<${string}`
        ? Head
        : S extends `${infer Head}[${string}`
          ? Head
          : S;

type KebabToCamel<S extends string> = S extends `${infer Head}-${infer Tail}`
    ? `${Head}${Capitalize<KebabToCamel<Tail>>}`
    : S;

type OptionKey<F extends string> =
    OptionNameOnly<OptionLongName<F>> extends `no-${infer Name}`
        ? KebabToCamel<Name>
        : KebabToCamel<OptionNameOnly<OptionLongName<F>>>;

type OptionValue<O> = O extends { type: infer T extends string }
    ? T extends 'number'
        ? number
        : T extends 'boolean'
          ? boolean
          : T extends 'array'
            ? string[]
            : string
    : O extends { multiple: true }
      ? string[]
      : O extends { flags: infer F extends string }
        ? F extends `${string}...${string}`
            ? F extends `${string}[${string}`
                ? string[] | true
                : string[]
            : F extends `${string}[${string}`
              ? string | true
              : F extends `${string}<${string}`
                ? string
                : boolean
        : unknown;

type OptionEntry<O> = O extends { flags: infer F extends string }
    ? string extends F
        ? {}
        : { [K in OptionKey<F>]?: OptionValue<O> }
    : {};

type UnionToIntersection<U> = (U extends unknown ? (value: U) => void : never) extends (
    value: infer I
) => void
    ? I
    : never;

/**
 * The commander-style values an option list produces. Known long flags become
 * optional typed keys (`--json` -> `json?: boolean`, `--cwd <dir>` ->
 * `cwd?: string`); unknown/dynamic flags stay addressable through the index
 * signature.
 */
export type CliOptionValues<TOptions extends readonly CliOption[] | undefined> = Simplify<
    (TOptions extends readonly (infer Option)[] ? UnionToIntersection<OptionEntry<Option>> : {}) &
        Record<string, unknown>
>;

/**
 * The minimal context shared by every CLI command: only the project root.
 *
 * Generic APIs (eg. the config engine's program generator) use this base so a
 * host can supply its own context without importing a dbx-specific type.
 */
export interface CliCommandContext {
    /** The project root the command runs in. */
    cwd: string;
}

/**
 * The dbx/toolchain CLI context handed to every bundled command after the
 * consumer's `dbx.config.*` has been loaded, so a command can derive its
 * defaults from the config; explicit CLI flags override those defaults.
 */
export interface ToolchainCommandContext extends CliCommandContext {
    /** The detected/configured project kind. */
    projectType: ProjectType;
    /** The loaded tooling config (empty object when none was found). */
    config: ToolchainConfig;
    /** The project's own (unmerged) config, when loaded from a file. */
    ownConfig?: ToolchainConfig;
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** The config file that was loaded, if any. */
    configPath?: string;
    /** The inherited ancestor config file, when this project has no config of its own. */
    parentPath?: string;
    /** Whether config discovery was disabled (`dbx --no-config`). */
    noConfig?: boolean;
    /** Whether this project has no config of its own but an ancestor config. */
    configless?: boolean;
    /**
     * Whether the toolchain should manage this project. Config-bearing projects
     * are always managed; configless projects only when opted in (`--configless`
     * or `project.manageConfigless`).
     */
    managed?: boolean;
    /** Whether the config came from a `dbx()` Vite/Vite+ plugin. */
    plugin?: boolean;
    /** The `vite.config.*` that carries the plugin, when {@link plugin}. */
    pluginPath?: string;
    /**
     * Set when a `dbx.config.*` file failed to import (the CLI loads configs
     * tolerantly so unrelated commands still work). Commands that cannot operate
     * without a valid config (eg. `sync`) fail on it.
     */
    configError?: string;
    /**
     * The managed-file sync tasks `dbx sync` runs. Supplied by the CLI (which
     * aggregates the packages) so a package command such as `migrate` can
     * regenerate managed files without depending on every sync package. Absent
     * when a command is driven programmatically.
     */
    syncTasks?: SyncTask[];
}

/** A positional argument a command accepts. */
export interface CliArgument {
    /** The argument name (also its key in the run `args` object). */
    name: string;
    /** Human-readable description. */
    description: string;
    /** Accept one value (default) or many (variadic, collected into an array). */
    variadic?: boolean;
    /** Whether the argument is required. @default `true` */
    required?: boolean;
}

/**
 * A framework-agnostic command description. Packages export these (eg.
 * `configCommands()`) and the root `dbx` CLI builds them into its program, so
 * packages never depend on a CLI framework. `args` contains only the flags
 * explicitly passed on the command line (so config defaults apply otherwise);
 * `context` carries the loaded config.
 */
export interface CliCommand<
    TOptions extends readonly CliOption[] = readonly CliOption[],
    TContext extends CliCommandContext = ToolchainCommandContext,
    TCommands extends readonly CliCommand<any, TContext>[] = readonly any[],
    TScope extends string | undefined = string | undefined,
    TName extends string = string,
    TGlobalOptions extends readonly CliOption[] = readonly CliOption[],
> {
    /** The command name, eg. `config` or `generate`. */
    name: TName;
    /** The config scope the command reads, when it is config-backed. */
    scope?: TScope;
    /** Alternative command names registered alongside {@link name}. */
    aliases?: string[];
    /** Human-readable description. */
    description: string;
    /** Positional arguments the command accepts. */
    args?: CliArgument[];
    /** Options the command accepts. */
    options?: TOptions;
    /**
     * Options inherited by this command's subcommands. A subcommand only sees
     * them when it opts in with {@link inherit}.
     */
    globalOptions?: TGlobalOptions;
    /** Inherit the immediate parent command's {@link globalOptions}. */
    inherit?: boolean;
    /**
     * Forward every operand (including unknown flags) to the command instead of
     * parsing them. Used by provider passthrough commands (eg. `vite:dev`), which
     * hand their raw argv to the wrapped binary. The raw operands arrive under
     * the `args` key of the run argument (typed `string[]`).
     */
    passthrough?: boolean;
    /**
     * Omit the command from generated documentation. Used by provider
     * passthroughs, whose names depend on the consumer's registry.
     */
    hidden?: boolean;
    /** Optional subcommands registered under this command. */
    commands?: TCommands;
    /** Version exposed by this command (`<name> --version`), like commander. */
    version?: string;
    /**
     * Explicit argv used by `program.invoke()`. Defaults to
     * `process.argv.slice(2)`.
     */
    argv?: string[];
    /**
     * A binary (relative to the context cwd, or absolute) executed instead of
     * {@link run}. Its arguments are the operands following the command name.
     */
    bin?: string;
    /** Runs when this command (or a subcommand) throws; receives the host context. */
    onError?: (error: unknown, context: TContext) => Awaitable<void>;
    /** Run the command with the CLI-provided options + the loaded config. */
    run(args: CliOptionValues<TOptions>, context: TContext): Awaitable<void>;
}

/**
 * Define a `CliCommand` while inferring `values` from the literal `options`
 * list. The returned descriptor keeps the inferred option tuple.
 */
export function defineCliCommand<
    const TOptions extends readonly CliOption[] = readonly CliOption[],
    TContext extends CliCommandContext = ToolchainCommandContext,
    TCommands extends readonly CliCommand<any, TContext>[] = readonly any[],
    TScope extends string | undefined = string | undefined,
    TName extends string = string,
    TGlobalOptions extends readonly CliOption[] = readonly CliOption[],
>(
    command: CliCommand<TOptions, TContext, TCommands, TScope, TName, TGlobalOptions>
): CliCommand<TOptions, TContext, TCommands, TScope, TName, TGlobalOptions> {
    return command;
}

/**
 * Define multiple `CliCommand`'s while inferring `values` from the literal `options`
 * list. The returned descriptor keeps the inferred option tuple.
 */
export function defineCliCommands<
    const TOptions extends readonly CliOption[] = readonly CliOption[],
    TContext extends CliCommandContext = ToolchainCommandContext,
    TCommands extends readonly CliCommand<any, TContext>[] = readonly any[],
    TScope extends string | undefined = string | undefined,
    TName extends string = string,
    TGlobalOptions extends readonly CliOption[] = readonly CliOption[],
>(
    commands: readonly CliCommand<TOptions, TContext, TCommands, TScope, TName, TGlobalOptions>[]
): readonly CliCommand<TOptions, TContext, TCommands, TScope, TName, TGlobalOptions>[] {
    return commands;
}
