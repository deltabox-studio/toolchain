import fs from 'node:fs';
import path from 'node:path';

import { deepMerge, isPlainObject, isUnsafeKey } from './object-utils.js';

/** VS Code arrays that are additive rather than replaced. */
const UNION_ARRAY_KEYS = new Set(['recommendations', 'extensions']);

/** Read + parse a JSON file, returning `undefined` when it is missing/invalid. */
export function readJsonFile<T = Record<string, unknown>>(file: string): T | undefined {
    try {
        // Strip a UTF-8 BOM: editors/PowerShell often write one, and JSON.parse
        // rejects it.
        return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '')) as T;
    } catch {
        return undefined;
    }
}

/** Read + parse a JSON file relative to `cwd`. */
export function readJsonAt<T = Record<string, unknown>>(
    cwd: string,
    relative: string
): T | undefined {
    return readJsonFile<T>(path.resolve(cwd, relative));
}

/** Strip JSONC comments and trailing commas so `JSON.parse` can read the file. */
function stripJsonc(text: string): string {
    let out = '';
    let inString = false;
    let escaped = false;
    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (inString) {
            out += char;
            if (escaped) escaped = false;
            else if (char === '\\') escaped = true;
            else if (char === '"') inString = false;
            continue;
        }
        if (char === '"') {
            inString = true;
            out += char;
            continue;
        }
        if (char === '/' && text[index + 1] === '/') {
            while (index < text.length && text[index] !== '\n') index += 1;
            out += '\n';
            continue;
        }
        if (char === '/' && text[index + 1] === '*') {
            index += 2;
            while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) {
                index += 1;
            }
            index += 1;
            continue;
        }
        if (char === ',') {
            let next = index + 1;
            while (next < text.length && /\s/.test(text[next]!)) next += 1;
            if (text[next] === '}' || text[next] === ']') continue;
        }
        out += char;
    }
    return out;
}

/** Read + parse a JSONC file (comments and trailing commas allowed). */
export function readJsoncFile<T = Record<string, unknown>>(file: string): T | undefined {
    try {
        return JSON.parse(stripJsonc(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''))) as T;
    } catch {
        return undefined;
    }
}

/** Read + parse a JSONC file relative to `cwd`. */
export function readJsoncAt<T = Record<string, unknown>>(
    cwd: string,
    relative: string
): T | undefined {
    return readJsoncFile<T>(path.resolve(cwd, relative));
}

/** Serialize a value to JSON text (trailing newline included). */
export function toJson(value: unknown, indent = 4): string {
    return `${JSON.stringify(value, null, indent)}\n`;
}

/** Write JSON text to a file, creating parent directories. */
export function writeJsonFile(file: string, value: unknown, indent = 4): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, toJson(value, indent), 'utf-8');
}

/**
 * Merge a patch over the existing JSON at `cwd/relative` (deep merge for
 * objects; `recommendations`/`extensions` arrays are unioned) and return the
 * serialized result. Used by the VS Code sync task so consumer settings survive.
 */
export function mergeJsonAt(
    cwd: string,
    relative: string,
    patch: Record<string, unknown>,
    indent = 4
): string {
    const file = path.resolve(cwd, relative);
    const original = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : undefined;
    const existing =
        original === undefined ? {} : readJsoncAt<Record<string, unknown>>(cwd, relative);
    if (existing === undefined || !isPlainObject(existing)) {
        // Never replace a malformed/JSON-array settings file with only the patch.
        throw new Error(`cannot merge ${relative}: expected a valid JSON object.`);
    }
    const merged = mergeWithArrays(existing, patch);
    // Preserve the original file (including comments) when nothing changed.
    if (original !== undefined && JSON.stringify(merged) === JSON.stringify(existing)) {
        return original;
    }
    // Adding keys can be done in place, keeping the consumer's comments and
    // layout. Overrides/array changes need a full reserialization.
    if (original !== undefined) {
        const edited = insertMissingJsonc(original, existing, patch);
        if (edited !== undefined) return edited;
    }
    return toJson(merged, indent);
}

function mergeWithArrays(
    base: Record<string, unknown>,
    patch: Record<string, unknown>
): Record<string, unknown> {
    const out = deepMerge(base, patch);
    for (const key of Object.keys(patch)) {
        if (isUnsafeKey(key)) continue;
        const a = base[key];
        const b = patch[key];
        if (Array.isArray(a) && Array.isArray(b) && UNION_ARRAY_KEYS.has(key)) {
            out[key] = [...new Set([...a, ...b])];
        } else if (isPlainObject(a) && isPlainObject(b)) {
            out[key] = mergeWithArrays(a as Record<string, unknown>, b as Record<string, unknown>);
        }
    }
    return out;
}

/** A parsed JSONC value's source span (comments/whitespace excluded). */
type JsoncNode =
    | { type: 'object'; open: number; close: number; end: number; properties: JsoncProperty[] }
    | { type: 'array'; open: number; close: number; end: number }
    | { type: 'scalar'; start: number; end: number };

interface JsoncProperty {
    key: string;
    /** Index of the key's opening quote. */
    keyStart: number;
    value: JsoncNode;
}

/** Skip whitespace and JSONC comments. */
function skipJsoncTrivia(text: string, index: number): number {
    for (;;) {
        const char = text[index];
        if (char === undefined) return index;
        if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
            index += 1;
            continue;
        }
        if (char === '/' && text[index + 1] === '/') {
            index += 2;
            while (index < text.length && text[index] !== '\n') index += 1;
            continue;
        }
        if (char === '/' && text[index + 1] === '*') {
            index += 2;
            while (index < text.length && !(text[index] === '*' && text[index + 1] === '/')) {
                index += 1;
            }
            index += 2;
            continue;
        }
        return index;
    }
}

function parseJsoncString(text: string, index: number): { value: string; end: number } {
    let end = index + 1;
    while (end < text.length) {
        const char = text[end];
        if (char === '\\') {
            end += 2;
            continue;
        }
        end += 1;
        if (char === '"') break;
    }
    return { value: JSON.parse(text.slice(index, end)) as string, end };
}

function parseJsoncValue(text: string, index: number): JsoncNode {
    const start = skipJsoncTrivia(text, index);
    const char = text[start];
    if (char === '{') return parseJsoncObject(text, start);
    if (char === '[') return parseJsoncArray(text, start);
    if (char === '"') {
        const string = parseJsoncString(text, start);
        return { type: 'scalar', start, end: string.end };
    }
    let end = start;
    while (end < text.length && !/[,}\]\s/]/.test(text[end] as string)) end += 1;
    return { type: 'scalar', start, end };
}

function parseJsoncObject(text: string, index: number): JsoncNode {
    const properties: JsoncProperty[] = [];
    let cursor = index + 1;
    for (;;) {
        cursor = skipJsoncTrivia(text, cursor);
        if (text[cursor] === '}') {
            return { type: 'object', open: index, close: cursor, end: cursor + 1, properties };
        }
        const keyStart = cursor;
        const key = parseJsoncString(text, cursor);
        cursor = skipJsoncTrivia(text, key.end);
        if (text[cursor] !== ':') throw new Error('expected ":"');
        const value = parseJsoncValue(text, cursor + 1);
        properties.push({ key: key.value, keyStart, value });
        cursor = skipJsoncTrivia(text, value.end);
        if (text[cursor] === ',') cursor += 1;
    }
}

function parseJsoncArray(text: string, index: number): JsoncNode {
    let cursor = index + 1;
    for (;;) {
        cursor = skipJsoncTrivia(text, cursor);
        if (text[cursor] === ']') {
            return { type: 'array', open: index, close: cursor, end: cursor + 1 };
        }
        const value = parseJsoncValue(text, cursor);
        cursor = skipJsoncTrivia(text, value.end);
        if (text[cursor] === ',') cursor += 1;
    }
}

/** The whitespace indenting the line that contains `index` (empty if mixed). */
function jsoncLineIndent(text: string, index: number): string {
    const start = text.lastIndexOf('\n', index - 1) + 1;
    const prefix = text.slice(start, index);
    return /^[ \t]*$/.test(prefix) ? prefix : '';
}

/** Serialize a value with continuation lines indented for a property at `indent`. */
function serializeJsoncValue(value: unknown, indent: string): string {
    const json = JSON.stringify(value, null, 4) ?? 'null';
    return json
        .split('\n')
        .map((line, index) => (index === 0 ? line : indent + line))
        .join('\n');
}

/** Render the edit that inserts `additions` into an object before its close. */
function renderJsoncAdditions(
    text: string,
    node: Extract<JsoncNode, { type: 'object' }>,
    additions: [string, unknown][]
): { at: number; text: string } {
    const last = node.properties[node.properties.length - 1];
    const closeIndent = jsoncLineIndent(text, node.close);
    const indent = last
        ? jsoncLineIndent(text, last.keyStart) || `${closeIndent}    `
        : `${closeIndent}    `;
    const body = additions
        .map(([key, value]) => `${JSON.stringify(key)}: ${serializeJsoncValue(value, indent)}`)
        .join(`,\n${indent}`);
    if (!last) {
        return { at: node.open + 1, text: `\n${indent}${body}\n${closeIndent}` };
    }
    const next = skipJsoncTrivia(text, last.value.end);
    if (text[next] === ',') {
        return { at: next + 1, text: `\n${indent}${body}` };
    }
    return { at: last.value.end, text: `,\n${indent}${body}` };
}

/** Recursively collect the keys in `patch` that `existing` does not have. */
function collectJsoncAdditions(
    text: string,
    node: Extract<JsoncNode, { type: 'object' }>,
    existing: Record<string, unknown>,
    patch: Record<string, unknown>,
    edits: { at: number; text: string }[],
    ignoreExisting: boolean
): boolean {
    const properties = new Map(node.properties.map(property => [property.key, property]));
    const additions: [string, unknown][] = [];
    for (const [key, value] of Object.entries(patch)) {
        if (isUnsafeKey(key)) continue;
        const property = properties.get(key);
        if (property === undefined) {
            additions.push([key, value]);
            continue;
        }
        const current = existing[key];
        if (isPlainObject(value) && isPlainObject(current) && property.value.type === 'object') {
            if (
                !collectJsoncAdditions(
                    text,
                    property.value,
                    current as Record<string, unknown>,
                    value as Record<string, unknown>,
                    edits,
                    ignoreExisting
                )
            ) {
                return false;
            }
            continue;
        }
        // `ignoreExisting` keeps add-only semantics (the consumer's value wins).
        if (ignoreExisting) continue;
        // Same value: nothing to do. Different value: needs a full rewrite.
        if (JSON.stringify(value) !== JSON.stringify(current)) return false;
    }
    if (additions.length > 0) edits.push(renderJsoncAdditions(text, node, additions));
    return true;
}

/**
 * Insert the patch's missing properties into a JSONC document, preserving its
 * comments and layout. Returns `undefined` when the patch would override an
 * existing value (the caller should then serialize the merged object instead).
 */
export function insertMissingJsonc(
    original: string,
    existing: Record<string, unknown>,
    patch: Record<string, unknown>,
    options: { ignoreExisting?: boolean } = {}
): string | undefined {
    let root: JsoncNode;
    try {
        root = parseJsoncValue(original, 0);
    } catch {
        return undefined;
    }
    if (root.type !== 'object') return undefined;
    const edits: { at: number; text: string }[] = [];
    if (
        !collectJsoncAdditions(
            original,
            root,
            existing,
            patch,
            edits,
            options.ignoreExisting ?? false
        )
    ) {
        return undefined;
    }
    if (edits.length === 0) return original;
    // Apply from the end so earlier offsets stay valid.
    edits.sort((a, b) => b.at - a.at);
    let out = original;
    for (const edit of edits) out = out.slice(0, edit.at) + edit.text + out.slice(edit.at);
    return out;
}
