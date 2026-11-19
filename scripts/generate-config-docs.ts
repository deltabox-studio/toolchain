#!/usr/bin/env node
/**
 * Generate the config docs index, CLI reference and env reference.
 *
 *   yarn config:docs
 *
 * All three pages go through `engine.markdown`: the CLI page from the same
 * `ToolchainCommand` descriptors the CLI registers, and the env page from the
 * config schemas' `ConfigMeta` (`.meta()`).
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createConfigEngine } from '@deltabox/toolchain/config';
import { toolchainConfigSchema } from '@deltabox/toolchain/shared';

import { builtinCommands } from '../src/cli/index.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const docsDir = path.join(root, 'apps', 'docs', 'config');
const engine = createConfigEngine({
    schema: { toolchain: toolchainConfigSchema },
    envPrefix: 'DBX_',
    root,
});

const indexBody = `The toolchain has three configuration surfaces, all derived from the same Zod
model:

- **Programmatic** — \`defineConfig({ toolchain: { ... } })\` in
  \`dbx.config.ts\`; typed as \`ToolchainConfig\` (see the
  [TypeScript guide](/guide/typescript)).
- **CLI** — the \`dbx\` command options, generated from the command descriptors;
  see the [CLI reference](/config/cli).
- **Environment** — schema leaves can opt into env vars with
  \`.meta({ env })\`; see the [environment reference](/config/env) and the
  [Config Generator](/guide/config-generator/).

The exhaustive object reference is [dbx.config](/config/reference); the editor
JSON Schema is [config.schema.json](https://toolchain.deltabox.studio/config.schema.json).

## Fields

Every generated page uses the same \`ConfigMeta\` fields: \`description\`,
\`required\`, \`deprecated\`, \`example\`, \`secret\`, \`scope\`, \`public\`,
\`defaultValue\`, the env fields \`envName\`, \`envPath\` and more.`;

engine.markdown.file.write({
    output: path.join(docsDir, 'index.md'),
    title: 'Config types',
    body: indexBody,
});
engine.markdown.cli.write(builtinCommands(), {
    output: path.join(docsDir, 'cli.md'),
    intro: [
        'Generated from the same `ToolchainCommand` descriptors the `dbx` binary',
        'registers. Run `yarn config:docs` after changing a command.',
    ].join('\n'),
});
engine.markdown.env.write({ output: path.join(docsDir, 'env.md') });

console.log('Generated apps/docs/config/{index,cli,env}.md');
