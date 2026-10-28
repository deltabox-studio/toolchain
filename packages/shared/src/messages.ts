/**
 * Central warning/error messages, keyed by a stable id.
 *
 * The keys double as logger ids, so consumers can silence a specific message
 * with `logger.suppress` without matching its rendered text.
 */

/** Non-fatal messages emitted by sync tasks. */
export const WARNING_MAP = {
    'fmt.conflict':
        'Multiple formatters configured ({tools}); using {winner} (precedence) for editor settings.',
    'lint.conflict':
        'Multiple linters configured ({tools}); using {winner} (precedence) for editor settings.',
    'fmt.no-tool':
        'No formatter found (installed or in VS Code settings); falling back to Oxc defaults. ' +
        'Set `toolchain.fmt.oxc` or install a formatter to silence this.',
    'lint.no-tool':
        'No linter found (installed or in VS Code settings); falling back to Oxc defaults. ' +
        'Set `toolchain.lint.oxc` or install a linter to silence this.',
} as const;

/** Error messages emitted by sync tasks. */
export const ERROR_MAP = {
    'deprecated.section.biome':
        '`toolchain.biome` is deprecated: use `toolchain.fmt.biome` / `toolchain.lint.biome` instead.',
} as const;

export type WarningId = keyof typeof WARNING_MAP;
export type ErrorId = keyof typeof ERROR_MAP;
export type MessageId = WarningId | ErrorId;

/** Render an id for logs/notifications (`fmt.conflict` -> `FMT_CONFLICT`). */
export function formatMessageId(id: string): string {
    return id.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
}

/** Replace `{name}` placeholders in a message template. */
export function formatMessage(
    template: string,
    values: Record<string, string | number> = {}
): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) =>
        key in values ? String(values[key]) : match
    );
}

/** The rendered warning message for an id. */
export function warningMessage(id: WarningId, values?: Record<string, string | number>): string {
    return formatMessage(WARNING_MAP[id], values);
}

/** The rendered error message for an id. */
export function errorMessage(id: ErrorId, values?: Record<string, string | number>): string {
    return formatMessage(ERROR_MAP[id], values);
}
