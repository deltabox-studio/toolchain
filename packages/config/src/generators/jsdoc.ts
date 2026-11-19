/**
 * JSDoc escaping for generated source.
 *
 * Generator output embeds user-provided descriptions, examples and headers in
 * JSDoc comments. A closing-comment delimiter inside that text would close the
 * comment early and leave invalid TypeScript behind, so every comment path
 * funnels through these helpers.
 */

/** Neutralize a closing JSDoc delimiter so text cannot end the comment early. */
export function escapeJsDoc(text: string): string {
    return text.replace(/\*\//g, '*\\/');
}

/**
 * Escape text for a one-line JSDoc comment: newlines become spaces so the whole
 * comment stays on a single line, then the closing delimiter is neutralized.
 */
export function escapeInlineJsDoc(text: string): string {
    return escapeJsDoc(text.replace(/\r?\n/g, ' '));
}
