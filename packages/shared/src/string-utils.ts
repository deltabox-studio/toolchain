/** Coerce a value to a trimmed string. */
export function str(v: unknown): string {
    return typeof v === 'string' ? v.trim() : '';
}

/** Coerce a value to a string without trimming. */
export function asString(v: unknown): string {
    return typeof v === 'string' ? v : '';
}

/** Whether a value looks like a non-empty string after trimming. */
export function hasText(v: unknown): v is string {
    return typeof v === 'string' && v.trim().length > 0;
}

/** Uppercase the first letter of a string (no-op on empty input). */
export function capitalize(text: string): string {
    return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function words(text: string): string[] {
    return text
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean);
}

/** `foo bar` -> `fooBar`. */
export function camelCase(text: string): string {
    return words(text)
        .map((word, i) => (i === 0 ? word.toLowerCase() : capitalize(word.toLowerCase())))
        .join('');
}

/** `foo bar` -> `FooBar`. */
export function pascalCase(text: string): string {
    return words(text)
        .map(word => capitalize(word.toLowerCase()))
        .join('');
}

/** `foo bar` -> `foo-bar`. */
export function kebabCase(text: string): string {
    return words(text)
        .map(word => word.toLowerCase())
        .join('-');
}

/** `foo bar` -> `foo_bar`. */
export function snakeCase(text: string): string {
    return words(text)
        .map(word => word.toLowerCase())
        .join('_');
}

/** `foo bar` -> `FOO_BAR`. */
export function constantCase(text: string): string {
    return words(text)
        .map(word => word.toUpperCase())
        .join('_');
}

/** `foo bar` -> `Foo Bar`. */
export function titleCase(text: string): string {
    return words(text)
        .map(word => capitalize(word.toLowerCase()))
        .join(' ');
}

/**
 * Convert an operation id into a camelCase identifier:
 * `hosts.list` -> `hostsList`, `auth.login` -> `authLogin`.
 */
export function camelCaseId(operationId: string): string {
    return camelCase(operationId);
}

/**
 * Turn an env-var-ish identifier into a CLI flag, stripping a prefix:
 * `MYAPP_CLI_BASE_URL` -> `base-url` (with prefix `MYAPP_`).
 */
export function formatCliFlag(env: string, prefix = ''): string {
    const name = prefix && env.startsWith(prefix) ? env.slice(prefix.length) : env;
    return kebabCase(name);
}

/** Indent every non-empty line of a string. */
export function indent(text: string, spaces = 2): string {
    const pad = ' '.repeat(spaces);
    return text
        .split('\n')
        .map(line => (line.trim() ? pad + line : line))
        .join('\n');
}

/** Whether a URI points at a local host (localhost, 127.0.0.1, 0.0.0.0, ::). */
export function isLocalhost(uri: string): boolean {
    return /localhost|127\.0\.0\.1|0\.0\.0\.0|::/.test(uri);
}

/** Ensure a string starts with `slash`. */
export function ensureLeadingSlash(value: string, slash = '/'): string {
    return value.startsWith(slash) ? value : `${slash}${value}`;
}

/** Ensure a string ends with `slash`. */
export function ensureTrailingSlash(value: string, slash = '/'): string {
    return value.endsWith(slash) ? value : `${value}${slash}`;
}

/** Remove leading slashes from a string. */
export function removeLeadingSlash(value: string, slash = '/'): string {
    return value.replace(new RegExp(`^${escapeSlash(slash)}+`), '');
}

/** Remove trailing slashes from a string. */
export function removeTrailingSlash(value: string, slash = '/'): string {
    return value.replace(new RegExp(`${escapeSlash(slash)}+$`), '');
}

/** Collapse repeated slashes in a string. */
export function removeDoubleSlashes(value: string, slash = '/'): string {
    return value.replace(new RegExp(`${escapeSlash(slash)}+`, 'g'), slash);
}

/** Sanitize slashes with the given operations (default: all). */
export function sanitizeSlashes(
    value: string,
    operations: ('leading' | 'trailing' | 'double')[] = ['leading', 'trailing', 'double'],
    slash = '/'
): string {
    let result = value;
    for (const op of operations) {
        if (op === 'leading') result = removeLeadingSlash(result, slash);
        if (op === 'trailing') result = removeTrailingSlash(result, slash);
        if (op === 'double') result = removeDoubleSlashes(result, slash);
    }
    return result;
}

/** Ensure slashes at the requested positions. */
export function ensureSlashes(
    value: string,
    operations: ('leading' | 'trailing')[],
    slash = '/'
): string {
    if (!operations.length) throw new Error('ensureSlashes: operations array cannot be empty.');
    let result = value;
    for (const op of operations) {
        if (op === 'leading') result = ensureLeadingSlash(result, slash);
        else if (op === 'trailing') result = ensureTrailingSlash(result, slash);
        else throw new Error(`ensureSlashes: invalid operation: ${op}`);
    }
    return result;
}

function escapeSlash(slash: string): string {
    return slash === '/' ? '\\/' : slash;
}

/**
 * Bare C0 control characters that are never intended in generated text, keeping
 * tab (`\t`), line feed (`\n`) and carriage return (`\r`). These are what a
 * shell can leave behind when it interprets `\`` escapes (backspace, form feed,
 * vertical tab, ...) before the text ever reaches us.
 */
const BARE_CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/**
 * A backslash immediately followed by a control character — the predictable
 * shape of an escaped backtick a **shell** interpreted before writing the text
 * (`` \`t `` becomes `\` + TAB, `` \`n `` becomes `\` + LF, ...). The backslash
 * and the control character are both removed.
 */
const ESCAPED_CONTROL_CHARS = /\\[\u0000-\u001f]/g;

/** Strip bare control characters, keeping `\t`, `\n` and `\r`. */
export function stripControlChars(text: string): string {
    return text.replace(BARE_CONTROL_CHARS, '');
}

/**
 * Strip the predictable shell-escape artifacts: a backslash that precedes a
 * control character. Ordinary backslashes (Windows paths, regular expressions,
 * Markdown hard breaks that use two trailing spaces) are left untouched — only
 * a backslash directly before a control character is removed.
 */
export function stripEscapeArtifacts(text: string): string {
    return text.replace(ESCAPED_CONTROL_CHARS, '');
}

/**
 * Sanitize text that may have passed through a shell (commit bodies, generated
 * descriptions) before it is rendered to markdown: normalize CRLF to LF, then
 * strip shell-escape artifacts followed by any remaining bare control
 * characters. Conservative by design — it never removes an ordinary backslash.
 */
export function sanitizeText(text: string): string {
    return stripControlChars(stripEscapeArtifacts(text.replace(/\r\n?/g, '\n')));
}
