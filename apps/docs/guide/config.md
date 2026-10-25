# Configuration

A project is driven by a single `dbx.config.ts`:

```ts [dbx.config.ts]
import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: {
            type: 'monorepo-root',
            name: 'acme',
            scope: '@acme',
        },
        changelog: {
            workflows: { ci: true, release: true },
            branches: { main: 'main', dev: 'dev' },
        },
        tsconfig: { refs: true },
        biome: true,
        vite: {
            fmt: { semi: true, singleQuote: true },
            lint: { ignorePatterns: ['dist/**'] },
            test: { include: ['src/**/*.test.ts'] },
        },
        watch: { debounce: 150 },
    },
});
```

The `@deltabox/toolchain` settings live under the `toolchain` key, so a
`dbx.config.ts` can host other dbx concerns alongside it.

Each section has its own guide: [Project](/guide/project),
[Changelog](/guide/changelog), [tsconfig](/guide/tsconfig), [Biome](/guide/biome),
[Vite+](/guide/vite), [Watch](/guide/watch), [Logger](/guide/logger) and
[Providers](/guide/providers).

## Opt-in by presence

Every section under `toolchain` is **opt-in by presence**: the toolchain only
touches an area you actually ask for.

- Omit a section — that area is left completely alone.
- `section: true` — enable it with defaults.
- `section: false` — explicitly disable it.
- `section: { ...options }` — enable and configure it.

Helpers `sectionEnabled(section)` and `sectionConfig(section)` implement this and
are exported for programmatic use.

## Nested configs

A `dbx.config.*` in a **non-root** folder (a workspace, an app, a nested
project) is merged over the nearest ancestor `dbx.config.*` found while walking
up to the repository root (the walk stops at the `.git` boundary, so it never
picks up a config from outside the repo).

The merge is recursive:

- **Objects** are merged key by key, so a child keeps every option it does not
  mention.
- **Leaves** — booleans, strings, numbers and **arrays** — in the child
  **replace** the root's value (arrays are not concatenated).

This makes a shared root config plus small per-project overrides possible:

```ts [<root>/dbx.config.ts]
export default defineConfig({
    toolchain: {
        changelog: { scopes: ['core', 'cli'], branches: { main: 'main', dev: 'dev' } },
        tsconfig: { refs: true, aliases: true },
    },
});

// <root>/packages/web/dbx.config.ts — inherits changelog + tsconfig, tweaks both
export default defineConfig({
    toolchain: {
        changelog: { scopes: ['web'] }, // replaces the root's `scopes` array
        tsconfig: { refs: false }, // boolean overrides the root's `refs`
    },
});
```

The workspace above ends up with `changelog.branches` from the root (unchanged),
`changelog.scopes: ['web']` (replaced), and `tsconfig: { refs: false, aliases: true }`.

> **`project` is inherited except its identity fields.** `name`, `scope`,
> `description` and `type` are per-project, so a non-root config keeps its own (or
> falls back to its `package.json`) and is still detected from its own files — a
> root `project` never renames a workspace. The shared fields (`author`,
> `license`, `homepage`, `repo`, `packageManager`, ...) flow down so their
> `package.json` values and replacement tokens stay shared.
> `project: { inherit: false }` disables project inheritance entirely. `hooks`
> are not inherited either — a parent's hooks are code and do not run for a
> nested project's sync.

## `defineConfig`

`defineConfig` is an identity helper that gives the file full type-checking and
autocomplete (it mirrors Vite's `defineConfig`).

## Config file names

The loader looks for, in order:

```
dbx.config.ts
dbx.config.mts
dbx.config.js
dbx.config.mjs
dbx.config.cjs
dbx.config.json
```

## Hooks

`.ts`/`.js` configs can declare lifecycle hooks (JSON cannot):

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        hooks: {
            afterLoad: ({ tokens }) => console.log(tokens),
            beforeSync: ctx => ctx.log('syncing…'),
            afterTask: ({ task, files }) => console.log(task.name, files?.length),
            afterSync: ({ result }) => console.log(result.written.length),
            onChange: ({ path }) => console.log('changed', path),
        },
    },
});
```

Return values are awaited.

## Logging

Every toolchain message goes through one logger. Configure it in the config:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        logger: { level: 'debug', color: false, name: 'dbx' },
    },
});
```

| Option  | Values                                             | Default |
| ------- | -------------------------------------------------- | ------- |
| `level` | `debug` \| `info` \| `warn` \| `error` \| `silent` | `info`  |
| `color` | `true` \| `false`                                  | `true`  |
| `name`  | prefix for non-indented lines                      | `dbx`   |

Colour is **on by default** (the toolchain forces it rather than relying on TTY
autodetection); `--no-color` or `logger: { color: false }` turn it off. Human
output is rendered with [`@clack/prompts`](https://bombshell.dev/clack) — level
symbols (`•` info, `◆` success, `▲` warn, `■` error) and a guide.

On the CLI, `--log-level <level>` and `--no-color` override the config (see the
[CLI reference](/guide/cli)). Machine output (`--json`) is written unprefixed
through the same logger.

## Providers

Provider passthrough commands (Vite+) follow the logger's colour setting. The
`providers` section can force provider colours on or off on its own:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        providers: { color: false },
    },
});
```

| Option  | Values            | Default        |
| ------- | ----------------- | -------------- |
| `color` | `true` \| `false` | inherit logger |

`color: false` runs the wrapped binary with `NO_COLOR=1` and `FORCE_COLOR=0`, so
it emits plain output even on a colour terminal. The global CLI `--no-color`
flag turns provider colour off too. See [Providers](/guide/providers#colour).

## Vite+

The whole Vite+ config lives in `toolchain.vite`. Every key is passed through
verbatim to Vite+, so `dbx.config.*` stays the only hand-authored root config:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        vite: {
            test: { include: ['src/**/*.test.ts'], environment: 'node' },
            lint: { ignorePatterns: ['dist/**'] },
            fmt: { semi: true, singleQuote: true },
        },
    },
});
```

`dbx sync` writes a thin root `vite.config.ts` that resolves that config at load
time, so the generated file never duplicates (or drifts from) `dbx.config.*`:

```ts [vite.config.ts]
import { defineConfig } from 'vite-plus';

// Generated by @deltabox/toolchain — edit the vite section in dbx.config and run `dbx sync`.
import { resolveVite } from '@deltabox/toolchain/vite';

export default defineConfig(resolveVite({ cwd: import.meta.dirname }));
```

`resolveVite(options?)` resolves the **same-directory** `dbx.config.*` (so a
nested `vite.config.ts` uses the nested config it sits next to), or the
`toolchain` you pass, then returns `toolchain.vite`. It is exported from
`@deltabox/toolchain/vite` for programmatic use too.

The single toolchain opt-out is `config`. Set `vite: { config: false }` to leave
a hand-written `vite.config.ts` alone. Everything else under `vite` is Vite+
config (plugins, `test`, `lint`, `fmt`, `run.tasks`, ...), so `toolchain.vite`
is the full Vite+ configuration. The section is typed as Vite+'s own config
(`ToolchainViteConfig` = Vite's `UserConfig` as augmented by Vite+), so the whole
Vite+ surface autocompletes in `dbx.config.ts`.

Add `/vite.config.ts` to `vite.fmt.ignorePatterns` so Oxfmt leaves the generated
shim alone — without it `vp fmt` would rewrite the shim and `dbx sync --check`
would report drift. `dbx migrate --from vite` adds it for you.

To adopt an existing hand-written `vite.config.ts`, fold it in with the
migration (see [Migrations](/guide/migrations#vite-config)):

```sh
dbx migrate --from vite --write   # folds the object into toolchain.vite (+ the fmt ignore)
dbx sync                          # writes the managed vite.config.ts shim
```

## Programmatic API

```ts
import { loadToolchainConfig, runSync, defaultSyncTasks } from '@deltabox/toolchain';

const { config, tokens, projectType } = await loadToolchainConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```

Full section reference: [dbx.config](/config/reference).
