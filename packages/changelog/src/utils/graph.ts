import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';

import { repoRoot } from './repo.js';

/** A project node in the generated `.dbx/toolchain/projects.json` graph. */
export interface ProjectGraphNode {
    name?: string;
    /** Directory relative to the repo root (`.` for the root). */
    dir: string;
    dependencies?: string[];
}

/** Read the generated project dependency graph, if present. */
export function readProjectGraph(root: string = repoRoot()): ProjectGraphNode[] | undefined {
    const file = resolve(root, '.dbx', 'toolchain', 'projects.json');
    if (!existsSync(file)) return undefined;
    try {
        const doc = JSON.parse(readFileSync(file, 'utf8')) as { projects?: ProjectGraphNode[] };
        return Array.isArray(doc.projects) ? doc.projects : undefined;
    } catch {
        return undefined;
    }
}

/** Normalize a graph/relative dir (`./x/` -> `x`, `` -> `.`). */
function normalizeDir(dir: string): string {
    const normalized = dir.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
    return normalized || '.';
}

/**
 * The repo-relative directories a workspace's changelog should watch: the
 * workspace itself **plus every workspace it transitively depends on** (from the
 * project graph). A change in a dependency is a change that affects this
 * workspace, so it belongs in its changelog.
 *
 * Falls back to just the workspace's own directory when there is no graph (eg.
 * `dbx projects` was never run).
 */
export function relatedWorkspacePaths(dir: string, root: string = repoRoot()): string[] {
    const own = normalizeDir(relative(root, dir));
    const graph = readProjectGraph(root);
    if (!graph) return [own];

    const byName = new Map<string, ProjectGraphNode>();
    const byDir = new Map<string, ProjectGraphNode>();
    for (const node of graph) {
        if (node.name) byName.set(node.name, node);
        byDir.set(normalizeDir(node.dir), node);
    }

    const start = byDir.get(own);
    if (!start) return [own];

    const seen = new Set<string>();
    const out: string[] = [];
    const visit = (node: ProjectGraphNode): void => {
        const nodeDir = normalizeDir(node.dir);
        if (seen.has(nodeDir)) return;
        seen.add(nodeDir);
        if (nodeDir !== '.') out.push(nodeDir);
        for (const dep of node.dependencies ?? []) {
            const depNode = byName.get(dep);
            if (depNode) visit(depNode);
        }
    };
    visit(start);
    return out.length > 0 ? out : [own];
}
