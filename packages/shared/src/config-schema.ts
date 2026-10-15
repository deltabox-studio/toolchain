/**
 * The `dbx.config` model as Zod schemas — the single source of truth.
 *
 * A `dbx.config.*` file exports `{ toolchain: { ...sections } }`; the toolchain
 * settings live under the `toolchain` key. The TypeScript types are derived from
 * these schemas (`z.infer`), and the docs reference
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
    .describe('The project kind (detected when omitted).');
export type ProjectType = z.infer<typeof projectTypeSchema>;

/** Project-level metadata used as replacement tokens across every template. */
export const projectConfigSchema = z.object({
    type: projectTypeSchema.optional(),
    name: z.string().describe('The unscoped project name.').optional(),
    scope: z.string().describe('The npm scope, eg. `@acme`.').optional(),
    author: z.string().describe('Package author.').optional(),
    license: z.string().describe('SPDX license id.').optional(),
    homepage: z.string().describe('Project homepage.').optional(),
    repo: z.string().describe('Repository URL, eg. `https://github.com/acme/app`.').optional(),
    nodeVersion: z.string().describe('Node engine range, eg. `>=22`.').optional(),
    packageManager: z.string().describe('Package manager name (default `yarn`).').optional(),
    packageManagerVersion: z.string().describe('Package manager version, eg. `4.17.1`.').optional(),
    description: z.string().describe('One-line description.').optional(),
});
export type ToolingProjectConfig = z.infer<typeof projectConfigSchema>;

/** A GitHub Actions step (the subset the workflow builder understands). */
export const workflowStepSchema = z.object({
    name: z.string().optional(),
    id: z.string().optional(),
    if: z.string().optional(),
    uses: z.string().optional(),
    run: z.string().optional(),
    shell: z.string().optional(),
    'working-directory': z.string().optional(),
    with: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    env: z.record(z.string(), z.string()).optional(),
});
export type WorkflowStep = z.infer<typeof workflowStepSchema>;

/** Extra steps to inject into a workflow's job(s). */
export const workflowStepsConfigSchema = z.object({
    job: z.string().describe('Target job id (defaults to the primary/first job).').optional(),
    before: z.array(workflowStepSchema).describe('Steps inserted at the start.').optional(),
    after: z.array(workflowStepSchema).describe('Steps appended at the end.').optional(),
});
export type WorkflowStepsConfig = z.infer<typeof workflowStepsConfigSchema>;

/** Per-workflow overrides merged over the default workflow. */
export const workflowConfigSchema = z.object({
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
    jobs: z.record(z.string(), z.unknown()).describe('Extra complete jobs merged in.').optional(),
    tokens: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .describe('Per-workflow token overrides (`nodeVersion`, `packageManager`, ...).')
        .optional(),
});
export type WorkflowConfig = z.infer<typeof workflowConfigSchema>;

/** A workflow can be toggled with a boolean or configured with an object. */
export const workflowSettingSchema = z.union([z.boolean(), workflowConfigSchema]);
export type WorkflowSetting = z.infer<typeof workflowSettingSchema>;

/** Per-workflow configuration, keyed by workflow id. */
export const changelogWorkflowsConfigSchema = z.object({
    ci: workflowSettingSchema.optional(),
    changelog: workflowSettingSchema.optional(),
    release: workflowSettingSchema.optional(),
    issues: workflowSettingSchema.optional(),
    sync: workflowSettingSchema.optional(),
});
export type ChangelogWorkflowsConfig = z.infer<typeof changelogWorkflowsConfigSchema>;

/** Conventional-Commits CI, commitlint and the changelog pipeline. */
export const changelogConfigSchema = z.object({
    enabled: z
        .boolean()
        .describe('Master switch (enabled when the section is defined).')
        .optional(),
    workflows: changelogWorkflowsConfigSchema
        .describe('Which workflows to write into `.github/workflows`.')
        .optional(),
    branches: z
        .object({ main: z.string().optional(), dev: z.string().optional() })
        .describe('Branch names the workflows target.')
        .optional(),
    types: z.array(z.string()).describe('Allowed commit types (commitlint).').optional(),
    scopes: z.array(z.string()).describe('Allowed commit scopes (commitlint).').optional(),
    vscode: z.boolean().describe('Write the Conventional-Commits VS Code settings.').optional(),
});
export type ToolingChangelogConfig = z.infer<typeof changelogConfigSchema>;

/** Biome config generation (for consumers that still want a `biome.json`). */
export const biomeConfigSchema = z.object({
    enabled: z
        .boolean()
        .describe('Master switch (enabled when the section is defined).')
        .optional(),
    vscode: z.boolean().describe('Write the Biome VS Code settings (default true).').optional(),
    overrides: z
        .record(z.string(), z.unknown())
        .describe('Deep-merged over the generated `biome.json` (arrays union).')
        .optional(),
});
export type ToolingBiomeConfig = z.infer<typeof biomeConfigSchema>;

/** Workspace tsconfig generation (aliases + project references). */
export const tsconfigConfigSchema = z.object({
    enabled: z
        .boolean()
        .describe('Master switch (enabled when the section is defined).')
        .optional(),
    glob: z.string().describe('Glob for workspace `tsconfig.default.json` files.').optional(),
    appGlob: z.string().describe('Glob for "override" (app) workspaces.').optional(),
    refs: z.boolean().describe('Wire project references (default false).').optional(),
    composite: z.boolean().describe('Emit `composite: true` (default false).').optional(),
    aliases: z.boolean().describe('Inject path aliases (default true).').optional(),
    indent: z.number().describe('JSON indentation (default 4).').optional(),
    rootFile: z
        .string()
        .describe('The monorepo tsconfig file name (default `tsconfig.monorepo.json`).')
        .optional(),
});
export type ToolingTsconfigConfig = z.infer<typeof tsconfigConfigSchema>;

/** Watch behaviour for `dbx watch`. */
export const watchConfigSchema = z.object({
    enabled: z
        .boolean()
        .describe('Watch by default (enabled when the section is defined).')
        .optional(),
    debounce: z.number().describe('Debounce window in ms (default 150).').optional(),
});
export type ToolingWatchConfig = z.infer<typeof watchConfigSchema>;

/** Where a template source is loaded from. */
export const templateSourceTypeSchema = z
    .enum(['builtin', 'local', 'npm', 'git', 'vite-plus'])
    .describe('How to load the source.');
export type ToolingTemplateSourceType = z.infer<typeof templateSourceTypeSchema>;

/** What a template produces. */
export const templateKindSchema = z
    .enum(['project', 'workspace', 'application', 'folder', 'tooling', 'pipeline'])
    .describe('What the template produces.');
export type ToolingTemplateKind = z.infer<typeof templateKindSchema>;

/** A source a template registry loads templates from (offline or online). */
export const templateSourceSchema = z.object({
    type: templateSourceTypeSchema,
    locate: z.string().describe('A builtin id, local dir, npm scope, git URL or Vite+ id.'),
    id: z.string().describe('Stable id (defaults to the basename/scope).').optional(),
    name: z.string().describe('Display name override.').optional(),
    description: z.string().describe('Description override.').optional(),
    kind: templateKindSchema.optional(),
    ref: z.string().describe('Git branch/tag/commit.').optional(),
    subdir: z
        .string()
        .describe('Subdirectory within the source that holds the template.')
        .optional(),
    tags: z.array(z.string()).describe('Free-form tags.').optional(),
    online: z.boolean().describe('Whether the source needs network access.').optional(),
});
export type ToolingTemplateSource = z.infer<typeof templateSourceSchema>;

/** Template sources / scaffolding. */
export const templatesConfigSchema = z.object({
    enabled: z
        .boolean()
        .describe('Master switch (enabled when the section is defined).')
        .optional(),
    sources: z
        .array(templateSourceSchema)
        .describe('Extra sources on top of the builtin + registry sources.')
        .optional(),
});
export type ToolingTemplatesConfig = z.infer<typeof templatesConfigSchema>;

/** Vite+ configuration (manages `vite.config.ts` + the `vite:*` commands). */
export const viteConfigSchema = z.object({
    enabled: z
        .boolean()
        .describe('Master switch (enabled when the section is defined).')
        .optional(),
    config: z
        .boolean()
        .describe('Write the managed `vite.config.ts` (default true when the section is set).')
        .optional(),
    defaultTemplate: z
        .string()
        .describe('`create.defaultTemplate`, eg. `@acme` for `@acme/create`.')
        .optional(),
    testInclude: z
        .array(z.string())
        .describe('Extra Vitest include globs (default: tests under src + tests).')
        .optional(),
    lintIgnore: z.array(z.string()).describe('Glob patterns Oxlint should ignore.').optional(),
    overrides: z
        .record(z.string(), z.unknown())
        .describe('Deep-merged over the generated `vite.config.ts` object.')
        .optional(),
});
export type ToolingViteConfig = z.infer<typeof viteConfigSchema>;

/** A section: enabled/disabled with a boolean, or configured with an object. */
function section<T extends z.ZodTypeAny>(schema: T) {
    return z.union([z.boolean(), schema]);
}

/** The full `dbx.config` schema (minus the function-bearing `hooks`). */
export const toolingConfigSchema = z.object({
    project: projectConfigSchema.optional(),
    changelog: section(changelogConfigSchema).optional(),
    biome: section(biomeConfigSchema).optional(),
    tsconfig: section(tsconfigConfigSchema).optional(),
    templates: section(templatesConfigSchema).optional(),
    vite: section(viteConfigSchema).optional(),
    watch: section(watchConfigSchema).optional(),
});

/** The inferred config sections (the `hooks` key is added in `toolchain.ts`). */
export type ToolingConfigSections = z.infer<typeof toolingConfigSchema>;

/** The root `dbx.config` schema — the toolchain configuration lives under `toolchain`. */
export const dbxConfigSchema = z.object({
    toolchain: toolingConfigSchema.optional(),
});

/** The inferred `dbx.config` shape (the function-bearing `hooks` is added in `toolchain.ts`). */
export type DbxConfigSections = z.infer<typeof dbxConfigSchema>;

/** The section schemas keyed by config key, for the docs/JSON-Schema generator. */
export const CONFIG_SECTION_SCHEMAS = {
    project: projectConfigSchema,
    changelog: changelogConfigSchema,
    biome: biomeConfigSchema,
    tsconfig: tsconfigConfigSchema,
    templates: templatesConfigSchema,
    vite: viteConfigSchema,
    watch: watchConfigSchema,
} as const;

/** One-line descriptions for the generated docs index. */
export const CONFIG_SECTION_DESCRIPTIONS: Record<keyof typeof CONFIG_SECTION_SCHEMAS, string> = {
    project: 'Project metadata used as replacement tokens across every template.',
    changelog: 'Conventional-Commits CI, commitlint and the changelog pipeline.',
    biome: 'Biome config generation (for consumers that still want a `biome.json`).',
    tsconfig: 'Workspace tsconfig generation (path aliases + project references).',
    templates: 'Template sources / scaffolding.',
    vite: 'Vite+ configuration (manages `vite.config.ts` + the `vite:*` commands).',
    watch: 'Watch behaviour for `dbx watch`.',
};
