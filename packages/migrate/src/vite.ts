/**
 * `vite.config.*` -> `dbx.config.*` migration.
 *
 * Folds a hand-written root `vite.config.{ts,mts,js,mjs}` into
 * `dbx.config.*`'s `toolchain.vite`, so the whole Vite+ config lives in the one
 * hand-authored root config and `dbx sync` regenerates `vite.config.ts` from it.
 *
 * It is deliberately pragmatic: it extracts the object literal passed to
 * `defineConfig(...)` (or the default-exported object) with a string-aware
 * scanner and text-splices it into the nearest `dbx.config.*`. When the config
 * references imports, plugins or any non-literal expression it reports the file
 * as unmapped and changes nothing, rather than emitting broken output.
 */

import fs from 'node:fs';
import path from 'node:path';

import { CONFIG_FILE_NAMES } from '@deltabox/toolchain-shared';

import type {
    MigrationContext,
    MigrationFile,
    MigrationResult,
    ToolchainMigration,
    UnmappedItem,
} from './types.js';
import { findTopLevelValue, matchBracket } from './vite-target.js';

/** The root Vite config file names, in priority order. */
export const VITE_CONFIG_FILES = [
    'vite.config.ts',
    'vite.config.mts',
    'vite.config.js',
    'vite.config.mjs',
] as const;

/** The Vite config in `cwd`, if present. */
export function findViteConfig(cwd: string): string | undefined {
    for (const name of VITE_CONFIG_FILES) {
        const file = path.join(cwd, name);
        if (fs.existsSync(file)) return file;
    }
    return undefined;
}

/** The nearest `dbx.config.*` in `cwd`, if present. */
export function findDbxConfig(cwd: string): string | undefined {
    for (const name of CONFIG_FILE_NAMES) {
        const file = path.join(cwd, name);
        if (fs.existsSync(file)) return file;
    }
    return undefined;
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
    if (ch === '"' || ch === "'") {
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

/** The leading whitespace of the line that contains `index`. */
function lineIndentAt(source: string, index: number): string {
    const lineStart = source.lastIndexOf('\n', index - 1) + 1;
    return source.slice(lineStart).match(/^[ \t]*/)?.[0] ?? '';
}

/** Prefix every line after the first with `indent` (keeps the opening line). */
function indentBlock(text: string, indent: string): string {
    return text
        .split('\n')
        .map((line, index) => (index === 0 ? line : `${indent}${line}`))
        .join('\n');
}

/** The `{ ... }` range of the config root (its `defineConfig(...)` argument). */
function findRootObject(source: string): [number, number] | undefined {
    const call = source.match(/\bdefineConfig\s*\(/);
    let searchFrom = 0;
    if (call && call.index !== undefined) searchFrom = call.index + call[0].length;
    else {
        const exported = source.match(/export\s+default\s*/);
        if (!exported || exported.index === undefined) return undefined;
        searchFrom = exported.index + exported[0].length;
    }
    let open = searchFrom;
    while (open < source.length && source[open] !== '{') open++;
    if (open >= source.length) return undefined;
    const close = matchBracket(source, open);
    return close === -1 ? undefined : [open, close];
}

/**
 * Extract the object literal passed to `defineConfig(...)`, or the
 * default-exported object when there is no `defineConfig`.
 */
export function extractViteObject(source: string): { text: string } | { error: string } {
    const call = source.match(/\bdefineConfig\s*\(/);
    let start = -1;
    if (call && call.index !== undefined) start = call.index + call[0].length;
    else {
        const exported = source.match(/export\s+default\s*/);
        if (exported && exported.index !== undefined) start = exported.index + exported[0].length;
    }
    if (start === -1)
        return { error: 'no `defineConfig(...)` call or default-exported object found' };
    while (start < source.length && /\s/.test(source[start] as string)) start++;
    if (source[start] !== '{')
        return {
            error: 'the config value is not an object literal (it is a variable or an expression)',
        };
    const end = matchBracket(source, start);
    if (end === -1) return { error: 'unbalanced braces in the config object' };
    return { text: source.slice(start, end) };
}

/**
 * Whether `text` (an object literal, braces included) is made only of literals:
 * objects, arrays, strings, numbers, booleans, `null`/`undefined` and bare keys.
 * Any other identifier (a variable, import, plugin call), spread or template
 * literal makes it non-foldable.
 */
export function scanLiteralObject(text: string): { ok: true } | { ok: false; reason: string } {
    let i = 0;
    while (i < text.length) {
        const ch = text[i] as string;
        if (ch === '`') return { ok: false, reason: 'template literal' };
        const skipped = skipTrivia(text, i);
        if (skipped !== i) {
            i = skipped;
            continue;
        }
        if (ch === '.' && text[i + 1] === '.' && text[i + 2] === '.')
            return { ok: false, reason: 'spread (`...`)' };
        if (/[A-Za-z_$]/.test(ch)) {
            let end = i;
            while (end < text.length && /[\w$]/.test(text[end] as string)) end++;
            const word = text.slice(i, end);
            let j = end;
            while (j < text.length && /\s/.test(text[j] as string)) j++;
            const isKey = text[j] === ':';
            if (!isKey && !['true', 'false', 'null', 'undefined'].includes(word))
                return { ok: false, reason: `non-literal value \`${word}\`` };
            i = end;
            continue;
        }
        i++;
    }
    return { ok: true };
}

/**
 * Fold `objectText` into the `toolchain.vite` of a `dbx.config.*` source by
 * text-splicing (inserting or replacing the `vite` value), never rewriting the
 * whole file. Returns the new source, or an error when the `toolchain` object
 * cannot be located.
 */
export function foldViteIntoConfig(
    source: string,
    objectText: string
): { content: string } | { error: string } {
    const root = findRootObject(source);
    if (!root) return { error: 'could not locate the config root object' };
    const [rootOpen, rootClose] = root;

    const toolchain = findTopLevelValue(source, rootOpen, rootClose, 'toolchain');
    if (!toolchain)
        return {
            error: 'the config has no `toolchain` object to add `vite` to',
        };
    const [toolchainStart, toolchainEnd] = toolchain;

    const vite = findTopLevelValue(source, toolchainStart, toolchainEnd, 'vite');
    if (vite) {
        const [valueStart, valueEnd] = vite;
        const indent = lineIndentAt(source, valueStart);
        const text = indentBlock(objectText, indent);
        return { content: `${source.slice(0, valueStart)}${text}${source.slice(valueEnd)}` };
    }

    const indent = `${lineIndentAt(source, toolchainStart)}    `;
    const text = indentBlock(objectText, indent);
    return {
        content: `${source.slice(0, toolchainStart + 1)}\n${indent}vite: ${text},${source.slice(
            toolchainStart + 1
        )}`,
    };
}

/** Fold a hand-written root `vite.config.*` into `dbx.config.*`. */
export const viteToToolchain: ToolchainMigration = {
    id: 'vite-to-toolchain',
    from: 'vite',
    to: 'toolchain',
    description: 'Fold a hand-written root vite.config.* into dbx.config.* (`toolchain.vite`).',
    detect: cwd => Boolean(findViteConfig(cwd)),
    run: async (ctx: MigrationContext): Promise<MigrationResult> => {
        const viteFile = findViteConfig(ctx.cwd);
        if (!viteFile) throw new Error('vite-to-toolchain: no vite.config.* found.');

        const source = fs.readFileSync(viteFile, 'utf-8').replace(/^\uFEFF/, '');
        const notes = [`Source: ${path.basename(viteFile)}.`];
        const unmapped: UnmappedItem[] = [];
        const empty = (): MigrationResult => ({
            id: viteToToolchain.id,
            from: 'vite',
            to: 'toolchain',
            written: [],
            files: [],
            unmapped,
            notes,
        });

        const configFile = findDbxConfig(ctx.cwd);
        if (!configFile) {
            unmapped.push({
                source: path.basename(viteFile),
                reason: 'no dbx.config.* found to fold into',
            });
            notes.push('Create a dbx.config.* first, then re-run this migration.');
            return empty();
        }
        if (configFile.endsWith('.json')) {
            unmapped.push({
                source: path.basename(configFile),
                reason: 'JSON configs cannot hold the extracted object by text-splice',
            });
            notes.push('Fold into the JSON config by hand.');
            return empty();
        }

        const extracted = extractViteObject(source);
        if ('error' in extracted) {
            unmapped.push({ source: path.basename(viteFile), reason: extracted.error });
            notes.push('Left vite.config.* unchanged; fold it by hand.');
            return empty();
        }
        const literal = scanLiteralObject(extracted.text);
        if (!literal.ok) {
            unmapped.push({
                source: path.basename(viteFile),
                reason: `cannot fold faithfully (${literal.reason})`,
            });
            notes.push(
                'The config references helpers/imports or non-literal expressions; fold it by hand.'
            );
            return empty();
        }

        const configSource = fs.readFileSync(configFile, 'utf-8').replace(/^\uFEFF/, '');
        const folded = foldViteIntoConfig(configSource, extracted.text);
        if ('error' in folded) {
            unmapped.push({ source: path.basename(configFile), reason: folded.error });
            notes.push('Left dbx.config.* unchanged; fold `toolchain.vite` in by hand.');
            return empty();
        }

        const file: MigrationFile = { path: configFile, content: folded.content };
        if (ctx.write) fs.writeFileSync(configFile, file.content, 'utf-8');
        notes.push(
            `Folded into \`toolchain.vite\` (${path.basename(configFile)}); run \`dbx sync\` to regenerate vite.config.ts.`
        );
        return {
            id: viteToToolchain.id,
            from: 'vite',
            to: 'toolchain',
            written: [configFile],
            files: [file],
            notes,
        };
    },
};
