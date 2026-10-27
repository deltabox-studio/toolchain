/**
 * Low-level configuration helpers: env-tree parsing, typed accessors and
 * override merging. Free of Node builtins so browser consumers can import the
 * frontend resolver without pulling `node:path` / `node:url` into a bundle.
 */

/** A flat env source (process.env, import.meta.env or a plain object). */
export type EnvSource = Record<string, string | undefined>;

/** A nested tree produced by folding `PREFIX_*` vars on `_`. */
export type EnvTree = Record<string, unknown>;

/** Parse a flat env source into the nested `PREFIX_*` tree. */
export function parseEnvTree(env: EnvSource = {}, prefix = 'APP_'): EnvTree {
    const tree: EnvTree = {};
    for (const [key, raw] of Object.entries(env)) {
        if (!key.startsWith(prefix)) continue;
        if (raw === undefined) continue;
        const segments = key.slice(prefix.length).toLowerCase().split('_');
        let node = tree;
        for (let i = 0; i < segments.length - 1; i += 1) {
            const segment = segments[i] ?? '';
            if (typeof node[segment] !== 'object' || node[segment] === null) {
                node[segment] = {};
            }
            node = node[segment] as EnvTree;
        }
        node[segments[segments.length - 1] ?? ''] = raw;
    }
    return tree;
}

/** Read a dotted path out of an env tree. */
export function readEnvPath(tree: EnvTree, path: string): unknown {
    let node: unknown = tree;
    for (const segment of path.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined;
        node = (node as EnvTree)[segment];
    }
    return node;
}

/** Read a string value, falling back when unset or empty. */
export function envString(tree: EnvTree, path: string, fallback = ''): string {
    const v = readEnvPath(tree, path);
    return typeof v === 'string' && v.trim() !== '' ? v : fallback;
}

/** Read an integer value, falling back when unset or not a number. */
export function envInt(tree: EnvTree, path: string, fallback: number): number {
    const v = readEnvPath(tree, path);
    if (typeof v !== 'string' || v.trim() === '') return fallback;
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
}

/** Read a boolean value. Accepts true/false/1/0/yes/no/on/off. */
export function envBool(tree: EnvTree, path: string, fallback: boolean): boolean {
    const v = readEnvPath(tree, path);
    if (typeof v !== 'string' || v.trim() === '') return fallback;
    const normalized = v.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    return fallback;
}

/** Read a comma-separated list, filtering empty entries. */
export function envList(tree: EnvTree, path: string, fallback: string[] = []): string[] {
    const v = readEnvPath(tree, path);
    if (typeof v !== 'string' || v.trim() === '') return fallback;
    return v
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
}

/** Read `Header=value,...` into a lowercase-keyed record. */
export function envMap(tree: EnvTree, path: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const raw of envList(tree, path, [])) {
        const idx = raw.indexOf('=');
        if (idx === -1) continue;
        out[raw.slice(0, idx).trim().toLowerCase()] = raw.slice(idx + 1).trim();
    }
    return out;
}

/** Recursively merge typed overrides over a base object (shallow per level). */
export function applyOverrides<T extends object>(base: T, overrides?: Partial<T>): T {
    if (!overrides) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(overrides)) {
        if (value === undefined) continue;
        const baseValue = (base as Record<string, unknown>)[key];
        if (
            baseValue &&
            typeof baseValue === 'object' &&
            !Array.isArray(baseValue) &&
            value &&
            typeof value === 'object' &&
            !Array.isArray(value)
        ) {
            out[key] = applyOverrides(baseValue as object, value as object);
        } else {
            out[key] = value;
        }
    }
    return out as T;
}
