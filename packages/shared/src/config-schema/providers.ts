import { z } from 'zod';

import { withEnabled } from './meta.js';

/** Provider command behaviour (colour of the provider passthrough commands). */
export const providersConfigSchema = withEnabled(
    z.object({
        color: z
            .boolean()
            .describe('Force provider command colours on/off (default: inherit the logger).')
            .optional(),
    })
)
    .describe('Provider command behaviour (eg. colour for the passthrough commands).')
    .meta({ id: 'ToolchainProvidersConfig' });
