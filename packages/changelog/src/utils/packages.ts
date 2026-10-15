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
    name: string;
    from?: string;
    to?: string;
}

export interface DependencyDiff {
    added: DependencyChange[];
    updated: DependencyChange[];
    removed: DependencyChange[];
}

type DependencyMap = Map<string, string>;

/** Merge a package.json's dependency fields (and resolutions) into the map. */
function collectFromPackage(
    pkg: Record<string, unknown>,
    map: DependencyMap,
    catalog: DependencyMap
): void {
    for (const field of DEP_FIELDS) {
        const deps = pkg[field];
        if (!deps || typeof deps !== 'object') continue;
        for (const [name, version] of Object.entries(deps as Record<string, unknown>)) {
            const declared = String(version);
            // Resolve `catalog:` to the catalog's version so a catalog bump shows
            // up as an update on the packages that use it.
            map.set(name, declared === 'catalog:' ? (catalog.get(name) ?? declared) : declared);
        }
    }
    const resolutions = pkg.resolutions;
    if (resolutions && typeof resolutions === 'object') {
        for (const [name, version] of Object.entries(resolutions as Record<string, unknown>)) {
            map.set(`resolutions:${name}`, String(version));
        }
    }
}

/** Merge the `.yarnrc.yml` `catalog:` entries into the map (plain names). */
function collectFromYarnrc(content: string, map: DependencyMap): void {
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

/** The current dependency state (working tree package.jsons + the catalog). */
export function readCurrentDependencies(): DependencyMap {
    const root = repoRoot();
    const catalog: DependencyMap = new Map();
    try {
        collectFromYarnrc(readFileSync(resolve(root, '.yarnrc.yml'), 'utf8'), catalog);
    } catch {
        // no catalog
    }
    const map: DependencyMap = new Map(catalog);
    for (const dir of discoverWorkspaceDirs()) {
        try {
            collectFromPackage(
                JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8')),
                map,
                catalog
            );
        } catch {
            // skip unreadable package.json
        }
    }
    return map;
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

    const catalog: DependencyMap = new Map();
    try {
        const yarnrc = execFileSync('git', ['show', `${ref}:.yarnrc.yml`], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        });
        collectFromYarnrc(yarnrc, catalog);
    } catch {
        // no catalog at the ref
    }

    const map: DependencyMap = new Map(catalog);
    for (const file of files) {
        try {
            const content = execFileSync('git', ['show', `${ref}:${file}`], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
            });
            collectFromPackage(JSON.parse(content), map, catalog);
        } catch {
            // skip files not present at the ref
        }
    }
    return map;
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
    return a.name.localeCompare(b.name);
}

/** Diff two dependency maps into added / updated / removed entries. */
export function diffDependencies(prev: DependencyMap, next: DependencyMap): DependencyDiff {
    const added: DependencyChange[] = [];
    const updated: DependencyChange[] = [];
    const removed: DependencyChange[] = [];
    for (const [name, version] of next) {
        if (!prev.has(name)) added.push({ name, to: version });
        else if (prev.get(name) !== version)
            updated.push({ name, from: prev.get(name), to: version });
    }
    for (const [name, version] of prev) {
        if (!next.has(name)) removed.push({ name, from: version });
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
        for (const change of added) lines.push(`- \`${change.name}\` \`${change.to}\``);
    }
    if (updated.length > 0) {
        lines.push('#### Updated');
        for (const change of updated) {
            lines.push(`- \`${change.name}\` \`${change.from}\` → \`${change.to}\``);
        }
    }
    if (removed.length > 0) {
        lines.push('#### Removed');
        for (const change of removed) lines.push(`- \`${change.name}\``);
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
