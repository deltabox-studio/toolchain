# CLI

The `dbx` binary is composed from framework-agnostic command
descriptors. Commands that run against a project load its
`dbx.config.ts` first, so config-derived defaults apply unless you
override them on the command line.

## Global flags

| Flag                | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| `--log-level <lvl>` | Minimum log level: `debug`, `info`, `warn`, `error`, `silent`. |
| `--color`           | Force coloured output (the default).                           |
| `--no-color`        | Disable coloured output.                                       |
| `--no-update-check` | Do not check for a newer `dbx` version.                        |

These override the [`logger` config](/guide/config#logging) and may appear
before or after the subcommand.

`dbx` checks the npm registry in the background (about once a day) and prints a
short notice with a link to the release when a newer version is published. The
check is skipped in CI and when `NO_UPDATE_NOTIFIER` or `DBX_NO_UPDATE_CHECK` is
set, and can be turned off with `--no-update-check`.

## Output

Colour is on by default and follows `--no-color` / the [`logger` config](/guide/config#logging).

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
| `project:init`           | A single-package TypeScript project (`--package-manager`).                      |
| `project:init:monorepo`  | A monorepo root (add `--example` for one example workspace).                    |
| `project:init:workspace` | A workspace package into an existing monorepo root.                             |
| `project:config`         | Generate `dbx.config.ts` for projects missing one.                              |
| `create`                 | Scaffold from a template (`--template`/`--kind`, `--name`, `--scope`, `--out`). |

Templates that declare inputs/actions are prompted for them (`--var key=value`,
`--action <id>`), see [Templates](/guide/templates).

On an interactive terminal, a bare `dbx create` (no `--template`/`--kind`/`--name`)
prompts for the template, name and scope with clack; Ctrl-C cancels. See
[Templates](/guide/templates).

## Templates

| Command             | Description                                                                          |
| ------------------- | ------------------------------------------------------------------------------------ |
| `template:list`     | List templates (`--kind`, `--registry`, `--online`, `--json`).                       |
| `template:init`     | Write a `template.json` to a directory (`--kind`, `--name`, `--add`, `--no-global`). |
| `template:add`      | Record a source (auto-inits local; `--no-global` keeps it project-only).             |
| `template:remove`   | Remove a source by id or `type:locate`.                                              |
| `template:registry` | List/add/remove the global template search paths (`--vscode-dir`, `--clear`).        |
| `template:info`     | Show one template.                                                                   |

See [Templates](/guide/templates).

## Migrations

```sh
dbx migrate --from biome --write           # .oxfmtrc.json + .oxlintrc.json
dbx migrate --from biome --target vite --write
dbx migrate --from all                     # every detected source
dbx migrate --from vite --recursive --write  # migrate every detected project
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

Every provider subcommand is a passthrough. Vite+ commands are reachable both
directly and through the `vite` namespace:

```sh
dbx fmt                 # a bare Vite+ command forwards to `vp fmt`
dbx run -r build        # forwards to `vp run -r build`
dbx vite dev            # explicit namespace (always works)
dbx vite:build          # named alias for `vp build`
```

A bare `dbx <command>` is forwarded to Vite+ when the name (or a Vite+ alias)
matches — built-in commands win, so `dbx migrate` stays the toolchain's
migration. The `vite` command forwards its operands verbatim, so **every** Vite+
CLI command and flag is reachable.

## Programmatic

The CLI is assembled from framework-agnostic command descriptors, so a consumer
can build its own program (or reuse the routing helpers):

```ts
import {
    createCli,
    runCli,
    builtinCommands,
    registerToolchainCommands,
    withDefaultVite,
    extractLogOptions,
} from '@deltabox/toolchain/cli';
```

| Export                                         | Description                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| `createCli()`                                  | Build the `dbx` commander program (global flags + built-in commands).  |
| `runCli(argv?)`                                | Parse and run the CLI (extracts logger flags, then defaults Vite+).    |
| `builtinCommands()`                            | The commands built into the root CLI (config commands need an engine). |
| `registerToolchainCommands(program, commands)` | Wire `ToolchainCommand[]` descriptors onto a commander program.        |
| `withDefaultVite(argv, commandNames?)`         | Insert `vite` before a bare Vite+ command (built-ins win).             |
| `extractLogOptions(argv)`                      | Pull `--log-level` / `--color` / `--no-color` out of argv.             |

`extractLogOptions` makes the logger flags work before _or_ after the
subcommand and stops at `--`, so a wrapped binary's own flags are never eaten.
`withDefaultVite` powers the bare-command passthrough described above:

```ts
extractLogOptions(['node', 'dbx', 'sync', '--no-color']);
// { argv: ['node', 'dbx', 'sync'], options: { color: false } }

withDefaultVite(['node', 'dbx', 'fmt', '--check']);
// ['node', 'dbx', 'vite', 'fmt', '--check']
```

## Config generator

The generic Zod/env config engine is not a `dbx` command: a consumer
builds an engine with `createConfigEngine` and registers the `config:*` commands
on its **own** CLI. See [Config Generator](/guide/config-generator).
