# Vite plugin

`@deltabox/toolchain` ships the `dbx()` Vite/Vite+ plugin. It carries the whole
toolchain config inline, so a Vite project does not need a `dbx.config.*`, and it
runs `dbx sync` before dev/build (or `dbx sync --check` in CI).

> The plugin is published from the **`@deltabox/toolchain/vite`** subpath. The
> standalone `vite-plugin-dbx` package is not published yet, so import
> `@deltabox/toolchain/vite` (not `vite-plugin-dbx`) until it ships.

## Install

```sh
yarn add -D @deltabox/toolchain
```

A Vite+ project also needs `vite-plus` (which provides `vp`, Vite, Vitest, Oxfmt
and Oxlint); see [Vite+](/guide/vite).

## Use

```ts
// vite.config.ts
import { defineConfig } from 'vite-plus'; // or 'vite'

import { dbx, DBX_TASKS } from '@deltabox/toolchain/vite';

export default defineConfig({
    plugins: [
        dbx({
            toolchain: {
                project: { name: 'my-app', scope: '@acme' },
                fmt: true,
                lint: true,
                // ...any other dbx sections
            },
        }),
    ],
    run: { tasks: { ...DBX_TASKS } },
});
```

## What it does

- Loads the inline `toolchain` config (merged over a nearby `dbx.config.*` when
  one exists).
- Runs `dbx sync` before the dev server / build, or `dbx sync --check` when `CI`
  is set.
- Re-syncs when a dbx input file changes in watch mode.
- Derives Vite options from the dbx sections: `logger` → `logLevel` /
  `customLogger`, `watch` → `server.watch`, and `fmt` / `lint` → the Vite+
  formatter/linter (only when `vite-plus` is installed).
- Exposes `DBX_TASKS` (`dbx:sync`, `dbx:check`) for `run.tasks` / `vp run`.

In a **workspace**, leave `fmt` and `lint` out of the plugin config: the root
`vite.config.*` owns them and Vite+ applies the root options to the workspace.
`fmt: true` / `lint: true` there would select the shared defaults instead.

See [Vite+](/guide/vite) for the full Vite+ integration, the Vite+ provider and
the `toolchain.vite` options, and the [configuration
reference](/config/reference) for every section.
