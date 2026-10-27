import { z } from 'zod';

import { withEnabled } from './meta.js';

/**
 * Vite+ configuration: the raw `vite.config.ts` object, held under
 * `toolchain.vite`, plus the single toolchain opt-out `config`.
 *
 * Every other key is passed through verbatim to the generated
 * `vite.config.ts` (see the `vite` sync task), so `dbx.config.*` is the only
 * hand-authored root config. `config: false` leaves a hand-written
 * `vite.config.ts` alone.
 */
export const viteConfigSchema = withEnabled(
    z.object({
        config: z
            .boolean()
            .describe('Write the managed `vite.config.ts` (default true).')
            .optional(),
    })
)
    .catchall(z.unknown())
    .describe('The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.')
    .meta({ id: 'ToolchainViteConfig' });
