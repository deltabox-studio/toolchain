/**
 * Resolve a `tsconfig.json` into Vite/Vitest aliases plus its project paths and
 * references.
 *
 * `extends` is followed per field: a child can define `paths` while inheriting
 * `references` (or the other way around), and the nearest definition wins.
 */

import path from 'node:path';

import { mergeOverride } from '../overrides.js';
import { isRemoteUrl, normalizeRemoteUrl } from '../remote.js';
import type {
    ResolvedTsconfig,
    ResolveTsconfigOptions,
    TsconfigAlias,
    TsconfigFilePatterns,
    TsconfigJson,
    TsconfigReference,
} from '../types/index.js';
import {
    extendsList,
    loadChain,
    normalizeRef,
    refDir,
    relativeRef,
    resolveExtends,
    resolveRef,
} from './extends.js';
import { isFile, readConfig } from './read.js';
import { prefetchTsconfigExtends } from './remote.js';
import type { LoadedTsconfig, TsconfigContents } from './types.js';

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
export function resolveTsconfigFilePatterns(
    file: string,
    options: { contents?: TsconfigContents } = {}
): TsconfigFilePatterns {
    const absolute = normalizeRef(file);
    let chain: LoadedTsconfig[];
    try {
        chain = loadChain(
            absolute,
            new Set(),
            undefined,
            isRemoteUrl(absolute) ? process.cwd() : path.dirname(absolute),
            options.contents
        );
    } catch {
        chain = [
            {
                file: absolute,
                dir: refDir(absolute),
                config: readConfig(absolute, options.contents),
            },
        ];
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
    const filesEntry = localChain.find(entry => stringArray(entry.config.files) !== undefined);
    const include = includeEntry ? stringArray(includeEntry.config.include) : undefined;
    const exclude = excludeEntry ? stringArray(excludeEntry.config.exclude) : undefined;
    const files = filesEntry ? stringArray(filesEntry.config.files) : undefined;
    return {
        ...(include ? { include, includeDir: includeEntry!.dir } : {}),
        ...(exclude ? { exclude, excludeDir: excludeEntry!.dir } : {}),
        ...(files ? { files, filesDir: filesEntry!.dir } : {}),
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
