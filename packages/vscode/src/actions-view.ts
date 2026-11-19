import * as vscode from 'vscode';

import { actionGroups, groupedActions } from './actions.js';
import { executePromptAction, vscodePromptHost, type PromptAction } from './prompt.js';

const RUN_COMMAND = 'deltabox.toolchain.actions.run';

/** The Actions tree: groups collapsed by default, actions sorted by label. */
export class ActionsTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    private readonly changeEmitter = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this.changeEmitter.event;

    refresh(): void {
        this.changeEmitter.fire();
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
        if (!element) {
            return groupedActions().map(
                entry =>
                    new GroupItem(
                        entry.group,
                        entry.actions.length,
                        vscode.TreeItemCollapsibleState.Collapsed
                    )
            );
        }
        if (element instanceof GroupItem) {
            const group = groupedActions().find(entry => entry.group === element.group);
            return (group?.actions ?? []).map(action => new ActionItem(action));
        }
        return [];
    }
}

export class GroupItem extends vscode.TreeItem {
    constructor(
        readonly group: string,
        count: number,
        state: vscode.TreeItemCollapsibleState
    ) {
        super(`${group} (${count})`, state);
        this.contextValue = 'deltabox.actionGroup';
        this.iconPath = new vscode.ThemeIcon('folder');
    }
}

export class ActionItem extends vscode.TreeItem {
    constructor(readonly action: PromptAction) {
        super(action.label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'deltabox.action';
        this.description = action.group;
        if (action.description) this.tooltip = action.description;
        this.iconPath = new vscode.ThemeIcon('play');
        this.command = {
            command: RUN_COMMAND,
            title: action.label,
            arguments: [action.id],
        };
    }
}

/** Find and execute an action by id. */
export async function runActionById(id: string): Promise<void> {
    const action = actionGroups().find(entry => entry.id === id);
    if (!action) {
        await vscode.window.showWarningMessage(`deltabox: unknown action "${id}".`);
        return;
    }
    await executePromptAction(vscodePromptHost(), action);
}

/** Open the searchable, paged action palette. */
export async function showActionPalette(): Promise<void> {
    const { pickPaged, vscodePromptHost: host } = await import('./prompt.js');
    const items = actionGroups().map(action => ({
        label: action.label,
        description: action.group,
        ...(action.description ? { detail: action.description } : {}),
        value: action,
    }));
    const picked = await pickPaged(host(), 'deltabox actions', items, 0, 8);
    if (!picked) return;
    await executePromptAction(host(), picked);
}
