import fs from 'node:fs';
import path from 'node:path';

export const MANIFEST = path.join('.dbx', 'toolchain', 'manifest.json');
const TIMESTAMPS = path.join('.dbx', 'toolchain', 'timestamps.json');

/** Read and parse a JSON file (BOM tolerated); `undefined` when unreadable. */
export function readJson<T>(file: string): T | undefined {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '')) as T;
    } catch {
        return undefined;
    }
}

/** The tracked/generated file manifest for a project. */
export interface ProjectManifest {
    files: string[];
    syncedAt?: string;
    /** Workflow paths dbx left untouched, mapped to the config key that owns them. */
    workflowConflicts?: Record<string, string>;
}

/** Read the tracked/generated file manifest for a project dir, if present. */
export function readManifest(dir: string): ProjectManifest {
    const doc = readJson<{
        files?: string[];
        syncedAt?: string;
        workflowConflicts?: Record<string, string>;
    }>(path.join(dir, MANIFEST));
    // The last-sync time lives in its own (gitignored) file; fall back to a
    // legacy inline `syncedAt` until the next sync migrates it.
    const timestamps = readJson<{ syncedAt?: string }>(path.join(dir, TIMESTAMPS));
    const syncedAt = timestamps?.syncedAt ?? doc?.syncedAt;
    return {
        files: doc?.files ?? [],
        ...(syncedAt ? { syncedAt } : {}),
        ...(doc?.workflowConflicts ? { workflowConflicts: doc.workflowConflicts } : {}),
    };
}
