/**
 * Apply and revert managed `tsconfig.overrides` against user-owned tsconfigs.
 *
 * Overrides are deep-merged: plain objects merge key by key, everything else
 * (arrays, scalars) replaces the target value. Reverting compares the target
 * file against its original snapshot, so a removed override only drops what the
 * override actually added: a value the original already defined is restored,
 * and a value edited after the override applied it is kept.
 */

import { isDeepStrictEqual } from 'node:util';

import type { TsConfigJson } from 'type-fest';

import type { ToolchainTsconfigOverrides } from '@deltabox/toolchain-shared';

/** The file an override targets. */
export type TsconfigOverrideKind = 'base' | 'root' | 'default' | 'build';

/** Every override kind, in the order the sync task applies them. */
export const TSCONFIG_OVERRIDE_KINDS: readonly TsconfigOverrideKind[] = [
    'base',
    'root',
    'default',
    'build',
];

/** The `tsconfig.overrides` config section. */
export type TsconfigOverrides = ToolchainTsconfigOverrides;

/** One applied override, as recorded in the manifest. */
export interface AppliedOverride {
    kind: TsconfigOverrideKind;
    override: TsConfigJson;
}

/** Applied overrides keyed by repo-relative file path. */
export type OverridesState = Record<string, AppliedOverride>;

/** A leaf value set by an override, addressed by its object path. */
export interface OverrideLeaf {
    path: string[];
    value: unknown;
}

/** The outcome of {@link revertOverride}. */
export interface RevertOverrideResult {
    /** Dotted keys that were removed or restored to their snapshot value. */
    reverted: string[];
    /** Dotted keys left alone because they changed after the override applied them. */
    kept: string[];
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
    return structuredClone(value);
}

/** Whether `value` is a plain object with at least one key. */
export function hasOverrideKeys(value: unknown): value is JsonObject {
    return isObject(value) && Object.keys(value).length > 0;
}

/** Whether `path` exists in `target` (walking plain objects only). */
export function hasPath(target: unknown, path: string[]): boolean {
    let current = target;
    for (const key of path) {
        if (!isObject(current) || !Object.prototype.hasOwnProperty.call(current, key)) {
            return false;
        }
        current = current[key];
    }
    return true;
}

/** The value at `path`, or `undefined`. */
export function getPath(target: unknown, path: string[]): unknown {
    let current = target;
    for (const key of path) {
        if (!isObject(current)) return undefined;
        current = current[key];
    }
    return current;
}

function setPath(target: JsonObject, path: string[], value: unknown): void {
    let current = target;
    for (const key of path.slice(0, -1)) {
        if (!isObject(current[key])) current[key] = {};
        current = current[key] as JsonObject;
    }
    current[path[path.length - 1] as string] = value;
}

function deletePath(target: JsonObject, path: string[]): void {
    const parent = getPath(target, path.slice(0, -1));
    if (isObject(parent)) delete parent[path[path.length - 1] as string];
}

/**
 * The leaf values an override sets. Objects are walked (they merge); arrays,
 * scalars and empty objects are leaves (they replace).
 */
export function overrideLeaves(override: object | undefined, base: string[] = []): OverrideLeaf[] {
    const leaves: OverrideLeaf[] = [];
    if (!override) return leaves;
    for (const [key, value] of Object.entries(override)) {
        const path = [...base, key];
        if (hasOverrideKeys(value)) leaves.push(...overrideLeaves(value, path));
        else leaves.push({ path, value });
    }
    return leaves;
}

/** The leaves of `previous` that `next` no longer sets. */
export function removedOverrideLeaves(
    previous: object | undefined,
    next: object | undefined
): OverrideLeaf[] {
    return overrideLeaves(previous).filter(leaf => !hasPath(next, leaf.path));
}

/** The leaves of `next` that `previous` did not set yet. */
export function addedOverrideLeaves(
    previous: object | undefined,
    next: object | undefined
): OverrideLeaf[] {
    return overrideLeaves(next).filter(leaf => !hasPath(previous, leaf.path));
}

/** Deep-merge `override` into `target` in place (objects merge, the rest replaces). */
export function applyOverride(target: JsonObject, override: object): void {
    for (const [key, value] of Object.entries(override)) {
        if (isObject(value)) {
            if (!isObject(target[key])) target[key] = {};
            applyOverride(target[key] as JsonObject, value);
        } else {
            target[key] = clone(value);
        }
    }
}

/** Deep-merge an override into a copy of `target` (for in-memory use). */
export function mergeOverride<T extends object>(target: T, override?: object): T {
    if (!override) return target;
    const next = clone(target) as JsonObject;
    applyOverride(next, override);
    return next as T;
}

/**
 * Revert override `leaves` from `target`, using `snapshot` (the original file)
 * to decide what each key goes back to:
 *
 * - the key still holds the override's value and the snapshot defines it: the
 *   snapshot value is restored (the original already had the key);
 * - the key still holds the override's value and the snapshot does not define
 *   it: the key is removed, along with any parent object the override created
 *   that is now empty;
 * - the key holds another value: it was edited after the override applied it,
 *   so it is kept.
 */
export function revertOverride(
    target: JsonObject,
    leaves: OverrideLeaf[],
    snapshot: unknown
): RevertOverrideResult {
    const result: RevertOverrideResult = { reverted: [], kept: [] };
    for (const leaf of leaves) {
        const key = leaf.path.join('.');
        if (!hasPath(target, leaf.path)) continue;
        if (!isDeepStrictEqual(getPath(target, leaf.path), leaf.value)) {
            result.kept.push(key);
            continue;
        }
        result.reverted.push(key);
        if (hasPath(snapshot, leaf.path)) {
            setPath(target, leaf.path, clone(getPath(snapshot, leaf.path)));
            continue;
        }
        deletePath(target, leaf.path);
        for (let depth = leaf.path.length - 1; depth > 0; depth--) {
            const parentPath = leaf.path.slice(0, depth);
            const parent = getPath(target, parentPath);
            if (!isObject(parent) || Object.keys(parent).length > 0) break;
            if (hasPath(snapshot, parentPath)) break;
            deletePath(target, parentPath);
        }
    }
    return result;
}

/**
 * Record the current values of newly overridden keys in `snapshot`, so a key
 * the user added after the snapshot was taken is restored (not removed) when the
 * override is dropped again.
 */
export function recordOverrideSnapshot(
    snapshot: JsonObject,
    current: unknown,
    leaves: OverrideLeaf[]
): void {
    for (const leaf of leaves) {
        if (hasPath(current, leaf.path)) {
            setPath(snapshot, leaf.path, clone(getPath(current, leaf.path)));
        } else if (hasPath(snapshot, leaf.path)) {
            deletePath(snapshot, leaf.path);
        }
    }
}

/** Whether a manifest value is a well-formed {@link AppliedOverride}. */
export function isAppliedOverride(value: unknown): value is AppliedOverride {
    return (
        isObject(value) &&
        TSCONFIG_OVERRIDE_KINDS.includes(value.kind as TsconfigOverrideKind) &&
        isObject(value.override)
    );
}
