import { z } from 'zod';

import { withEnabled } from './meta.js';

/** Watch behaviour for `dbx watch`. */
export const watchConfigSchema = withEnabled(
    z.object({
        debounce: z.number().describe('Debounce window in ms (default 150).').optional(),
        exclude: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Glob(s) excluded from watching. Defaults to the common ignored paths ' +
                    '(`node_modules`, `.dbx`, `dist`, `build`, ...).'
            )
            .optional(),
        gitignore: z
            .boolean()
            .describe(
                'Also respect `.gitignore` files (root + nested) when watching (default true).'
            )
            .optional(),
    })
)
    .describe('Watch behaviour for `dbx watch`.')
    .meta({ id: 'ToolchainWatchConfig' });
