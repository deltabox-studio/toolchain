# Nested configs

A `dbx.config.*` in a **non-root** folder (a workspace, an app, a nested
project) is merged over the nearest ancestor `dbx.config.*` found while walking
up to the repository root (the walk stops at the `.git` boundary, so it never
picks up a config from outside the repo).

The merge is recursive:

- **Objects** are merged key by key, so a child keeps every option it does not
  mention.
- **Leaves** — booleans, strings, numbers and **arrays** — in the child
  **replace** the root's value (arrays are not concatenated).
- **Workspace-scoped sections are not inherited**: `ci` (and the deprecated
  top-level `changelog`), `vite.test` and `vite.run`. A workflow, test config or
  task list describes one repository/workspace, so a child starts without the
  parent's values for them.

Everything else is shared unless the child overrides it — `vite.fmt`,
`vite.lint`, `vite.plugins`, `tsconfig`, `biome`, `templates`, `registry`, and so
on — so lint/format settings are cohesive across a monorepo by default.

```ts [<root>/dbx.config.ts]
export default defineConfig({
    toolchain: {
        tsconfig: { refs: true, aliases: true },
        vite: {
            fmt: { printWidth: 100, singleQuote: true },
        },
    },
});

// <root>/packages/web/dbx.config.ts — inherits `vite.fmt`, tweaks `tsconfig`
export default defineConfig({
    toolchain: {
        tsconfig: { refs: false }, // boolean overrides the root's refs
        vite: {
            run: { tasks: { build: { command: 'tsdown' } } }, // not inherited
        },
    },
});
```

The workspace above ends up with `tsconfig: { refs: false, aliases: true }` and
the root's `vite.fmt` settings. Its `vite.run` holds only the `build` task it
declares — the root's tasks are not merged in.

> **Arrays replace, so repeat what you need.** If a workspace sets
> `vite.fmt.ignorePatterns`, that array replaces the root's list (it is not
> appended). Either keep the root patterns in the workspace array, or put the
> shared pattern on the root config — for example `**/vite.config.ts` there
> covers every workspace's generated shim.

> **`project` is inherited except its identity fields.** `name`, `scope`,
> `description` and `type` are per-project, so a non-root config keeps its own (or
> falls back to its `package.json`) and is still detected from its own files — a
> root `project` never renames a workspace. The shared fields (`author`,
> `license`, `homepage`, `repo`, `packageManager`, ...) flow down so their
> `package.json` values and replacement tokens stay shared.
> `project: { inherit: false }` disables project inheritance entirely. `hooks`
> are not inherited either — a parent's hooks are code and do not run for a
> nested project's sync.
