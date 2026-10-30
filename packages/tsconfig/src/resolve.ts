/**
 * Resolve a `tsconfig.json` into Vite/Vitest aliases plus its project paths and
 * references.
 *
 * `extends` is followed per field: a child can define `paths` while inheriting
 * `references` (or the other way around), and the nearest definition wins.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

import { mergeOverride } from './overrides.js';

/** A Vite/Vitest compatible alias entry. */
export interface TsconfigAlias {
    find: string | RegExp;
    replacement: string;
}

/** A resolved project reference. */
export interface TsconfigReference {
    /** Absolute path to the referenced tsconfig file. */
    path: string;
    [key: string]: unknown;
}

/** The result of {@link resolveTsconfig}. */
export interface ResolvedTsconfig {
    /** Vite/Vitest `resolve.alias` entries (absolute replacements). */
    alias: TsconfigAlias[];
    /** Resolved `compilerOptions.paths` (absolute targets). */
    paths: Record<string, string[]>;
    /** Resolved project references (absolute paths). */
    references: TsconfigReference[];
}

export interface ResolveTsconfigOptions {
    /** Explicit tsconfig file (relative to `cwd`/`root`, or absolute). */
    tsconfig?: string;
    /** Directory used to resolve a relative `tsconfig` and to detect the config. */
    cwd?: string;
    /** Repo/workspace root (default: `cwd`). Used to detect the default config. */
    root?: string;
    /** Follow `extends` (default true). */
    extends?: boolean;
    /** Deep-merged into the selected config before reading its fields. */
    overrides?: object;
}

export interface TsconfigJson {
    extends?: string | string[];
    compilerOptions?: {
        baseUrl?: string;
        paths?: Record<string, string[] | string>;
    };
    references?: { path: string; [key: string]: unknown }[];
}

interface LoadedTsconfig {
    file: string;
    dir: string;
    config: TsconfigJson;
}

function stripComments(input: string): string {
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i] as string;
        const next = input[i + 1];
        if (inString) {
            out += ch;
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            out += ch;
            continue;
        }
        if (ch === '/' && next === '/') {
            while (i < input.length && input[i] !== '\n') i++;
            out += '\n';
            continue;
        }
        if (ch === '/' && next === '*') {
            i += 2;
            while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i++;
            i++;
            continue;
        }
        out += ch;
    }
    return out;
}

function stripTrailingCommas(input: string): string {
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i] as string;
        if (inString) {
            out += ch;
            if (escaped) escaped = false;
            else if (ch === '\\') escaped = true;
            else if (ch === '"') inString = false;
            continue;
        }
        if (ch === '"') {
            inString = true;
            out += ch;
            continue;
        }
        if (ch === ',') {
            let j = i + 1;
            while (j < input.length && /\s/.test(input[j] as string)) j++;
            if (input[j] === '}' || input[j] === ']') continue;
        }
        out += ch;
    }
    return out;
}

/** Read a tsconfig file (JSONC: comments + trailing commas are allowed). */
export function readTsconfig(file: string): TsconfigJson {
    return parseTsconfig(fs.readFileSync(file, 'utf-8'));
}

/** Parse JSONC tsconfig text (comments, trailing commas and a BOM are allowed). */
export function parseTsconfig(text: string): TsconfigJson {
    return JSON.parse(
        stripTrailingCommas(stripComments(text.replace(/^\uFEFF/, '')))
    ) as TsconfigJson;
}

function isFile(file: string): boolean {
    try {
        return fs.statSync(file).isFile();
    } catch {
        return false;
    }
}

/** Resolve an `extends` specifier to a tsconfig file. */
function resolveExtends(specifier: string, fromDir: string): string | undefined {
    const require = createRequire(path.join(fromDir, '__dbx_tsconfig__.js'));
    const candidates: string[] = [];

    if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
        const base = path.resolve(fromDir, specifier);
        candidates.push(base, `${base}.json`, path.join(base, 'tsconfig.json'));
    } else {
        // Package specifiers (`@tsconfig/node22`, `@tsconfig/node22/tsconfig.json`).
        try {
            const main = require.resolve(specifier);
            if (main.endsWith('.json')) candidates.push(main);
        } catch {
            // Try the common subpath/JSON forms below.
        }
        for (const subpath of ['tsconfig.json', 'tsconfig.base.json']) {
            try {
                candidates.push(require.resolve(`${specifier}/${subpath}`));
            } catch {
                // not this one
            }
        }
        if (!specifier.endsWith('.json')) {
            try {
                candidates.push(require.resolve(`${specifier}.json`));
            } catch {
                // not this one
            }
        }
    }

    return candidates.find(isFile);
}

function extendsList(config: TsconfigJson): string[] {
    if (Array.isArray(config.extends)) return config.extends;
    return config.extends ? [config.extends] : [];
}

function loadChain(file: string, seen: Set<string>): LoadedTsconfig[] {
    const absolute = path.resolve(file);
    if (seen.has(absolute)) return [];
    seen.add(absolute);

    const config = readTsconfig(absolute);
    const dir = path.dirname(absolute);
    const chain: LoadedTsconfig[] = [{ file: absolute, dir, config }];

    // Later entries in an `extends` array override earlier ones, and the child
    // always wins, so load them in reverse precedence order.
    for (const specifier of [...extendsList(config)].reverse()) {
        const resolved = resolveExtends(specifier, dir);
        if (!resolved) {
            throw new Error(`Cannot resolve tsconfig "extends": "${specifier}" from ${absolute}`);
        }
        chain.push(...loadChain(resolved, seen));
    }
    return chain;
}

/** Find `<root>/tsconfig.json`, else the nearest one above `cwd`. */
function detectTsconfig(cwd: string, root: string): string {
    const rootFile = path.join(root, 'tsconfig.json');
    if (isFile(rootFile)) return rootFile;

    let dir = path.resolve(cwd);
    for (;;) {
        const candidate = path.join(dir, 'tsconfig.json');
        if (isFile(candidate)) return candidate;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    throw new Error(`No tsconfig.json found from ${cwd} (root: ${root})`);
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface AliasCandidate extends TsconfigAlias {
    score: number;
}

/** Convert one `paths` entry into a Vite-compatible alias. */
function pathToAlias(find: string, target: string): AliasCandidate {
    const star = find.indexOf('*');
    if (star === -1) {
        return {
            find,
            replacement: target,
            score: Number.POSITIVE_INFINITY,
        };
    }
    const before = find.slice(0, star);
    const after = find.slice(star + 1);
    const pattern = `^${escapeRegExp(before)}(.*)${escapeRegExp(after)}$`;
    return {
        find: new RegExp(pattern),
        replacement: target.replace(/\*/g, '$1'),
        score: before.length + 1,
    };
}

/**
 * Resolve a tsconfig's `paths` and `references`, following `extends` per field.
 */
export function resolveTsconfig(options: ResolveTsconfigOptions = {}): ResolvedTsconfig {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const root = path.resolve(options.root ?? cwd);
    const file = options.tsconfig
        ? path.resolve(root, options.tsconfig)
        : detectTsconfig(cwd, root);
    const followExtends = options.extends !== false;
    const chain = followExtends
        ? loadChain(file, new Set())
        : [{ file, dir: path.dirname(file), config: readTsconfig(file) }];
    if (options.overrides && chain[0]) {
        chain[0] = {
            ...chain[0],
            config: mergeOverride(chain[0].config, options.overrides),
        };
    }

    const pathsEntry = chain.find(entry => entry.config.compilerOptions?.paths !== undefined);
    const referencesEntry = chain.find(entry => entry.config.references !== undefined);
    const baseUrlEntry = chain.find(entry => entry.config.compilerOptions?.baseUrl !== undefined);

    const pathsBase = baseUrlEntry
        ? path.resolve(baseUrlEntry.dir, baseUrlEntry.config.compilerOptions?.baseUrl ?? '.')
        : (pathsEntry?.dir ?? path.dirname(file));

    const paths: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(pathsEntry?.config.compilerOptions?.paths ?? {})) {
        const targets = Array.isArray(value) ? value : [value];
        paths[key] = targets.map(target => path.resolve(pathsBase, target));
    }

    const references: TsconfigReference[] = (referencesEntry?.config.references ?? []).map(
        reference => ({
            ...reference,
            path: path.resolve(referencesEntry?.dir ?? path.dirname(file), reference.path),
        })
    );

    const alias = Object.entries(paths)
        .filter(([, targets]) => targets.length > 0)
        .map(([find, targets]) => pathToAlias(find, targets[0] as string))
        .sort((a, b) => b.score - a.score)
        .map(({ find, replacement }) => ({ find, replacement }));

    return { alias, paths, references };
}
