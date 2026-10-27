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

This makes a shared root config plus small per-project overrides possible:

```ts [<root>/dbx.config.ts]
export default defineConfig({
    toolchain: {
        ci: {
            changelog: {
                branches: { main: 'main', dev: 'dev' },
                commitlint: { scopes: ['core', 'cli'] },
            },
        },
        tsconfig: { refs: true, aliases: true },
    },
});

// <root>/packages/web/dbx.config.ts — inherits ci + tsconfig, tweaks both
export default defineConfig({
    toolchain: {
        ci: { changelog: { commitlint: { scopes: ['web'] } } }, // replaces the root's scopes
        tsconfig: { refs: false }, // boolean overrides the root's refs
    },
});
```

The workspace above ends up with `ci.changelog.branches` from the root
(unchanged), `ci.changelog.commitlint.scopes: ['web']` (replaced), and
`tsconfig: { refs: false, aliases: true }`.

> **`project` is inherited except its identity fields.** `name`, `scope`,
> `description` and `type` are per-project, so a non-root config keeps its own (or
> falls back to its `package.json`) and is still detected from its own files — a
> root `project` never renames a workspace. The shared fields (`author`,
> `license`, `homepage`, `repo`, `packageManager`, ...) flow down so their
> `package.json` values and replacement tokens stay shared.
> `project: { inherit: false }` disables project inheritance entirely. `hooks`
> are not inherited either — a parent's hooks are code and do not run for a
> nested project's sync.
