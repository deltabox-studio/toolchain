/**
 * Commander-like runtime for `ConfigProgram`s: argv routing, per-command
 * `parseArgs` parsing, hooks, help/error rendering and binary execution.
 *
 * The implementation is split across small modules; this entry point exposes
 * the public API (`createConfigProgram`, suggestions and the box renderer).
 */

import type { CliCommandContext, CliOption } from '@deltabox/toolchain/shared';

import type {
    ConfigProgram,
    ConfigProgramCommands,
    ConfigProgramHookItem,
    ConfigProgramOptions,
    ResolveConfigProgramCommands,
} from '../../types/cli/index.js';
import {
    ConfigProgramError,
    mergeFormatOptions,
    renderBox,
    renderCommandHelp,
    renderError,
    renderProgramHelp,
} from '../format.js';
import { executeAsync, executeSync } from './execute.js';
import { formatForState } from './format-state.js';
import { findCommand, resolveInvocation, withGlobalOptions } from './invocation.js';
import { normalizeOptionInput } from './options.js';
import type { AnyCommand, ProgramState, RuntimeDisableColors } from './types.js';

export { editDistance, suggest } from './suggest.js';

/** Normalize the command shape while validating every command is finished. */
function listOf<TContext extends CliCommandContext>(
    commands: ConfigProgramCommands<TContext>
): AnyCommand[] {
    const list = Array.isArray(commands) ? [...commands] : [commands as AnyCommand];
    for (const command of list) {
        if (!command || typeof command.name !== 'string' || typeof command.run !== 'function') {
            throw new Error(
                'Invalid program command: finish every command with `.run()` before returning it from create().'
            );
        }
    }
    return list;
}

/**
 * Build the runtime around normalized commands. The command shape is kept
 * exactly as passed (single command stays single, arrays stay arrays).
 */
export function createConfigProgram<
    TCommands,
    TContext extends CliCommandContext = CliCommandContext,
    TGlobalOptions extends readonly CliOption[] = [],
>(
    commands: TCommands,
    options: ConfigProgramOptions<TContext, TGlobalOptions> = {}
): ConfigProgram<ResolveConfigProgramCommands<TCommands, TContext>, TContext, TGlobalOptions> {
    const state: ProgramState<TContext> = {
        commands,
        list: listOf(commands as ConfigProgramCommands<TContext>),
        globalOptions: [...(options.globalOptions ?? [])],
        name: options.name ?? 'program',
        ...(options.description ? { description: options.description } : {}),
        ...(options.version ? { version: options.version } : {}),
        ...(options.writeOut ? { writeOut: options.writeOut } : {}),
        ...(options.writeErr ? { writeErr: options.writeErr } : {}),
        ...(options.argv ? { explicitArgv: options.argv } : {}),
        ...(options.context ? { context: options.context } : {}),
        ...(options.disableColors !== undefined
            ? {
                  disableColors: options.disableColors as unknown as RuntimeDisableColors<TContext>,
              }
            : {}),
        format: mergeFormatOptions({}, options.format),
        helpOnError: options.helpOnError === true,
        groups: options.groups ?? true,
        sort: options.sort ?? 'asc',
        colorsDisabled: false,
        hooks: [],
    };

    const program: ConfigProgram<
        ResolveConfigProgramCommands<TCommands, TContext>,
        TContext,
        TGlobalOptions
    > = {
        get commands() {
            return state.commands as never;
        },
        get globals() {
            return state.globalOptions as never;
        },
        get helpOnError() {
            return state.helpOnError;
        },
        get groups() {
            return state.groups;
        },
        get sort() {
            return state.sort;
        },
        name(value: string) {
            state.name = value;
            return program;
        },
        description(value: string) {
            state.description = value;
            return program;
        },
        version(value: string) {
            state.version = value;
            return program;
        },
        output(writeOut: (text: string) => void, writeErr?: (text: string) => void) {
            state.writeOut = writeOut;
            if (writeErr) state.writeErr = writeErr;
            return program;
        },
        globalOption(...args: unknown[]) {
            const input = args.length > 1 ? args : args[0];
            state.globalOptions.push(normalizeOptionInput(input));
            return program as never;
        },
        globalOptions(...args: unknown[]) {
            const inputs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
            for (const input of inputs) state.globalOptions.push(normalizeOptionInput(input));
            return program as never;
        },
        argv(values) {
            state.explicitArgv = values;
            return program;
        },
        withContext(context) {
            state.context = context;
            return program;
        },
        configure(format) {
            state.format = mergeFormatOptions(state.format, format);
            return program;
        },
        formatHelp(command) {
            const format = formatForState(state);
            if (typeof command === 'string') {
                const found = findCommand(state.list, command);
                if (!found) throw new ConfigProgramError('unknownCommand', command, format);
                return renderCommandHelp(
                    withGlobalOptions(found, [
                        ...state.globalOptions,
                        ...(found.globalOptions ?? []),
                    ]),
                    [],
                    format,
                    state.groups,
                    state.sort
                );
            }
            if (command) {
                return renderCommandHelp(
                    withGlobalOptions(command, [
                        ...state.globalOptions,
                        ...(command.globalOptions ?? []),
                    ]),
                    [],
                    format,
                    state.groups,
                    state.sort
                );
            }
            return renderProgramHelp(
                state.name,
                state.description,
                state.list,
                format,
                state.globalOptions,
                state.groups,
                state.sort
            );
        },
        formatError(error) {
            return renderError(error, formatForState(state));
        },
        invoke(argv, context) {
            const resolved = resolveInvocation(state, argv, context);
            executeSync(state, resolved.argv, resolved.context);
        },
        async invokeAsync(argv, context) {
            const resolved = resolveInvocation(state, argv, context);
            await executeAsync(state, resolved.argv, resolved.context);
        },
        hook(
            phase: 'before' | 'after',
            target: string,
            handler: (payload: never) => void | Promise<void>
        ) {
            state.hooks.push({ phase, target, handler: handler as never });
            return program;
        },
        hooks(...items) {
            for (const item of items as readonly ConfigProgramHookItem<unknown>[]) {
                state.hooks.push({
                    phase: item.phase,
                    target: item.target as string,
                    handler: item.handler as never,
                });
            }
            return program;
        },
    };
    return program;
}

export { renderBox };
