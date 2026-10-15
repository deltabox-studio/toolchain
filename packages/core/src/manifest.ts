import fs from 'node:fs';
import path from 'node:path';

import { toJson } from '@deltabox/toolchain-shared';

/** The manifest directory + file recording every file the tooling manages. */
export const MANIFEST_DIR = '.dbx/toolchain';
export const MANIFEST_FILE = 'manifest.json';

export interface Manifest {
    /** Repo-relative paths of every generated/managed file. */
    files: string[];
    /** ISO timestamp of the last successful sync (absent when never synced). */
    syncedAt?: string;
}

/** Read the manifest (`{ files: [] }` when missing/invalid). */
export function readManifest(cwd: string): Manifest {
    const file = path.resolve(cwd, MANIFEST_DIR, MANIFEST_FILE);
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<Manifest>;
        return {
            files: Array.isArray(parsed.files) ? parsed.files : [],
            ...(typeof parsed.syncedAt === 'string' ? { syncedAt: parsed.syncedAt } : {}),
        };
    } catch {
        return { files: [] };
    }
}

/** Write the manifest, creating the directory as needed. */
export function writeManifest(cwd: string, files: string[], syncedAt?: string): void {
    const file = path.resolve(cwd, MANIFEST_DIR, MANIFEST_FILE);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
        file,
        toJson({
            files: [...new Set(files)].sort(),
            syncedAt: syncedAt ?? new Date().toISOString(),
        }),
        'utf-8'
    );
}
