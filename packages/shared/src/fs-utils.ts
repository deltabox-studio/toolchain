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
    const existing = readJsonAt<Record<string, unknown>>(cwd, relative) ?? {};
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
