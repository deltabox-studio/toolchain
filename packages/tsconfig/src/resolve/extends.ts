/** Resolving `extends` specifiers and loading an inheritance chain. */

import { createRequire } from 'node:module';
import path from 'node:path';

import {
    getCachedRemoteTsconfig,
    isRemoteUrl,
    normalizeRemoteUrl,
    remoteExtendsCandidates,
} from '../remote.js';
import type { TsconfigJson } from '../types/index.js';
import { isFile, readConfig } from './read.js';
import type { LoadedTsconfig, TsconfigContents } from './types.js';

/** Whether an `extends` specifier points at a remote URL. */
export function isRemoteSpecifier(specifier: string): boolean {
    return isRemoteUrl(specifier);
}

/** Normalize a local path or remote URL to a chain key. */
export function normalizeRef(file: string): string {
    return isRemoteUrl(file) ? normalizeRemoteUrl(file) : path.resolve(file);
}

/** The directory/base URL of a config reference. */
export function refDir(ref: string): string {
    return isRemoteUrl(ref) ? normalizeRemoteUrl('.', ref) : path.dirname(ref);
}

/** Resolve a path/reference relative to a local directory or remote URL. */
export function resolveRef(base: string, target: string): string {
    if (isRemoteUrl(target)) return normalizeRemoteUrl(target);
    if (isRemoteUrl(base)) return normalizeRemoteUrl(target, base);
    return path.resolve(base, target);
}

/** Render a resolved target relative to a local directory or remote URL. */
export function relativeRef(base: string, absolute: string): string {
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
export function resolveLocalExtends(
    specifier: string,
    fromDir: string,
    assumeFiles?: ReadonlySet<string>
): string | undefined {
    return localExtendsCandidates(specifier, fromDir).find(
        candidate => assumeFiles?.has(path.resolve(candidate)) || isFile(candidate)
    );
}

/** Resolve a cached remote `extends` specifier, or its first candidate. */
export function resolveRemoteExtends(specifier: string, fromUrl?: string): string {
    const candidates = remoteExtendsCandidates(specifier, fromUrl);
    return candidates.find(candidate => getCachedRemoteTsconfig(candidate)) ?? candidates[0]!;
}

/**
 * Resolve an `extends` specifier to a local file or remote URL. A remote config
 * resolves relative paths against its URL and bare package names against the
 * local config directory that introduced it.
 */
export function resolveExtends(
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

/** The `extends` entries of a config in precedence order. */
export function extendsList(config: TsconfigJson): string[] {
    if (Array.isArray(config.extends)) return config.extends;
    return config.extends ? [config.extends] : [];
}

/** Load one config and every config it extends, in child-to-root order. */
export function loadChain(
    file: string,
    seen: Set<string>,
    assumeFiles?: ReadonlySet<string>,
    packageDir?: string,
    contents?: TsconfigContents
): LoadedTsconfig[] {
    const absolute = normalizeRef(file);
    if (seen.has(absolute)) return [];
    seen.add(absolute);

    const config = readConfig(absolute, contents);
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
        chain.push(...loadChain(normalized, seen, assumeFiles, nextPackageDir, contents));
    }
    return chain;
}
