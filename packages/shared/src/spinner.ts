/**
 * Console spinners for long-running CLI work.
 *
 * Spinners are purely cosmetic: they must never run for machine output
 * (`--json`), colourless/quiet runs, CI, or a non-TTY stream. `withSpinner`
 * makes that decision once and always stops the spinner on errors.
 */

import { spinner as clackSpinner } from '@clack/prompts';

import { getLogOverrides, logger } from './logger.js';

let spinnerOverride: boolean | undefined;

/**
 * Force spinner rendering on/off for the current command. The CLI sets this
 * from its machine-output flags; `undefined` restores automatic detection.
 */
export function setSpinnerEnabled(enabled: boolean | undefined): void {
    spinnerOverride = enabled;
}

/** Whether a spinner should render for the given stream/environment. */
export function canShowSpinner(
    stream: NodeJS.WriteStream = process.stdout,
    env: NodeJS.ProcessEnv = process.env
): boolean {
    if (spinnerOverride !== undefined) return spinnerOverride;
    if (env.CI) return false;
    if (env.NO_COLOR) return false;
    if (env.TERM === 'dumb') return false;
    if (!stream.isTTY) return false;
    if (!logger.colors.isColorSupported) return false;
    const overrides = getLogOverrides();
    if (overrides.color === false) return false;
    if (overrides.level === 'silent') return false;
    return true;
}

export interface WithSpinnerOptions<T> {
    /** Text shown while the task runs. */
    start: string;
    /** Text shown on success (defaults to `start`). */
    success?: string | ((result: T) => string);
    /** Text shown on failure (defaults to the error message). */
    fail?: string | ((error: unknown) => string);
    /** Force the spinner on/off instead of auto-detecting. */
    enabled?: boolean;
    /** Output stream used for TTY detection (default: stdout). */
    stream?: NodeJS.WriteStream;
    /** Environment used for CI/colour detection (default: `process.env`). */
    env?: NodeJS.ProcessEnv;
}

function messageOf<T>(value: string | ((value: T) => string) | undefined, input: T): string {
    return typeof value === 'function' ? value(input) : (value ?? '');
}

/**
 * Run `task` behind a clack spinner. The spinner is stopped on success and
 * failure (and the error rethrown), and no spinner output is produced when the
 * environment is non-interactive.
 */
export async function withSpinner<T>(
    task: () => Promise<T>,
    options: WithSpinnerOptions<T>
): Promise<T> {
    const enabled = options.enabled ?? canShowSpinner(options.stream, options.env);
    if (!enabled) return task();

    const spin = clackSpinner();
    spin.start(options.start);
    try {
        const result = await task();
        const success = messageOf(options.success, result) || options.start;
        spin.stop(success);
        return result;
    } catch (error) {
        const fallback = error instanceof Error ? error.message : String(error);
        spin.stop(messageOf(options.fail, error) || fallback);
        throw error;
    }
}
