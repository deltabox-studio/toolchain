#!/usr/bin/env node
/**
 * Generate the `dbx.config` reference + editor JSON Schema from the Zod config
 * model (the single source of truth in
 * `packages/shared/src/config-schema.ts`).
 *
 *   yarn config:generate
 *
 * Outputs:
 *   - apps/docs/config/reference.md  (the docs reference)
 *   - config.schema.json             (editor autocomplete for the JSON config)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import {
    CONFIG_SECTION_DESCRIPTIONS,
    CONFIG_SECTION_SCHEMAS,
    dbxConfigSchema,
    logger,
} from '@deltabox/toolchain-shared';
import { renderConfigFileMarkdown } from '@deltabox/toolchain/config';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

const sections = Object.entries(CONFIG_SECTION_SCHEMAS).map(([key, schema]) => ({
    key,
    description: CONFIG_SECTION_DESCRIPTIONS[key as keyof typeof CONFIG_SECTION_DESCRIPTIONS],
    schema,
}));

const markdown = renderConfigFileMarkdown(sections, {
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
});
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
fs.writeFileSync(docsPath, `${markdown.trimEnd()}\n${example}`, 'utf-8');

const jsonSchema = z.toJSONSchema(dbxConfigSchema, { target: 'draft-2020-12' }) as Record<
    string,
    unknown
>;
jsonSchema.$id = 'https://deltabox.studio/schemas/dbx.config.json';
jsonSchema.title = 'dbx.config';
jsonSchema.description =
    'The dbx configuration model (the @deltabox/toolchain settings live under `toolchain`).';
const schemaPath = path.join(root, 'config.schema.json');
fs.writeFileSync(schemaPath, `${JSON.stringify(jsonSchema, null, 4)}\n`, 'utf-8');

logger.info(`Generated ${path.relative(root, docsPath)} and ${path.relative(root, schemaPath)}`);
