import fs from 'node:fs';

import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vite-plus/test';

/** Schema-node keys that identify an object as a schema rather than a property map. */
const SCHEMA_MARKERS = [
    'type',
    '$ref',
    '$id',
    'properties',
    'items',
    'anyOf',
    'oneOf',
    'allOf',
    '$defs',
];

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

const schema = JSON.parse(
    fs.readFileSync(new URL('../config.schema.json', import.meta.url), 'utf-8')
) as Record<string, unknown>;

describe('config.schema.json', () => {
    it('is a valid JSON Schema 2020-12 document', () => {
        expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
        expect(schema.$id).toBe('https://deltabox.studio/schemas/dbx.config.json');
        expect(schemaIssues(schema)).toEqual([]);
    });

    it('compiles under Ajv strict mode', () => {
        const validate = createAjv().compile(schema);

        // Config sections are opt-in by presence, so an empty config is valid.
        expect(validate({})).toBe(true);
        expect(validate({ toolchain: {} })).toBe(true);
        expect(validate({ toolchain: { tsconfig: true } })).toBe(true);
        expect(validate({ toolchain: { tsconfig: { flattenRemoteExtends: true } } })).toBe(true);
        expect(
            validate({
                toolchain: {
                    ci: {
                        dependabot: {
                            allow: { npm: [{ 'dependency-name': 'vite' }] },
                            ignore: [
                                {
                                    'dependency-name': '*',
                                    'update-types': ['version-update:semver-major'],
                                },
                            ],
                            security: {
                                vulnerabilities: { severity: ['high', 'critical'] },
                                pr: { strategy: 'individual' },
                            },
                        },
                    },
                },
            })
        ).toBe(true);

        expect(validate({ toolchain: { notASection: true } })).toBe(false);
        expect(validate({ toolchain: { tsconfig: { flattenRemoteExtends: 'yes' } } })).toBe(false);
    });

    it('does not require properties that carry a default', () => {
        const problems: string[] = [];
        const walk = (node: unknown, path: string): void => {
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) {
                node.forEach((item, index) => walk(item, `${path}[${index}]`));
                return;
            }
            const record = node as Record<string, unknown>;
            if (Array.isArray(record.required) && record.properties) {
                const properties = record.properties as Record<string, unknown>;
                for (const name of record.required) {
                    const property = properties[String(name)];
                    if (property && typeof property === 'object' && 'default' in property) {
                        problems.push(`${path}.${String(name)}`);
                    }
                }
            }
            for (const key of ['$defs', 'properties']) {
                const map = record[key];
                if (map && typeof map === 'object' && !Array.isArray(map)) {
                    for (const [name, child] of Object.entries(map)) {
                        walk(child, `${path}.${key}.${name}`);
                    }
                }
            }
            for (const key of ['items', 'additionalProperties']) {
                walk(record[key], `${path}.${key}`);
            }
            for (const key of ['anyOf', 'oneOf', 'allOf']) {
                const list = record[key];
                if (Array.isArray(list)) {
                    list.forEach((child, index) => walk(child, `${path}.${key}[${index}]`));
                }
            }
        };
        walk(schema, '$');
        expect(problems).toEqual([]);
    });

    it('accepts a details object without the defaulted lifecycle field', () => {
        const defs = schema.$defs as Record<string, unknown>;
        const validate = createAjv().compile({
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            $defs: defs,
            $ref: '#/$defs/ChangelogDetailsConfig',
        });
        expect(validate({ enabled: true })).toBe(true);
        expect(validate({ lifecycle: 'before' })).toBe(true);
        expect(validate({ lifecycle: 'never' })).toBe(false);
    });
});
