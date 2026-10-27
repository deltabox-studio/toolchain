import { z } from 'zod';

import { section, withEnabled } from './meta.js';
import { workflowConfigSchema, workflowOptionsSchema } from './workflow.js';

/** Branch globs the generated changelog/CI workflows target. */
export const changelogBranchesConfigSchema = z
    .object({
        main: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Branch glob(s) the CI + release workflows run on, and the release PR ' +
                    'base (default `["main"]`).'
            )
            .optional(),
        dev: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Branch glob(s) the changelog/version workflow runs on. No default: ' +
                    'when omitted it reuses `main` (so a single-branch repo needs no `dev`).'
            )
            .optional(),
    })
    .describe('Branches the generated workflows target.')
    .meta({ id: 'ChangelogBranchesConfig' });

/** commitlint output location plus the Conventional-Commits allow-lists. */
export const changelogCommitlintConfigSchema = withEnabled(
    z.object({
        dir: z
            .string()
            .describe(
                'Directory the generated `commitlint.config.mjs` is written to ' +
                    '(default: the project root). The husky hook and CI use ' +
                    '`--config` to point at it.'
            )
            .optional(),
        types: z.array(z.string()).describe('Allowed commit types (commitlint).').optional(),
        scopes: z.array(z.string()).describe('Allowed commit scopes (commitlint).').optional(),
    }),
    'Enable commitlint (default true when the changelog is enabled). Set false to ' +
        'generate changelogs without the Conventional-Commits pipeline.'
)
    .describe('commitlint config, output location and allow-lists.')
    .meta({ id: 'ChangelogCommitlintConfig' });

/** Which `package.json` versions a changelog run bumps. */
export const changelogVersioningTargetSchema = z
    .enum(['uniform', 'root-only', 'individual'])
    .describe('Where the changelog version bump is applied.')
    .meta({ id: 'ChangelogVersioningTarget' });

/** Options for `ci.changelog.versioning` when configured as an object. */
export const changelogVersioningConfigSchema = z
    .object({
        target: changelogVersioningTargetSchema
            .describe(
                '`uniform` bumps the root and every workspace to one shared version; ' +
                    '`root-only` bumps the root only; `individual` bumps each changed ' +
                    'workspace independently (default `uniform`).'
            )
            .optional(),
        workspaces: z
            .array(z.string())
            .describe(
                'Glob patterns selecting the workspaces to version (relative to the ' +
                    'root). Defaults to the root `package.json` `workspaces` field; when ' +
                    'there is none the root `package.json` is used on its own.'
            )
            .optional(),
    })
    .describe('Automatic version bumping options.')
    .meta({ id: 'ChangelogVersioningConfig' });

/** Automatic version bumping: `true` (default), `false`, or a set of options. */
export const changelogVersioningSchema = z
    .union([z.boolean(), changelogVersioningConfigSchema])
    .describe('Automatic version bumping when a changelog entry is generated.')
    .meta({ id: 'ChangelogVersioning' });

/**
 * The changelog pipeline (`ci.changelog`): it configures the changelog workflow
 * and the options the local/CI changelog run uses. The whole section is opt-in
 * by presence; `enabled: false` (or `false`) disables both.
 */
export const changelogConfigSchema = withEnabled(
    workflowOptionsSchema.extend({
        branches: changelogBranchesConfigSchema
            .describe('Branches the generated workflows target.')
            .optional(),
        commitlint: section(changelogCommitlintConfigSchema)
            .describe(
                'commitlint config; set `false` to disable the Conventional-Commits pipeline.'
            )
            .optional(),
        versioning: changelogVersioningSchema
            .describe('Automatic version bumping on changelog generation (default `true`).')
            .optional(),
        vscode: z
            .boolean()
            .describe('Write the Conventional-Commits VS Code settings (default true).')
            .optional(),
    }),
    'Enable/disable the changelog workflow and pipeline (default: enabled when present).'
)
    .describe('Changelog workflow + pipeline: versioning, VS Code settings and commitlint.')
    .meta({ id: 'ChangelogConfig' });

/** A changelog workflow setting: a toggle, raw YAML, or the pipeline config. */
export const changelogWorkflowSettingSchema = z
    .union([z.boolean(), z.string(), changelogConfigSchema])
    .describe(
        '`true`/`false` to enable/disable, the changelog pipeline config object, or a ' +
            'raw YAML string written verbatim as the changelog workflow file.'
    )
    .meta({ id: 'ChangelogWorkflowSetting' });

/**
 * The deprecated pre-`ci` changelog section. It stays in the schema (marked
 * deprecated) so older configs still type-check, but the loader refuses to run
 * it — consumers must move it under `toolchain.ci.changelog`.
 */
export const legacyChangelogConfigSchema = withEnabled(
    z.object({
        workflows: workflowConfigSchema
            .describe('Deprecated: use the top-level `toolchain.ci` section instead.')
            .optional(),
        branches: changelogBranchesConfigSchema
            .describe('Deprecated: use `toolchain.ci.changelog.branches`.')
            .optional(),
        types: z
            .array(z.string())
            .describe('Deprecated: use `toolchain.ci.changelog.commitlint.types`.')
            .optional(),
        scopes: z
            .array(z.string())
            .describe('Deprecated: use `toolchain.ci.changelog.commitlint.scopes`.')
            .optional(),
        commitlint: z
            .object({
                dir: z.string().optional(),
            })
            .describe('Deprecated: use `toolchain.ci.changelog.commitlint`.')
            .optional(),
        versioning: changelogVersioningSchema
            .describe('Deprecated: use `toolchain.ci.changelog.versioning`.')
            .optional(),
        vscode: z.boolean().describe('Deprecated: use `toolchain.ci.changelog.vscode`.').optional(),
    })
)
    .describe(
        'Deprecated: the old `toolchain.changelog` section. Move it to ' +
            '`toolchain.ci.changelog` (and its workflows to the top-level `toolchain.ci`).'
    )
    .meta({ id: 'ToolchainChangelogConfig', deprecated: true });
