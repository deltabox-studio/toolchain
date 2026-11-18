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
    const doc = readJson<Record<string, unknown>>(path.join(dir, MANIFEST));
    // The last-sync time lives in its own (gitignored) file; fall back to a
    // legacy inline `syncedAt` until the next sync migrates it.
    const timestamps = readJson<{ syncedAt?: unknown }>(path.join(dir, TIMESTAMPS));
    const syncedAt =
        typeof timestamps?.syncedAt === 'string'
            ? timestamps.syncedAt
            : typeof doc?.syncedAt === 'string'
              ? doc.syncedAt
              : undefined;
    const workflowConflicts =
        doc?.workflowConflicts &&
        typeof doc.workflowConflicts === 'object' &&
        !Array.isArray(doc.workflowConflicts)
            ? (doc.workflowConflicts as Record<string, string>)
            : undefined;
    return {
        // A hand-edited or older manifest may hold a non-array; never leak it
        // into the index (which iterates every entry as a path).
        files: Array.isArray(doc?.files)
            ? doc.files.filter((file): file is string => typeof file === 'string')
            : [],
        ...(syncedAt ? { syncedAt } : {}),
        ...(workflowConflicts ? { workflowConflicts } : {}),
    };
}
