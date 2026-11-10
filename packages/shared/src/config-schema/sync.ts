import { z } from 'zod';

import { withEnabled } from './meta.js';

/** Formatting applied to the files `dbx sync` manages. */
const syncFormatSchema = z
    .union([
        z.boolean(),
        z.object({
            enabled: z
                .boolean()
                .describe(
                    'Format the managed files after writing them (default true once enabled).'
                )
                .optional(),
            fix: z
                .boolean()
                .describe(
                    'Rewrite the managed files with the formatter (default true). Set false to ' +
                        'run the formatter in check mode instead.'
                )
                .optional(),
            command: z
                .string()
                .describe(
                    'Override the formatter command. `{files}` expands to the managed files ' +
                        '(space-separated); when it is absent the files are appended.'
                )
                .optional(),
            exclude: z
                .array(z.string())
                .describe('Globs of managed files to leave unformatted (per-file opt-out).')
                .optional(),
        }),
    ])
    .describe(
        'Opt-in formatting of the managed files after generation (default off). `true` uses ' +
            'the defaults, `false` disables it, and an object tunes `enabled`/`fix`/`command`/`exclude`.'
    );

/** `dbx sync` behaviour. */
export const syncConfigSchema = withEnabled(
    z.object({
        format: syncFormatSchema.optional(),
    })
)
    .describe('`dbx sync` behaviour (formatting of the managed files).')
    .meta({ id: 'ToolchainSyncConfig' });
