import { z } from 'zod';

import { withEnabled } from './meta.js';

const optionalMessage = z.string().describe('The message to print.').optional();

const loggerCallback = (input: [z.ZodType, ...z.ZodType[]], tsType: string, description: string) =>
    z.function({ input, output: z.void() }).describe(description).meta({ tsType });

/** A custom `ToolchainLogger` implementation (TS/JS configs only). */
const toolchainLoggerSchema = z.object({
    raw: loggerCallback([optionalMessage], '(message?: string) => void', 'Write raw stdout.'),
    rawError: loggerCallback([optionalMessage], '(message?: string) => void', 'Write raw stderr.'),
    write: loggerCallback(
        [
            z.enum(['out', 'err']).describe('The output channel.'),
            z.string().describe('The text to write.'),
        ],
        "(channel: 'out' | 'err', text: string) => void",
        'Write to a specific output channel.'
    ),
    debug: loggerCallback(
        [optionalMessage],
        '(message?: string) => void',
        'Print a debug message.'
    ),
    info: loggerCallback([optionalMessage], '(message?: string) => void', 'Print an info message.'),
    success: loggerCallback(
        [optionalMessage],
        '(message?: string) => void',
        'Print a success message.'
    ),
    warn: loggerCallback(
        [optionalMessage, z.string().describe('A stable message id.').optional()],
        '(message?: string, id?: string) => void',
        'Print a warning.'
    ),
    error: loggerCallback(
        [optionalMessage, z.string().describe('A stable message id.').optional()],
        '(message?: string, id?: string) => void',
        'Print an error.'
    ),
});

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
        logger: toolchainLoggerSchema
            .describe(
                'Custom `ToolchainLogger` implementation (TS/JS configs only; JSON cannot carry functions).'
            )
            .optional(),
    })
)
    .describe('Logging level, colours and prefix for toolchain output.')
    .meta({ id: 'ToolchainLoggerConfig' });
