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
import { resolveVp, runVp, hasVp } from '@deltabox/toolchain/vite';

if (hasVp(process.cwd())) {
    await runVp(['check'], { cwd: process.cwd() });
}
```

### Use dbx from Vite+

Vite+ consumers can drive dbx from `vite.config.ts`, so a Vite+-only project
still gets dbx's generated/managed files:

```ts
// vite.config.ts
import { defineConfig } from 'vite-plus';

import { defineDbxConfig } from '@deltabox/toolchain/vite';

export default defineConfig(
    defineDbxConfig({
        // your usual Vite / Vite+ config
    })
);
```

- The `dbx()` plugin runs `dbx sync` before the dev server / build, or
  `dbx sync --check` in CI (which fails the build when generated files are out of
  date), and re-syncs when a `dbx.config.*` / `tsconfig.*.json` input changes.
- `defineDbxConfig` also registers `vp run dbx:sync` / `vp run dbx:check`. Vite+
  reads `run.tasks` from the **static** config (a plugin's `config` hook is
  ignored), which is why the wrapper — not the plugin — adds them.

Prefer the bare plugin when you don't want the tasks:

```ts
import { dbx } from '@deltabox/toolchain/vite';

export default defineConfig({ plugins: [dbx({ check: true })] });
```

## Providers in the editor

The VS Code extension reads `providers --json` and builds its menus from it, so
adding a provider surfaces it automatically. See
[VS Code Extension](/guide/vscode).
