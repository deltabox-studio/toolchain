import { z } from 'zod';

import { externalConfigSchema } from './external.js';
import { withEnabled } from './meta.js';

/**
 * Biome's configuration options. The concrete type lives in the generated
 * `biome-config.ts`, produced from Biome's official JSON schema
 * (`schemas/biome.json`, vendored from
 * `https://biomejs.dev/schemas/2.5.13/schema.json`).
 */
export const biomeConfigOptionsSchema = externalConfigSchema<Record<string, unknown>>(
    'Biome configuration options.',
    'BiomeConfig'
);

/** Biome config generation (for consumers that still want a `biome.json`). */
export const biomeConfigSchema = withEnabled(
    z.object({
        vscode: z.boolean().describe('Write the Biome VS Code settings (default true).').optional(),
        overrides: biomeConfigOptionsSchema
            .describe('Deep-merged over the generated `biome.json` (arrays union).')
            .optional(),
    })
)
    .describe('Biome config generation (for consumers that still want a `biome.json`).')
    .meta({
        id: 'ToolchainBiomeConfig',
        deprecated: true,
        deprecationMessage:
            'use `toolchain.fmt.biome` / `toolchain.lint.biome`. Still writes `biome.json`.',
    });
