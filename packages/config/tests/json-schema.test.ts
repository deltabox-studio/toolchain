import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vite-plus/test';
import { z } from 'zod';

import { generateConfigJsonSchema } from '../src/index.js';

/** Schema-node keys that identify an object as a schema rather than a property map. */
const SCHEMA_MARKERS = ['type', '$ref', '$id', 'properties', 'items', 'anyOf', 'oneOf', 'allOf'];

function schemaIssues(node: unknown, path = '$'): string[] {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) {
        return node.flatMap((child, index) => schemaIssues(child, `${path}[${index}]`));
    }
    const record = node as Record<string, unknown>;
    const issues: string[] = [];
    if (SCHEMA_MARKERS.some(key => key in record)) {
        if (record.type === 'any') issues.push(`${path}: type "any"`);
        if (Array.isArray(record.type) && record.type.includes('any')) {
            issues.push(`${path}: type array contains "any"`);
        }
        if ('id' in record) issues.push(`${path}: legacy "id" anchor`);
        for (const key of ['tsType', 'configKind', 'tags', 'allowExtraKeys']) {
            if (key in record) issues.push(`${path}: generation-only "${key}"`);
        }
    }
    for (const key of ['properties', '$defs']) {
        const map = record[key];
        if (map && typeof map === 'object' && !Array.isArray(map)) {
            for (const [name, child] of Object.entries(map)) {
                issues.push(...schemaIssues(child, `${path}.${key}.${name}`));
            }
        }
    }
    for (const key of ['items', 'additionalProperties']) {
        issues.push(...schemaIssues(record[key], `${path}.${key}`));
    }
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
        const list = record[key];
        if (Array.isArray(list)) {
            issues.push(
                ...list.flatMap((child, index) => schemaIssues(child, `${path}.${key}[${index}]`))
            );
        }
    }
    return issues;
}

function createAjv() {
    const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true });
    // The generated schema uses these annotations; Ajv strict mode rejects
    // unknown keywords unless they are registered.
    ajv.addKeyword({ keyword: 'see' });
    ajv.addKeyword({ keyword: 'deprecationMessage' });
    return ajv;
}

describe('generated config JSON Schema', () => {
    const schema = z.object({
        port: z.number(),
        mode: z.enum(['dev', 'prod']),
        token: z.string().meta({ envName: 'APP_TOKEN', required: true }),
        union: z.union([z.string(), z.number(), z.boolean()]),
        nullable: z.string().nullable(),
        literal: z.literal('fixed'),
        tuple: z.tuple([z.string(), z.number()]),
        record: z.record(z.string(), z.string()),
        withDefault: z.array(z.string()).default([]),
        nested: z.object({ value: z.boolean() }).meta({ id: 'NestedFixture' }).optional(),
        callback: z
            .function({ input: z.tuple([]), output: z.string() })
            .meta({ tsType: '(ctx: {}) => string', see: 'https://example.com/callback' })
            .optional(),
        old: z
            .string()
            .meta({
                deprecated: true,
                deprecationMessage: 'Use token instead',
                example: 'legacy',
            })
            .optional(),
    });

    function serverNode(doc: Record<string, unknown>): Record<string, unknown> {
        const properties = doc.properties as Record<string, Record<string, unknown>>;
        return properties.server!;
    }

    it('emits only valid JSON Schema 2020-12 nodes', async () => {
        const doc = await generateConfigJsonSchema({ server: schema });

        expect(doc.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
        expect(schemaIssues(doc)).toEqual([]);
        expect(doc.required).toEqual([]);
    });

    it('preserves unions, enums, literals, tuples, records and nullable fields', async () => {
        const server = serverNode(await generateConfigJsonSchema({ server: schema }));
        const properties = server.properties as Record<string, Record<string, unknown>>;
        const serialized = JSON.stringify(server);

        expect(properties.union?.type).toEqual(['string', 'number', 'boolean']);
        expect(properties.nullable?.type).toEqual(['string', 'null']);
        expect(properties.mode?.enum).toEqual(['dev', 'prod']);
        expect(properties.literal?.const).toBe('fixed');
        expect(properties.tuple?.prefixItems).toHaveLength(2);
        expect(properties.tuple?.items).toBe(false);
        expect(properties.record?.additionalProperties).toMatchObject({ type: 'string' });
        expect(properties.nested?.additionalProperties).toBe(false);
        expect(properties.nested?.properties).toMatchObject({
            value: { type: 'boolean' },
        });
        expect(serialized).not.toContain('"$defs"');
        expect(serialized).not.toContain('"$ref"');
        expect(server.required).not.toContain('withDefault');
    });

    it('keeps custom annotations and normalizes deprecated/example metadata', async () => {
        const doc = await generateConfigJsonSchema({ server: schema });
        const serialized = JSON.stringify(doc);

        expect(serialized).toContain('"see":"https://example.com/callback"');
        expect(serialized).toContain('"deprecationMessage":"Use token instead"');
        expect(serialized).toContain('"examples":["legacy"]');
        expect(serialized).not.toContain('"tsType"');
    });

    it('compiles under Ajv 2020-12 strict mode', async () => {
        const doc = await generateConfigJsonSchema({ server: schema });
        const validate = createAjv().compile(doc);

        expect(
            validate({
                server: {
                    port: 3000,
                    mode: 'dev',
                    token: 'secret',
                    union: true,
                    nullable: null,
                    literal: 'fixed',
                    tuple: ['a', 1],
                    record: { key: 'value' },
                },
            })
        ).toBe(true);
        expect(validate({ server: { port: 'nope', mode: 'dev', token: 'secret' } })).toBe(false);
        expect(
            validate({
                server: {
                    port: 3000,
                    mode: 'dev',
                    token: 'secret',
                    union: true,
                    nullable: null,
                    literal: 'wrong',
                    tuple: ['a', 1],
                    record: { key: 'value' },
                },
            })
        ).toBe(false);
    });

    it('only requires scopes when explicitly requested (opt-in by presence)', async () => {
        const doc = await generateConfigJsonSchema({ server: schema });
        expect(doc.required).toEqual([]);

        const required = await generateConfigJsonSchema(
            { server: schema },
            { requiredScopes: ['server'] }
        );
        expect(required.required).toEqual(['server']);
    });
});
