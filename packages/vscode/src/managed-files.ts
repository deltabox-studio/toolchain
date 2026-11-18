import path from 'node:path';

import { readManifest } from './manifest.js';

/** A directory that owns a `.dbx/toolchain/manifest.json`. */
export interface ManagedFileSource {
    dir: string;
}

/** Whether `file` is inside `dir` (or is the directory itself). */
export function isInsideDir(file: string, dir: string): boolean {
    const relative = path.relative(path.resolve(dir), path.resolve(file));
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Every managed file recorded across the project manifests, as absolute,
 * deduplicated paths. Each manifest stores its files relative to its own
 * project root.
 */
export function collectManagedFiles(projects: Iterable<ManagedFileSource>): string[] {
    const files = new Set<string>();
    for (const project of projects) {
        for (const file of readManifest(project.dir).files) {
            files.add(path.resolve(project.dir, file));
        }
    }
    return [...files];
}

/** The managed-file set, refreshed from the project manifests. */
export class ManagedFileIndex {
    private files = new Set<string>();

    /** Normalize a path for set lookups (Windows paths are case-insensitive). */
    private static key(file: string): string {
        const resolved = path.resolve(file);
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    }

    /** Re-read every manifest (duplicates across manifests collapse). */
    refresh(projects: Iterable<ManagedFileSource>): void {
        this.files = new Set(collectManagedFiles(projects).map(file => ManagedFileIndex.key(file)));
    }

    /** Whether an absolute file path is managed. */
    has(file: string): boolean {
        return this.files.has(ManagedFileIndex.key(file));
    }

    /** Number of managed files (used by tests and diagnostics). */
    get size(): number {
        return this.files.size;
    }
}

/**
 * The deepest project directory that contains `file`. Projects can be nested
 * (eg. a workspace root and its packages), so the longest match wins. Returns
 * `undefined` for files outside every project.
 */
export function deepestProjectDir(
    file: string,
    projects: Iterable<ManagedFileSource>
): string | undefined {
    const absolute = path.resolve(file);
    let best: string | undefined;
    for (const project of projects) {
        if (!isInsideDir(absolute, project.dir)) continue;
        const dir = path.resolve(project.dir);
        if (!best || dir.length > best.length) best = dir;
    }
    return best;
}
