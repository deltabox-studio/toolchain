/**
 * Program help/error formatting. Everything is colourless by default; a
 * consumer opts in by supplying colour hooks (eg. `picocolors`).
 */

import type { CliCommand, CliOption } from '@deltabox/toolchain/shared';

import type {
    ConfigBoxOptions,
    ConfigErrorModel,
    ConfigFormatColor,
    ConfigFormatColors,
    ConfigHelpModel,
    ConfigHelpTemplate,
    ConfigProgramErrorMessageKey,
    ConfigProgramFormatOptions,
    ConfigProgramGroupsOptions,
    ConfigProgramSortOrder,
} from '../types/format.js';

type AnyCommand = CliCommand<any, any>;

const identity: ConfigFormatColor = text => text;
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function visibleLength(text: string): number {
    return text.replace(ANSI_PATTERN, '').length;
}

/** The built-in (no-colour) colour hooks. */
export const DEFAULT_FORMAT_COLORS: Required<ConfigFormatColors> = {
    command: identity,
    option: identity,
    value: identity,
    description: identity,
    usage: identity,
};

/** Deep-merge two format option sets (command-level options win). */
export function mergeFormatOptions(
    base: ConfigProgramFormatOptions = {},
    override: ConfigProgramFormatOptions = {}
): ConfigProgramFormatOptions {
    return {
        colors: { ...base.colors, ...override.colors },
        help: { ...base.help, ...override.help },
        error: { ...base.error, ...override.error },
        commands: { ...base.commands, ...override.commands },
        options: { ...base.options, ...override.options },
    };
}

/** The long flag of an option (`-o, --out <path>` -> `--out`). */
export function longFlagOf(option: CliOption): string | undefined {
    return option.flags
        .split(/[ ,|]+/)
        .map(token => token.trim())
        .find(token => token.startsWith('--') && !token.startsWith('--no-'));
}

/** Resolve one colour hook from program, help, command and option layers. */
export function colorOf(
    options: ConfigProgramFormatOptions,
    kind: keyof ConfigFormatColors,
    command?: AnyCommand,
    item?: unknown
): ConfigFormatColor {
    if (kind === 'option' && item && typeof item === 'object') {
        const flag = longFlagOf(item as CliOption);
        const optionColor = flag ? options.options?.[flag] : undefined;
        if (optionColor) return optionColor;
    }
    const target =
        kind === 'command' &&
        item !== null &&
        item !== undefined &&
        typeof item === 'object' &&
        'name' in item
            ? (item as AnyCommand)
            : command;
    const commandColor = target ? options.commands?.[target.name]?.colors?.[kind] : undefined;
    return (commandColor ??
        options.help?.colors?.[kind] ??
        options.colors?.[kind] ??
        DEFAULT_FORMAT_COLORS[kind]) as ConfigFormatColor;
}

interface Padding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

function normalizePadding(padding: ConfigBoxOptions['padding']): Padding {
    if (typeof padding === 'number') {
        return { top: padding, right: padding, bottom: padding, left: padding };
    }
    return {
        top: padding?.top ?? 1,
        right: padding?.right ?? 1,
        bottom: padding?.bottom ?? 1,
        left: padding?.left ?? 1,
    };
}

/** Render text inside a reusable, customizable box. */
export function renderBox(content: string, options: ConfigBoxOptions = {}): string {
    const padding = normalizePadding(options.padding);
    const corners = options.corners ?? {};
    const topLeft = corners.topLeft ?? '╭';
    const topRight = corners.topRight ?? '╮';
    const bottomLeft = corners.bottomLeft ?? '╰';
    const bottomRight = corners.bottomRight ?? '╯';
    const horizontal = options.horizontal ?? '─';
    const vertical = options.vertical ?? '│';
    const color = options.color ?? identity;
    const lines = content.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    const width = Math.max(0, ...lines.map(line => visibleLength(line)));
    const innerWidth = width + padding.left + padding.right;
    const top = `${topLeft}${horizontal.repeat(innerWidth)}${topRight}`;
    const bottom = `${bottomLeft}${horizontal.repeat(innerWidth)}${bottomRight}`;
    const out: string[] = [color(top)];
    for (let index = 0; index < padding.top; index++) {
        out.push(color(`${vertical}${' '.repeat(innerWidth)}${vertical}`));
    }
    for (const line of lines) {
        const right = ' '.repeat(Math.max(0, width - visibleLength(line)) + padding.right);
        out.push(color(vertical) + ' '.repeat(padding.left) + line + right + color(vertical));
    }
    for (let index = 0; index < padding.bottom; index++) {
        out.push(color(`${vertical}${' '.repeat(innerWidth)}${vertical}`));
    }
    out.push(color(bottom));
    return out.join('\n');
}

/** The commander-like option term (`-o, --out <path>`). */
export function optionTerm(option: CliOption): string {
    return option.flags.trim();
}

function argumentUsage(command: AnyCommand): string {
    const parts: string[] = [];
    for (const arg of command.args ?? []) {
        const open = arg.required === false ? '[' : '<';
        const close = arg.required === false ? ']' : '>';
        parts.push(`${open}${arg.name}${arg.variadic ? '...' : ''}${close}`);
    }
    return parts.join(' ');
}

/** The commander-style usage line for one command. */
export function usageFor(command: AnyCommand | undefined, name: string): string {
    const parts = [name];
    if ((command?.options?.length ?? 0) > 0) parts.push('[options]');
    const args = command ? argumentUsage(command) : '';
    if (args) parts.push(args);
    if ((command?.commands?.length ?? 0) > 0) parts.push('[command]');
    return parts.join(' ');
}

function withHelpOption(options: readonly CliOption[], command?: AnyCommand): CliOption[] {
    const all = [...options];
    if (!all.some(option => option.flags.includes('--help') || option.flags.includes('-H'))) {
        all.push({ flags: '-H, --help', description: 'Display help for command' });
    }
    if (command?.version && !all.some(option => option.flags.includes('--version'))) {
        all.push({ flags: '-V, --version', description: 'Output the version number' });
    }
    return all;
}

function table(
    rows: readonly { term: string; description: string; item?: unknown }[],
    options: ConfigProgramFormatOptions,
    command: AnyCommand | undefined,
    kind: 'option' | 'command'
): string[] {
    if (rows.length === 0) return [];
    const width = Math.max(...rows.map(row => visibleLength(row.term)));
    const colorDescription = colorOf(options, 'description', command);
    return rows.map(row => {
        const colorTerm = colorOf(options, kind, command, row.item);
        const term = colorTerm(row.term.padEnd(width), row.item);
        const description = colorDescription(row.description, row.item);
        return `  ${term}  ${description}`;
    });
}

/** A help section: a heading plus the entries rendered under it. */
interface HelpSection<T> {
    heading: string;
    items: T[];
}

/** Format a group label as a help heading (`diagnostics` + options -> `Diagnostics options:`). */
function headingFor(label: string, kind: 'options' | 'commands'): string {
    const base = label
        .trim()
        .replace(/:+$/, '')
        .trim()
        .replace(new RegExp(`\\s+${kind}$`, 'i'), '');
    return `${base.charAt(0).toUpperCase()}${base.slice(1)} ${kind}:`;
}

/** The normalized group label of an option (`undefined` = default section). */
function optionGroup(option: CliOption): string | undefined {
    const label = option.group?.trim().replace(/:+$/, '').trim();
    return label ? label : undefined;
}

/**
 * Bucket options by `group`, keeping the default `Options:` section first and
 * named groups in first-appearance order. Group labels are case-insensitive and
 * rendered as `<Group> options:` headings. Grouping is disabled (flat) when the
 * program's `groups` option is `false`.
 */
function optionSections(
    options: readonly CliOption[],
    defaultHeading: string,
    setting: ConfigProgramGroupsOptions | undefined
): HelpSection<CliOption>[] {
    const settings = groupSettings(setting);
    const defaults: CliOption[] = [];
    const groups = new Map<string, HelpSection<CliOption>>();
    for (const option of options) {
        const label = settings.enabled ? optionGroup(option) : undefined;
        if (!label) {
            defaults.push(option);
            continue;
        }
        const key = label.toLowerCase();
        const existing = groups.get(key);
        if (existing) {
            existing.items.push(option);
            continue;
        }
        groups.set(key, { heading: headingFor(label, 'options'), items: [option] });
    }
    const sections: HelpSection<CliOption>[] = [];
    if (defaults.length > 0) sections.push({ heading: defaultHeading, items: defaults });
    sections.push(...groups.values());
    return sections;
}

interface GroupSettings {
    enabled: boolean;
    auto: boolean;
    delimiters: string[];
}

/** Normalize the `groups` program option. */
function groupSettings(setting: ConfigProgramGroupsOptions | undefined): GroupSettings {
    if (setting === false) return { enabled: false, auto: false, delimiters: [] };
    if (setting === true || setting === undefined) {
        return { enabled: true, auto: true, delimiters: [':'] };
    }
    const delimiter = setting.delimiter;
    const delimiters =
        delimiter === undefined
            ? [':']
            : typeof delimiter === 'string'
              ? [delimiter]
              : (delimiter as readonly string[]).filter(Boolean);
    return { enabled: true, auto: setting.auto !== false, delimiters };
}

/** The help group of a command, from its `group` or its delimited name path. */
function commandGroup(command: AnyCommand, settings: GroupSettings): string | undefined {
    if (!settings.enabled) return undefined;
    const explicit = command.group?.trim().replace(/:+$/, '').trim();
    if (explicit) return explicit;
    if (!settings.auto) return undefined;
    let index = -1;
    for (const delimiter of settings.delimiters) {
        if (!delimiter) continue;
        const found = command.name.indexOf(delimiter);
        if (found > 0 && (index === -1 || found < index)) index = found;
    }
    return index > 0 ? command.name.slice(0, index) : undefined;
}

/**
 * Bucket commands by their explicit group or delimited name path
 * (`vite:list` -> `Vite:`), keeping the default `Commands:` section first.
 */
function commandSections(
    commands: readonly AnyCommand[],
    setting: ConfigProgramGroupsOptions | undefined,
    defaultHeading: string
): HelpSection<AnyCommand>[] {
    const settings = groupSettings(setting);
    const defaults: AnyCommand[] = [];
    const groups = new Map<string, HelpSection<AnyCommand>>();
    for (const command of commands) {
        const label = commandGroup(command, settings);
        if (!label) {
            defaults.push(command);
            continue;
        }
        const key = label.toLowerCase();
        const existing = groups.get(key);
        if (existing) {
            existing.items.push(command);
            continue;
        }
        groups.set(key, { heading: headingFor(label, 'commands'), items: [command] });
    }
    const sections: HelpSection<AnyCommand>[] = [];
    if (defaults.length > 0) sections.push({ heading: defaultHeading, items: defaults });
    sections.push(...groups.values());
    return sections;
}

/**
 * Sort commands by name for one help section. `false` keeps the declaration
 * order, which also preserves group first-appearance order.
 */
function sortCommands(
    commands: readonly AnyCommand[],
    order: ConfigProgramSortOrder | undefined
): AnyCommand[] {
    if (order === false) return [...commands];
    const direction = order === 'desc' ? -1 : 1;
    return [...commands].sort((a, b) => {
        if (a.name === b.name) return 0;
        return a.name < b.name ? -direction : direction;
    });
}

/** Build the commander-like content shared by the help templates. */
export function renderHelpContent(
    model: ConfigHelpModel,
    options: ConfigProgramFormatOptions
): string {
    const command = model.command;
    const usageColor = colorOf(options, 'usage', command);
    const commandColor = colorOf(options, 'command', command);
    const valueColor = colorOf(options, 'value', command);
    const descriptionColor = colorOf(options, 'description', command);
    const lines: string[] = [];
    // Commander prints the name as part of the usage; keep it colourised too.
    const usage = model.usage.replace(/<([^>]+)>|\[([^\]]+)\]/g, match => valueColor(match));
    const name = commandColor(model.name);
    const usageText = model.usage.startsWith(model.name)
        ? `${name}${usage.slice(model.name.length)}`
        : `${name} ${usage}`;
    lines.push(`${usageColor('Usage:')} ${usageText}`);
    if (model.description) {
        lines.push('', descriptionColor(model.description));
    }
    const optionsWithHelp = withHelpOption(model.options, command);
    for (const section of optionSections(optionsWithHelp, 'Options:', model.groups)) {
        lines.push('', usageColor(section.heading));
        lines.push(
            ...table(
                section.items.map(option => ({
                    term: optionTerm(option),
                    description: option.description,
                    item: option,
                })),
                options,
                command,
                'option'
            )
        );
    }
    if (model.commands.length > 0) {
        for (const section of commandSections(model.commands, model.groups, 'Commands:')) {
            lines.push('', usageColor(section.heading));
            lines.push(
                ...table(
                    sortCommands(section.items, model.sort).map(child => ({
                        term: child.name,
                        description: child.description,
                        item: child,
                    })),
                    options,
                    command,
                    'command'
                )
            );
        }
    }
    return lines.join('\n');
}

function commandFormat(command: AnyCommand | undefined, options: ConfigProgramFormatOptions) {
    const byName = command ? options.commands?.[command.name] : undefined;
    return {
        options,
        help: byName?.help ?? options.help?.template ?? 'plain',
        box: { ...options.help?.box, ...byName?.box },
        error: byName?.error,
    };
}

function boxColor(options: ConfigProgramFormatOptions, command?: AnyCommand): ConfigFormatColor {
    const byName = command ? options.commands?.[command.name]?.box?.color : undefined;
    return byName ?? options.help?.box?.color ?? identity;
}

/** Render the help model using the configured template. */
export function renderHelp(
    model: ConfigHelpModel,
    options: ConfigProgramFormatOptions = {}
): string {
    const format = commandFormat(model.command, options);
    const template: ConfigHelpTemplate = format.help;
    const content = renderHelpContent(model, format.options);
    if (typeof template === 'function') return template(model, format.options);
    if (template === 'plain') return content;
    return renderBox(content, { ...format.box, color: boxColor(format.options, model.command) });
}

/** Render a program-level help page. */
export function renderProgramHelp(
    name: string,
    description: string | undefined,
    commands: readonly AnyCommand[],
    options: ConfigProgramFormatOptions = {},
    cliOptions: readonly CliOption[] = [],
    groups?: ConfigProgramGroupsOptions,
    sort?: ConfigProgramSortOrder
): string {
    return renderHelp(
        {
            name,
            ...(description ? { description } : {}),
            usage: commands.length > 0 ? `${name} [options] [command]` : `${name} [options]`,
            options: cliOptions,
            commands,
            ...(groups !== undefined ? { groups } : {}),
            ...(sort !== undefined ? { sort } : {}),
        },
        options
    );
}

/** Render help for one command (including its recursively nested commands). */
export function renderCommandHelp(
    command: AnyCommand,
    path: readonly string[] = [],
    options: ConfigProgramFormatOptions = {},
    groups?: ConfigProgramGroupsOptions,
    sort?: ConfigProgramSortOrder
): string {
    const name = [...path, command.name].join(' ');
    return renderHelp(
        {
            name,
            ...(command.description ? { description: command.description } : {}),
            usage: usageFor(command, name),
            options: command.options ?? [],
            commands: command.commands ?? [],
            ...(groups !== undefined ? { groups } : {}),
            ...(sort !== undefined ? { sort } : {}),
            command,
        },
        options
    );
}

function errorList(error: unknown): ConfigErrorModel['errors'] {
    const list = Array.isArray(error) ? error : [error];
    const out: { message: string; stack?: string; name: string }[] = [];
    for (const value of list) {
        if (value instanceof AggregateError && value.errors.length > 0) {
            out.push(...errorList(value.errors));
            continue;
        }
        if (value instanceof Error) {
            out.push({
                message: value.message,
                ...(value.stack ? { stack: value.stack } : {}),
                name: value.name,
            });
        } else {
            out.push({ message: String(value), name: 'Error' });
        }
    }
    return out;
}

/** Render an error with the configured template. */
export function renderError(error: unknown, options: ConfigProgramFormatOptions = {}): string {
    const model: ConfigErrorModel = { errors: errorList(error) };
    const config = options.error ?? {};
    const template = config.messageOnly ? 'message' : (config.template ?? 'message');
    if (typeof template === 'function') return template(model, options);
    const messageColor = config.messageColor ?? identity;
    const stackColor = config.stackColor ?? identity;

    const messageText = model.errors.map(item => messageColor(item.message)).join('\n');
    if (template === 'message') return messageText;

    const showStack = config.showStack ?? true;
    return model.errors
        .map(item => {
            const lines = [messageColor(item.message)];
            if (showStack && item.stack) {
                const stack = item.stack.includes(item.message)
                    ? item.stack.slice(item.stack.indexOf(item.message) + item.message.length)
                    : item.stack;
                if (stack.trim()) lines.push('', stackColor(stack.trimStart()));
            }
            return renderBox(lines.join('\n'), {
                ...options.error?.box,
                ...config.box,
            });
        })
        .join('\n\n');
}

const DEFAULT_MESSAGES: Record<ConfigProgramErrorMessageKey, (input: string) => string> = {
    unknownCommand: input => `unknown command "${input}"`,
    unknownOption: input => `unknown option "${input}"`,
    missingOptionValue: input => `option "${input}" requires a value`,
    excessArguments: input => `too many arguments: ${input}`,
    missingArguments: input =>
        `missing required argument${input.includes(',') ? 's' : ''}: ${input}`,
    invalidValue: input => `invalid value "${input}"`,
    missingCommand: () => 'missing command',
    unknownError: input => input || 'unknown error',
};

/** Build the message for one invalid-argv error (consumer-overridable). */
export function invalidArgvMessage(
    key: ConfigProgramErrorMessageKey,
    input: string,
    options: ConfigProgramFormatOptions = {},
    suggestion?: string
): string {
    const override = options.error?.messages?.[key];
    const base =
        typeof override === 'function'
            ? override(input)
            : override !== undefined
              ? override.replaceAll('{input}', input)
              : DEFAULT_MESSAGES[key](input);
    return suggestion ? `${base}\n(did you mean "${suggestion}"?)` : base;
}

/** An invalid-argv error thrown by `program.invoke()`. */
export class ConfigProgramError extends Error {
    /** The generic error category. */
    readonly code: ConfigProgramErrorMessageKey;
    /** The offending input. */
    readonly input: string;
    /** The suggested correction, when one is close enough. */
    readonly suggestion?: string;

    constructor(
        code: ConfigProgramErrorMessageKey,
        input: string,
        options: ConfigProgramFormatOptions = {},
        suggestion?: string
    ) {
        super(invalidArgvMessage(code, input, options, suggestion));
        this.name = 'ConfigProgramError';
        this.code = code;
        this.input = input;
        if (suggestion) this.suggestion = suggestion;
    }
}
