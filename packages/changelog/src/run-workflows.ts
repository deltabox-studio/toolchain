/**
 * Trigger one or more of the generated workflows.
 *
 * GitHub Actions workflows are dispatched with `gh workflow run <file>`, GitLab
 * pipelines with `glab ci run` and Azure Pipelines with
 * `az pipelines run --name <pipeline>`. This module only checks that the
 * requested workflow is known, enabled in `dbx.config.*` (`ci.*` /
 * `ci.custom.*`) and actually present on disk (ie. has been synced) before
 * shelling out to the vendor's CLI.
 */

import type { ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
    spawnCross,
    sectionConfig,
    sectionEnabled,
    type ToolchainConfig,
    type WorkflowSetting,
} from '@deltabox/toolchain-shared';

import {
    isEnabled,
    isVendorWorkflowSetting,
    WORKFLOW_FILENAMES,
    workflowFilePath,
    type WorkflowId,
} from './workflows.js';

/** The CI vendor a workflow is written for. */
export type WorkflowProvider = 'github' | 'gitlab' | 'azure';

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
    /** The `glab` executable (default `glab`). */
    glab?: string;
    /** The `az` executable (default `az`). */
    az?: string;
}

/** One enabled workflow as it is generated on disk. */
export interface WorkflowTarget {
    /** The workflow id (`ci`, `release`, ...) or the custom workflow key. */
    id: string;
    /** Whether the target comes from `ci.custom`. */
    custom: boolean;
    /** The CI vendor the workflow targets (default `github`). */
    provider: WorkflowProvider;
    /** The workflow file's basename. */
    file: string;
    /** The repo-relative workflow file path (custom dir/filename included). */
    path: string;
    /** The Azure pipeline name to run (defaults to the file stem). */
    pipeline?: string;
}

export interface RanWorkflow {
    id: string;
    file: string;
    /** The CI vendor the workflow targets. */
    provider: WorkflowProvider;
    /** The CLI exit code (0 = triggered). */
    code: number;
    /** A user-facing failure (eg. the vendor CLI is not installed). */
    error?: string;
}

export interface RunWorkflowsResult {
    ran: RanWorkflow[];
}

/** The provider a setting targets (legacy settings are GitHub Actions). */
function providerOf(setting: WorkflowSetting | undefined): WorkflowProvider {
    return isVendorWorkflowSetting(setting) ? setting.provider : 'github';
}

/** The Azure pipeline name for a workflow file (`azure-pipelines.yml` → `azure-pipelines`). */
function pipelineName(file: string): string {
    return file.replace(/\.ya?ml$/i, '');
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
        const file = relative.split('/').pop() ?? relative;
        const provider = providerOf(setting);
        targets.push({
            id,
            custom: false,
            provider,
            file,
            path: relative,
            ...(provider === 'azure' ? { pipeline: pipelineName(file) } : {}),
        });
    }
    for (const [id, setting] of Object.entries(ci.custom ?? {})) {
        if (!isEnabled(setting)) continue;
        const relative = workflowFilePath(id, setting);
        const file = relative.split('/').pop() ?? relative;
        const provider = providerOf(setting);
        targets.push({
            id,
            custom: true,
            provider,
            file,
            path: relative,
            ...(provider === 'azure' ? { pipeline: pipelineName(file) } : {}),
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

/** A vendor CLI invocation. */
export interface WorkflowCommand {
    command: string;
    args: string[];
}

/**
 * The CLI command that triggers a workflow for its vendor. GitHub uses
 * `gh workflow run`, GitLab `glab ci run` and Azure `az pipelines run`.
 */
export function workflowRunCommand(
    target: WorkflowTarget,
    options: { ref?: string; gh?: string; glab?: string; az?: string } = {}
): WorkflowCommand {
    switch (target.provider) {
        case 'gitlab': {
            const args = ['ci', 'run'];
            if (options.ref) args.push('--branch', options.ref);
            return { command: options.glab ?? 'glab', args };
        }
        case 'azure': {
            const name = target.pipeline ?? pipelineName(target.file);
            const args = ['pipelines', 'run', '--name', name];
            if (options.ref) args.push('--branch', options.ref);
            return { command: options.az ?? 'az', args };
        }
        default: {
            const args = ['workflow', 'run', target.file];
            if (options.ref) args.push('--ref', options.ref);
            return { command: options.gh ?? 'gh', args };
        }
    }
}

/** A human-readable name for a provider's CLI. */
export function providerCli(provider: WorkflowProvider): string {
    switch (provider) {
        case 'gitlab':
            return 'glab';
        case 'azure':
            return 'az';
        default:
            return 'gh';
    }
}

interface CommandResult {
    code: number;
    /** The CLI could not be spawned (eg. it is not installed). */
    missing?: boolean;
}

/** Split a command string (`yarn glab`, `az.cmd`) into an executable + prefix args. */
export function splitCommand(command: string): { exe: string; prefix: string[] } {
    const [exe = command, ...prefix] = command.trim().split(/\s+/);
    return { exe, prefix };
}

/** Whether a command resolves on `PATH` (or is an existing path under `cwd`). */
function commandAvailable(command: string, cwd: string): boolean {
    if (command.includes('/') || command.includes('\\')) {
        return fs.existsSync(path.resolve(cwd, command));
    }
    const dirs = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
    // An explicit extension (`az.cmd`) must match the PATH entry exactly.
    if (/\.[A-Za-z0-9]+$/.test(command)) {
        return dirs.some(dir => fs.existsSync(path.join(dir, command)));
    }
    const exts =
        process.platform === 'win32'
            ? (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
            : [''];
    return dirs.some(dir => exts.some(ext => fs.existsSync(path.join(dir, `${command}${ext}`))));
}

function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
    return new Promise<CommandResult>(resolve => {
        let settled = false;
        const finish = (result: CommandResult): void => {
            if (settled) return;
            settled = true;
            resolve(result);
        };
        let child: ChildProcess;
        try {
            // `spawnCross` handles Windows `.cmd`/`.bat` shims (eg. `az`) without
            // a shell, escaping every argument.
            child = spawnCross(command, args, { cwd, stdio: 'inherit' });
        } catch {
            finish({ code: 1 });
            return;
        }
        child.on('error', error => {
            const code = (error as NodeJS.ErrnoException).code;
            finish({ code: 1, ...(code === 'ENOENT' ? { missing: true } : {}) });
        });
        child.on('exit', code => finish({ code: code ?? 0 }));
    });
}

/**
 * Trigger the requested workflows (all enabled ones when none are named).
 * Throws when a workflow is unknown, disabled in the config or not generated.
 * A missing vendor CLI is reported per workflow instead of aborting the rest.
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
        selected = [];
        for (const target of targets) {
            // Two config keys can resolve to the same file (eg. a vendor's
            // conventional root file); run each path once.
            if (!selected.some(candidate => candidate.path === target.path)) selected.push(target);
        }
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

    const ran: RanWorkflow[] = [];
    for (const target of selected) {
        const abs = path.resolve(cwd, target.path);
        if (!fs.existsSync(abs)) {
            throw new Error(`Workflow file not found: ${target.path}. Run \`dbx sync\` first.`);
        }
        const command = workflowRunCommand(target, {
            ...(options.ref ? { ref: options.ref } : {}),
            ...(options.gh ? { gh: options.gh } : {}),
            ...(options.glab ? { glab: options.glab } : {}),
            ...(options.az ? { az: options.az } : {}),
        });
        const cli = providerCli(target.provider);
        if (
            target.provider === 'github' &&
            !target.path.replace(/\\/g, '/').startsWith('.github/workflows/')
        ) {
            ran.push({
                id: target.id,
                file: target.file,
                provider: target.provider,
                code: 1,
                error: `\`gh workflow run\` only runs workflows under .github/workflows (got ${target.path}).`,
            });
            continue;
        }
        const { exe, prefix } = splitCommand(command.command);
        if (!commandAvailable(exe, cwd)) {
            ran.push({
                id: target.id,
                file: target.file,
                provider: target.provider,
                code: 1,
                error:
                    `the \`${cli}\` CLI is required to run ${target.provider} workflows ` +
                    `(install it or pass \`--${cli} <cmd>\`).`,
            });
            continue;
        }
        const result = await runCommand(exe, [...prefix, ...command.args], cwd);
        ran.push({
            id: target.id,
            file: target.file,
            provider: target.provider,
            code: result.code,
            ...(result.missing
                ? {
                      error:
                          `the \`${cli}\` CLI is required to run ${target.provider} workflows ` +
                          `(install it or pass \`--${cli} <cmd>\`).`,
                  }
                : {}),
        });
    }

    return { ran };
}
