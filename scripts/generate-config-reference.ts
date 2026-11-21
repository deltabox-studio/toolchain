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

import { createConfigEngine } from '@deltabox/toolchain/config';
import { configSchema, logger, toolchainConfigSchema } from '@deltabox/toolchain/shared';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const engine = createConfigEngine({ schema: configSchema });
const schemaEngine = createConfigEngine({
    schema: { toolchain: toolchainConfigSchema },
    root,
});

const markdown = engine.markdown.generate({
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
    onContent: content =>
        content.replace(
            /\(\`\{\{ (name|scope|author|license|homepage|repo|description|nodeVersion|packageManager|yarnVersion|packageManagerVersion|mainBranch|devBranch) \}\}\`\)/g,
            '<code v-pre>{{ $1 }}</code>'
        ),
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
const markdownIndex = markdown;
if (!markdownIndex) {
    throw new Error('markdown.generate did not produce an index.md entry.');
}
fs.writeFileSync(docsPath, `${markdownIndex.trimEnd()}\n${example}`, 'utf-8');

const jsonSchema = await schemaEngine.jsonSchema.generate({
    preserveDefs: true,
    additionalProperties: false,
    scopeDescriptions: {
        toolchain: 'The `@deltabox/toolchain` settings (every section is opt-in by presence).',
    },
    id: 'https://deltabox.studio/schemas/dbx.config.json',
    title: 'dbx.config',
    description:
        'The dbx configuration model (the @deltabox/toolchain settings live under `toolchain`).',
});
const schemaPath = path.join(root, 'config.schema.json');
fs.writeFileSync(schemaPath, `${JSON.stringify(jsonSchema, null, 4)}\n`, 'utf-8');

logger.info(`Generated ${path.relative(root, docsPath)} and ${path.relative(root, schemaPath)}`);
