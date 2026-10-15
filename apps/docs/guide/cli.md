# CLI

The `dbx` binary is composed from framework-agnostic command
descriptors. Commands that run against a project load its
`dbx.config.ts` first, so config-derived defaults apply unless you
override them on the command line.

## Core

| Command     | Description                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| `projects`  | Discover projects and write `.dbx/toolchain/projects.json`.                      |
| `sync`      | Regenerate every managed file (`--check`, `--recursive`, `--watch`, `--force`).  |
| `watch`     | Sync once, then watch key inputs and re-sync.                                    |
| `reset`     | Remove generated files, the manifest and/or the config (`--all`, `--recursive`). |
| `providers` | List registered providers + their commands (`--json`).                           |

## Scaffolding

| Command                  | Description                                                                     |
| ------------------------ | ------------------------------------------------------------------------------- |
| `project:init`           | A single-package TypeScript project.                                            |
| `project:init:monorepo`  | A monorepo root + one example workspace.                                        |
| `project:init:workspace` | A workspace package into an existing monorepo root.                             |
| `project:config`         | Generate `dbx.config.ts` for projects missing one.                              |
| `create`                 | Scaffold from a template (`--template`/`--kind`, `--name`, `--scope`, `--out`). |

## Templates

| Command           | Description                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| `template:list`   | List templates (`--kind`, `--registry`, `--online`, `--json`).         |
| `template:init`   | Write a `template.json` to a directory (`--kind`, `--name`, `--add`).  |
| `template:add`    | Record a source in `.dbx/toolchain/templates.json` (auto-inits local). |
| `template:remove` | Remove a source by id or `type:locate`.                                |
| `template:info`   | Show one template.                                                     |

See [Templates](/guide/templates).

## Migrations

```bash
dbx migrate --from biome --write           # .oxfmtrc.json + .oxlintrc.json
dbx migrate --from biome --target vite --write
dbx migrate --from all                     # every detected source
dbx migrate --check                        # CI: exit 1 when stale
dbx migrate:list
```

See [Migrations](/guide/migrations).

## Tsconfig / cleanup / changelog / workflows

| Command                     | Description                                               |
| --------------------------- | --------------------------------------------------------- |
| `tsconfig`                  | Regenerate workspace `tsconfig.json` files.               |
| `cleanup` / `cleanup:turbo` | Remove build artifacts / the turbo cache.                 |
| `changelog`                 | Derive the semver bump and update CHANGELOG + versions.   |
| `workflow`                  | Trigger generated GitHub workflows via `gh workflow run`. |

## Providers

Every provider subcommand is a passthrough. For Vite+:

```bash
dbx vite dev            # forwards to `vp dev`
dbx vite add zod        # forwards to `vp add zod`
dbx vite:build          # named alias for `vp build`
```

The generic `vite` command forwards its operands verbatim to `vp`, so **every**
Vite+ CLI command and flag is reachable.

## Config generator

The generic Zod/env config engine is not a `dbx` command: a consumer
builds an engine with `createConfigEngine` and registers the `config:*` commands
on its **own** CLI. See [Config Generator](/guide/config-generator).
