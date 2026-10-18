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

/** Read the `version` field of a `package.json` (undefined when unreadable). */
function readPackageVersion(file: string): string | undefined {
    try {
        const pkg = JSON.parse(fs.readFileSync(file, 'utf-8')) as { version?: unknown };
        return typeof pkg.version === 'string' ? pkg.version : undefined;
    } catch {
        return undefined;
    }
}

/**
 * The version of the `@deltabox/toolchain` this project pins — from the nearest
 * `node_modules/@deltabox/toolchain/package.json`, else the nearest enclosing
 * `@deltabox/toolchain` package (so the toolchain repo resolves its own version
 * even before `dist` is built). `undefined` when the project doesn't pin the
 * toolchain at all, in which case only a global install / `npx` is available.
 *
 * A pinned project must never run a global `dbx`: a stale global install would
 * write older-format generated files, silently reverting the project's own.
 */
export function localToolchainVersion(cwd: string = process.cwd()): string | undefined {
    let dir = path.resolve(cwd);
    let ownVersion: string | undefined;
    for (;;) {
        const dependency = readPackageVersion(
            path.join(dir, 'node_modules', TOOLCHAIN_PACKAGE, 'package.json')
        );
        if (dependency) return dependency;

        const pkgPath = path.join(dir, 'package.json');
        if (ownVersion === undefined && fs.existsSync(pkgPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
                    name?: string;
                    version?: unknown;
                };
                if (pkg.name === TOOLCHAIN_PACKAGE && typeof pkg.version === 'string') {
                    ownVersion = pkg.version;
                }
            } catch {
                // Ignore a malformed package.json and keep walking up.
            }
        }

        const parent = path.dirname(dir);
        if (parent === dir) return ownVersion;
        dir = parent;
    }
}
