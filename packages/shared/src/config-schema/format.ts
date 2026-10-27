import { z } from 'zod';

import { withEnabled } from './meta.js';

/** A formatter/linter tool's raw options (the tool's own config shape). */
const toolOptions = z.record(z.string(), z.unknown());

/**
 * Formatter selection + options. `vite.fmt` is the Oxc formatter and overrides
 * `fmt.oxc` when both are present; the other tools are selected by precedence
 * (oxc > biome > prettier > dprint) for editor defaults.
 */
export const fmtConfigSchema = withEnabled(
    z.object({
        vscode: z
            .boolean()
            .describe(
                'Add project-scoped VS Code formatter settings (default false; existing keys are kept).'
            )
            .optional(),
        oxc: toolOptions
            .describe('Oxfmt options. `toolchain.vite.fmt` overrides these (deep merge).')
            .optional(),
        biome: toolOptions
            .describe('Biome formatter options (merged into the generated `biome.json`).')
            .optional(),
        prettier: toolOptions.describe('Prettier options (editor defaults/migrations).').optional(),
        dprint: toolOptions.describe('Dprint options (editor defaults/migrations).').optional(),
    })
)
    .describe(
        'Formatter configuration: Oxc/Biome configs, editor defaults and source-tool options.'
    )
    .meta({ id: 'ToolchainFmtConfig' });

/** Linter selection + options (same shared shape as `fmt`, plus ESLint). */
export const lintConfigSchema = withEnabled(
    z.object({
        vscode: z
            .boolean()
            .describe(
                'Add project-scoped VS Code linter settings (default false; existing keys are kept).'
            )
            .optional(),
        oxc: toolOptions
            .describe('Oxlint options. `toolchain.vite.lint` overrides these (deep merge).')
            .optional(),
        biome: toolOptions
            .describe('Biome linter options (merged into the generated `biome.json`).')
            .optional(),
        eslint: toolOptions.describe('ESLint options (editor defaults/migrations).').optional(),
    })
)
    .describe('Linter configuration: Oxc/Biome configs, editor defaults and ESLint options.')
    .meta({ id: 'ToolchainLintConfig' });
