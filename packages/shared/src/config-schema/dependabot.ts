import { z } from 'zod';

import { withEnabled } from './meta.js';

/** A single Dependabot group (eg. all patch/minor updates together). */
const dependabotGroupSchema = z.object({
    patterns: z.array(z.string()).describe('Package name patterns (default `["*"]`).').optional(),
    'exclude-patterns': z
        .array(z.string())
        .describe('Package name patterns to exclude.')
        .optional(),
    'update-types': z
        .array(z.string())
        .describe('Update types to group (eg. `["minor", "patch"]`).')
        .optional(),
});

/**
 * `.github/dependabot.yml` version-update automation. Enabled by presence; like
 * every other CI workflow it is opt-in.
 */
export const dependabotConfigSchema = withEnabled(
    z.object({
        schedule: z
            .enum(['daily', 'weekly', 'monthly'])
            .describe('Dependabot update interval (default `weekly`).')
            .optional(),
        directories: z
            .array(z.string())
            .describe('Directories to scan (default `["/"]`).')
            .optional(),
        ecosystems: z
            .array(z.string())
            .describe(
                'Package ecosystems (default `["github-actions", "npm"]`; `github-actions` ' +
                    'keeps `voidzero-dev/setup-vp` and the other actions up to date).'
            )
            .optional(),
        labels: z.array(z.string()).describe('Labels added to the update PRs.').optional(),
        openPullRequestsLimit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .describe('Maximum open update PRs per entry (Dependabot default 5).')
            .optional(),
        groups: z
            .record(z.string(), dependabotGroupSchema)
            .describe('Dependabot update groups, keyed by group name.')
            .optional(),
        filename: z
            .string()
            .describe('Override the generated file name (default `dependabot.yml`).')
            .optional(),
        dir: z.string().describe('Directory for the config (default `.github`).').optional(),
    })
)
    .describe(
        'Dependabot version-update automation (`.github/dependabot.yml`). Opt-in by presence.'
    )
    .meta({ id: 'ToolchainDependabotConfig' });
