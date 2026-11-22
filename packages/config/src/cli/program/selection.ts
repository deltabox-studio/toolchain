/**
 * Argv routing: resolve global flags, command names and help/version requests.
 */

import type { CliCommand, CliOption } from '@deltabox/toolchain/shared';

import { optionDefinitions } from './options.js';
import type { AnyCommand, Selection } from './types.js';

/** Whether a token names a command by name, alias or scope. */
function matchesCommand(command: CliCommand, token: string): boolean {
    return (
        command.name === token ||
        command.aliases?.includes(token) === true ||
        command.scope === token
    );
}

/** Route argv to the matching command, a help/version request or an error. */
export function selectCommand(
    commands: readonly AnyCommand[],
    argv: readonly string[],
    globalOptions: readonly CliOption[] = []
): Selection {
    let level = [...commands];
    let path: string[] = [];
    let rest = [...argv];
    const leading: string[] = [];
    let command: AnyCommand | undefined;
    let ancestors: AnyCommand[] = [];

    while (true) {
        const token = rest[0];
        if (token === '--help' || token === '-H') {
            return {
                help: { ...(command ? { command } : {}), path, ancestors },
            };
        }
        if ((token === '--version' || token === '-V') && command?.version !== undefined) {
            return { version: { command, value: command.version } };
        }
        // Global options may appear before the command (`--json serve`). Keep
        // them in the rest so the selected command still parses them.
        if (token !== undefined && token.startsWith('-') && token !== '--') {
            const globals = [
                ...globalOptions,
                ...ancestors.flatMap(ancestor => ancestor.globalOptions ?? []),
            ];
            const definitions =
                globals.length > 0
                    ? optionDefinitions({ ...level[0], options: globals } as AnyCommand)
                    : [];
            const def = definitions.find(
                candidate =>
                    candidate.long === token || (!candidate.negated && candidate.short === token)
            );
            if (!def) {
                // A sole root command may accept any option; leave unknown
                // options for its own parser. For a real command level an
                // unknown option is handled by the selected command.
                if (command || level.length !== 1 || (level[0]!.commands?.length ?? 0) > 0) {
                    break;
                }
            } else {
                let consumed = 1;
                if (def.takesValue && !token.includes('=')) {
                    const next = rest[1];
                    if (
                        def.multiple &&
                        next !== undefined &&
                        next !== '--' &&
                        !next.startsWith('-')
                    ) {
                        let cursor = 1;
                        while (
                            rest[cursor] !== undefined &&
                            rest[cursor] !== '--' &&
                            !rest[cursor]!.startsWith('-') &&
                            !level.some(candidate => matchesCommand(candidate, rest[cursor]!))
                        ) {
                            cursor += 1;
                        }
                        consumed = cursor;
                    } else if (
                        !(
                            def.optionalValue &&
                            (next === undefined || next === '--' || next.startsWith('-'))
                        ) &&
                        next !== undefined &&
                        next !== '--'
                    ) {
                        consumed = 2;
                    }
                }
                leading.push(...rest.slice(0, consumed));
                rest = rest.slice(consumed);
                continue;
            }
        }
        if (token !== undefined && !token.startsWith('-')) {
            const match = level.find(candidate => matchesCommand(candidate, token));
            if (match) {
                command = match;
                ancestors = [...ancestors, match];
                path = [...path, match.name];
                rest = rest.slice(1);
                level = match.commands ? [...match.commands] : [];
                continue;
            }
            if (level.length > 0) {
                return { unknownCommand: { input: token, level } };
            }
            break;
        }
        // A sole command with no subcommands is the program/root command.
        if (!command && level.length === 1 && (level[0]!.commands?.length ?? 0) === 0) {
            command = level[0]!;
            ancestors = [command];
            return {
                selected: { command, path: [command.name], rest: [...leading, ...rest], ancestors },
            };
        }
        break;
    }

    if (command) return { selected: { command, path, rest: [...leading, ...rest], ancestors } };
    return { missingCommand: { level } };
}
