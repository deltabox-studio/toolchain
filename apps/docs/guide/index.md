# Getting Started

`@deltabox/toolchain` is an all-in-one project toolchain. You drop a
`dbx.config.ts` at a repo root and the toolchain generates and manages
your configs, tsconfigs, changelogs, CI and more — from the CLI, the programmatic
API and the VS Code extension.

## Install

```bash
# as a dev dependency in the project you want to manage
yarn add -D @deltabox/toolchain

# or for global usage
npm install -g @deltabox/toolchain
```

The published package exposes one binary, `dbx`:

```bash
yarn dbx --help
```

## Create a config

Scaffold a config for a project that does not have one yet:

```bash
dbx project:config        # detect + write dbx.config.ts
```

Or start from a template:

```bash
dbx template:list
dbx create --template project --name my-app --out ./my-app
```

## Sync

`sync` runs every enabled task and writes the managed files (adding a manifest at
`.dbx/toolchain/manifest.json`):

```bash
dbx sync              # write managed files
dbx sync --check      # CI: fail if files are out of date
dbx sync --recursive  # every discovered project, in dependency order
dbx watch             # re-sync on change
```

## What gets managed

| Area                                                                | Section in the config |
| ------------------------------------------------------------------- | --------------------- |
| GitHub workflows, commitlint, Conventional-Commits VS Code settings | `changelog`           |
| `biome.json` (Biome consumers)                                      | `biome`               |
| Workspace `tsconfig.json` files (aliases + references)              | `tsconfig`            |
| `vite.config.ts` (Vite+ consumers)                                  | `vite`                |
| Template sources / scaffolding                                      | `templates`           |
| Watch behaviour                                                     | `watch`               |

Every section is **opt-in by presence**: define it to enable it, omit it to leave
that area untouched.

## Next

- [Monorepo guide](/guide/monorepo)
- [CLI reference](/guide/cli)
- [Configuration reference](/config/reference)
- [Config generator](/guide/config-generator)
- [Providers (Vite+)](/guide/providers)
- [Templates](/guide/templates)
- [Migrations](/guide/migrations)
- [Programmatic API](/guide/api)
