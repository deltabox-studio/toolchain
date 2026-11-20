/** Flatten a tsconfig chain that contains remote configs into a local object. */

import path from 'node:path';

import { mergeOverride } from '../overrides.js';
import { isRemoteUrl } from '../remote.js';
import type { TsconfigJson } from '../types/index.js';
import { loadChain, normalizeRef, resolveRef } from './extends.js';
import type { FlattenRemoteTsconfigOptions, LoadedTsconfig } from './types.js';

/** Compiler options whose values are paths. */
const PATH_OPTIONS = new Set([
    'baseUrl',
    'declarationDir',
    'outDir',
    'paths',
    'rootDir',
    'rootDirs',
    'tsBuildInfoFile',
    'typeRoots',
]);

/** Render an absolute path relative to `dir` (POSIX, `.` for equal). */
function relativeTo(absolute: string, dir: string): string {
    const relative = path.relative(dir, absolute).replace(/\\/g, '/');
    return relative === '' ? '.' : relative;
}

/** Rebase one path/glob from `fromDir` onto `toDir` (POSIX, `.` for equal). */
function rebasePath(value: string, fromDir: string, toDir: string): string {
    if (isRemoteUrl(value)) return value;
    return relativeTo(path.resolve(fromDir, value), toDir);
}

/** Prefix a relative path target with `./` (paths values keep that form). */
function withDotSlash(value: string): string {
    if (isRemoteUrl(value) || path.isAbsolute(value) || value.startsWith('.')) return value;
    return `./${value}`;
}

/** Rebase every entry of a path array. */
function rebasePathArray(values: unknown, fromDir: string, toDir: string): string[] | undefined {
    if (!Array.isArray(values)) return undefined;
    return values
        .filter((value): value is string => typeof value === 'string')
        .map(value => rebasePath(value, fromDir, toDir));
}

/**
 * Flatten a config chain that contains remote configs into a local-only object.
 * Remote compiler options are merged in, except path-valued options (which
 * describe the remote tree). Local path-valued options are rebased onto the
 * generated config's directory, and `paths` follows nearest-wins replacement
 * instead of merging with an ancestor's object. Returns `undefined` when the
 * chain has no remote config, so callers can keep the live local `extends`
 * chain.
 *
 * Callers use this only when the user opts into inlining a remote chain (see the
 * `flattenRemoteExtends` option); the generated config must still apply its own
 * settings on top so flattening never overrides them.
 */
export function flattenRemoteTsconfig(
    file: string,
    options: FlattenRemoteTsconfigOptions = {}
): TsconfigJson | undefined {
    const absolute = normalizeRef(file);
    const contents = options.contents;
    const chain = loadChain(
        absolute,
        new Set(),
        undefined,
        isRemoteUrl(absolute) ? process.cwd() : path.dirname(absolute),
        contents
    );
    if (!chain.some(entry => isRemoteUrl(entry.file))) return undefined;

    const targetDir = path.resolve(
        options.outDir ?? (isRemoteUrl(absolute) ? process.cwd() : path.dirname(absolute))
    );
    const local = chain.filter(entry => !isRemoteUrl(entry.file));

    // TypeScript resolves `paths` against the *nearest* `baseUrl` in the merged
    // chain (not the one from the config that defined `paths`).
    const pathsEntry = local.find(entry => entry.config.compilerOptions?.paths !== undefined);
    const baseUrlEntry = local.find(entry => entry.config.compilerOptions?.baseUrl !== undefined);
    const baseUrlAbsolute = baseUrlEntry
        ? resolveRef(baseUrlEntry.dir, baseUrlEntry.config.compilerOptions?.baseUrl ?? '.')
        : undefined;
    const pathsBaseAbsolute = baseUrlAbsolute ?? pathsEntry?.dir ?? targetDir;
    // Keep `paths` relative to the baseUrl we re-emit (or to the generated dir
    // when there is none), so the flattened config resolves identically.
    const pathsOutputBase = baseUrlAbsolute ?? targetDir;

    let paths: Record<string, string[]> | undefined;
    if (pathsEntry) {
        paths = {};
        for (const [key, value] of Object.entries(pathsEntry.config.compilerOptions?.paths ?? {})) {
            const targets = (Array.isArray(value) ? value : [value]) as string[];
            paths[key] = targets.map(target =>
                withDotSlash(
                    rebasePath(
                        resolveRef(pathsBaseAbsolute, target),
                        pathsOutputBase,
                        pathsOutputBase
                    )
                )
            );
        }
    }

    let merged: TsconfigJson = {};
    for (const entry of [...chain].reverse()) {
        const config = structuredClone(entry.config);
        delete config.extends;
        const remote = isRemoteUrl(entry.file);
        // Remote (and local, re-added below) path options are handled separately.
        // `include`/`exclude`/`files`/`references` describe the defining config's
        // tree, so remote ones must never leak into the generated config.
        if (remote) {
            delete config.include;
            delete config.exclude;
            delete config.files;
            delete config.references;
        }
        const options = config.compilerOptions ? { ...config.compilerOptions } : undefined;
        if (options) {
            for (const key of PATH_OPTIONS) delete (options as Record<string, unknown>)[key];
        }
        delete config.compilerOptions;
        merged = { ...merged, ...config };
        if (options && Object.keys(options).length > 0) {
            merged.compilerOptions = mergeOverride(
                merged.compilerOptions ?? {},
                options as Record<string, unknown>
            );
        }
    }

    const compilerOptions = {
        ...merged.compilerOptions,
    } as Record<string, unknown>;
    if (baseUrlAbsolute !== undefined) {
        compilerOptions.baseUrl = rebasePath(baseUrlAbsolute, targetDir, targetDir);
    }
    if (paths) compilerOptions.paths = paths;

    // Scalar/array path options follow nearest-wins and are rebased from the
    // config that defined them onto the generated config.
    const compilerOptionsOf = (entry: LoadedTsconfig | undefined) =>
        entry?.config.compilerOptions as Record<string, unknown> | undefined;
    for (const key of ['rootDir', 'outDir', 'declarationDir', 'tsBuildInfoFile'] as const) {
        const entry = local.find(
            candidate => typeof compilerOptionsOf(candidate)?.[key] === 'string'
        );
        const value = compilerOptionsOf(entry)?.[key];
        if (entry && typeof value === 'string') {
            compilerOptions[key] = rebasePath(value, entry.dir, targetDir);
        }
    }
    const rootDirsEntry = local.find(candidate =>
        Array.isArray(compilerOptionsOf(candidate)?.rootDirs)
    );
    const rootDirs = rebasePathArray(
        compilerOptionsOf(rootDirsEntry)?.rootDirs,
        rootDirsEntry?.dir ?? targetDir,
        targetDir
    );
    if (rootDirs) compilerOptions.rootDirs = rootDirs;
    const typeRootsEntry = local.find(candidate =>
        Array.isArray(compilerOptionsOf(candidate)?.typeRoots)
    );
    const typeRoots = rebasePathArray(
        compilerOptionsOf(typeRootsEntry)?.typeRoots,
        typeRootsEntry?.dir ?? targetDir,
        targetDir
    );
    if (typeRoots) compilerOptions.typeRoots = typeRoots;

    if (Object.keys(compilerOptions).length > 0) {
        merged.compilerOptions = compilerOptions as TsconfigJson['compilerOptions'];
    } else {
        delete merged.compilerOptions;
    }

    // Top-level `include`/`exclude`/`files` are nearest-wins and relative to the
    // config that defined them. Remote patterns are meaningless locally.
    for (const key of ['include', 'exclude', 'files'] as const) {
        const entry = local.find(candidate => Array.isArray(candidate.config[key]));
        const rebased = rebasePathArray(entry?.config[key], entry?.dir ?? targetDir, targetDir);
        if (rebased) merged[key] = rebased;
        else delete merged[key];
    }

    return merged;
}
