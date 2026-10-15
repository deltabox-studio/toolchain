/**
 * Zod -> untyped bridge.
 *
 * Turns a Zod config schema (the single source of truth) into the "untyped"
 * JSON Schema model that untyped's `generateTypes` / `resolveSchema` consume.
 * The lowering uses Zod's public `toJSONSchema` as the intermediate: every leaf
 * carries its JSON Schema type info plus the env metadata echoed from
 * `.meta()` (`env`, `scope`, `secret`, `public`, `required`, `description`).
 */

import type { Schema } from 'untyped';
import { type ZodType, z } from 'zod';

import type { EnvVarMeta } from './types.js';

/** A JSON Schema node produced by `z.toJSONSchema`. */
interface JsonSchemaNode {
    type?: string | string[];
    properties?: Record<string, JsonSchemaNode>;
    required?: string[] | boolean;
    default?: unknown;
    defaultValue?: unknown;
    description?: string;
    enum?: string[];
    items?: JsonSchemaNode;
    additionalProperties?: JsonSchemaNode;
    propertyNames?: JsonSchemaNode;
    env?: string;
    scope?: string;
    secret?: boolean;
    public?: boolean;
}

const TS_TYPE_MAP: Record<string, string> = {
    string: 'string',
    number: 'number',
    integer: 'number',
    boolean: 'boolean',
    null: 'null',
};

/** Read the env metadata attached to a Zod leaf via `.meta()`. */
export function envMetaOf(schema: ZodType): EnvVarMeta | undefined {
    const meta = (schema as ZodType & { meta?: () => unknown }).meta?.();
    return meta && typeof meta === 'object' && 'env' in meta
        ? (meta as unknown as EnvVarMeta)
        : undefined;
}

function jsonType(node: JsonSchemaNode): string {
    if (node.enum) return 'string';
    if (Array.isArray(node.type)) return node.type.find(t => t !== 'null') ?? 'string';
    return node.type ?? 'string';
}

function itemTsType(node: JsonSchemaNode | undefined): string {
    const t = typeof node?.type === 'string' ? node.type : 'string';
    return TS_TYPE_MAP[t] ?? 'string';
}

function leafTsType(node: JsonSchemaNode): string {
    if (node.enum && Array.isArray(node.enum)) return `'${node.enum.join("' | '")}'`;
    const types = Array.isArray(node.type) ? node.type : [node.type ?? 'string'];
    if (types.includes('array')) return `Array<${itemTsType(node.items)}>`;
    if (types.includes('object')) return `Record<string, ${itemTsType(node.additionalProperties)}>`;
    return types.map(t => TS_TYPE_MAP[t] ?? t).join(' | ');
}

function jsonNodeToDefinition(node: JsonSchemaNode, fieldRequired = false): unknown {
    if (node.properties) {
        const out: Record<string, unknown> = fieldRequired
            ? { $schema: { tags: ['@required'] } }
            : {};
        for (const [key, child] of Object.entries(node.properties)) {
            out[key] = jsonNodeToDefinition(
                child,
                (node.required as string[] | undefined)?.includes(key) ?? false
            );
        }
        return out;
    }

    const out: Record<string, unknown> = {};
    if (node.defaultValue !== undefined) out.$default = node.defaultValue;
    else if (node.default !== undefined) out.$default = node.default;
    out.$schema = {
        type: jsonType(node),
        tsType: leafTsType(node),
        ...(jsonType(node) === 'array' ? { items: { type: itemTsType(node.items) } } : {}),
        ...(fieldRequired ? { tags: ['@required'] } : {}),
        ...(node.description ? { description: node.description } : {}),
        ...(node.env ? { env: node.env } : {}),
        ...(node.scope ? { scope: node.scope } : {}),
        ...(node.secret ? { secret: true } : {}),
        ...(node.public ? { public: true } : {}),
        ...(node.required === true ? { required: true } : {}),
        ...(node.defaultValue !== undefined && node.default !== undefined
            ? { envDefault: node.default }
            : {}),
    };
    return out;
}

/** Lower a Zod config schema into an untyped definition object. */
export function zodToUntypedDefinition(zodSchema: ZodType): Record<string, unknown> {
    const jsonSchema = (zodSchema as ZodType & { toJSONSchema: () => unknown }).toJSONSchema();
    return jsonNodeToDefinition(jsonSchema as JsonSchemaNode) as Record<string, unknown>;
}

/** Compile a Zod schema to a fast native parse function, falling back on error. */
export function compileZodSchema<T extends ZodType>(schema: T): T {
    try {
        return z.compile(schema) as unknown as T;
    } catch {
        return schema;
    }
}

function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && !Array.isArray(value) && typeof value === 'object';
}

function getType(value: unknown): string | undefined {
    const type = typeof value;
    if (type === 'undefined' || value === null) return undefined;
    if (Array.isArray(value)) return 'array';
    return type;
}

function joinPath(a: string, b: string, sep = '.'): string {
    return a ? `${a}${sep}${b}` : b;
}

function nonEmptyUnique(values: (string | undefined)[]): string[] {
    return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

function normalizeSchema(schema: Record<string, unknown>): void {
    if (schema.type === 'array' && !('items' in schema)) {
        const raw = (schema.default as unknown[] | undefined) ?? [];
        const types = nonEmptyUnique(raw.map(i => getType(i)));
        schema.items = { type: types.length === 0 ? 'any' : types.length === 1 ? types[0] : types };
    }
    if (
        schema.default === undefined &&
        ('properties' in schema || schema.type === 'object' || schema.type === 'any')
    ) {
        const props =
            (schema.properties as Record<string, { default?: unknown }> | undefined) ?? {};
        schema.default = Object.fromEntries(
            Object.entries(props)
                .filter(([, prop]) => 'default' in prop)
                .map(([key, value]) => [key, value.default])
        );
    }
}

interface ResolveContext {
    root: Record<string, unknown>;
    cache: Map<string, unknown>;
}

function resolveUntypedNode(
    node: unknown,
    id: string,
    ctx: ResolveContext
): Record<string, unknown> {
    if (ctx.cache.has(id)) return ctx.cache.get(id) as Record<string, unknown>;
    const schemaId = `#${id.replace(/\./g, '/')}`;

    if (!isObject(node)) {
        const safeInput = Array.isArray(node) ? [...node] : node;
        const schema: Record<string, unknown> = {
            type: getType(node),
            id: schemaId,
            default: safeInput,
        };
        normalizeSchema(schema);
        ctx.cache.set(id, schema);
        return schema;
    }

    const schema: Record<string, unknown> = {
        ...((node.$schema as object | undefined) ?? {}),
        id: schemaId,
    };
    ctx.cache.set(id, schema);
    const childKeys = Object.keys(node).filter(
        key => key !== '$resolve' && key !== '$schema' && key !== '$default'
    );
    if (childKeys.length > 0) {
        const properties: Record<string, unknown> = {};
        schema.properties = properties;
        for (const key of childKeys) {
            if (!properties[key]) {
                const child = (properties[key] = resolveUntypedNode(
                    node[key],
                    joinPath(id, key),
                    ctx
                ));
                if (Array.isArray(child.tags) && child.tags.includes('@required')) {
                    schema.required = schema.required || [];
                    if (!(schema.required as unknown[]).includes(key)) {
                        (schema.required as unknown[]).push(key);
                    }
                }
            }
        }
    }
    if (schema.default === undefined && '$default' in node) {
        schema.default = node.$default;
    }
    if (!schema.type) {
        schema.type = getType(schema.default) || (schema.properties ? 'object' : 'any');
    }
    normalizeSchema(schema);
    return schema;
}

/**
 * Resolve an untyped definition into a `Schema`, mirroring untyped's
 * `resolveSchema` synchronously.
 */
export function resolveUntypedSchema(input: Record<string, unknown>): Schema {
    const cache = new Map<string, unknown>();
    return resolveUntypedNode(input, '', { root: input, cache }) as Schema;
}

/** Build the resolved untyped JSON Schema directly from a Zod config schema. */
export function zodToJsonSchema(zodSchema: ZodType): Schema {
    return resolveUntypedSchema(zodToUntypedDefinition(zodSchema));
}

/** A resolved untyped schema split into its base group and the remaining groups. */
export interface SplitSchema {
    base: Schema;
    groups: Schema;
    hasBase: boolean;
}

/**
 * Split a resolved untyped schema into its base group (flat config fields) and
 * the remaining nested groups. Schemas without the base property treat the whole
 * schema as the base group.
 */
export function splitBaseSchema(schema: Schema, baseGroup = 'base'): SplitSchema {
    const props = (schema.properties ?? {}) as Record<string, Schema>;
    const baseProp = props[baseGroup];
    if (baseProp && baseProp.type === 'object' && baseProp.properties) {
        const { [baseGroup]: _base, ...restProps } = props;
        const restRequired = ((schema.required ?? []) as string[]).filter(k => k !== baseGroup);
        return {
            base: baseProp,
            groups: {
                ...schema,
                properties: restProps,
                ...(restRequired.length > 0 ? { required: restRequired } : {}),
            },
            hasBase: true,
        };
    }
    return { base: schema, groups: { ...schema, properties: {} }, hasBase: false };
}

/** Flatten the base group of a resolved schema into the top level. */
export function flattenBaseSchema(schema: Schema, baseGroup = 'base'): Schema {
    const props = (schema.properties ?? {}) as Record<string, Schema>;
    const baseProp = props[baseGroup];
    if (baseProp?.type !== 'object') return schema;
    const baseProps = baseProp.properties;
    if (!baseProps) return schema;
    const { [baseGroup]: _base, ...restProps } = props;
    return {
        ...schema,
        properties: { ...(baseProps as Record<string, Schema>), ...restProps },
        required: [
            ...((schema.required ?? []) as string[]).filter(k => k !== baseGroup),
            ...((baseProp.required ?? []) as string[]),
        ],
    };
}
