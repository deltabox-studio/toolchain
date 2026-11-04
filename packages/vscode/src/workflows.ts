/**
 * The workflows the `dbx workflow --list --json` command reports.
 *
 * Kept free of `vscode` imports so the parsing and quick-pick shaping can be
 * unit tested.
 */

/** The CI vendor a workflow targets. */
export type WorkflowProvider = 'github' | 'gitlab' | 'azure';

/** One enabled workflow as the CLI reports it. */
export interface WorkflowTarget {
    /** The built-in id (`ci`, `release`, ...) or the custom workflow key. */
    id: string;
    /** The repo-relative workflow file path. */
    path: string;
    /** The CI vendor the workflow targets. */
    provider: WorkflowProvider;
    /** Whether the workflow comes from `ci.custom`. */
    custom?: boolean;
    /** The workflow file's basename. */
    file?: string;
}

/** A quick-pick item for a workflow target. */
export interface WorkflowQuickPickItem {
    label: string;
    description: string;
    detail: string;
    target: WorkflowTarget;
}

function isProvider(value: unknown): value is WorkflowProvider {
    return value === 'github' || value === 'gitlab' || value === 'azure';
}

/**
 * Parse `dbx workflow --list --json` output. Invalid entries are ignored; a
 * missing provider defaults to `github` (older CLI versions omit it).
 */
export function parseWorkflowTargets(stdout: string): WorkflowTarget[] {
    let parsed: unknown;
    try {
        parsed = JSON.parse(stdout);
    } catch {
        return [];
    }
    if (!Array.isArray(parsed)) return [];
    const targets: WorkflowTarget[] = [];
    for (const entry of parsed) {
        if (!entry || typeof entry !== 'object') continue;
        const value = entry as Record<string, unknown>;
        if (typeof value.id !== 'string' || typeof value.path !== 'string') continue;
        targets.push({
            id: value.id,
            path: value.path,
            provider: isProvider(value.provider) ? value.provider : 'github',
            ...(typeof value.custom === 'boolean' ? { custom: value.custom } : {}),
            ...(typeof value.file === 'string' ? { file: value.file } : {}),
        });
    }
    return targets;
}

/** Shape the targets for `showQuickPick` (the provider is visible per row). */
export function workflowQuickPickItems(targets: WorkflowTarget[]): WorkflowQuickPickItem[] {
    return targets.map(target => ({
        label: target.id,
        description: `${target.provider} · ${target.path}`,
        detail: target.custom
            ? 'Custom workflow (`ci.custom`)'
            : `Built-in workflow (\`ci.${target.id}\`)`,
        target,
    }));
}
