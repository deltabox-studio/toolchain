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

import type { ConfigMeta } from './types.js';

/** A JSON Schema node produced by `z.toJSONSchema`. */
interface JsonSchemaNode {
    type?: string | string[];
    properties?: Record<string, JsonSchemaNode>;
    required?: string[] | boolean;
    default?: unknown;
    defaultValue?: unknown;
    description?: string;
    enum?: string[];
    const?: unknown;
    anyOf?: JsonSchemaNode[];
    oneOf?: JsonSchemaNode[];
    $ref?: string;
    $defs?: Record<string, JsonSchemaNode>;
    items?: JsonSchemaNode;
    additionalProperties?: JsonSchemaNode | boolean;
    propertyNames?: JsonSchemaNode;
    env?: string;
    scope?: string;
    secret?: boolean;
    public?: boolean;
    deprecated?: boolean;
    deprecationMessage?: string;
    example?: string | string[];
    since?: string;
    see?: string | string[];
    remarks?: string;
    experimental?: boolean;
    alpha?: boolean;
    beta?: boolean;
}

const TS_TYPE_MAP: Record<string, string> = {
    string: 'string',
    number: 'number',
    integer: 'number',
    boolean: 'boolean',
    null: 'null',
};

/** Read the config metadata attached to a Zod leaf via `.meta()`. */
export function envMetaOf(schema: ZodType): ConfigMeta | undefined {
    const meta = (schema as ZodType & { meta?: () => unknown }).meta?.();
    return meta && typeof meta === 'object' ? (meta as unknown as ConfigMeta) : undefined;
}

/** A JSON Schema node with no keys describes "anything" (`unknown`). */
function isEmptySchema(node: JsonSchemaNode | undefined): boolean {
    return !node || Object.keys(node).length === 0;
}

function quoteString(value: unknown): string {
    return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * Render a JSON Schema node as a TypeScript type string. Nested `$defs` are
 * referenced by name, unions become `A | B`, records become `Record<...>` and
 * object nodes without properties are inlined. Never throws.
 */
export function renderTsType(
    node: JsonSchemaNode | undefined,
    defs: Record<string, JsonSchemaNode> = {}
): string {
    if (!node || isEmptySchema(node)) return 'unknown';
    if (node.$ref) {
        const name = node.$ref.split('/').pop() ?? 'unknown';
        return defs[name] ? name : 'unknown';
    }
    if (node.const !== undefined) {
        return typeof node.const === 'string' ? quoteString(node.const) : String(node.const);
    }
    if (Array.isArray(node.enum) && node.enum.length > 0) {
        return node.enum.map(quoteString).join(' | ');
    }
    const variants = node.anyOf ?? node.oneOf;
    if (Array.isArray(variants) && variants.length > 0) {
        return variants.map(variant => renderTsType(variant, defs)).join(' | ');
    }
    if (node.properties) {
        const required = Array.isArray(node.required) ? node.required : [];
        const members = Object.entries(node.properties).map(
            ([key, child]) =>
                `${key}${required.includes(key) ? '' : '?'}: ${renderTsType(child, defs)}`
        );
        return `{ ${members.join('; ')} }`;
    }
    const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
    if (types.includes('array')) {
        return `Array<${renderTsType(node.items, defs)}>`;
    }
    if (types.includes('object')) {
        const additional = node.additionalProperties;
        if (additional === undefined || additional === false) return 'Record<string, unknown>';
        const value =
            additional === true || isEmptySchema(additional)
                ? 'unknown'
                : renderTsType(additional, defs);
        return `Record<string, ${value}>`;
    }
    if (types.length === 0) return 'unknown';
    return types.map(type => TS_TYPE_MAP[type] ?? 'unknown').join(' | ');
}

function jsonType(node: JsonSchemaNode): string {
    if (node.$ref) return 'any';
    if (node.const !== undefined) {
        return typeof node.const === 'string' ? 'string' : typeof node.const;
    }
    if (node.anyOf || node.oneOf) return 'any';
    if (node.enum) return 'string';
    if (Array.isArray(node.type)) return node.type.find(t => t !== 'null') ?? 'string';
    return node.type ?? 'string';
}

/** Metadata that can be attached to a node or to the `$ref`/union it points at. */
interface NodeMeta {
    required?: boolean;
    deprecated?: boolean;
    deprecationMessage?: string;
    example?: string | string[];
    since?: string;
    see?: string | string[];
    remarks?: string;
    experimental?: boolean;
    alpha?: boolean;
    beta?: boolean;
}

/** Resolve metadata from a node, its `$ref`, or its union members. */
function nodeMeta(
    node: JsonSchemaNode | undefined,
    defs: Record<string, JsonSchemaNode> = {}
): NodeMeta {
    if (!node) return {};
    const refName = node.$ref?.split('/').pop();
    const resolved = refName ? defs[refName] : undefined;
    let required = node.required === true ? true : resolved?.required === true ? true : undefined;
    let deprecated = node.deprecated ?? resolved?.deprecated;
    let deprecationMessage = node.deprecationMessage ?? resolved?.deprecationMessage;
    let example = node.example ?? resolved?.example;
    let since = node.since ?? resolved?.since;
    let see = node.see ?? resolved?.see;
    let remarks = node.remarks ?? resolved?.remarks;
    let experimental = node.experimental ?? resolved?.experimental;
    let alpha = node.alpha ?? resolved?.alpha;
    let beta = node.beta ?? resolved?.beta;
    for (const variant of [...(node.anyOf ?? []), ...(node.oneOf ?? [])]) {
        const variantRef = variant.$ref?.split('/').pop();
        const variantResolved = variantRef ? defs[variantRef] : undefined;
        required ??=
            variant.required === true || variantResolved?.required === true ? true : undefined;
        deprecated ??= variant.deprecated ?? variantResolved?.deprecated;
        deprecationMessage ??= variant.deprecationMessage ?? variantResolved?.deprecationMessage;
        example ??= variant.example ?? variantResolved?.example;
        since ??= variant.since ?? variantResolved?.since;
        see ??= variant.see ?? variantResolved?.see;
        remarks ??= variant.remarks ?? variantResolved?.remarks;
        experimental ??= variant.experimental ?? variantResolved?.experimental;
        alpha ??= variant.alpha ?? variantResolved?.alpha;
        beta ??= variant.beta ?? variantResolved?.beta;
    }
    return {
        ...(required !== undefined ? { required } : {}),
        ...(deprecated !== undefined ? { deprecated } : {}),
        ...(deprecationMessage !== undefined ? { deprecationMessage } : {}),
        ...(example !== undefined ? { example } : {}),
        ...(since !== undefined ? { since } : {}),
        ...(see !== undefined ? { see } : {}),
        ...(remarks !== undefined ? { remarks } : {}),
        ...(experimental !== undefined ? { experimental } : {}),
        ...(alpha !== undefined ? { alpha } : {}),
        ...(beta !== undefined ? { beta } : {}),
    };
}

function jsonNodeToDefinition(
    node: JsonSchemaNode,
    fieldRequired = false,
    defs: Record<string, JsonSchemaNode> = {}
): unknown {
    if (node.$ref) {
        const name = node.$ref.split('/').pop() ?? 'unknown';
        const resolved = defs[name];
        const description = node.description ?? resolved?.description;
        return {
            $schema: {
                type: 'any',
                tsType: name,
                ...(fieldRequired ? { tags: ['@required'] } : {}),
                ...(description ? { description } : {}),
                ...nodeMeta(node, defs),
            },
        };
    }

    if (node.properties) {
        const out: Record<string, unknown> = fieldRequired
            ? { $schema: { tags: ['@required'] } }
            : {};
        if (node.description) {
            out.$schema = {
                ...(out.$schema as object | undefined),
                description: node.description,
            };
        }
        const meta = nodeMeta(node, defs);
        if (meta.deprecated !== undefined || meta.example !== undefined) {
            out.$schema = { ...(out.$schema as object | undefined), ...meta };
        }
        for (const [key, child] of Object.entries(node.properties)) {
            out[key] = jsonNodeToDefinition(
                child,
                (node.required as string[] | undefined)?.includes(key) ?? false,
                defs
            );
        }
        // A schema that also accepts arbitrary keys (`.catchall` / `.passthrough`)
        // becomes an object with an index signature in the generated interface.
        if (node.additionalProperties !== undefined && node.additionalProperties !== false) {
            out.$schema = { ...(out.$schema as object | undefined), allowExtraKeys: true };
        }
        return out;
    }

    const resolvedType = jsonType(node);
    const out: Record<string, unknown> = {};
    if (node.defaultValue !== undefined) out.$default = node.defaultValue;
    else if (node.default !== undefined) out.$default = node.default;
    out.$schema = {
        type: resolvedType,
        tsType: renderTsType(node, defs),
        ...(resolvedType === 'array' ? { items: { type: jsonType(node.items ?? {}) } } : {}),
        ...(fieldRequired ? { tags: ['@required'] } : {}),
        ...(node.description ? { description: node.description } : {}),
        ...(node.env ? { env: node.env } : {}),
        ...(node.scope ? { scope: node.scope } : {}),
        ...(node.secret ? { secret: true } : {}),
        ...(node.public ? { public: true } : {}),
        ...nodeMeta(node, defs),
        ...(node.defaultValue !== undefined && node.default !== undefined
            ? { envDefault: node.default }
            : {}),
    };
    return out;
}

/** Lower a Zod config schema into an untyped definition object. */
export function zodToUntypedDefinition(zodSchema: ZodType): Record<string, unknown> {
    const jsonSchema = (zodSchema as ZodType & { toJSONSchema: () => unknown }).toJSONSchema() as
        | JsonSchemaNode
        | undefined;
    if (!jsonSchema) return {};
    const defs = jsonSchema.$defs ?? {};
    const refName = jsonSchema.$ref?.split('/').pop();
    const root = refName && defs[refName] ? defs[refName] : jsonSchema;
    return jsonNodeToDefinition(root, false, defs) as Record<string, unknown>;
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
        ...(node.$schema as object | undefined),
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
