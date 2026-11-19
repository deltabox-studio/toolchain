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
                // A schema with a `meta({ id })` is emitted as a root `$ref`
                // plus a `$defs` table. Drop that document-level metadata too,
                // so the inlined node is self-contained (a nested `$schema` is
                // invalid and the leftover table bloats the document).
                const {
                    $ref: _ref,
                    $schema: _schema,
                    $defs: _defs,
                    definitions: _definitions,
                    ...rest
                } = node;
                const inlined = inlineJsonRefs(target, defs, new Set([...seen, name]));
                return { ...(isJsonNode(inlined) ? inlined : {}), ...rest };
            }
        }
        const {
            $ref: _ref,
            $schema: _schema,
            $defs: _defs,
            definitions: _definitions,
            ...rest
        } = node;
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

/** Lower one scope to a JSON Schema node, plus its `$defs` when refs are preserved. */
function toJsonScope(
    value: ConfigSchemaInput,
    baseGroup: string,
    preserveDefs: boolean
): { node: JsonNode; defs: Record<string, JsonNode> } {
    if (isZodSchema(value)) {
        const json = toJsonSchemaSafe(value, {
            unrepresentable: 'any',
        }) as JsonNode;
        const defs = isJsonNode(json.$defs) ? (json.$defs as Record<string, JsonNode>) : {};
        if (preserveDefs) {
            // Keep the `$ref` graph; the caller hoists `$defs` to the document
            // root so every `#/$defs/...` reference stays valid.
            const { $schema: _schema, $defs: _defs, ...rest } = json;
            return { node: flattenBaseJsonSchema(rest, baseGroup), defs };
        }
        const inlined = inlineJsonRefs(json, defs);
        return {
            node: flattenBaseJsonSchema(isJsonNode(inlined) ? inlined : {}, baseGroup),
            defs: {},
        };
    }
    const schema = cloneJsonNode(value) as unknown as Schema;
    return {
        node: flattenBaseSchema(schema, baseGroup) as unknown as JsonNode,
        defs: {},
    };
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
    /**
     * Keep Zod's document-level `$ref`/`$defs` graph instead of inlining every
     * reference into its scope (default false). The `$defs` tables are hoisted
     * to the document root so the references stay valid.
     */
    preserveDefs?: boolean;
    /** Descriptions for the generated scope properties, keyed by scope name. */
    scopeDescriptions?: Record<string, string>;
    /** Set the document root's `additionalProperties` constraint. */
    additionalProperties?: boolean;
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
    const defs: Record<string, JsonNode> = {};
    const preserveDefs = options.preserveDefs === true;
    for (const [scope, value] of Object.entries(scopes)) {
        const lowered = Array.isArray(value)
            ? (() => {
                  const items = value.map(item => toJsonScope(item, baseGroup, preserveDefs));
                  return {
                      node: mergeJsonSchemas(items.map(item => item.node)),
                      defs: Object.assign({}, ...items.map(item => item.defs)),
                  };
              })()
            : toJsonScope(value, baseGroup, preserveDefs);
        const node = lowered.node;
        if (preserveDefs) Object.assign(defs, lowered.defs);
        const description = options.scopeDescriptions?.[scope];
        if (description) node.description = description;
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
        ...(options.additionalProperties !== undefined
            ? { additionalProperties: options.additionalProperties }
            : {}),
        required: options.requiredScopes ?? [],
        ...(options.preserveDefs && Object.keys(defs).length > 0 ? { $defs: defs } : {}),
    };
    normalizeJsonSchemaMetadata(doc);
    // Normalization drops empty `required` arrays; the engine contract keeps an
    // explicit (usually empty) scope list.
    doc.required = options.requiredScopes ?? [];

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
