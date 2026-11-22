/**
 * Colour resolution and the format options used by help/error rendering.
 */

import type { CliCommandContext } from '@deltabox/toolchain/shared';

import type { ConfigProgramFormatOptions } from '../../types/format.js';
import { parseCommandArgs } from './parse.js';
import type { AnyCommand, ProgramState } from './types.js';
import { isThenable } from './utils.js';

/** Strip every configured colour hook (program, help, error and per-command). */
export function withoutColors(options: ConfigProgramFormatOptions): ConfigProgramFormatOptions {
    const box = options.help?.box;
    const errorBox = options.error?.box;
    return {
        ...options,
        colors: {},
        help: {
            ...options.help,
            colors: {},
            ...(box ? { box: { ...box, color: undefined } } : {}),
        },
        error: {
            ...options.error,
            messageColor: undefined,
            stackColor: undefined,
            ...(errorBox ? { box: { ...errorBox, color: undefined } } : {}),
        },
        options: {},
        commands: Object.fromEntries(
            Object.entries(options.commands ?? {}).map(([name, command]) => [
                name,
                {
                    ...command,
                    colors: {},
                    ...(command.box ? { box: { ...command.box, color: undefined } } : {}),
                },
            ])
        ),
    };
}

/** Parse only the program-level globals from the raw argv (leniently). */
export function globalArgsOf<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[]
): Record<string, unknown> {
    try {
        return parseCommandArgs(
            {
                name: '',
                description: '',
                options: state.globalOptions,
                passthrough: true,
            } as AnyCommand,
            argv,
            state.format
        ).values;
    } catch {
        return {};
    }
}

/** Resolve `ProgramState.disableColors` for one invocation. */
export async function resolveDisableColors<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[],
    context: TContext
): Promise<boolean> {
    const option = state.disableColors;
    if (option === undefined) return false;
    const args = globalArgsOf(state, argv);
    const resolved = await option;
    if (typeof resolved === 'boolean') return resolved;
    if (typeof resolved === 'function') return Boolean(await resolved(args, context));
    return false;
}

/** Synchronous counterpart of {@link resolveDisableColors} (`invoke()`). */
export function resolveDisableColorsSync<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[],
    context: TContext
): boolean {
    const option = state.disableColors;
    if (option === undefined) return false;
    if (isThenable(option)) {
        throw new Error(
            '`disableColors` is asynchronous; use `program.invokeAsync()` for async resolvers.'
        );
    }
    if (typeof option === 'boolean') return option;
    if (typeof option === 'function') {
        const result = option(globalArgsOf(state, argv), context);
        if (isThenable(result)) {
            // The resolver may already be running; swallow its eventual
            // rejection so the synchronous error below stays the only one.
            void Promise.resolve(result).catch(() => {});
            throw new Error(
                '`disableColors` is asynchronous; use `program.invokeAsync()` for async resolvers.'
            );
        }
        return Boolean(result);
    }
    return false;
}

/** The format options for the last/current invocation. */
export function formatForState<TContext extends CliCommandContext>(
    state: ProgramState<TContext>
): ConfigProgramFormatOptions {
    const disabled =
        typeof state.disableColors === 'boolean' ? state.disableColors : state.colorsDisabled;
    return disabled ? withoutColors(state.format) : state.format;
}

/** Resolve colours for an async invocation. */
export async function formatForInvocation<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[],
    context: TContext
): Promise<ConfigProgramFormatOptions> {
    state.colorsDisabled = await resolveDisableColors(state, argv, context);
    return formatForState(state);
}

/** Resolve colours for a sync invocation. */
export function formatForSyncInvocation<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[],
    context: TContext
): ConfigProgramFormatOptions {
    state.colorsDisabled = resolveDisableColorsSync(state, argv, context);
    return formatForState(state);
}
