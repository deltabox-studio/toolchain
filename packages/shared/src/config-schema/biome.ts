import { z } from 'zod';

import { withEnabled } from './meta.js';

/** Biome config generation (for consumers that still want a `biome.json`). */
export const biomeConfigSchema = withEnabled(
    z.object({
        vscode: z.boolean().describe('Write the Biome VS Code settings (default true).').optional(),
        overrides: z
            .record(z.string(), z.unknown())
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
