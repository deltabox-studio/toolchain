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

export interface Manifest {
    /** Repo-relative paths of every generated/managed file. */
    files: string[];
    /**
     * ISO timestamp of the last successful sync (absent when never synced).
     * Read from {@link TIMESTAMPS_FILE}, falling back to a legacy inline
     * `syncedAt` in the manifest until the next sync migrates it.
     */
    syncedAt?: string;
}

/** Absolute path to a file in the manifest directory. */
function manifestDir(cwd: string): string {
    return path.resolve(cwd, MANIFEST_DIR);
}

/** Read + parse a JSON file in the manifest directory (`undefined` on failure). */
function readManifestJson<T>(cwd: string, name: string): T | undefined {
    try {
        return JSON.parse(fs.readFileSync(path.join(manifestDir(cwd), name), 'utf-8')) as T;
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
    return {
        files: Array.isArray(parsed?.files) ? parsed.files : [],
        ...(syncedAt ? { syncedAt } : {}),
    };
}

/**
 * Write the manifest (the file list only) plus the separate timestamp file,
 * creating the directory as needed. Rewriting `manifest.json` without
 * `syncedAt` is what migrates a legacy inline timestamp on the next sync.
 */
export function writeManifest(cwd: string, files: string[], syncedAt?: string): void {
    const dir = manifestDir(cwd);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
        path.join(dir, MANIFEST_FILE),
        toJson({ files: [...new Set(files)].sort() }),
        'utf-8'
    );
    fs.writeFileSync(
        path.join(dir, TIMESTAMPS_FILE),
        toJson({ syncedAt: syncedAt ?? new Date().toISOString() }),
        'utf-8'
    );
}
