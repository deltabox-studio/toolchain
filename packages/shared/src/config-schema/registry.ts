import { z } from 'zod';

import { withEnabled } from './meta.js';

/** Allow/deny host and path globs for one registry kind. */
export const registryPolicySchema = z
    .object({
        allow: z
            .array(z.string())
            .describe(
                'Allowed host/path globs. When non-empty, only matching sources are used ' +
                    '(eg. `*.example.com`, `https://registry.example.com/**`).'
            )
            .optional(),
        deny: z
            .array(z.string())
            .describe('Denied host/path globs (checked before `allow`).')
            .optional(),
    })
    .describe('Registry source allow/deny globs.')
    .meta({ id: 'ToolchainRegistryPolicy' });

/** Registry source policies for templates and providers. */
export const registryConfigSchema = withEnabled(
    z.object({
        templates: registryPolicySchema
            .describe('Allow/deny globs for template sources and registries.')
            .optional(),
        providers: registryPolicySchema
            .describe('Allow/deny globs for provider sources and registries.')
            .optional(),
    })
)
    .describe('Registry source allow/deny policies (templates + providers).')
    .meta({ id: 'ToolchainRegistryConfig' });
