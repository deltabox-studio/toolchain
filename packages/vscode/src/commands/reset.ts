import * as vscode from 'vscode';

import { discoverProjects, type Project } from '../projects.js';
import type { CommandDeps } from './deps.js';
import { pickProjects } from './helpers.js';

/** The reset-tooling command handler. */
export function createResetCommand(deps: CommandDeps): (targets?: Project[]) => Promise<void> {
    return async (targets?: Project[]) => {
        const scope = await vscode.window.showQuickPick(
            [
                {
                    label: 'Generated files + manifest',
                    value: 'default',
                    detail: 'Keeps dbx.config.ts',
                },
                {
                    label: 'Everything (including config)',
                    value: 'all',
                    detail: 'Removes dbx.config.ts too',
                },
            ],
            { placeHolder: 'What should be removed?' }
        );
        if (!scope) return;

        const selected =
            targets ?? (await pickProjects(discoverProjects(), 'Reset which projects?'));
        if (!selected || selected.length === 0) return;

        const what =
            scope.value === 'all'
                ? 'generated files, the manifest and the config'
                : 'generated files and the manifest';
        const confirm = await vscode.window.showWarningMessage(
            `Remove ${what} from ${selected.length} project(s)?`,
            { modal: true },
            'Remove'
        );
        if (confirm !== 'Remove') return;

        const args = scope.value === 'all' ? ['reset', '--all'] : ['reset'];
        await deps.runProjects(selected, args);
        await deps.refreshGraph();
        vscode.window.showInformationMessage(`deltabox: reset ${selected.length} project(s).`);
    };
}
