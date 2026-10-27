import { z } from 'zod';

import { withEnabled } from './meta.js';

/**
 * Package catalogs: a shared `package -> version range` map written to the
 * package manager's catalog file (`.yarnrc.yml` for Yarn, `pnpm-workspace.yaml`
 * for pnpm) so dependencies can be declared with `catalog:`.
 */
export const catalogsConfigSchema = withEnabled(
    z.object({
        packages: z
            .record(z.string(), z.string())
            .describe('The default catalog: package name -> version range.')
            .optional(),
        named: z
            .record(z.string(), z.record(z.string(), z.string()))
            .describe('Named catalogs (Yarn `catalogs:` / pnpm `catalogs:`): name -> packages.')
            .optional(),
    })
)
    .describe('Package catalogs written to the package manager catalog file (`catalog:`).')
    .meta({ id: 'ToolchainCatalogsConfig' });
