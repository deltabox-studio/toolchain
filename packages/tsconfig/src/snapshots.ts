/**
 * Original tsconfig snapshots, stored in `.dbx/toolchain/manifest.json` under a
 * top-level `snapshots` field. The tree mirrors the repo-relative path (never an
 * absolute one: the manifest is the tracked file under `.dbx`), eg.:
 *
 * ```json
 * {
 *     "snapshots": {
 *         "tsconfig.base.json": { "compilerOptions": {} },
 *         "packages": { "core": { "tsconfig.default.json": { "compilerOptions": {} } } }
 *     }
 * }
 * ```
 *
 * Overrides patch user-owned tsconfigs; the snapshot is what the file held
 * before, so removing an override (or `dbx tsconfig --restore`) can tell which
 * keys the override added and which the original already defined.
 */

import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import { warningMessage } from '@deltabox/toolchain-shared';

import {
    isAppliedOverride,
    type OverridesState,
    overrideLeaves,
    revertOverride,
    type TsconfigOverrideKind,
} from './overrides.js';
import { parseTsconfig } from './resolve.js';

/** The nested snapshot tree stored in the manifest. */
export type SnapshotTree = Record<string, unknown>;

/** The manifest location, relative to the project root. */
export const TSCONFIG_MANIFEST_PATH = '.dbx/toolchain/manifest.json';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function segments(relative: string): string[] {
    return relative.replace(/\\/g, '/').split('/').filter(Boolean);
}

/**
 * The repo-relative POSIX path of `file`, or `undefined` when it lies outside
 * `cwd` (the manifest only ever stores relative, in-repo paths).
 */
export function toRepoRelative(cwd: string, file: string): string | undefined {
    const relative = path.relative(cwd, path.resolve(cwd, file));
    if (!relative || path.isAbsolute(relative)) return undefined;
    const posix = relative.replace(/\\/g, '/');
    if (posix === '..' || posix.startsWith('../')) return undefined;
    return posix;
}

/** Read one snapshot by repo-relative path. */
export function getSnapshot(tree: SnapshotTree | undefined, relative: string): unknown {
    let current: unknown = tree;
    for (const segment of segments(relative)) {
        if (!isObject(current) || !Object.prototype.hasOwnProperty.call(current, segment)) {
            return undefined;
        }
        current = current[segment];
    }
    return current;
}

/** Store one snapshot (parsed tsconfig JSON) under its repo-relative path. */
export function setSnapshot(tree: SnapshotTree, relative: string, value: unknown): void {
    const parts = segments(relative);
    let current = tree;
    for (const segment of parts.slice(0, -1)) {
        if (!isObject(current[segment])) current[segment] = {};
        current = current[segment] as JsonObject;
    }
    current[parts[parts.length - 1] as string] = value;
}

/** Delete one snapshot, pruning the parent directories it leaves empty. */
export function deleteSnapshot(tree: SnapshotTree, relative: string): void {
    const parts = segments(relative);
    const walk = (current: JsonObject, index: number): void => {
        const segment = parts[index] as string;
        if (!Object.prototype.hasOwnProperty.call(current, segment)) return;
        if (index === parts.length - 1) {
            delete current[segment];
            return;
        }
        const child = current[segment];
        if (!isObject(child)) return;
        walk(child, index + 1);
        if (Object.keys(child).length === 0) delete current[segment];
    };
    walk(tree, 0);
}

/** The JSON indentation used by `text` (falls back to `fallback`). */
export function detectIndent(text: string, fallback: number | string = 4): number | string {
    const match = /^([ \t]+)["}\]]/m.exec(text);
    if (!match) return fallback;
    const indent = match[1] as string;
    return indent.includes('\t') ? '\t' : indent.length;
}

/** Serialize a tsconfig the way the sync task writes it. */
export function stringifyTsconfig(value: unknown, indent: number | string): string {
    return `${JSON.stringify(value, null, indent)}\n`;
}

export interface RestoreTsconfigOverridesOptions {
    /** The project root holding `.dbx/toolchain/manifest.json`. */
    cwd: string;
    /** Only restore the files of this override kind (default: every kind). */
    kind?: TsconfigOverrideKind;
    /** Report what would change without writing anything. */
    dryRun?: boolean;
    /** Warning sink (default: none). */
    warn?: (message: string, id?: string) => void;
}

export interface RestoreTsconfigOverridesResult {
    /** Repo-relative files whose override content was removed. */
    restored: string[];
    /** Repo-relative files skipped because they no longer exist. */
    missing: string[];
    /** The kinds of the restored files. */
    kinds: TsconfigOverrideKind[];
}

/**
 * Remove the applied `tsconfig.overrides` content from the target files, using
 * their snapshots to restore the keys the original files already defined. The
 * files themselves are never deleted (something else may depend on them), and
 * keys edited after the override applied them are kept. The restored entries
 * are dropped from the manifest's `tsconfigOverrides` and `snapshots`.
 */
export function restoreTsconfigOverrides(
    options: RestoreTsconfigOverridesOptions
): RestoreTsconfigOverridesResult {
    const { cwd, kind, dryRun = false, warn = () => {} } = options;
    const result: RestoreTsconfigOverridesResult = { restored: [], missing: [], kinds: [] };
    const manifestFile = path.join(cwd, TSCONFIG_MANIFEST_PATH);
    let manifest: JsonObject;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf-8')) as JsonObject;
    } catch {
        return result;
    }
    const state = (isObject(manifest.tsconfigOverrides) ? manifest.tsconfigOverrides : {}) as
        | OverridesState
        | JsonObject;
    const snapshots = (isObject(manifest.snapshots) ? manifest.snapshots : {}) as SnapshotTree;

    for (const [relative, applied] of Object.entries(state)) {
        if (!isAppliedOverride(applied)) continue;
        if (kind && applied.kind !== kind) continue;
        const file = toRepoRelative(cwd, relative);
        if (!file) {
            warn(
                warningMessage('tsconfig.outside-root', { file: relative }),
                'tsconfig.outside-root'
            );
            continue;
        }
        const abs = path.resolve(cwd, file);
        if (!fs.existsSync(abs)) {
            warn(
                warningMessage('tsconfig.missing-file', { file, kind: applied.kind }),
                'tsconfig.missing-file'
            );
            result.missing.push(file);
            continue;
        }
        const text = fs.readFileSync(abs, 'utf-8');
        const before = parseTsconfig(text) as JsonObject;
        const data = structuredClone(before);
        const reverted = revertOverride(
            data,
            overrideLeaves(applied.override),
            getSnapshot(snapshots, file)
        );
        for (const key of reverted.kept) {
            warn(
                warningMessage('tsconfig.override-edited', { file, key }),
                'tsconfig.override-edited'
            );
        }
        if (!dryRun && !isDeepStrictEqual(before, data)) {
            fs.writeFileSync(abs, stringifyTsconfig(data, detectIndent(text)), 'utf-8');
        }
        delete (state as JsonObject)[relative];
        deleteSnapshot(snapshots, file);
        result.restored.push(file);
        if (!result.kinds.includes(applied.kind)) result.kinds.push(applied.kind);
    }

    if (result.restored.length > 0 && !dryRun) {
        if (Object.keys(state).length > 0) manifest.tsconfigOverrides = state;
        else delete manifest.tsconfigOverrides;
        if (Object.keys(snapshots).length > 0) manifest.snapshots = snapshots;
        else delete manifest.snapshots;
        const indent = detectIndent(fs.readFileSync(manifestFile, 'utf-8'));
        fs.writeFileSync(manifestFile, stringifyTsconfig(manifest, indent), 'utf-8');
    }
    return result;
}
