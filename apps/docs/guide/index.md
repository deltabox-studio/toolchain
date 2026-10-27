<div align="center">
  <img src="/logo/outline_colored.png" width="150" />
</div>

# Getting Started

`@deltabox/toolchain` is an all-in-one project toolchain. You drop a
`dbx.config.ts` at a repo root and the toolchain generates and manages
your configs, tsconfigs, changelogs, CI and more — from the CLI, the programmatic
API and the VS Code extension.

## Install

::: code-group

```sh [npm]
# as a dev dependency in the project you want to manage
npm install @deltabox/toolchain --save-dev
```

```sh [yarn]
# as a dev dependency in the project you want to manage
yarn add -D @deltabox/toolchain
```

```sh [pnpm]
# as a dev dependency in the project you want to manage
pnpm add -D @deltabox/toolchain
```

```sh [bun]
# as a dev dependency in the project you want to manage
bun add -D @deltabox/toolchain
```

:::

```sh
# or for global usage
npm install -g @deltabox/toolchain
```

The published package exposes one binary, `dbx`:

```sh
dbx --help
```

## Create a config

Scaffold a config for a project that does not have one yet:

```sh
dbx project:config        # detect + write dbx.config.ts
```

Or start from a template:

```sh
dbx template:list
dbx create --template project --name my-app --out ./my-app
```

## Sync

`sync` runs every enabled task and writes the managed files (adding a manifest at
`.dbx/toolchain/manifest.json`):

```sh
dbx sync              # write managed files
dbx sync --check      # CI: fail if files are out of date
dbx sync --recursive  # every discovered project, in dependency order
dbx watch             # re-sync on change
```

The generated state lives under `.dbx/`. Add it to `.gitignore`, keeping only
the manifest (it holds no absolute paths):

```gitignore
.dbx/*
!.dbx/toolchain
.dbx/toolchain/*
!.dbx/toolchain/manifest.json
```

`dbx sync` adds this block to an existing `.gitignore` automatically, so you only
need to add it by hand when the repo has no `.gitignore` yet.

## What gets managed

| Area                                                                | Section in the config |
| ------------------------------------------------------------------- | --------------------- |
| GitHub workflows, commitlint, Conventional-Commits VS Code settings | `ci`                  |
| `biome.json` (Biome consumers)                                      | `biome`               |
| Workspace `tsconfig.json` files (aliases + references)              | `tsconfig`            |
| `vite.config.ts` (Vite+ consumers)                                  | `vite`                |
| Template sources / scaffolding                                      | `templates`           |
| Package catalogs (`.yarnrc.yml` / `pnpm-workspace.yaml`)            | `catalogs`            |
| Watch behaviour                                                     | `watch`               |

Every section is **opt-in by presence**: define it to enable it, omit it to leave
that area untouched.

## Next

- [Monorepo guide](/guide/monorepo)
- [CLI reference](/guide/cli)
- [Configuration reference](/config/reference)
- [Project](/guide/project)
- [Changelog](/guide/changelog/)
- [tsconfig](/guide/tsconfig)
- [Biome](/guide/biome)
- [Vite+](/guide/vite)
- [Watch](/guide/watch)
- [Logger](/guide/logger)
- [Config generator](/guide/config-generator/)
- [Providers (Vite+)](/guide/providers)
- [Package scripts](/guide/scripts)
- [Templates](/guide/templates)
- [Migrations](/guide/migrations)
- [Programmatic API](/guide/api/)
- [LLMs](/llms)
