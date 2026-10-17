# Configuration

A project is driven by a single `dbx.config.ts`:

```ts
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

## Opt-in by presence

Every section under `toolchain` is **opt-in by presence**: the toolchain only
touches an area you actually ask for.

- Omit a section — that area is left completely alone.
- `section: true` — enable it with defaults.
- `section: false` — explicitly disable it.
- `section: { ...options }` — enable and configure it.

Helpers `sectionEnabled(section)` and `sectionConfig(section)` implement this and
are exported for programmatic use.

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

```ts
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

```ts
export default defineConfig({
    toolchain: {
        logger: { level: 'debug', color: false, name: 'dbx' },
    },
});
```

| Option  | Values                                             | Default |
| ------- | -------------------------------------------------- | ------- |
| `level` | `debug` \| `info` \| `warn` \| `error` \| `silent` | `info`  |
| `color` | `true` \| `false`                                  | auto    |
| `name`  | prefix for non-indented lines                      | `dbx`   |

On the CLI, `--log-level <level>` and `--no-color` override the config (see the
[CLI reference](/guide/cli)). Machine output (`--json`) is written unprefixed
through the same logger.

## Providers

Provider passthrough commands (Vite+) follow the logger's colour setting. The
`providers` section can force provider colours on or off on its own:

```ts
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
verbatim to the generated root `vite.config.ts`, so `dbx.config.*` stays the only
hand-authored root config and `dbx sync` keeps `vite.config.ts` in step:

```ts
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

`dbx sync` writes the file with a managed header and `import { defineConfig }
from 'vite-plus'`, then `export default defineConfig({ ... })`. The file must
live at the root because `vp run` / `vp check` / `vp staged` do not accept
`--config`.

The single toolchain opt-out is `config`. Set `vite: { config: false }` to leave
a hand-written `vite.config.ts` alone. Everything else under `vite` is Vite+
config (plugins, `test`, `lint`, `fmt`, `run.tasks`, ...), so `toolchain.vite`
is the full Vite+ configuration. The section is typed as Vite+'s own config
(`ToolchainViteConfig` = Vite's `UserConfig` as augmented by Vite+), so the whole
Vite+ surface autocompletes in `dbx.config.ts`.

To adopt an existing hand-written `vite.config.ts`, fold it in with the
migration (see [Migrations](/guide/migrations#vite-config)):

```bash
dbx migrate --from vite --write   # folds the object into toolchain.vite
dbx sync                          # regenerates the managed vite.config.ts
```

## Programmatic API

```ts
import { loadToolchainConfig, runSync, defaultSyncTasks } from '@deltabox/toolchain';

const { config, tokens, projectType } = await loadToolchainConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```

Full section reference: [dbx.config](/config/reference).
