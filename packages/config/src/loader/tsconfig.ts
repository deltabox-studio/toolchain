/**
 * tsconfig-aware resolution helpers for importing TypeScript config files.
 *
 * TypeScript configs often rely on `baseUrl`/`paths` aliases and on `.js`
 * specifiers that only exist as `.ts` on disk. Node's native import cannot
 * resolve those, so the loader uses these helpers to decide whether a
 * transpiler fallback (`tsx`) can fix a native import error.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJsoncFile } from '@deltabox/toolchain-shared';

/** The `baseUrl`/`paths` a tsconfig (and its relative `extends`) resolves with. */
export interface TsconfigResolutionOptions {
    baseUrl?: string;
    paths?: Record<string, string[]>;
}

/** Extensions tsx can resolve when a specifier omits one (or names `.js`). */
const TS_RESOLVE_EXTENSIONS = [
    '.ts',
    '.tsx',
    '.mts',
    '.cts',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.json',
] as const;

/** Whether `file` (or a TypeScript/JS source it maps to) exists. */
export function existsWithExtension(file: string): boolean {
    try {
        if (fs.statSync(file).isFile()) return true;
    } catch {
        // fall through to the extension candidates
    }
    const ext = path.extname(file);
    const base = ext ? file.slice(0, -ext.length) : file;
    const replacements: Record<string, string[]> = {
        '.js': ['.ts', '.tsx', '.mts', '.cts'],
        '.jsx': ['.tsx'],
        '.mjs': ['.mts'],
        '.cjs': ['.cts'],
    };
    const candidates = [
        ...(replacements[ext] ?? []).map(candidate => base + candidate),
        ...TS_RESOLVE_EXTENSIONS.map(candidate => file + candidate),
        ...TS_RESOLVE_EXTENSIONS.map(candidate => path.join(file, `index${candidate}`)),
    ];
    return candidates.some(candidate => {
        try {
            return fs.statSync(candidate).isFile();
        } catch {
            return false;
        }
    });
}

/** Read `baseUrl`/`paths` from a tsconfig, following relative `extends`. */
export function readTsconfigOptions(
    file: string,
    seen = new Set<string>()
): TsconfigResolutionOptions {
    const resolved = path.resolve(file);
    if (seen.has(resolved)) return {};
    seen.add(resolved);
    const json = readJsoncFile<{
        extends?: string | string[];
        compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> };
    }>(resolved);
    if (!json) return {};
    let parent: TsconfigResolutionOptions = {};
    const extendsList =
        json.extends === undefined
            ? []
            : Array.isArray(json.extends)
              ? json.extends
              : [json.extends];
    for (const value of extendsList) {
        if (!value.startsWith('.') && !path.isAbsolute(value)) continue;
        const target = path.resolve(
            path.dirname(resolved),
            value.endsWith('.json') ? value : `${value}.json`
        );
        const inherited = readTsconfigOptions(target, seen);
        if (inherited.baseUrl) parent = { ...parent, baseUrl: inherited.baseUrl };
        if (inherited.paths) parent = { ...parent, paths: inherited.paths };
    }
    const compiler = json.compilerOptions ?? {};
    const ownBaseUrl = compiler.baseUrl
        ? path.resolve(path.dirname(resolved), compiler.baseUrl)
        : undefined;
    const baseUrl = ownBaseUrl ?? parent.baseUrl;
    const paths = compiler.paths ?? parent.paths;
    return {
        ...(baseUrl ? { baseUrl } : {}),
        ...(paths ? { paths } : {}),
    };
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whether a bare specifier is a tsconfig path alias/baseUrl that resolves. */
export function matchesTsconfig(specifier: string, tsconfig: string | false | undefined): boolean {
    if (typeof tsconfig !== 'string') return false;
    const options = readTsconfigOptions(tsconfig);
    if (options.paths) {
        const base = options.baseUrl ?? path.dirname(tsconfig);
        for (const [pattern, targets] of Object.entries(options.paths)) {
            const expression = new RegExp(
                `^${pattern
                    .split('*')
                    .map(part => escapeRegExp(part))
                    .join('(.*)')}$`
            );
            const match = specifier.match(expression);
            if (!match) continue;
            const captures = match.slice(1);
            return targets.some(target => {
                let candidate = target;
                for (const value of captures) {
                    candidate = candidate.replace('*', value);
                }
                return existsWithExtension(path.resolve(base, candidate));
            });
        }
    }
    return options.baseUrl ? existsWithExtension(path.resolve(options.baseUrl, specifier)) : false;
}

/**
 * The nearest `tsconfig.json` at or above `startDir`, stopping at the repository
 * boundary (`.git`) so a project never borrows a tsconfig from outside its repo.
 */
export function findTsconfigFile(startDir: string): string | undefined {
    let dir = path.resolve(startDir);
    for (;;) {
        const candidate = path.join(dir, 'tsconfig.json');
        if (fs.existsSync(candidate)) return candidate;
        if (fs.existsSync(path.join(dir, '.git'))) return undefined;
        const parent = path.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
}

/**
 * Whether a failed native import means Node simply cannot load TypeScript
 * itself - the only case where the `tsx` fallback helps. Older Node lacks type
 * stripping (`ERR_UNKNOWN_FILE_EXTENSION`) and strip-only mode rejects syntax a
 * transpiler handles (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`).
 */
export function isUntranspiledError(error: unknown): boolean {
    const code = (error as { code?: unknown } | null)?.code;
    return code === 'ERR_UNKNOWN_FILE_EXTENSION' || code === 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX';
}

/**
 * Whether a failed native import is a resolution problem `tsx` can fix (a `.js`
 * specifier that only exists as `.ts`, a tsconfig path alias, a directory
 * import).
 */
export function isResolutionError(error: unknown): boolean {
    const code = (error as { code?: unknown } | null)?.code;
    return (
        code === 'ERR_MODULE_NOT_FOUND' ||
        code === 'MODULE_NOT_FOUND' ||
        code === 'ERR_UNSUPPORTED_DIR_IMPORT'
    );
}

/** The specifier Node could not resolve, from its `MODULE_NOT_FOUND` message. */
export function missingSpecifier(error: unknown): string | undefined {
    const message = error instanceof Error ? error.message : String(error);
    return message.match(/Cannot find (?:package|module) '([^']+)'/)?.[1];
}

/**
 * Whether `tsx` can plausibly fix a native resolution error. A `.js` specifier
 * whose `.ts` source exists (or a tsconfig path alias) qualifies; a genuinely
 * missing package/module does not, because `tsx` would silently load an empty
 * module and hide a broken config file.
 */
export function shouldFallbackToTsx(
    error: unknown,
    importerFile: string,
    tsconfig: string | false | undefined
): boolean {
    if (isUntranspiledError(error)) return true;
    const code = (error as { code?: unknown } | null)?.code;
    if (code === 'ERR_UNSUPPORTED_DIR_IMPORT') return true;
    if (!isResolutionError(error)) return false;
    const specifier = missingSpecifier(error);
    if (!specifier) return false;
    let resolved: string | undefined;
    if (specifier.startsWith('file:')) resolved = fileURLToPath(specifier);
    else if (path.isAbsolute(specifier)) resolved = specifier;
    else if (specifier.startsWith('.'))
        resolved = path.resolve(path.dirname(importerFile), specifier);
    if (resolved !== undefined) return existsWithExtension(resolved);
    return matchesTsconfig(specifier, tsconfig);
}
