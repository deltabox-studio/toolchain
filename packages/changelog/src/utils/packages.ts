import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { readJsonFile } from '@deltabox/toolchain/shared';

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

/** A package-manager catalog entry (`name` may be qualified with its catalog). */
interface CatalogEntry {
    name: string;
    version: string;
}

/** A package-manager catalog (`package -> version range`). */
type CatalogMap = Map<string, CatalogEntry>;

/** The map key for a catalog dependency (named catalogs keep distinct keys). */
function catalogKey(catalog: string | undefined, name: string): string {
    return catalog ? `${catalog}\u0000${name}` : name;
}

/** The displayed catalog dependency name (`react`, or `react17:react`). */
function catalogEntry(catalog: string | undefined, name: string, version: string): CatalogEntry {
    return { name: catalog ? `${catalog}:${name}` : name, version };
}

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

/** The leading indentation width of a YAML line (tabs count as two spaces). */
function indentWidth(line: string): number {
    const match = /^\s*/.exec(line);
    return match ? match[0].replace(/\t/g, '  ').length : 0;
}

/** Parse a `name: version` YAML catalog line. */
function parseCatalogLine(line: string): { name: string; version: string } | undefined {
    const match = /^\s*(?:"([^"]+)"|'([^']+)'|([^:\s]+)):\s*(.*?)\s*$/.exec(line);
    const name = match?.[1] ?? match?.[2] ?? match?.[3];
    if (!name) return undefined;
    let version = (match?.[4] ?? '').trim();
    if (!version || version.startsWith('#')) return undefined;
    version = version.replace(/\s+#.*$/, '').trim();
    if (
        (version.startsWith('"') && version.endsWith('"')) ||
        (version.startsWith("'") && version.endsWith("'"))
    ) {
        version = version.slice(1, -1);
    }
    return version ? { name, version } : undefined;
}

/** A catalog header line (`catalog:` / `catalogs:` / `react17:`). */
function catalogHeader(line: string): string | undefined {
    const match = /^\s*(?:"([^"]+)"|'([^']+)'|([^:\s]+)):\s*(?:#.*)?$/.exec(line);
    return match?.[1] ?? match?.[2] ?? match?.[3];
}

/**
 * Merge the `catalog:` / `catalogs:` blocks of `.yarnrc.yml` or
 * `pnpm-workspace.yaml` into the map. Named catalogs are kept distinct.
 */
function collectFromYamlCatalogs(content: string, map: CatalogMap): void {
    let section: 'catalog' | 'catalogs' | undefined;
    let currentCatalog: string | undefined;
    let catalogIndent = 0;
    for (const line of content.replace(/^\uFEFF/, '').split(/\r?\n/)) {
        if (!line.trim() || line.trimStart().startsWith('#')) continue;
        const indent = indentWidth(line);
        const trimmed = line.trim();
        if (indent === 0) {
            if (/^catalog\s*:/.test(trimmed)) {
                section = 'catalog';
                currentCatalog = undefined;
            } else if (/^catalogs\s*:/.test(trimmed)) {
                section = 'catalogs';
                currentCatalog = undefined;
            } else {
                section = undefined;
                currentCatalog = undefined;
            }
            continue;
        }
        if (section === 'catalog') {
            const entry = parseCatalogLine(line);
            if (entry) {
                map.set(
                    catalogKey(undefined, entry.name),
                    catalogEntry(undefined, entry.name, entry.version)
                );
            }
            continue;
        }
        if (section !== 'catalogs') continue;
        if (currentCatalog === undefined || indent <= catalogIndent) {
            currentCatalog = catalogHeader(line);
            catalogIndent = indent;
            continue;
        }
        const entry = parseCatalogLine(line);
        if (entry) {
            map.set(
                catalogKey(currentCatalog, entry.name),
                catalogEntry(currentCatalog, entry.name, entry.version)
            );
        }
    }
}

/** Merge a JSON catalog object (`package -> version range`) into the map. */
function collectFromCatalogObject(
    catalog: string | undefined,
    value: unknown,
    map: CatalogMap
): void {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [name, version] of Object.entries(value as Record<string, unknown>)) {
        if (typeof version !== 'string') continue;
        map.set(catalogKey(catalog, name), catalogEntry(catalog, name, version));
    }
}

/** Merge Bun's `workspaces.catalog(s)` (and top-level equivalents) into the map. */
function collectFromPackageCatalogs(pkg: Record<string, unknown>, map: CatalogMap): void {
    const workspaces = pkg.workspaces;
    const ws =
        workspaces && typeof workspaces === 'object' && !Array.isArray(workspaces)
            ? (workspaces as Record<string, unknown>)
            : undefined;
    collectFromCatalogObject(undefined, ws?.catalog ?? pkg.catalog, map);
    const named = ws?.catalogs ?? pkg.catalogs;
    if (!named || typeof named !== 'object' || Array.isArray(named)) return;
    for (const [catalog, value] of Object.entries(named as Record<string, unknown>)) {
        collectFromCatalogObject(catalog, value, map);
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
    for (const [key, entry] of catalog) {
        map.set(dependencyKey(catalogScope, key), {
            scope: catalogScope,
            name: entry.name,
            version: entry.version,
        });
    }
    return map;
}

/** The current dependency state (working tree package.jsons + catalogs). */
export function readCurrentDependencies(): DependencyMap {
    const root = repoRoot();
    const catalog: CatalogMap = new Map();
    for (const file of ['.yarnrc.yml', 'pnpm-workspace.yaml']) {
        try {
            collectFromYamlCatalogs(readFileSync(resolve(root, file), 'utf8'), catalog);
        } catch {
            // no catalog in this file
        }
    }
    const packages: Record<string, unknown>[] = [];
    let catalogScope = 'catalog';
    for (const dir of discoverWorkspaceDirs()) {
        const pkg = readJsonFile<Record<string, unknown>>(resolve(dir, 'package.json'));
        if (!pkg) continue;
        packages.push(pkg);
        if (resolve(dir) === resolve(root)) {
            catalogScope = packageScope(pkg);
            collectFromPackageCatalogs(pkg, catalog);
        }
    }
    return collectDependencies(packages, catalog, catalogScope);
}

/** Read the package.json/catalog files at a git ref with one ls-tree + cat-file batch. */
function readDependencyFilesAtRef(ref: string): Map<string, string> | undefined {
    let tree: string;
    try {
        tree = execFileSync('git', ['ls-tree', '-r', ref], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            maxBuffer: 128 * 1024 * 1024,
        });
    } catch {
        return undefined;
    }

    const pathsBySha = new Map<string, string[]>();
    const shas: string[] = [];
    for (const line of tree.split('\n')) {
        const tab = line.indexOf('\t');
        if (tab === -1) continue;
        const meta = line.slice(0, tab).split(' ');
        const type = meta[1];
        const sha = meta[2];
        const file = line.slice(tab + 1);
        if (!sha || type !== 'blob') continue;
        if (
            file !== 'package.json' &&
            !file.endsWith('/package.json') &&
            file !== '.yarnrc.yml' &&
            file !== 'pnpm-workspace.yaml'
        ) {
            continue;
        }
        const paths = pathsBySha.get(sha);
        if (paths) {
            paths.push(file);
            continue;
        }
        pathsBySha.set(sha, [file]);
        shas.push(sha);
    }
    if (shas.length === 0) return undefined;

    let output: Buffer;
    try {
        output = execFileSync('git', ['cat-file', '--batch'], {
            input: `${shas.join('\n')}\n`,
            stdio: ['pipe', 'pipe', 'ignore'],
            maxBuffer: 128 * 1024 * 1024,
        });
    } catch {
        return undefined;
    }

    const files = new Map<string, string>();
    let offset = 0;
    for (const sha of shas) {
        const newline = output.indexOf(0x0a, offset);
        if (newline === -1) break;
        const header = output.subarray(offset, newline).toString('utf8').split(' ');
        const size = Number(header[2]);
        if (header[1] !== 'blob' || !Number.isFinite(size)) {
            offset = newline + 1;
            continue;
        }
        const start = newline + 1;
        const end = start + size;
        const content = output.subarray(start, end).toString('utf8');
        offset = end + 1;
        for (const file of pathsBySha.get(sha) ?? []) files.set(file, content);
    }
    return files;
}

const dependencyAtRefCache = new Map<string, DependencyMap | undefined>();

/** The dependency state at a git ref, or undefined when the ref can't be read. */
export function readDependenciesAtRef(ref: string): DependencyMap | undefined {
    const key = `${process.cwd()}::${ref}`;
    if (dependencyAtRefCache.has(key)) return dependencyAtRefCache.get(key);
    const files = readDependencyFilesAtRef(ref);
    let result: DependencyMap | undefined;
    if (files) {
        const catalog: CatalogMap = new Map();
        for (const file of ['.yarnrc.yml', 'pnpm-workspace.yaml']) {
            const content = files.get(file);
            if (content) collectFromYamlCatalogs(content, catalog);
        }

        const packages: Record<string, unknown>[] = [];
        let catalogScope = 'catalog';
        for (const [file, content] of files) {
            if (!(file === 'package.json' || file.endsWith('/package.json'))) continue;
            try {
                const pkg = JSON.parse(content.replace(/^\uFEFF/, '')) as Record<string, unknown>;
                packages.push(pkg);
                if (file === 'package.json') {
                    catalogScope = packageScope(pkg);
                    collectFromPackageCatalogs(pkg, catalog);
                }
            } catch {
                // skip files not present at the ref
            }
        }
        if (packages.length > 0) {
            result = collectDependencies(packages, catalog, catalogScope);
        }
    }
    dependencyAtRefCache.set(key, result);
    return result;
}

const versionRefCache = new Map<string, string | undefined>();

/** Resolve the git ref for a released version (tag, then release commit). */
export function resolveVersionRef(version: string): string | undefined {
    const key = `${process.cwd()}::${version}`;
    if (versionRefCache.has(key)) return versionRefCache.get(key);
    const resolved = findVersionRef(version);
    versionRefCache.set(key, resolved);
    return resolved;
}

let tagNamesCache: { cwd: string; names: Set<string> } | undefined;

/** One `git tag --list` pass; ref names cannot contain spaces. */
function tagNames(): Set<string> {
    const cwd = process.cwd();
    if (tagNamesCache?.cwd === cwd) return tagNamesCache.names;
    let names: Set<string>;
    try {
        names = new Set(
            execFileSync('git', ['tag', '--list'], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore'],
                maxBuffer: 64 * 1024 * 1024,
            })
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean)
        );
    } catch {
        names = new Set();
    }
    tagNamesCache = { cwd, names };
    return names;
}

let releaseRefsCache: { cwd: string; refs: Map<string, string> } | undefined;

/** Version -> first `version packages (<version>)` commit (one `git log` pass). */
function releaseRefs(): Map<string, string> {
    const cwd = process.cwd();
    if (releaseRefsCache?.cwd === cwd) return releaseRefsCache.refs;
    const refs = new Map<string, string>();
    try {
        const out = execFileSync('git', ['log', '--all', '--format=%H%x1f%s'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            maxBuffer: 128 * 1024 * 1024,
        });
        for (const line of out.split('\n')) {
            const separator = line.indexOf('\x1f');
            if (separator === -1) continue;
            const match = /version packages \(([^)]+)\)/.exec(line.slice(separator + 1));
            if (!match?.[1] || refs.has(match[1])) continue;
            refs.set(match[1], line.slice(0, separator));
        }
    } catch {
        // no release commits
    }
    releaseRefsCache = { cwd, refs };
    return refs;
}

function findVersionRef(version: string): string | undefined {
    const tags = tagNames();
    if (tags.has(`v${version}`)) return `v${version}`;
    if (tags.has(version)) return version;
    return releaseRefs().get(version);
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

/** Group changes under one top-level list item per declaring package. */
function groupedChanges(
    changes: DependencyChange[],
    detail: (change: DependencyChange) => string
): string[] {
    const groups = new Map<string, DependencyChange[]>();
    for (const change of changes) {
        const group = groups.get(change.scope) ?? [];
        group.push(change);
        groups.set(change.scope, group);
    }
    const lines: string[] = [];
    for (const [scope, entries] of groups) {
        lines.push(`- \`${scope}\``);
        for (const entry of entries) lines.push(`  - ${detail(entry)}`);
    }
    return lines;
}

/** Render the `### Package changes` footer, or '' when nothing changed. */
export function renderPackageChanges(diff: DependencyDiff): string {
    const { added, updated, removed } = diff;
    if (added.length === 0 && updated.length === 0 && removed.length === 0) return '';
    const lines = ['### Package changes'];
    if (added.length > 0) {
        lines.push('', '#### Added');
        lines.push(...groupedChanges(added, change => `\`${change.name}\` \`${change.to}\``));
    }
    if (updated.length > 0) {
        lines.push('', '#### Updated');
        lines.push(
            ...groupedChanges(
                updated,
                change => `\`${change.name}\` \`${change.from}\` → \`${change.to}\``
            )
        );
    }
    if (removed.length > 0) {
        lines.push('', '#### Removed');
        lines.push(...groupedChanges(removed, change => `\`${change.name}\` \`${change.from}\``));
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
