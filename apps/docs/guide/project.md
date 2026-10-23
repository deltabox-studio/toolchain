# Project

The `project` section is a package's **canonical metadata**. It is the single
place to declare who a package is, and it does three jobs:

1. **Defines `package.json` fields.** On `dbx sync`, the fields the section
   defines are written into the project's `package.json` (everything else is left
   untouched).
2. **Feeds the `{{ token }}` replacements.** Every template (`biome.json`,
   workflows, tsconfigs, READMEs, ...) reads these values.
3. **Drives scaffolding.** `dbx project:init*` uses the section as its defaults
   (and `project.type` picks the kind of project to generate).

```ts
export default defineConfig({
    toolchain: {
        project: {
            type: 'monorepo-root',
            name: 'acme',
            scope: '@acme',
            author: 'Acme Inc. <hello@acme.dev>',
            license: 'MIT',
            homepage: 'https://acme.dev',
            repo: 'https://github.com/acme/acme',
            description: 'The acme monorepo',
            nodeVersion: '22',
            packageManager: 'yarn',
            packageManagerVersion: '4.17.1',
        },
    },
});
```

## `package.json` mapping

A sync writes only the fields the config **defines**; a field you omit is never
touched. The mapping:

| `project` field  | `package.json` field | Notes                                              |
| ---------------- | -------------------- | -------------------------------------------------- |
| `name` + `scope` | `name`               | `@acme/app` when a scope is set, else `app`.       |
| `description`    | `description`        |                                                    |
| `author`         | `author`             |                                                    |
| `license`        | `license`            |                                                    |
| `homepage`       | `homepage`           |                                                    |
| `repo`           | `repository`         | `{ type: 'git', url }` (+ `directory`, see below). |
| `packageManager` | `packageManager`     | `yarn@4.17.1` when `packageManagerVersion` is set. |
| `type`           | —                    | Project kind for detection/scaffolding.            |
| `nodeVersion`    | —                    | Node version for CI/templates (not `engines`).     |

`nodeVersion` is intentionally **not** written to `engines`: it is the Node
version the generated workflows run on (`node-version: '{{nodeVersion}}'`), which
is a different concern from the published `engines.node` range.

## Workspace inheritance

A non-root `dbx.config.*` is merged over the nearest ancestor config (see
[Configuration → Nested configs](/guide/config#nested-configs)). For `project`
specifically:

- **Fields are inherited** (scope, author, license, ...), so a workspace keeps the
  shared metadata while overriding the fields it sets (typically `name`).
- **`type` is never inherited** — the project kind is location-specific, so a
  workspace without an explicit `type` is still detected from its own files.
- **`inherit: false`** opts out entirely: the project keeps only its own `project`
  and ignores the parent's (useful for an unrelated package inside the tree).

```ts
// packages/web/dbx.config.ts — keeps the root scope/author/license, sets its own name
export default defineConfig({
    toolchain: {
        project: { name: 'web' },
        // ...
    },
});
```

### `repo` resolves to the workspace path

For a non-root project, `repo` also resolves to the workspace's location in the
repository, written as `repository.directory`:

```json
{
    "repository": {
        "type": "git",
        "url": "https://github.com/acme/acme",
        "directory": "packages/web"
    }
}
```

The directory is computed relative to the repository root (the nearest ancestor
with a `.git`), exactly like npm expects for a monorepo workspace.

## When the section is absent

If `project` is not defined, nothing is written to `package.json` — and the
replacement tokens fall back to the project's **own `package.json`** values
(`name`/`scope` from `name`, plus `description`, `author`, `license`, `homepage`,
`repository`, `engines.node`, `packageManager`). So a repo with no `project`
section still generates correct tokens from its existing metadata.

## Scaffolding

`dbx project:init`, `dbx project:init:monorepo` and
`dbx project:init:workspace` read `project` as their defaults, and:

- **`name` is required** (from `--name` or `project.name`) — a scaffold fails
  with a clear error when it is missing.
- **`type` must be valid** (`project`, `monorepo-root` or `monorepo-workspace`)
  when passed explicitly or set in the config; an invalid value is rejected.

```bash
dbx project:init --name my-app --scope @acme --type project --out ./my-app
dbx project:init:monorepo --name acme --scope @acme --out .
dbx project:init:monorepo --name acme --scope @acme --example --out .
dbx project:init:workspace --name web --root . --dir packages/web
```

The scaffolded `dbx.config.ts` spells the resolved `project` fields out, so a
generated project is self-describing from day one.

Pass `--package-manager <pm>` (`yarn` default, or `pnpm` / `npm` / `bun`) to
choose the manager the scaffold targets.

## Package manager and catalogs

The scaffold and `dbx sync` write a **catalog** (`package -> version range`) into
the file the package manager reads it from, so dependencies can be declared with
`catalog:`:

| Manager | Catalog file          | Notes                                        |
| ------- | --------------------- | -------------------------------------------- |
| `yarn`  | `.yarnrc.yml`         | `catalog:` / `catalogs:` (default + named).  |
| `pnpm`  | `pnpm-workspace.yaml` | `catalog:` / `catalogs:`.                    |
| `bun`   | `package.json`        | `workspaces.catalog`.                        |
| `npm`   | —                     | No catalog support; dependencies are pinned. |

Scaffolding resolves the manager from the `packageManager` input and writes the
catalog of the packages the project depends on. To keep it in sync with
`dbx sync`, add a `catalogs` section to `dbx.config.*`:

```ts
export default defineConfig({
    toolchain: {
        project: { packageManager: 'yarn' },
        catalogs: {
            packages: { react: '^19.0.0', lodash: '^4.17.21' },
            named: { legacy: { react: '^18.0.0' } },
        },
    },
});
```

`dbx sync` writes (and keeps in sync) `catalog:` / `catalogs:` in `.yarnrc.yml`
(Yarn) or `pnpm-workspace.yaml` (pnpm). A catalog file is only written when it is
absent or already toolchain-managed (it carries a marker comment); a hand-written
one is left untouched. Bun catalogs live in `package.json` and npm has no catalog
support — both emit a warning.

## Programmatic API

```ts
import { projectFromPackageJson, projectToPackageJson, projectSyncTask } from '@deltabox/toolchain';

// Seed a config from an existing package.json.
const project = projectFromPackageJson(require('./package.json'));

// Map the defined fields onto package.json fields.
const pkgFields = projectToPackageJson(project, { directory: 'packages/web' });

// The sync task itself.
projectSyncTask();
```

| Export                        | Description                                                         |
| ----------------------------- | ------------------------------------------------------------------- |
| `projectFromPackageJson(pkg)` | Derive project metadata from a `package.json`.                      |
| `projectToPackageJson(p, o?)` | Map defined project fields onto `package.json` fields.              |
| `projectSyncTask()`           | The sync task that applies the `project` section to `package.json`. |
