import { z } from 'zod';

import { withEnabled } from './meta.js';

/** A single Dependabot group (eg. all patch/minor updates together). */
const dependabotGroupSchema = z.object({
    patterns: z.array(z.string()).describe('Package name patterns.').default(['*']).optional(),
    'exclude-patterns': z
        .array(z.string())
        .describe('Package name patterns to exclude.')
        .optional(),
    'update-types': z
        .array(z.string())
        .describe('Update types to group (eg. `["minor", "patch"]`).')
        .optional(),
});

/** A Dependabot allow/ignore rule. */
const dependabotRuleSchema = z.object({
    'dependency-name': z.string().describe('Dependency name or `*` pattern.'),
    'dependency-type': z
        .enum(['direct', 'indirect', 'production', 'development'])
        .describe('Restrict the rule to a dependency type.')
        .optional(),
    'update-types': z
        .array(z.string())
        .describe('Update types (eg. `version-update:semver-major`).')
        .optional(),
    versions: z.array(z.string()).describe('Version ranges to allow/ignore.').optional(),
});

/** Allow/ignore rules applied to every ecosystem, or keyed by ecosystem. */
const dependabotRulesSchema = z
    .union([z.array(dependabotRuleSchema), z.record(z.string(), z.array(dependabotRuleSchema))])
    .describe(
        'Rules for every ecosystem (an array) or keyed by package ecosystem (eg. `{ npm: [...] }`; `*` is the fallback).'
    );

/**
 * `.github/dependabot.yml` version-update automation. Enabled by presence; like
 * every other CI workflow it is opt-in.
 */
export const dependabotConfigSchema = withEnabled(
    z.object({
        schedule: z
            .enum(['daily', 'weekly', 'monthly'])
            .describe('Dependabot update interval.')
            .default('weekly')
            .optional(),
        directories: z.array(z.string()).describe('Directories to scan.').default(['/']).optional(),
        ecosystems: z
            .array(z.string())
            .describe(
                'Package ecosystems. `github-actions` keeps `voidzero-dev/setup-vp` and the ' +
                    'other actions up to date.'
            )
            .default(['github-actions', 'npm'])
            .optional(),
        labels: z.array(z.string()).describe('Labels added to the update PRs.').optional(),
        openPullRequestsLimit: z
            .number()
            .int()
            .min(1)
            .max(100)
            .describe('Maximum open update PRs per entry.')
            .default(5)
            .optional(),
        groups: z
            .record(z.string(), dependabotGroupSchema)
            .describe('Dependabot update groups, keyed by group name.')
            .optional(),
        allow: dependabotRulesSchema.optional(),
        ignore: dependabotRulesSchema.optional(),
        filename: z
            .string()
            .describe('Override the generated file name.')
            .default('dependabot.yml')
            .optional(),
        dir: z.string().describe('Directory for the config.').default('.github').optional(),
    })
)
    .describe(
        'Dependabot version-update automation (`.github/dependabot.yml`). Opt-in by presence.'
    )
    .meta({
        id: 'ToolchainDependabotConfig',
        see: 'https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file',
    });
