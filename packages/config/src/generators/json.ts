/**
 * Config JSON Schema generator. Produces a JSON Schema document for every scope:
 * Zod scopes go through Zod's `toJSONSchema` (preserving unions, enums, tuples,
 * records and nullable constraints), untyped scopes through their resolved
 * schema.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Schema } from 'untyped';

import {
    flattenBaseSchema,
    isSchemaType,
    isZodSchema,
    metaOf,
    normalizeJsonSchemaMetadata,
    toJsonSchemaSafe,
} from '../schema.js';
import type { ConfigEngineOptions, ConfigSchema, ConfigSchemaInput } from '../types/index.js';

type JsonNode = Record<string, unknown>;

function isJsonNode(value: unknown): value is JsonNode {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Inline `$defs` references into a self-contained schema. Recursive or
 * unresolved references become unconstrained (`{}`), which keeps the output
 * valid without a document-level `$defs` table.
 */
function inlineJsonRefs(
    node: unknown,
    defs: Record<string, JsonNode>,
    seen: Set<string> = new Set()
): unknown {
    if (Array.isArray(node)) return node.map(item => inlineJsonRefs(item, defs, seen));
    if (!isJsonNode(node)) return node;
    const ref = typeof node.$ref === 'string' ? node.$ref : undefined;
    if (ref) {
        const match = /^#\/(?:\$defs|definitions)\/(.+)$/.exec(ref);
        if (match) {
            let name = match[1]!;
            try {
                name = decodeURIComponent(name);
            } catch {
                // Keep the raw name.
            }
            const target = defs[name];
            if (target && !seen.has(name)) {
                const { $ref: _ref, ...rest } = node;
                const inlined = inlineJsonRefs(target, defs, new Set([...seen, name]));
                return { ...(isJsonNode(inlined) ? inlined : {}), ...rest };
            }
        }
        const { $ref: _ref, ...rest } = node;
        return rest;
    }
    const out: JsonNode = {};
    for (const [key, value] of Object.entries(node)) {
        if (key === '$schema' || key === '$defs' || key === 'definitions') continue;
        out[key] = inlineJsonRefs(value, defs, seen);
    }
    return out;
}

/** The JSON Schema equivalent of {@link flattenBaseSchema}. */
function flattenBaseJsonSchema(node: JsonNode, baseGroup: string): JsonNode {
    const properties = node.properties;
    if (!isJsonNode(properties)) return node;
    const base = properties[baseGroup];
    if (!isJsonNode(base) || base.type !== 'object' || !isJsonNode(base.properties)) return node;
    const { [baseGroup]: _base, ...rest } = properties;
    const required = [
        ...(Array.isArray(node.required) ? node.required : []),
        ...(Array.isArray(base.required) ? base.required : []),
    ];
    const out: JsonNode = {
        ...node,
        properties: { ...(base.properties as JsonNode), ...rest },
    };
    if (required.length > 0) out.required = [...new Set(required)];
    else delete out.required;
    return out;
}

/** Merge several root object schemas into one (mirrors `mergeSchemas`). */
function mergeJsonSchemas(nodes: JsonNode[]): JsonNode {
    const properties: JsonNode = {};
    const required = new Set<string>();
    let base: JsonNode = { type: 'object', properties };
    for (const node of nodes) {
        if (isJsonNode(node.properties)) Object.assign(properties, node.properties);
        if (Array.isArray(node.required)) {
            for (const name of node.required) required.add(String(name));
        }
        if (nodes.length === 1) base = node;
    }
    return {
        ...base,
        type: 'object',
        properties,
        ...(required.size > 0 ? { required: [...required] } : {}),
    };
}

/** Deep-clone schema nodes without choking on functions/RegExp defaults. */
function cloneJsonNode(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(item => cloneJsonNode(item));
    if (!isJsonNode(value)) return value;
    return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, cloneJsonNode(child)])
    );
}

/** Lower one scope to a self-contained JSON Schema node. */
function toJsonScope(value: ConfigSchemaInput, baseGroup: string): JsonNode {
    if (isZodSchema(value)) {
        const json = toJsonSchemaSafe(value, {
            unrepresentable: 'any',
        }) as JsonNode;
        const defs = isJsonNode(json.$defs) ? (json.$defs as Record<string, JsonNode>) : {};
        const inlined = inlineJsonRefs(json, defs);
        return flattenBaseJsonSchema(isJsonNode(inlined) ? inlined : {}, baseGroup);
    }
    const schema = cloneJsonNode(value) as unknown as Schema;
    return flattenBaseSchema(schema, baseGroup) as unknown as JsonNode;
}

/** Normalize any supported schema shape into JSON-Schema scope inputs. */
function jsonSchemaScopes(
    schema: ConfigSchema
): Record<string, ConfigSchemaInput | ConfigSchemaInput[]> {
    if (Array.isArray(schema)) {
        const name = schema.length === 1 ? (metaOf(schema[0]!)?.id ?? 'config') : 'config';
        return { [name]: schema };
    }
    if (isZodSchema(schema) || isSchemaType(schema)) {
        return { [metaOf(schema)?.id ?? 'config']: schema };
    }
    return schema as Record<string, ConfigSchemaInput | ConfigSchemaInput[]>;
}

export interface GenerateJsonSchemaOptions extends Pick<ConfigEngineOptions, 'baseGroup'> {
    /** Output file path. When omitted, nothing is written. */
    output?: string | false;
    /** Document metadata overrides. */
    id?: string;
    title?: string;
    description?: string;
    /**
     * Scopes the document requires. Defaults to none: every config section is
     * opt-in by presence, so an empty config remains valid.
     */
    requiredScopes?: string[];
}

/**
 * Build the combined JSON Schema document covering every scope, using Zod's
 * `toJSONSchema` for Zod scopes (preserving unions, enums, tuples, records and
 * nullable constraints) and the resolved untyped schema for untyped scopes.
 *
 * The document is normalized into valid JSON Schema 2020-12: legacy `id`
 * anchors and untyped pseudo-types (`any`/`unknown`) are removed, generation
 * metadata is stripped, and properties with defaults are not required.
 */
export async function generateConfigJsonSchema(
    schema: ConfigSchema,
    options: GenerateJsonSchemaOptions = {}
): Promise<Record<string, unknown>> {
    const baseGroup = Array.isArray(options.baseGroup)
        ? String((options.baseGroup as unknown[])[0] ?? 'base')
        : String(options.baseGroup ?? 'base');
    const scopes = jsonSchemaScopes(schema);
    const properties: Record<string, unknown> = {};
    for (const [scope, value] of Object.entries(scopes)) {
        const node = Array.isArray(value)
            ? mergeJsonSchemas(value.map(item => toJsonScope(item, baseGroup)))
            : toJsonScope(value, baseGroup);
        normalizeJsonSchemaMetadata(node);
        properties[scope] = node;
    }

    const doc: Record<string, unknown> = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: options.id ?? 'https://example.com/schemas/config.json',
        title: options.title ?? 'Configuration',
        description:
            options.description ?? 'Every env-var-backed configuration value across all scopes.',
        type: 'object',
        properties,
        required: options.requiredScopes ?? [],
    };

    if (typeof options.output === 'string') {
        fs.mkdirSync(path.dirname(options.output), { recursive: true });
        fs.writeFileSync(options.output, `${JSON.stringify(doc, null, 4)}\n`, 'utf-8');
    }

    return doc;
}

/** Generate the JSON Schema document into `output`. Returns the path written. */
export async function generateJsonSchemaFile(
    schema: ConfigSchema,
    options: GenerateJsonSchemaOptions & { output: string }
): Promise<string> {
    await generateConfigJsonSchema(schema, options);
    return options.output;
}
