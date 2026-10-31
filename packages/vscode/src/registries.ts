import * as vscode from 'vscode';

import { captureCli } from './cli.js';

/** A detected registry (mirrors `dbx registry --json`). */
export interface RegistryEntry {
    path: string;
    scope: 'project' | 'global';
    remote: boolean;
    kind: 'templates' | 'providers';
}

export interface RegistryRootNode {
    kind: 'root';
    category: 'providers' | 'templates';
    label: string;
    entries: RegistryEntry[];
}

export interface RegistryItemNode {
    kind: 'registry';
    category: 'providers' | 'templates';
    entry: RegistryEntry;
}

export type RegistryTreeNode = RegistryRootNode | RegistryItemNode;

/** The tree behind the Registries view (Providers + Templates roots). */
export class RegistryTreeProvider implements vscode.TreeDataProvider<RegistryTreeNode> {
    private readonly emitter = new vscode.EventEmitter<RegistryTreeNode | undefined>();
    readonly onDidChangeTreeData = this.emitter.event;
    private roots: RegistryRootNode[] = [];
    private loaded = false;

    constructor(private readonly root: () => string | undefined) {}

    async refresh(): Promise<void> {
        const root = this.root();
        if (!root) {
            this.roots = [];
            this.loaded = true;
            this.emitter.fire(undefined);
            return;
        }
        const result = await captureCli(root, ['registry', '--json', '--cwd', root]);
        let model: { templates?: RegistryEntry[]; providers?: RegistryEntry[] } = {};
        if (result.code === 0) {
            try {
                model = JSON.parse(result.stdout) as typeof model;
            } catch {
                model = {};
            }
        }
        this.roots = [
            {
                kind: 'root',
                category: 'providers',
                label: 'Providers',
                entries: model.providers ?? [],
            },
            {
                kind: 'root',
                category: 'templates',
                label: 'Templates',
                entries: model.templates ?? [],
            },
        ];
        this.loaded = true;
        this.emitter.fire(undefined);
    }

    getChildren(element?: RegistryTreeNode): RegistryTreeNode[] {
        if (!element) {
            if (!this.loaded) void this.refresh();
            return this.roots;
        }
        if (element.kind === 'root') {
            return element.entries.map(entry => ({
                kind: 'registry',
                category: element.category,
                entry,
            }));
        }
        return [];
    }

    getTreeItem(node: RegistryTreeNode): vscode.TreeItem {
        if (node.kind === 'root') {
            const item = new vscode.TreeItem(
                node.label,
                node.entries.length
                    ? vscode.TreeItemCollapsibleState.Expanded
                    : vscode.TreeItemCollapsibleState.None
            );
            item.description = String(node.entries.length);
            item.contextValue = 'deltabox.registryRoot';
            item.iconPath = new vscode.ThemeIcon(
                node.category === 'providers' ? 'extensions' : 'library'
            );
            return item;
        }

        const entry = node.entry;
        const item = new vscode.TreeItem(entry.path, vscode.TreeItemCollapsibleState.None);
        item.description = entry.scope;
        item.tooltip = `${entry.path}\n${entry.kind} · ${entry.scope}${entry.remote ? ' · remote' : ''}`;
        item.iconPath = new vscode.ThemeIcon(
            entry.remote ? 'globe' : entry.scope === 'project' ? 'folder' : 'folder-library'
        );
        item.contextValue = 'deltabox.registry';
        item.command = {
            command: 'deltabox.toolchain.registry.open',
            title: 'Open registry',
            arguments: [node],
        };
        return item;
    }
}
