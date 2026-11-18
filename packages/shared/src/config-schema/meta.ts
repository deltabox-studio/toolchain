import { type ZodObject, type ZodRawShape, type ZodType, z } from 'zod';

/** The default description for the shared `enabled` flag. */
export const ENABLED_DESCRIPTION = 'Enable/disable this section (default: enabled when defined).';

/** The default description for the shared `regenerate` flag. */
export const REGENERATE_DESCRIPTION =
    "Regenerate this section's managed files during `dbx sync` (default true). " +
    'When false, existing files are left untouched and are neither written nor drift-checked.';

/** A section: enabled/disabled with a boolean, or configured with an object. */
export function section<T extends ZodType>(schema: T) {
    return z.union([z.boolean(), schema]);
}

/**
 * Add the shared `enabled?: boolean` + `regenerate?: boolean` flags to a Zod
 * object schema.
 *
 * Every config section and nested toggle carries the same flags, so define them
 * once here instead of repeating the fields (and their descriptions) in each
 * schema. `regenerate` only affects sections that manage files; other sections
 * simply ignore it.
 */
export function withEnabled<T extends ZodObject<ZodRawShape>>(
    schema: T,
    description = ENABLED_DESCRIPTION
): T {
    return schema.extend({
        enabled: z.boolean().optional().describe(description),
        regenerate: z.boolean().default(true).optional().describe(REGENERATE_DESCRIPTION),
    }) as unknown as T;
}
