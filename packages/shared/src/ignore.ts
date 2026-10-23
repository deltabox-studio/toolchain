/**
 * Path ignoring for the glob-based consumers (`tsconfig`, `watch`).
 *
 * Every ignore list starts from {@link DEFAULT_IGNORE_PATTERNS} (the common
 * build/dependency dirs), the consumer's `exclude` globs are appended, and — when
 * `gitignore` is on (the default) — the repo's `.gitignore` files are folded in
 * (root **and nested**, each scoped to its own directory, like git).
 */

import fs from 'node:fs';
import path from 'node:path';

/** The common paths always ignored (dependency/build/cache dirs). */
export const DEFAULT_IGNORE_PATTERNS: readonly string[] = [
    '**/node_modules/**',
    '**/.git/**',
    '**/.dbx/**',
    '**/dist/**',
    '**/build/**',
    '**/out/**',
    '**/coverage/**',
    '**/.turbo/**',
    '**/.yarn/**',
    '**/.next/**',
    '**/.cache/**',
    '**/.output/**',
    '**/.vite/**',
    '**/.nyc_output/**',
    '**/*.tsbuildinfo',
];

/** Directory names skipped when scanning for nested `.gitignore` files. */
const IGNORED_DIR_NAMES = new Set([
    'node_modules',
    '.git',
    '.dbx',
    'dist',
    'build',
    'out',
    'coverage',
    '.turbo',
    '.yarn',
    '.next',
    '.cache',
    '.output',
    '.vite',
]);

/** Options shared by the `tsconfig` / `watch` ignore resolution. */
export interface IgnoreOptions {
    /** Extra glob(s) to exclude on top of the defaults. */
    exclude?: string | string[];
    /** Respect `.gitignore` files (default true). */
    gitignore?: boolean;
}

/** Normalize a glob option (`string | string[]`) into an array. */
function toArray(value: string | string[] | undefined): string[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

/**
 * Convert one `.gitignore` line into a glob (relative to the repo root).
 *
 * `dir` is the gitignore's directory relative to the root (`` for the root).
 * Negations (`!`) cannot be represented in a glob ignore list and are skipped;
 * comments and blanks are ignored.
 */
function gitignoreLineToGlobs(line: string, dir: string): string[] {
    let pattern = line.trim();
    if (!pattern || pattern.startsWith('#')) return [];
    if (pattern.startsWith('!')) return []; // negations are unsupported
    // A trailing `/` marks a directory.
    if (pattern.endsWith('/')) pattern = pattern.replace(/\/+$/, '');
    // A leading `/` anchors the pattern to the gitignore's directory.
    const anchored = pattern.startsWith('/');
    if (anchored) pattern = pattern.slice(1);
    if (!pattern) return [];

    const base = dir ? `${dir}/` : '';
    const scope = anchored ? base : `${base}**/`;
    const glob = `${scope}${pattern}`;
    // Match the entry itself and (unless it already targets a subtree) its
    // contents, so a directory pattern ignores everything under it.
    return glob.endsWith('/**') ? [glob] : [glob, `${glob}/**`];
}

/** Read + convert a single `.gitignore` file (relative `dir`, `` for the root). */
function readGitignore(file: string, dir: string): string[] {
    let content: string;
    try {
        content = fs.readFileSync(file, 'utf-8');
    } catch {
        return [];
    }
    const globs: string[] = [];
    for (const line of content.split(/\r?\n/)) {
        globs.push(...gitignoreLineToGlobs(line, dir));
    }
    return globs;
}

/**
 * Collect the ignore globs from every `.gitignore` in the tree (root + nested),
 * each scoped to its own directory.
 *
 * The walk is manual (not `readdirSync({ recursive: true })`, which **follows
 * symlinks/junctions** and would loop forever on a self-link such as a
 * `portal:.` / `portal:../..` workspace dependency). Symlinks are never followed
 * and ignored directories are never descended into.
 */
export function collectGitignorePatterns(cwd: string = process.cwd()): string[] {
    const patterns: string[] = [];
    const rootGitignore = path.join(cwd, '.gitignore');
    if (fs.existsSync(rootGitignore)) patterns.push(...readGitignore(rootGitignore, ''));

    const walk = (dir: string): void => {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            // Never follow a symlink/junction (a self-link would cycle), and
            // never descend into an ignored directory (node_modules, .git, ...).
            if (entry.isSymbolicLink()) continue;
            const abs = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (IGNORED_DIR_NAMES.has(entry.name)) continue;
                walk(abs);
            } else if (entry.isFile() && entry.name === '.gitignore') {
                const rel = path.relative(cwd, dir).replace(/\\/g, '/');
                // The root gitignore is read above.
                if (rel === '') continue;
                patterns.push(...readGitignore(abs, rel));
            }
        }
    };
    walk(cwd);
    return patterns;
}

/**
 * The full ignore list for a consumer: the defaults, plus `exclude`, plus (when
 * `gitignore` is on) the tree's `.gitignore` globs.
 */
export function resolveIgnorePatterns(
    cwd: string = process.cwd(),
    options: IgnoreOptions = {}
): string[] {
    const patterns = [...DEFAULT_IGNORE_PATTERNS, ...toArray(options.exclude)];
    if (options.gitignore !== false) patterns.push(...collectGitignorePatterns(cwd));
    return patterns;
}

/** Compile a glob into a RegExp (supports `**`, `*`, `?` and literals). */
function globToRegExp(pattern: string): RegExp {
    let re = '';
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        if (char === '*') {
            if (pattern[i + 1] === '*') {
                if (pattern[i + 2] === '/') {
                    re += '(?:.*/)?';
                    i += 2;
                } else {
                    re += '.*';
                    i += 1;
                }
            } else {
                re += '[^/]*';
            }
        } else if (char === '?') {
            re += '[^/]';
        } else if ('.+^${}()|[]\\'.includes(char as string)) {
            re += `\\${char}`;
        } else {
            re += char;
        }
    }
    return new RegExp(`^${re}$`);
}

/** Whether a repo-relative path matches any of the ignore globs. */
export function isIgnoredPath(relativePath: string, patterns: readonly string[]): boolean {
    const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
    for (const pattern of patterns) {
        const re = globToRegExp(pattern);
        if (re.test(normalized) || re.test(`${normalized}/`)) return true;
    }
    return false;
}
