import path from 'node:path';

import * as vscode from 'vscode';

import type { CommandDeps } from './deps.js';

/** The `dbx migrate --from` sources, plus "all detected". */
const MIGRATION_SOURCES = [
    {
        label: 'All detected',
        value: 'all',
        description: 'Every source config found in the project',
    },
    { label: 'Biome', value: 'biome', description: 'biome.json -> Oxfmt / Oxlint' },
    { label: 'Prettier', value: 'prettier', description: '.prettierrc -> Oxfmt' },
    { label: 'Dprint', value: 'dprint', description: 'dprint.json -> Oxfmt' },
    { label: 'ESLint', value: 'eslint', description: '.eslintrc -> Oxlint' },
    { label: 'Oxc', value: 'oxc', description: '.oxfmtrc/.oxlintrc -> dbx.config' },
    { label: 'Vite config', value: 'vite', description: 'Fold vite.config.* into dbx.config' },
];

/** The migrate-tooling command handler. */
export function createMigrateCommand(deps: CommandDeps): (cwd?: string) => Promise<void> {
    return async (cwd?: string) => {
        const root = cwd ?? deps.workspaceRoots()[0];
        if (!root) {
            vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
            return;
        }
        const picked = await vscode.window.showQuickPick(MIGRATION_SOURCES, {
            placeHolder: 'Migrate which tooling config?',
            matchOnDescription: true,
        });
        if (!picked) return;
        const confirm = await vscode.window.showWarningMessage(
            `Migrate ${picked.label.toLowerCase()} in ${path.basename(root)}?`,
            { modal: true, detail: picked.description },
            'Migrate'
        );
        if (confirm !== 'Migrate') return;
        const args = ['migrate', '--cwd', root, '--write'];
        if (picked.value !== 'all') args.push('--from', picked.value);
        if ((await deps.runCli(root, args)) === 0) {
            vscode.window.showInformationMessage(`deltabox: migration finished (${picked.label}).`);
            await deps.refreshGraph();
        } else {
            vscode.window.showWarningMessage('deltabox: migration failed. See the output channel.');
            deps.output.show();
        }
    };
}
