import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { logger } from '@deltabox/toolchain-shared';

/**
 * The monorepo root: the nearest ancestor of the current working directory that
 * has a `package.json`. The `changelog` command runs at the project root, so
 * this resolves correctly both for the toolchain's own repo and for consumers
 * (resolving from the module location would land in `node_modules`).
 */
export function repoRoot(): string {
    let dir = process.cwd();
    for (let i = 0; i < 8; i++) {
        if (existsSync(resolve(dir, 'package.json'))) return dir;
        const parent = resolve(dir, '..');
        if (parent === dir) break;
        dir = parent;
    }
    return process.cwd();
}

/** Every workspace directory declared by the root `workspaces` globs (+ root). */
export function discoverWorkspaceDirs(): string[] {
    const root = repoRoot();
    const rootPkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
        workspaces?: string[];
    };
    const dirs = new Set<string>([root]);
    for (const pattern of rootPkg.workspaces ?? []) {
        if (pattern === '.') continue;
        for (const match of globSync(pattern, { cwd: root })) {
            const dir = resolve(root, match);
            if (existsSync(resolve(dir, 'package.json'))) dirs.add(dir);
        }
    }
    return [...dirs];
}

/** The version currently declared in the root package.json. */
export function readRootVersion(): string {
    const rootPackageJson = resolve(repoRoot(), 'package.json');
    const pkg = JSON.parse(readFileSync(rootPackageJson, 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
}

/**
 * Write `version` into every workspace package.json.
 *
 * Only the `"version"` value is replaced in place, so the bump never reorders or
 * drops other fields (eg. `bin`) or the file's formatting — keeping the version
 * commit to a minimal diff.
 */
export function writeVersion(version: string): void {
    for (const dir of discoverWorkspaceDirs()) {
        const file = resolve(dir, 'package.json');
        if (!existsSync(file)) continue;
        const content = readFileSync(file, 'utf8');
        const next = content.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
        if (next !== content) {
            writeFileSync(file, next, 'utf8');
            logger.info(`  bumped ${file}`);
        }
    }
}

/** Every existing CHANGELOG.md (root + workspaces). */
export function changelogFiles(): string[] {
    const root = repoRoot();
    return [
        resolve(root, 'CHANGELOG.md'),
        ...discoverWorkspaceDirs()
            .filter(dir => resolve(dir) !== resolve(root))
            .map(dir => resolve(dir, 'CHANGELOG.md')),
    ].filter(file => existsSync(file));
}
