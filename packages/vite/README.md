# vite-plugin-dbx

Run **deltabox toolchain** — a superset of [Vite+](https://viteplus.dev) with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension — from inside the Vite / Vite+ pipeline. Use it as a plugin, or use the `dbx` CLI standalone.

The plugin carries the whole toolchain config inline, so a Vite project does not
need a `dbx.config.*` at all, and it can run `dbx sync` before dev/build or
`dbx sync --check` in CI.

> `vite-plugin-dbx` is not published yet. Import the plugin from
> `@deltabox/toolchain/vite` until it ships.

```ts
// vite.config.ts
import { defineConfig } from 'vite-plus';

import { dbx, DBX_TASKS } from '@deltabox/toolchain/vite';

export default defineConfig({
    plugins: [
        dbx({
            toolchain: {
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
- Derives Vite options from the dbx sections:
    - `logger` → `logLevel` / `customLogger`
    - `watch` → `server.watch`
    - `fmt` / `lint` → the Vite+ formatter/linter (only when `vite-plus` is
      declared)
- Runs `dbx sync` before the dev server / build, or `dbx sync --check` when
  `CI` is set.
- Re-syncs when a dbx input file changes in watch mode.
- Exposes `DBX_TASKS` (`dbx:sync`, `dbx:check`) so the toolchain's sync/check commands are available as Vite tasks.

## Options

| Option      | Type                 | Default            | Description                                           |
| ----------- | -------------------- | ------------------ | ----------------------------------------------------- |
| `cwd`       | `string`             | the Vite root      | Project root.                                         |
| `toolchain` | `DbxPluginToolchain` | `{}`               | Inline toolchain config (no `vite` section).          |
| `sync`      | `boolean`            | `true`             | Run `dbx sync` before dev/build.                      |
| `check`     | `boolean`            | true when `CI` set | Run `dbx sync --check` and fail when files are stale. |
| `watch`     | `boolean`            | `true`             | Re-sync on dbx input changes.                         |
| `debounce`  | `number`             | `150`              | Debounce (ms) for watch-triggered syncs.              |

## License

MPL-2.0 © deltabox
