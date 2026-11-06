# Package catalogs

A **catalog** is a shared `package -> version range` map. Workspaces declare a
dependency as `catalog:` and the package manager resolves it from the catalog, so
a version lives in one place instead of being repeated (and drifting) across
every `package.json`.

`toolchain.catalogs` writes that map into the file the package manager reads it
from. Like every section it is **opt-in by presence** and root-only: a workspace
never inherits it.

## Configuration

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        catalogs: {
            // The default catalog (`catalog:`).
            packages: {
                react: '^19.0.0',
                'react-dom': '^19.0.0',
                lodash: '^4.17.21',
            },
            // Named catalogs (`catalogs.<name>`).
            named: {
                legacy: { react: '^18.0.0' },
            },
        },
    },
});
```

| Option     | Type                                     | Description                                    |
| ---------- | ---------------------------------------- | ---------------------------------------------- |
| `packages` | `Record<string, string>`                 | The default catalog: package -> version range. |
| `named`    | `Record<string, Record<string, string>>` | Named catalogs: name -> (package -> range).    |
| `enabled`  | `boolean`                                | Master switch (default: enabled when defined). |

A section with neither `packages` nor `named` writes nothing.

## Supported package managers

| Manager | Catalog file          | Notes                                               |
| ------- | --------------------- | --------------------------------------------------- |
| `yarn`  | `.yarnrc.yml`         | `catalog:` / `catalogs:` (default + named).         |
| `pnpm`  | `pnpm-workspace.yaml` | `catalog:` / `catalogs:`.                           |
| `bun`   | `package.json`        | `workspaces.catalog`; declare it there.             |
| `npm`   | —                     | No catalog support; dependencies are pinned inline. |

The manager is read from the resolved `project.packageManager` (falling back to
the root `package.json`'s `packageManager`, then `yarn`).

## Managed files

`dbx sync` writes the catalog file only when it is:

- **absent**, or
- **already toolchain-managed** — it carries the
  `# Managed by @deltabox/toolchain (catalogs)` marker.

A hand-written catalog file is never clobbered. The file is also marked as
`keep`: removing the `catalogs` section (or replacing the file with your own)
never deletes it, because the package manager reads it and it may hold
hand-written keys.

For Yarn the generated file also sets `nodeLinker: node-modules`; for pnpm it
declares the `packages/*` globs on a monorepo root.

Bun catalogs live in `package.json` `workspaces.catalog` and npm has no catalog
support, so both warn instead of writing a separate file.

## Scaffolding

`dbx project:init` and `dbx project:init:monorepo` write the catalog for the
packages the scaffold depends on **and opt into it in the generated
`dbx.config.*`**, so `dbx sync` owns and keeps the file in sync:

```ts [dbx.config.ts]
toolchain: {
    project: { packageManager: 'yarn' },
    catalogs: {
        packages: {
            '@deltabox/toolchain': '^2.5.0',
            typescript: '^6.0.3',
            // ...
        },
    },
}
```

A single Bun project pins its dependencies (there is nowhere to declare a
catalog); a Bun monorepo root writes the catalog into `package.json`.

## Keeping it in sync

```sh
dbx sync                  # regenerate the catalog file
dbx sync --only catalogs  # just the catalog task
dbx sync --check          # CI: fail on drift
```

## Programmatic API

```ts
import {
    CATALOG_MARKER,
    CATALOG_PACKAGE_MANAGERS,
    catalogFileFor,
    catalogsSyncTask,
    hasCatalog,
    renderPnpmWorkspace,
    renderYarnrc,
    scaffoldCatalog,
    supportsCatalogs,
} from '@deltabox/toolchain/project';
```

| Export                       | Description                                                          |
| ---------------------------- | -------------------------------------------------------------------- |
| `catalogsSyncTask()`         | The sync task that writes the managed catalog file.                  |
| `catalogFileFor(pm)`         | The file a manager reads its catalog from (`undefined` for npm/bun). |
| `hasCatalog(root, pm, req?)` | Whether a default catalog exists (optionally covering `req`).        |
| `supportsCatalogs(pm)`       | Whether the manager supports catalogs at all.                        |
| `renderYarnrc(catalog)`      | Render a `.yarnrc.yml` (node-modules linker + catalog(s)).           |
| `renderPnpmWorkspace(c)`     | Render a `pnpm-workspace.yaml` (optional globs + catalog(s)).        |
| `scaffoldCatalog(pm, ex?)`   | The catalog a scaffold writes (`undefined` when it writes none).     |
| `CATALOG_MARKER`             | The marker line that identifies a toolchain-managed catalog file.    |
| `CATALOG_PACKAGE_MANAGERS`   | The managers with catalog support (`yarn`, `pnpm`, `bun`).           |
