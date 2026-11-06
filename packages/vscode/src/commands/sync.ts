import path from 'node:path';

import * as vscode from 'vscode';

import { discoverProjects, type Project } from '../projects.js';
import type { CommandDeps } from './deps.js';

export interface SyncCommands {
    syncAll: () => Promise<void>;
    syncActive: () => Promise<void>;
    syncTsconfig: () => Promise<void>;
    syncSelected: () => Promise<void>;
    syncProject: (project: Project) => Promise<void>;
    checkSync: () => Promise<void>;
    checkProject: (dir: string, label: string) => Promise<void>;
}

/** The sync/check command handlers (single project, selected, all, tsconfig). */
export function createSyncCommands(deps: CommandDeps): SyncCommands {
    const syncActive = async (): Promise<void> => {
        const root = deps.workspaceRoots()[0];
        if (root) await deps.runCli(root, ['sync']);
        deps.refreshViews();
    };

    /**
     * Sync every discovered project. The CLI's recursive pass covers projects
     * with their own config (in dependency order); projects that only inherit
     * the root `dbx.config.*` are synced individually afterwards.
     */
    const syncAll = async (): Promise<void> => {
        await deps.refreshGraph();
        await deps.runRoots(['sync', '--recursive']);
        const configless = discoverProjects().filter(project => !project.hasConfig);
        if (configless.length > 0) await deps.runProjects(configless, ['sync']);
        deps.refreshViews();
    };

    const syncTsconfig = async (): Promise<void> => {
        await deps.runRoots(['sync', '--only', 'tsconfig']);
        deps.refreshViews();
    };

    const syncSelected = async (): Promise<void> => {
        const projects = deps.selectedProjects();
        if (projects.length === 0) {
            vscode.window.showInformationMessage(
                'Select one or more projects in the Projects view first.'
            );
            return;
        }
        await deps.runProjects(projects, ['sync']);
        deps.refreshViews();
    };

    const syncProject = async (project: Project): Promise<void> => {
        await deps.runCli(project.dir, ['sync']);
        deps.refreshViews();
    };

    const checkSync = async (): Promise<void> => {
        const roots = deps.workspaceRoots();
        if (roots.length === 0) {
            vscode.window.showWarningMessage('deltabox: no workspace folder open.');
            return;
        }
        const failed: string[] = [];
        for (const root of roots) {
            if ((await deps.runCli(root, ['sync', '--recursive', '--check'])) !== 0) {
                failed.push(path.basename(root));
            }
        }
        if (failed.length > 0) {
            const choice = await vscode.window.showWarningMessage(
                `deltabox: generated files are out of date in ${failed.join(', ')}.`,
                'Run sync',
                'Show output'
            );
            if (choice === 'Run sync') {
                await vscode.commands.executeCommand(`${deps.section}.syncAll`);
            } else if (choice === 'Show output') {
                deps.output.show();
            }
        } else {
            vscode.window.showInformationMessage('deltabox: all generated files are in sync.');
        }
    };

    const checkProject = async (dir: string, label: string): Promise<void> => {
        if ((await deps.runCli(dir, ['sync', '--check'])) === 0) {
            vscode.window.showInformationMessage(`deltabox: ${label} is in sync.`);
            return;
        }
        const choice = await vscode.window.showWarningMessage(
            `deltabox: ${label} is out of sync.`,
            'Run sync',
            'Show output'
        );
        if (choice === 'Run sync') {
            await deps.runCli(dir, ['sync']);
            deps.refreshViews();
        } else if (choice === 'Show output') {
            deps.output.show();
        }
    };

    return {
        syncAll,
        syncActive,
        syncTsconfig,
        syncSelected,
        syncProject,
        checkSync,
        checkProject,
    };
}
