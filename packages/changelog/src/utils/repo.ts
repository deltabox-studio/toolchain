import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The monorepo root (found by walking up to the nearest package.json). */
export function repoRoot(): string {
    // Works from both the source location (scripts/changelog) and the compiled
    // location (scripts/dist/changelog).
    let dir = dirname(fileURLToPath(import.meta.url));
    for (let i = 0; i < 8; i++) {
        if (existsSync(resolve(dir, 'package.json'))) return dir;
        dir = resolve(dir, '..');
    }
    return dirname(fileURLToPath(import.meta.url));
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

/** Write `version` into every workspace package.json. */
export function writeVersion(version: string): void {
    for (const dir of discoverWorkspaceDirs()) {
        const file = resolve(dir, 'package.json');
        if (!existsSync(file)) continue;
        const pkg = JSON.parse(readFileSync(file, 'utf8')) as { version?: string };
        pkg.version = version;
        writeFileSync(file, `${JSON.stringify(pkg, null, 4)}\n`, 'utf8');
        console.log(`  bumped ${file}`);
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
