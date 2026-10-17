/**
 * Locating a project's own `dbx` binary.
 *
 * The toolchain always prefers a project-local `dbx` over a global one, so the
 * version a project pins is the one that runs and a stale global install cannot
 * interfere. A consumer gets this from `node_modules/.bin/dbx`; a repo that *is*
 * the toolchain (dogfooding from source) has no such shim, so its own package
 * `bin` is used instead.
 */

import fs from 'node:fs';
import path from 'node:path';

/** The published toolchain package name. */
export const TOOLCHAIN_PACKAGE = '@deltabox/toolchain';

/**
 * The `bin.dbx` entry of the nearest enclosing `@deltabox/toolchain` package
 * (walking up from `cwd`), when the file exists on disk. Used to run the
 * toolchain repo's own CLI instead of a global `dbx`.
 */
export function findOwnCliEntry(cwd: string = process.cwd()): string | undefined {
    let dir = path.resolve(cwd);
    for (;;) {
        const pkgPath = path.join(dir, 'package.json');
        if (fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
                    name?: string;
                    bin?: string | Record<string, string>;
                };
                if (pkg.name === TOOLCHAIN_PACKAGE) {
                    const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.dbx;
                    if (bin) {
                        const entry = path.resolve(dir, bin);
                        if (fs.existsSync(entry)) return entry;
                    }
                }
            } catch {
                // Ignore a malformed package.json and keep walking up.
            }
        }
        const parent = path.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
}
