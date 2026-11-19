/**
 * Config-file discovery: common locations, globs, `package.json` keys and
 * optional ancestor search.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { ConfigCandidate, ConfigParentSearch } from '../types/loader.js';
import {
    acceptFile,
    type AnyLoadInput,
    normalizeConfigFileOptions,
    type ResolvedConfigFileOptions,
} from './options.js';

/** The result of a discovery pass. */
export interface DiscoveredConfig {
    candidates: ConfigCandidate[];
    options: ResolvedConfigFileOptions;
    rootCwd: string;
}

function realpath(file: string, resolveSymlinks: boolean): string {
    if (!resolveSymlinks) return file;
    try {
        return fs.realpathSync(file);
    } catch {
        return file;
    }
}

function readPackageJsonConfig(
    dir: string,
    keys: readonly string[] | undefined
): { value: unknown; key: string; file: string } | undefined {
    if (!keys || keys.length === 0) return undefined;
    const file = path.join(dir, 'package.json');
    if (!fs.existsSync(file)) return undefined;
    try {
        const pkg = JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '')) as Record<
            string,
            unknown
        >;
        for (const key of keys) {
            if (Object.hasOwn(pkg, key)) return { value: pkg[key], key, file };
        }
    } catch {
        // A malformed package.json is not a config candidate.
    }
    return undefined;
}

function hasGlob(value: string): boolean {
    return /[*?[\]{}]/.test(value);
}

/**
 * Compile a simple path glob to a regexp.
 *
 * Supports `*` (one segment), `**` (any depth), `?` (one non-separator), simple
 * `[...]` character classes and `{a,b}` alternatives. Classes and braces are not
 * nested.
 */
function pathGlobToRegExp(pattern: string): RegExp {
    const normalized = pattern.replace(/\\/g, '/').replace(/^\.\//, '');
    const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let source = '';
    let index = 0;
    while (index < normalized.length) {
        const char = normalized[index]!;
        if (char === '*') {
            if (normalized[index + 1] === '*') {
                if (normalized[index + 2] === '/') {
                    source += '(?:.*/)?';
                    index += 3;
                } else {
                    source += '.*';
                    index += 2;
                }
            } else {
                source += '[^/]*';
                index += 1;
            }
        } else if (char === '?') {
            source += '[^/]';
            index += 1;
        } else if (char === '[') {
            const end = normalized.indexOf(']', index + 1);
            if (end === -1) {
                source += '\\[';
                index += 1;
            } else {
                const body = normalized.slice(index + 1, end);
                // Glob `[!...]` is a negated class in the usual shells.
                const translated = body.startsWith('!') ? `^${body.slice(1)}` : body;
                // A class never matches a path separator.
                source += `(?:(?!/)[${translated}])`;
                index = end + 1;
            }
        } else if (char === '{') {
            const end = normalized.indexOf('}', index + 1);
            if (end === -1) {
                source += '\\{';
                index += 1;
            } else {
                const alternatives = normalized
                    .slice(index + 1, end)
                    .split(',')
                    .map(alternative => escape(alternative));
                source += `(?:${alternatives.join('|')})`;
                index = end + 1;
            }
        } else {
            source += escape(char);
            index += 1;
        }
    }
    return new RegExp(`^${source}$`);
}

function walkDirectories(root: string, depth = 0): string[] {
    if (depth > 8) return [root];
    const out = [root];
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(root, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        out.push(...walkDirectories(path.join(root, entry.name), depth + 1));
    }
    return out;
}

function expandLocation(
    location: { cwd?: string; path: string | string[] },
    rootCwd: string
): string[] {
    const base = path.resolve(rootCwd, location.cwd ?? '.');
    const patterns = Array.isArray(location.path) ? location.path : [location.path];
    const out = new Set<string>();
    for (const pattern of patterns) {
        if (!hasGlob(pattern)) {
            out.add(path.resolve(base, pattern));
            continue;
        }
        const expression = pathGlobToRegExp(pattern);
        for (const dir of walkDirectories(base)) {
            const relative = path.relative(base, dir).replace(/\\/g, '/');
            if (expression.test(relative) || expression.test(`${relative}/`)) out.add(dir);
        }
    }
    return [...out];
}

/** Every config candidate under one resolved directory set, in priority order. */
export function findCandidates(
    resolved: ResolvedConfigFileOptions,
    rootCwd: string
): ConfigCandidate[] {
    const out: ConfigCandidate[] = [];
    for (const location of resolved.locations) {
        for (const dir of expandLocation(location, rootCwd)) {
            for (const name of resolved.names) {
                const file = path.join(dir, name);
                if (!fs.existsSync(file)) continue;
                if (resolved.allowedExtensions) {
                    const extension = path.extname(file).toLowerCase();
                    if (!resolved.allowedExtensions.includes(extension)) continue;
                }
                if (!acceptFile(resolved, file)) continue;
                out.push({ file: realpath(file, resolved.followSymlinks), kind: 'file' });
            }
            const pkg = readPackageJsonConfig(dir, resolved.packageJsonKeys);
            if (pkg) {
                out.push({
                    file: pkg.file,
                    value: pkg.value,
                    key: pkg.key,
                    kind: 'package.json',
                });
            }
        }
    }
    return out;
}

/** Whether an ancestor walk stops at `dir`. */
function shouldStopAt(dir: string, parent: ConfigParentSearch, stopAtRepoRoot: boolean): boolean {
    if (parent.stop?.(dir)) return true;
    return stopAtRepoRoot && fs.existsSync(path.join(dir, '.git'));
}

/**
 * Discover config candidates for an already-resolved option set. When nothing is
 * found at `cwd` and ancestor search is enabled, the nearest ancestor directory
 * with a candidate is used instead.
 */
export function discoverConfig(input: AnyLoadInput = {}): DiscoveredConfig {
    const resolved = normalizeConfigFileOptions(input);
    const rootCwd = path.resolve((input as { cwd?: string }).cwd ?? process.cwd());
    let candidates = findCandidates(resolved, rootCwd);
    const parent = resolved.parent;
    if (candidates.length === 0 && parent) {
        const stopAtRepoRoot = parent.stopAtRepoRoot ?? true;
        // A repo root has no ancestor config to inherit (its own `.git` marks
        // the boundary).
        if (!(stopAtRepoRoot && fs.existsSync(path.join(rootCwd, '.git')))) {
            let dir = path.dirname(rootCwd);
            for (;;) {
                if (parent.stop?.(dir)) break;
                candidates = findCandidates(resolved, dir);
                if (candidates.length > 0) break;
                if (shouldStopAt(dir, parent, stopAtRepoRoot)) break;
                const next = path.dirname(dir);
                if (next === dir) break;
                dir = next;
            }
        }
    }
    return { candidates, options: resolved, rootCwd };
}

/** Find the first config file at `cwd` (sync, no loading). */
export function findConfigFile(options: AnyLoadInput = {}): string | undefined {
    const resolved = { ...normalizeConfigFileOptions(options), parent: undefined };
    const rootCwd = path.resolve((options as { cwd?: string }).cwd ?? process.cwd());
    return findCandidates(resolved, rootCwd)[0]?.file;
}

/**
 * Find the nearest ancestor config file above `cwd` (never `cwd` itself). The
 * walk stops at a repository boundary (`.git`) unless `parent.stopAtRepoRoot` is
 * explicitly false.
 */
export function findParentConfigFile(options: AnyLoadInput = {}): string | undefined {
    const resolved = normalizeConfigFileOptions(options);
    const rootCwd = path.resolve((options as { cwd?: string }).cwd ?? process.cwd());
    const parent = resolved.parent ?? { stopAtRepoRoot: true };
    const stopAtRepoRoot = parent.stopAtRepoRoot ?? true;
    if (stopAtRepoRoot && fs.existsSync(path.join(rootCwd, '.git'))) return undefined;
    let dir = path.dirname(rootCwd);
    for (;;) {
        if (parent.stop?.(dir)) return undefined;
        const candidates = findCandidates(resolved, dir);
        if (candidates.length > 0) return candidates[0]!.file;
        if (shouldStopAt(dir, parent, stopAtRepoRoot)) return undefined;
        const next = path.dirname(dir);
        if (next === dir) return undefined;
        dir = next;
    }
}
