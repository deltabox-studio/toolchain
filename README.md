# deltabox toolchain

> All-in-one, config-driven dev toolchain: scaffold projects, generate and manage
> configs, tsconfigs, changelogs and CI, run Vite+, and migrate other tools onto Ox.

[![license: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](./package.json)
[![node](https://img.shields.io/badge/node-%3E%3D22.5.0-brightgreen.svg)](./package.json)
[![yarn](https://img.shields.io/badge/yarn-4.17.1-2188b6.svg)](./package.json)
[![package](https://img.shields.io/badge/npm-@deltabox%2Ftoolchain-cb3837.svg)](https://www.npmjs.com/package/@deltabox/toolchain)
[![tests](https://img.shields.io/github/actions/workflow/status/deltabox-studio/toolchain/ci.yml?label=tests&logo=github)](https://github.com/deltabox-studio/toolchain/actions/workflows/ci.yml)

`@deltabox/toolchain` is driven by a single `dbx.config.ts` at a repo
root. Define the sections you want and the toolchain generates and keeps the
matching files in sync — from a CLI, a programmatic API, and a VS Code extension.

See [CHANGELOG.md](/CHANGELOG.md) for latest updates.

**Documentation, guides and examples:** [toolchain.deltabox.studio](https://toolchain.deltabox.studio).

## Table of contents

- [deltabox toolchain](#deltabox-toolchain)
    - [Table of contents](#table-of-contents)
    - [Features](#features)
    - [Install](#install)
    - [Quickstart](#quickstart)
    - [Config generator](#config-generator)
    - [CLI](#cli)
    - [Programmatic API](#programmatic-api)
    - [VS Code extension](#vs-code-extension)
    - [Development](#development)
    - [Docs](#docs)
    - [License](#license)

## Features

- **Config-driven.** Every area is an opt-in section in `dbx.config.ts`
  (`project`, `changelog`, `biome`, `tsconfig`, `templates`, `vite`, `watch`,
  `hooks`). Define a section to enable it; omit it and nothing is touched.
- **Config generator.** A generic Zod/env engine (`createConfigEngine`) turns
  your schemas into a `.env.example`, a JSON Schema, a markdown reference, TS
  types and CLI flags, and wires `config:*` commands into your own CLI. See the
  [config generator guide](https://toolchain.deltabox.studio/guide/config-generator).
- **Changelogs & releases.** Conventional-Commits commitlint, a changelog
  pipeline that bumps versions and writes `CHANGELOG.md`, plus GitHub workflows
  for CI, changelog, release and issues.
- **tsconfig generation.** Workspace `tsconfig.json` files with path aliases and
  project references, driven from one config.
- **Providers.** Wire external toolchains behind one CLI. Vite+ ships as a
  provider, so every `vp` command is reachable as `dbx vite:*`.
- **Templates.** Offline (builtin + local `template.json` dirs) and online
  (npm/git/Vite+) templates, creatable from the CLI or the extension.
- **Migrations.** Move Biome, Prettier, ESLint or Dprint onto Ox
  (Oxfmt/Oxlint) with a pluggable migration engine (`--target files` or `vite`).
- **Editor first.** A VS Code extension to sync, scaffold, run workflows, run
  Vite+ commands and pick templates.
- **Monorepo aware.** Project graph, workspace tsconfigs, dependency-ordered
  tasks via `vp run`, and per-workspace files.

## Install

```bash
# as a dev dependency in the project you want to manage
yarn add -D @deltabox/toolchain

# or for global usage
npm install -g @deltabox/toolchain
```

The package exposes one binary, `dbx`:

```bash
yarn dbx --help
```

## Quickstart

```bash
# 1. Write a dbx.config.ts for the current project
dbx project:config

# 2. Generate / refresh every managed file (adds .dbx/toolchain/manifest.json)
dbx sync

# 3. Verify in CI — fails when files are out of date
dbx sync --check
```

A minimal config:

```ts
import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: { type: 'monorepo-root', name: 'acme', scope: '@acme' },
        changelog: { workflows: { ci: true, release: true } },
        tsconfig: { refs: true },
        biome: true,
        vite: { defaultTemplate: '@acme' },
    },
});
```

The `@deltabox/toolchain` settings live under the `toolchain` key. Every section
there is **opt-in by presence**: `section: true` enables it with defaults,
`section: false` disables it, and `section: { ... }` configures it.
See the [configuration reference](https://toolchain.deltabox.studio/config/reference).

## Config generator

The same Zod-first approach powers a standalone config engine. Describe your
config once and generate `.env.example`, a JSON Schema, a markdown reference, TS
types and CLI flags from it — no hand-maintained docs to drift:

```ts
import { z } from 'zod';

import { createConfigEngine } from '@deltabox/toolchain/config';

export const engine = createConfigEngine({
    scopes: {
        server: {
            zodSchema: z.object({
                port: z.number().default(3000).meta({ env: 'MYAPP_PORT' }),
            }),
        },
    },
    envPrefix: 'MYAPP_',
    baseGroup: 'base',
    root: process.cwd(),
});

await engine.writeJsonSchema({ output: 'config.schema.json' });
engine.writeEnvFile({ output: '.env.example' });
engine.writeMarkdown({ outDir: 'docs/reference/configuration' });
```

`configCommands({ engine })` also exposes the same generators as `config:*`
commands on your own CLI. See the [config generator
guide](https://toolchain.deltabox.studio/guide/config-generator).

## CLI

| Command                                           | Description                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `projects`                                        | Discover projects and write `.dbx/toolchain/projects.json`.            |
| `sync`                                            | Regenerate managed files (`--check`, `--recursive`, `--watch`).        |
| `watch`                                           | Sync once, then re-sync on change.                                     |
| `reset`                                           | Remove generated files, the manifest and/or the config.                |
| `project:init` / `:monorepo` / `:workspace`       | Scaffold a project, a monorepo root, or a workspace.                   |
| `project:config`                                  | Generate `dbx.config.ts` for projects missing one.                     |
| `create`                                          | Scaffold from a template (`--template`, `--name`, `--scope`, `--out`). |
| `template:list` / `:add` / `:info`                | Inspect and record template sources.                                   |
| `providers`                                       | List registered providers and their commands (`--json`).               |
| `vite <args…>` / `vite:<sub>`                     | Passthrough to the Vite+ `vp` binary.                                  |
| `migrate` / `migrate:list`                        | Convert Biome/Prettier/ESLint/Dprint onto Ox.                          |
| `tsconfig` / `changelog` / `workflow` / `cleanup` | tsconfigs, changelog + versions, GitHub workflows, artifacts.          |

Commands that run against a project load its `dbx.config.ts` first, so
config-derived defaults apply unless overridden on the command line.

## Programmatic API

```ts
import { defineConfig, loadToolingConfig, runSync, defaultSyncTasks } from '@deltabox/toolchain';

const { config, tokens, projectType } = await loadToolingConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```

## VS Code extension

Install `packages/vscode/deltabox-toolchain.vsix`, then use the **deltabox
toolchain** activity bar: Sync / Check sync / Scaffold project, **From
template…**, **Run Vite+ command…** and **Create Vite+ project…**. See
[`packages/vscode/README.md`](./packages/vscode/README.md).

## Development

This repo is a Yarn 4 workspace; Vite+ (`vp`) drives format, lint, test and the
task runner from the root `vite.config.ts`.

```bash
yarn install        # fresh checkout
yarn build          # packages via `vp run` + root tsdown
yarn test           # package + root tests
yarn typecheck      # packages + root
yarn check          # Oxfmt + Oxlint (format + lint)
yarn format         # `vp fmt`
yarn lint           # `vp lint --fix`
```

> `vp` resolves only at the repo root, so run these from the root. Package
> typechecks/tests resolve workspace deps from their built `dist`, so run a full
> `yarn build` after changing a package's public exports.

Docs live in `apps/docs` (VitePress): `yarn workspace @deltabox/toolchain-docs build`.

## Docs

Full documentation, guides and examples live at [toolchain.deltabox.studio](https://toolchain.deltabox.studio).

The source pages live in `apps/docs`.

## License

[MPL-2.0](./LICENSE) © deltabox
