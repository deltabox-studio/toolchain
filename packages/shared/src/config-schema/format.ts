import type { Configuration as DprintConfig } from '@dprint/types';
import type { Linter } from 'eslint';
import type { Options as PrettierConfig } from 'prettier';
import type { JsonObject } from 'type-fest';
import { z } from 'zod';

import { biomeConfigOptionsSchema } from './biome.js';
import { externalConfigSchema } from './external.js';
import type { OxfmtConfig } from './generated/oxfmt-config.js';
import type { OxlintConfig } from './generated/oxlint-config.js';
import { withEnabled } from './meta.js';

/** A tool config: `true` for the defaults, `false` to disable, or its options. */
const toolOptions = <T>(schema: z.ZodType<T>) => z.union([z.boolean(), schema]);

const oxfmtOptions = externalConfigSchema<OxfmtConfig>(
    'Oxfmt configuration options.',
    'OxfmtConfig'
);

const oxlintOptions = externalConfigSchema<OxlintConfig>(
    'Oxlint configuration options.',
    'OxlintConfig'
);

const prettierOptions = externalConfigSchema<PrettierConfig>(
    'Prettier configuration options.',
    'PrettierConfig'
);

const dprintOptions = externalConfigSchema<DprintConfig>(
    'Dprint configuration options.',
    'DprintConfig'
);

const eslintOptions = externalConfigSchema<Linter.Config>(
    'ESLint configuration options.',
    'Linter.Config'
);

const jsonObjectOptions = externalConfigSchema<JsonObject>(
    'Settings deep-merged over the generated editor defaults.',
    'JsonObject'
);

/**
 * Overrides/exclusions for the project-scoped VS Code settings added by
 * `fmt.vscode` / `lint.vscode`.
 */
export const vscodeSettingsSchema = z
    .object({
        overrides: jsonObjectOptions
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
        oxc: toolOptions(oxfmtOptions)
            .describe(
                'Oxfmt options (`true` = defaults, `false` = disabled). ' +
                    '`toolchain.vite.fmt` overrides these (deep merge).'
            )
            .optional(),
        biome: toolOptions(biomeConfigOptionsSchema)
            .describe(
                'Biome formatter options (`true` = defaults, `false` = disabled); ' +
                    'merged into the generated `biome.json`.'
            )
            .optional(),
        prettier: toolOptions(prettierOptions)
            .describe('Prettier options (`true` = defaults, `false` = disabled).')
            .optional(),
        dprint: toolOptions(dprintOptions)
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
        oxc: toolOptions(oxlintOptions)
            .describe(
                'Oxlint options (`true` = defaults, `false` = disabled). ' +
                    '`toolchain.vite.lint` overrides these (deep merge).'
            )
            .optional(),
        biome: toolOptions(biomeConfigOptionsSchema)
            .describe(
                'Biome linter options (`true` = defaults, `false` = disabled); ' +
                    'merged into the generated `biome.json`.'
            )
            .optional(),
        eslint: toolOptions(eslintOptions)
            .describe('ESLint options (`true` = defaults, `false` = disabled).')
            .optional(),
    })
)
    .describe('Linter configuration: Oxc/Biome configs, editor defaults and ESLint options.')
    .meta({ id: 'ToolchainLintConfig' });
