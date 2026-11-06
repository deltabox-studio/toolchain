import * as vscode from 'vscode';

import type { Project } from '../projects.js';

/** Prompt for a subset of projects (multi-select). */
export async function pickProjects(
    projects: Project[],
    placeHolder: string
): Promise<Project[] | undefined> {
    if (projects.length === 0) return [];
    const picks = await vscode.window.showQuickPick(
        projects.map(project => ({
            label: project.label,
            description: project.relativePath,
            detail: project.dir,
            project,
        })),
        { canPickMany: true, placeHolder }
    );
    return picks?.map(pick => pick.project);
}
