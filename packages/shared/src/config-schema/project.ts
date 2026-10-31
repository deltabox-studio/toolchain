import { z } from 'zod';

/** The kind of project a `dbx.config.*` lives in. */
export const projectTypeSchema = z
    .enum(['monorepo-root', 'monorepo-workspace', 'project'])
    .describe('The project kind (detected when omitted).')
    .meta({ id: 'ProjectType' });

/**
 * Project-level metadata: the canonical `package.json` fields (applied on sync,
 * and inherited by workspaces) plus the replacement tokens every template
 * understands. When a field is omitted it falls back to the project's own
 * `package.json` value.
 */
export const projectConfigSchema = z
    .object({
        type: projectTypeSchema.optional(),
        name: z
            .string()
            .describe('The unscoped project name (written as `<scope>/<name>`).')
            .optional(),
        scope: z.string().describe('The npm scope, eg. `@acme`.').optional(),
        author: z.string().describe('Package author (`package.json` `author`).').optional(),
        license: z.string().describe('SPDX license id (`package.json` `license`).').optional(),
        homepage: z.string().describe('Project homepage (`package.json` `homepage`).').optional(),
        repo: z
            .string()
            .describe(
                'Repository URL (`package.json` `repository`). For a workspace it also ' +
                    'resolves to the workspace path (`repository.directory`).'
            )
            .optional(),
        nodeVersion: z
            .string()
            .describe('Node version for CI/templates, eg. `22` (not `package.json` `engines`).')
            .optional(),
        packageManager: z
            .string()
            .describe('Package manager name, written as `<name>@<version>` (default `yarn`).')
            .optional(),
        packageManagerVersion: z
            .string()
            .describe('Package manager version, eg. `4.17.1`.')
            .optional(),
        description: z
            .string()
            .describe('One-line description (`package.json` `description`).')
            .optional(),
        inherit: z
            .boolean()
            .describe(
                'Inherit the parent project metadata (default true). Set false to keep ' +
                    'this project metadata independent of the root config (other sections ' +
                    'still merge normally).'
            )
            .optional(),
    })
    .describe(
        'Project metadata: canonical `package.json` fields and template tokens ' +
            '(shared fields are inherited by workspaces).'
    )
    .meta({ id: 'ToolchainProjectConfig' });
