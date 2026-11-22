/**
 * Small argv helpers shared by routing, parsing and execution.
 */

/** Whether any of `tokens` appears before the `--` separator. */
export function hasTokenBeforeSeparator(
    argv: readonly string[],
    tokens: readonly string[]
): boolean {
    const separator = argv.indexOf('--');
    const limit = separator === -1 ? argv.length : separator;
    return argv.slice(0, limit).some(token => tokens.includes(token));
}

/** Whether a value is promise-like. */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { then?: unknown }).then === 'function'
    );
}
