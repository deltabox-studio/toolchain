/**
 * Config JSON Schema generator. Produces the "untyped" JSON Schema document for
 * every scope via untyped's `resolveSchema`, applied to the definition lowered
 * from the Zod config schemas.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Schema } from 'untyped';

import { flattenBaseSchema, normalizeConfigSchema } from '../schema.js';
import type { ConfigEngineOptions, ConfigSchema } from '../types.js';

export interface GenerateJsonSchemaOptions extends Pick<ConfigEngineOptions, 'baseGroup'> {
    /** Output file path. When omitted, nothing is written. */
    output?: string | false;
    /** Document metadata overrides. */
    id?: string;
    title?: string;
    description?: string;
}

/**
 * Build the combined untyped JSON Schema document covering every scope, using
 * untyped's `resolveSchema` on the definitions lowered from the Zod schemas.
 */
export async function generateConfigJsonSchema(
    schema: ConfigSchema,
    options: GenerateJsonSchemaOptions = {}
): Promise<Record<string, unknown>> {
    const scopes = normalizeConfigSchema(schema);
    const properties: Record<string, unknown> = {};
    for (const [scope] of Object.entries(scopes)) {
        properties[scope] = flattenBaseSchema(
            scopes[scope] as unknown as Schema,
            Array.isArray(options.baseGroup)
                ? String((options.baseGroup as unknown[])[0] ?? 'base')
                : String(options.baseGroup ?? 'base')
        );
    }

    const doc: Record<string, unknown> = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $id: options.id ?? 'https://example.com/schemas/config.json',
        title: options.title ?? 'Configuration',
        description:
            options.description ?? 'Every env-var-backed configuration value across all scopes.',
        type: 'object',
        properties,
        required: Object.keys(scopes),
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
