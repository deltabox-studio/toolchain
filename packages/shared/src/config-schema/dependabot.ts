import { z } from 'zod';

import { withEnabled } from './meta.js';

/** A single Dependabot group (eg. all patch/minor updates together). */
const dependabotGroupSchema = z.object({
    'applies-to': z
        .enum(['version-updates', 'security-updates'])
        .describe('Which update kind this group applies to.')
        .default('version-updates')
        .optional(),
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

/** Severities accepted by the security triage (GitHub uses `medium`; `moderate` is an alias). */
const dependabotSeveritySchema = z.enum(['low', 'moderate', 'medium', 'high', 'critical', 'all']);

/** Vulnerability PR options: severity threshold or an explicit severity list. */
const dependabotVulnerabilitiesSchema = z.union([
    z.boolean(),
    z
        .object({
            severity: z
                .union([dependabotSeveritySchema, z.array(dependabotSeveritySchema).min(1)])
                .describe(
                    'Only keep vulnerability PRs at or above this severity (or exactly the listed severities). ' +
                        "`all` keeps every alert. `moderate` is accepted as an alias for GitHub's `medium`."
                )
                .default('all')
                .optional(),
        })
        .describe('Narrow vulnerability PRs to a severity threshold.'),
]);

/** Dependabot security-update automation (repository setting + grouped PRs). */
const dependabotSecuritySchema = z
    .object({
        enabled: z
            .boolean()
            .describe('Enable or disable the security-update automation.')
            .optional(),
        vulnerabilities: dependabotVulnerabilitiesSchema
            .describe(
                'Open PRs for vulnerable dependencies. Enabled by default when `security` is set; ' +
                    'set false to disable Dependabot security updates.'
            )
            .optional(),
        pr: z
            .object({
                strategy: z
                    .enum(['grouped', 'individual'])
                    .describe(
                        'Group security updates into one PR per ecosystem (default) or one PR per update.'
                    )
                    .default('grouped')
                    .optional(),
            })
            .describe('Pull-request strategy for security updates.')
            .optional(),
        workflow: z
            .boolean()
            .describe(
                'Generate the workflow that enables Dependabot security updates and applies the severity threshold. ' +
                    'Default true.'
            )
            .default(true)
            .optional(),
    })
    .describe('Dependabot security-update automation.')
    .meta({ id: 'ToolchainDependabotSecurityConfig' });

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
        security: z
            .union([z.boolean(), dependabotSecuritySchema])
            .describe(
                'Security updates: enable Dependabot security updates, group vulnerability PRs and apply a severity threshold. ' +
                    'Requires a repository admin token for the generated workflow.'
            )
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
        'Dependabot automation (`.github/dependabot.yml`, plus optional security updates). Opt-in by presence.'
    )
    .meta({
        id: 'ToolchainDependabotConfig',
        see: 'https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file',
    });
