#!/usr/bin/env node
/**
 * Generate the `dbx.config` reference + editor JSON Schema from the Zod config
 * model (the single source of truth in `packages/shared/src/config-schema`).
 *
 *   yarn config:generate
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { generateConfigMarkdown } from '@deltabox/toolchain-config';
import { configSchema, dbxConfigSchema, logger } from '@deltabox/toolchain-shared';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const markdown = generateConfigMarkdown(configSchema, {
    combined: true,
    title: 'dbx.config',
    intro: [
        'A `dbx.config.ts` file exports `{ toolchain: { ...sections } }`: the',
        '`@deltabox/toolchain` settings live under the `toolchain` key. Every',
        'section is **opt-in by presence** (see [Configuration](/guide/config/opt-in-by-presence)):',
        'define it to enable it, omit it to leave that area untouched.',
        '',
        '> Generated from the Zod config schema — do not edit by hand.',
        '> Run `yarn config:generate`.',
    ].join('\n'),
})['index.md'];
const docsPath = path.join(root, 'apps/docs/config/reference.md');
fs.mkdirSync(path.dirname(docsPath), { recursive: true });
const example = [
    '',
    '## Full example',
    '',
    '```ts [dbx.config.ts]',
    "import { defineConfig } from '@deltabox/toolchain';",
    '',
    'export default defineConfig({',
    '    toolchain: {',
    "        project: { type: 'monorepo-root', name: 'acme', scope: '@acme' },",
    '        ci: { ci: true, release: true, changelog: { branches: { main: "main" } } },',
    '        tsconfig: { refs: true },',
    "        templates: { sources: [{ type: 'local', locate: './templates', kind: 'application' }] },",
    "        vite: { fmt: { semi: true, singleQuote: true }, test: { include: ['src/**/*.test.ts'] } },",
    '        watch: { debounce: 150 },',
    '    },',
    '});',
    '```',
    '',
].join('\n');
fs.writeFileSync(docsPath, `${markdown?.trimEnd()}\n${example}`, 'utf-8');

function normalizeMetadata(node: unknown): void {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    const record = node as Record<string, unknown>;
    if (typeof record.deprecated === 'string') {
        record.deprecationMessage = record.deprecated;
        record.deprecated = true;
    }
    if ('example' in record) {
        const example = record.example;
        delete record.example;
        record.examples = Array.isArray(example) ? example : [example];
    }
    for (const key of ['properties', '$defs']) {
        const map = record[key];
        if (map && typeof map === 'object' && !Array.isArray(map)) {
            for (const child of Object.values(map as Record<string, unknown>)) {
                normalizeMetadata(child);
            }
        }
    }
    for (const key of ['items', 'additionalProperties']) normalizeMetadata(record[key]);
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
        const list = record[key];
        if (Array.isArray(list)) for (const child of list) normalizeMetadata(child);
    }
}

const jsonSchema = z.toJSONSchema(dbxConfigSchema, { target: 'draft-2020-12' }) as Record<
    string,
    unknown
>;
normalizeMetadata(jsonSchema);
jsonSchema.$id = 'https://deltabox.studio/schemas/dbx.config.json';
jsonSchema.title = 'dbx.config';
jsonSchema.description =
    'The dbx configuration model (the @deltabox/toolchain settings live under `toolchain`).';
const schemaPath = path.join(root, 'config.schema.json');
fs.writeFileSync(schemaPath, `${JSON.stringify(jsonSchema, null, 4)}\n`, 'utf-8');

logger.info(`Generated ${path.relative(root, docsPath)} and ${path.relative(root, schemaPath)}`);
