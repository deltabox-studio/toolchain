import type { ConfigMeta } from './meta.js';

/** The value type a config value resolves to. */
export type ConfigValueType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/** Every value kind config validation can address. */
export type ConfigValueKind =
    | 'boolean'
    | 'number'
    | 'string'
    | 'array'
    | 'object'
    | 'enum'
    | 'union'
    | 'tuple'
    | 'record'
    | 'map'
    | 'set'
    | 'date'
    | 'bigint'
    | 'symbol'
    | 'null'
    | 'undefined'
    | 'void'
    | 'never'
    | 'any'
    | 'unknown'
    | 'literal'
    | 'promise'
    | 'function'
    | 'file'
    | 'custom';

/** A collected config definition (env/cli metadata is optional). */
export interface ConfigDef {
    /** The env var name, when the value is env-backed. */
    name?: string;
    /** The dotted config path. */
    path: string;
    /** The CLI flag, when the value is CLI-backed or derives from an env var. */
    cliFlag?: string;
    description?: string;
    default?: unknown;
    required?: boolean;
    secret?: boolean;
    public?: boolean;
    scope: string;
    type?: ConfigValueType;
    /** The schema value kind (used by the error filters). */
    kind?: ConfigValueKind;
    /** The raw config metadata attached to the schema leaf. */
    meta?: ConfigMeta;
}

/**
 * The schema's object key that holds the config fields.
 */
export type ConfigGroup = 'base' | (string & {}) | ConfigGroup[];

/** A config scope. */
export type ConfigScope = string;
