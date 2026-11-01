import fs from 'node:fs';
import path from 'node:path';

import { deepMerge, isPlainObject } from './object-utils.js';

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
    const existing = readJsoncAt<Record<string, unknown>>(cwd, relative) ?? {};
    const merged = mergeWithArrays(existing, patch);
    return toJson(merged, indent);
}

function mergeWithArrays(
    base: Record<string, unknown>,
    patch: Record<string, unknown>
): Record<string, unknown> {
    const out = deepMerge(base, patch);
    for (const key of Object.keys(patch)) {
        const a = base[key];
        const b = patch[key];
        if (Array.isArray(a) && Array.isArray(b)) {
            out[key] = [...new Set([...a, ...b])];
        } else if (isPlainObject(a) && isPlainObject(b)) {
            out[key] = mergeWithArrays(a as Record<string, unknown>, b as Record<string, unknown>);
        }
    }
    return out;
}
