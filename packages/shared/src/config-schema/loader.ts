import { z } from 'zod';

import { withEnabled } from './meta.js';

/**
 * How `dbx.config.*` files are imported. The loader runs the config through
 * `tsx`, which resolves TypeScript path aliases and rewrites `.js` specifiers
 * to their `.ts` source. By default it uses the nearest `tsconfig.json` (the
 * workspace's own), so a config can import its project's aliases.
 */
export const loaderConfigSchema = withEnabled(
    z.object({
        tsconfig: z
            .union([z.boolean(), z.string()])
            .describe(
                'The tsconfig the config loader uses (default true: the nearest `tsconfig.json`). ' +
                    'A string selects a different file (relative to the project root); false ' +
                    'disables tsconfig resolution.'
            )
            .optional(),
    })
)
    .describe('How `dbx.config.*` files are imported (tsconfig discovery).')
    .meta({ id: 'ToolchainLoaderConfig' });
