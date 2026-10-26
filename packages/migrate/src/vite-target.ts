/**
 * `--target vite`: fold the migrated config into a `vite.config.ts`.
 *
 * Vite+ reads `fmt`/`lint` from `vite.config.ts` (not from
 * `.oxfmtrc.json`/`.oxlintrc.json`), so a Vite+ consumer wants the migration
 * written there. {@link mergeViteConfig} inserts or replaces the `fmt`/`lint`
 * properties inside the `defineConfig({ ... })` object, using a small
 * string-aware scanner (so braces/strings in the existing file are respected).
 */

import fs from 'node:fs';
import path from 'node:path';

import type { MigrationFile } from './types.js';

type Json = Record<string, unknown>;

const IDENT = /^[A-Za-z_$][\w$]*$/;

/** Serialize a JSON-ish value as TypeScript source (single quotes, 4-space). */
export function serializeTs(value: unknown, indent = 0): string {
    const pad = '    '.repeat(indent);
    const pad1 = '    '.repeat(indent + 1);
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const items = value.map(item => `${pad1}${serializeTs(item, indent + 1)}`).join(',\n');
        return `[\n${items},\n${pad}]`;
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value as Json);
        if (entries.length === 0) return '{}';
        const body = entries
            .map(([key, child]) => {
                const name = IDENT.test(key) ? key : JSON.stringify(key);
                return `${pad1}${name}: ${serializeTs(child, indent + 1)}`;
            })
            .join(',\n');
        return `{\n${body},\n${pad}}`;
    }
    return JSON.stringify(value);
}

/** Index just past the string/comment starting at `i` (or `i` when none). */
function skipTrivia(source: string, i: number): number {
    const ch = source[i];
    const next = source[i + 1];
    if (ch === '/' && next === '/') {
        while (i < source.length && source[i] !== '\n') i++;
        return i;
    }
    if (ch === '/' && next === '*') {
        i += 2;
        while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++;
        return i + 2;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
        const quote = ch;
        i++;
        while (i < source.length && source[i] !== quote) {
            if (source[i] === '\\') i++;
            i++;
        }
        return i + 1;
    }
    return i;
}

/** The index just past the `}`/`]` matching the opening bracket at `open`. */
export function matchBracket(source: string, open: number): number {
    const pairs: Record<string, string> = { '{': '}', '[': ']' };
    const close = pairs[source[open] as string];
    if (!close) return -1;
    let depth = 0;
    for (let i = open; i < source.length; i++) {
        const skipped = skipTrivia(source, i);
        if (skipped !== i) {
            i = skipped - 1;
            continue;
        }
        if (source[i] === source[open]) depth++;
        else if (source[i] === close) {
            depth--;
            if (depth === 0) return i + 1;
        }
    }
    return -1;
}

/** The `[valueStart, valueEnd)` range of a top-level `key:` inside an object. */
export function findTopLevelValue(
    source: string,
    open: number,
    close: number,
    key: string
): [number, number] | undefined {
    let depth = 1;
    for (let i = open + 1; i < close; i++) {
        const skipped = skipTrivia(source, i);
        if (skipped !== i) {
            i = skipped - 1;
            continue;
        }
        const ch = source[i] as string;
        if (ch === '{' || ch === '[') {
            depth++;
            continue;
        }
        if (ch === '}' || ch === ']') {
            depth--;
            continue;
        }
        if (depth === 1 && IDENT.test(ch)) {
            let end = i;
            while (end < close && /[\w$]/.test(source[end] as string)) end++;
            const word = source.slice(i, end);
            let colon = end;
            while (colon < close && /\s/.test(source[colon] as string)) colon++;
            if (word === key && source[colon] === ':') {
                let valueStart = colon + 1;
                while (valueStart < close && /\s/.test(source[valueStart] as string)) valueStart++;
                const openCh = source[valueStart] as string;
                if (openCh === '{' || openCh === '[') {
                    return [valueStart, matchBracket(source, valueStart)];
                }
                let valueEnd = valueStart;
                while (valueEnd < close && source[valueEnd] !== ',' && source[valueEnd] !== '}')
                    valueEnd++;
                // Drop trailing whitespace (the value may end at the object's `}`).
                while (valueEnd > valueStart && /\s/.test(source[valueEnd - 1] as string))
                    valueEnd--;
                return [valueStart, valueEnd];
            }
            i = end - 1;
        }
    }
    return undefined;
}

/**
 * Insert or replace `fmt`/`lint` inside an existing `vite.config.ts`, or render
 * a fresh one when none exists.
 */
export function mergeViteConfig(
    existing: string | undefined,
    sections: { fmt?: Json; lint?: Json }
): string {
    const props = Object.entries(sections).filter(([, value]) => value !== undefined) as [
        string,
        Json,
    ][];

    if (!existing) {
        const body = props
            .map(([key, value]) => `    ${key}: ${serializeTs(value, 1)},`)
            .join('\n');
        return `import { defineConfig } from 'vite-plus';\n\nexport default defineConfig({\n${body}\n});\n`;
    }

    let out = existing;
    const callMatch = out.match(/defineConfig\s*\(\s*\{/);
    if (!callMatch || callMatch.index === undefined) return out;
    for (const [key, value] of props) {
        const call = out.match(/defineConfig\s*\(\s*\{/);
        if (!call || call.index === undefined) break;
        const open = out.indexOf('{', call.index);
        const close = matchBracket(out, open);
        if (close === -1) break;
        const valueText = serializeTs(value, 1);
        const range = findTopLevelValue(out, open, close, key);
        if (range) out = `${out.slice(0, range[0])}${valueText}${out.slice(range[1])}`;
        else out = `${out.slice(0, open + 1)}\n    ${key}: ${valueText},${out.slice(open + 1)}`;
    }
    return out;
}

/** The merged `vite.config.ts` for `cwd` (path + content), without writing it. */
export function renderViteTarget(
    cwd: string,
    sections: { fmt?: Json; lint?: Json }
): MigrationFile {
    const file = path.join(cwd, 'vite.config.ts');
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : undefined;
    return { path: file, content: mergeViteConfig(existing, sections) };
}

/** Write the merged config to `<cwd>/vite.config.ts` and return its path. */
export function writeViteTarget(
    cwd: string,
    sections: { fmt?: Json; lint?: Json },
    write: boolean
): string {
    const out = renderViteTarget(cwd, sections);
    if (write) fs.writeFileSync(out.path, out.content, 'utf-8');
    return out.path;
}
