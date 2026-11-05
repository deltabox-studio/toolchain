import { z } from 'zod';

/**
 * A permissive object schema for a configuration shape owned by an external
 * tool.
 *
 * Validation is left to the tool itself (the toolchain only reads/merges the
 * options), while `tsType` makes the generated types and markdown reference the
 * tool's own exported TypeScript type instead of a generic record.
 */
export function externalConfigSchema<T>(description: string, tsType: string): z.ZodType<T> {
    return z.looseObject({}).describe(description).meta({ tsType }) as unknown as z.ZodType<T>;
}
