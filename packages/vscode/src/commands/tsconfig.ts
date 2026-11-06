import * as vscode from 'vscode';

import type { CommandDeps } from './deps.js';

/** Manage the auto-wired root tsconfig paths/references. */
export function createTsconfigCommand(deps: CommandDeps): () => Promise<void> {
    return async () => {
        const root = deps.workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const mode = await vscode.window.showQuickPick(
            [
                {
                    label: 'Auto-wire aliases + references',
                    description: 'dbx tsconfig --auto',
                    args: ['--auto'],
                },
                {
                    label: 'Auto-wire aliases only',
                    description: 'dbx tsconfig --auto --no-auto-refs',
                    args: ['--auto', '--no-auto-refs'],
                },
                {
                    label: 'Auto-wire references only',
                    description: 'dbx tsconfig --auto --no-auto-aliases',
                    args: ['--auto', '--no-auto-aliases'],
                },
                {
                    label: 'Only adjust existing entries',
                    description: 'dbx tsconfig --no-auto',
                    args: ['--no-auto'],
                },
                {
                    label: 'Show resolved paths/references',
                    description: 'dbx tsconfig --json',
                    args: ['--json'],
                },
            ],
            { placeHolder: 'How should the root workspaces tsconfig be managed?' }
        );
        if (!mode) return;
        if ((await deps.runCli(root, ['tsconfig', ...mode.args])) === 0) {
            if (!mode.args.includes('--json')) {
                vscode.window.showInformationMessage(
                    `deltabox: tsconfig updated (${mode.label.toLowerCase()}).`
                );
            }
            await deps.refreshGraph();
        } else {
            deps.output.show();
        }
    };
}
