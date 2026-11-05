import { z } from 'zod';

/** A JSON value, recursively. */
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string & {}]: JsonValue };

/**
 * Any JSON value (string, number, boolean, null, array or object), recursively.
 *
 * Used by pass-through config options (tool options, tsconfig overrides, extra
 * workflow keys, ...) so JSON configs stay valid while the generated types show
 * a named `ConfigJsonValue` instead of `unknown`.
 */
export const configJsonValueSchema: z.ZodType<JsonValue> = z
    .lazy(() =>
        z.union([
            z.string(),
            z.number(),
            z.boolean(),
            z.null(),
            z.array(configJsonValueSchema),
            z.record(z.string(), configJsonValueSchema),
        ])
    )
    .describe('Any JSON value.')
    .meta({ id: 'ConfigJsonValue' });
