/**
 * Trigger one or more of the generated GitHub workflows.
 *
 * The workflows are dispatched on GitHub with `gh workflow run <file>`; this
 * module only checks that the requested workflow is known, enabled in
 * `dbx.config.*` (`ci.*` / `ci.custom.*`) and actually present on disk
 * (ie. has been synced) before shelling out.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
    sectionConfig,
    sectionEnabled,
    type ToolchainConfig,
    type WorkflowSetting,
} from '@deltabox/toolchain-shared';

import { isEnabled, WORKFLOW_FILENAMES, workflowFilePath, type WorkflowId } from './workflows.js';

export interface RunWorkflowsOptions {
    /** The project root the workflows live under. */
    cwd: string;
    /** Workflow ids, custom ids, or file names to run (default: every enabled workflow). */
    workflows?: string[];
    /** Git ref to run the workflow on (eg. `main`). */
    ref?: string;
    /** The loaded tooling config, used to check the `ci` workflows. */
    config?: ToolchainConfig;
    /** The `gh` executable (default `gh`). */
    gh?: string;
}

/** One enabled workflow as it is generated on disk. */
export interface WorkflowTarget {
    /** The workflow id (`ci`, `release`, ...) or the custom workflow key. */
    id: string;
    /** Whether the target comes from `ci.custom`. */
    custom: boolean;
    /** The workflow file's basename. */
    file: string;
    /** The repo-relative workflow file path (custom dir/filename included). */
    path: string;
}

export interface RanWorkflow {
    id: string;
    file: string;
    /** The `gh` exit code (0 = triggered). */
    code: number;
}

export interface RunWorkflowsResult {
    ran: RanWorkflow[];
}

/** Resolve a workflow id or file name (`ci` / `ci.yml`) to a known built-in id. */
export function resolveWorkflowId(name: string): WorkflowId | undefined {
    const cleaned = name
        .trim()
        .replace(/\.ya?ml$/i, '')
        .toLowerCase();
    return (Object.keys(WORKFLOW_FILENAMES) as WorkflowId[]).find(id => id === cleaned);
}

/** Every enabled workflow target for a config (built-ins + `ci.custom`). */
export function workflowTargets(config?: ToolchainConfig): WorkflowTarget[] {
    const ci = sectionEnabled(config?.ci) ? sectionConfig(config?.ci) : undefined;
    if (!ci) return [];
    const targets: WorkflowTarget[] = [];
    for (const id of Object.keys(WORKFLOW_FILENAMES) as WorkflowId[]) {
        const setting = ci[id] as WorkflowSetting | undefined;
        if (!isEnabled(setting)) continue;
        const relative = workflowFilePath(id, setting, WORKFLOW_FILENAMES[id]);
        targets.push({
            id,
            custom: false,
            file: relative.split('/').pop() ?? relative,
            path: relative,
        });
    }
    for (const [id, setting] of Object.entries(ci.custom ?? {})) {
        if (!isEnabled(setting)) continue;
        const relative = workflowFilePath(id, setting);
        targets.push({
            id,
            custom: true,
            file: relative.split('/').pop() ?? relative,
            path: relative,
        });
    }
    return targets;
}

/** Find an enabled workflow by id, custom id, file basename, or relative path. */
export function resolveWorkflowTarget(
    name: string,
    targets: WorkflowTarget[]
): WorkflowTarget | undefined {
    const cleaned = name.trim();
    const stem = cleaned.replace(/\.ya?ml$/i, '').toLowerCase();
    return targets.find(
        target =>
            target.id === cleaned ||
            target.id.toLowerCase() === cleaned.toLowerCase() ||
            target.file === cleaned ||
            target.path === cleaned ||
            target.file.replace(/\.ya?ml$/i, '').toLowerCase() === stem
    );
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
    const targets = workflowTargets(options.config);

    const requested = (options.workflows ?? []).map(name => name.trim()).filter(Boolean);
    let selected: WorkflowTarget[];

    if (requested.length === 0) {
        if (targets.length === 0) {
            throw new Error('No workflows are enabled in dbx.config.* (ci.<workflow>).');
        }
        selected = targets;
    } else {
        selected = [];
        for (const name of requested) {
            const target = resolveWorkflowTarget(name, targets);
            if (!target) {
                const known = targets.map(candidate => candidate.id).join(', ');
                throw new Error(
                    `Unknown or disabled workflow "${name}". Enabled workflows: ${known || 'none'}.`
                );
            }
            if (!selected.some(candidate => candidate.path === target.path)) selected.push(target);
        }
    }

    const gh = options.gh ?? 'gh';
    const ran: RanWorkflow[] = [];
    for (const target of selected) {
        const abs = path.resolve(cwd, target.path);
        if (!fs.existsSync(abs)) {
            throw new Error(`Workflow file not found: ${target.path}. Run \`dbx sync\` first.`);
        }
        const args = ['workflow', 'run', target.file];
        if (options.ref) args.push('--ref', options.ref);
        ran.push({ id: target.id, file: target.file, code: await ghRun(args, cwd, gh) });
    }

    return { ran };
}
