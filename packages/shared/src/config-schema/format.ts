import { z } from 'zod';

import { withEnabled } from './meta.js';

/**
 * A formatter/linter tool's raw options (the tool's own config shape), or
 * `true` for the defaults / `false` to disable the tool.
 */
const toolOptions = z.union([z.boolean(), z.record(z.string(), z.unknown())]);

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
            .describe(
                'Oxfmt options (`true` = defaults, `false` = disabled). ' +
                    '`toolchain.vite.fmt` overrides these (deep merge).'
            )
            .optional(),
        biome: toolOptions
            .describe(
                'Biome formatter options (`true` = defaults, `false` = disabled); ' +
                    'merged into the generated `biome.json`.'
            )
            .optional(),
        prettier: toolOptions
            .describe('Prettier options (`true` = defaults, `false` = disabled).')
            .optional(),
        dprint: toolOptions
            .describe('Dprint options (`true` = defaults, `false` = disabled).')
            .optional(),
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
            .describe(
                'Oxlint options (`true` = defaults, `false` = disabled). ' +
                    '`toolchain.vite.lint` overrides these (deep merge).'
            )
            .optional(),
        biome: toolOptions
            .describe(
                'Biome linter options (`true` = defaults, `false` = disabled); ' +
                    'merged into the generated `biome.json`.'
            )
            .optional(),
        eslint: toolOptions
            .describe('ESLint options (`true` = defaults, `false` = disabled).')
            .optional(),
    })
)
    .describe('Linter configuration: Oxc/Biome configs, editor defaults and ESLint options.')
    .meta({ id: 'ToolchainLintConfig' });
