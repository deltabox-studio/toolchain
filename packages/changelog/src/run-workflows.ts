/**
 * Trigger one or more of the generated GitHub workflows.
 *
 * The workflows are dispatched on GitHub with `gh workflow run <file>`; this
 * module only checks that the requested workflow is known, enabled in
 * `dbx.config.*` (`changelog.workflows`) and actually present on disk
 * (ie. has been synced) before shelling out.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { sectionConfig, sectionEnabled, type ToolchainConfig } from '@deltabox/toolchain-shared';

import { isEnabled, WORKFLOW_FILENAMES, type WorkflowId } from './workflows.js';

export interface RunWorkflowsOptions {
    /** The project root the workflows live under. */
    cwd: string;
    /** Workflow ids or file names to run (default: every enabled workflow). */
    workflows?: string[];
    /** Git ref to run the workflow on (eg. `main`). */
    ref?: string;
    /** The loaded tooling config, used to check `changelog.workflows`. */
    config?: ToolchainConfig;
    /** The `gh` executable (default `gh`). */
    gh?: string;
}

export interface RanWorkflow {
    id: WorkflowId;
    file: string;
    /** The `gh` exit code (0 = triggered). */
    code: number;
}

export interface RunWorkflowsResult {
    ran: RanWorkflow[];
}

/** Resolve a workflow id or file name (`ci` / `ci.yml`) to a known id. */
export function resolveWorkflowId(name: string): WorkflowId | undefined {
    const cleaned = name
        .trim()
        .replace(/\.ya?ml$/i, '')
        .toLowerCase();
    return (Object.keys(WORKFLOW_FILENAMES) as WorkflowId[]).find(id => id === cleaned);
}

function ghRun(args: string[], cwd: string, gh: string): Promise<number> {
    return new Promise<number>(resolve => {
        const child = spawn(gh, args, { cwd, stdio: 'inherit' });
        child.on('error', () => resolve(1));
        child.on('exit', code => resolve(code ?? 0));
    });
}

/**
 * Trigger the requested workflows (all enabled ones when none are named).
 * Throws when a workflow is unknown, disabled in the config or not generated.
 */
export async function runWorkflows(options: RunWorkflowsOptions): Promise<RunWorkflowsResult> {
    const { cwd } = options;
    const enabled = (id: WorkflowId): boolean =>
        sectionEnabled(options.config?.changelog) &&
        isEnabled(sectionConfig(options.config?.changelog)?.workflows?.[id]);

    const requested = (options.workflows ?? []).map(name => name.trim()).filter(Boolean);
    const ids: WorkflowId[] = [];

    if (requested.length === 0) {
        for (const id of Object.keys(WORKFLOW_FILENAMES) as WorkflowId[]) {
            if (enabled(id)) ids.push(id);
        }
        if (ids.length === 0) {
            throw new Error('No workflows are enabled in dbx.config.* (changelog.workflows).');
        }
    } else {
        for (const name of requested) {
            const id = resolveWorkflowId(name);
            if (!id) {
                throw new Error(
                    `Unknown workflow "${name}". Known workflows: ${Object.keys(WORKFLOW_FILENAMES).join(', ')}.`
                );
            }
            if (!enabled(id)) {
                throw new Error(
                    `Workflow "${id}" is not enabled in dbx.config.* (changelog.workflows.${id}).`
                );
            }
            if (!ids.includes(id)) ids.push(id);
        }
    }

    const gh = options.gh ?? 'gh';
    const ran: RanWorkflow[] = [];
    for (const id of ids) {
        const file = WORKFLOW_FILENAMES[id];
        const abs = path.resolve(cwd, '.github/workflows', file);
        if (!fs.existsSync(abs)) {
            throw new Error(
                `Workflow file not found: .github/workflows/${file}. Run \`dbx sync\` first.`
            );
        }
        const args = ['workflow', 'run', file];
        if (options.ref) args.push('--ref', options.ref);
        ran.push({ id, file, code: await ghRun(args, cwd, gh) });
    }

    return { ran };
}
