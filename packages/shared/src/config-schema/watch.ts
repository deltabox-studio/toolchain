import { z } from 'zod';

import { withEnabled } from './meta.js';

/** Watch behaviour for `dbx watch`. */
export const watchConfigSchema = withEnabled(
    z.object({
        debounce: z.number().describe('Debounce window in ms.').default(150).optional(),
        exclude: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Glob(s) excluded from watching. Defaults to the common ignored paths ' +
                    '(`node_modules`, `.dbx`, `dist`, `build`, ...).'
            )
            .meta({ cli: { type: 'array', multiple: true } })
            .optional(),
        gitignore: z
            .boolean()
            .describe('Also respect `.gitignore` files (root + nested) when watching.')
            .default(true)
            .optional()
            .meta({
                cli: {
                    flag: '--no-gitignore',
                    type: 'boolean',
                    description: 'Do not respect .gitignore files.',
                },
            }),
    })
)
    .describe('Watch behaviour for `dbx watch`.')
    .meta({ id: 'ToolchainWatchConfig' });
