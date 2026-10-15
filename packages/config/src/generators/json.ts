/**
 * Config JSON Schema generator. Produces the "untyped" JSON Schema document for
 * every scope via untyped's `resolveSchema`, applied to the definition lowered
 * from the Zod config schemas.
 */

import fs from 'node:fs';
import path from 'node:path';

import { type InputObject, resolveSchema } from 'untyped';

import { flattenBaseSchema, zodToUntypedDefinition } from '../schema.js';
import type { ConfigScopes } from '../types.js';

export interface GenerateJsonSchemaOptions {
    /** Output file path. When omitted, nothing is written. */
    output?: string;
    /** The base group hoisted to the top level (default `base`). */
    baseGroup?: string;
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
    scopes: ConfigScopes,
    options: GenerateJsonSchemaOptions = {}
): Promise<Record<string, unknown>> {
    const properties: Record<string, unknown> = {};
    for (const [scope, config] of Object.entries(scopes)) {
        properties[scope] = flattenBaseSchema(
            await resolveSchema(zodToUntypedDefinition(config.zodSchema) as InputObject),
            options.baseGroup
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

    if (options.output) {
        fs.mkdirSync(path.dirname(options.output), { recursive: true });
        fs.writeFileSync(options.output, `${JSON.stringify(doc, null, 4)}\n`, 'utf-8');
    }

    return doc;
}

/** Generate the JSON Schema document into `output`. Returns the path written. */
export async function generateJsonSchemaFile(
    scopes: ConfigScopes,
    options: GenerateJsonSchemaOptions & { output: string }
): Promise<string> {
    await generateConfigJsonSchema(scopes, options);
    return options.output;
}
