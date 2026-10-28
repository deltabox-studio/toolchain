import { z } from 'zod';

import { withEnabled } from './meta.js';

/** A formatter/linter tool's raw options (the tool's own config shape). */
const toolOptions = z.record(z.string(), z.unknown());

/**
 * Overrides/exclusions for the project-scoped VS Code settings added by
 * `fmt.vscode` / `lint.vscode`.
 */
export const vscodeSettingsSchema = z
    .object({
        overrides: z
            .record(z.string(), z.unknown())
            .describe('Settings deep-merged over the generated editor defaults.')
            .optional(),
        exclude: z
            .array(z.string())
            .describe('Exact setting keys (eg. `editor.defaultFormatter`) to omit.')
            .optional(),
    })
    .meta({ id: 'ToolchainVscodeSettings' });

/** `true`/`false` or an options object for the VS Code editor defaults. */
const vscodeSetting = z
    .union([z.boolean(), vscodeSettingsSchema])
    .describe(
        'Add project-scoped VS Code settings: `true`/`false` or `{ overrides, exclude }` ' +
            '(default false; existing keys are kept).'
    )
    .optional();

/**
 * Formatter selection + options. `vite.fmt` is the Oxc formatter and overrides
 * `fmt.oxc` when both are present; the other tools are selected by precedence
 * (oxc > biome > prettier > dprint) for editor defaults.
 */
export const fmtConfigSchema = withEnabled(
    z.object({
        vscode: vscodeSetting,
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
        vscode: vscodeSetting,
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
