import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as vscode from 'vscode';

import { captureCli } from './cli.js';

/**
 * The provider descriptors the extension renders. They mirror the JSON emitted
 * by `dbx providers --json` (see `@deltabox/toolchain`), so the extension
 * never imports the tooling packages directly — it drives everything through
 * the resolved CLI.
 */

export interface ProviderCommand {
    /** The namespaced `dbx` command name, eg. `vite:dev`. */
    name: string;
    /** The wrapped subcommand, eg. `dev`. */
    subcommand: string;
    description: string;
    group?: string;
    aliases?: string[];
}

export interface Provider {
    id: string;
    name: string;
    description?: string;
    homepage?: string;
    binary?: string;
    commands: ProviderCommand[];
}

/** Load the providers via `dbx providers --json` (empty on failure). */
export async function loadProviders(cwd: string): Promise<Provider[]> {
    const result = await captureCli(cwd, ['providers', '--json']);
    if (result.code !== 0) return [];
    try {
        const parsed = JSON.parse(result.stdout) as unknown;
        return Array.isArray(parsed) ? (parsed as Provider[]) : [];
    } catch {
        return [];
    }
}

const REGISTRY = path.join('.dbx', 'toolchain', '.registry', 'providers', 'providers.json');
const LEGACY_REGISTRY = path.join('.dbx', 'toolchain', 'providers.json');

/** The absolute path of a project's custom provider registry. */
export function providerRegistryPath(root: string): string {
    return path.join(root, REGISTRY);
}

function readProvidersFile(file: string): Provider[] {
    try {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown;
        return Array.isArray(parsed) ? (parsed as Provider[]) : [];
    } catch {
        return [];
    }
}

function dedupe(providers: Provider[]): Provider[] {
    const seen = new Set<string>();
    const out: Provider[] = [];
    for (const provider of providers) {
        if (seen.has(provider.id)) continue;
        seen.add(provider.id);
        out.push(provider);
    }
    return out;
}

/** Read a project's custom providers (new default + legacy file). */
export function readProviderRegistry(root: string): Provider[] {
    return dedupe([
        ...readProvidersFile(providerRegistryPath(root)),
        ...readProvidersFile(path.join(root, LEGACY_REGISTRY)),
    ]);
}

/** Write a project's custom providers (removing the file when the list is empty). */
export function writeProviderRegistry(root: string, providers: Provider[]): void {
    const file = providerRegistryPath(root);
    if (providers.length === 0) {
        fs.rmSync(file, { force: true });
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(providers, null, 4)}\n`, 'utf-8');
}

/** The global (`~/.dbx/toolchain/.registry/providers/providers.json`) file. */
export function globalProviderRegistryPath(): string {
    return path.join(os.homedir(), '.dbx', 'toolchain', '.registry', 'providers', 'providers.json');
}

function legacyGlobalProviderRegistryPath(): string {
    return path.join(os.homedir(), '.dbx', 'toolchain', '.registry', 'providers.json');
}

/** Read the global providers (new default + legacy file). */
export function readGlobalProviders(): Provider[] {
    return dedupe([
        ...readProvidersFile(globalProviderRegistryPath()),
        ...readProvidersFile(legacyGlobalProviderRegistryPath()),
    ]);
}

/** Write the global providers (removing the file when the list is empty). */
export function writeGlobalProviders(providers: Provider[]): void {
    const file = globalProviderRegistryPath();
    if (providers.length === 0) {
        fs.rmSync(file, { force: true });
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(providers, null, 4)}\n`, 'utf-8');
}

/** The project + global providers (project wins on an id clash). */
export function readAllProviders(root: string): Provider[] {
    const seen = new Set<string>();
    const providers: Provider[] = [];
    for (const provider of [...readProviderRegistry(root), ...readGlobalProviders()]) {
        if (seen.has(provider.id)) continue;
        seen.add(provider.id);
        providers.push(provider);
    }
    return providers;
}

/** A provider tree node (a provider, or one of its commands). */
export interface ProviderNode {
    kind: 'provider';
    provider: Provider;
    /** Whether the provider lives in the custom registry (removable). */
    custom: boolean;
    root: string;
}

export interface ProviderCommandNode {
    kind: 'command';
    provider: Provider;
    command: ProviderCommand;
    root: string;
}

export type ProviderTreeNode = ProviderNode | ProviderCommandNode;

/** The tree data provider backing the Providers view. */
export class ProviderTreeProvider implements vscode.TreeDataProvider<ProviderTreeNode> {
    private readonly emitter = new vscode.EventEmitter<ProviderTreeNode | undefined>();
    readonly onDidChangeTreeData = this.emitter.event;
    private roots: ProviderNode[] = [];
    private loaded = false;

    constructor(private readonly root: () => string | undefined) {}

    /** The providers currently loaded (drives context keys / the home model). */
    list(): Provider[] {
        return this.roots.map(node => node.provider);
    }

    /** Reload the providers (CLI list + the custom registry) and repaint. */
    async refresh(): Promise<void> {
        const root = this.root();
        if (!root) {
            this.roots = [];
            this.loaded = true;
            this.emitter.fire(undefined);
            return;
        }
        const listed = await loadProviders(root);
        const customIds = new Set(readAllProviders(root).map(provider => provider.id));
        this.roots = listed.map(provider => ({
            kind: 'provider' as const,
            provider,
            custom: customIds.has(provider.id),
            root,
        }));
        this.loaded = true;
        this.emitter.fire(undefined);
    }

    getChildren(element?: ProviderTreeNode): ProviderTreeNode[] {
        if (!element) {
            if (!this.loaded) void this.refresh();
            return this.roots;
        }
        if (element.kind === 'provider') {
            return element.provider.commands.map(command => ({
                kind: 'command' as const,
                provider: element.provider,
                command,
                root: element.root,
            }));
        }
        return [];
    }

    getTreeItem(node: ProviderTreeNode): vscode.TreeItem {
        if (node.kind === 'provider') {
            const item = new vscode.TreeItem(
                node.provider.name,
                node.provider.commands.length === 0
                    ? vscode.TreeItemCollapsibleState.None
                    : node.provider.id === 'vite-plus'
                      ? vscode.TreeItemCollapsibleState.Expanded
                      : vscode.TreeItemCollapsibleState.Collapsed
            );
            item.description = node.provider.binary ?? node.provider.id;
            item.tooltip = [
                node.provider.description,
                node.provider.homepage,
                `${node.provider.commands.length} command(s)`,
                `dbx ${node.provider.id}`,
            ]
                .filter(Boolean)
                .join('\n');
            item.iconPath = new vscode.ThemeIcon(node.custom ? 'plug' : 'extensions');
            item.contextValue = node.custom ? 'deltabox.provider.custom' : 'deltabox.provider';
            return item;
        }

        const item = new vscode.TreeItem(
            node.command.description,
            vscode.TreeItemCollapsibleState.None
        );
        item.description = `dbx ${node.command.name}`;
        item.tooltip = `${node.command.description}\n\nvp ${node.command.subcommand}\ndbx ${node.command.name}`;
        item.iconPath = new vscode.ThemeIcon('play');
        item.contextValue = 'deltabox.providerCommand';
        item.command = {
            command: 'deltabox.toolchain.providers.runCommand',
            title: 'Run',
            arguments: [node],
        };
        return item;
    }
}
