/**
 * Commander-like runtime for `ConfigProgram`s: argv routing, per-command
 * `parseArgs` parsing, hooks, help/error rendering and binary execution.
 */

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { parseArgs, type ParseArgsOptionsConfig } from 'node:util';

import type { Awaitable } from '@deltabox/toolchain-shared';
import {
    camelCase,
    type CliCommand,
    type CliCommandContext,
    type CliOption,
} from '@deltabox/toolchain/shared';

import type {
    ConfigProgram,
    ConfigProgramCommands,
    ConfigProgramHookItem,
    ConfigProgramOptions,
    ResolveConfigProgramCommands,
} from '../types/cli/index.js';
import type { ConfigProgramFormatOptions } from '../types/format.js';
import {
    ConfigProgramError,
    mergeFormatOptions,
    renderBox,
    renderCommandHelp,
    renderError,
    renderProgramHelp,
} from './format.js';

type AnyCommand = CliCommand<any, any>;

/** A registered runtime hook. */
interface RuntimeHook {
    phase: 'before' | 'after';
    target: string;
    handler: (payload: unknown) => void | Promise<void>;
}

interface ProgramState<TContext extends CliCommandContext> {
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
    colorsDisabled: boolean;
    hooks: RuntimeHook[];
}

/** The runtime shape of {@link ConfigProgramOptions.disableColors}. */
type RuntimeDisableColors<TContext extends CliCommandContext> =
    | boolean
    | ((args: Record<string, unknown>, context: TContext) => Awaitable<boolean>)
    | Promise<(args: Record<string, unknown>, context: TContext) => boolean>;

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

/** Levenshtein distance used for misspelling suggestions. */
export function editDistance(a: string, b: string): number {
    const rows = a.length + 1;
    const columns = b.length + 1;
    let previous = Array.from({ length: columns }, (_, index) => index);
    for (let row = 1; row < rows; row++) {
        const current = [row];
        for (let column = 1; column < columns; column++) {
            current[column] =
                a[row - 1] === b[column - 1]
                    ? previous[column - 1]!
                    : 1 + Math.min(previous[column - 1]!, previous[column]!, current[column - 1]!);
        }
        previous = current;
    }
    return previous[columns - 1]!;
}

/** The closest candidate, when it is close enough to be a useful suggestion. */
export function suggest(input: string, candidates: readonly string[]): string | undefined {
    const normalized = input.replace(/^-+/, '');
    let best: { candidate: string; distance: number } | undefined;
    for (const candidate of candidates) {
        if (typeof candidate !== 'string') continue;
        const distance = editDistance(normalized, candidate.replace(/^-+/, ''));
        if (!best || distance < best.distance) best = { candidate, distance };
    }
    if (!best) return undefined;
    const limit = Math.max(2, Math.floor(normalized.length / 3));
    return best.distance <= limit ? best.candidate : undefined;
}

interface OptionDef {
    key: string;
    long?: string;
    short?: string;
    takesValue: boolean;
    optionalValue: boolean;
    multiple: boolean;
    negated: boolean;
    option: CliOption;
}

function parseOptionFlags(option: CliOption): OptionDef[] {
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
            key: negated ? camelCase(name) : camelCase(name),
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

function optionDefinitions(command: CliCommand): OptionDef[] {
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
function parseArgsOptions(defs: readonly OptionDef[]): {
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

const OPTIONAL_VALUE = '__DBX_OPTIONAL__';

function coerceValue(def: OptionDef | undefined, value: unknown): unknown {
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

interface Selected {
    command: AnyCommand;
    path: string[];
    rest: string[];
    ancestors: AnyCommand[];
}

interface Selection {
    selected?: Selected;
    help?: { command?: AnyCommand; path: string[]; ancestors: AnyCommand[] };
    version?: { command: AnyCommand; value: string };
    unknownCommand?: { input: string; level: AnyCommand[] };
    missingCommand?: { level: AnyCommand[] };
}

function matchesCommand(command: CliCommand, token: string): boolean {
    return (
        command.name === token ||
        command.aliases?.includes(token) === true ||
        command.scope === token
    );
}

function selectCommand(
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
                    (candidate.negated ? candidate.long === token : candidate.long === token) ||
                    (!candidate.negated && candidate.short === token)
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

interface ParsedCommand {
    values: Record<string, unknown>;
    positionals: string[];
}

function parseCommandArgs(
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

function applyArguments(
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

/** Strip every configured colour hook (program, help, error and per-command). */
function withoutColors(options: ConfigProgramFormatOptions): ConfigProgramFormatOptions {
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
function globalArgsOf<TContext extends CliCommandContext>(
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

/** Resolve {@link ProgramState.disableColors} for one invocation. */
async function resolveDisableColors<TContext extends CliCommandContext>(
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
function resolveDisableColorsSync<TContext extends CliCommandContext>(
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
function formatForState<TContext extends CliCommandContext>(
    state: ProgramState<TContext>
): ConfigProgramFormatOptions {
    const disabled =
        typeof state.disableColors === 'boolean' ? state.disableColors : state.colorsDisabled;
    return disabled ? withoutColors(state.format) : state.format;
}

async function formatForInvocation<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[],
    context: TContext
): Promise<ConfigProgramFormatOptions> {
    state.colorsDisabled = await resolveDisableColors(state, argv, context);
    return formatForState(state);
}

function formatForSyncInvocation<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    argv: readonly string[],
    context: TContext
): ConfigProgramFormatOptions {
    state.colorsDisabled = resolveDisableColorsSync(state, argv, context);
    return formatForState(state);
}

function binInvocation(
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

function applicableGlobalOptions(
    programGlobals: readonly CliOption[],
    ancestors: readonly AnyCommand[]
): CliOption[] {
    let inherited: CliOption[] = [];
    for (const command of ancestors) {
        inherited = [...(command.inherit ? inherited : []), ...(command.globalOptions ?? [])];
    }
    return [...programGlobals, ...inherited];
}

function withGlobalOptions(command: AnyCommand, globals: readonly CliOption[]): AnyCommand {
    if (globals.length === 0) return command;
    return { ...command, options: [...globals, ...(command.options ?? [])] };
}

function findLastDefinition(defs: readonly OptionDef[], key: string): OptionDef | undefined {
    for (let index = defs.length - 1; index >= 0; index -= 1) {
        if (defs[index]!.key === key) return defs[index];
    }
    return undefined;
}

function hookMatches(hook: RuntimeHook, command: AnyCommand): boolean {
    return hook.target === 'all' || hook.target === command.scope || hook.target === command.name;
}

function hookPayload<TContext extends CliCommandContext>(
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

function findCommand(commands: readonly AnyCommand[], name: string): AnyCommand | undefined {
    for (const command of commands) {
        if (command.name === name || command.scope === name || command.aliases?.includes(name)) {
            return command;
        }
        const nested = findCommand(command.commands ?? [], name);
        if (nested) return nested;
    }
    return undefined;
}

function hasTokenBeforeSeparator(argv: readonly string[], tokens: readonly string[]): boolean {
    const separator = argv.indexOf('--');
    const limit = separator === -1 ? argv.length : separator;
    return argv.slice(0, limit).some(token => tokens.includes(token));
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { then?: unknown }).then === 'function'
    );
}

/** Resolve an invocation's argv/context arguments. */
function resolveInvocation<TContext extends CliCommandContext>(
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

async function executeAsync<TContext extends CliCommandContext>(
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
                      format
                  )
                : renderProgramHelp(
                      state.name,
                      state.description,
                      state.list,
                      format,
                      state.globalOptions
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
                selection.unknownCommand.level.flatMap(command => [
                    command.name,
                    ...((command.scope ? [command.scope] : []) as string[]),
                    ...(command.aliases ?? []),
                ])
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
            renderCommandHelp(withGlobalOptions(command, globals), commandPath.slice(0, -1), format)
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
    void commandPath;
}

function executeSync<TContext extends CliCommandContext>(
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
        // Re-use the async path for pure output (no user code).
        if (selection.help?.command) {
            writeProgramOut(
                state,
                renderCommandHelp(selection.help.command, selection.help.path.slice(0, -1), format)
            );
        } else if (selection.help) {
            writeProgramOut(
                state,
                renderProgramHelp(
                    state.name,
                    state.description,
                    state.list,
                    format,
                    state.globalOptions
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
                selection.unknownCommand.level.flatMap(command => [
                    command.name,
                    ...((command.scope ? [command.scope] : []) as string[]),
                    ...(command.aliases ?? []),
                ])
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
            renderCommandHelp(withGlobalOptions(command, globals), commandPath.slice(0, -1), format)
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

function writeProgramOut<TContext extends CliCommandContext>(
    state: ProgramState<TContext>,
    text: string
): void {
    if (state.writeOut) state.writeOut(`${text}\n`);
    else process.stdout.write(`${text}\n`);
}

function normalizeOptionInput(input: unknown): CliOption {
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
                    format
                );
            }
            if (command) {
                return renderCommandHelp(
                    withGlobalOptions(command, [
                        ...state.globalOptions,
                        ...(command.globalOptions ?? []),
                    ]),
                    [],
                    format
                );
            }
            return renderProgramHelp(
                state.name,
                state.description,
                state.list,
                format,
                state.globalOptions
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
