import type { Schema as SchemaType } from 'untyped';
import type { ZodType } from 'zod';

import type { ConfigScope } from './definition.js';
import type { ConfigMeta } from './meta.js';

/** A resolved untyped schema carrying the toolchain's config metadata. */
export type ConfigSchemaType = SchemaType & ConfigMeta;

/** A Zod schema or a resolved untyped schema. */
export type ConfigSchemaInput = ZodType | ConfigSchemaType;

/** A single schema, a list of schemas, or scoped schemas keyed by scope name. */
export type ConfigSchema<Scope extends ConfigScope = ConfigScope> =
    | ConfigSchemaInput
    | ConfigSchemaInput[]
    | Record<Scope, ConfigSchemaInput | ConfigSchemaInput[]>;

/** Normalized schemas, keyed by scope name. */
export type ConfigSchemaMap = Record<string, ConfigSchemaType>;

/** The scopes registered with an engine, keyed by scope name. */
export type ConfigScopes = Record<string, ConfigSchema | ConfigSchema[]>;
