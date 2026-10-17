# Providers

A **provider** is an external toolchain exposed through `dbx`: its CLI,
the programmatic API and the VS Code extension. Providers contribute namespaced
commands and a descriptor the editor reads over `dbx providers --json`.

## List providers

```bash
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

```bash
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

```ts
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

```ts
// vite.config.ts
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
- `run: { tasks: { ...DBX_TASKS } }` also exposes `vp run dbx:sync` /
  `vp run dbx:check`. Vite+ reads `run.tasks` from the **static** config (a
  plugin's `config` hook is ignored), so the tasks are spread in the config
  rather than added by the plugin. Drop the `run` block if you don't want them.

## Providers in the editor

The VS Code extension reads `providers --json` and builds its menus from it, so
adding a provider surfaces it automatically. See
[VS Code Extension](/guide/vscode).
