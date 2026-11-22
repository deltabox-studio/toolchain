/**
 * Commander-style option definitions and `node:util` `parseArgs` preparation.
 */

import type { ParseArgsOptionsConfig } from 'node:util';

import { camelCase, type CliCommand, type CliOption } from '@deltabox/toolchain/shared';

import type { OptionDef } from './types.js';

/** Expand one option's `-o, --out <path>` flags string into definitions. */
export function parseOptionFlags(option: CliOption): OptionDef[] {
    const definitions: OptionDef[] = [];
    for (const raw of option.flags.split(',')) {
        const token = raw.trim();
        if (!token) continue;
        const match = token.match(/^(-{1,2}[^\s<[]+)\s*(?:<([^>]+)>|\[([^\]]+)\])?$/);
        if (!match) continue;
        const flag = match[1]!;
        const valueName = match[2] ?? match[3];
        const takesValue = valueName !== undefined;
        const optionalValue = match[3] !== undefined;
        const variadic = valueName?.endsWith('...') ?? false;
        const negated = flag.startsWith('--no-');
        const name = flag.replace(/^--?/, '').replace(/^no-/, '');
        definitions.push({
            key: camelCase(name),
            ...(flag.startsWith('--') ? { long: flag } : { short: flag }),
            takesValue,
            optionalValue,
            multiple: Boolean(option.multiple || variadic),
            negated,
            option,
        });
    }
    return definitions;
}

/** Every option definition of a command. */
export function optionDefinitions(command: CliCommand): OptionDef[] {
    return (command.options ?? []).flatMap(parseOptionFlags);
}

/**
 * Build the `node:util` `parseArgs` options for a command.
 *
 * `parseArgs` matches an option key against the literal long name (`--dry-run`
 * is keyed by `dry-run`), whereas the runtime exposes parsed values under the
 * camel-cased {@link OptionDef.key} (`dryRun`). Keying the config by the
 * camel-cased name silently rejected every hyphenated flag, so the literal name
 * is used here and {@link parsedKeys} maps the result back.
 */
export function parseArgsOptions(defs: readonly OptionDef[]): {
    options: ParseArgsOptionsConfig;
    parsedKeys: Map<string, string>;
} {
    const options: ParseArgsOptionsConfig = {};
    const parsedKeys = new Map<string, string>();
    for (const def of defs) {
        if (def.negated) continue;
        const name = def.long ? def.long.replace(/^--/, '') : def.key;
        const existing = options[name];
        options[name] = {
            type: def.takesValue ? 'string' : 'boolean',
            ...(existing && 'short' in existing ? { short: existing.short } : {}),
            ...(def.short ? { short: def.short.replace(/^-/, '') } : {}),
            ...(def.multiple ? { multiple: true } : {}),
        };
        parsedKeys.set(name, def.key);
    }
    return { options, parsedKeys };
}

/** Sentinel for an optional-value flag that was passed without a value. */
export const OPTIONAL_VALUE = '__DBX_OPTIONAL__';

/** Coerce a raw parsed value using the option's declared type. */
export function coerceValue(def: OptionDef | undefined, value: unknown): unknown {
    if (!def || value === undefined) return value;
    if (def.optionalValue && value === OPTIONAL_VALUE) return true;
    const type = def.option.type ?? (def.takesValue ? 'string' : 'boolean');
    const one = (input: unknown): unknown => {
        if (typeof input !== 'string') return input;
        switch (type) {
            case 'number': {
                const number = Number(input);
                return Number.isFinite(number) ? number : input;
            }
            case 'boolean': {
                const normalized = input.trim().toLowerCase();
                if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
                if (['false', '0', 'no', 'off'].includes(normalized)) return false;
                return input;
            }
            case 'array':
                return input
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean);
            default:
                return input;
        }
    };
    if (def.multiple || type === 'array') {
        const list = Array.isArray(value) ? value : [value];
        return list.flatMap(item => {
            const converted = one(item);
            return Array.isArray(converted) ? converted : [converted];
        });
    }
    return one(value);
}

/** The last definition for a value key (command options override globals). */
export function findLastDefinition(defs: readonly OptionDef[], key: string): OptionDef | undefined {
    for (let index = defs.length - 1; index >= 0; index -= 1) {
        if (defs[index]!.key === key) return defs[index];
    }
    return undefined;
}

/** Normalize the shorthand/array/object forms of a program global option. */
export function normalizeOptionInput(input: unknown): CliOption {
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
}
