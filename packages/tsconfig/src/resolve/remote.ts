/** Remote `extends` maintenance: chain assertions and prefetching. */

import path from 'node:path';

import {
    fetchRemoteTsconfig,
    getCachedRemoteTsconfig,
    isRemoteUrl,
    remoteExtendsCandidates,
} from '../remote.js';
import type { PrefetchTsconfigOptions, TsconfigJson } from '../types/index.js';
import {
    extendsList,
    isRemoteSpecifier,
    loadChain,
    normalizeRef,
    resolveLocalExtends,
} from './extends.js';
import { readConfig } from './read.js';

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
