import { z } from 'zod';

import { withEnabled } from './meta.js';

/** Logging (level, colour, prefix) for every toolchain message. */
export const loggerConfigSchema = withEnabled(
    z.object({
        level: z
            .enum(['debug', 'info', 'warn', 'error', 'silent'])
            .describe('Minimum level to print (default `info`).')
            .optional(),
        color: z
            .boolean()
            .describe('Force colours on/off (default: on; `--no-color` disables).')
            .optional(),
        name: z
            .string()
            .describe('Prefix non-indented lines with `<name>:` (default `dbx`).')
            .optional(),
    })
)
    .describe('Logging level, colours and prefix for toolchain output.')
    .meta({ id: 'ToolchainLoggerConfig' });
