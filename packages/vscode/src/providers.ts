import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as vscode from 'vscode';

import { withBuiltinProviders } from './builtins.js';
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
    /** Whether the provider's binary/tooling is available for this project. */
    available?: boolean;
    commands: ProviderCommand[];
}

/**
 * Load the providers via `dbx providers --json`, always including the builtins.
 * The builtins are the fallback when the CLI cannot be resolved or fails.
 */
export async function loadProviders(cwd: string): Promise<Provider[]> {
    const result = await captureCli(cwd, ['providers', '--json']);
    if (result.code !== 0) return withBuiltinProviders([]);
    try {
        return withBuiltinProviders(normalizeProviders(JSON.parse(result.stdout) as unknown));
    } catch {
        return withBuiltinProviders([]);
    }
}

const REGISTRY = path.join('.dbx', 'toolchain', '.registry', 'providers', 'providers.json');
const LEGACY_REGISTRY = path.join('.dbx', 'toolchain', 'providers.json');

/** The absolute path of a project's custom provider registry. */
export function providerRegistryPath(root: string): string {
    return path.join(root, REGISTRY);
}

function asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

/** Normalize one hand-written command entry, or drop it when it is unusable. */
function normalizeCommand(value: unknown): ProviderCommand | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const command = value as Record<string, unknown>;
    const name = asString(command.name);
    if (!name) return undefined;
    const subcommand = asString(command.subcommand) ?? '';
    const description = asString(command.description) ?? name;
    const group = asString(command.group);
    const aliases = Array.isArray(command.aliases)
        ? command.aliases.filter((alias): alias is string => typeof alias === 'string')
        : [];
    return {
        name,
        subcommand,
        description,
        ...(group ? { group } : {}),
        ...(aliases.length > 0 ? { aliases } : {}),
    };
}

/** Normalize one registry descriptor (hand-written entries may omit fields). */
function normalizeProvider(value: unknown): Provider | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const provider = value as Record<string, unknown>;
    const id = asString(provider.id);
    if (!id) return undefined;
    const name = asString(provider.name) ?? id;
    const description = asString(provider.description);
    const homepage = asString(provider.homepage);
    const binary = asString(provider.binary);
    const available = typeof provider.available === 'boolean' ? provider.available : undefined;
    // The Providers view iterates `commands` unconditionally, so a descriptor
    // without it (or with junk entries) must never reach the tree.
    const commands = Array.isArray(provider.commands)
        ? provider.commands
              .map(normalizeCommand)
              .filter((command): command is ProviderCommand => command !== undefined)
        : [];
    return {
        id,
        name,
        ...(description ? { description } : {}),
        ...(homepage ? { homepage } : {}),
        ...(binary ? { binary } : {}),
        ...(available !== undefined ? { available } : {}),
        commands,
    };
}

/** Normalize a parsed provider list (invalid entries are dropped). */
function normalizeProviders(value: unknown): Provider[] {
    if (!Array.isArray(value)) return [];
    return value
        .map(normalizeProvider)
        .filter((provider): provider is Provider => provider !== undefined);
}

function readProvidersFile(file: string): Provider[] {
    try {
        return normalizeProviders(JSON.parse(fs.readFileSync(file, 'utf-8')) as unknown);
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

/** Write a provider list to `file` (removing it when the list is empty). */
function writeProvidersFileAt(file: string, providers: Provider[]): void {
    if (providers.length === 0) {
        fs.rmSync(file, { force: true });
        return;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(providers, null, 4)}\n`, 'utf-8');
}

/** Write a project's custom providers (removing the file when the list is empty). */
export function writeProviderRegistry(root: string, providers: Provider[]): void {
    writeProvidersFileAt(providerRegistryPath(root), providers);
    // Keep a legacy file in sync so a removed provider does not reappear.
    const legacy = path.join(root, LEGACY_REGISTRY);
    if (fs.existsSync(legacy)) writeProvidersFileAt(legacy, providers);
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
    writeProvidersFileAt(globalProviderRegistryPath(), providers);
    const legacy = legacyGlobalProviderRegistryPath();
    if (fs.existsSync(legacy)) writeProvidersFileAt(legacy, providers);
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

    /** Reload the providers (CLI list + builtins + the custom registry) and repaint. */
    async refresh(): Promise<void> {
        const root = this.root();
        const listed = root ? await loadProviders(root) : [];
        const custom = root ? readAllProviders(root) : readGlobalProviders();
        const customIds = new Set(custom.map(provider => provider.id));
        const providers = withBuiltinProviders([...listed, ...custom]);
        this.roots = providers.map(provider => ({
            kind: 'provider' as const,
            provider,
            custom: customIds.has(provider.id),
            root: root ?? '',
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
            const unavailable = node.provider.available === false;
            item.description = [
                node.provider.binary ?? node.provider.id,
                unavailable ? 'unavailable' : '',
            ]
                .filter(Boolean)
                .join(' · ');
            item.tooltip = [
                node.provider.description,
                node.provider.homepage,
                unavailable
                    ? 'Not available in this project. Install the provider (eg. `vite-plus`) to enable it.'
                    : '',
                `${node.provider.commands.length} command(s)`,
                `dbx ${node.provider.id}`,
            ]
                .filter(Boolean)
                .join('\n');
            item.iconPath = new vscode.ThemeIcon(
                unavailable ? 'circle-slash' : node.custom ? 'plug' : 'extensions'
            );
            item.contextValue = node.custom ? 'deltabox.provider.custom' : 'deltabox.provider';
            return item;
        }

        const item = new vscode.TreeItem(
            node.command.description,
            vscode.TreeItemCollapsibleState.None
        );
        const unavailable = node.provider.available === false;
        item.description = `dbx ${node.command.name}`;
        item.tooltip = unavailable
            ? `${node.command.description}\n\nProvider unavailable in this project.`
            : `${node.command.description}\n\nvp ${node.command.subcommand}\ndbx ${node.command.name}`;
        item.iconPath = new vscode.ThemeIcon(unavailable ? 'circle-slash' : 'play');
        item.contextValue = unavailable
            ? 'deltabox.providerCommand.unavailable'
            : 'deltabox.providerCommand';
        if (!unavailable) {
            item.command = {
                command: 'deltabox.toolchain.providers.runCommand',
                title: 'Run',
                arguments: [node],
            };
        }
        return item;
    }
}
