/**
 * The shared console logger.
 *
 * One level-aware, color-aware sink for everything the toolchain prints, so the
 * output is consistent and configurable — from `dbx.config.*`'s `logger` section
 * and from the CLI (`--log-level`, `--color`/`--no-color`). Colors use the same
 * package Vite uses (`picocolors`).
 *
 * Use `logger.info` for human messages, `logger.raw` for machine output (`--json`
 * must not be prefixed or colored), and `logger.success`/`warn`/`error`/`debug`
 * for the rest. Messages that start with whitespace (indented continuations) are
 * never prefixed.
 */

import pc from 'picocolors';

/** Ordered from most to least verbose. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** A `picocolors` color set (color-aware). */
export type Colors = ReturnType<typeof pc.createColors>;

/** Every valid level, most verbose first. */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

/** The prefix every non-indented line gets by default. */
const DEFAULT_NAME = 'dbx';

export interface LoggerOptions {
    /** Minimum level to print (default `info`). */
    level?: LogLevel;
    /** Force colors on/off (default: `picocolors` autodetection). */
    color?: boolean;
    /** Prefix non-indented lines with `<name>:` (default `dbx`). */
    name?: string;
}

export interface Logger {
    /** The configured level. */
    readonly level: LogLevel;
    /** A `picocolors` color set honoring the color setting. */
    readonly colors: Colors;
    /** Machine-readable output: raw to stdout, no prefix, no color. */
    raw(message?: string): void;
    debug(message?: string): void;
    info(message?: string): void;
    success(message?: string): void;
    warn(message?: string): void;
    error(message?: string): void;
}

/** Whether a value is a valid {@link LogLevel}. */
export function isLogLevel(value: unknown): value is LogLevel {
    return typeof value === 'string' && value in LEVELS;
}

/** Coerce a possibly-invalid level to a known one (default `info`). */
export function normalizeLogLevel(value: unknown, fallback: LogLevel = 'info'): LogLevel {
    return isLogLevel(value) ? value : fallback;
}

/** Create a logger with the given options. */
export function createLogger(options: LoggerOptions = {}): Logger {
    const level = normalizeLogLevel(options.level);
    const threshold = LEVELS[level];
    const colors: Colors = options.color === undefined ? pc : pc.createColors(options.color);
    const prefix = options.name ? `${options.name}: ` : '';

    const line = (message: string, paint: (text: string) => string): string => {
        const painted = message === '' ? '' : paint(message);
        if (!prefix || message === '' || /^\s/.test(message)) return painted;
        return `${colors.dim(prefix)}${painted}`;
    };
    const out = (text: string): void => {
        process.stdout.write(`${text}\n`);
    };
    const err = (text: string): void => {
        process.stderr.write(`${text}\n`);
    };

    return {
        level,
        colors,
        raw: (message = '') => out(message),
        debug: (message = '') => {
            if (threshold <= LEVELS.debug) out(line(message, colors.dim));
        },
        info: (message = '') => {
            if (threshold <= LEVELS.info) out(line(message, text => text));
        },
        success: (message = '') => {
            if (threshold <= LEVELS.info) out(line(message, colors.green));
        },
        warn: (message = '') => {
            if (threshold <= LEVELS.warn) err(line(message, colors.yellow));
        },
        error: (message = '') => {
            if (threshold <= LEVELS.error) err(line(message, colors.red));
        },
    };
}

/** A `dbx.config.*` `logger` section value. */
export interface LoggerConfig {
    level?: LogLevel;
    color?: boolean;
    name?: string;
}

let configOptions: LoggerOptions = {};
let overrideOptions: LoggerOptions = {};

function pick(options: LoggerConfig | boolean | undefined): LoggerOptions {
    if (!options || typeof options !== 'object') return {};
    return {
        ...(isLogLevel(options.level) ? { level: options.level } : {}),
        ...(typeof options.color === 'boolean' ? { color: options.color } : {}),
        ...(typeof options.name === 'string' ? { name: options.name } : {}),
    };
}

function build(): Logger {
    return createLogger({ name: DEFAULT_NAME, ...configOptions, ...overrideOptions });
}

let active = build();

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
    debug: (message = '') => active.debug(message),
    info: (message = '') => active.info(message),
    success: (message = '') => active.success(message),
    warn: (message = '') => active.warn(message),
    error: (message = '') => active.error(message),
};
