/**
 * The shared console logger.
 *
 * One level-aware sink for everything the toolchain prints, rendered with
 * [`@clack/prompts`](https://bombshell.dev/clack) so the CLI output has the
 * familiar clack look (level symbols + guide). Colors follow clack / Node's
 * `util.styleText`: on by default, off with `--no-color` or `logger.color: false`.
 *
 * Use `logger.info` for human messages, `logger.raw` for machine output (`--json`
 * must not be prefixed or decorated), and `logger.success`/`warn`/`error`/`debug`
 * for the rest. Messages that start with whitespace (indented continuations) are
 * never prefixed with the `name`.
 */

import { log as clackLog, type LogMessageOptions } from '@clack/prompts';
import pc from 'picocolors';

import { formatMessageId } from './messages.js';

/** Ordered from most to least verbose. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** A raw output channel: `out` is stdout, `err` is stderr. */
export type LogChannel = 'out' | 'err';

/** A `picocolors` color set (color-aware). */
export type Colors = ReturnType<typeof pc.createColors>;

/** Every valid level, most verbose first. */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

/** The prefix every non-indented line gets by default. */
const DEFAULT_NAME = 'dbx';

/** A warning/error suppression rule: a message/id string or a RegExp. */
export type LogSuppression = string | RegExp;

export interface ToolchainLogger {
    raw(message?: string): void;
    rawError(message?: string): void;
    write(channel: LogChannel, text: string): void;
    debug(message?: string): void;
    info(message?: string): void;
    success(message?: string): void;
    warn(message?: string, id?: string): void;
    error(message?: string, id?: string): void;
}

export interface LoggerOptions {
    /** Use a custom logger implementation instead of the built-in clack sink. */
    logger?: ToolchainLogger;
    /** Minimum level to print (default `info`). */
    level?: LogLevel;
    /**
     * Force colors on/off (default: on). The toolchain colors its output by
     * default; `--no-color` or `logger.color: false` turn it off.
     */
    color?: boolean;
    /** Prefix non-indented lines with `<name>:` (default `dbx`). */
    name?: string;
    /**
     * Silence matching warnings/errors. A string matches an emitted id (exact)
     * or a message substring; a `/pattern/flags` string or RegExp is a regex.
     */
    suppress?: LogSuppression | LogSuppression[];
}

export interface Logger extends ToolchainLogger {
    /** The configured level. */
    readonly level: LogLevel;
    /** A `picocolors` color set honoring the color setting. */
    readonly colors: Colors;
    /** Machine-readable output: raw to stdout, no prefix, no decoration. */
    raw(message?: string): void;
    /** Raw output to stderr, no prefix, no decoration. */
    rawError(message?: string): void;
    /** Write `text` verbatim to a channel (no prefix, no decoration, no newline). */
    write(channel: LogChannel, text: string): void;
    debug(message?: string): void;
    info(message?: string): void;
    success(message?: string): void;
    warn(message?: string, id?: string): void;
    error(message?: string, id?: string): void;
}

/** Whether a value is a valid {@link LogLevel}. */
export function isLogLevel(value: unknown): value is LogLevel {
    return typeof value === 'string' && (LOG_LEVELS as readonly string[]).includes(value);
}

/** Coerce a possibly-invalid level to a known one (default `info`). */
export function normalizeLogLevel(value: unknown, fallback: LogLevel = 'info'): LogLevel {
    return isLogLevel(value) ? value : fallback;
}

/**
 * Strip ANSI SGR escape codes from `text`. Used to keep commander's help/error
 * output plain when the logger's colours are disabled (`--no-color` or
 * `logger.color: false`).
 */
export function stripAnsi(text: string): string {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/** A clack `log.*` renderer. */
type ClackLog = (message: string, opts?: LogMessageOptions) => void;

/** Normalize the suppression option into an array. */
function suppressionList(value: LoggerOptions['suppress']): LogSuppression[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

/** Parse a `/pattern/flags` string, or return undefined for a plain string. */
function slashRegex(value: string): RegExp | undefined {
    if (value.length < 2 || !value.startsWith('/')) return undefined;
    const last = value.lastIndexOf('/');
    if (last <= 0) return undefined;
    try {
        return new RegExp(value.slice(1, last), value.slice(last + 1));
    } catch {
        return undefined;
    }
}

/** Whether a suppression rule matches a message or its optional id. */
function suppressionMatches(
    rule: LogSuppression,
    message: string,
    id: string | undefined
): boolean {
    if (rule instanceof RegExp) return rule.test(message) || (id ? rule.test(id) : false);
    const regex = slashRegex(rule);
    if (regex) return regex.test(message) || (id ? regex.test(id) : false);
    const needle = rule.toLowerCase();
    return (
        (id !== undefined && id.toLowerCase() === needle) || message.toLowerCase().includes(needle)
    );
}

/** Create a logger with the given options. */
export function createLogger(options: LoggerOptions = {}): Logger {
    const level = normalizeLogLevel(options.level);
    const threshold = LEVELS[level];
    const colors: Colors = pc.createColors(options.color ?? true);
    const prefix = options.name ? `${options.name}: ` : '';
    const suppress = suppressionList(options.suppress);
    const isSuppressed = (message: string, id: string | undefined): boolean =>
        suppress.some(rule => suppressionMatches(rule, message, id));
    // clack colours via Node's `util.styleText`, which reads the environment —
    // apply the resolved colour there so `--no-color` / `logger.color: false`
    // reach it too. An undefined colour leaves the environment alone (autodetect).
    if (typeof options.color === 'boolean') applyColorEnv(options.color);

    const withPrefix = (message: string): string =>
        !prefix || message === '' || /^\s/.test(message) ? message : `${prefix}${message}`;

    const withId = (message: string, id: string | undefined): string =>
        id ? `[${formatMessageId(id)}] ${message}` : message;

    // clack renders each message as one line: `<symbol>  <message>` (spacing 0
    // drops the blank guide lines, multi-line messages get the guide bar).
    const render = (fn: ClackLog, message: string, output?: NodeJS.WriteStream): void => {
        fn(withPrefix(message), { spacing: 0, ...(output ? { output } : {}) });
    };

    const custom = options.logger;
    if (custom) {
        return {
            level,
            colors,
            raw: (message = '') => custom.raw(message),
            rawError: (message = '') => custom.rawError(message),
            write: (channel, text) => custom.write(channel, text),
            debug: (message = '') => {
                if (threshold <= LEVELS.debug) custom.debug(message);
            },
            info: (message = '') => {
                if (threshold <= LEVELS.info) custom.info(message);
            },
            success: (message = '') => {
                if (threshold <= LEVELS.info) custom.success(message);
            },
            warn: (message = '', id?: string) => {
                if (threshold <= LEVELS.warn && !isSuppressed(message, id)) {
                    custom.warn(message, id);
                }
            },
            error: (message = '', id?: string) => {
                if (threshold <= LEVELS.error && !isSuppressed(message, id)) {
                    custom.error(message, id);
                }
            },
        };
    }

    return {
        level,
        colors,
        raw: (message = '') => {
            process.stdout.write(`${message}\n`);
        },
        rawError: (message = '') => {
            process.stderr.write(`${message}\n`);
        },
        write: (channel, text) => {
            if (channel === 'err') process.stderr.write(text);
            else process.stdout.write(text);
        },
        debug: (message = '') => {
            if (threshold <= LEVELS.debug) render(clackLog.message, message);
        },
        info: (message = '') => {
            if (threshold <= LEVELS.info) render(clackLog.info, message);
        },
        success: (message = '') => {
            if (threshold <= LEVELS.info) render(clackLog.success, message);
        },
        warn: (message = '', id?: string) => {
            if (threshold <= LEVELS.warn && !isSuppressed(message, id)) {
                render(clackLog.warn, withId(message, id), process.stderr);
            }
        },
        error: (message = '', id?: string) => {
            if (threshold <= LEVELS.error && !isSuppressed(message, id)) {
                render(clackLog.error, withId(message, id), process.stderr);
            }
        },
    };
}

/** A `dbx.config.*` `logger` section value. */
export interface LoggerConfig {
    enabled?: boolean;
    level?: LogLevel;
    color?: boolean;
    name?: string;
    suppress?: LogSuppression | LogSuppression[];
    /** A custom logger implementation (config files only). */
    logger?: ToolchainLogger;
}

let configOptions: LoggerOptions = {};
let overrideOptions: LoggerOptions = {};

function pick(options: LoggerConfig | boolean | undefined): LoggerOptions {
    if (!options || typeof options !== 'object') return {};
    if (options.enabled === false) return { level: 'silent' };
    return {
        ...(isLogLevel(options.level) ? { level: options.level } : {}),
        ...(typeof options.color === 'boolean' ? { color: options.color } : {}),
        ...(typeof options.name === 'string' ? { name: options.name } : {}),
        ...(options.suppress !== undefined ? { suppress: options.suppress } : {}),
        ...(options.logger ? { logger: options.logger } : {}),
    };
}

/**
 * Apply the resolved colour to the environment so clack (Node's `util.styleText`)
 * honours it: `FORCE_COLOR` when on, `NO_COLOR` when off.
 */
function applyColorEnv(color: boolean): void {
    if (color) {
        delete process.env.NO_COLOR;
        process.env.FORCE_COLOR = '1';
    } else {
        delete process.env.FORCE_COLOR;
        process.env.NO_COLOR = '1';
    }
}

/**
 * Rebuild the active logger. `applyColor` is `false` for the initial (module
 * load) instance so merely importing the logger never mutates the host's colour
 * environment — only an explicit configuration (the CLI, or `configureLogger`)
 * does, and that defaults colour to on.
 */
function build(applyColor = true): Logger {
    const options: LoggerOptions = { name: DEFAULT_NAME, ...configOptions, ...overrideOptions };
    if (applyColor && options.color === undefined) options.color = true;
    return createLogger(options);
}

let active = build(false);

/** Apply the `logger` section from the loaded `dbx.config.*`. */
export function setLogConfig(options: LoggerConfig | boolean | undefined): void {
    configOptions = pick(options);
    active = build();
}

/** Apply logger overrides from the CLI (they win over the config). */
export function setLogOverrides(options: LoggerOptions): void {
    overrideOptions = options;
    active = build();
}

/** Configure the active logger directly (same as the CLI overrides). */
export function configureLogger(options: LoggerOptions): void {
    setLogOverrides(options);
}

/** The current CLI overrides (a command merges, rather than replaces, these). */
export function getLogOverrides(): LoggerOptions {
    return overrideOptions;
}

/** The active logger instance. */
export function getLogger(): Logger {
    return active;
}

/** The active logger; every call delegates to the current instance. */
export const logger: Logger = {
    get level() {
        return active.level;
    },
    get colors() {
        return active.colors;
    },
    raw: (message = '') => active.raw(message),
    rawError: (message = '') => active.rawError(message),
    write: (channel, text) => active.write(channel, text),
    debug: (message = '') => active.debug(message),
    info: (message = '') => active.info(message),
    success: (message = '') => active.success(message),
    warn: (message = '', id?: string) => active.warn(message, id),
    error: (message = '', id?: string) => active.error(message, id),
};
