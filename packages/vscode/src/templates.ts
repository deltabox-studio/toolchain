import * as vscode from 'vscode';

import { withBuiltinTemplates } from './builtins.js';
import { captureCli } from './cli.js';

/**
 * The templates the extension renders, mirroring `dbx template:list --json`
 * (builtin + local + opted-in online sources), so the extension stays decoupled
 * from the tooling packages and drives everything through the CLI.
 */

export interface TemplateVariable {
    name: string;
    prompt?: string;
    default?: string;
    options?: string[];
    required?: boolean;
}

export interface TemplateAction {
    id: string;
    prompt?: string;
    default?: boolean;
    builtin?: string;
    module?: string;
    command?: string;
}

export interface Template {
    id: string;
    name: string;
    description?: string;
    kind?: string;
    type?: string;
    online?: boolean;
    tags?: string[];
    variables?: TemplateVariable[];
    actions?: TemplateAction[];
}

/**
 * Load the templates via `dbx template:list --json`, always including the
 * builtins. The builtins are the fallback when the CLI cannot be resolved or
 * fails.
 */
export async function loadTemplates(
    cwd: string,
    options: { online?: boolean } = {}
): Promise<Template[]> {
    // `--online` resolves npm/git sources too, so the picker offers *every*
    // template (builtin + local + online + Vite+), not just the offline builtins.
    const args = ['template:list', '--json', '--cwd', cwd];
    if (options.online !== false) args.push('--online');
    const result = await captureCli(cwd, args);
    if (result.code !== 0) return withBuiltinTemplates([]);
    try {
        const parsed = JSON.parse(result.stdout) as unknown;
        return withBuiltinTemplates(Array.isArray(parsed) ? (parsed as Template[]) : []);
    } catch {
        return withBuiltinTemplates([]);
    }
}

/** The tree data provider backing the Templates view. */
export class TemplateTreeProvider implements vscode.TreeDataProvider<Template> {
    private readonly emitter = new vscode.EventEmitter<Template | undefined>();
    readonly onDidChangeTreeData = this.emitter.event;
    private templates: Template[] = [];
    private loaded = false;

    constructor(private readonly root: () => string | undefined) {}

    /** Reload the templates (including the builtins) and repaint. */
    async refresh(): Promise<void> {
        const root = this.root();
        this.templates = root ? await loadTemplates(root) : withBuiltinTemplates([]);
        this.loaded = true;
        this.emitter.fire(undefined);
    }

    getChildren(element?: Template): Template[] {
        if (element) return [];
        if (!this.loaded) void this.refresh();
        return this.templates;
    }

    getTreeItem(node: Template): vscode.TreeItem {
        const item = new vscode.TreeItem(
            node.name || node.id,
            vscode.TreeItemCollapsibleState.None
        );
        item.description = node.id;
        item.tooltip = [
            node.description,
            [node.kind, node.type, node.online ? 'online' : undefined].filter(Boolean).join(' · '),
            node.tags?.length ? `Tags: ${node.tags.join(', ')}` : '',
        ]
            .filter(Boolean)
            .join('\n');
        item.iconPath = new vscode.ThemeIcon(
            node.online ? 'cloud-download' : node.kind === 'application' ? 'rocket' : 'file-code'
        );
        item.contextValue = 'deltabox.template';
        item.command = {
            command: 'deltabox.toolchain.templates.create',
            title: 'Create',
            arguments: [node],
        };
        return item;
    }
}
