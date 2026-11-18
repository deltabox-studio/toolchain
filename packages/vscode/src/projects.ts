import fs from 'node:fs';
import path from 'node:path';

import * as vscode from 'vscode';

import { readJson, readManifest } from './manifest.js';
import { DEFAULT_TSCONFIG_FILES, type TsconfigFileNames } from './watch-inputs.js';

export { type ProjectManifest, readManifest } from './manifest.js';

const CONFIG_PREFIX = 'dbx.config.';
const PROJECT_GROUPS = ['packages', 'apps', 'sdk'];

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
    /** Whether a `vite.config.*` carries the `dbx()` plugin (plugin mode). */
    plugin: boolean;
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

/** Read the generated project graph for a root, if present. */
export function readProjectGraph(root: string): ProjectGraphFile | undefined {
    return readJson<ProjectGraphFile>(path.join(root, '.dbx', 'toolchain', 'projects.json'));
}

function hasToolchainConfig(dir: string): boolean {
    try {
        return fs.readdirSync(dir).some(name => name.startsWith(CONFIG_PREFIX));
    } catch {
        return false;
    }
}

const VITE_CONFIG_PREFIX = 'vite.config.';
const DBX_PLUGIN_SOURCE = /@deltabox\/toolchain(?:\/vite)?['"]|\bdbx\s*\(/;

/** Whether a hand-written `vite.config.*` in `dir` uses the `dbx()` plugin. */
function hasVitePluginConfig(dir: string): boolean {
    try {
        const file = fs
            .readdirSync(dir)
            .find(name => name.startsWith(VITE_CONFIG_PREFIX) && !name.endsWith('.d.ts'));
        if (!file) return false;
        const source = fs.readFileSync(path.join(dir, file), 'utf-8');
        // A generated `resolveVite` shim reads `dbx.config.*`; it is not plugin mode.
        return DBX_PLUGIN_SOURCE.test(source) && !/resolveVite\s*[<(]/.test(source);
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

/** The tsconfig file names resolved from each root's config (see `dbx watch --list`). */
const tsconfigNames = new Map<string, TsconfigFileNames>();

/** Record the tsconfig file names a workspace root's config resolves to. */
export function setTsconfigFileNames(root: string, names: TsconfigFileNames): void {
    tsconfigNames.set(path.resolve(root), names);
}

/** The workspace default tsconfig name for a root (custom `defaultFile` honoured). */
export function defaultTsconfigFile(root: string): string {
    return tsconfigNames.get(path.resolve(root))?.defaultFile ?? DEFAULT_TSCONFIG_FILES.defaultFile;
}

function inferType(dir: string, root: string): Project['type'] {
    if (dir === root) return 'monorepo-root';
    return fs.existsSync(path.join(dir, defaultTsconfigFile(root)))
        ? 'monorepo-workspace'
        : 'project';
}

function toProject(
    root: string,
    dir: string,
    hasConfig: boolean,
    dependencies: string[],
    plugin: boolean = false
): Project {
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
        plugin,
        dependencies,
        ...(manifest.syncedAt ? { syncedAt: manifest.syncedAt } : {}),
        trackedFiles: manifest.files.length,
    };
}

function fromGraph(root: string, nodes: GraphNode[]): Project[] {
    return nodes
        .map(node => {
            const dir = path.resolve(root, node.dir);
            return toProject(
                root,
                dir,
                node.hasConfig,
                node.dependencies ?? [],
                hasVitePluginConfig(dir)
            );
        })
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
        .map(dir => toProject(root, dir, hasToolchainConfig(dir), [], hasVitePluginConfig(dir)));
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

    /** Load (and cache) the discovered groups once per refresh. */
    private ensureGroups(): ProjectGroup[] {
        if (this.groups.length === 0) this.groups = discoverProjectGroups();
        return this.groups;
    }

    /** The stable project node for a directory (used by `treeView.reveal`). */
    findProject(dir: string): Project | undefined {
        const target = path.resolve(dir);
        for (const group of this.ensureGroups()) {
            const project = group.projects.find(
                candidate => path.resolve(candidate.dir) === target
            );
            if (project) return project;
        }
        return undefined;
    }

    /** Every discovered project (cached until the next refresh). */
    projects(): Project[] {
        return this.ensureGroups().flatMap(group => group.projects);
    }

    getChildren(element?: ProjectTreeNode): ProjectTreeNode[] {
        if (!element) return this.ensureGroups();
        return element.kind === 'group' ? element.projects : [];
    }

    /**
     * The parent group a project belongs to. `TreeView.reveal` uses this to
     * expand the ancestors of a node that is not currently loaded.
     */
    getParent(element: ProjectTreeNode): ProjectTreeNode | undefined {
        if (element.kind === 'group') return undefined;
        const target = path.resolve(element.dir);
        return this.ensureGroups().find(group =>
            group.projects.some(project => path.resolve(project.dir) === target)
        );
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
        item.description = node.plugin
            ? `${node.type} · plugin`
            : node.hasConfig
              ? node.type
              : `${node.type} · no config`;
        item.tooltip = [
            node.packageName ?? node.dir,
            node.dir,
            node.dependencies.length ? `Depends on: ${node.dependencies.join(', ')}` : '',
        ]
            .filter(Boolean)
            .join('\n');
        item.resourceUri = vscode.Uri.file(node.dir);
        item.iconPath = new vscode.ThemeIcon(
            node.hasConfig || node.plugin
                ? 'check'
                : node.type === 'monorepo-root'
                  ? 'repo'
                  : 'circle-outline'
        );
        item.contextValue =
            node.hasConfig || node.plugin ? 'deltabox.project.configured' : 'deltabox.project';
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
    /** The config key owning a workflow conflict (conflict files only). */
    conflict?: string;
    /** Whether this group lists workflow conflicts instead of managed files. */
    conflictGroup?: boolean;
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
            const manifest = readManifest(workspace.dir);
            const files = [...manifest.files].sort((a, b) => a.localeCompare(b));
            if (files.length === 0 && !manifest.workflowConflicts) continue;
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
            const conflicts = Object.entries(manifest.workflowConflicts ?? {}).sort(([a], [b]) =>
                a.localeCompare(b)
            );
            if (conflicts.length > 0) {
                groups.push({
                    kind: 'fileGroup',
                    label: 'Workflow conflicts',
                    root: workspace.dir,
                    conflictGroup: true,
                    children: conflicts.map(([file, conflict]) => ({
                        kind: 'file',
                        label: file,
                        root: workspace.dir,
                        file,
                        conflict,
                    })),
                });
            }
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
            item.tooltip = node.conflictGroup
                ? 'Hand-written workflows dbx left untouched. Set the listed config key to `{ enabled: false }` to make the opt-out explicit.'
                : node.root;
            item.iconPath = new vscode.ThemeIcon(node.conflictGroup ? 'warning' : 'file-directory');
            item.contextValue = node.conflictGroup
                ? 'deltabox.fileConflictGroup'
                : 'deltabox.fileGroup';
            return item;
        }

        const absolute = path.resolve(node.root, node.file ?? '');
        const item = new vscode.TreeItem(
            path.basename(node.file ?? node.label),
            vscode.TreeItemCollapsibleState.None
        );
        item.description = node.conflict
            ? `conflict: ${node.conflict}`
            : path.dirname(node.file ?? '');
        item.resourceUri = vscode.Uri.file(absolute);
        item.tooltip = node.conflict
            ? `${node.file}\nConflicts with ${node.conflict}; dbx left it untouched.`
            : node.file;
        item.contextValue = node.conflict ? 'deltabox.fileConflict' : 'deltabox.file';
        if (node.conflict) item.iconPath = new vscode.ThemeIcon('warning');
        item.command = {
            command: 'vscode.open',
            title: 'Open',
            arguments: [vscode.Uri.file(absolute)],
        };
        return item;
    }
}
