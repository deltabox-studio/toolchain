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

import type {
    ConfigMeta,
    ConfigSchema,
    ConfigSchemaInput,
    ConfigSchemaMap,
    ConfigSchemaType,
    ConfigValueKind,
} from './types/index.js';

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
    prefixItems?: JsonSchemaNode[];
    additionalProperties?: JsonSchemaNode | boolean;
    propertyNames?: JsonSchemaNode;
    env?: string;
    envName?: string;
    envPath?: string;
    path?: string;
    cliFlag?: string;
    cliFlagShort?: string;
    typeName?: string;
    id?: string;
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
    /** A hand-written TypeScript type for values JSON Schema cannot express. */
    tsType?: string;
}

const TS_TYPE_MAP: Record<string, string> = {
    string: 'string',
    number: 'number',
    integer: 'number',
    boolean: 'boolean',
    null: 'null',
};

/** Whether a value is a Zod schema. */
export function isZodSchema(value: unknown): value is ZodType {
    return typeof value === 'object' && value !== null && 'safeParse' in value;
}

/** Whether a value is a resolved untyped schema. */
export function isSchemaType(value: unknown): value is ConfigSchemaType {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    if (isZodSchema(value)) return false;
    return 'type' in value || 'properties' in value || 'tsType' in value || 'id' in value;
}

const CONFIG_META_KEYS: (keyof ConfigMeta)[] = [
    'id',
    'description',
    'required',
    'deprecated',
    'deprecationMessage',
    'example',
    'since',
    'see',
    'remarks',
    'experimental',
    'alpha',
    'beta',
    'secret',
    'scope',
    'public',
    'defaultValue',
    'envName',
    'env',
    'envPath',
    'path',
    'typeName',
    'cliFlag',
    'cliFlagShort',
    'tsType',
];

/** Whether a schema validates a function value. */
export function isZodFunctionSchema(value: unknown): boolean {
    return (
        isZodSchema(value) &&
        (value as { _zod?: { def?: { type?: string } } })._zod?.def?.type === 'function'
    );
}

/**
 * The handler passed to Zod's `toJSONSchema` for values JSON Schema cannot
 * represent. Functions carry a hand-written `tsType` (or fall back to `any`) so
 * the generated types/markdown stay useful while the editor JSON Schema remains
 * valid.
 */
function unrepresentableValue(ctx: {
    zodSchema: ZodType;
    path: (string | number)[];
    message: string;
}): Record<string, unknown> | 'any' {
    if (isZodFunctionSchema(ctx.zodSchema)) {
        const meta = metaOf(ctx.zodSchema);
        if (typeof meta?.tsType === 'string' && meta.tsType.trim()) {
            return {
                tsType: meta.tsType,
                ...(typeof meta.description === 'string' ? { description: meta.description } : {}),
            };
        }
    }
    return 'any';
}

/** Options for {@link toJsonSchemaSafe}. */
export interface ToJsonSchemaSafeOptions {
    target?: 'draft-2020-12' | 'draft-07' | 'draft-04' | 'openapi-3.0' | (string & {});
    /** Generate an input schema (defaults optional) or an output schema. */
    io?: 'input' | 'output';
    /** Use `'any'`/`'throw'` to skip the function-aware default handler. */
    unrepresentable?: 'throw' | 'any';
}

/**
 * `z.toJSONSchema` with the function-aware `unrepresentable` handler. Zod
 * functions cannot be represented in JSON Schema, so their `.meta({ tsType })`
 * is emitted instead of throwing.
 */
export function toJsonSchemaSafe(
    schema: ZodType,
    options: ToJsonSchemaSafeOptions = {}
): JsonSchemaNode {
    const params = {
        target: 'draft-2020-12',
        ...options,
        ...(options.unrepresentable
            ? { unrepresentable: options.unrepresentable }
            : { unrepresentable: unrepresentableValue }),
    } as Parameters<typeof z.toJSONSchema>[1];
    return z.toJSONSchema(schema, params) as JsonSchemaNode;
}

/** Read the config metadata attached to a Zod leaf or an untyped schema node. */
export function metaOf(schema: ZodType | Schema): ConfigMeta | undefined {
    if (isZodSchema(schema)) {
        const meta = (schema as ZodType & { meta?: () => unknown }).meta?.();
        return meta && typeof meta === 'object' ? (meta as ConfigMeta) : undefined;
    }
    const source = schema as Record<string, unknown>;
    const meta: Record<string, unknown> = {};
    for (const key of CONFIG_META_KEYS) {
        if (key === 'id' && typeof source.id === 'string' && source.id.startsWith('#')) continue;
        if (source[key] !== undefined) meta[key] = source[key];
    }
    return Object.keys(meta).length > 0 ? (meta as ConfigMeta) : undefined;
}

/** Convert a Zod schema or untyped schema to the untyped representation. */
export function toSchemaType(schema: ConfigSchemaInput): ConfigSchemaType {
    return (isZodSchema(schema) ? zodToJsonSchema(schema) : schema) as ConfigSchemaType;
}

/** Merge several root object schemas into one. */
function mergeSchemas(schemas: ConfigSchemaType[]): ConfigSchemaType {
    const properties: Record<string, Schema> = {};
    const required = new Set<string>();
    let base: ConfigSchemaType = { type: 'object', properties };
    for (const schema of schemas) {
        const source = schema as Record<string, unknown>;
        if (source.properties) Object.assign(properties, source.properties);
        if (Array.isArray(source.required)) for (const key of source.required) required.add(key);
        if (schemas.length === 1) base = schema;
    }
    return {
        ...base,
        type: 'object',
        properties,
        ...(required.size > 0 ? { required: [...required] } : {}),
    } as ConfigSchemaType;
}

/** Normalize any supported schema shape into scoped untyped schemas. */
export function normalizeConfigSchema(schema: ConfigSchema): ConfigSchemaMap {
    if (Array.isArray(schema)) {
        const merged = mergeSchemas(schema.map(toSchemaType));
        return { [metaOf(merged)?.id ?? 'config']: merged };
    }
    if (isZodSchema(schema) || isSchemaType(schema)) {
        const resolved = toSchemaType(schema);
        return { [metaOf(resolved)?.id ?? 'config']: resolved };
    }
    const scopes: ConfigSchemaMap = {};
    for (const [scope, value] of Object.entries(schema)) {
        const resolved = Array.isArray(value)
            ? mergeSchemas(value.map(toSchemaType))
            : toSchemaType(value);
        scopes[scope] = resolved;
    }
    return scopes;
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
    if (typeof node.tsType === 'string' && node.tsType.trim()) return node.tsType;
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
        const members = Object.entries(node.properties).map(([key, child]) => {
            const propertyKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
            return `${propertyKey}${required.includes(key) ? '' : '?'}: ${renderTsType(child, defs)}`;
        });
        return `{ ${members.join('; ')} }`;
    }
    const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
    if (types.includes('array')) {
        return `Array<${renderTsType(node.items, defs)}>`;
    }
    if (types.includes('object')) {
        const additional = node.additionalProperties;
        if (additional === undefined || additional === false) return 'Record<string & {}, unknown>';
        const value =
            additional === true || isEmptySchema(additional)
                ? 'unknown'
                : renderTsType(additional, defs);
        return `Record<string & {}, ${value}>`;
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
    if (Array.isArray(node.type)) {
        const types = [...new Set(node.type.filter(type => type !== 'null'))];
        return types.length === 1 ? types[0]! : 'any';
    }
    return node.type ?? 'unknown';
}

/** The config value kind a JSON Schema node describes, when it is distinctive. */
function jsonKind(node: JsonSchemaNode): ConfigValueKind | undefined {
    if (node.$ref) return undefined;
    if (node.const !== undefined) return 'literal';
    if (Array.isArray(node.enum) && node.enum.length > 0) return 'enum';
    if (node.anyOf || node.oneOf) return 'union';
    if (Array.isArray(node.type)) {
        const types = new Set(node.type.filter(type => type !== 'null'));
        if (types.size > 1) return 'union';
    }
    const type = Array.isArray(node.type) ? node.type.find(item => item !== 'null') : node.type;
    if (type === 'array') return node.prefixItems ? 'tuple' : 'array';
    if (type === 'object') {
        if (
            !node.properties &&
            node.additionalProperties !== undefined &&
            node.additionalProperties !== false
        ) {
            return 'record';
        }
        return node.properties ? 'object' : 'record';
    }
    if (type === undefined) return 'unknown';
    if (type === 'integer') return 'number';
    return ['string', 'number', 'boolean', 'null'].includes(type)
        ? (type as ConfigValueKind)
        : undefined;
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
    let env = node.env ?? resolved?.env;
    let envName = node.envName ?? resolved?.envName;
    let envPath = node.envPath ?? resolved?.envPath;
    let pathMeta = node.path ?? resolved?.path;
    let cliFlag = node.cliFlag ?? resolved?.cliFlag;
    let cliFlagShort = node.cliFlagShort ?? resolved?.cliFlagShort;
    let typeName = node.typeName ?? resolved?.typeName;
    let id = node.id ?? resolved?.id;
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
        env ??= variant.env ?? variantResolved?.env;
        envName ??= variant.envName ?? variantResolved?.envName;
        envPath ??= variant.envPath ?? variantResolved?.envPath;
        pathMeta ??= variant.path ?? variantResolved?.path;
        cliFlag ??= variant.cliFlag ?? variantResolved?.cliFlag;
        cliFlagShort ??= variant.cliFlagShort ?? variantResolved?.cliFlagShort;
        typeName ??= variant.typeName ?? variantResolved?.typeName;
        id ??= variant.id ?? variantResolved?.id;
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
        ...(env !== undefined ? { env } : {}),
        ...(envName !== undefined ? { envName } : {}),
        ...(envPath !== undefined ? { envPath } : {}),
        ...(pathMeta !== undefined ? { path: pathMeta } : {}),
        ...(cliFlag !== undefined ? { cliFlag } : {}),
        ...(cliFlagShort !== undefined ? { cliFlagShort } : {}),
        ...(typeName !== undefined ? { typeName } : {}),
        ...(id !== undefined ? { id } : {}),
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
        // A named object keeps its children so env/CLI collection and the JSON
        // Schema generator can see them, while `tsType` preserves the named
        // reference for type generation.
        if (resolved?.properties) {
            const expanded = jsonNodeToDefinition(resolved, fieldRequired, defs) as Record<
                string,
                unknown
            >;
            expanded.$schema = {
                ...(expanded.$schema as object | undefined),
                type: 'object',
                tsType:
                    typeof resolved.tsType === 'string' && resolved.tsType.trim()
                        ? resolved.tsType
                        : name,
                ...(fieldRequired ? { tags: ['@required'] } : {}),
                ...(description ? { description } : {}),
                ...nodeMeta(node, defs),
            };
            return expanded;
        }
        return {
            $schema: {
                type: 'any',
                tsType:
                    typeof resolved?.tsType === 'string' && resolved.tsType.trim()
                        ? resolved.tsType
                        : name,
                ...(fieldRequired ? { tags: ['@required'] } : {}),
                ...(description ? { description } : {}),
                ...nodeMeta(node, defs),
            },
        };
    }

    if (
        typeof node.tsType === 'string' &&
        node.tsType.trim() &&
        (!node.properties || Object.keys(node.properties).length === 0)
    ) {
        return {
            $schema: {
                type: 'any',
                tsType: node.tsType,
                ...(fieldRequired ? { tags: ['@required'] } : {}),
                ...(node.description ? { description: node.description } : {}),
                ...nodeMeta(node, defs),
            },
        };
    }

    if (node.properties) {
        const out: Record<string, unknown> = fieldRequired
            ? { $schema: { tags: ['@required'] } }
            : {};
        if (node.defaultValue !== undefined) out.$default = node.defaultValue;
        else if (node.default !== undefined) out.$default = node.default;
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
    const kind = jsonKind(node);
    const out: Record<string, unknown> = {};
    if (node.defaultValue !== undefined) out.$default = node.defaultValue;
    else if (node.default !== undefined) out.$default = node.default;
    out.$schema = {
        type: resolvedType,
        ...(kind ? { configKind: kind } : {}),
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
    const jsonSchema = toJsonSchemaSafe(zodSchema);
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

    const source = (node.$schema as Record<string, unknown> | undefined) ?? {};
    const { configKind, ...rest } = source;
    const schema: Record<string, unknown> = { ...rest, id: schemaId };
    if (typeof configKind === 'string') {
        // Generation-only marker: keep it off the enumerable schema so the
        // untyped type/JSON-schema generators never emit it.
        Object.defineProperty(schema, 'configKind', {
            value: configKind,
            enumerable: false,
            configurable: true,
        });
    }
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

/** Keys that are only meaningful to the untyped/type generators, not JSON Schema. */
const NON_JSON_SCHEMA_KEYS = [
    'id',
    'tsType',
    'configKind',
    'tags',
    'allowExtraKeys',
    'env',
    'envName',
    'envPath',
    'path',
    'cliFlag',
    'cliFlagShort',
    'typeName',
    'scope',
    'secret',
    'public',
    'envDefault',
    '$resolve',
] as const;

/** JSON Schema keywords that hold child schemas keyed by name. */
const SCHEMA_MAP_KEYWORDS = [
    'properties',
    '$defs',
    'definitions',
    'patternProperties',
    'dependentSchemas',
] as const;

/** JSON Schema keywords that hold one child schema. */
const SCHEMA_NODE_KEYWORDS = [
    'items',
    'additionalItems',
    'additionalProperties',
    'contains',
    'contentSchema',
    'propertyNames',
    'not',
    'if',
    'then',
    'else',
    'unevaluatedItems',
    'unevaluatedProperties',
] as const;

/** JSON Schema keywords that hold an array of child schemas. */
const SCHEMA_LIST_KEYWORDS = ['anyOf', 'oneOf', 'allOf', 'prefixItems'] as const;

/**
 * Normalize a generated JSON Schema node in place:
 *
 * - drop legacy `id` anchors (`$id`/`$anchor` are the 2020-12 identifiers);
 * - turn the untyped `any`/`unknown` pseudo-types into an unconstrained schema;
 * - drop generation-only keys (`tsType`, `configKind`, `tags`, env metadata, ...);
 * - normalize `example` -> `examples` and a string `deprecated` -> boolean +
 *   `deprecationMessage` (the VS Code annotation).
 *
 * Traversal is schema-aware: `default` values are user data and stay untouched.
 */
export function normalizeJsonSchemaMetadata(node: unknown): void {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const record = node as Record<string, unknown>;
    for (const key of NON_JSON_SCHEMA_KEYS) delete record[key];
    if (record.type === 'any' || record.type === 'unknown') {
        delete record.type;
    } else if (Array.isArray(record.type)) {
        const types = record.type.filter(
            (type): type is string => type !== 'any' && type !== 'unknown'
        );
        if (types.length === 0) delete record.type;
        else record.type = types.length === 1 ? types[0] : types;
    }
    // A boolean `required` is untyped's env metadata; the parent object's
    // `required` string array is the JSON Schema constraint.
    if (typeof record.required === 'boolean') delete record.required;
    // A property with a generated default may be omitted by the config input;
    // JSON Schema `default` is only an annotation, so drop it from `required`.
    if (Array.isArray(record.required) && record.properties) {
        const properties = record.properties as Record<string, unknown>;
        const required = record.required.filter(name => {
            const property = properties[String(name)];
            return !(
                property &&
                typeof property === 'object' &&
                !Array.isArray(property) &&
                'default' in property
            );
        });
        if (required.length === 0) delete record.required;
        else record.required = required;
    }
    if (typeof record.deprecated === 'string') {
        record.deprecationMessage = record.deprecated;
        record.deprecated = true;
    }
    if ('example' in record) {
        const example = record.example;
        delete record.example;
        record.examples = Array.isArray(example) ? example : [example];
    }
    for (const key of SCHEMA_MAP_KEYWORDS) {
        const map = record[key];
        if (map && typeof map === 'object' && !Array.isArray(map)) {
            for (const child of Object.values(map as Record<string, unknown>)) {
                normalizeJsonSchemaMetadata(child);
            }
        }
    }
    for (const key of SCHEMA_NODE_KEYWORDS) {
        const child = record[key];
        if (Array.isArray(child)) {
            for (const item of child) normalizeJsonSchemaMetadata(item);
        } else {
            normalizeJsonSchemaMetadata(child);
        }
    }
    // Draft-07 `dependencies` values are either a string array or a schema.
    const dependencies = record.dependencies;
    if (dependencies && typeof dependencies === 'object' && !Array.isArray(dependencies)) {
        for (const child of Object.values(dependencies as Record<string, unknown>)) {
            if (!Array.isArray(child)) normalizeJsonSchemaMetadata(child);
        }
    }
    for (const key of SCHEMA_LIST_KEYWORDS) {
        const list = record[key];
        if (Array.isArray(list)) for (const child of list) normalizeJsonSchemaMetadata(child);
    }
}

/** Lower a Zod schema and every named `$defs` entry into resolved schemas. */
export function zodToSchemaMap(zodSchema: ZodType): Record<string, ConfigSchemaType> {
    const jsonSchema = toJsonSchemaSafe(zodSchema);
    if (!jsonSchema) return {};
    const defs = jsonSchema.$defs ?? {};
    const out: Record<string, ConfigSchemaType> = {};
    for (const [name, node] of Object.entries(defs)) {
        out[name] = resolveUntypedSchema(
            jsonNodeToDefinition(node, false, defs) as Record<string, unknown>
        ) as ConfigSchemaType;
    }
    const rootName =
        jsonSchema.$ref?.split('/').pop() ?? jsonSchema.id ?? metaOf(zodSchema)?.id ?? 'config';
    if (!out[rootName]) {
        out[rootName] = resolveUntypedSchema(
            jsonNodeToDefinition(jsonSchema, false, defs) as Record<string, unknown>
        ) as ConfigSchemaType;
    }
    return out;
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
