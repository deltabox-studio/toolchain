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
import {
    fetchRemoteTsconfig,
    getCachedRemoteTsconfig,
    isRemoteUrl,
    normalizeRemoteUrl,
    readRemoteTsconfig,
    remoteExtendsCandidates,
} from './remote.js';
import type {
    PrefetchTsconfigOptions,
    ResolvedTsconfig,
    ResolveTsconfigOptions,
    SerializedTsconfigAlias,
    TsconfigAlias,
    TsconfigFilePatterns,
    TsconfigJson,
    TsconfigReference,
} from './types/index.js';

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

/** Whether an `extends` specifier points at a remote URL. */
function isRemoteSpecifier(specifier: string): boolean {
    return isRemoteUrl(specifier);
}

/** Read a tsconfig (local or prefetched remote) with a useful failure message. */
function readConfig(file: string): TsconfigJson {
    if (isRemoteUrl(file)) return readRemoteTsconfig(file);
    try {
        return readTsconfig(file);
    } catch (error) {
        throw new Error(
            `Cannot parse tsconfig "${file}": ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/** Normalize a local path or remote URL to a chain key. */
function normalizeRef(file: string): string {
    return isRemoteUrl(file) ? normalizeRemoteUrl(file) : path.resolve(file);
}

/** The directory/base URL of a config reference. */
function refDir(ref: string): string {
    return isRemoteUrl(ref) ? normalizeRemoteUrl('.', ref) : path.dirname(ref);
}

/** Resolve a path/reference relative to a local directory or remote URL. */
function resolveRef(base: string, target: string): string {
    if (isRemoteUrl(target)) return normalizeRemoteUrl(target);
    if (isRemoteUrl(base)) return normalizeRemoteUrl(target, base);
    return path.resolve(base, target);
}

/** Render a resolved target relative to a local directory or remote URL. */
function relativeRef(base: string, absolute: string): string {
    if (isRemoteUrl(base)) {
        if (isRemoteUrl(absolute)) {
            const from = new URL(base);
            const to = new URL(absolute);
            if (from.origin === to.origin) {
                const relative = path.posix.relative(from.pathname, to.pathname) || './';
                return `${relative.startsWith('.') ? relative : `./${relative}`}${to.search}${to.hash}`;
            }
        }
        return absolute;
    }
    return path.relative(base, absolute).replace(/\\/g, '/');
}

/** The local candidates for an `extends` specifier. */
function localExtendsCandidates(specifier: string, fromDir: string): string[] {
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

    return candidates;
}

/** Resolve a local/package `extends` specifier to a file. */
function resolveLocalExtends(
    specifier: string,
    fromDir: string,
    assumeFiles?: ReadonlySet<string>
): string | undefined {
    return localExtendsCandidates(specifier, fromDir).find(
        candidate => assumeFiles?.has(path.resolve(candidate)) || isFile(candidate)
    );
}

/** Resolve a cached remote `extends` specifier, or its first candidate. */
function resolveRemoteExtends(specifier: string, fromUrl?: string): string {
    const candidates = remoteExtendsCandidates(specifier, fromUrl);
    return candidates.find(candidate => getCachedRemoteTsconfig(candidate)) ?? candidates[0]!;
}

/**
 * Resolve an `extends` specifier to a local file or remote URL. A remote config
 * resolves relative paths against its URL and bare package names against the
 * local config directory that introduced it.
 */
function resolveExtends(
    specifier: string,
    fromDir: string,
    assumeFiles?: ReadonlySet<string>,
    packageDir?: string
): string | undefined {
    if (isRemoteSpecifier(specifier)) return resolveRemoteExtends(specifier);
    if (isRemoteUrl(fromDir)) {
        if (specifier.startsWith('.') || specifier.startsWith('/')) {
            return resolveRemoteExtends(specifier, fromDir);
        }
        return packageDir ? resolveLocalExtends(specifier, packageDir, assumeFiles) : undefined;
    }
    return resolveLocalExtends(specifier, fromDir, assumeFiles);
}

function extendsList(config: TsconfigJson): string[] {
    if (Array.isArray(config.extends)) return config.extends;
    return config.extends ? [config.extends] : [];
}

function loadChain(
    file: string,
    seen: Set<string>,
    assumeFiles?: ReadonlySet<string>,
    packageDir?: string
): LoadedTsconfig[] {
    const absolute = normalizeRef(file);
    if (seen.has(absolute)) return [];
    seen.add(absolute);

    const config = readConfig(absolute);
    const dir = refDir(absolute);
    const nextPackageDir = isRemoteUrl(absolute) ? packageDir : dir;
    const chain: LoadedTsconfig[] = [{ file: absolute, dir, config }];

    // Later entries in an `extends` array override earlier ones, and the child
    // always wins, so load them in reverse precedence order.
    for (const specifier of [...extendsList(config)].reverse()) {
        const resolved = resolveExtends(specifier, dir, assumeFiles, nextPackageDir);
        if (!resolved) {
            throw new Error(`Cannot resolve tsconfig "extends": "${specifier}" from ${absolute}`);
        }
        const normalized = normalizeRef(resolved);
        if (assumeFiles?.has(normalized)) continue;
        chain.push(...loadChain(normalized, seen, assumeFiles, nextPackageDir));
    }
    return chain;
}

/**
 * Throw when `file` or any config in its `extends` chain is missing or cannot be
 * parsed. Remote configs must have been prefetched. A caller may pass files it
 * is about to generate (eg. a managed `tsconfig.json` a build config extends).
 */
export function assertTsconfigChain(
    file: string,
    options: { assumeFiles?: Iterable<string>; packageDir?: string } = {}
): void {
    const assumeFiles = new Set(
        [...(options.assumeFiles ?? [])].map(candidate => normalizeRef(candidate))
    );
    const absolute = normalizeRef(file);
    loadChain(
        absolute,
        new Set(),
        assumeFiles,
        options.packageDir ?? (isRemoteUrl(absolute) ? process.cwd() : path.dirname(absolute))
    );
}

/** Fetch one remote config candidate set, trying `.json`/directory fallbacks. */
async function fetchRemoteCandidate(candidates: string[]): Promise<{
    url: string;
    config: TsconfigJson;
}> {
    let lastError: unknown;
    for (const candidate of candidates) {
        const cached = getCachedRemoteTsconfig(candidate);
        if (cached) return { url: candidate, config: cached };
        try {
            return { url: candidate, config: await fetchRemoteTsconfig(candidate) };
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError instanceof Error
        ? lastError
        : new Error(`Cannot resolve remote tsconfig "${candidates[0] ?? ''}"`);
}

async function prefetchRemoteChain(
    specifier: string,
    fromUrl: string | undefined,
    packageDir: string,
    seenRemote: Set<string>,
    seenLocal: Set<string>,
    assumeFiles: ReadonlySet<string>
): Promise<void> {
    const candidates = remoteExtendsCandidates(specifier, fromUrl);
    const { url, config } = await fetchRemoteCandidate(candidates);
    if (seenRemote.has(url)) return;
    seenRemote.add(url);

    for (const nested of [...extendsList(config)].reverse()) {
        if (isRemoteSpecifier(nested)) {
            await prefetchRemoteChain(
                nested,
                undefined,
                packageDir,
                seenRemote,
                seenLocal,
                assumeFiles
            );
        } else if (nested.startsWith('.') || nested.startsWith('/')) {
            await prefetchRemoteChain(nested, url, packageDir, seenRemote, seenLocal, assumeFiles);
        } else {
            const resolved = resolveLocalExtends(nested, packageDir, assumeFiles);
            if (!resolved) {
                throw new Error(
                    `Cannot resolve tsconfig "extends": "${nested}" from ${url} (package specifiers in remote configs resolve from ${packageDir})`
                );
            }
            await prefetchLocalChain(resolved, packageDir, seenLocal, seenRemote, assumeFiles);
        }
    }
}

async function prefetchLocalChain(
    file: string,
    packageDir: string,
    seenLocal: Set<string>,
    seenRemote: Set<string>,
    assumeFiles: ReadonlySet<string>
): Promise<void> {
    const absolute = path.resolve(file);
    if (seenLocal.has(absolute)) return;
    seenLocal.add(absolute);

    const config = readConfig(absolute);
    for (const specifier of [...extendsList(config)].reverse()) {
        if (isRemoteSpecifier(specifier)) {
            await prefetchRemoteChain(
                specifier,
                undefined,
                packageDir,
                seenRemote,
                seenLocal,
                assumeFiles
            );
            continue;
        }
        const resolved = resolveLocalExtends(specifier, path.dirname(absolute), assumeFiles);
        if (!resolved) {
            throw new Error(`Cannot resolve tsconfig "extends": "${specifier}" from ${absolute}`);
        }
        if (assumeFiles.has(normalizeRef(resolved))) continue;
        await prefetchLocalChain(resolved, packageDir, seenLocal, seenRemote, assumeFiles);
    }
}

/**
 * Download every remote config reachable from `files` before sync resolution.
 * Remote relative `extends` paths are followed against their own URL.
 */
export async function prefetchTsconfigExtends(
    files: Iterable<string>,
    options: PrefetchTsconfigOptions = {}
): Promise<void> {
    const packageDir = path.resolve(options.packageDir ?? process.cwd());
    const assumeFiles = new Set(
        [...(options.assumeFiles ?? [])].map(candidate => normalizeRef(candidate))
    );
    const seenLocal = new Set<string>();
    const seenRemote = new Set<string>();
    for (const file of files) {
        if (isRemoteUrl(file)) {
            await prefetchRemoteChain(
                file,
                undefined,
                packageDir,
                seenRemote,
                seenLocal,
                assumeFiles
            );
        } else {
            await prefetchLocalChain(file, packageDir, seenLocal, seenRemote, assumeFiles);
        }
    }
}

/** Async {@link assertTsconfigChain} that prefetches remote configs first. */
export async function assertTsconfigChainAsync(
    file: string,
    options: { assumeFiles?: Iterable<string>; packageDir?: string } = {}
): Promise<void> {
    await prefetchTsconfigExtends([file], {
        ...(options.packageDir ? { packageDir: options.packageDir } : {}),
        ...(options.assumeFiles ? { assumeFiles: options.assumeFiles } : {}),
    });
    assertTsconfigChain(file, options);
}

/** Compiler options whose values are paths (meaningless from a remote tree). */
const REMOTE_PATH_OPTIONS = new Set([
    'baseUrl',
    'declarationDir',
    'outDir',
    'paths',
    'rootDir',
    'rootDirs',
    'tsBuildInfoFile',
]);

/**
 * Flatten a config chain that contains remote configs into a local-only object.
 * Remote compiler options are merged in, except path-valued options (which
 * describe the remote tree). Returns `undefined` when the chain has no remote
 * config, so callers can keep the live local `extends` chain.
 *
 * Callers use this only when the user opts into inlining a remote chain (see the
 * `flattenRemoteExtends` option); the generated config must still apply its own
 * settings on top so flattening never overrides them.
 */
export function flattenRemoteTsconfig(file: string): TsconfigJson | undefined {
    const absolute = normalizeRef(file);
    const chain = loadChain(
        absolute,
        new Set(),
        undefined,
        isRemoteUrl(absolute) ? process.cwd() : path.dirname(absolute)
    );
    if (!chain.some(entry => isRemoteUrl(entry.file))) return undefined;

    let merged: TsconfigJson = {};
    for (const entry of [...chain].reverse()) {
        const config = structuredClone(entry.config);
        delete config.extends;
        if (isRemoteUrl(entry.file)) {
            const options = config.compilerOptions ? { ...config.compilerOptions } : undefined;
            if (options) {
                for (const key of REMOTE_PATH_OPTIONS) {
                    delete (options as Record<string, unknown>)[key];
                }
            }
            merged = {
                ...merged,
                ...(options && Object.keys(options).length > 0
                    ? {
                          compilerOptions: mergeOverride(
                              merged.compilerOptions ?? {},
                              options as Record<string, unknown>
                          ),
                      }
                    : {}),
            };
        } else {
            merged = {
                ...merged,
                ...config,
                ...(config.compilerOptions
                    ? {
                          compilerOptions: mergeOverride(
                              merged.compilerOptions ?? {},
                              config.compilerOptions as Record<string, unknown>
                          ),
                      }
                    : {}),
            };
        }
    }
    if (merged.compilerOptions && Object.keys(merged.compilerOptions).length === 0) {
        delete merged.compilerOptions;
    }
    return merged;
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
    /** The original (normalized) `paths` key, used for the descending sort. */
    key: string;
}

/** Compare two path keys descending, so the longest/most specific comes first. */
function compareKeysDescending(a: string, b: string): number {
    return a < b ? 1 : a > b ? -1 : 0;
}

/** Convert one `paths` entry into a Vite-compatible alias. */
function pathToAlias(find: string, target: string, strict: boolean): AliasCandidate {
    const findStr = find.replace(/\\/g, '/');
    const targetStr = target.replace(/\\/g, '/');
    const asterisk = findStr.indexOf('*');
    if (asterisk === -1) {
        return {
            key: findStr,
            find: strict ? new RegExp(`^${escapeRegExp(findStr)}$`) : findStr,
            replacement: targetStr,
        };
    }
    // One capture group per `*`, each mapped to the matching `$n` in the target.
    const groups = findStr.split('*').length - 1;
    const pattern = `^${findStr.split('*').map(escapeRegExp).join('(.*)')}$`;
    let capture = 0;
    return {
        key: findStr,
        find: new RegExp(pattern),
        replacement: targetStr.replace(/\*/g, () => (capture < groups ? `$${++capture}` : '*')),
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
        const resolved = resolveExtends(specifier, dir, undefined, dir);
        if (!resolved) {
            throw new Error(`Cannot resolve tsconfig "extends": "${specifier}" from ${absolute}`);
        }
        chain.push(...loadChain(resolved, seen, undefined, dir));
    }
    return chain;
}

/** Resolve a loaded config chain into paths, references and Vite aliases. */
function resolveChain(
    chain: LoadedTsconfig[],
    file: string,
    relativePaths: boolean,
    strict: boolean
): ResolvedTsconfig {
    const pathsEntry = chain.find(entry => entry.config.compilerOptions?.paths !== undefined);
    const referencesEntry = chain.find(entry => entry.config.references !== undefined);
    const baseUrlEntry = chain.find(entry => entry.config.compilerOptions?.baseUrl !== undefined);

    const pathsBase = baseUrlEntry
        ? resolveRef(baseUrlEntry.dir, baseUrlEntry.config.compilerOptions?.baseUrl ?? '.')
        : (pathsEntry?.dir ?? refDir(file));

    // Longest/most specific keys first, so a shorter prefix never shadows a
    // longer entry (eg. `@acme/core` before `@acme`).
    const pathEntries = Object.entries(pathsEntry?.config.compilerOptions?.paths ?? {}).sort(
        ([a], [b]) => compareKeysDescending(a, b)
    );
    const paths: Record<string, string[]> = {};
    for (const [key, value] of pathEntries) {
        const targets = (Array.isArray(value) ? value : [value]) as string[];
        paths[key] = targets.map(target => {
            const absolute = resolveRef(pathsBase, target);
            return relativePaths ? relativeRef(pathsBase, absolute) : absolute;
        });
    }

    const references: TsconfigReference[] = (referencesEntry?.config.references ?? []).map(
        reference => {
            const dirBase = referencesEntry?.dir ?? refDir(file);
            const absolute = resolveRef(dirBase, reference.path);
            return {
                ...reference,
                path: relativePaths ? relativeRef(dirBase, absolute) : absolute,
            };
        }
    );

    const alias = Object.entries(paths)
        .filter(([, targets]) => targets.length > 0)
        .map(([find, targets]) => pathToAlias(find, targets[0] as string, strict))
        .sort((a, b) => compareKeysDescending(a.key, b.key))
        .map(({ find, replacement }) => ({ find, replacement }));

    return { alias, paths, references, relativePaths, strict };
}

/**
 * Resolve an in-memory tsconfig object (eg. the auto-generated workspaces config)
 * exactly like {@link resolveTsconfig}, but without requiring it to be on disk.
 */
export function resolveTsconfigConfig(
    config: TsconfigJson,
    dir: string,
    options: Pick<ResolveTsconfigOptions, 'extends' | 'overrides' | 'relativePaths' | 'strict'> = {}
): ResolvedTsconfig {
    const file = path.join(path.resolve(dir), 'tsconfig.json');
    const chain = loadConfigChain(config, file, options.extends !== false, new Set());
    if (options.overrides && chain[0]) {
        chain[0] = {
            ...chain[0],
            config: mergeOverride(chain[0].config, options.overrides),
        };
    }
    return resolveChain(chain, file, !!options.relativePaths, options.strict !== false);
}

/**
 * The nearest `compilerOptions.rootDir`/`baseUrl` in a tsconfig's `extends`
 * chain, resolved to an absolute path. Used by auto alias wiring to infer the
 * workspace source directory.
 */
export function resolveTsconfigCompilerOption(
    file: string,
    key: 'rootDir' | 'baseUrl' | 'outDir'
): string | undefined {
    if (!isRemoteUrl(file) && !isFile(file)) return undefined;
    const absolute = normalizeRef(file);
    const chain = loadChain(
        absolute,
        new Set(),
        undefined,
        isRemoteUrl(absolute) ? process.cwd() : path.dirname(absolute)
    );
    // Remote `rootDir`/`baseUrl` describes the remote tree, not the local
    // workspace; only local entries can infer the local source directory.
    const entry = chain.find(candidate => {
        if (isRemoteUrl(candidate.file)) return false;
        const value = candidate.config.compilerOptions?.[key];
        return typeof value === 'string' && value.length > 0;
    });
    if (!entry) return undefined;
    return resolveRef(entry.dir, entry.config.compilerOptions?.[key] as string);
}

/**
 * Resolve a tsconfig's effective `include` / `exclude` patterns through its
 * `extends` chain. A config that cannot be loaded falls back to its own
 * (shallow) patterns so generation never fails on a broken inherited config.
 */
export function resolveTsconfigFilePatterns(file: string): TsconfigFilePatterns {
    const absolute = normalizeRef(file);
    let chain: LoadedTsconfig[];
    try {
        chain = loadChain(
            absolute,
            new Set(),
            undefined,
            isRemoteUrl(absolute) ? process.cwd() : path.dirname(absolute)
        );
    } catch {
        chain = [{ file: absolute, dir: refDir(absolute), config: readConfig(absolute) }];
    }
    const stringArray = (value: unknown): string[] | undefined =>
        Array.isArray(value)
            ? value.filter((item): item is string => typeof item === 'string')
            : undefined;
    // Remote `include`/`exclude` patterns are relative to the remote tree;
    // hoisting them into a local generated config would point at the wrong
    // directory, so only local entries participate.
    const localChain = chain.filter(entry => !isRemoteUrl(entry.file));
    const includeEntry = localChain.find(entry => stringArray(entry.config.include) !== undefined);
    const excludeEntry = localChain.find(entry => stringArray(entry.config.exclude) !== undefined);
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
        ? isRemoteUrl(options.tsconfig)
            ? normalizeRemoteUrl(options.tsconfig)
            : path.resolve(root, options.tsconfig)
        : detectTsconfig(cwd, root);
    const followExtends = options.extends !== false;
    const packageDir = isRemoteUrl(file) ? cwd : path.dirname(file);
    const chain = followExtends
        ? loadChain(file, new Set(), undefined, packageDir)
        : [{ file, dir: refDir(file), config: readConfig(file) }];
    if (options.overrides && chain[0]) {
        chain[0] = {
            ...chain[0],
            config: mergeOverride(chain[0].config, options.overrides),
        };
    }
    return resolveChain(chain, file, !!options.relativePaths, options.strict !== false);
}

/**
 * Async {@link resolveTsconfig} that prefetches remote `extends` chains first.
 * Use this (or {@link prefetchTsconfigExtends}) whenever a config may extend an
 * `http(s)` URL.
 */
export async function resolveTsconfigAsync(
    options: ResolveTsconfigOptions = {}
): Promise<ResolvedTsconfig> {
    if (options.extends === false) return resolveTsconfig(options);
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const root = path.resolve(options.root ?? cwd);
    const file = options.tsconfig
        ? isRemoteUrl(options.tsconfig)
            ? normalizeRemoteUrl(options.tsconfig)
            : path.resolve(root, options.tsconfig)
        : detectTsconfig(cwd, root);
    await prefetchTsconfigExtends([file], {
        packageDir: isRemoteUrl(file) ? cwd : path.dirname(file),
    });
    return resolveTsconfig(options);
}
