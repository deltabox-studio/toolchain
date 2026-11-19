/**
 * Console spinners for long-running CLI work.
 *
 * Spinners are purely cosmetic: they must never run for machine output
 * (`--json`), colourless/quiet runs, CI, or a non-TTY stream. `withSpinner`
 * makes that decision once, always stops the spinner on errors, and pauses the
 * animation while the shared logger writes so task lines never corrupt it.
 */

import { spinner as clackSpinner } from '@clack/prompts';

import { getLogOverrides, logger, setLogWriteHooks } from './logger.js';

let spinnerOverride: boolean | undefined;

/** The spinner currently rendering (at most one; nested runs reuse it). */
interface ActiveSpinner {
    pause(): void;
    resume(): void;
    cancel(): void;
}

let activeSpinner: ActiveSpinner | undefined;

/**
 * Force spinner rendering on/off for the current command. The CLI sets this
 * from its machine-output flags; `undefined` restores automatic detection.
 */
export function setSpinnerEnabled(enabled: boolean | undefined): void {
    spinnerOverride = enabled;
}

/**
 * Cancel the active spinner (used by the CLI's SIGINT handler) so the line is
 * cleared instead of left dangling when the process exits.
 */
export function cancelActiveSpinner(): void {
    activeSpinner?.cancel();
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
    // Colour support is deliberately not required: a monochrome TTY still
    // benefits from a spinner. `--no-color`/`logger.color: false` set
    // `NO_COLOR`, which is checked above.
    if (logger.level === 'silent') return false;
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
    /** Output stream used for TTY detection and rendering (default: stdout). */
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
 * environment is non-interactive. Log writes pause the animation and resume it
 * afterwards, so sync/task lines stay readable.
 */
export async function withSpinner<T>(
    task: () => Promise<T>,
    options: WithSpinnerOptions<T>
): Promise<T> {
    const enabled = options.enabled ?? canShowSpinner(options.stream, options.env);
    // A nested run inherits the outer spinner; two animations would fight over
    // the same line.
    if (!enabled || activeSpinner) return task();

    const spin = clackSpinner(options.stream ? { output: options.stream } : {});
    let message = options.start;
    let running = false;

    const start = (): void => {
        spin.start(message);
        running = true;
    };
    const pause = (): void => {
        if (!running) return;
        spin.clear();
        running = false;
    };
    const resume = (): void => {
        if (running) return;
        start();
    };
    const spinner: ActiveSpinner = {
        pause,
        resume,
        cancel: () => {
            if (!running) return;
            running = false;
            spin.cancel();
        },
    };

    activeSpinner = spinner;
    setLogWriteHooks({ before: pause, after: resume });
    try {
        start();
        const result = await task();
        message = messageOf(options.success, result) || options.start;
        if (running) {
            spin.stop(message);
            running = false;
        }
        return result;
    } catch (error) {
        const fallback = error instanceof Error ? error.message : String(error);
        message = messageOf(options.fail, error) || fallback;
        if (running) {
            // A failure must not be rendered with the green success glyph.
            spin.error(message);
            running = false;
        }
        throw error;
    } finally {
        if (running) {
            spin.stop(message);
            running = false;
        }
        setLogWriteHooks(undefined);
        activeSpinner = undefined;
    }
}
