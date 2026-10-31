export type Sortable = Record<string, any> | [string, any][] | undefined;

/** Sort an object's keys (or an entry tuple array) alphabetically. */
export function sort<T extends Sortable>(value: T): T {
    if (!value) return value as T;
    const entries = Array.isArray(value) ? value : Object.entries(value || {});
    const sortedEntries = entries.sort(([a], [b]) => resolveSort(a, b));
    if (Array.isArray(value)) return sortedEntries as T;
    return Object.fromEntries(sortedEntries) as T;
}

/** Default comparator used by {@link sort}. */
export function resolveSort(a: string, b: string): number {
    return a.localeCompare(b);
}

/** Whether a value is a non-null, non-array object. */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Recursively merge `sources` over `target` (arrays and scalars are replaced). */
export function deepMerge<T extends Record<string, any>>(
    target: T,
    ...sources: (Partial<T> | undefined)[]
): T {
    const out: Record<string, any> = { ...target };
    for (const source of sources) {
        if (!source) continue;
        for (const [key, value] of Object.entries(source)) {
            const current = out[key];
            if (isPlainObject(current) && isPlainObject(value)) {
                out[key] = deepMerge(current, value);
            } else if (value !== undefined) {
                out[key] = value;
            }
        }
    }
    return out as T;
}

/** Map an object's values, keeping the keys. */
export function mapValues<V, R>(
    value: Record<string, V>,
    fn: (value: V, key: string) => R
): Record<string, R> {
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, fn(v, key)])) as Record<
        string,
        R
    >;
}

/**
 * Layer typed overrides over a base object (shallow per level, objects merge
 * recursively). Later overrides win; `undefined` leaves the base value alone.
 */
export function applyOverrides<T extends object>(base: T, ...overrides: Partial<T>[]): T {
    if (overrides.length === 0) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const override of overrides) {
        if (!override) continue;
        for (const [key, value] of Object.entries(override)) {
            if (value === undefined) continue;
            const current = out[key];
            out[key] =
                isPlainObject(current) && isPlainObject(value)
                    ? applyOverrides(current, value)
                    : value;
        }
    }
    return out as T;
}
