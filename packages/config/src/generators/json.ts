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
    normalizeBaseGroups,
    normalizeJsonSchemaMetadata,
    toJsonSchemaSafe,
} from '../schema.js';
import type {
    ConfigGroup,
    ConfigSchema,
    ConfigSchemaInput,
    GenerateJsonSchemaOptions,
} from '../types/index.js';

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

/** Resolve a local `$ref` (`#/$defs/Name`) against the scope definitions. */
function resolveLocalRef(node: JsonNode | undefined, defs: Record<string, JsonNode>): JsonNode {
    if (!node) return {};
    const ref = typeof node.$ref === 'string' ? node.$ref : undefined;
    if (!ref?.startsWith('#/$defs/')) return node;
    return defs[ref.slice('#/$defs/'.length)] ?? node;
}

/** The JSON Schema equivalent of {@link flattenBaseSchema}. */
export function flattenBaseJsonSchema(
    node: JsonNode,
    baseGroup?: ConfigGroup,
    defs: Record<string, JsonNode> = {}
): JsonNode {
    const properties = node.properties;
    if (!isJsonNode(properties)) return node;
    const names = normalizeBaseGroups(baseGroup);
    const found: Array<{ name: string; base: JsonNode }> = [];
    for (const name of names) {
        const base = resolveLocalRef(properties[name] as JsonNode, defs);
        if (isJsonNode(base) && base.type === 'object' && isJsonNode(base.properties)) {
            found.push({ name, base });
        }
    }
    if (found.length === 0) return node;
    const rest = { ...properties };
    for (const name of names) delete rest[name];
    const requiredNames = (Array.isArray(node.required) ? node.required : []).filter(
        name => !names.includes(String(name))
    );
    // Only promote a base group's children when that group itself is required;
    // otherwise an omitted base (allowed by Zod) would still require them.
    for (const { name, base } of found) {
        if (
            Array.isArray(node.required) &&
            node.required.some(entry => String(entry) === name) &&
            Array.isArray(base.required)
        ) {
            requiredNames.push(...base.required);
        }
    }
    const out: JsonNode = {
        ...node,
        properties: {
            ...Object.assign({}, ...found.map(({ base }) => base.properties)),
            ...rest,
        },
    };
    if (requiredNames.length > 0) out.required = [...new Set(requiredNames)];
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
    baseGroup: ConfigGroup | undefined,
    preserveDefs: boolean
): { node: JsonNode; defs: Record<string, JsonNode> } {
    if (isZodSchema(value)) {
        const json = toJsonSchemaSafe(value, {
            unrepresentable: 'any',
        }) as JsonNode;
        const defs = isJsonNode(json.$defs) ? (json.$defs as Record<string, JsonNode>) : {};
        if (preserveDefs) {
            // Keep the `$ref` graph; the caller hoists `$defs` to the document
            // root so every `#/$defs/...` reference stays valid. Flatten the
            // referenced definition too, otherwise the editor schema keeps the
            // nested `base` object while types/markdown expose it flat.
            const { $schema: _schema, $defs: _defs, ...rest } = json;
            const refName =
                typeof rest.$ref === 'string' && rest.$ref.startsWith('#/$defs/')
                    ? rest.$ref.slice('#/$defs/'.length)
                    : undefined;
            if (refName && defs[refName]) {
                defs[refName] = flattenBaseJsonSchema(defs[refName], baseGroup, defs);
            }
            return {
                node: flattenBaseJsonSchema(rest as JsonNode, baseGroup, defs),
                defs,
            };
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
        const first = schema[0];
        const firstSchema =
            schema.length === 1 && (isZodSchema(first) || isSchemaType(first))
                ? metaOf(first)?.id
                : undefined;
        return { [firstSchema ?? 'config']: schema };
    }
    if (isZodSchema(schema) || isSchemaType(schema)) {
        return { [metaOf(schema)?.id ?? 'config']: schema };
    }
    return schema as Record<string, ConfigSchemaInput | ConfigSchemaInput[]>;
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
    const baseGroup = options.baseGroup;
    const scopes = jsonSchemaScopes(schema);
    const properties: Record<string, unknown> = {};
    const defs: Record<string, JsonNode> = {};
    const defScopes: Record<string, string> = {};
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
        if (preserveDefs) {
            for (const [name, definition] of Object.entries(lowered.defs)) {
                const existing = defs[name];
                if (existing && JSON.stringify(existing) !== JSON.stringify(definition)) {
                    throw new Error(
                        `duplicate $defs id "${name}" across scopes "${defScopes[name]}" and "${scope}".`
                    );
                }
                defs[name] = definition as JsonNode;
                defScopes[name] = scope;
            }
        }
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
        const content = `${JSON.stringify(doc, null, 4)}\n`;
        fs.writeFileSync(options.output, options.onContent?.(content) ?? content, 'utf-8');
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
