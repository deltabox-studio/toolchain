/**
 * Generic replacement/template engine.
 *
 * All `@deltabox/toolchain` templates and generated files are authored with
 * `{{ token }}` placeholders (e.g. `{{name}}`, `{{scope}}`, `{{envPrefix}}`)
 * so a consumer can retarget the tooling at any project by supplying its own
 * replacement values. Tokens support an inline default: `{{name:my-app}}`.
 */

/** A replacement value. Falsy-but-defined values are stringified. */
export type ReplacementValue = string | number | boolean | null | undefined;

/** A map of token name to replacement value. */
export interface Replacements {
    [key: string]: ReplacementValue;
}

export interface ReplacementOptions {
    /** Opening token delimiter (default `{{`). */
    open?: string;
    /** Closing token delimiter (default `}}`). */
    close?: string;
    /** Keep unresolved tokens as-is instead of erasing them (default true). */
    keepUnresolved?: boolean;
    /** Throw when a token cannot be resolved (default false). */
    strict?: boolean;
    /** Transform every resolved value before it is written. */
    transform?: (value: string, key: string) => string;
}

/** A compiled replacer: feed it a string, get the rendered string back. */
export type Replacer = (input: string) => string;

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Build the token-matching regular expression for the given delimiters. */
export function tokenPattern(open = '{{', close = '}}'): RegExp {
    return new RegExp(
        `${escapeRegExp(open)}\\s*([\\w.@/-]+)\\s*(?::\\s*([^]*?))?\\s*${escapeRegExp(close)}`,
        'g'
    );
}

function stringify(value: ReplacementValue): string {
    if (value === undefined || value === null) return '';
    return String(value);
}

/**
 * Replace every `{{ token }}` (or custom delimiter) occurrence in `input`
 * using `replacements`. Missing tokens fall back to their inline default, then
 * to the `keepUnresolved`/`strict` policy.
 */
export function applyReplacements(
    input: string,
    replacements: Replacements = {},
    options: ReplacementOptions = {}
): string {
    const { open = '{{', close = '}}', keepUnresolved = true, strict = false, transform } = options;
    const pattern = tokenPattern(open, close);
    return input.replace(pattern, (match, key: string, fallback: string | undefined) => {
        const has = Object.hasOwn(replacements, key);
        if (has) {
            const value = stringify(replacements[key]);
            return transform ? transform(value, key) : value;
        }
        if (fallback !== undefined) return fallback.trim();
        if (strict) throw new Error(`Missing replacement for token "{{${key}}}"`);
        return keepUnresolved ? match : '';
    });
}

/** Create a reusable {@link Replacer} bound to a replacement map. */
export function createReplacer(
    replacements: Replacements = {},
    options: ReplacementOptions = {}
): Replacer {
    return (input: string) => applyReplacements(input, replacements, options);
}

/**
 * Recursively apply replacements to an arbitrary value. Strings are rendered;
 * arrays and plain objects are walked; everything else is returned as-is.
 */
export function applyReplacementsDeep<T>(
    value: T,
    replacements: Replacements = {},
    options: ReplacementOptions = {}
): T {
    if (typeof value === 'string') {
        return applyReplacements(value, replacements, options) as unknown as T;
    }
    if (Array.isArray(value)) {
        return value.map(item =>
            applyReplacementsDeep(item, replacements, options)
        ) as unknown as T;
    }
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
            out[key] = applyReplacementsDeep(child, replacements, options);
        }
        return out as unknown as T;
    }
    return value;
}

/** Every distinct token name referenced by `input`. */
export function extractTokens(input: string, options: ReplacementOptions = {}): string[] {
    const pattern = tokenPattern(options.open, options.close);
    const tokens = new Set<string>();
    for (const match of input.matchAll(pattern)) {
        if (match[1]) tokens.add(match[1]);
    }
    return [...tokens];
}

/** Whether `input` still contains any token (resolved or not). */
export function hasUnresolvedTokens(input: string): boolean {
    const pattern = tokenPattern();
    pattern.lastIndex = 0;
    return pattern.test(input);
}

/** Identity helper that keeps replacement maps type-checked at the call site. */
export function defineReplacements<T extends Replacements>(replacements: T): T {
    return replacements;
}
