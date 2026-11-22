/**
 * Command execution: help/version output, argv errors, hooks and binaries.
 */

import { spawn, spawnSync } from 'node:child_process';

import type { CliCommandContext } from '@deltabox/toolchain/shared';

import { ConfigProgramError, renderCommandHelp, renderProgramHelp } from '../format.js';
import { formatForInvocation, formatForSyncInvocation } from './format-state.js';
import {
    applicableGlobalOptions,
    binInvocation,
    commandCandidates,
    hookMatches,
    hookPayload,
    withGlobalOptions,
    writeProgramOut,
} from './invocation.js';
import { applyArguments, parseCommandArgs } from './parse.js';
import { selectCommand } from './selection.js';
import { suggest } from './suggest.js';
import type { ProgramState } from './types.js';
import { hasTokenBeforeSeparator, isThenable } from './utils.js';

/** Run one invocation, awaiting async hooks and handlers. */
export async function executeAsync<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[],
    context: TContext
): Promise<void> {
    const format = await formatForInvocation(state, argv, context);
    if (state.version && (argv[0] === '--version' || argv[0] === '-V')) {
        writeProgramOut(state, state.version);
        return;
    }
    const selection = selectCommand(state.list, argv, state.globalOptions);
    if (selection.help) {
        const globals = applicableGlobalOptions(
            state.globalOptions,
            selection.help.ancestors ?? []
        );
        writeProgramOut(
            state,
            selection.help.command
                ? renderCommandHelp(
                      withGlobalOptions(selection.help.command, globals),
                      selection.help.path.slice(0, -1),
                      format,
                      state.groups,
                      state.sort
                  )
                : renderProgramHelp(
                      state.name,
                      state.description,
                      state.list,
                      format,
                      state.globalOptions,
                      state.groups,
                      state.sort
                  )
        );
        return;
    }
    if (selection.version) {
        writeProgramOut(state, selection.version.value);
        return;
    }
    if (selection.unknownCommand) {
        throw new ConfigProgramError(
            'unknownCommand',
            selection.unknownCommand.input,
            format,
            suggest(
                selection.unknownCommand.input,
                commandCandidates(selection.unknownCommand.level)
            )
        );
    }
    if (selection.missingCommand || !selection.selected) {
        throw new ConfigProgramError('missingCommand', '', format);
    }
    const { command, path: commandPath, rest, ancestors } = selection.selected;
    const globals = applicableGlobalOptions(state.globalOptions, ancestors);
    if (hasTokenBeforeSeparator(rest, ['--help', '-H'])) {
        writeProgramOut(
            state,
            renderCommandHelp(
                withGlobalOptions(command, globals),
                commandPath.slice(0, -1),
                format,
                state.groups,
                state.sort
            )
        );
        return;
    }
    if (command.version && hasTokenBeforeSeparator(rest, ['--version', '-V'])) {
        writeProgramOut(state, command.version);
        return;
    }
    const parsed = parseCommandArgs(withGlobalOptions(command, globals), rest, format);
    const values = applyArguments(command, parsed.values, parsed.positionals, rest, format);
    const payload = hookPayload(command, values, context);

    try {
        for (const hook of state.hooks) {
            if (hook.phase === 'before' && hookMatches(hook, command)) {
                await hook.handler(payload);
            }
        }
        if (command.bin) {
            await runBinary(command.bin, context, rest);
        } else {
            await command.run(values as never, context);
        }
        for (const hook of state.hooks) {
            if (hook.phase === 'after' && hookMatches(hook, command)) {
                await hook.handler(payload);
            }
        }
    } catch (error) {
        if (command.onError) {
            await command.onError(error, context);
            return;
        }
        throw error;
    }
}

/** Run one invocation synchronously, rejecting async handlers/hooks. */
export function executeSync<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[],
    context: TContext
): void {
    const format = formatForSyncInvocation(state, argv, context);
    if (state.version && (argv[0] === '--version' || argv[0] === '-V')) {
        writeProgramOut(state, state.version);
        return;
    }
    const selection = selectCommand(state.list, argv, state.globalOptions);
    if (selection.help || selection.version) {
        if (selection.help?.command) {
            writeProgramOut(
                state,
                renderCommandHelp(
                    selection.help.command,
                    selection.help.path.slice(0, -1),
                    format,
                    state.groups,
                    state.sort
                )
            );
        } else if (selection.help) {
            writeProgramOut(
                state,
                renderProgramHelp(
                    state.name,
                    state.description,
                    state.list,
                    format,
                    state.globalOptions,
                    state.groups,
                    state.sort
                )
            );
        } else if (selection.version) {
            writeProgramOut(state, selection.version.value);
        }
        return;
    }
    if (selection.unknownCommand) {
        throw new ConfigProgramError(
            'unknownCommand',
            selection.unknownCommand.input,
            format,
            suggest(
                selection.unknownCommand.input,
                commandCandidates(selection.unknownCommand.level)
            )
        );
    }
    if (selection.missingCommand || !selection.selected) {
        throw new ConfigProgramError('missingCommand', '', format);
    }
    const { command, path: commandPath, rest, ancestors } = selection.selected;
    const globals = applicableGlobalOptions(state.globalOptions, ancestors);
    if (hasTokenBeforeSeparator(rest, ['--help', '-H'])) {
        writeProgramOut(
            state,
            renderCommandHelp(
                withGlobalOptions(command, globals),
                commandPath.slice(0, -1),
                format,
                state.groups,
                state.sort
            )
        );
        return;
    }
    if (command.version && hasTokenBeforeSeparator(rest, ['--version', '-V'])) {
        writeProgramOut(state, command.version);
        return;
    }
    const parsed = parseCommandArgs(withGlobalOptions(command, globals), rest, format);
    const values = applyArguments(command, parsed.values, parsed.positionals, rest, format);
    const payload = hookPayload(command, values, context);

    const assertSync = (value: unknown, label: string): void => {
        if (isThenable(value)) {
            // The handler may already be running; swallow its eventual
            // rejection so the synchronous error below stays the only one.
            void Promise.resolve(value).catch(() => {});
            throw new Error(
                `\`${label}\` returned a promise; use \`program.invokeAsync()\` for async handlers.`
            );
        }
    };

    try {
        for (const hook of state.hooks) {
            if (hook.phase === 'before' && hookMatches(hook, command)) {
                assertSync(hook.handler(payload), 'hook');
            }
        }
        if (command.bin) {
            const invocation = binInvocation(command.bin, context, rest);
            const result = spawnSync(invocation.file, invocation.args, {
                cwd: invocation.cwd,
                stdio: 'inherit',
                shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(invocation.file),
            });
            if (result.error) throw result.error;
            if (result.status !== 0) {
                throw new Error(`binary exited with code ${result.status ?? 'unknown'}`);
            }
        } else {
            assertSync(command.run(values as never, context), `command "${command.name}"`);
        }
        for (const hook of state.hooks) {
            if (hook.phase === 'after' && hookMatches(hook, command)) {
                assertSync(hook.handler(payload), 'hook');
            }
        }
    } catch (error) {
        if (command.onError) {
            const handled = command.onError(error, context);
            assertSync(handled, 'onError');
            return;
        }
        throw error;
    }
}

/** Spawn a command's `bin` and resolve when it exits cleanly. */
function runBinary(bin: string, context: CliCommandContext, raw: readonly string[]): Promise<void> {
    const invocation = binInvocation(bin, context, raw);
    return new Promise((resolve, reject) => {
        const child = spawn(invocation.file, invocation.args, {
            cwd: invocation.cwd,
            stdio: 'inherit',
            shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(invocation.file),
        });
        child.on('error', reject);
        child.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error(`binary exited with code ${code ?? 'unknown'}`));
        });
    });
}
