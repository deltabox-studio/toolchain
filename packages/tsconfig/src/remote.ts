/**
 * Remote tsconfig support.
 *
 * Fetching is asynchronous, while tsconfig resolution is synchronous. The async
 * prefetch pass downloads every remote `extends` in a chain and fills
 * {@link remoteTsconfigCache}; the resolver then reads those entries
 * synchronously. A remote reference that was not prefetched fails with a clear
 * error instead of silently disappearing.
 */

import { parseTsconfig } from './resolve.js';
import type { TsconfigJson } from './types/index.js';

const remoteTsconfigCache = new Map<string, TsconfigJson>();
const pendingFetches = new Map<string, Promise<TsconfigJson>>();

/** Whether a string is an absolute `http(s)` URL. */
export function isRemoteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

/** Normalize a remote URL (optionally against a base URL). */
export function normalizeRemoteUrl(value: string, base?: string): string {
    return new URL(value, base).href;
}

/** The URL candidates for a remote `extends` specifier. */
export function remoteExtendsCandidates(specifier: string, fromUrl?: string): string[] {
    const base = fromUrl ? normalizeRemoteUrl(specifier, fromUrl) : normalizeRemoteUrl(specifier);
    const candidates = [base];
    if (!base.endsWith('.json')) {
        candidates.push(`${base}.json`);
        candidates.push(
            normalizeRemoteUrl('tsconfig.json', base.endsWith('/') ? base : `${base}/`)
        );
    }
    return [...new Set(candidates)];
}

/** A cached remote config, if present. */
export function getCachedRemoteTsconfig(url: string): TsconfigJson | undefined {
    return remoteTsconfigCache.get(normalizeRemoteUrl(url));
}

/** Clear the remote cache (tests and long-running processes). */
export function clearRemoteTsconfigCache(): void {
    remoteTsconfigCache.clear();
    pendingFetches.clear();
}

function parseRemote(url: string, text: string): TsconfigJson {
    try {
        return parseTsconfig(text);
    } catch (error) {
        throw new Error(
            `Cannot parse remote tsconfig "${url}": ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

/**
 * Fetch one remote tsconfig and cache its parsed config. Concurrent requests for
 * the same URL share a request.
 */
export async function fetchRemoteTsconfig(url: string): Promise<TsconfigJson> {
    const normalized = normalizeRemoteUrl(url);
    const cached = remoteTsconfigCache.get(normalized);
    if (cached) return cached;
    const pending = pendingFetches.get(normalized);
    if (pending) return pending;

    const request = (async () => {
        let response: Response;
        try {
            response = await fetch(normalized, {
                headers: { accept: 'application/json, text/plain, */*' },
            });
        } catch (error) {
            throw new Error(
                `Failed to fetch remote tsconfig "${normalized}": ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
        if (!response.ok) {
            throw new Error(
                `Failed to fetch remote tsconfig "${normalized}": ${response.status} ${response.statusText}`
            );
        }
        const config = parseRemote(normalized, await response.text());
        remoteTsconfigCache.set(normalized, config);
        return config;
    })();

    pendingFetches.set(normalized, request);
    try {
        return await request;
    } finally {
        pendingFetches.delete(normalized);
    }
}

/** Read a remote config that a prefetch pass already downloaded. */
export function readRemoteTsconfig(url: string): TsconfigJson {
    const normalized = normalizeRemoteUrl(url);
    const cached = remoteTsconfigCache.get(normalized);
    if (!cached) {
        throw new Error(
            `Remote tsconfig "${normalized}" was not prefetched; use resolveTsconfigAsync() or prefetchTsconfigExtends()`
        );
    }
    return cached;
}
