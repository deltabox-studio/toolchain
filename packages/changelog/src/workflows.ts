/**
 * Data-driven GitHub Actions workflow builder.
 *
 * Each default workflow is a plain object; a consumer's
 * `changelog.workflows.<id>` config is merged over it (branches, triggers,
 * extra top-level keys, extra steps/jobs, token overrides) and the result is
 * serialized to YAML by the shared emitter. This keeps every option
 * configurable and extensible without editing the workflow text.
 */

import {
    applyReplacementsDeep,
    type Replacements,
    toYaml,
    type WorkflowConfig,
    type WorkflowSetting,
    type WorkflowStep,
    type YamlValue,
} from '@deltabox/toolchain-shared';

export interface WorkflowJob {
    name?: string;
    'runs-on': string;
    if?: string;
    needs?: string | string[];
    permissions?: Record<string, string>;
    env?: Record<string, string>;
    outputs?: Record<string, string>;
    steps: WorkflowStep[];
}

export interface Workflow {
    name: string;
    on: Record<string, unknown>;
    permissions?: Record<string, string>;
    concurrency?: unknown;
    env?: Record<string, string>;
    jobs: Record<string, WorkflowJob>;
    [key: string]: unknown;
}

/** The default replacement values for the workflow templates. */
export const DEFAULT_WORKFLOW_TOKENS: Replacements = {
    nodeVersion: '22',
    yarnVersion: '4.17.1',
    packageManager: 'yarn',
    mainBranch: 'main',
    devBranch: 'dev',
    tooling: 'dbx',
};

/** The workflow ids the builder knows about. */
export type WorkflowId = 'ci' | 'changelog' | 'release' | 'sync' | 'issues';

/** Default file name per workflow id. */
export const WORKFLOW_FILENAMES: Record<WorkflowId, string> = {
    ci: 'ci.yml',
    changelog: 'changelog.yml',
    release: 'release.yml',
    sync: 'sync.yml',
    issues: 'issues.yml',
};

/** Whether a workflow setting enables the workflow (default true). */
export function isEnabled(setting: WorkflowSetting | undefined): boolean {
    if (setting === undefined) return true;
    if (typeof setting === 'boolean') return setting;
    return setting.enabled !== false;
}

function cli(tokens: Replacements): string {
    return `${tokens.packageManager} ${tokens.tooling}`;
}

/** The checkout + node + corepack + install steps shared by every job. */
function setupSteps(tokens: Replacements): WorkflowStep[] {
    return [
        {
            name: 'Checkout',
            uses: 'actions/checkout@v4',
            with: { 'fetch-depth': 0, token: '${{ secrets.GITHUB_TOKEN }}' },
        },
        {
            name: 'Setup Node',
            uses: 'actions/setup-node@v4',
            with: { 'node-version': String(tokens.nodeVersion) },
        },
        {
            name: 'Enable Corepack',
            run: `corepack enable\ncorepack prepare ${tokens.packageManager}@${tokens.yarnVersion} --activate`,
        },
        { name: 'Install dependencies', run: `${tokens.packageManager} install --immutable` },
    ];
}

/** Build all default workflows for a set of tokens. */
export function defaultWorkflows(tokens: Replacements): Record<WorkflowId, Workflow> {
    const engine = cli(tokens);
    const main = String(tokens.mainBranch);
    const dev = String(tokens.devBranch);

    return {
        ci: {
            name: 'CI',
            on: {
                push: { branches: [main] },
                pull_request: {
                    branches: ['release/**', 'feat/**', 'feature/**', 'fix/**', 'chore/**'],
                },
            },
            jobs: {
                ci: {
                    'runs-on': 'ubuntu-latest',
                    steps: [
                        ...setupSteps(tokens),
                        {
                            name: 'Commitlint (Conventional Commits)',
                            if: "${{ github.event_name == 'pull_request' || github.event.before != '0000000000000000000000000000000000000000' }}",
                            run: `set -euo pipefail\nbase="\${{ github.event.pull_request.base.sha || github.event.before }}"\nhead="\${{ github.event.pull_request.head.sha || github.event.after }}"\n${tokens.packageManager} commitlint --from "$base" --to "$head"`,
                        },
                        {
                            name: 'Verify generated files are in sync',
                            run: `${engine} sync --check`,
                        },
                        { name: 'Build', run: `${tokens.packageManager} build` },
                    ],
                },
            },
        },
        changelog: {
            name: 'Changelog (dev)',
            on: { push: { branches: [dev] } },
            permissions: { contents: 'write' },
            concurrency: { group: 'changelog-dev', 'cancel-in-progress': false },
            jobs: {
                'generate-changelog': {
                    'runs-on': 'ubuntu-latest',
                    if: "!startsWith(github.event.head_commit.message, 'chore: version packages ') && !startsWith(github.event.head_commit.message, 'release: ')",
                    env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
                    steps: [
                        ...setupSteps(tokens),
                        {
                            name: 'Generate changelog + bump versions',
                            env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
                            run: [
                                'set -euo pipefail',
                                'after="${{ github.event.after }}"; [ -n "$after" ] || after="HEAD"',
                                'boundary="$(git log --format=%H --grep=\'^chore: version packages \' -1 || true)"',
                                'if [ -n "$boundary" ]; then range="$boundary..$after"; else range="$after"; fi',
                                `${engine} changelog --range "$range"`,
                            ].join('\n'),
                        },
                        {
                            name: 'Commit + push changelog updates',
                            env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
                            run: [
                                'set -euo pipefail',
                                'git diff --quiet && { echo "No changelog changes."; exit 0; }',
                                'git config user.name "github-actions[bot]"',
                                'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
                                // Stage only the files this pipeline owns, so a
                                // stray working-tree change is never committed.
                                'git add -u -- "*package.json" "*CHANGELOG.md"',
                                'git commit -m "chore: version packages ($(node -p "require(\'./package.json\').version"))"',
                                `git push origin ${dev}`,
                            ].join('\n'),
                        },
                    ],
                },
            },
        },
        release: {
            name: 'Release',
            on: { push: { branches: [main] }, workflow_dispatch: null },
            permissions: { contents: 'write', 'pull-requests': 'write' },
            concurrency: { group: 'release', 'cancel-in-progress': false },
            jobs: {
                'create-release-pr': {
                    'runs-on': 'ubuntu-latest',
                    if: "(github.event_name == 'push' || github.event_name == 'workflow_dispatch') && !startsWith(github.event.head_commit.message, 'chore: version packages ') && !startsWith(github.event.head_commit.message, 'release: ')",
                    env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
                    steps: [
                        ...setupSteps(tokens),
                        {
                            name: 'Open release PR',
                            env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}' },
                            run: [
                                'set -euo pipefail',
                                'version="$(node -p "require(\'./package.json\').version")"',
                                'branch="release/$version"',
                                'if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then',
                                '  echo "Release PR already open for $version."; exit 0',
                                'fi',
                                'git config user.name "github-actions[bot]"',
                                'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
                                'git checkout -b "$branch"',
                                'git add -A',
                                'git commit -m "chore: version packages ($version)" || true',
                                'git push origin "$branch"',
                                'notes="$(awk \'/<!-- release:start -->/{f=1;next} /<!-- release:end -->/{exit} f{print}\' CHANGELOG.md 2>/dev/null || true)"',
                                '[ -n "$notes" ] || notes="Release $version"',
                                `gh pr create --base ${main} --head "$branch" --title "release: $version" --body "$notes"`,
                            ].join('\n'),
                        },
                    ],
                },
            },
        },
        sync: {
            name: 'Tooling sync',
            on: { push: { branches: [main, dev] }, pull_request: null },
            jobs: {
                sync: {
                    'runs-on': 'ubuntu-latest',
                    steps: [
                        ...setupSteps(tokens),
                        {
                            name: 'Verify generated files are in sync',
                            run: `${engine} sync --check`,
                        },
                    ],
                },
            },
        },
        issues: {
            name: 'Issues',
            on: { issues: { types: ['opened'] } },
            permissions: { issues: 'write' },
            jobs: {
                'enforce-title': {
                    'runs-on': 'ubuntu-latest',
                    steps: [
                        {
                            name: 'Check and rename issue title',
                            env: {
                                GH_TOKEN: '${{ github.token }}',
                                ISSUE_NUMBER: '${{ github.event.issue.number }}',
                            },
                            run: [
                                'set -euo pipefail',
                                'labels=$(gh issue view "$ISSUE_NUMBER" --json labels -q \'.labels[].name\' || true)',
                                'title=$(gh issue view "$ISSUE_NUMBER" --json title -q \'.title\')',
                                'type=""',
                                'for label in $labels; do case "$label" in *bug*) type="bug" ;; esac; done',
                                'if [ -z "$type" ]; then for label in $labels; do case "$label" in *enhancement*|*feature*|*feat*) type="feat" ;; esac; done; fi',
                                'if [ -z "$type" ]; then echo "No bug/enhancement label on issue #$ISSUE_NUMBER; skipping."; exit 0; fi',
                                'prefix="[bug]"; [ "$type" = "feat" ] && prefix="[feat]"',
                                "stripped=$(printf '%s' \"$title\" | sed -E 's/^\\[(bug|feat)\\] *//i')",
                                'new_title="$prefix $stripped"',
                                'if [ "$new_title" = "$title" ]; then echo "Issue #$ISSUE_NUMBER title already conforms."; exit 0; fi',
                                'gh issue edit "$ISSUE_NUMBER" --title "$new_title"',
                            ].join('\n'),
                        },
                    ],
                },
            },
        },
    };
}

/** Normalize a `steps` config into a list of per-job step groups. */
function stepGroups(
    config: WorkflowConfig
): { job?: string; before?: WorkflowStep[]; after?: WorkflowStep[] }[] {
    if (!config.steps) return [];
    return Array.isArray(config.steps) ? config.steps : [config.steps];
}

/** Merge a consumer's {@link WorkflowConfig} over a default workflow. */
export function applyWorkflowConfig(workflow: Workflow, config: WorkflowConfig = {}): Workflow {
    const next: Workflow = structuredClone(workflow);

    if (config.pushBranches) {
        const push = (next.on.push as Record<string, unknown> | undefined) ?? {};
        next.on.push = { ...push, branches: config.pushBranches };
    }
    if (config.pullRequestBranches) {
        const pr = (next.on.pull_request as Record<string, unknown> | undefined) ?? {};
        next.on.pull_request = { ...pr, branches: config.pullRequestBranches };
    }
    if (config.triggers) {
        next.on = { ...next.on, ...config.triggers };
    }
    if (config.extra) {
        Object.assign(next, config.extra);
    }
    if (config.jobs) {
        next.jobs = { ...next.jobs, ...(config.jobs as Record<string, WorkflowJob>) };
    }

    const jobIds = Object.keys(next.jobs);
    const defaultJob = jobIds[0];
    for (const group of stepGroups(config)) {
        const jobId = group.job ?? defaultJob;
        if (!jobId) continue;
        const job = next.jobs[jobId];
        if (!job) continue;
        job.steps = [...(group.before ?? []), ...job.steps, ...(group.after ?? [])];
    }

    return next;
}

export interface RenderWorkflowOptions {
    /** Base replacement tokens (merged with the workflow's own `tokens`). */
    tokens: Replacements;
    /** The consumer's per-workflow config. */
    config?: WorkflowConfig;
}

/**
 * Build one workflow as a YAML string, applying the consumer's config. Returns
 * `undefined` when the workflow is disabled.
 */
export function renderWorkflow(id: WorkflowId, options: RenderWorkflowOptions): string | undefined {
    const config = options.config ?? {};
    if (config.enabled === false) return undefined;
    const tokens = { ...DEFAULT_WORKFLOW_TOKENS, ...options.tokens, ...config.tokens };
    const base = defaultWorkflows(tokens)[id];
    // Resolve any `{{ }}` tokens that survived into the object (eg. extra steps).
    const resolved = applyReplacementsDeep(applyWorkflowConfig(base, config), tokens);
    return toYaml(resolved as unknown as Record<string, YamlValue>);
}

/** Render every workflow, keyed by file name (disabled ones are omitted). */
export function renderWorkflows(
    tokens: Replacements,
    workflows: Partial<Record<WorkflowId, WorkflowSetting>> = {}
): Record<string, string> {
    const out: Record<string, string> = {};
    for (const id of Object.keys(WORKFLOW_FILENAMES) as WorkflowId[]) {
        const setting = workflows[id];
        if (!isEnabled(setting)) continue;
        const config = typeof setting === 'object' ? setting : {};
        const yaml = renderWorkflow(id, { tokens, config });
        if (yaml) out[WORKFLOW_FILENAMES[id]] = yaml;
    }
    return out;
}
