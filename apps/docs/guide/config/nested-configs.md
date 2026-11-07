# Nested configs

A `dbx.config.*` in a **non-root** folder (a workspace, an app, a nested
project) is merged over the nearest ancestor `dbx.config.*` found while walking
up to the repository root (the walk stops at the `.git` boundary, so it never
picks up a config from outside the repo).

The merge is recursive, but **sections are strictly opt-in**:

- **Only a section the nested config explicitly enables/configures is
  inherited.** If the nested config omits `fmt`, `lint`, `biome`, `changelog`,
  `catalogs` or `logger`, that section stays disabled for that project even when
  the root defines it.
- When the nested config **does** opt in, objects are merged key by key and
  leaves (booleans, strings, numbers, arrays) in the child replace the root's
  value. `true` means “enabled with the parent's options”; `false` disables it.
- **Repository/workspace-scoped sections are never inherited**: `ci`, `tsconfig`,
  `loader`, `templates`, `registry`, `watch`, `providers`, and `vite`. A
  workflow, workspace tsconfig tree, config loader, source/registry policy,
  watch process or Vite config describes the repository or one workspace, so a
  child starts without the parent's values for them. In particular, the root
  `tsconfig` task already expands every workspace `tsconfig.json`; inheriting it
  into each workspace would only re-scan that subtree. `loader` is read from the
  nearest config file to import the nested config, but it is not merged into the
  child's config.
- **`project` metadata is the exception**: shared metadata (`author`, `license`,
  `homepage`, `repo`, `packageManager`, ...) is inherited because it is project
  metadata, not a task section.

`vite.fmt` / `vite.lint` are hoisted into the top-level `fmt.oxc` / `lint.oxc`
**when the nested config opts into `fmt` / `lint`**.

```ts [<root>/dbx.config.ts]
export default defineConfig({
    toolchain: {
        logger: { level: 'debug', color: false },
        fmt: { oxc: { printWidth: 100, singleQuote: true } },
        vite: { shim: 'static', resolve: { tsconfigPaths: true } },
    },
});

// <root>/packages/web/dbx.config.ts — opts into `fmt` + `logger`; `vite` is local
export default defineConfig({
    toolchain: {
        logger: { level: 'warn' }, // opts in; leaf overrides the root's level
        fmt: true, // opts in; inherits the root's `fmt` options
        vite: {
            shim: 'static',
            resolve: { tsconfigPaths: true },
            run: { tasks: { build: { command: 'tsdown' } } },
        },
    },
});
```

The workspace above ends up with `logger: { level: 'warn', color: false }` and
the root's `fmt` options (because it opted in with `fmt: true`). If it omitted
`fmt`, it would have no `fmt` section at all. Its `vite.run` holds only the
`build` task it declares — the root's tasks are not merged in.

> **`vite` is never inherited.** A workspace only has the `vite` config it
> declares itself; a project with no `vite` section keeps its hand-written
> `vite.config.*` alone. Declare the settings it needs (`shim`, `resolve`,
> `plugins`, ...) in its own config. `vite.fmt` / `vite.lint` are hoisted into
> `fmt` / `lint` only when the workspace opts into those sections.

> **Arrays replace, so repeat what you need.** If a workspace opts into `fmt`
> and sets `fmt.oxc.ignorePatterns`, that array replaces the root's list (it is
> not appended). Either keep the root patterns in the workspace array, or put
> the shared pattern on the root config — for example `**/vite.config.ts` there
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

## Configless projects

A project with **no `dbx.config.*` of its own** is not managed by the toolchain
by default: it does not inherit the ancestor config, `dbx sync` leaves it
alone, and its files are never generated or pruned. This avoids surprising
changes in packages that never opted in.

To manage configless projects, opt in explicitly:

- **Config:** set `toolchain.project.manageConfigless: true` on the ancestor
  config (it is repository-scoped, so a configless project inherits the choice
  through the parent config).
- **CLI:** pass `dbx sync --configless` (or `dbx watch --configless`).
- **VS Code:** enable `deltabox.toolchain.manageConfigless`.

```ts [<root>/dbx.config.ts]
export default defineConfig({
    toolchain: {
        project: {
            manageConfigless: true,
        },
    },
});
```

When enabled, a configless project inherits the ancestor config (the configless
opt-in is the explicit opt-in for the whole project; repository-scoped sections
are still dropped) and `dbx sync` regenerates its managed files.

> Configless projects are still **discovered** (so the Projects view and the
> project graph can show them); they are just not managed until you opt in.
