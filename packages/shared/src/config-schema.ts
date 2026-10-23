/**
 * The `dbx.config` model as Zod schemas — the single source of truth.
 *
 * A `dbx.config.*` file exports `{ toolchain: { ...sections } }`; the toolchain
 * settings live under the `toolchain` key. The TypeScript types live in
 * `config-types.ts` (generated from these schemas by the config engine — run
 * `yarn config:types`), and the docs reference
 * (`apps/docs/config/reference.md`) plus the editor JSON Schema
 * (`config.schema.json`) are generated from them, so they can never drift.
 *
 * The `hooks` section is not here: it holds functions, which JSON Schema cannot
 * express, so it stays a hand-written TS interface in `toolchain.ts`.
 */

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
                    'this project entirely independent of the root config.'
            )
            .optional(),
    })
    .meta({ id: 'ToolchainProjectConfig' });

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
    .meta({ id: 'WorkflowStep' });

/** Extra steps to inject into a workflow's job(s). */
export const workflowStepsConfigSchema = z
    .object({
        job: z.string().describe('Target job id (defaults to the primary/first job).').optional(),
        before: z.array(workflowStepSchema).describe('Steps inserted at the start.').optional(),
        after: z.array(workflowStepSchema).describe('Steps appended at the end.').optional(),
    })
    .meta({ id: 'WorkflowStepsConfig' });

/** Per-workflow overrides merged over the default workflow. */
export const workflowConfigSchema = z
    .object({
        enabled: z.boolean().describe('Enable/disable this workflow (default true).').optional(),
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
    })
    .meta({ id: 'WorkflowConfig' });

/**
 * A workflow can be toggled with a boolean, configured with an object, or set to
 * a raw YAML string (written verbatim as the workflow file).
 */
export const workflowSettingSchema = z
    .union([z.boolean(), z.string(), workflowConfigSchema])
    .describe(
        '`true`/`false` to enable/disable, an object to override parts of the default, ' +
            'or a raw YAML string written verbatim as the workflow file.'
    )
    .meta({ id: 'WorkflowSetting' });

/** Per-workflow configuration, keyed by workflow id. */
export const changelogWorkflowsConfigSchema = z
    .object({
        ci: workflowSettingSchema.describe('The CI workflow (`ci.yml`).').optional(),
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
    })
    .meta({ id: 'ChangelogWorkflowsConfig' });

/** Which `package.json` versions a changelog run bumps. */
export const changelogVersioningTargetSchema = z
    .enum(['uniform', 'root-only', 'individual'])
    .describe('Where the changelog version bump is applied.')
    .meta({ id: 'ChangelogVersioningTarget' });

/** Options for `changelog.versioning` when configured as an object. */
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
    .meta({ id: 'ChangelogVersioningConfig' });

/** Automatic version bumping: `true` (default), `false`, or a set of options. */
export const changelogVersioningSchema = z
    .union([z.boolean(), changelogVersioningConfigSchema])
    .describe('Automatic version bumping when a changelog entry is generated.')
    .meta({ id: 'ChangelogVersioning' });

/** Conventional-Commits CI, commitlint and the changelog pipeline. */
export const changelogConfigSchema = z
    .object({
        enabled: z
            .boolean()
            .describe('Master switch (enabled when the section is defined).')
            .optional(),
        workflows: changelogWorkflowsConfigSchema
            .describe(
                'Which workflows to write into `.github/workflows`. Each id is ' +
                    '`true`/`false`, an object of overrides, or a raw YAML string ' +
                    'written verbatim.'
            )
            .optional(),
        branches: z
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
            .optional(),
        types: z.array(z.string()).describe('Allowed commit types (commitlint).').optional(),
        scopes: z.array(z.string()).describe('Allowed commit scopes (commitlint).').optional(),
        commitlint: z
            .object({
                dir: z
                    .string()
                    .describe(
                        'Directory the generated `commitlint.config.mjs` is written to ' +
                            '(default: the project root). The husky hook and CI use ' +
                            '`--config` to point at it.'
                    )
                    .optional(),
            })
            .describe('commitlint config output location.')
            .optional(),
        versioning: changelogVersioningSchema
            .describe('Automatic version bumping on changelog generation (default `true`).')
            .optional(),
        vscode: z.boolean().describe('Write the Conventional-Commits VS Code settings.').optional(),
    })
    .meta({ id: 'ToolchainChangelogConfig' });

/** Biome config generation (for consumers that still want a `biome.json`). */
export const biomeConfigSchema = z
    .object({
        enabled: z
            .boolean()
            .describe('Master switch (enabled when the section is defined).')
            .optional(),
        vscode: z.boolean().describe('Write the Biome VS Code settings (default true).').optional(),
        overrides: z
            .record(z.string(), z.unknown())
            .describe('Deep-merged over the generated `biome.json` (arrays union).')
            .optional(),
    })
    .meta({ id: 'ToolchainBiomeConfig' });

/** Workspace tsconfig generation (aliases + project references). */
export const tsconfigConfigSchema = z
    .object({
        enabled: z
            .boolean()
            .describe('Master switch (enabled when the section is defined).')
            .optional(),
        glob: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Glob(s) for the workspace default tsconfig files. Defaults to matching ' +
                    'every `defaultFile` recursively.'
            )
            .optional(),
        exclude: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Glob(s) to exclude from `glob`. Defaults to the common ignored paths ' +
                    '(`node_modules`, `.dbx`, `dist`, `build`, ...).'
            )
            .optional(),
        gitignore: z
            .boolean()
            .describe(
                'Also respect `.gitignore` files (root + nested) when matching `glob` ' +
                    '(default true).'
            )
            .optional(),
        refs: z.boolean().describe('Wire project references (default false).').optional(),
        composite: z.boolean().describe('Emit `composite: true` (default false).').optional(),
        aliases: z.boolean().describe('Inject path aliases (default true).').optional(),
        indent: z.number().describe('JSON indentation (default 4).').optional(),
        rootFile: z
            .string()
            .describe(
                'The workspaces tsconfig file name that holds `paths` + `references` ' +
                    '(default `tsconfig.workspaces.json`).'
            )
            .optional(),
        defaultFile: z
            .string()
            .describe(
                'The workspace default tsconfig file name that the generator expands ' +
                    '(default `tsconfig.default.json`).'
            )
            .optional(),
        buildFile: z
            .string()
            .describe('The workspace build tsconfig file name (default `tsconfig.build.json`).')
            .optional(),
    })
    .meta({ id: 'ToolchainTsconfigConfig' });

/** Watch behaviour for `dbx watch`. */
export const watchConfigSchema = z
    .object({
        enabled: z
            .boolean()
            .describe('Watch by default (enabled when the section is defined).')
            .optional(),
        debounce: z.number().describe('Debounce window in ms (default 150).').optional(),
        exclude: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Glob(s) excluded from watching. Defaults to the common ignored paths ' +
                    '(`node_modules`, `.dbx`, `dist`, `build`, ...).'
            )
            .optional(),
        gitignore: z
            .boolean()
            .describe(
                'Also respect `.gitignore` files (root + nested) when watching (default true).'
            )
            .optional(),
    })
    .meta({ id: 'ToolchainWatchConfig' });

/** Logging (level, colour, prefix) for every toolchain message. */
export const loggerConfigSchema = z
    .object({
        level: z
            .enum(['debug', 'info', 'warn', 'error', 'silent'])
            .describe('Minimum level to print (default `info`).')
            .optional(),
        color: z
            .boolean()
            .describe('Force colours on/off (default: on; `--no-color` disables).')
            .optional(),
        name: z
            .string()
            .describe('Prefix non-indented lines with `<name>:` (default `dbx`).')
            .optional(),
    })
    .meta({ id: 'ToolchainLoggerConfig' });

/** Provider command behaviour (colour of the provider passthrough commands). */
export const providersConfigSchema = z
    .object({
        color: z
            .boolean()
            .describe('Force provider command colours on/off (default: inherit the logger).')
            .optional(),
    })
    .meta({ id: 'ToolchainProvidersConfig' });

/** Where a template source is loaded from. */
export const templateSourceTypeSchema = z
    .enum(['builtin', 'local', 'npm', 'git', 'vite-plus'])
    .describe('How to load the source.')
    .meta({ id: 'ToolchainTemplateSourceType' });

/** What a template produces. */
export const templateKindSchema = z
    .enum(['project', 'workspace', 'application', 'folder', 'tooling', 'pipeline'])
    .describe('What the template produces.')
    .meta({ id: 'ToolchainTemplateKind' });

/** A source a template registry loads templates from (offline or online). */
export const templateSourceSchema = z
    .object({
        type: templateSourceTypeSchema.describe('How to load the source.'),
        locate: z.string().describe('A builtin id, local dir, npm scope, git URL or Vite+ id.'),
        id: z.string().describe('Stable id (defaults to the basename/scope).').optional(),
        name: z.string().describe('Display name override.').optional(),
        description: z.string().describe('Description override.').optional(),
        kind: templateKindSchema.describe('What the template produces.').optional(),
        ref: z.string().describe('Git branch/tag/commit.').optional(),
        subdir: z
            .string()
            .describe('Subdirectory within the source that holds the template.')
            .optional(),
        tags: z.array(z.string()).describe('Free-form tags.').optional(),
        online: z.boolean().describe('Whether the source needs network access.').optional(),
    })
    .meta({ id: 'ToolchainTemplateSource' });

/** Template sources / scaffolding. */
export const templatesConfigSchema = z
    .object({
        enabled: z
            .boolean()
            .describe('Master switch (enabled when the section is defined).')
            .optional(),
        sources: z
            .array(templateSourceSchema)
            .describe('Extra sources on top of the builtin + registry sources.')
            .optional(),
    })
    .meta({ id: 'ToolchainTemplatesConfig' });

/**
 * Package catalogs: a shared `package -> version range` map written to the
 * package manager's catalog file (`.yarnrc.yml` for Yarn, `pnpm-workspace.yaml`
 * for pnpm) so dependencies can be declared with `catalog:`.
 */
export const catalogsConfigSchema = z
    .object({
        enabled: z
            .boolean()
            .describe('Master switch (enabled when the section is defined).')
            .optional(),
        packages: z
            .record(z.string(), z.string())
            .describe('The default catalog: package name -> version range.')
            .optional(),
        named: z
            .record(z.string(), z.record(z.string(), z.string()))
            .describe('Named catalogs (Yarn `catalogs:` / pnpm `catalogs:`): name -> packages.')
            .optional(),
    })
    .meta({ id: 'ToolchainCatalogsConfig' });

/**
 * Vite+ configuration: the raw `vite.config.ts` object, held under
 * `toolchain.vite`, plus the single toolchain opt-out `config`.
 *
 * Every other key is passed through verbatim to the generated
 * `vite.config.ts` (see the `vite` sync task), so `dbx.config.*` is the only
 * hand-authored root config. `config: false` leaves a hand-written
 * `vite.config.ts` alone.
 */
export const viteConfigSchema = z
    .object({
        config: z
            .boolean()
            .describe('Write the managed `vite.config.ts` (default true).')
            .optional(),
    })
    .catchall(z.unknown())
    .meta({ id: 'ToolchainViteConfig' });

/** A section: enabled/disabled with a boolean, or configured with an object. */
function section<T extends z.ZodTypeAny>(schema: T) {
    return z.union([z.boolean(), schema]);
}

/** The full `dbx.config` schema (minus the function-bearing `hooks`). */
export const toolchainConfigSchema = z
    .object({
        project: projectConfigSchema
            .describe(
                'Project metadata: canonical `package.json` fields and template tokens ' +
                    '(inherited by workspaces).'
            )
            .optional(),
        changelog: section(changelogConfigSchema)
            .describe('Conventional-Commits CI, commitlint and the changelog pipeline.')
            .optional(),
        biome: section(biomeConfigSchema)
            .describe('Biome config generation (for consumers that still want a `biome.json`).')
            .optional(),
        tsconfig: section(tsconfigConfigSchema)
            .describe('Workspace tsconfig generation (path aliases + project references).')
            .optional(),
        templates: section(templatesConfigSchema)
            .describe('Template sources / scaffolding.')
            .optional(),
        catalogs: section(catalogsConfigSchema)
            .describe('Package catalogs written to the package manager catalog file (`catalog:`).')
            .optional(),
        vite: section(viteConfigSchema)
            .describe('The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.')
            .optional(),
        watch: section(watchConfigSchema).describe('Watch behaviour for `dbx watch`.').optional(),
        logger: section(loggerConfigSchema)
            .describe('Logging level, colours and prefix for toolchain output.')
            .optional(),
        providers: section(providersConfigSchema)
            .describe('Provider command behaviour (eg. colour for the passthrough commands).')
            .optional(),
    })
    .meta({ id: 'ToolchainConfigSections' });

/** The root `dbx.config` schema — the toolchain configuration lives under `toolchain`. */
export const dbxConfigSchema = z
    .object({
        toolchain: toolchainConfigSchema
            .describe('The `@deltabox/toolchain` settings (every section is opt-in by presence).')
            .optional(),
    })
    .meta({ id: 'DbxConfigSections' });

/**
 * Every named schema keyed by the TypeScript type it generates. The config
 * type generator walks this in order (dependencies first) to write
 * `packages/shared/src/config-types.ts`.
 */
export const CONFIG_TYPE_SCHEMAS = {
    ProjectType: projectTypeSchema,
    ToolchainProjectConfig: projectConfigSchema,
    WorkflowStep: workflowStepSchema,
    WorkflowStepsConfig: workflowStepsConfigSchema,
    WorkflowConfig: workflowConfigSchema,
    WorkflowSetting: workflowSettingSchema,
    ChangelogWorkflowsConfig: changelogWorkflowsConfigSchema,
    ChangelogVersioningTarget: changelogVersioningTargetSchema,
    ChangelogVersioningConfig: changelogVersioningConfigSchema,
    ChangelogVersioning: changelogVersioningSchema,
    ToolchainChangelogConfig: changelogConfigSchema,
    ToolchainBiomeConfig: biomeConfigSchema,
    ToolchainTsconfigConfig: tsconfigConfigSchema,
    ToolchainWatchConfig: watchConfigSchema,
    ToolchainTemplateSourceType: templateSourceTypeSchema,
    ToolchainTemplateKind: templateKindSchema,
    ToolchainTemplateSource: templateSourceSchema,
    ToolchainTemplatesConfig: templatesConfigSchema,
    ToolchainCatalogsConfig: catalogsConfigSchema,
    ToolchainViteConfig: viteConfigSchema,
    ToolchainLoggerConfig: loggerConfigSchema,
    ToolchainProvidersConfig: providersConfigSchema,
    ToolchainConfigSections: toolchainConfigSchema,
    DbxConfigSections: dbxConfigSchema,
} as const;

/** The section schemas keyed by config key, for the docs/JSON-Schema generator. */
export const CONFIG_SECTION_SCHEMAS = {
    project: projectConfigSchema,
    changelog: changelogConfigSchema,
    biome: biomeConfigSchema,
    tsconfig: tsconfigConfigSchema,
    templates: templatesConfigSchema,
    catalogs: catalogsConfigSchema,
    vite: viteConfigSchema,
    watch: watchConfigSchema,
    logger: loggerConfigSchema,
    providers: providersConfigSchema,
} as const;

/** One-line descriptions for the generated docs index. */
export const CONFIG_SECTION_DESCRIPTIONS: Record<keyof typeof CONFIG_SECTION_SCHEMAS, string> = {
    project:
        'Project metadata: canonical `package.json` fields (applied on sync, inherited by ' +
        'workspaces) plus the replacement tokens every template understands.',
    changelog: 'Conventional-Commits CI, commitlint and the changelog pipeline.',
    biome: 'Biome config generation (for consumers that still want a `biome.json`).',
    tsconfig: 'Workspace tsconfig generation (path aliases + project references).',
    templates: 'Template sources / scaffolding.',
    catalogs: 'Package catalogs written to the package manager catalog file (`catalog:`).',
    vite: 'The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.',
    watch: 'Watch behaviour for `dbx watch`.',
    logger: 'Logging level, colours and prefix for toolchain output.',
    providers: 'Provider command behaviour (eg. colour for the provider passthrough commands).',
};
