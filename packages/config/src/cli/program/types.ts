/**
 * Shared internal types for the config program runtime.
 */

import type { Awaitable } from '@deltabox/toolchain-shared';
import type { CliCommand, CliCommandContext, CliOption } from '@deltabox/toolchain/shared';

import type { ConfigProgramFormatOptions, ConfigProgramGroupsOptions } from '../../types/format.js';

export type AnyCommand = CliCommand<any, any>;

/** A registered runtime hook. */
export interface RuntimeHook {
    phase: 'before' | 'after';
    target: string;
    handler: (payload: unknown) => void | Promise<void>;
}

/** The mutable state behind one built program. */
export interface ProgramState<TContext extends CliCommandContext> {
    commands: unknown;
    list: AnyCommand[];
    globalOptions: CliOption[];
    name: string;
    description?: string;
    version?: string;
    writeOut?: (text: string) => void;
    writeErr?: (text: string) => void;
    explicitArgv?: readonly string[];
    context?: TContext;
    format: ConfigProgramFormatOptions;
    disableColors?: RuntimeDisableColors<TContext>;
    helpOnError: boolean;
    groups: ConfigProgramGroupsOptions;
    colorsDisabled: boolean;
    hooks: RuntimeHook[];
}

/** The runtime shape of `ConfigProgramOptions.disableColors`. */
export type RuntimeDisableColors<TContext extends CliCommandContext> =
    | boolean
    | ((args: Record<string, unknown>, context: TContext) => Awaitable<boolean>)
    | Promise<(args: Record<string, unknown>, context: TContext) => boolean>;

/** One parsed form of a commander-style option definition. */
export interface OptionDef {
    key: string;
    long?: string;
    short?: string;
    takesValue: boolean;
    optionalValue: boolean;
    multiple: boolean;
    negated: boolean;
    option: CliOption;
}

/** A command resolved from argv. */
export interface Selected {
    command: AnyCommand;
    path: string[];
    rest: string[];
    ancestors: AnyCommand[];
}

/** The outcome of routing argv to a command, help/version or an error. */
export interface Selection {
    selected?: Selected;
    help?: { command?: AnyCommand; path: string[]; ancestors: AnyCommand[] };
    version?: { command: AnyCommand; value: string };
    unknownCommand?: { input: string; level: AnyCommand[] };
    missingCommand?: { level: AnyCommand[] };
}

/** Values parsed for one command invocation. */
export interface ParsedCommand {
    values: Record<string, unknown>;
    positionals: string[];
}
