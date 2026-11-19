import type { ZodType } from 'zod';

import type { ConfigGroup } from './definition.js';
import type { ConfigSchema } from './schema.js';

/**
 * The scope names a schema exposes as statically known keys.
 *
 * A scope map (`{ server, cli }`) yields its own keys; a single Zod schema, an
 * array of schemas or an untyped schema yields `string` because its scopes are
 * resolved at runtime.
 */
export type ConfigScopeKeys<TSchema> = TSchema extends ZodType
    ? string
    : TSchema extends readonly unknown[]
      ? string
      : TSchema extends Record<string, unknown>
        ? 'type' extends keyof TSchema
            ? string
            : 'properties' extends keyof TSchema
              ? string
              : Extract<keyof TSchema, string>
        : string;

/**
 * Flatten the schema by `n` levels.
 *
 * - When `true` the `baseGroup` will be ignored
 * and the schema will flatten all top-level keys (for objects).
 *
 *  - When defined as `{ level: <number> }` the `baseGroup` will be ignored
 * and the schema will flatten keys `n` levels deep (for objects).
 *
 *  - When defined as `{ maxDepth: <number> }` the `baseGroup` will be ignored
 * and the schema will flatten keys `n` levels deep and stops at `maxDepth` (for objects).
 */
export type ConfigEngineFlatten =
    | boolean
    | { level: number; maxDepth?: never }
    | { maxDepth: number; level?: never };

/** Options shared by every generator. */
export interface ConfigEngineOptions<TSchema extends ConfigSchema = ConfigSchema> {
    /** The scopes to walk, keyed by scope name (eg. `{ server, frontend, cli }`). */
    schema: TSchema;
    /** The env-var prefix (eg. `MYAPP_`). Kept as a replacement token in code. */
    envPrefix?: string;
    /**
     * The schema's object key that holds the "flat" base config fields, hoisted out of
     * the nested groups in the generated types/docs (default `base`).
     */
    baseGroup?: ConfigGroup;
    /**
     * Flattens the schema by `n` levels.
     *
     * - When `true` the `baseGroup` will be ignored
     * and the schema will flatten all top-level keys (for objects).
     *
     *  - When defined as `{ level: <number> }` the `baseGroup` will be ignored
     * and the schema will flatten keys `n` levels deep (for objects).
     */
    flatten?: boolean | { level: number; maxLevel?: never } | { maxLevel: number; level?: never };
    /** The monorepo/project root used for default output paths. */
    root?: string;
    /**
     * Custom env-name -> dotted-path derivation for leaves without an explicit
     * `path` (eg. to handle dual `PREFIX_`/`VITE_` prefixes).
     */
    envPathOf?: (env: string) => string;
}
