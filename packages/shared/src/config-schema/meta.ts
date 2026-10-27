import { type ZodObject, type ZodRawShape, type ZodType, z } from 'zod';

/** The default description for the shared `enabled` flag. */
export const ENABLED_DESCRIPTION = 'Enable/disable this section (default: enabled when defined).';

/** A section: enabled/disabled with a boolean, or configured with an object. */
export function section<T extends ZodType>(schema: T) {
    return z.union([z.boolean(), schema]);
}

/**
 * Add the shared `enabled?: boolean` opt-out to a Zod object schema.
 *
 * Every config section and nested toggle carries the same flag, so define it
 * once here instead of repeating the field (and its description) in each schema.
 */
export function withEnabled<T extends ZodObject<ZodRawShape>>(
    schema: T,
    description = ENABLED_DESCRIPTION
): T {
    return schema.extend({
        enabled: z.boolean().optional().describe(description),
    }) as unknown as T;
}
