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
flags are reachable.

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

## Providers in the editor

The VS Code extension reads `providers --json` and builds its menus from it, so
adding a provider surfaces it automatically. See
[VS Code Extension](/guide/vscode).
