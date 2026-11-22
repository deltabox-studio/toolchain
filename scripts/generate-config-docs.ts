#!/usr/bin/env node
/**
 * Generate the config docs index, CLI reference and env reference.
 *
 *   yarn config:docs
 *
 * All three pages go through `engine.markdown`: the CLI page from the same
 * `CliCommand` descriptors the CLI registers, and the env page from the
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

const indexBody = `There are four ways to configure dbx. They all feed the same toolchain
model, so a project can combine them.

## \`dbx.config.*\`

A standalone config file (\`dbx.config.ts\`, \`.mts\`, \`.cts\`, \`.js\`, \`.mjs\`,
\`.cjs\` or \`.json\`) exports \`{ toolchain: { ... } }\` with \`defineConfig\`.

It is the non-Vite path and is typed as \`ToolchainConfig\` (see the
[TypeScript guide](/guide/typescript)). Every section is opt-in by presence.

## Vite plugin

In a Vite or Vite+ project, pass the same \`toolchain\` object to the \`dbx()\`
plugin in \`vite.config.*\`.

The CLI reads it back from the Vite config, so no
\`dbx.config.*\` is required. See [Vite plugin](/guide/vite-plugin).

## CLI

\`dbx\` command flags configure a command for one run. The available options are
generated from the command descriptors. See the [CLI reference](/config/cli).

## Environment variables

Schema leaves that declare \`.meta({ envName })\` can be set through env vars (the
toolchain config uses the \`DBX_\` prefix).

See the [environment reference](/config/env) and the
[Config Generator](/guide/config-generator/).

## Editor JSON Schema

The generated [config.schema.json](https://toolchain.dbx.studio/config.schema.json)
gives editors completion and validation for \`dbx.config.*\`.

The exhaustive object reference is [dbx.config](/config/reference).

## Types

Find all static types for the configurations
[here](https://github.com/deltabox-studio/toolchain/blob/main/packages/shared/src/config-types.ts).

### Fields

Every generated config reference page uses the same
[ConfigMeta](https://github.com/deltabox-studio/toolchain/blob/main/packages/config/src/types/meta.ts)
fields defined in Zod/Untyped schemas:

- \`description\`
- \`required\`
- \`deprecated\`
- \`example\`
- \`secret\`
- \`scope\`
- \`public\`
- \`defaultValue\`
- \`envName\` (the env fields)
- \`envPath\`
- \`cli\` / \`cliCommand\` (schema-driven CLI flags and commands)
- \`envExpose\` (keep a value CLI-only) and more.`;

engine.markdown.file.write({
    output: path.join(docsDir, 'index.md'),
    title: 'Overview',
    body: indexBody,
});
engine.markdown.cli.write(builtinCommands(), {
    output: path.join(docsDir, 'cli.md'),
    intro: 'Generated from the same `CliCommand` descriptors the `dbx` binary registers.',
});
engine.markdown.env.write({ output: path.join(docsDir, 'env.md') });

console.log('Generated apps/docs/config/{index,cli,env}.md');
