import * as vscode from 'vscode';

import { parseWorkflowTargets, type WorkflowTarget, workflowQuickPickItems } from '../workflows.js';
import type { CommandDeps } from './deps.js';

const WORKFLOW_IDS = ['ci', 'changelog', 'release', 'sync', 'issues'];

export interface WorkflowCommands {
    pickWorkflows: (cwd: string) => Promise<string[] | undefined>;
    runWorkflow: (cwd: string) => Promise<void>;
}

/** Workflow picker + runner commands. */
export function createWorkflowCommands(deps: CommandDeps): WorkflowCommands {
    /** Prompt for one or more enabled workflows (multi-select). */
    const pickWorkflows = async (cwd: string): Promise<string[] | undefined> => {
        const result = await deps.captureCli(cwd, ['workflow', '--list', '--json']);
        let targets: WorkflowTarget[] = [];
        if (result.code === 0) targets = parseWorkflowTargets(result.stdout);
        if (targets.length === 0) {
            targets = WORKFLOW_IDS.map(id => ({ id, path: id, provider: 'github' }));
        }
        const picks = await vscode.window.showQuickPick(workflowQuickPickItems(targets), {
            canPickMany: true,
            placeHolder: 'Which workflows should run?',
        });
        return picks?.map(pick => pick.label);
    };

    const runWorkflow = async (cwd: string): Promise<void> => {
        const ids = await pickWorkflows(cwd);
        if (!ids || ids.length === 0) return;
        const code = await deps.runCli(cwd, ['workflow', ...ids]);
        if (code === 0) {
            vscode.window.showInformationMessage(`deltabox: triggered ${ids.join(', ')}.`);
        } else {
            vscode.window.showWarningMessage(
                'deltabox: could not run the workflow(s). See the output channel.'
            );
            deps.output.show();
        }
    };

    return { pickWorkflows, runWorkflow };
}
