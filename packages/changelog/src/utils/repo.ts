import { execFileSync } from 'node:child_process';
import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { logger } from '@deltabox/toolchain/shared';

/** Parse a JSON file, stripping a UTF-8 BOM (editors/PowerShell often add one). */
function parseJsonFile(file: string): unknown {
    return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

/**
 * Expand workspace globs into directories, honouring `!`-prefixed negations
 * (`['packages/*', '!packages/private-*']`). Node's `globSync` does not support
 * negation, so exclusions are removed from the collected set after matching.
 */
export function globWorkspaces(patterns: string[], root: string): string[] {
    const included = new Set<string>();
    const excluded = new Set<string>();
    for (const pattern of patterns) {
        if (pattern.startsWith('!')) {
            for (const match of globSync(pattern.slice(1), { cwd: root })) {
                excluded.add(resolve(root, match));
            }
        } else if (pattern === '.') {
            included.add(root);
        } else {
            for (const match of globSync(pattern, { cwd: root })) {
                included.add(resolve(root, match));
            }
        }
    }
    for (const dir of excluded) included.delete(dir);
    return [...included];
}

/** Every commit hash already referenced by a changelog file. */
export function readReleasedHashes(file: string): Set<string> {
    const hashes = new Set<string>();
    try {
        const text = readFileSync(file, 'utf8');
        for (const [, hash] of text.matchAll(/#([0-9a-f]{7,40})\b/gi)) {
            if (hash) hashes.add(hash.toLowerCase());
        }
    } catch {
        // A changelog we cannot read cannot vouch for any commit.
    }
    return hashes;
}

/** Whether a commit's full hash was already rendered (changelogs use short hashes). */
export function isCommitReleased(hash: string, released: ReadonlySet<string>): boolean {
    const full = hash.toLowerCase();
    if (released.has(full.slice(0, 7))) return true;
    for (const short of released) {
        if (full.startsWith(short)) return true;
    }
    return false;
}

/**
 * The monorepo root. Prefer the git repository root when it has a
 * `package.json` (so running from a nested workspace still finds the root
 * changelog and repository URL); otherwise the nearest ancestor with a
 * `package.json`. The `changelog` command normally runs at the project root, so
 * both cases resolve to the same directory there.
 */
export function repoRoot(): string {
    try {
        const top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
        if (top && existsSync(resolve(top, 'package.json'))) return top;
    } catch {
        // Not a git repository: fall back to the nearest package.json.
    }
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
export function discoverWorkspaceDirs(root = repoRoot()): string[] {
    const rootPkg = parseJsonFile(resolve(root, 'package.json')) as {
        workspaces?: string[] | { packages?: string[] };
    };
    const patterns = Array.isArray(rootPkg.workspaces)
        ? rootPkg.workspaces
        : (rootPkg.workspaces?.packages ?? []);
    const dirs = new Set<string>([root]);
    for (const dir of globWorkspaces(patterns, root)) {
        if (resolve(dir) === resolve(root)) continue;
        if (existsSync(resolve(dir, 'package.json'))) dirs.add(dir);
    }
    return [...dirs];
}

/** The version currently declared in the root package.json. */
export function readRootVersion(): string {
    const rootPackageJson = resolve(repoRoot(), 'package.json');
    const pkg = parseJsonFile(rootPackageJson) as { version?: string };
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
