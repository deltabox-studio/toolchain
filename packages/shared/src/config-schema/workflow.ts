import { z } from 'zod';

import { withEnabled } from './meta.js';

/** A GitHub Actions step (the subset the workflow builder understands). */
export const workflowStepSchema = z
    .object({
        name: z.string().describe('Step display name.').optional(),
        id: z.string().describe('Step id (for `steps.<id>` outputs).').optional(),
        if: z.string().describe('Conditional expression (`if:`).').optional(),
        uses: z.string().describe('Action to run (`uses:`), eg. `actions/checkout@v4`.').optional(),
        run: z.string().describe('Shell command(s) to run (`run:`).').optional(),
        shell: z.string().describe('Shell to run `run` in, eg. `bash`.').optional(),
        'working-directory': z.string().describe('Directory the step runs in.').optional(),
        with: z
            .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
            .describe('Inputs for a `uses` action.')
            .optional(),
        env: z
            .record(z.string(), z.string())
            .describe('Environment variables for the step.')
            .optional(),
    })
    .describe('A GitHub Actions workflow step.')
    .meta({ id: 'WorkflowStep' });

/** Extra steps to inject into a workflow's job(s). */
export const workflowStepsConfigSchema = z
    .object({
        job: z.string().describe('Target job id (defaults to the primary/first job).').optional(),
        before: z.array(workflowStepSchema).describe('Steps inserted at the start.').optional(),
        after: z.array(workflowStepSchema).describe('Steps appended at the end.').optional(),
    })
    .describe('Extra steps to inject into a workflow job.')
    .meta({ id: 'WorkflowStepsConfig' });

/** Per-workflow overrides merged over the default workflow. */
export const workflowOptionsSchema = withEnabled(
    z.object({
        pushBranches: z.array(z.string()).describe('Replace `on.push.branches`.').optional(),
        pullRequestBranches: z
            .array(z.string())
            .describe('Replace `on.pull_request.branches`.')
            .optional(),
        triggers: z.record(z.string(), z.unknown()).describe('Extra `on.*` triggers.').optional(),
        extra: z
            .record(z.string(), z.unknown())
            .describe('Extra top-level keys (`permissions`, `concurrency`, `env`, ...).')
            .optional(),
        steps: z
            .union([workflowStepsConfigSchema, z.array(workflowStepsConfigSchema)])
            .describe('Extra steps for a job (one group, or per-job groups).')
            .optional(),
        jobs: z
            .record(z.string(), z.unknown())
            .describe('Extra complete jobs merged in.')
            .optional(),
        tokens: z
            .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
            .describe('Per-workflow token overrides (`nodeVersion`, `packageManager`, ...).')
            .optional(),
        filename: z
            .string()
            .describe('Override the generated workflow file name (eg. `deploy.yml`).')
            .optional(),
        dir: z
            .string()
            .describe('Directory for the workflow file (default `.github/workflows`).')
            .optional(),
    }),
    'Enable/disable this workflow (default: enabled when present).'
)
    .describe('Per-workflow overrides merged over the generated default.')
    .meta({ id: 'WorkflowOptions' });

/**
 * A workflow can be toggled with a boolean, configured with an object, or set to
 * a raw YAML string (written verbatim as the workflow file).
 */
export const workflowSettingSchema = z
    .union([z.boolean(), z.string(), workflowOptionsSchema])
    .describe(
        '`true`/`false` to enable/disable, an object to override parts of the default, ' +
            'or a raw YAML string written verbatim as the workflow file.'
    )
    .meta({ id: 'WorkflowSetting' });

/**
 * A custom workflow is enabled by presence (no boolean): a raw YAML string is
 * written verbatim, or an options object is merged over an empty workflow
 * (`triggers`, `extra`, `jobs`, ... build the workflow).
 */
export const customWorkflowSettingsSchema = z
    .union([z.string(), workflowOptionsSchema])
    .describe(
        'A custom workflow: a raw YAML string, or workflow settings merged over an empty ' +
            'workflow (use `triggers`, `extra` and `jobs` to define it).'
    )
    .meta({ id: 'CustomWorkflowSettings' });

/**
 * The opt-in CI workflows, keyed by workflow id. Each entry is opt-in: omit it
 * (or set it to `false`) to leave that workflow unmanaged.
 */
export const workflowConfigSchema = z
    .object({
        ci: workflowSettingSchema.describe('The CI checks workflow (`ci.yml`).').optional(),
        changelog: workflowSettingSchema
            .describe('The changelog/version workflow (`changelog.yml`).')
            .optional(),
        release: workflowSettingSchema.describe('The release workflow (`release.yml`).').optional(),
        issues: workflowSettingSchema
            .describe('The issue-title workflow (`issues.yml`).')
            .optional(),
        sync: workflowSettingSchema
            .describe('The toolchain sync workflow (`sync.yml`).')
            .optional(),
        custom: z
            .record(z.string(), customWorkflowSettingsSchema)
            .describe(
                'Additional custom workflows, keyed by id (eg. `custom.my-workflow`). ' +
                    'Each id writes `<dir>/<filename ?? id>.yml`.'
            )
            .optional(),
    })
    .describe(
        'The GitHub Actions workflows to generate. Every workflow is opt-in: omit ' +
            'it (or set it to `false`) to leave it unmanaged.'
    )
    .meta({ id: 'WorkflowConfig' });
