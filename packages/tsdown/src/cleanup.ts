import fs from 'node:fs';
import path from 'node:path';

import { Glob } from 'glob';

import { logger } from '@deltabox/toolchain-shared';

export interface CleanupOptions {
    /** Directory to search from (default `process.cwd()`). */
    cwd?: string;
    /** Glob patterns to ignore (default `['**\/node_modules\/**']`). */
    ignore?: string[];
    /** Return the removed paths instead of logging each one. */
    silent?: boolean;
}

/**
 * Remove files/directories matching `patterns` from `cwd`. Used by the
 * `cleanup` (build) and `cleanup:turbo` commands.
 */
export function cleanup(
    type: string,
    patterns: string | string[],
    options: CleanupOptions = {}
): string[] {
    const list = Array.isArray(patterns) ? patterns : [patterns];
    if (!list.length) {
        if (!options.silent) logger.info(`Search pattern not provided. Skipping ${type} cleanup.`);
        return [];
    }

    const cwd = options.cwd ?? process.cwd();
    const files = new Glob(list, {
        cwd,
        dot: true,
        ignore: options.ignore ?? ['**/node_modules/**'],
    }).walkSync();

    if (!files.length) {
        if (!options.silent) logger.info(`No ${type} artifacts found. Skipping cleanup.`);
        return [];
    }

    if (!options.silent) logger.info(`Cleaning up ${type} artifacts:`);
    const removed: string[] = [];
    for (const file of files) {
        fs.rmSync(path.resolve(cwd, file), { recursive: true, force: true });
        removed.push(file);
        if (!options.silent) logger.info(`  - ${file}`);
    }
    return removed;
}
