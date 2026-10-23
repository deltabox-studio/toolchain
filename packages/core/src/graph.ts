import fs from 'node:fs';
import path from 'node:path';

import { type PackageJson, readJsonAt, toJson } from '@deltabox/toolchain-shared';

import { findConfigFile } from './loader.js';

/** Directory names never descended into during discovery. */
export const IGNORED_DIRS = new Set([
    'node_modules',
    'dist',
    'build',
    'out',
    'coverage',
    'tmp',
    'temp',
    'vendor',
    'jspm_packages',
    'web_modules',
]);

/** The package managers a lock file can indicate. */
export type PackageManager = 'yarn' | 'npm' | 'pnpm' | 'bun';

/** One discovered package (a `package.json` and/or a dbx config directory). */
export interface ProjectNode {
    /** The package name (from `package.json`). */
    name?: string;
    /** Directory relative to the graph root (posix). */
    dir: string;
    /** Whether the directory contains a `dbx.config.*` file. */
    hasConfig: boolean;
    /** The dbx config path relative to the root (when present). */
    config?: string;
    /** Names of the other discovered projects this one depends on. */
    dependencies: string[];
}

/** The project dependency graph written to `.dbx/toolchain/projects.json`. */
export interface ProjectGraph {
    root: string;
    packageManager?: PackageManager;
    generatedAt: string;
    /** Every discovered package. */
    projects: ProjectNode[];
    /** The subset with a dbx config (what the tooling syncs). */
    dbxProjects: ProjectNode[];
    /** Dbx project dirs (relative) in dependency order (dependencies first). */
    order: string[];
}

export interface BuildProjectGraphOptions {
    /** Maximum directory depth to descend (default 5). */
    maxDepth?: number;
}

/** Should a directory be skipped during discovery? */
function shouldIgnore(name: string): boolean {
    return name.startsWith('.') || IGNORED_DIRS.has(name);
}

function childDirs(dir: string): string[] {
    try {
        // Never descend into a symlink/junction (a self-link would cycle) or a
        // generated/dependency directory.
        return fs
            .readdirSync(dir, { withFileTypes: true })
            .filter(
                entry => entry.isDirectory() && !entry.isSymbolicLink() && !shouldIgnore(entry.name)
            )
            .map(entry => path.join(dir, entry.name));
    } catch {
        return [];
    }
}

function rel(root: string, target: string): string {
    return path.relative(root, target).replace(/\\/g, '/') || '.';
}

/** Detect the package manager from the lock file present at the root. */
export function detectPackageManager(root: string): PackageManager | undefined {
    const has = (file: string): boolean => fs.existsSync(path.join(root, file));
    if (has('yarn.lock')) return 'yarn';
    if (has('pnpm-lock.yaml')) return 'pnpm';
    if (has('package-lock.json')) return 'npm';
    if (has('bun.lock') || has('bun.lockb')) return 'bun';
    return undefined;
}

const DEP_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
] as const;

/**
 * Recursively discover projects under `root` and build their dependency graph.
 * Skips `node_modules`, `.dbx/toolchain` and other common/generated directories.
 */
export function buildProjectGraph(
    root: string,
    options: BuildProjectGraphOptions = {}
): ProjectGraph {
    const maxDepth = options.maxDepth ?? 5;
    const nodes = new Map<string, ProjectNode>();
    const byName = new Map<string, string>();

    const walk = (dir: string, depth: number): void => {
        const pkg = readJsonAt<PackageJson>(dir, 'package.json');
        const config = findConfigFile(dir);
        if (pkg || config) {
            const node: ProjectNode = {
                ...(pkg?.name ? { name: pkg.name } : {}),
                dir: rel(root, dir),
                hasConfig: Boolean(config),
                ...(config ? { config: rel(root, config) } : {}),
                dependencies: [],
            };
            nodes.set(dir, node);
            if (pkg?.name) byName.set(pkg.name, dir);
        }
        if (depth >= maxDepth) return;
        for (const child of childDirs(dir)) walk(child, depth + 1);
    };
    walk(root, 0);

    for (const [dir, node] of nodes) {
        const pkg = readJsonAt<PackageJson>(dir, 'package.json');
        if (!pkg) continue;
        const deps = new Set<string>();
        for (const field of DEP_FIELDS) {
            const map = pkg[field];
            if (!map || typeof map !== 'object') continue;
            for (const depName of Object.keys(map)) {
                const depDir = byName.get(depName);
                if (depDir && depDir !== dir) deps.add(depName);
            }
        }
        node.dependencies = [...deps].sort();
    }

    const projects = [...nodes.values()].sort((a, b) => a.dir.localeCompare(b.dir));
    const dbxProjects = projects.filter(p => p.hasConfig);

    return {
        root,
        packageManager: detectPackageManager(root),
        generatedAt: new Date().toISOString(),
        projects,
        dbxProjects,
        order: orderProjects(dbxProjects),
    };
}

/**
 * Topologically order dbx projects so a dependency is always synced before its
 * dependents. Cycles (or missing edges) fall back to the input order.
 */
export function orderProjects(dbxProjects: ProjectNode[]): string[] {
    const dirByName = new Map<string, string>();
    for (const project of dbxProjects) {
        if (project.name) dirByName.set(project.name, project.dir);
    }
    const nodes = new Map(dbxProjects.map(project => [project.dir, project]));

    const visited = new Set<string>();
    const inStack = new Set<string>();
    const out: string[] = [];

    const visit = (dir: string): void => {
        if (visited.has(dir) || inStack.has(dir)) return; // visited, or cycle
        inStack.add(dir);
        const node = nodes.get(dir);
        for (const depName of node?.dependencies ?? []) {
            const depDir = dirByName.get(depName);
            if (depDir && nodes.has(depDir)) visit(depDir);
        }
        inStack.delete(dir);
        visited.add(dir);
        out.push(dir);
    };

    for (const project of dbxProjects) visit(project.dir);
    return out;
}

/** The path of the generated project graph for a root. */
export function projectGraphPath(root: string): string {
    return path.join(root, '.dbx', 'toolchain', 'projects.json');
}

/** Write the project graph to `<root>/.dbx/toolchain/projects.json`. */
export function writeProjectGraph(root: string, graph?: ProjectGraph): string {
    const file = projectGraphPath(root);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, toJson(graph ?? buildProjectGraph(root)), 'utf-8');
    return file;
}

/** Read the project graph for a root, or `undefined` when it does not exist. */
export function readProjectGraph(root: string): ProjectGraph | undefined {
    try {
        return JSON.parse(fs.readFileSync(projectGraphPath(root), 'utf-8')) as ProjectGraph;
    } catch {
        return undefined;
    }
}
