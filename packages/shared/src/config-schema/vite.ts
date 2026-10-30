import { z } from 'zod';

import { withEnabled } from './meta.js';

/**
 * Vite+ configuration: the raw `vite.config.ts` object, held under
 * `toolchain.vite`, plus the toolchain-only `config` (managed shim opt-out),
 * `shim` (runtime/static render mode) and `shimImport` (runtime import
 * specifier) keys.
 *
 * Every other key is passed through verbatim to the generated
 * `vite.config.ts` (see the `vite` sync task), so `dbx.config.*` is the only
 * hand-authored root config. `config: false` leaves a hand-written
 * `vite.config.ts` alone.
 */
export const viteConfigSchema = withEnabled(
    z.object({
        config: z
            .union([z.boolean(), z.string()])
            .describe(
                'Write the managed Vite config (default true). A string sets its file name/path ' +
                    '(relative to the project, or absolute).'
            )
            .optional(),
        shim: z
            .enum(['runtime', 'static'])
            .describe(
                'How the generated `vite.config.ts` is rendered. `runtime` (default) loads the ' +
                    'config from `dbx.config.*`; `static` serializes it into the file so the shim ' +
                    'does not import `@deltabox/toolchain` (it then needs no built `dist`).'
            )
            .optional(),
        shimImport: z
            .string()
            .describe(
                'Module specifier used to import `resolveVite` in runtime shims (default ' +
                    '`@deltabox/toolchain/vite`). A relative path is resolved from the repo root ' +
                    'and rewritten relative to each generated config - useful for dogfooding a ' +
                    'source checkout without a built `dist`.'
            )
            .optional(),
        fmt: z
            .union([z.boolean(), z.record(z.string(), z.unknown())])
            .describe('Oxfmt options; `true` uses the toolchain defaults.')
            .optional(),
        lint: z
            .union([z.boolean(), z.record(z.string(), z.unknown())])
            .describe('Oxlint options; `true` uses the toolchain defaults.')
            .optional(),
    })
)
    .catchall(z.unknown())
    .describe('The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.')
    .meta({ id: 'ToolchainViteConfig' });
