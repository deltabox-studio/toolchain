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

/** A `RegExp` in its JSON-safe form. */
export interface TsconfigAliasPattern {
    /** The regular-expression source (without the surrounding slashes). */
    source: string;
    /** The regular-expression flags (usually empty). */
    flags: string;
}

/** A {@link TsconfigAlias} in its JSON-safe form. */
export interface SerializedTsconfigAlias {
    /** A literal prefix, or a `RegExp` split into `{ source, flags }`. */
    find: string | TsconfigAliasPattern;
    replacement: string;
}

/** A resolved project reference. */
export interface TsconfigReference {
    /** Path to the referenced tsconfig (absolute unless `relativePaths` is true). */
    path: string;
    [key: string & {}]: unknown;
}

/** The result of {@link resolveTsconfig}. */
export interface ResolvedTsconfig {
    /** Vite/Vitest `resolve.alias` entries (absolute replacements unless `relativePaths` is true). */
    alias: TsconfigAlias[];
    /** Resolved `compilerOptions.paths` (absolute targets unless `relativePaths` is true). */
    paths: Record<string, string[]>;
    /** Resolved project references (absolute paths unless `relativePaths` is true). */
    references: TsconfigReference[];
    /** Whether the returned paths are relative. */
    relativePaths: boolean;
}

export interface ResolveTsconfigOptions {
    /** Explicit tsconfig file (relative to `cwd`/`root`, or absolute). */
    tsconfig?: string;
    /** Directory used to resolve a relative `tsconfig` and to detect the config. */
    cwd?: string;
    /** Repo/workspace root (default: `cwd`). Used to detect the default config. */
    root?: string;
    /**
     * Return relative paths instead of absolute paths (default false). Paths are
     * relative to the config that defines them (its `baseUrl` for `paths`, its
     * directory for `references`), matching how TypeScript resolves them.
     */
    relativePaths?: boolean;
    /** Follow `extends` (default true). */
    extends?: boolean;
    /** Deep-merged into the selected config before reading its fields. */
    overrides?: object;
}

export interface TsconfigJson {
    extends?: string | string[];
    /** Files/globs the config includes (inherited through `extends`). */
    include?: string[];
    /** Files/globs the config excludes (inherited through `extends`). */
    exclude?: string[];
    /** Explicit file list (inherited through `extends`). */
    files?: string[];
    compilerOptions?: {
        baseUrl?: string;
        rootDir?: string;
        paths?: Record<string, string[]>;
    };
    references?: { path: string; [key: string & {}]: unknown }[];
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
    const findStr = find.replace(/\\/g, '/');
    const targetStr = target.replace(/\\/g, '/');
    const asterisk = findStr.indexOf('*');
    if (asterisk === -1) {
        return {
            find: findStr,
            replacement: targetStr,
            score: Number.POSITIVE_INFINITY,
        };
    }
    // One capture group per `*`, each mapped to the matching `$n` in the target.
    const groups = findStr.split('*').length - 1;
    const pattern = `^${findStr.split('*').map(escapeRegExp).join('(.*)')}$`;
    let capture = 0;
    return {
        find: new RegExp(pattern),
        replacement: targetStr.replace(/\*/g, () => (capture < groups ? `$${++capture}` : '*')),
        score: asterisk + 1,
    };
}

/**
 * Convert a resolved alias into JSON-safe form: a string `find` stays a string,
 * a `RegExp` becomes `{ source, flags }` so `JSON.stringify` (CLI `--json`, the
 * VS Code extension, MCP) keeps the pattern instead of emitting `{}`.
 */
export function serializeTsconfigAlias(alias: TsconfigAlias): SerializedTsconfigAlias {
    const { find, replacement } = alias;
    return typeof find === 'string'
        ? { find, replacement }
        : { find: { source: find.source, flags: find.flags }, replacement };
}

/** Rebuild a Vite-compatible alias from {@link serializeTsconfigAlias}'s output. */
export function deserializeTsconfigAlias(alias: SerializedTsconfigAlias): TsconfigAlias {
    const { find, replacement } = alias;
    return typeof find === 'string'
        ? { find, replacement }
        : { find: new RegExp(find.source, find.flags), replacement };
}

/** Convert a whole resolved tsconfig into JSON-safe form (aliases only differ). */
export function serializeResolvedTsconfig(
    resolved: ResolvedTsconfig
): Omit<ResolvedTsconfig, 'alias'> & { alias: SerializedTsconfigAlias[] } {
    return { ...resolved, alias: resolved.alias.map(serializeTsconfigAlias) };
}

/** Build a chain from an in-memory config, following its `extends`. */
function loadConfigChain(
    config: TsconfigJson,
    file: string,
    followExtends: boolean,
    seen: Set<string>
): LoadedTsconfig[] {
    const absolute = path.resolve(file);
    const dir = path.dirname(absolute);
    const chain: LoadedTsconfig[] = [{ file: absolute, dir, config }];
    if (!followExtends) return chain;
    seen.add(absolute);
    for (const specifier of [...extendsList(config)].reverse()) {
        const resolved = resolveExtends(specifier, dir);
        if (!resolved) {
            throw new Error(`Cannot resolve tsconfig "extends": "${specifier}" from ${absolute}`);
        }
        chain.push(...loadChain(resolved, seen));
    }
    return chain;
}

/** Resolve a loaded config chain into paths, references and Vite aliases. */
function resolveChain(
    chain: LoadedTsconfig[],
    file: string,
    relativePaths: boolean
): ResolvedTsconfig {
    const pathsEntry = chain.find(entry => entry.config.compilerOptions?.paths !== undefined);
    const referencesEntry = chain.find(entry => entry.config.references !== undefined);
    const baseUrlEntry = chain.find(entry => entry.config.compilerOptions?.baseUrl !== undefined);

    const pathsBase = baseUrlEntry
        ? path.resolve(baseUrlEntry.dir, baseUrlEntry.config.compilerOptions?.baseUrl ?? '.')
        : (pathsEntry?.dir ?? path.dirname(file));

    const paths: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(pathsEntry?.config.compilerOptions?.paths ?? {})) {
        const targets = (Array.isArray(value) ? value : [value]) as string[];
        paths[key] = targets.map(target => {
            const absolute = path.resolve(pathsBase, target);
            return relativePaths
                ? path.relative(pathsBase, absolute).replace(/\\/g, '/')
                : absolute;
        });
    }

    const references: TsconfigReference[] = (referencesEntry?.config.references ?? []).map(
        reference => {
            const dirBase = referencesEntry?.dir ?? path.dirname(file);
            const absolute = path.resolve(dirBase, reference.path);
            return {
                ...reference,
                path: relativePaths
                    ? path.relative(dirBase, absolute).replace(/\\/g, '/')
                    : absolute,
            };
        }
    );

    const alias = Object.entries(paths)
        .filter(([, targets]) => targets.length > 0)
        .map(([find, targets]) => pathToAlias(find, targets[0] as string))
        .sort((a, b) => b.score - a.score)
        .map(({ find, replacement }) => ({ find, replacement }));

    return { alias, paths, references, relativePaths };
}

/**
 * Resolve an in-memory tsconfig object (eg. the auto-generated workspaces config)
 * exactly like {@link resolveTsconfig}, but without requiring it to be on disk.
 */
export function resolveTsconfigConfig(
    config: TsconfigJson,
    dir: string,
    options: Pick<ResolveTsconfigOptions, 'extends' | 'overrides' | 'relativePaths'> = {}
): ResolvedTsconfig {
    const file = path.join(path.resolve(dir), 'tsconfig.json');
    const chain = loadConfigChain(config, file, options.extends !== false, new Set());
    if (options.overrides && chain[0]) {
        chain[0] = {
            ...chain[0],
            config: mergeOverride(chain[0].config, options.overrides),
        };
    }
    return resolveChain(chain, file, !!options.relativePaths);
}

/**
 * The nearest `compilerOptions.rootDir`/`baseUrl` in a tsconfig's `extends`
 * chain, resolved to an absolute path. Used by auto alias wiring to infer the
 * workspace source directory.
 */
export function resolveTsconfigCompilerOption(
    file: string,
    key: 'rootDir' | 'baseUrl'
): string | undefined {
    if (!isFile(file)) return undefined;
    const chain = loadChain(path.resolve(file), new Set());
    const entry = chain.find(candidate => {
        const value = candidate.config.compilerOptions?.[key];
        return typeof value === 'string' && value.length > 0;
    });
    if (!entry) return undefined;
    return path.resolve(entry.dir, entry.config.compilerOptions?.[key] as string);
}

/**
 * The `include` / `exclude` patterns a tsconfig effectively uses, following
 * `extends` (the nearest definition wins, the same way TypeScript resolves
 * them). Each pattern is relative to the config file that defined it, so
 * {@link includeDir} / {@link excludeDir} tell callers how to rebase them.
 */
export interface TsconfigFilePatterns {
    include?: string[];
    exclude?: string[];
    /** Directory the `include` patterns are relative to. */
    includeDir?: string;
    /** Directory the `exclude` patterns are relative to. */
    excludeDir?: string;
}

/**
 * Resolve a tsconfig's effective `include` / `exclude` patterns through its
 * `extends` chain. A config that cannot be loaded falls back to its own
 * (shallow) patterns so generation never fails on a broken inherited config.
 */
export function resolveTsconfigFilePatterns(file: string): TsconfigFilePatterns {
    let chain: LoadedTsconfig[];
    try {
        chain = loadChain(path.resolve(file), new Set());
    } catch {
        const absolute = path.resolve(file);
        chain = [{ file: absolute, dir: path.dirname(absolute), config: readTsconfig(absolute) }];
    }
    const stringArray = (value: unknown): string[] | undefined =>
        Array.isArray(value)
            ? value.filter((item): item is string => typeof item === 'string')
            : undefined;
    const includeEntry = chain.find(entry => stringArray(entry.config.include) !== undefined);
    const excludeEntry = chain.find(entry => stringArray(entry.config.exclude) !== undefined);
    const include = includeEntry ? stringArray(includeEntry.config.include) : undefined;
    const exclude = excludeEntry ? stringArray(excludeEntry.config.exclude) : undefined;
    return {
        ...(include ? { include, includeDir: includeEntry!.dir } : {}),
        ...(exclude ? { exclude, excludeDir: excludeEntry!.dir } : {}),
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
    return resolveChain(chain, file, !!options.relativePaths);
}
