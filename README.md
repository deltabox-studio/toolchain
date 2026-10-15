# deltabox toolchain

> All-in-one, config-driven dev toolchain: scaffold projects, generate and manage
> configs, tsconfigs, changelogs and CI, run Vite+, and migrate other tools onto Ox.

[![license: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](./package.json)
[![node](https://img.shields.io/badge/node-%3E%3D22.5.0-brightgreen.svg)](./package.json)
[![yarn](https://img.shields.io/badge/yarn-4.17.1-2188b6.svg)](./package.json)
[![package](https://img.shields.io/badge/npm-@deltabox%2Ftoolchain-cb3837.svg)](https://www.npmjs.com/package/@deltabox/toolchain)

`@deltabox/toolchain` is driven by a single `dbx.config.ts` at a repo
root. Define the sections you want and the toolchain generates and keeps the
matching files in sync — from a CLI, a programmatic API, and a VS Code extension.

## Features

- **Config-driven.** Every area is an opt-in section in `dbx.config.ts`
  (`project`, `changelog`, `biome`, `tsconfig`, `templates`, `vite`, `watch`,
  `hooks`). Define a section to enable it; omit it and nothing is touched.
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
See the [configuration reference](https://github.com/deltabox-studio/toolchain/blob/main/apps/docs/config/reference.md).

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

## Packages

The root package re-exports every workspace below, and each is also importable
via a subpath (`@deltabox/toolchain/tsconfig`, `…/vite`, `…/migrate`, …).

| Package                         | Responsibility                                            |
| ------------------------------- | --------------------------------------------------------- |
| `@deltabox/toolchain-shared`    | Config model, template engine, provider model, run/spawn. |
| `@deltabox/toolchain-core`      | Config loader, project graph, sync engine, manifest.      |
| `@deltabox/toolchain-project`   | Scaffold generators (single / monorepo / workspace).      |
| `@deltabox/toolchain-tsconfig`  | TypeScript config templates + tsconfig generator.         |
| `@deltabox/toolchain-changelog` | Workflows, commitlint, changelog pipeline.                |
| `@deltabox/toolchain-biome`     | `biome.json` generation + VS Code settings.               |
| `@deltabox/toolchain-tsdown`    | tsdown base config + cleanup.                             |
| `@deltabox/toolchain-config`    | Generic Zod/env config engine.                            |
| `@deltabox/toolchain-vite`      | Vite+ provider (`vp` wrapper).                            |
| `@deltabox/toolchain-template`  | Template registry/scaffolder.                             |
| `@deltabox/toolchain-migrate`   | Biome/Prettier/ESLint/Dprint → Ox migrations.             |
| `toolchain-vscode`              | VS Code extension (`deltabox-toolchain.vsix`).            |

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

The VitePress site (`apps/docs`) covers the [Getting
Started](https://github.com/deltabox-studio/toolchain/blob/main/apps/docs/guide/index.md),
[Monorepo](https://github.com/deltabox-studio/toolchain/blob/main/apps/docs/guide/monorepo.md),
[CLI](https://github.com/deltabox-studio/toolchain/blob/main/apps/docs/guide/cli.md),
[Providers](https://github.com/deltabox-studio/toolchain/blob/main/apps/docs/guide/providers.md),
[Templates](https://github.com/deltabox-studio/toolchain/blob/main/apps/docs/guide/templates.md),
[Migrations](https://github.com/deltabox-studio/toolchain/blob/main/apps/docs/guide/migrations.md)
and the [config reference](https://github.com/deltabox-studio/toolchain/blob/main/apps/docs/config/reference.md).

## License

[MPL-2.0](./package.json) © Victor Sango
