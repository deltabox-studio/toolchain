# Watch

The `watch` section configures `dbx watch`, which syncs once and then re-runs on
input changes.

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        watch: { enabled: true, debounce: 150 },
    },
});
```

## Options

| Option      | Type                 | Default              | Description                                 |
| ----------- | -------------------- | -------------------- | ------------------------------------------- |
| `enabled`   | `boolean`            | enabled when defined | Watch by default.                           |
| `debounce`  | `number`             | `150`                | Debounce window in ms before a re-sync.     |
| `exclude`   | `string \| string[]` | common ignored paths | Glob(s) excluded from watching.             |
| `gitignore` | `boolean`            | `true`               | Respect `.gitignore` files (root + nested). |

`exclude` adds to the common ignored paths (`node_modules`, `.dbx`, `dist`,
`build`, ...), and `gitignore` also honours the repo's `.gitignore` files (root
and nested, each scoped to its own directory) so ignored directories are never
watched. Set `gitignore: false` to watch them anyway.

```ts
watch: { exclude: ['**/fixtures/**'], gitignore: true }
```

## How it works

```sh
dbx watch
```

`dbx watch` runs one sync, then watches the config file plus every task's
`watch` globs and re-runs on change. Writes made by the sync itself must not
re-trigger a run, so a short quiet window follows each sync.

Only **input** files are watched (eg. `dbx.config.*`, `tsconfig.default.json`,
`tsconfig.workspaces.json`), never the generated outputs — so a sync can never
loop on its own writes.

Custom tsconfig names (`tsconfig.rootFile`, `tsconfig.defaultFile`) are watched
instead of the defaults. `dbx watch --list` prints the resolved inputs without
watching (`--json` adds the tsconfig file names; the VS Code extension reads it):

```sh
dbx watch --list --json
# { "globs": ["**/dbx.config.*", "tsconfig.workspaces.json", "**/tsconfig.default.json"],
#   "tsconfig": { "baseFile": "tsconfig.base.json", ... } }
```

`dbx watch --force` runs even when there is no `dbx.config.*`, and
`watch: { enabled: false }` disables it (so a plain `dbx watch` warns and exits).

## VS Code

The VS Code extension has its own debounced scheduler that mirrors this
behaviour (see [VS Code Extension](/guide/vscode#auto-sync)); the `watch` section
configures the **CLI** `dbx watch` command.
