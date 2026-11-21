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
 * The `hooks` section is a Zod object of function schemas: JSON Schema cannot
 * express functions, so each callback carries a hand-written `tsType` signature
 * that the generated types and docs reuse.
 */

import { z } from 'zod';

import { biomeConfigSchema } from './biome.js';
import { catalogsConfigSchema } from './catalogs.js';
import { changelogConfigSchema } from './changelog.js';
import { ciConfigSchema } from './ci.js';
import { fmtConfigSchema, lintConfigSchema } from './format.js';
import { toolchainHooksSchema } from './hooks.js';
import { loaderConfigSchema } from './loader.js';
import { loggerConfigSchema } from './logger.js';
import { section } from './meta.js';
import { projectConfigSchema } from './project.js';
import { providersConfigSchema } from './providers.js';
import { registryConfigSchema } from './registry.js';
import { syncConfigSchema } from './sync.js';
import { templatesConfigSchema } from './templates.js';
import { tsconfigConfigSchema } from './tsconfig.js';
import { viteConfigSchema } from './vite.js';
import { watchConfigSchema } from './watch.js';

export * from './alias-rewrite.js';
export * from './biome.js';
export * from './catalogs.js';
export * from './changelog.js';
export * from './ci.js';
export * from './dependabot.js';
export * from './format.js';
export * from './hooks.js';
// Re-export only the public generated types: their internal helper types
// (`__schemaN`) collide across vendor schemas.
export type { AzurePipelines } from './generated/azure-pipelines.js';
export type { BiomeConfig } from './generated/biome-config.js';
export type { GitHubWorkflow } from './generated/github-workflow.js';
export type { GitLabCi } from './generated/gitlab-ci.js';
export type { OxfmtConfig } from './generated/oxfmt-config.js';
export type { OxlintConfig } from './generated/oxlint-config.js';
export * from './json.js';
export * from './loader.js';
export * from './logger.js';
export * from './meta.js';
export * from './project.js';
export * from './providers.js';
export * from './registry.js';
export * from './sync.js';
export * from './templates.js';
export * from './tsconfig.js';
export * from './vendor-types.js';
export * from './vite.js';
export * from './watch.js';
export * from './workflow.js';

/** A top-level enabled/disabled switch with an API-only global scope. */
const enabledConfigSchema = z
    .union([
        z.boolean(),
        z.object({
            disabled: z
                .boolean()
                .describe('Disable the toolchain for this scope.')
                .default(false)
                .optional(),
            scope: z
                .enum(['global', 'workspace'])
                .describe(
                    'The scope the value applies to. Config files and the Vite plugin may only ' +
                        'use `workspace`; `global` is reserved for the CLI/programmatic API and ' +
                        'the VS Code extension.'
                ),
        }),
    ])
    .describe(
        'Enable/disable the toolchain. The shorthand is workspace-scoped; the object form is ' +
            'reserved for APIs and the VS Code extension.'
    )
    .meta({ id: 'ToolchainEnabledConfig', cli: false });

/** The full `dbx.config` schema (minus the function-bearing `hooks`). */
export const toolchainConfigSchema = z
    .object({
        enabled: enabledConfigSchema.optional(),
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
        changelog: section(changelogConfigSchema)
            .describe(
                'Manual changelog pipeline options for `dbx changelog`, the VS Code ' +
                    'actions and the API. `ci.changelog` inherits these options.'
            )
            .optional(),
        fmt: section(fmtConfigSchema)
            .describe('Formatter configuration: Oxc/Biome options, editor defaults and tools.')
            .optional(),
        lint: section(lintConfigSchema)
            .describe('Linter configuration: Oxc/Biome/ESLint options and editor defaults.')
            .optional(),
        biome: section(biomeConfigSchema)
            .describe('Biome config generation (for consumers that still want a `biome.json`).')
            .optional(),
        tsconfig: section(tsconfigConfigSchema)
            .describe('Workspace tsconfig generation (path aliases + project references).')
            .optional(),
        loader: section(loaderConfigSchema)
            .describe('How `dbx.config.*` files are imported (tsconfig discovery).')
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
        sync: section(syncConfigSchema)
            .describe('`dbx sync` behaviour (formatting of the generated managed files).')
            .optional(),
        logger: section(loggerConfigSchema)
            .describe('Logging level, colours and prefix for toolchain output.')
            .optional(),
        providers: section(providersConfigSchema)
            .describe('Provider command behaviour (eg. colour for the passthrough commands).')
            .optional(),
        hooks: toolchainHooksSchema.optional(),
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

export const configSchema = {
    enabled: enabledConfigSchema,
    project: projectConfigSchema,
    ci: ciConfigSchema,
    changelog: changelogConfigSchema,
    fmt: fmtConfigSchema,
    lint: lintConfigSchema,
    biome: biomeConfigSchema,
    tsconfig: tsconfigConfigSchema,
    loader: loaderConfigSchema,
    templates: templatesConfigSchema,
    registry: registryConfigSchema,
    catalogs: catalogsConfigSchema,
    vite: viteConfigSchema,
    watch: watchConfigSchema,
    sync: syncConfigSchema,
    logger: loggerConfigSchema,
    providers: providersConfigSchema,
} as const;
