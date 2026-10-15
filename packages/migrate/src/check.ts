/**
 * `--check` support: compare a migration's produced files against what is on
 * disk, so CI can fail when a project still needs migrating.
 */

import fs from 'node:fs';

import type { MigrationFile } from './types.js';

export type FileStatus = 'missing' | 'changed' | 'same';

export interface FileDiff {
    path: string;
    status: FileStatus;
}

/** Compare produced files against disk (`missing` / `changed` / `same`). */
export function diffFiles(files: MigrationFile[]): FileDiff[] {
    return files.map(file => {
        if (!fs.existsSync(file.path)) return { path: file.path, status: 'missing' };
        const current = fs.readFileSync(file.path, 'utf-8').replace(/^\uFEFF/, '');
        const expected = file.content.replace(/^\uFEFF/, '');
        return { path: file.path, status: current === expected ? 'same' : 'changed' };
    });
}

/** Whether any produced file is missing or out of date. */
export function hasPending(diffs: FileDiff[]): boolean {
    return diffs.some(diff => diff.status !== 'same');
}
