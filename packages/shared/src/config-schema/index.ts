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

import { biomeConfigSchema } from './biome.js';
import { catalogsConfigSchema } from './catalogs.js';
import {
    changelogBranchesConfigSchema,
    changelogCommitlintConfigSchema,
    changelogConfigSchema,
    changelogVersioningConfigSchema,
    changelogVersioningSchema,
    changelogVersioningTargetSchema,
    changelogWorkflowSettingSchema,
    legacyChangelogConfigSchema,
} from './changelog.js';
import { ciConfigSchema } from './ci.js';
import { loggerConfigSchema } from './logger.js';
import { section } from './meta.js';
import { projectConfigSchema, projectTypeSchema } from './project.js';
import { providersConfigSchema } from './providers.js';
import { registryConfigSchema, registryPolicySchema } from './registry.js';
import {
    templateKindSchema,
    templateSourceSchema,
    templateSourceTypeSchema,
    templatesConfigSchema,
} from './templates.js';
import { tsconfigConfigSchema } from './tsconfig.js';
import { viteConfigSchema } from './vite.js';
import { watchConfigSchema } from './watch.js';
import {
    workflowConfigSchema,
    workflowOptionsSchema,
    workflowSettingSchema,
    workflowStepSchema,
    workflowStepsConfigSchema,
} from './workflow.js';

export * from './biome.js';
export * from './catalogs.js';
export * from './changelog.js';
export * from './ci.js';
export * from './logger.js';
export * from './meta.js';
export * from './project.js';
export * from './providers.js';
export * from './registry.js';
export * from './templates.js';
export * from './tsconfig.js';
export * from './vite.js';
export * from './watch.js';
export * from './workflow.js';

/** The full `dbx.config` schema (minus the function-bearing `hooks`). */
export const toolchainConfigSchema = z
    .object({
        project: projectConfigSchema
            .describe(
                'Project metadata: canonical `package.json` fields and template tokens ' +
                    '(inherited by workspaces).'
            )
            .optional(),
        ci: section(ciConfigSchema)
            .describe(
                'GitHub Actions workflows to generate (CI, release, issues, changelog, sync).'
            )
            .optional(),
        changelog: section(legacyChangelogConfigSchema)
            .describe(
                'Deprecated: the old changelog section. Move it to `ci.changelog` (and its ' +
                    'workflows to the top-level `ci`).'
            )
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
        registry: section(registryConfigSchema)
            .describe('Allow/deny host and path globs for template/provider registries.')
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
    WorkflowOptions: workflowOptionsSchema,
    WorkflowSetting: workflowSettingSchema,
    WorkflowConfig: workflowConfigSchema,
    ChangelogBranchesConfig: changelogBranchesConfigSchema,
    ChangelogCommitlintConfig: changelogCommitlintConfigSchema,
    ChangelogVersioningTarget: changelogVersioningTargetSchema,
    ChangelogVersioningConfig: changelogVersioningConfigSchema,
    ChangelogVersioning: changelogVersioningSchema,
    ChangelogConfig: changelogConfigSchema,
    ChangelogWorkflowSetting: changelogWorkflowSettingSchema,
    ToolchainCiConfig: ciConfigSchema,
    ToolchainChangelogConfig: legacyChangelogConfigSchema,
    ToolchainBiomeConfig: biomeConfigSchema,
    ToolchainTsconfigConfig: tsconfigConfigSchema,
    ToolchainWatchConfig: watchConfigSchema,
    ToolchainTemplateSourceType: templateSourceTypeSchema,
    ToolchainTemplateKind: templateKindSchema,
    ToolchainTemplateSource: templateSourceSchema,
    ToolchainTemplatesConfig: templatesConfigSchema,
    ToolchainRegistryPolicy: registryPolicySchema,
    ToolchainRegistryConfig: registryConfigSchema,
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
    ci: ciConfigSchema,
    biome: biomeConfigSchema,
    tsconfig: tsconfigConfigSchema,
    templates: templatesConfigSchema,
    registry: registryConfigSchema,
    catalogs: catalogsConfigSchema,
    vite: viteConfigSchema,
    watch: watchConfigSchema,
    logger: loggerConfigSchema,
    providers: providersConfigSchema,
} as const;

/** Alias used by consumers that prefer the singular name. */
export const configSchema = CONFIG_SECTION_SCHEMAS;

/** Alias kept for discoverability. */
export const configSchemas = CONFIG_SECTION_SCHEMAS;

/** One-line descriptions for the generated docs index. */
export const CONFIG_SECTION_DESCRIPTIONS: Record<keyof typeof CONFIG_SECTION_SCHEMAS, string> = {
    project:
        'Project metadata: canonical `package.json` fields (applied on sync, inherited by ' +
        'workspaces) plus the replacement tokens every template understands.',
    ci: 'GitHub Actions workflows: CI checks, release, issues, changelog and sync (all opt-in).',
    biome: 'Biome config generation (for consumers that still want a `biome.json`).',
    tsconfig: 'Workspace tsconfig generation (path aliases + project references).',
    templates: 'Template sources / scaffolding.',
    registry: 'Allow/deny host and path globs for template/provider registries.',
    catalogs: 'Package catalogs written to the package manager catalog file (`catalog:`).',
    vite: 'The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.',
    watch: 'Watch behaviour for `dbx watch`.',
    logger: 'Logging level, colours and prefix for toolchain output.',
    providers: 'Provider command behaviour (eg. colour for the passthrough commands).',
};
