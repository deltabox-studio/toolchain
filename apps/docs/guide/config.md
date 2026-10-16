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
        vite: { defaultTemplate: '@acme' },
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

## Programmatic API

```ts
import { loadToolingConfig, runSync, defaultSyncTasks } from '@deltabox/toolchain';

const { config, tokens, projectType } = await loadToolingConfig(process.cwd());
await runSync({ tasks: defaultSyncTasks(), cwd: process.cwd(), config, tokens, projectType });
```

Full section reference: [dbx.config](/config/reference).
