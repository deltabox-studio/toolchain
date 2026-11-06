import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { discoverWorkspaceDirs, repoRoot } from './repo.js';

const DEP_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
] as const;

export interface DependencyChange {
    /** The `package.json` name that declares the dependency (or the catalog root). */
    scope: string;
    name: string;
    from?: string;
    to?: string;
}

export interface DependencyDiff {
    added: DependencyChange[];
    updated: DependencyChange[];
    removed: DependencyChange[];
}

/** One declared dependency, scoped to the package.json that declares it. */
export interface DependencyEntry {
    scope: string;
    name: string;
    version: string;
}

export type DependencyMap = Map<string, DependencyEntry>;

/** A package-manager catalog (`package -> version range`). */
type CatalogMap = Map<string, string>;

/** The map key for a scoped dependency. */
function dependencyKey(scope: string, name: string): string {
    return `${scope}\u0000${name}`;
}

/** The scope for a package.json without a name. */
const UNNAMED_SCOPE = '<unnamed>';

/** The package.json name (the scope a dependency is reported under). */
function packageScope(pkg: Record<string, unknown>): string {
    return typeof pkg.name === 'string' && pkg.name.trim() ? pkg.name : UNNAMED_SCOPE;
}

/** Merge a package.json's dependency fields (and resolutions) into the map. */
function collectFromPackage(pkg: Record<string, unknown>, map: DependencyMap): void {
    const scope = packageScope(pkg);
    for (const field of DEP_FIELDS) {
        const deps = pkg[field];
        if (!deps || typeof deps !== 'object') continue;
        for (const [name, version] of Object.entries(deps as Record<string, unknown>)) {
            map.set(dependencyKey(scope, name), { scope, name, version: String(version) });
        }
    }
    const resolutions = pkg.resolutions;
    if (resolutions && typeof resolutions === 'object') {
        for (const [name, version] of Object.entries(resolutions as Record<string, unknown>)) {
            const key = `resolutions:${name}`;
            map.set(dependencyKey(scope, key), { scope, name: key, version: String(version) });
        }
    }
}

/** Merge the `.yarnrc.yml` `catalog:` entries into the map (plain names). */
function collectFromYarnrc(content: string, map: CatalogMap): void {
    let inCatalog = false;
    for (const line of content.split('\n')) {
        if (/^catalog:\s*$/.test(line)) {
            inCatalog = true;
            continue;
        }
        if (!inCatalog) continue;
        if (line.trim() === '') continue;
        if (!/^\s/.test(line)) {
            inCatalog = false;
            continue;
        }
        const match = /^\s+(?:"([^"]+)"|([^:\s]+)):\s*(.+?)\s*$/.exec(line);
        if (match) map.set(match[1] ?? match[2]!, match[3]!);
    }
}

/**
 * Build the dependency map from the workspace `package.json` files. Dependencies
 * are scoped to the package.json that declares them, so a workspace-specific pin
 * (eg. the docs site's Vite 5) is reported under that workspace instead of
 * masquerading as a repo-wide change. The catalog is a root-level declaration, so
 * it is scoped to the root package name.
 */
export function collectDependencies(
    packages: Record<string, unknown>[],
    catalog: CatalogMap = new Map(),
    catalogScope = 'catalog'
): DependencyMap {
    const map: DependencyMap = new Map();
    for (const pkg of packages) collectFromPackage(pkg, map);
    for (const [name, version] of catalog) {
        map.set(dependencyKey(catalogScope, name), { scope: catalogScope, name, version });
    }
    return map;
}

/** The current dependency state (working tree package.jsons + the catalog). */
export function readCurrentDependencies(): DependencyMap {
    const root = repoRoot();
    const catalog: CatalogMap = new Map();
    try {
        collectFromYarnrc(readFileSync(resolve(root, '.yarnrc.yml'), 'utf8'), catalog);
    } catch {
        // no catalog
    }
    const packages: Record<string, unknown>[] = [];
    let catalogScope = 'catalog';
    for (const dir of discoverWorkspaceDirs()) {
        try {
            const pkg = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')) as Record<
                string,
                unknown
            >;
            packages.push(pkg);
            if (resolve(dir) === resolve(root)) catalogScope = packageScope(pkg);
        } catch {
            // skip unreadable package.json
        }
    }
    return collectDependencies(packages, catalog, catalogScope);
}

/** The dependency state at a git ref, or undefined when the ref can't be read. */
export function readDependenciesAtRef(ref: string): DependencyMap | undefined {
    let files: string[];
    try {
        files = execFileSync('git', ['ls-tree', '-r', '--name-only', ref], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .split('\n')
            .map(line => line.trim())
            .filter(file => file === 'package.json' || file.endsWith('/package.json'));
    } catch {
        return undefined;
    }
    if (files.length === 0) return undefined;

    const catalog: CatalogMap = new Map();
    try {
        const yarnrc = execFileSync('git', ['show', `${ref}:.yarnrc.yml`], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        collectFromYarnrc(yarnrc, catalog);
    } catch {
        // no catalog at the ref
    }

    const packages: Record<string, unknown>[] = [];
    let catalogScope = 'catalog';
    for (const file of files) {
        try {
            const content = execFileSync('git', ['show', `${ref}:${file}`], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            });
            const pkg = JSON.parse(content) as Record<string, unknown>;
            packages.push(pkg);
            if (file === 'package.json') catalogScope = packageScope(pkg);
        } catch {
            // skip files not present at the ref
        }
    }
    return collectDependencies(packages, catalog, catalogScope);
}

/** Resolve the git ref for a released version (tag, then release commit). */
export function resolveVersionRef(version: string): string | undefined {
    for (const ref of [`v${version}`, version]) {
        try {
            execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], {
                stdio: ['ignore', 'pipe', 'ignore'],
            });
            return ref;
        } catch {
            // try the next ref
        }
    }
    try {
        const commit = execFileSync(
            'git',
            ['log', '--all', `--grep=version packages (${version})`, '--format=%H', '-1'],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim();
        if (commit) return commit;
    } catch {
        // no matching commit
    }
    return undefined;
}

function byName(a: DependencyChange, b: DependencyChange): number {
    return a.scope.localeCompare(b.scope) || a.name.localeCompare(b.name);
}

/** Diff two dependency maps into added / updated / removed entries. */
export function diffDependencies(prev: DependencyMap, next: DependencyMap): DependencyDiff {
    const added: DependencyChange[] = [];
    const updated: DependencyChange[] = [];
    const removed: DependencyChange[] = [];
    for (const [key, entry] of next) {
        const before = prev.get(key);
        if (!before) added.push({ scope: entry.scope, name: entry.name, to: entry.version });
        else if (before.version !== entry.version) {
            updated.push({
                scope: entry.scope,
                name: entry.name,
                from: before.version,
                to: entry.version,
            });
        }
    }
    for (const [key, entry] of prev) {
        if (!next.has(key)) {
            removed.push({ scope: entry.scope, name: entry.name, from: entry.version });
        }
    }
    return {
        added: added.sort(byName),
        updated: updated.sort(byName),
        removed: removed.sort(byName),
    };
}

/** Render the `### Package changes` footer, or '' when nothing changed. */
export function renderPackageChanges(diff: DependencyDiff): string {
    const { added, updated, removed } = diff;
    if (added.length === 0 && updated.length === 0 && removed.length === 0) return '';
    const lines = ['### Package changes'];
    if (added.length > 0) {
        lines.push('#### Added');
        for (const change of added) {
            lines.push(`- \`${change.scope}\` › \`${change.name}\` \`${change.to}\``);
        }
    }
    if (updated.length > 0) {
        lines.push('#### Updated');
        for (const change of updated) {
            lines.push(
                `- \`${change.scope}\` › \`${change.name}\` \`${change.from}\` → \`${change.to}\``
            );
        }
    }
    if (removed.length > 0) {
        lines.push('#### Removed');
        for (const change of removed) {
            lines.push(`- \`${change.scope}\` › \`${change.name}\` \`${change.from}\``);
        }
    }
    return lines.join('\n');
}

/** Package changes between two released versions (both must have a git ref). */
export function packageChangesForVersion(version: string, previousVersion: string): string {
    const nextRef = resolveVersionRef(version);
    const prevRef = resolveVersionRef(previousVersion);
    if (!nextRef || !prevRef) return '';
    const next = readDependenciesAtRef(nextRef);
    const prev = readDependenciesAtRef(prevRef);
    if (!next || !prev) return '';
    return renderPackageChanges(diffDependencies(prev, next));
}

/** Package changes for the (unreleased) working tree vs the last released version. */
export function packageChangesForCurrent(previousVersion: string): string {
    const prevRef = resolveVersionRef(previousVersion);
    if (!prevRef) return '';
    const prev = readDependenciesAtRef(prevRef);
    if (!prev) return '';
    return renderPackageChanges(diffDependencies(prev, readCurrentDependencies()));
}
