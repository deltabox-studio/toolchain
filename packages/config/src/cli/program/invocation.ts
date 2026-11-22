/**
 * Invocation context, global-option inheritance and output routing helpers.
 */

import path from 'node:path';

import type { CliCommand, CliCommandContext, CliOption } from '@deltabox/toolchain/shared';

import type { AnyCommand, ProgramState, RuntimeHook } from './types.js';

/** Resolve the executable/args/cwd for a command's `bin` passthrough. */
export function binInvocation(
    bin: string,
    context: CliCommandContext,
    raw: readonly string[]
): { file: string; args: string[]; cwd: string } {
    const cwd = context.cwd;
    const location = path.isAbsolute(bin) ? bin : path.resolve(cwd, bin);
    const extension = path.extname(location).toLowerCase();
    const script = ['.js', '.mjs', '.cjs'].includes(extension);
    return {
        file: script ? process.execPath : location,
        args: script ? [location, ...raw] : [...raw],
        cwd,
    };
}

/** Program globals plus every ancestor global the selected command inherits. */
export function applicableGlobalOptions(
    programGlobals: readonly CliOption[],
    ancestors: readonly AnyCommand[]
): CliOption[] {
    let inherited: CliOption[] = [];
    for (const command of ancestors) {
        inherited = [...(command.inherit ? inherited : []), ...(command.globalOptions ?? [])];
    }
    return [...programGlobals, ...inherited];
}

/** Merge globals into a command's own options for parsing/help. */
export function withGlobalOptions(command: AnyCommand, globals: readonly CliOption[]): AnyCommand {
    if (globals.length === 0) return command;
    return { ...command, options: [...globals, ...(command.options ?? [])] };
}

/** Whether a hook targets a command (by scope/name) or every command. */
export function hookMatches(hook: RuntimeHook, command: AnyCommand): boolean {
    return hook.target === 'all' || hook.target === command.scope || hook.target === command.name;
}

/** The payload handed to before/after hooks. */
export function hookPayload<TContext extends CliCommandContext>(
    command: AnyCommand,
    values: Record<string, unknown>,
    context: TContext
): unknown {
    return {
        name: command.name,
        scope: command.scope,
        values,
        context,
        command,
    };
}

/** Find a command by name, scope or alias, including nested subcommands. */
export function findCommand(commands: readonly AnyCommand[], name: string): AnyCommand | undefined {
    for (const command of commands) {
        if (command.name === name || command.scope === name || command.aliases?.includes(name)) {
            return command;
        }
        const nested = findCommand(command.commands ?? [], name);
        if (nested) return nested;
    }
    return undefined;
}

/** Resolve an invocation's argv/context arguments. */
export function resolveInvocation<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv?: readonly string[] | TContext,
    context?: TContext
): { argv: readonly string[]; context: TContext } {
    const argumentContext = Array.isArray(argv) ? context : (argv as TContext | undefined);
    const resolvedContext =
        argumentContext ?? context ?? state.context ?? ({ cwd: process.cwd() } as TContext);
    const withArgv = state.list.find(command => command.argv !== undefined);
    const resolvedArgv = Array.isArray(argv)
        ? argv
        : (state.explicitArgv ?? withArgv?.argv ?? process.argv.slice(2));
    return { argv: resolvedArgv, context: resolvedContext };
}

/** Write help/version output to the configured stdout sink. */
export function writeProgramOut<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    text: string
): void {
    if (state.writeOut) state.writeOut(`${text}\n`);
    else process.stdout.write(`${text}\n`);
}

/** Every command name, scope and alias at a routing level. */
export function commandCandidates(commands: readonly CliCommand[]): string[] {
    return commands.flatMap(command => [
        command.name,
        ...((command.scope ? [command.scope] : []) as string[]),
        ...(command.aliases ?? []),
    ]);
}
