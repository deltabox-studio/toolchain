#!/usr/bin/env node
/**
 * Generate the config docs index, CLI reference and env reference.
 *
 *   yarn config:docs
 *
 * The CLI page is derived from the same `ToolchainCommand` descriptors the CLI
 * registers, and the env page from the config schemas' `ConfigMeta` (`.meta()`).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { collectVars, generateCliDocs } from '@deltabox/toolchain/config';
import { toolchainConfigSchema } from '@deltabox/toolchain/shared';

import { builtinCommands } from '../src/cli/index.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const docsDir = path.join(root, 'apps', 'docs', 'config');

/** Escape raw `<`/`>` so Vue does not parse option placeholders as tags. */
function esc(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\|/g, '\\|');
}

function renderEnv(): string {
    const vars = collectVars({ toolchain: toolchainConfigSchema }, 'DBX_').filter(
        variable => variable.name
    );
    const lines = [
        '---',
        'title: Environment variables',
        'outline: [2, 3]',
        '---',
        '',
        '# Environment variables',
        '',
        'The toolchain config is file/CLI backed; a schema leaf opts into an',
        'environment variable with `.meta({ env: "..." })` (see the',
        '[Config Generator](/guide/config-generator/describe-a-scope)).',
        '',
    ];
    if (vars.length === 0) {
        lines.push('No environment-backed toolchain settings are declared.');
    } else {
        lines.push(
            '| Variable | Scope | Default | Description |',
            '| -------- | ----- | ------- | ----------- |'
        );
        for (const variable of vars) {
            lines.push(
                `| \`${variable.name}\` | ${variable.scope} | ${variable.default === undefined ? '—' : `\`${String(variable.default)}\``} | ${esc(variable.description ?? '')} |`
            );
        }
    }
    return `${lines.join('\n').trimEnd()}\n`;
}

function renderIndex(): string {
    return `---
title: Config types
outline: [2, 3]
---

# Config types

The toolchain has three configuration surfaces, all derived from the same Zod
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
\`defaultValue\`, the env fields \`envName\`, \`envPath\` and more.
`;
}

fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, 'index.md'), renderIndex(), 'utf-8');
fs.writeFileSync(
    path.join(docsDir, 'cli.md'),
    generateCliDocs(builtinCommands(), {
        intro: [
            'Generated from the same `ToolchainCommand` descriptors the `dbx` binary',
            'registers. Run `yarn config:docs` after changing a command.',
        ].join('\n'),
    }),
    'utf-8'
);
fs.writeFileSync(path.join(docsDir, 'env.md'), renderEnv(), 'utf-8');
console.log('Generated apps/docs/config/{index,cli,env}.md');
