import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Walk up from a starting directory until a `package.json` is found. Falls back
 * to the module's own directory when nothing matches.
 */
export function findProjectRoot(start?: string): string {
    let dir = start ?? path.dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 12; i++) {
        if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
        const parent = path.resolve(dir, '..');
        if (parent === dir) break;
        dir = parent;
    }
    return start ?? path.dirname(fileURLToPath(import.meta.url));
}

/** Resolve the monorepo root from a module location by walking up. */
export function monorepoRoot(from?: string): string {
    return findProjectRoot(from);
}
