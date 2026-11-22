/**
 * Per-command argv parsing, positionals and typed coercion.
 */

import { parseArgs } from 'node:util';

import type { CliCommand } from '@deltabox/toolchain/shared';

import type { ConfigProgramFormatOptions } from '../../types/format.js';
import { ConfigProgramError } from '../format.js';
import {
    OPTIONAL_VALUE,
    coerceValue,
    findLastDefinition,
    optionDefinitions,
    parseArgsOptions,
} from './options.js';
import { suggest } from './suggest.js';
import type { AnyCommand, ParsedCommand } from './types.js';

/** Parse a command's options and positionals. */
export function parseCommandArgs(
    command: AnyCommand,
    argv: readonly string[],
    format: ConfigProgramFormatOptions
): ParsedCommand {
    const defs = optionDefinitions(command);
    const negated: Record<string, boolean> = {};
    const negatedKeys = new Set(defs.filter(def => def.negated).map(def => def.key));
    const lastPositive = new Map<string, number>();
    const lastNegated = new Map<string, number>();
    const processed: string[] = [];
    let afterSeparator = false;
    for (let index = 0; index < argv.length; index++) {
        const token = argv[index]!;
        if (token === '--') {
            afterSeparator = true;
            processed.push(token);
            continue;
        }
        if (afterSeparator) {
            processed.push(token);
            continue;
        }
        if (token.startsWith('--no-')) {
            const def = defs.find(candidate => candidate.negated && candidate.long === token);
            if (def) {
                negated[def.key] = false;
                lastNegated.set(def.key, index);
                continue;
            }
        }
        const def = defs.find(
            candidate =>
                !candidate.negated && (candidate.long === token || candidate.short === token)
        );
        if (def && negatedKeys.has(def.key)) lastPositive.set(def.key, index);
        if (def?.takesValue && !token.includes('=')) {
            const next = argv[index + 1];
            // `--restore [kind]` is a switch when no value follows.
            if (
                def.optionalValue &&
                (next === undefined || next === '--' || next.startsWith('-'))
            ) {
                if (def.long) processed.push(`${def.long}=${OPTIONAL_VALUE}`);
                else processed.push(token, OPTIONAL_VALUE);
                continue;
            }
            // `--tag <value...>` consumes the values that follow it.
            if (def.multiple && next !== undefined && next !== '--' && !next.startsWith('-')) {
                const values: string[] = [];
                let cursor = index + 1;
                while (
                    cursor < argv.length &&
                    argv[cursor] !== '--' &&
                    !argv[cursor]!.startsWith('-')
                ) {
                    values.push(argv[cursor]!);
                    cursor += 1;
                }
                for (const value of values) processed.push(token, value);
                index = cursor - 1;
                continue;
            }
        }
        processed.push(token);
    }

    const lenient = command.passthrough === true || command.bin !== undefined;
    const { options: parseOptions, parsedKeys } = parseArgsOptions(defs);
    let parsed: { values: Record<string, unknown>; positionals: string[] };
    try {
        parsed = parseArgs({
            args: processed,
            options: parseOptions,
            allowPositionals: true,
            strict: !lenient,
        }) as { values: Record<string, unknown>; positionals: string[] };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const unknown = message.match(/Unknown option '([^']+)'/i);
        if (unknown?.[1]) {
            const token = unknown[1];
            const candidates = defs.flatMap(def => [
                ...(def.long ? [def.long] : []),
                ...(def.short ? [def.short] : []),
            ]);
            throw new ConfigProgramError(
                'unknownOption',
                token,
                format,
                suggest(token, [...candidates, '--help'])
            );
        }
        const missing = message.match(/option '([^']+)'/i);
        if (missing?.[1] && /argument missing/i.test(message)) {
            throw new ConfigProgramError('missingOptionValue', missing[1], format);
        }
        const invalid = message.match(/Invalid value for '([^']+)'/i);
        if (invalid?.[1]) {
            throw new ConfigProgramError('invalidValue', invalid[1], format);
        }
        throw new ConfigProgramError('unknownError', message, format);
    }

    const values: Record<string, unknown> = {};
    for (const [parsedKey, value] of Object.entries(parsed.values)) {
        if (value === undefined) continue;
        const key = parsedKeys.get(parsedKey) ?? parsedKey;
        const def = findLastDefinition(defs, key);
        const coerced = coerceValue(def, value);
        const declaredType = def?.option.type;
        if (declaredType === 'number' || declaredType === 'boolean') {
            const items = Array.isArray(coerced) ? coerced : [coerced];
            if (items.some(item => typeof item !== declaredType)) {
                throw new ConfigProgramError('invalidValue', String(value), format);
            }
        }
        if (def?.option.choices && def.option.choices.length > 0) {
            const list = Array.isArray(coerced) ? coerced : [coerced];
            for (const item of list) {
                if (typeof item === 'string' && !def.option.choices.includes(item)) {
                    throw new ConfigProgramError(
                        'invalidValue',
                        String(item),
                        format,
                        suggest(String(item), def.option.choices)
                    );
                }
            }
        }
        if (typeof coerced === 'number' && !Number.isFinite(coerced)) {
            throw new ConfigProgramError('invalidValue', String(value), format);
        }
        values[key] = coerced;
    }
    for (const [key, value] of Object.entries(negated)) {
        // A positive flag after the negated one wins; otherwise the last
        // `--no-*` occurrence disables the value.
        if ((lastPositive.get(key) ?? -1) > (lastNegated.get(key) ?? -1)) continue;
        values[key] = value;
    }

    return { values, positionals: parsed.positionals };
}

/** Map positionals onto the command's declared args. */
export function applyArguments(
    command: CliCommand,
    values: Record<string, unknown>,
    positionals: readonly string[],
    raw: readonly string[],
    format: ConfigProgramFormatOptions
): Record<string, unknown> {
    if (command.passthrough === true || command.bin !== undefined) {
        return { ...values, args: [...raw] };
    }
    const out = { ...values };
    const args = command.args ?? [];
    let index = 0;
    for (const arg of args) {
        if (arg.variadic) {
            const rest = positionals.slice(index);
            if (rest.length === 0 && arg.required !== false) {
                throw new ConfigProgramError('missingArguments', arg.name, format);
            }
            if (rest.length > 0) out[arg.name] = rest;
            index = positionals.length;
            continue;
        }
        const value = positionals[index];
        if (value === undefined) {
            if (arg.required !== false) {
                throw new ConfigProgramError('missingArguments', arg.name, format);
            }
            index += 1;
            continue;
        }
        out[arg.name] = value;
        index += 1;
    }
    if (index < positionals.length) {
        throw new ConfigProgramError('excessArguments', positionals.slice(index).join(' '), format);
    }
    return out;
}
