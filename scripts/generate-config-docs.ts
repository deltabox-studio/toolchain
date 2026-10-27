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

import { collectEnvVars } from '@deltabox/toolchain-config';
import type { ToolchainCommand } from '@deltabox/toolchain-shared';
import { toolchainConfigSchema } from '@deltabox/toolchain-shared';

import { changelogCommands } from '../packages/changelog/src/cli/index.js';
import { migrateCommands } from '../packages/migrate/src/cli/index.js';
import { projectCommands } from '../packages/project/src/cli/index.js';
import { templateCommands } from '../packages/template/src/cli/index.js';
import { tsconfigCommands } from '../packages/tsconfig/src/cli/index.js';
import { cleanupCommands } from '../packages/tsdown/src/cli/index.js';
import { viteCommands } from '../packages/vite/src/cli/index.js';
import { projectsCommand } from '../src/cli/commands/projects.js';
import { providerCommands } from '../src/cli/commands/providers.js';
import { resetCommand } from '../src/cli/commands/reset.js';
import { syncCommand } from '../src/cli/commands/sync.js';
import { watchCommand } from '../src/cli/commands/watch.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const docsDir = path.join(root, 'apps', 'docs', 'config');

/** Escape raw `<`/`>` so Vue does not parse option placeholders as tags. */
function esc(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Use typographic angles inside code spans (entities render literally there). */
function code(value: string): string {
    return value.replace(/</g, '‹').replace(/>/g, '›');
}

function commands(): ToolchainCommand[] {
    const all = [
        projectsCommand(),
        syncCommand(),
        watchCommand(),
        resetCommand(),
        ...providerCommands().filter(command => command.name === 'providers'),
        ...tsconfigCommands(),
        ...cleanupCommands(),
        ...changelogCommands(),
        ...migrateCommands(),
        ...projectCommands(),
        ...templateCommands(),
        ...viteCommands(),
    ];
    const seen = new Set<string>();
    return all.filter(command => {
        if (seen.has(command.name)) return false;
        seen.add(command.name);
        return true;
    });
}

function renderCli(): string {
    const lines = [
        '---',
        'title: CLI reference',
        'outline: [2, 3]',
        '---',
        '',
        '# CLI reference',
        '',
        'Generated from the same `ToolchainCommand` descriptors the `dbx` binary',
        'registers. Run `yarn config:docs` after changing a command.',
        '',
        '| Command | Description |',
        '| ------- | ----------- |',
    ];
    const all = commands();
    for (const command of all) {
        lines.push(
            `| [\`dbx ${command.name}\`](#${command.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}) | ${esc(command.description)} |`
        );
    }
    for (const command of all) {
        lines.push('', `## \`dbx ${command.name}\``, '', esc(command.description));
        for (const arg of command.args ?? []) {
            const label = arg.required === false ? `[${arg.name}]` : `<${arg.name}>`;
            lines.push(`- \`${code(label)}\` — ${esc(arg.description)}`);
        }
        for (const option of command.options ?? []) {
            const fallback =
                option.default !== undefined ? ` (default: \`${String(option.default)}\`)` : '';
            lines.push(`- \`${code(option.flags)}\` — ${esc(option.description)}${fallback}`);
        }
    }
    return `${lines.join('\n').trimEnd()}\n`;
}

function renderEnv(): string {
    const vars = collectEnvVars({ toolchain: { zodSchema: toolchainConfigSchema } }, 'DBX_');
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
\`defaultValue\`, plus the env fields \`env\` and \`path\`.
`;
}

fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, 'index.md'), renderIndex(), 'utf-8');
fs.writeFileSync(path.join(docsDir, 'cli.md'), renderCli(), 'utf-8');
fs.writeFileSync(path.join(docsDir, 'env.md'), renderEnv(), 'utf-8');
console.log('Generated apps/docs/config/{index,cli,env}.md');
