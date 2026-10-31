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

/** Remove `indent` from the start of every line after the first (inverse of {@link indentBlock}). */
function dedentBlock(text: string, indent: string): string {
    if (!indent) return text;
    return text
        .split('\n')
        .map((line, index) =>
            index > 0 && line.startsWith(indent) ? line.slice(indent.length) : line
        )
        .join('\n');
}

/** The top-level keys of an object literal (bare identifiers only). */
function topLevelKeys(source: string, open: number, close: number): string[] {
    const keys: string[] = [];
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
        if (depth === 1 && /[A-Za-z_$]/.test(ch)) {
            let end = i;
            while (end < close && /[\w$]/.test(source[end] as string)) end++;
            let colon = end;
            while (colon < close && /\s/.test(source[colon] as string)) colon++;
            if (colon < close && source[colon] === ':') keys.push(source.slice(i, end));
            i = end - 1;
        }
    }
    return keys;
}

/** Append `key: value,` entries before an object literal's closing brace. */
function appendEntries(objectText: string, entries: { key: string; value: string }[]): string {
    const open = objectText.indexOf('{');
    const close = open === -1 ? -1 : matchBracket(objectText, open);
    if (open === -1 || close === -1) return objectText;
    const closeBrace = close - 1;
    const before = objectText.slice(0, closeBrace);
    const after = objectText.slice(closeBrace);
    const trimmed = before.replace(/\s+$/, '');
    const closingIndent = lineIndentAt(objectText, closeBrace);
    const firstKey = topLevelKeys(objectText, open, close)[0];
    const firstValue =
        firstKey !== undefined ? findTopLevelValue(objectText, open, close, firstKey) : undefined;
    const multiline = before.includes('\n');
    const indent =
        multiline && firstValue ? lineIndentAt(objectText, firstValue[0]) : `${closingIndent}    `;
    const comma = trimmed.endsWith('{') || trimmed.endsWith(',') ? '' : ',';
    const body = entries.map(({ key, value }) => `\n${indent}${key}: ${value},`).join('');
    return `${trimmed}${comma}${body}\n${closingIndent}${after}`;
}

/**
 * Deep-merge two object-literal texts: nested objects are merged recursively and
 * every other value (arrays included) from `incoming` replaces the base's.
 *
 * Used when folding a hand-written `vite.config.*` into an existing
 * `toolchain.vite`, so the settings already there are kept instead of replaced.
 */
export function mergeViteObjects(base: string, incoming: string): string {
    const baseOpen = base.indexOf('{');
    const incomingOpen = incoming.indexOf('{');
    const baseClose = baseOpen === -1 ? -1 : matchBracket(base, baseOpen);
    const incomingClose = incomingOpen === -1 ? -1 : matchBracket(incoming, incomingOpen);
    if (baseOpen === -1 || baseClose === -1 || incomingOpen === -1 || incomingClose === -1)
        return incoming;

    const replacements: { start: number; end: number; text: string }[] = [];
    const added: { key: string; value: string }[] = [];

    for (const key of topLevelKeys(incoming, incomingOpen, incomingClose)) {
        const incomingValue = findTopLevelValue(incoming, incomingOpen, incomingClose, key);
        if (!incomingValue) continue;
        const valueText = incoming.slice(incomingValue[0], incomingValue[1]);
        const baseValue = findTopLevelValue(base, baseOpen, baseClose, key);
        if (baseValue) {
            const baseText = base.slice(baseValue[0], baseValue[1]);
            const merged =
                baseText.trimStart().startsWith('{') && valueText.trimStart().startsWith('{')
                    ? mergeViteObjects(baseText, valueText)
                    : valueText;
            replacements.push({ start: baseValue[0], end: baseValue[1], text: merged });
        } else {
            added.push({ key, value: valueText });
        }
    }

    let out = base;
    for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
        out = `${out.slice(0, replacement.start)}${replacement.text}${out.slice(replacement.end)}`;
    }
    return added.length > 0 ? appendEntries(out, added) : out;
}

/**
 * Force `config: true` in a folded `toolchain.vite` object. An existing
 * `config: false` means "leave my hand-written vite.config alone", but the
 * migration removes that file, so the shim must be managed again.
 */
function enableViteConfig(objectText: string): string {
    const open = objectText.indexOf('{');
    const close = open === -1 ? -1 : matchBracket(objectText, open);
    if (open === -1 || close === -1) return objectText;
    const range = findTopLevelValue(objectText, open, close, 'config');
    if (!range) return objectText;
    if (objectText.slice(range[0], range[1]).trim() !== 'false') return objectText;
    return `${objectText.slice(0, range[0])}true${objectText.slice(range[1])}`;
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
 * text-splicing (inserting the `vite` key, or deep-merging into an existing
 * object), never rewriting the whole file. Returns the new source, or an error
 * when the `toolchain` object cannot be located.
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
        // Deep-merge into an existing object literal (keeping its settings);
        // anything else is replaced by the folded object.
        const existing = dedentBlock(source.slice(valueStart, valueEnd), indent);
        const merged =
            existing.trimStart().startsWith('{') && objectText.trimStart().startsWith('{')
                ? mergeViteObjects(existing, objectText)
                : objectText;
        const text = indentBlock(enableViteConfig(merged), indent);
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

/**
 * Fold an object literal into a top-level `toolchain.<section>` (or deep-merge
 * into the existing object), without the Vite-specific `config: true` rewrite.
 */
export function foldToolchainSection(
    source: string,
    section: string,
    objectText: string
): { content: string } | { error: string } {
    const root = findRootObject(source);
    if (!root) return { error: 'could not locate the config root object' };
    const [rootOpen, rootClose] = root;
    const toolchain = findTopLevelValue(source, rootOpen, rootClose, 'toolchain');
    if (!toolchain) {
        return { error: `the config has no \`toolchain\` object to add \`${section}\` to` };
    }
    const [toolchainStart, toolchainEnd] = toolchain;
    const existing = findTopLevelValue(source, toolchainStart, toolchainEnd, section);
    if (existing) {
        const [valueStart, valueEnd] = existing;
        const indent = lineIndentAt(source, valueStart);
        const current = dedentBlock(source.slice(valueStart, valueEnd), indent);
        const merged =
            current.trimStart().startsWith('{') && objectText.trimStart().startsWith('{')
                ? mergeViteObjects(current, objectText)
                : objectText;
        return {
            content: `${source.slice(0, valueStart)}${indentBlock(merged, indent)}${source.slice(valueEnd)}`,
        };
    }
    const indent = `${lineIndentAt(source, toolchainStart)}    `;
    return {
        content: `${source.slice(0, toolchainStart + 1)}\n${indent}${section}: ${indentBlock(
            objectText,
            indent
        )},${source.slice(toolchainStart + 1)}`,
    };
}

/** Render a fresh `dbx.config.ts` with one or more folded toolchain sections. */
export function renderFreshSectionsConfig(sections: { key: string; objectText: string }[]): string {
    const body = sections
        .map(({ key, objectText }) => `        ${key}: ${indentBlock(objectText, '        ')},`)
        .join('\n');
    return [
        "import { defineConfig } from '@deltabox/toolchain';",
        '',
        'export default defineConfig({',
        '    toolchain: {',
        body,
        '    },',
        '});',
        '',
    ].join('\n');
}

/** The root file the generated shim lives in; excluded from Oxfmt via `fmt`. */
const VITE_CONFIG_IGNORE = '/vite.config.ts';

/** Whether `source` is the managed `vite.config.ts` shim (already migrated). */
function isManagedShim(source: string): boolean {
    // The shim calls `resolveVite(...)` (possibly with a generic type argument).
    return (
        /resolveVite\s*(?:<[^>]*>)?\s*\(/.test(source) &&
        source.includes('@deltabox/toolchain/vite')
    );
}

/**
 * Render a fresh `dbx.config.ts` holding the folded Vite object, for a project
 * that has a hand-written `vite.config.*` but no `dbx.config.*` yet. Like the
 * scaffold, it wraps the config in `defineConfig` from `@deltabox/toolchain` (a
 * workspace resolves it through the root's installed dependency).
 */
function renderFreshConfig(objectText: string): string {
    const text = indentBlock(objectText, '        ');
    return [
        "import { defineConfig } from '@deltabox/toolchain';",
        '',
        'export default defineConfig({',
        '    toolchain: {',
        `        vite: ${text},`,
        '    },',
        '});',
        '',
    ].join('\n');
}

/**
 * Ensure `fmt.ignorePatterns` contains `'/vite.config.ts'` in a folded Vite
 * object literal, so Oxfmt does not reformat the generated root `vite.config.ts`
 * shim (which would make `dbx sync --check` drift). Works on the object text
 * (braces included) with the same balanced scanner used to fold it in.
 */
export function ensureViteFmtIgnore(objectText: string): string {
    const open = objectText.indexOf('{');
    if (open === -1) return objectText;
    const close = matchBracket(objectText, open);
    if (close === -1) return objectText;
    const entry = `'${VITE_CONFIG_IGNORE}'`;

    const fmt = findTopLevelValue(objectText, open, close, 'fmt');
    if (fmt && objectText[fmt[0]] === '{' && objectText[fmt[1] - 1] === '}') {
        const [fmtStart, fmtEnd] = fmt;
        const ignore = findTopLevelValue(objectText, fmtStart, fmtEnd, 'ignorePatterns');
        if (ignore) {
            const [ipStart, ipEnd] = ignore;
            if (objectText.slice(ipStart, ipEnd).includes(VITE_CONFIG_IGNORE)) return objectText;
            if (objectText[ipStart] === '[') {
                return `${objectText.slice(0, ipStart + 1)}${entry}, ${objectText.slice(ipStart + 1)}`;
            }
            return `${objectText.slice(0, ipStart)}[${entry}]${objectText.slice(ipEnd)}`;
        }
        return `${objectText.slice(0, fmtStart + 1)} ignorePatterns: [${entry}],${objectText.slice(fmtStart + 1)}`;
    }
    if (fmt) {
        return `${objectText.slice(0, fmt[0])}{ ignorePatterns: [${entry}] }${objectText.slice(fmt[1])}`;
    }
    return `${objectText.slice(0, open + 1)} fmt: { ignorePatterns: [${entry}] },${objectText.slice(open + 1)}`;
}

/** Fold a hand-written root `vite.config.*` into `dbx.config.*`. */
export const viteToToolchain: ToolchainMigration = {
    id: 'vite-to-toolchain',
    from: 'vite',
    to: 'toolchain',
    description: 'Fold a hand-written vite.config.* into dbx.config.* (`toolchain.vite`).',
    detect: cwd => {
        const file = findViteConfig(cwd);
        if (!file) return false;
        try {
            // An already-managed shim (`defineConfig(resolveVite())`) is not a
            // hand-written config to fold.
            return !isManagedShim(fs.readFileSync(file, 'utf-8'));
        } catch {
            return true;
        }
    },
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

        if (isManagedShim(source)) {
            notes.push('Already managed by `dbx sync`; nothing to fold.');
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

        const objectText = ensureViteFmtIgnore(extracted.text);
        const tail = `added \`${VITE_CONFIG_IGNORE}\` to \`fmt.ignorePatterns\`; run \`dbx sync\` to regenerate vite.config.ts.`;
        const configFile = findDbxConfig(ctx.cwd);

        // The hand-written `vite.config.*` is now redundant (managed by
        // `dbx sync`); remove it unless `ignoreViteConfigFile` was set.
        const cleanupSource = (): string[] => {
            if (ctx.ignoreViteConfigFile) {
                notes.push(`Kept \`${path.basename(viteFile)}\` (ignoreViteConfigFile).`);
                return [];
            }
            if (ctx.write) fs.rmSync(viteFile, { force: true });
            notes.push(`Removed \`${path.basename(viteFile)}\` (recreated by \`dbx sync\`).`);
            return [viteFile];
        };

        if (configFile && configFile.endsWith('.json')) {
            unmapped.push({
                source: path.basename(configFile),
                reason: 'JSON configs cannot hold the extracted object by text-splice',
            });
            notes.push('Fold into the JSON config by hand.');
            return empty();
        }

        // No config yet: create one (eg. a workspace that only had vite.config.*).
        if (!configFile) {
            const target = path.join(ctx.cwd, 'dbx.config.ts');
            const file: MigrationFile = { path: target, content: renderFreshConfig(objectText) };
            if (ctx.write) fs.writeFileSync(target, file.content, 'utf-8');
            const removed = cleanupSource();
            notes.push(
                `Created \`${path.basename(target)}\` with the folded \`toolchain.vite\`; ${tail}`
            );
            return {
                id: viteToToolchain.id,
                from: 'vite',
                to: 'toolchain',
                written: [target],
                removed,
                files: [file],
                notes,
            };
        }

        const configSource = fs.readFileSync(configFile, 'utf-8').replace(/^\uFEFF/, '');
        const folded = foldViteIntoConfig(configSource, objectText);
        if ('error' in folded) {
            unmapped.push({ source: path.basename(configFile), reason: folded.error });
            notes.push('Left dbx.config.* unchanged; fold `toolchain.vite` in by hand.');
            return empty();
        }

        const file: MigrationFile = { path: configFile, content: folded.content };
        if (ctx.write) fs.writeFileSync(configFile, file.content, 'utf-8');
        const removed = cleanupSource();
        notes.push(`Folded into \`toolchain.vite\` (${path.basename(configFile)}); ${tail}`);
        return {
            id: viteToToolchain.id,
            from: 'vite',
            to: 'toolchain',
            written: [configFile],
            removed,
            files: [file],
            notes,
        };
    },
};
