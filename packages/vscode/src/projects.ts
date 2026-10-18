import fs from 'node:fs';
import path from 'node:path';

import * as vscode from 'vscode';

const CONFIG_PREFIX = 'dbx.config.';
const PROJECT_GROUPS = ['packages', 'apps', 'sdk'];
const MANIFEST = path.join('.dbx', 'toolchain', 'manifest.json');

export interface Project {
    kind: 'project';
    /** Absolute project directory. */
    dir: string;
    /** Package name (falling back to the directory name). */
    label: string;
    /** Workspace-relative path. */
    relativePath: string;
    /** Package name when available. */
    packageName?: string;
    /** Project kind inferred from graph location/files. */
    type: 'monorepo-root' | 'monorepo-workspace' | 'project';
    /** Whether the directory has a `dbx.config.*` (syncable). */
    hasConfig: boolean;
    /** Internal package dependencies (package names). */
    dependencies: string[];
    /** ISO timestamp of the last sync recorded in the project manifest. */
    syncedAt?: string;
    /** Number of files recorded in the project manifest. */
    trackedFiles: number;
}

export interface ProjectGroup {
    kind: 'group';
    /** Absolute workspace-folder directory. */
    dir: string;
    label: string;
    packageManager?: string;
    projects: Project[];
}

export type ProjectTreeNode = ProjectGroup | Project;

interface GraphNode {
    name?: string;
    dir: string;
    hasConfig: boolean;
    config?: string;
    dependencies?: string[];
}

interface ProjectGraphFile {
    projects?: GraphNode[];
    dbxProjects?: GraphNode[];
    order?: string[];
    packageManager?: string;
}

function readJson<T>(file: string): T | undefined {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
    } catch {
        return undefined;
    }
}

/** Read the generated project graph for a root, if present. */
export function readProjectGraph(root: string): ProjectGraphFile | undefined {
    return readJson<ProjectGraphFile>(path.join(root, '.dbx', 'toolchain', 'projects.json'));
}

/** The tracked/generated file manifest for a project. */
export interface ProjectManifest {
    files: string[];
    syncedAt?: string;
}

/** Read the tracked/generated file manifest for a project dir, if present. */
export function readManifest(dir: string): ProjectManifest {
    const doc = readJson<{ files?: string[]; syncedAt?: string }>(path.join(dir, MANIFEST));
    return { files: doc?.files ?? [], ...(doc?.syncedAt ? { syncedAt: doc.syncedAt } : {}) };
}

function hasToolchainConfig(dir: string): boolean {
    try {
        return fs.readdirSync(dir).some(name => name.startsWith(CONFIG_PREFIX));
    } catch {
        return false;
    }
}

function packageName(dir: string): string | undefined {
    return readJson<{ name?: string }>(path.join(dir, 'package.json'))?.name;
}

function childDirs(dir: string): string[] {
    try {
        return fs
            .readdirSync(dir, { withFileTypes: true })
            .filter(
                entry =>
                    entry.isDirectory() &&
                    !entry.name.startsWith('.') &&
                    entry.name !== 'node_modules'
            )
            .map(entry => path.join(dir, entry.name));
    } catch {
        return [];
    }
}

function inferType(dir: string, root: string): Project['type'] {
    if (dir === root) return 'monorepo-root';
    return fs.existsSync(path.join(dir, 'tsconfig.default.json'))
        ? 'monorepo-workspace'
        : 'project';
}

function toProject(root: string, dir: string, hasConfig: boolean, dependencies: string[]): Project {
    const name = packageName(dir);
    const manifest = readManifest(dir);
    // The workspace folder itself resolves to an absolute path; fall back to its
    // basename so the root card shows `proxified`, not `g:\...\proxified`.
    const relative = vscode.workspace.asRelativePath(dir, false);
    const relativePath = !relative || path.isAbsolute(relative) ? path.basename(dir) : relative;
    return {
        kind: 'project',
        dir,
        label: name ?? path.basename(dir),
        relativePath,
        ...(name ? { packageName: name } : {}),
        type: inferType(dir, root),
        hasConfig,
        dependencies,
        ...(manifest.syncedAt ? { syncedAt: manifest.syncedAt } : {}),
        trackedFiles: manifest.files.length,
    };
}

function fromGraph(root: string, nodes: GraphNode[]): Project[] {
    return nodes
        .map(node =>
            toProject(root, path.resolve(root, node.dir), node.hasConfig, node.dependencies ?? [])
        )
        .sort((a, b) => a.label.localeCompare(b.label));
}

function scanRoot(root: string): Project[] {
    const dirs = new Set<string>([root]);
    for (const child of childDirs(root)) {
        if (packageName(child)) dirs.add(child);
    }
    for (const group of PROJECT_GROUPS) {
        for (const child of childDirs(path.join(root, group))) {
            if (packageName(child)) dirs.add(child);
        }
    }
    return [...dirs]
        .sort((a, b) => (packageName(a) ?? a).localeCompare(packageName(b) ?? b))
        .map(dir => toProject(root, dir, hasToolchainConfig(dir), []));
}

/**
 * Discover the projects for the open workspace folders. Prefers the generated
 * dependency graph (which lists every workspace package), then falls back to a
 * scan of the root and common workspace directories.
 */
export function discoverProjectGroups(): ProjectGroup[] {
    const folders = vscode.workspace.workspaceFolders ?? [];
    return folders.map(folder => {
        const root = folder.uri.fsPath;
        const graph = readProjectGraph(root);
        const discovered = graph?.projects?.length
            ? fromGraph(root, graph.projects)
            : scanRoot(root);
        // Invert the list so the hierarchy reads root-first (top -> bottom).
        const projects = [...discovered].reverse();
        return {
            kind: 'group' as const,
            dir: root,
            label: packageName(root) ?? path.basename(root),
            ...(graph?.packageManager ? { packageManager: graph.packageManager } : {}),
            projects,
        };
    });
}

/** Flatten all discovered projects. */
export function discoverProjects(): Project[] {
    return discoverProjectGroups().flatMap(group => group.projects);
}

/** The tree data provider backing the Projects view. */
export class ProjectTreeProvider implements vscode.TreeDataProvider<ProjectTreeNode> {
    private readonly emitter = new vscode.EventEmitter<ProjectTreeNode | undefined>();
    readonly onDidChangeTreeData = this.emitter.event;
    private groups: ProjectGroup[] = [];

    refresh(): void {
        this.groups = [];
        this.emitter.fire(undefined);
    }

    getChildren(element?: ProjectTreeNode): ProjectTreeNode[] {
        if (!element) {
            if (this.groups.length === 0) this.groups = discoverProjectGroups();
            return this.groups;
        }
        return element.kind === 'group' ? element.projects : [];
    }

    getTreeItem(node: ProjectTreeNode): vscode.TreeItem {
        if (node.kind === 'group') {
            const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Expanded);
            item.description = node.packageManager;
            item.tooltip = node.dir;
            item.resourceUri = vscode.Uri.file(node.dir);
            item.iconPath = new vscode.ThemeIcon('repo');
            item.contextValue = 'deltabox.projectGroup';
            return item;
        }

        const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
        item.description = node.hasConfig ? node.type : `${node.type} · no config`;
        item.tooltip = [
            node.packageName ?? node.dir,
            node.dir,
            node.dependencies.length ? `Depends on: ${node.dependencies.join(', ')}` : '',
        ]
            .filter(Boolean)
            .join('\n');
        item.resourceUri = vscode.Uri.file(node.dir);
        item.iconPath = new vscode.ThemeIcon(
            node.hasConfig ? 'check' : node.type === 'monorepo-root' ? 'repo' : 'circle-outline'
        );
        item.contextValue = node.hasConfig ? 'deltabox.project.configured' : 'deltabox.project';
        return item;
    }
}

/** A tracked/generated file node (grouped per workspace root). */
export interface TrackedFileNode {
    kind: 'fileGroup' | 'file';
    label: string;
    /** Workspace root the file belongs to. */
    root: string;
    /** Repo-relative path (files only). */
    file?: string;
    children?: TrackedFileNode[];
}

/** The tree data provider backing the Tracked Files view. */
export class TrackedFilesTreeProvider implements vscode.TreeDataProvider<TrackedFileNode> {
    private readonly emitter = new vscode.EventEmitter<TrackedFileNode | undefined>();
    readonly onDidChangeTreeData = this.emitter.event;
    private roots: TrackedFileNode[] = [];

    refresh(): void {
        this.roots = [];
        this.emitter.fire(undefined);
    }

    /**
     * Group every managed file by the project that owns it. A workspace root's
     * manifest records the files repo-relative, so each file is matched to the
     * deepest project directory that contains it (falling back to the root
     * project) — so root-level managed files still show up.
     */
    private build(): TrackedFileNode[] {
        const groups: TrackedFileNode[] = [];
        for (const workspace of discoverProjectGroups()) {
            const files = [...readManifest(workspace.dir).files].sort((a, b) => a.localeCompare(b));
            if (files.length === 0) continue;
            // Longest directory first, so `find` returns the deepest owner; the
            // shortest (the workspace root) is the fallback.
            const projects = [...workspace.projects].sort((a, b) => b.dir.length - a.dir.length);
            const rootProject = projects[projects.length - 1];
            const buckets = new Map<string, TrackedFileNode>();
            for (const file of files) {
                const abs = path.resolve(workspace.dir, file);
                const owner =
                    projects.find(
                        project => abs === project.dir || abs.startsWith(project.dir + path.sep)
                    ) ?? rootProject;
                const key = owner?.dir ?? workspace.dir;
                let group = buckets.get(key);
                if (!group) {
                    group = {
                        kind: 'fileGroup',
                        label: owner?.label ?? path.basename(workspace.dir),
                        root: workspace.dir,
                        children: [],
                    };
                    buckets.set(key, group);
                }
                group.children?.push({ kind: 'file', label: file, root: workspace.dir, file });
            }
            groups.push(...buckets.values());
        }
        return groups;
    }

    getChildren(element?: TrackedFileNode): TrackedFileNode[] {
        if (element) return element.children ?? [];
        if (this.roots.length === 0) this.roots = this.build();
        return this.roots;
    }

    getTreeItem(node: TrackedFileNode): vscode.TreeItem {
        if (node.kind === 'fileGroup') {
            const item = new vscode.TreeItem(
                node.label,
                node.children?.length
                    ? vscode.TreeItemCollapsibleState.Expanded
                    : vscode.TreeItemCollapsibleState.None
            );
            item.description = `${node.children?.length ?? 0}`;
            item.tooltip = node.root;
            item.iconPath = new vscode.ThemeIcon('file-directory');
            item.contextValue = 'deltabox.fileGroup';
            return item;
        }

        const absolute = path.resolve(node.root, node.file ?? '');
        const item = new vscode.TreeItem(
            path.basename(node.file ?? node.label),
            vscode.TreeItemCollapsibleState.None
        );
        item.description = path.dirname(node.file ?? '');
        item.resourceUri = vscode.Uri.file(absolute);
        item.tooltip = node.file;
        item.contextValue = 'deltabox.file';
        item.command = {
            command: 'vscode.open',
            title: 'Open',
            arguments: [vscode.Uri.file(absolute)],
        };
        return item;
    }
}
