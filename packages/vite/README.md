# vite-plugin-dbx

This Vite plugin is a superset of [Vite+](https://viteplus.dev).

It exists to remove the glue work that appears once a project grows beyond a
single package: the same settings spread across a dozen files, generated files
that drift, and release chores that are easy to get wrong.

You describe the project once, and the toolchain keeps the rest in sync.

---

<details>
<summary><strong>Why use this?</strong></summary>

It is most useful when at least one of these is true:

- you **maintain a monorepo** or several related packages;
- you want **one place** for **toolchain, CI and release configuration**;
- you use **Vite or Vite+** and want a **consistent project workflow**;
- you define **schemas or config formats** and want **types, docs, JSON Schema
  and typed CLI options** generated from them;
- you maintain **many environment variables** and want **documented, typed
  config** with **file/env/CLI precedence**;
- you want **one consistent CLI and task surface** for scripts, tasks and
  provider toolchains;
- you build a **library or internal tool** that needs its own **typed config and
  CLI** without rebuilding loaders, validation and help;
- you work **across languages** and want Python, .NET, Java, Rust and other
  tools exposed through the **same command surface**;
- you **scaffold projects or packages** regularly;
- you work in **VS Code or with AI agents** and want them to understand the
  **same project model**;
- you are tired of **generated files and release chores drifting**.

Read the rest of [Why use this?](https://toolchain.deltabox.studio/guide/why-use-this) for the
problems it removes, the core features and when it might not fit.

---

</details>

<details>
<summary><strong>Features</strong></summary>

- Project synchronization
- Config-driven
- Config generator
- Vite / Vite+ plugin (optional)
- Changelogs & releases
- CI automation
- tsconfig management
- Providers
- Catalogs
- Templates
- Migrations
- MCP server
- VS Code extension
- Editor first
- Monorepo aware
- And more...

</details>

---

`@deltabox/toolchain` is used as a Vite plugin, but can be used standalone without Vite as a CLI or lib `@deltabox/toolchain`.

This plugin carries the whole deltabox toolchain config inline, so a Vite project does not
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
