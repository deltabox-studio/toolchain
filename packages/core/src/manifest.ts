import fs from 'node:fs';
import path from 'node:path';

import { toJson } from '@deltabox/toolchain-shared';

/** The manifest directory + file recording every file the tooling manages. */
export const MANIFEST_DIR = '.dbx/toolchain';
export const MANIFEST_FILE = 'manifest.json';
/**
 * The last-sync timestamp lives in its own (gitignored) file so a sync never
 * dirties the committed `manifest.json`, which tracks only the file list.
 */
export const TIMESTAMPS_FILE = 'timestamps.json';

/** Whether dbx created a managed file or adopted a pre-existing one. */
export type FileOrigin = 'created' | 'adopted';

export interface Manifest {
    /** Repo-relative paths of every generated/managed file. */
    files: string[];
    /** Per-file origin, so a sync only deletes files that dbx created. */
    origins?: Record<string, FileOrigin>;
    /**
     * ISO timestamp of the last successful sync (absent when never synced).
     * Read from {@link TIMESTAMPS_FILE}, falling back to a legacy inline
     * `syncedAt` in the manifest until the next sync migrates it.
     */
    syncedAt?: string;
    /**
     * The `tsconfig.overrides` currently applied, keyed by the repo-relative
     * target file (`{ kind, override }`), so a removed override can be reverted.
     */
    tsconfigOverrides?: Record<string, unknown>;
    /**
     * The original (pre-override) tsconfig contents, nested by repo-relative
     * path (`{ packages: { core: { "tsconfig.build.json": { ... } } } }`).
     */
    snapshots?: Record<string, unknown>;
    /**
     * Task-defined metadata persisted across syncs (everything a task writes to
     * `SyncContext.manifest` that is not one of the reserved keys).
     */
    extras?: Record<string, unknown>;
}

/** Absolute path to a file in the manifest directory. */
function manifestDir(cwd: string): string {
    return path.resolve(cwd, MANIFEST_DIR);
}

/** Read + parse a JSON file in the manifest directory (`undefined` on failure). */
function readManifestJson<T>(cwd: string, name: string): T | undefined {
    try {
        return JSON.parse(
            fs.readFileSync(path.join(manifestDir(cwd), name), 'utf-8').replace(/^\uFEFF/, '')
        ) as T;
    } catch {
        return undefined;
    }
}

/**
 * The last-sync timestamp for a project: {@link TIMESTAMPS_FILE} first, then a
 * legacy `syncedAt` still embedded in `manifest.json` (pre-split). The fallback
 * keeps consumers correct until their next sync writes the split files.
 */
export function readSyncedAt(cwd: string): string | undefined {
    const timestamps = readManifestJson<{ syncedAt?: unknown }>(cwd, TIMESTAMPS_FILE);
    if (typeof timestamps?.syncedAt === 'string') return timestamps.syncedAt;
    const legacy = readManifestJson<{ syncedAt?: unknown }>(cwd, MANIFEST_FILE);
    return typeof legacy?.syncedAt === 'string' ? legacy.syncedAt : undefined;
}

/** Read the manifest (`{ files: [] }` when missing/invalid). */
export function readManifest(cwd: string): Manifest {
    const parsed = readManifestJson<Partial<Manifest>>(cwd, MANIFEST_FILE);
    const syncedAt = readSyncedAt(cwd);
    const origins =
        parsed?.origins && typeof parsed.origins === 'object' ? parsed.origins : undefined;
    const tsconfigOverrides =
        parsed?.tsconfigOverrides && typeof parsed.tsconfigOverrides === 'object'
            ? parsed.tsconfigOverrides
            : undefined;
    const snapshots =
        parsed?.snapshots && typeof parsed.snapshots === 'object' ? parsed.snapshots : undefined;
    const reserved = new Set(['files', 'origins', 'syncedAt', 'tsconfigOverrides', 'snapshots']);
    const extras = Object.fromEntries(
        Object.entries((parsed ?? {}) as Record<string, unknown>).filter(
            ([key]) => !reserved.has(key)
        )
    );
    return {
        files: Array.isArray(parsed?.files) ? parsed.files : [],
        ...(origins ? { origins } : {}),
        ...(tsconfigOverrides ? { tsconfigOverrides } : {}),
        ...(snapshots ? { snapshots } : {}),
        ...(Object.keys(extras).length > 0 ? { extras } : {}),
        ...(syncedAt ? { syncedAt } : {}),
    };
}

/**
 * Write the manifest (the file list only) plus the separate timestamp file,
 * creating the directory as needed. Rewriting `manifest.json` without
 * `syncedAt` is what migrates a legacy inline timestamp on the next sync.
 */
export function writeManifest(
    cwd: string,
    files: string[],
    syncedAt?: string,
    origins?: Record<string, FileOrigin>,
    extras?: Record<string, unknown>
): void {
    const dir = manifestDir(cwd);
    fs.mkdirSync(dir, { recursive: true });
    const unique = [...new Set(files)].sort();
    fs.writeFileSync(
        path.join(dir, MANIFEST_FILE),
        toJson({
            // Task metadata first, so it can never clobber `files`/`origins`.
            ...extras,
            files: unique,
            ...(origins
                ? {
                      origins: Object.fromEntries(
                          unique
                              .filter(file => origins[file] !== undefined)
                              .map(file => [file, origins[file]])
                      ),
                  }
                : {}),
        }),
        'utf-8'
    );
    fs.writeFileSync(
        path.join(dir, TIMESTAMPS_FILE),
        toJson({ syncedAt: syncedAt ?? new Date().toISOString() }),
        'utf-8'
    );
}
