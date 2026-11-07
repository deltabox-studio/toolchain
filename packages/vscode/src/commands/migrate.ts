import path from 'node:path';

import * as vscode from 'vscode';

import { discoverProjects } from '../projects.js';
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

/** Pick the project (or repo root) a migration should run in. */
async function pickMigrationTarget(deps: CommandDeps): Promise<string | undefined> {
    const root = deps.workspaceRoots()[0];
    if (!root) {
        vscode.window.showWarningMessage('deltabox: open a workspace folder first.');
        return undefined;
    }
    const projects = discoverProjects().filter(project => project.dir !== root);
    const target = await vscode.window.showQuickPick(
        [
            {
                label: 'Repository root',
                description: path.basename(root),
                detail: root,
                dir: root,
            },
            ...projects.map(project => ({
                label: project.label,
                description: project.relativePath,
                detail: project.dir,
                dir: project.dir,
            })),
        ],
        { placeHolder: 'Migrate tooling in which project?', matchOnDetail: true }
    );
    return target?.dir;
}

/** The migrate-tooling command handler. */
export function createMigrateCommand(deps: CommandDeps): (cwd?: string) => Promise<void> {
    return async (cwd?: string) => {
        const target = cwd ?? (await pickMigrationTarget(deps));
        if (!target) return;
        const picked = await vscode.window.showQuickPick(MIGRATION_SOURCES, {
            placeHolder: 'Migrate which tooling config?',
            matchOnDescription: true,
        });
        if (!picked) return;
        const confirm = await vscode.window.showWarningMessage(
            `Migrate ${picked.label.toLowerCase()} in ${path.basename(target)}?`,
            { modal: true, detail: picked.description },
            'Migrate'
        );
        if (confirm !== 'Migrate') return;
        const args = ['migrate', '--cwd', target, '--write'];
        if (picked.value !== 'all') args.push('--from', picked.value);
        if ((await deps.runCli(target, args)) === 0) {
            vscode.window.showInformationMessage(`deltabox: migration finished (${picked.label}).`);
            await deps.refreshGraph();
        } else {
            vscode.window.showWarningMessage('deltabox: migration failed. See the output channel.');
            deps.output.show();
        }
    };
}
