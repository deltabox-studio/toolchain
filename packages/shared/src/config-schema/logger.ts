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
        suppress: z
            .union([z.string(), z.array(z.string())])
            .describe(
                'Warning/error id, message substring, or `/regex/` to silence (single value or array).'
            )
            .optional(),
        logger: z
            .unknown()
            .describe(
                'Custom `ToolchainLogger` implementation (TS/JS configs only; JSON cannot carry functions).'
            )
            .optional(),
    })
)
    .describe('Logging level, colours and prefix for toolchain output.')
    .meta({ id: 'ToolchainLoggerConfig' });
