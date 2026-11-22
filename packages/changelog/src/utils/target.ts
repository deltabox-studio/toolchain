import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** The shared target selector used by scoped changelog options. */
export interface ChangelogTargetSelector {
    target?: string;
    include?: string | string[];
    exclude?: string | string[];
}

/** A targeted option wrapper (`Arrayable<{ target?, options }>`). */
export interface ChangelogTargetedOption<T> extends ChangelogTargetSelector {
    options: T;
}

/** One intro/outro entry. */
export interface ChangelogTextEntry extends ChangelogTargetSelector {
    enabled?: boolean;
    content?: unknown;
    file?: unknown;
}

function posix(value: string): string {
    return value.replace(/\\/g, '/');
}

function asArray(value: string | string[] | undefined): string[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

function hasGlob(pattern: string): boolean {
    return /[*?[\]{}]/.test(pattern);
}

/** A small glob matcher (`*`, `**`, `?`) against a repo-relative posix path. */
export function matchTargetGlob(pattern: string, value: string): boolean {
    const normalized = posix(pattern).replace(/^\.\//, '').replace(/\/+$/, '');
    const target = posix(value).replace(/^\.\//, '').replace(/\/+$/, '');
    if (normalized === '' || normalized === '.') return target === '' || target === '.';
    const source = normalized
        .split('')
        .map(char => {
            if (char === '*') return '\u0000';
            if (char === '?') return '.';
            return char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        })
        .join('')
        .replace(/\u0000\u0000\//g, '(?:.*/)?')
        .replace(/\u0000\u0000/g, '.*')
        .replace(/\u0000/g, '[^/]*');
    return new RegExp(`^${source}$`).test(target);
}

/** The repo-relative posix directory (`.` for the root). */
export function relativeDir(root: string, dir: string): string {
    const relative = posix(path.relative(root, dir));
    return relative === '' ? '.' : relative;
}

/** Whether a selector applies to a directory. */
export function matchesTarget(
    selector: ChangelogTargetSelector,
    dir: string,
    root: string
): boolean {
    const relative = relativeDir(root, dir);
    const target = selector.target?.trim();
    if (target !== undefined && target !== '') {
        const normalized = posix(target).replace(/^\.\//, '').replace(/\/+$/, '');
        if (normalized === '' || normalized === '.') {
            if (relative !== '.') return false;
        } else if (hasGlob(normalized)) {
            if (!matchTargetGlob(normalized, relative)) return false;
        } else if (relative !== normalized) {
            return false;
        }
    }
    const include = asArray(selector.include);
    if (include.length > 0 && !include.some(pattern => matchTargetGlob(pattern, relative))) {
        return false;
    }
    const exclude = asArray(selector.exclude);
    return !exclude.some(pattern => matchTargetGlob(pattern, relative));
}

/** How specific a matching selector is (higher wins). */
function selectorScore(selector: ChangelogTargetSelector): number {
    const target = selector.target?.trim();
    if (target === undefined || target === '') {
        return asArray(selector.include).length > 0 || asArray(selector.exclude).length > 0 ? 1 : 0;
    }
    const normalized = posix(target).replace(/^\.\//, '').replace(/\/+$/, '');
    return hasGlob(normalized) ? 2 : 3;
}

function isTargetedOption(value: unknown): value is ChangelogTargetedOption<unknown> {
    return Boolean(value && typeof value === 'object' && 'options' in value);
}

/**
 * Resolve a scoped option for a directory. The narrowest matching target wins;
 * when nothing matches, the base value (or the supplied fallback) is returned.
 */
export function resolveScopedOption<T>(
    value: T | ChangelogTargetedOption<T> | Array<T | ChangelogTargetedOption<T>> | undefined,
    dir: string,
    root: string,
    fallback?: T
): T | undefined {
    if (value === undefined) return fallback;
    if (Array.isArray(value)) {
        // A base value may itself be an array (eg. a bump rule list); only treat
        // arrays whose entries are `{ options }` objects as targeted settings.
        if (!value.some(isTargetedOption)) return value as T;
        let best: ChangelogTargetedOption<T> | undefined;
        let score = -1;
        for (const entry of value) {
            if (!isTargetedOption(entry) || !matchesTarget(entry, dir, root)) continue;
            const next = selectorScore(entry);
            if (next > score) {
                best = entry;
                score = next;
            }
        }
        if (best) return best.options;
        // Mixed arrays (`['feat', { target, options }]`) keep the plain entries
        // as the fallback for targets no scoped entry matches.
        const plain = value.filter(entry => !isTargetedOption(entry));
        if (plain.length > 0) return (plain.length === 1 ? plain[0] : plain) as T;
        return fallback;
    }
    if (isTargetedOption(value)) {
        return matchesTarget(value, dir, root) ? (value.options as T) : fallback;
    }
    return value as T;
}

/** Resolve the intro/outro text for a directory (joined in config order). */
export function resolveTextSetting(
    setting: ChangelogTextEntry | ChangelogTextEntry[] | undefined,
    dir: string,
    root: string,
    baseDir: string = root
): string | undefined {
    if (setting === undefined) return undefined;
    const entries = Array.isArray(setting) ? setting : [setting];
    const parts: string[] = [];
    for (const entry of entries) {
        if (entry.enabled === false) continue;
        if (!matchesTarget(entry, dir, root)) continue;
        let text: string | undefined;
        if (typeof entry.content === 'string') {
            text = entry.content;
        } else if (typeof entry.file === 'string' && entry.file.length > 0) {
            const file = path.isAbsolute(entry.file)
                ? entry.file
                : path.resolve(baseDir, entry.file);
            if (existsSync(file)) text = readFileSync(file, 'utf8');
        }
        if (text !== undefined && text.trim() !== '') parts.push(text.trim());
    }
    return parts.length > 0 ? parts.join('\n\n') : undefined;
}
