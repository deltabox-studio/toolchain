import * as vscode from 'vscode';

import {
    loadProviders,
    type Provider,
    type ProviderCommand,
    type ProviderCommandNode,
    type ProviderNode,
    readAllProviders,
    readGlobalProviders,
    readProviderRegistry,
    writeGlobalProviders,
    writeProviderRegistry,
} from '../providers.js';
import type { RegistryItemNode } from '../registries.js';
import type { CommandDeps } from './deps.js';

export interface ProviderRegistryDeps extends CommandDeps {
    providers: { refresh: () => Promise<void> | void };
    templates: { refresh: () => Promise<void> | void };
    registries: { refresh: () => Promise<void> | void };
    updateContextKeys: () => void;
    createViteProject: (cwd?: string) => Promise<void>;
    addTemplate: () => Promise<void>;
    openTerminalCommand: (root: string, command: string, name: string) => void;
}

export interface ProviderRegistryCommands {
    addProvider: () => Promise<void>;
    removeProvider: (node?: ProviderNode) => Promise<void>;
    newRegistry: () => Promise<void>;
    removeRegistry: () => Promise<void>;
    removeRegistryEntry: (node?: RegistryItemNode) => Promise<void>;
    addRegistryEntry: (node?: RegistryItemNode) => Promise<void>;
    runProviderCommand: (node?: ProviderNode | ProviderCommandNode) => Promise<void>;
    openProviderHomepage: (node?: ProviderNode) => void;
    copyProviderId: (node?: ProviderNode) => void;
    openRegistryItem: (node?: RegistryItemNode) => void;
}

/** Provider and registry management commands. */
export function createProviderRegistryCommands(
    deps: ProviderRegistryDeps
): ProviderRegistryCommands {
    /** Register a custom provider in `.dbx/toolchain/providers.json`. */
    const addProvider = async (): Promise<void> => {
        const root = deps.workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const id = await vscode.window.showInputBox({
            prompt: 'Provider id',
            placeHolder: 'my-tool',
            validateInput: value =>
                /^[a-z0-9][a-z0-9-]*$/.test(value.trim())
                    ? undefined
                    : 'lowercase letters, digits and dashes',
        });
        if (!id) return;
        const name = await vscode.window.showInputBox({
            prompt: 'Display name',
            value: id,
            validateInput: value => (value.trim() ? undefined : 'Required'),
        });
        if (!name) return;
        const binary = await vscode.window.showInputBox({
            prompt: 'Binary the provider wraps (optional)',
            placeHolder: 'mytool',
        });
        const description = await vscode.window.showInputBox({ prompt: 'Description (optional)' });
        const homepage = await vscode.window.showInputBox({ prompt: 'Homepage URL (optional)' });

        const commands: ProviderCommand[] = [];
        for (;;) {
            const subcommand = await vscode.window.showInputBox({
                prompt: 'Command subcommand (leave empty to finish)',
                placeHolder: 'build',
            });
            if (subcommand === undefined) return;
            if (!subcommand.trim()) break;
            const label = await vscode.window.showInputBox({
                prompt: `Description for "${subcommand}"`,
                value: subcommand,
            });
            commands.push({
                name: `${id}:${subcommand}`,
                subcommand,
                description: label ?? subcommand,
            });
        }

        const existing = readAllProviders(root);
        let providerId = id;
        if (existing.some(provider => provider.id === providerId)) {
            let index = 2;
            while (existing.some(candidate => candidate.id === `${id}-${index}`)) index += 1;
            const renamed = await vscode.window.showInputBox({
                prompt: `Provider "${id}" already exists. New id`,
                value: `${id}-${index}`,
                validateInput: value =>
                    /^[a-z0-9][a-z0-9-]*$/.test(value.trim())
                        ? existing.some(candidate => candidate.id === value.trim())
                            ? 'That id already exists.'
                            : undefined
                        : 'Use lowercase letters, numbers and dashes.',
            });
            if (!renamed) return;
            providerId = renamed.trim();
            for (const command of commands) command.name = `${providerId}:${command.subcommand}`;
        }
        const provider: Provider = {
            id: providerId,
            name,
            ...(binary ? { binary } : {}),
            ...(description ? { description } : {}),
            ...(homepage ? { homepage } : {}),
            commands,
        };
        const scope = await vscode.window.showQuickPick(
            [
                { label: 'Yes', detail: 'Available in every project' },
                { label: 'No', detail: 'Only in this project' },
            ],
            { placeHolder: 'Add this provider to the global registry?' }
        );
        if (!scope) return;
        if (scope.label === 'Yes') {
            writeGlobalProviders([...readGlobalProviders(), provider]);
        } else {
            writeProviderRegistry(root, [...readProviderRegistry(root), provider]);
        }
        await deps.providers.refresh();
        deps.updateContextKeys();
        vscode.window.showInformationMessage(`deltabox: added provider "${name}".`);
    };

    /** Remove a custom provider from the (project and global) registries. */
    const removeProvider = async (node?: ProviderNode): Promise<void> => {
        if (!node || !node.custom) return;
        const confirm = await vscode.window.showWarningMessage(
            `Remove provider "${node.provider.name}"?`,
            { modal: true },
            'Remove'
        );
        if (confirm !== 'Remove') return;
        const id = node.provider.id;
        writeProviderRegistry(
            node.root,
            readProviderRegistry(node.root).filter(provider => provider.id !== id)
        );
        writeGlobalProviders(readGlobalProviders().filter(provider => provider.id !== id));
        await deps.providers.refresh();
        deps.updateContextKeys();
    };

    /** Open a registry: the file/folder for locals, the website for remotes. */
    const openRegistryItem = (node?: RegistryItemNode): void => {
        if (!node) return;
        if (node.entry.remote) void vscode.env.openExternal(vscode.Uri.parse(node.entry.path));
        else
            void vscode.commands.executeCommand(
                'revealInExplorer',
                vscode.Uri.file(node.entry.path)
            );
    };

    /** Add a new registry search path (global or project). */
    const newRegistry = async (): Promise<void> => {
        const root = deps.workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const category = await vscode.window.showQuickPick(
            [
                { label: 'Templates', value: 'templates' },
                { label: 'Providers', value: 'providers' },
            ],
            { placeHolder: 'Which kind of registry?' }
        );
        if (!category) return;
        const providersKind = category.value === 'providers';
        const entry = await vscode.window.showInputBox({
            prompt: 'Registry path or http(s) URL',
            value: providersKind
                ? '.dbx/toolchain/.registry/providers'
                : '.dbx/toolchain/.registry/templates',
            validateInput: value => (value.trim() ? undefined : 'Required'),
        });
        if (!entry) return;
        const scope = await vscode.window.showQuickPick(
            [
                { label: 'Global', detail: 'Available in every project' },
                { label: 'Project', detail: 'This project only' },
            ],
            { placeHolder: 'Where should this registry live?' }
        );
        if (!scope) return;
        const args = [
            'registry',
            '--add',
            entry,
            '--scope',
            scope.label === 'Project' ? 'project' : 'global',
            '--cwd',
            root,
        ];
        if (providersKind) args.push('--kind', 'providers');
        const code = await deps.runCli(root, args);
        if (code === 0) {
            await deps.registries.refresh();
            if (providersKind) await deps.providers.refresh();
            else await deps.templates.refresh();
            vscode.window.showInformationMessage(
                `deltabox: added ${scope.label.toLowerCase()} ${category.label.toLowerCase()} registry.`
            );
        } else {
            deps.output.show();
        }
    };

    /** Remove one or more template registry paths (keeps the files). */
    const removeRegistry = async (): Promise<void> => {
        const root = deps.workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const result = await deps.captureCli(root, ['registry', '--json', '--cwd', root]);
        let entries: RegistryItemNode['entry'][] = [];
        if (result.code === 0) {
            try {
                const parsed = JSON.parse(result.stdout) as {
                    templates?: RegistryItemNode['entry'][];
                    providers?: RegistryItemNode['entry'][];
                };
                entries = [...(parsed.templates ?? []), ...(parsed.providers ?? [])];
            } catch {
                entries = [];
            }
        }
        if (entries.length === 0) {
            vscode.window.showInformationMessage('deltabox: no registries.');
            return;
        }
        const picked = await vscode.window.showQuickPick(
            entries.map(entry => ({ label: entry.path, description: entry.scope, entry })),
            { canPickMany: true, placeHolder: 'Which registries should be removed?' }
        );
        if (!picked || picked.length === 0) return;
        const confirm = await vscode.window.showWarningMessage(
            `Remove ${picked.length} registry path(s)? The files are kept.`,
            { modal: true },
            'Remove'
        );
        if (confirm !== 'Remove') return;
        for (const item of picked) {
            const args = [
                'registry',
                '--remove',
                item.entry.path,
                '--scope',
                item.entry.scope,
                '--cwd',
                root,
            ];
            if (item.entry.kind === 'providers') args.push('--kind', 'providers');
            await deps.runCli(root, args);
        }
        await deps.registries.refresh();
    };

    /** Remove one registry item from the view (template registries only). */
    const removeRegistryEntry = async (node?: RegistryItemNode): Promise<void> => {
        if (!node || node.category !== 'templates') return;
        const root = deps.workspaceRoots()[0];
        if (!root) return;
        const confirm = await vscode.window.showWarningMessage(
            `Remove registry "${node.entry.path}"? The files are kept.`,
            { modal: true },
            'Remove'
        );
        if (confirm !== 'Remove') return;
        await deps.runCli(root, [
            'registry',
            '--remove',
            node.entry.path,
            '--scope',
            node.entry.scope,
            '--cwd',
            root,
        ]);
        await deps.registries.refresh();
    };

    /** Add an item (template/provider) through the category's flow. */
    const addRegistryEntry = async (node?: RegistryItemNode): Promise<void> => {
        if (!node) return;
        if (node.category === 'providers') {
            await addProvider();
            await deps.providers.refresh();
        } else {
            await deps.addTemplate();
            await deps.templates.refresh();
        }
        await deps.registries.refresh();
    };

    /** Run a provider command (`dbx <command.name>`) in a terminal. */
    const runProviderCommand = async (node?: ProviderNode | ProviderCommandNode): Promise<void> => {
        if (!node) {
            const root = deps.workspaceRoots()[0];
            if (!root) {
                vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
                return;
            }
            const providers = await loadProviders(root);
            const commands = providers.flatMap(provider =>
                provider.commands.map(command => ({
                    label: command.description,
                    description: `dbx ${command.name}`,
                    detail: provider.name,
                    command,
                }))
            );
            if (commands.length === 0) {
                vscode.window.showInformationMessage('deltabox: no provider commands available.');
                return;
            }
            const picked = await vscode.window.showQuickPick(commands, {
                placeHolder: 'Which provider command should run?',
                matchOnDescription: true,
            });
            if (!picked) return;
            if (picked.command.name === 'vite:create') {
                await deps.createViteProject(root);
                return;
            }
            deps.openTerminalCommand(root, picked.command.name, `dbx ${picked.command.name}`);
            return;
        }
        if (!node.root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        let command = node.kind === 'command' ? node.command : undefined;
        if (!command) {
            if (node.provider.commands.length === 0) {
                vscode.window.showInformationMessage(
                    `deltabox: ${node.provider.name} has no commands.`
                );
                return;
            }
            const picked = await vscode.window.showQuickPick(
                node.provider.commands.map(candidate => ({
                    label: candidate.description,
                    description: `dbx ${candidate.name}`,
                    command: candidate,
                })),
                { placeHolder: `Which ${node.provider.name} command should run?` }
            );
            if (!picked) return;
            command = picked.command;
        }
        // `vite:create` prompts interactively; run it through the extension.
        if (command.name === 'vite:create') {
            await deps.createViteProject(node.root);
            return;
        }
        deps.openTerminalCommand(node.root, command.name, command.name);
    };

    const openProviderHomepage = (node?: ProviderNode): void => {
        const url = node?.provider.homepage;
        if (url) void vscode.env.openExternal(vscode.Uri.parse(url));
    };

    const copyProviderId = (node?: ProviderNode): void => {
        if (node) void vscode.env.clipboard.writeText(node.provider.id);
    };

    return {
        addProvider,
        removeProvider,
        newRegistry,
        removeRegistry,
        removeRegistryEntry,
        addRegistryEntry,
        runProviderCommand,
        openProviderHomepage,
        copyProviderId,
        openRegistryItem,
    };
}
