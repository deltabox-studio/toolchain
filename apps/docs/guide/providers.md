# Providers

A **provider** is an external toolchain exposed through `dbx`: its CLI,
the programmatic API and the VS Code extension. Providers contribute namespaced
commands and a descriptor the editor reads over `dbx providers --json`.

## List providers

```sh
dbx providers          # table
dbx providers --json   # descriptor (id, binary, commands, actions)
```

## Vite+ (`vite-plus`)

The bundled provider wraps the `vp` binary — the unified Vite / Vitest / Oxlint /
Oxfmt / Rolldown / tsdown toolchain.

### Resolution

`dbx vite:*` resolves `vp` in this order:

1. the project-local shim (`node_modules/.bin/vp`),
2. a global `vp` on `PATH`,
3. `npx --yes vite-plus`.

### Generic passthrough

```sh
dbx vite dev
dbx vite build
dbx vite add zod
dbx vite check
```

Everything after `vite` is forwarded verbatim to `vp`, so all Vite+ commands and
flags are reachable. A bare `dbx <command>` whose name is a Vite+ command (or a
Vite+ alias) is forwarded too, so `dbx fmt` / `dbx run -r build` need no `vite`
namespace — built-in commands win (`dbx migrate` stays the toolchain's).

### Colour

Provider output keeps `vp`'s own colours, but follows the logger's colour state.
The global `--no-color` flag turns provider colour off, and the `providers`
section can opt out on its own even on a colour terminal:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        providers: { color: false },
    },
});
```

When colour is off, `dbx` runs `vp` with `NO_COLOR=1` and `FORCE_COLOR=0` so the
wrapped process emits plain output. Leave the section unset to let `vp` detect
colour from its own terminal.

### Named commands

Every catalogued subcommand is also available as a first-class command for
discovery + the editor:

```
vite:create  vite:migrate  vite:dev  vite:check  vite:lint  vite:fmt  vite:test
vite:build   vite:pack     vite:run  vite:add    vite:remove vite:update ...
vite:toolchain vite:upgrade vite:implode
```

### Programmatic

```ts
import {
    resolveVp,
    runVp,
    hasVp,
    vpVersion,
    describeVp,
    resolveVpCommand,
    viteCommandName,
    VP_COMMANDS,
} from '@deltabox/toolchain/vite';

if (hasVp(process.cwd())) {
    await runVp(['check'], { cwd: process.cwd() });
}
```

| Export                                 | Description                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `resolveVp(cwd?)`                      | Resolve the `vp` invocation (`{ exe, args, source }`).                      |
| `hasVp(cwd?)`                          | Whether a local/global `vp` is available (no `npx` fallback).               |
| `runVp(args, options?)`                | Run `vp`, streaming output or `mode: 'capture'`; never exits the host.      |
| `vpVersion(cwd?)` / `describeVp(cwd?)` | The `vp --version` output / a one-line resolution description.              |
| `which(bin)`                           | Find an executable on `PATH` (resolves `PATHEXT` on Windows).               |
| `resolveVpCommand(name)`               | Resolve a subcommand **or alias** to its canonical name (`i` -> `install`). |
| `viteCommandName(name)`                | The `dbx` command name for a `vp` subcommand (`dev` -> `vite:dev`).         |
| `VP_COMMANDS`                          | The `vp` command catalog that drives the CLI + the provider descriptor.     |

```ts
// A bare `dbx <command>` falls through to `vite` when it names a Vite+ command.
resolveVpCommand('fmt'); // 'fmt'
viteCommandName('fmt'); // 'vite:fmt'
```

### Use dbx from Vite+

Vite+ consumers can drive dbx from `vite.config.ts`, so a Vite+-only project
still gets dbx's generated/managed files:

```ts [vite.config.ts]
import { defineConfig } from 'vite-plus';

import { dbx, DBX_TASKS } from '@deltabox/toolchain/vite';

export default defineConfig({
    plugins: [dbx()],
    run: { tasks: { ...DBX_TASKS } },
    // your usual Vite / Vite+ config
});
```

- The `dbx()` plugin runs `dbx sync` before the dev server / build, or
  `dbx sync --check` in CI (which fails the build when generated files are out of
  date), and re-syncs when a `dbx.config.*` / `tsconfig.*.json` input changes.
- The plugin resolves the `dbx` binary from the project first: the local
  `node_modules/.bin/dbx`, then the project's own `@deltabox/toolchain` bin. A
  global `dbx` on `PATH` is used **only when the project doesn't pin the
  toolchain at all** — otherwise it's skipped (with a warning) in favour of
  `npx @deltabox/toolchain@<pinned>`. That way a stale global install can never
  run and silently revert the project's generated files.
- `run: { tasks: { ...DBX_TASKS } }` also exposes `vp run dbx:sync` /
  `vp run dbx:check`. Vite+ reads `run.tasks` from the **static** config (a
  plugin's `config` hook is ignored), so the tasks are spread in the config
  rather than added by the plugin. Drop the `run` block if you don't want them.
- Because Vite Task runs a task's `command` through a shell, `DBX_TASKS` bakes in
  the binary resolved by `resolveDbx` (the project's own, or the pinned `npx`
  fallback) rather than relying on `dbx` being on `PATH` — a missing environment
  then warns instead of silently running the wrong binary. Use `dbxTaskCommand(sub)`
  to build a task command for another subcommand.

## Custom providers

Providers are loaded from **search paths** (JSON files, directories of
`*.json`, or `http(s)` registry URLs). A JSON file can be an array of provider
descriptors or `{ "providers": [...] }`.

Project paths (first wins on an id clash):

- `.dbx/toolchain/.registry/providers` — the implicit default directory;
- `.dbx/toolchain/registries.json` — its `providers` array;
- `.dbx/toolchain/providers.json` — the legacy file, still read.

Global paths:

- `~/.dbx/toolchain/.registry/providers` — the default directory;
- `~/.dbx/toolchain/cli/config.json` — `providerRegistrySearchPaths`, or
  `registrySearchPaths.providers`;
- the VS Code `deltabox.providerRegistrySearchPaths` setting (kept in sync).

`toolchainProviders()` merges every local registry with the built-ins (a project
provider wins on an id clash), so a custom provider's commands become `dbx`
commands — `dbx <command.name>` forwards to `<binary> <subcommand> ...` — and it
shows up in `dbx providers` and the editor. Remote registries are fetched by
`dbx providers --json`/`loadToolchainProviders()`. Restrict them with
`toolchain.registry.providers` (`allow`/`deny` host + path globs); the same
policy applies to local registry paths:

```json [.dbx/toolchain/.registry/providers/providers.json]
[
    {
        "id": "echo",
        "name": "Echo",
        "binary": "node",
        "commands": [
            {
                "name": "echo:version",
                "subcommand": "--version",
                "description": "Print the Node version"
            }
        ]
    }
]
```

```sh
dbx registry --json                                  # list template + provider paths
dbx registry --kind providers --scope project --add ./providers
dbx registry --kind providers --scope global --add https://example.com/providers.json
```

The VS Code **Providers** view manages the registry items (**Add provider...** /
**Remove provider**), and the **Registries** view shows the provider search
paths. See [VS Code Extension](/guide/vscode).

## Providers in the editor

The VS Code extension reads `providers --json` and builds its **Providers** view
and menus from it, so adding a provider surfaces it automatically. See
[VS Code Extension](/guide/vscode).
