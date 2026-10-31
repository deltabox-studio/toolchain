# tsconfig

The `tsconfig` section generates every workspace's `tsconfig.json` from a
workspace default tsconfig (`tsconfig.default.json`), layering path aliases and
project references from a single root workspaces tsconfig
(`tsconfig.workspaces.json`). It runs only at a **monorepo root**
(`project.type: 'monorepo-root'`); a single project keeps its hand-written
tsconfig untouched.

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        project: { type: 'monorepo-root', name: 'acme', scope: '@acme' },
        tsconfig: { aliases: true, refs: true, indent: 4 },
    },
});
```

`dbx sync` regenerates the managed `tsconfig.json` files and tracks them in
`.dbx/toolchain/manifest.json`; `dbx sync --check` is the CI gate. See
[Configuration](/guide/config/opt-in-by-presence) for the opt-in-by-presence
shorthand (`tsconfig: true` enables the defaults).

## Why so many tsconfig files?

TypeScript's language service (IntelliSense, diagnostics, autocomplete, "go to
definition", project references, ...) **always** picks up the file literally
named `tsconfig.json`. It offers no way to point the editor at a different file,
and it only understands the options it can express in a single config.

That single-file constraint is painful in practice:

- **Builds need different options than the editor.** `tsc` for a build wants
  `declaration`/`composite`/`emitDeclarationOnly`, a wider `include` and no
  `noEmit`, while the editor wants fast, no-emit checking of `src`. Cramming both
  into one `tsconfig.json` makes one of the two slower or wrong.
- **A monorepo has many projects with different options.** Each workspace wants
  its own `include`/`lib`/`types`/`jsx`, but the editor only reads the nearest
  `tsconfig.json`.
- **The language service can get slow.** For TypeScript (especially ≤ 7) the
  editor loads and type-checks whatever the `tsconfig.json` includes; a config
  that pulls in every workspace (or the whole build graph) can noticeably slow
  IntelliSense. Keeping the editor config small and correct matters.
- **Hand-managing the graph is tedious.** Path aliases and project references
  have to stay in sync with the workspace list, and a stale reference silently
  degrades the editor.

The toolchain splits the concerns so each file has one job, and `dbx sync`
keeps the generated `tsconfig.json` (the file the LSP actually reads) in sync
with a shared workspaces tsconfig that declares the `paths` + `references`.

**NOTE:** the `paths` + `references` in `tsconfig.workspaces.json` automatically resolves relative paths in each workspace's generated tsconfig.

## The files

The generator reads two hand-authored inputs (`tsconfig.default.json`,
`tsconfig.workspaces.json`) and writes one managed output (`tsconfig.json`):

| File                       | Owner      | Role                                                                              |
| -------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `tsconfig.base.json`       | you        | Shared compiler options that every workspace config extends.                      |
| `tsconfig.default.json`    | you        | A workspace's own options — the **input** the generator reads. **Optional.**      |
| `tsconfig.build.json`      | you        | Build/emit options (`tsc -p tsconfig.build.json`). **Optional, never rewritten.** |
| `tsconfig.workspaces.json` | you (root) | The root `paths` + `references` the generator expands. **Optional.**              |
| `tsconfig.json`            | generated  | Extends `tsconfig.default.json` + the workspaces aliases/references.              |

Only `tsconfig.json` must keep its name — that is the file TypeScript's LSP
reads. Everything else is optional and, if you prefer, renameable (see
[Renaming the files](#renaming-the-files)):

- **No `tsconfig.default.json`**: there is nothing to expand (the task logs a
  message and, when workspaces are expected, warns — see [Warnings](#warnings)).
- **No `tsconfig.build.json`**: builds simply use another config; it is never
  required or rewritten.
- **No `tsconfig.workspaces.json`**: each workspace still gets a `tsconfig.json`
  that extends its own default, but there are no shared `paths`/`references` to
  wire.

The `{{envTypesFile}}` token in the templates (default `src/env.d.ts`) is
resolved when a project is scaffolded, so a generated config's `include` points
at the project's env types file.

## Development vs build configs

`tsconfig.json` is the **editor/development** config: it extends
`tsconfig.default.json` and layers the workspace `paths` aliases on top, so
imports such as `@acme/core` resolve directly to `packages/core/src`. That is
what gives go-to-definition, inline diagnostics and fast editor feedback against
the real workspace source.

`tsconfig.build.json` intentionally extends `tsconfig.default.json`, **not**
`tsconfig.json`, so it does not get those path aliases. A build (`tsc -p
tsconfig.build.json`, `tsdown`, ...) therefore treats sibling workspaces as
packages (resolved through `node_modules` / project references) instead of
treating their source as part of the current package. Keeping them as packages
matters: aliasing them into the build graph would compile/bundle another
workspace's source into the output and increase the package size.

You can opt into build-time aliases by changing the build config to

```json [tsconfig.build.json]
{
    "extends": "./tsconfig.json",
    "include": ["src"]
}
```

It works, but sibling workspace source now participates in the build graph, so
only do it when that is what you want.

## Options

| Option        | Type                                 | Default                    | Description                                                         |
| ------------- | ------------------------------------ | -------------------------- | ------------------------------------------------------------------- |
| `enabled`     | `boolean`                            | enabled when defined       | Master switch (only meaningful with `project.type: monorepo-root`). |
| `aliases`     | `boolean`                            | `true`                     | Inject `compilerOptions.paths` from the workspaces config.          |
| `refs`        | `boolean`                            | `false`                    | Wire project references between workspaces.                         |
| `composite`   | `boolean`                            | `false`                    | Emit `composite: true` on the generated configs.                    |
| `glob`        | `string \| string[]`                 | `**/tsconfig.default.json` | Glob(s) for the workspace default tsconfig files to expand.         |
| `exclude`     | `string \| string[]`                 | common ignored paths       | Glob(s) excluded from `glob`.                                       |
| `gitignore`   | `boolean`                            | `true`                     | Respect `.gitignore` files (root + nested).                         |
| `defaultFile` | `string`                             | `tsconfig.default.json`    | The workspace default tsconfig file name.                           |
| `buildFile`   | `string`                             | `tsconfig.build.json`      | The workspace build tsconfig file name.                             |
| `indent`      | `number`                             | `4`                        | JSON indentation of the generated files.                            |
| `rootFile`    | `string`                             | `tsconfig.workspaces.json` | The workspaces tsconfig file name.                                  |
| `baseFile`    | `string`                             | `tsconfig.base.json`       | The root base tsconfig file name (the `overrides.base` target).     |
| `extends`     | `{ base?, default?, build? }`        | template defaults          | Per-file `extends` overrides for scaffolded tsconfig templates.     |
| `overrides`   | `{ base?, default?, build?, root? }` | none                       | Managed deep-merge overrides applied to the user-owned tsconfigs.   |

### `aliases`

When on (the default), each generated `tsconfig.json` gets a
`compilerOptions.paths` block derived from the workspaces tsconfig's `paths`.
The generator rewrites every alias relative to the workspace it is writing, and
**drops** any alias that resolves to the workspace itself (or into its own
subtree) so a package never maps its own import back to a self-reference.

### `refs`

When on, the workspaces `references` are merged with each workspace's own
`references`, deduplicated, rewritten relative to the workspace, and pruned
whenever the target config is not `composite` (a reference to a non-composite
project is invalid). This is what lets `tsc -b` build the graph in order.

### `composite`

When on, the generated configs spread the workspaces tsconfig's
`compilerOptions` (including `composite: true`, `declaration`,
`emitDeclarationOnly`, ...) and merge its `types`. Leave it off unless you build
the graph with `tsc --build`.

### `glob`

The glob(s) selecting the workspace default tsconfig files to expand. A single
string or an array:

```ts
tsconfig: {
    glob: '**/tsconfig.default.json';
}
tsconfig: {
    glob: ['packages/*/tsconfig.default.json', 'apps/*/tsconfig.default.json'];
}
```

It defaults to `**/<defaultFile>`, so setting `defaultFile` alone is usually
enough.

### `exclude` / `gitignore`

`exclude` drops paths from `glob`; it adds to the common ignored paths the
toolchain already skips (`node_modules`, `.dbx`, `dist`, `build`, `coverage`,
`.turbo`, `.git`, `.yarn`, ...). `gitignore` (on by default) additionally honours
the repo's `.gitignore` files — **root and nested**, each scoped to its own
directory, like git — so an ignored workspace is never scanned:

```ts
tsconfig: {
    glob: '**/tsconfig.default.json',
    exclude: ['**/legacy/**'],
    gitignore: true,
}
```

Set `gitignore: false` to scan ignored paths anyway.

### Renaming the files

`defaultFile`, `buildFile`, `rootFile` and `baseFile` rename the files the
generator reads and the [`overrides`](#overrides) patch:

```ts
tsconfig: {
    defaultFile: 'tsconfig.src.json',          // expanded into tsconfig.json
    buildFile: 'tsconfig.dist.json',           // read, never rewritten by the generator
    rootFile: 'tsconfig.graph.json',           // the workspaces paths + references
    baseFile: 'config/tsconfig.shared.json',   // the shared base (`overrides.base`)
}
```

Only `tsconfig.json` is fixed (TypeScript's LSP requirement). `rootFile` and
`baseFile` are paths relative to the repo root; `defaultFile` and `buildFile`
are file names inside each workspace. The custom names are honoured everywhere
the sync task looks: the generator, the overrides, the watched inputs
(`dbx watch`) and the files it keeps. Project detection looks for
`tsconfig.workspaces.json` / `tsconfig.default.json` by default, but honours
`rootFile` / `defaultFile` when they are set in the config. Scaffolding
(`dbx project:init*`) always writes the default names.

### `indent`

The JSON indentation of every generated file (default `4`).

### `extends`

Overrides the `extends` field written into **scaffolded** tsconfig templates
(`dbx project:init*`). This is separate from the `tsconfig.workspaces.json`
`extends` chain used by the resolver. Set a value to add/replace the field, or
`false` to remove it:

```ts
tsconfig: {
    extends: {
        base: '@tsconfig/node22',       // tsconfig.base.json currently has no extends
        default: './tsconfig.base.json', // keep/customize the normal default chain
        build: './tsconfig.json',       // opt into path aliases during builds
    },
}
```

Existing projects are user-owned by default: edit their `tsconfig.base.json`,
`tsconfig.default.json` and `tsconfig.build.json` directly. `dbx sync` only
rewrites the generated `tsconfig.json` unless you opt into `overrides`.

### `overrides`

Deep-merges managed options into the **user-owned** tsconfigs during
`dbx sync`, so a config can define those files programmatically:

```ts
tsconfig: {
    overrides: {
        base: { compilerOptions: { target: 'ES2022' } },
        root: { compilerOptions: { composite: true, types: ['node'] } },
        default: { compilerOptions: { strict: true } },
        build: { compilerOptions: { declaration: true } },
    },
}
```

| Key       | Target                                                           |
| --------- | ---------------------------------------------------------------- |
| `base`    | the root base tsconfig (`baseFile`, `tsconfig.base.json`)        |
| `root`    | the workspaces tsconfig (`rootFile`, `tsconfig.workspaces.json`) |
| `default` | every workspace's default tsconfig (`defaultFile`)               |
| `build`   | every workspace's build tsconfig (`buildFile`)                   |

Overrides are **deep-merged**: objects merge key by key, while arrays and
scalars replace the target value. Keys the override does not mention are left
alone. The patched files stay yours: they are not added to the manifest's
managed `files`, so a sync never deletes them and `dbx reset` never removes them.

#### Snapshots

The first time an override touches a file, its original content is saved in
`.dbx/toolchain/manifest.json` under a top-level `snapshots` field. The tree
mirrors the repository with **relative** paths (the manifest is the tracked
file under `.dbx`, so it never holds an absolute path), and the applied override
per file is recorded under `tsconfigOverrides`:

```json [.dbx/toolchain/manifest.json]
{
    "files": ["packages/core/tsconfig.json"],
    "snapshots": {
        "tsconfig.workspaces.json": { "compilerOptions": { "composite": false } },
        "packages": {
            "core": { "tsconfig.build.json": { "extends": "./tsconfig.default.json" } }
        }
    },
    "tsconfigOverrides": {
        "tsconfig.workspaces.json": {
            "kind": "root",
            "override": { "compilerOptions": { "composite": true, "types": ["node"] } }
        }
    }
}
```

#### Removing an override

Removing an override (or one of its keys) reverts it on the next sync. For
every key the override no longer sets, the sync compares the target file with
the snapshot:

- the snapshot **defines** the key: the original value is restored (eg. dropping
  `composite: true` above brings back the original `composite: false`);
- the snapshot **does not define** it: the key is removed, along with any parent
  object the override created that is now empty (eg. `types`);
- the key holds **another value** than the override wrote: it was edited after
  the override applied it, so it is kept and a `tsconfig.override-edited`
  warning is logged.

Once no override targets a file anymore, its snapshot and `tsconfigOverrides`
entry are dropped. A file is never deleted, even when nothing else is left in
it: other tooling may depend on it.

#### Restoring

`dbx tsconfig --restore` removes the applied override content right away (with
the same snapshot comparison), optionally for one kind only:

```sh
dbx tsconfig --restore           # every kind
dbx tsconfig --restore default   # base | root | default | build
```

If the overrides are still configured, the command warns
(`tsconfig.restore-reapply`): the next `dbx sync` applies them again, so remove
them from `toolchain.tsconfig.overrides` to keep the restored files.
`dbx reset` does the same restore before it removes the manifest, so resetting a
project never strands override content without its snapshots.

#### Notes

- A target that does not exist is **not created**: the sync warns
  (`tsconfig.missing-file`) and skips that file. A target outside the project
  root warns with `tsconfig.outside-root`.
- The user-owned files are read as JSONC but written back as plain JSON, so
  comments are dropped from a file the first time an override changes it. A file
  whose content would not change is never rewritten.
- `dbx sync --check` reports pending override changes (and reverts) as drift
  without writing them.

## How generation works

For each workspace matched by `glob`, the generator:

1. reads its default tsconfig and, when present, the workspaces tsconfig;
2. writes a sibling `tsconfig.json` that `extends: './<defaultFile>'`, layering
   the workspaces `compilerOptions` (aliases/types) and `references` on top;
3. leaves `tsconfig.build.json` alone — it is a user-owned input, like the
   default tsconfig.

Because the output only ever `extends` the default and adds the workspaces
wiring, your workspace-specific options stay in the default tsconfig (the file
the generator reads, not the one it writes).

## Warnings

| Id                         | When                                                               |
| -------------------------- | ------------------------------------------------------------------ |
| `tsconfig.missing-file`    | An override targets a file that does not exist (it is skipped).    |
| `tsconfig.outside-root`    | An override target resolves outside the project root.              |
| `tsconfig.override-edited` | A reverted key was edited after the override set it (it is kept).  |
| `tsconfig.restore-reapply` | `--restore` ran while the restored overrides are still configured. |

Silence any of them with [`logger.suppress`](/guide/config/logging).

When a sync finds **no** workspace tsconfig files, it warns (in the CLI logs and
as a VS Code notification) if either:

- `refs` or `composite` is enabled, or
- a `tsconfig.workspaces.json` is present,

because in those cases workspaces are clearly expected. Otherwise it logs a
quiet "nothing to do" message.

```
no workspace tsconfig files found (looked for **/tsconfig.default.json), but project references + tsconfig.workspaces.json have nothing to wire.
```

## The workspaces config

`tsconfig.workspaces.json` holds the `paths` and `references` the generator
expands. Scaffold it with `project:init:monorepo`, or build it programmatically
from a workspace list:

```ts
import { buildMonorepoTsconfig, renderMonorepoTsconfig } from '@deltabox/toolchain/tsconfig';

const config = buildMonorepoTsconfig({
    scope: '@acme',
    workspaces: [
        { alias: 'core', dir: 'packages/core' },
        { alias: 'cli', dir: 'packages/cli' },
    ],
});
// -> { compilerOptions: { composite, paths: { '@acme/core': ['./packages/core/src/index.ts'], ... } },
//      references: [{ path: './packages/core/tsconfig.json' }, ...] }
renderMonorepoTsconfig({ scope: '@acme', workspaces: [{ alias: 'core', dir: 'packages/core' }] });
```

## CLI

```sh
dbx tsconfig                       # regenerate every workspace tsconfig.json
dbx tsconfig --no-aliases          # skip the workspaces path aliases
dbx tsconfig --refs                # wire project references
dbx tsconfig --composite           # emit composite: true
dbx tsconfig -i 2                  # JSON indentation
dbx tsconfig --glob "packages/*/tsconfig.default.json" "apps/*/tsconfig.default.json"
dbx tsconfig --exclude "**/legacy/**"     # exclude paths (on top of the defaults)
dbx tsconfig --no-gitignore               # do not respect .gitignore files
dbx tsconfig --default-file tsconfig.src.json
dbx tsconfig --build-file tsconfig.dist.json
dbx tsconfig --root-file tsconfig.workspaces.json
dbx tsconfig --restore [kind]             # remove applied overrides (base|root|default|build)
```

Every flag overrides the matching `tsconfig` option; with no flags the command
uses the config defaults (including in-memory `overrides`, so the output matches
`dbx sync`). `dbx tsconfig --restore [kind]` removes applied overrides instead
(see [Restoring](#restoring)). `dbx sync` runs the same generator through the
[tsconfig sync task](#sync--ci).

### Resolving a tsconfig

The same command can inspect a config instead of generating files. It follows
`extends` per field, so a child can define `paths` while inheriting
`references` (or the reverse):

```sh
dbx tsconfig --json               # { alias, paths, references }
dbx tsconfig --alias              # Vite/Vitest resolve.alias entries
dbx tsconfig --paths              # resolved compilerOptions.paths
dbx tsconfig --references         # resolved project references
dbx tsconfig --tsconfig tsconfig.build.json
dbx tsconfig --root packages/app  # root used for detection + relative tsconfig
dbx tsconfig --no-extends         # only the selected file
```

The output is machine-clean JSON (absolute paths). Exact `alias` keys are strings;
wildcards are anchored regular expressions (rendered as `/.../` strings in the
CLI JSON), so `@acme/core` never captures `@acme/core-utils`. Exact keys sort
before wildcards.

## Programmatic API

```ts
import {
    generateTsconfigs,
    runTsconfigCli,
    resolveTsconfig,
    readTsconfig,
    renderTsconfigBase,
    renderTsconfigDefault,
    renderTsconfigBuild,
    renderTsconfigTemplates,
    buildMonorepoTsconfig,
    renderMonorepoTsconfig,
    tsconfigSyncTask,
    tsconfigFileNames,
    restoreTsconfigOverrides,
} from '@deltabox/toolchain/tsconfig';
```

| Export                                                                 | Description                                             |
| ---------------------------------------------------------------------- | ------------------------------------------------------- |
| `generateTsconfigs(options)`                                           | Expand every default tsconfig (dry-run-able).           |
| `runTsconfigCli(argv?)`                                                | The `dbx tsconfig` entry point.                         |
| `resolveTsconfig(options?)`                                            | Resolve `{ alias, paths, references }` (extends-aware). |
| `readTsconfig(file)`                                                   | Read a JSONC tsconfig (comments + trailing commas).     |
| `renderTsconfigBase` / `renderTsconfigDefault` / `renderTsconfigBuild` | Render a template with replacements.                    |
| `renderTsconfigTemplates(replacements?)`                               | Render every template keyed by file name.               |
| `buildMonorepoTsconfig(options)` / `renderMonorepoTsconfig(options)`   | The workspaces config (object / JSON text).             |
| `tsconfigSyncTask()`                                                   | The sync task wired into `dbx sync`.                    |
| `tsconfigFileNames(config)`                                            | The configured base/root/default/build file names.      |
| `restoreTsconfigOverrides(options)`                                    | Remove applied overrides (`{ cwd, kind?, dryRun? }`).   |
| `applyOverride` / `mergeOverride` / `revertOverride`                   | The deep-merge + snapshot-aware revert helpers.         |
| `getSnapshot` / `setSnapshot` / `deleteSnapshot`                       | Read/write the manifest snapshot tree by relative path. |

`resolveTsconfig` accepts `{ tsconfig, cwd, root, extends, overrides }`: `tsconfig` is
resolved from `root` (default `cwd`), and `extends` defaults to `true`. Paths are
resolved against the defining config's `baseUrl` (or its directory), matching
TypeScript.

`generateTsconfigs` returns one result per workspace (with `newTsconfig`,
`originalConfig`, ...); pass `write: false` for a dry run. The task-level
options are documented in the [Programmatic API](/guide/api/package-reference#deltaboxtoolchaintsconfig)
reference.

`renderTsconfigBase` / `renderTsconfigDefault` / `renderTsconfigBuild` accept an
optional second `extends` argument (`string | string[] | false`), and
`renderTsconfigTemplates` accepts `{ base, default, build }` as its second
argument.

## Sync & CI

At a monorepo root with the section enabled, `dbx sync` runs the tsconfig task
and reports the regenerated files:

```
tsconfig: regenerated 6 workspace tsconfig(s).
```

The task watches the workspaces tsconfig and every default tsconfig (custom
`rootFile` / `defaultFile` names included), keeps the build tsconfigs, and only
applies to `monorepo-root` projects. Run
`dbx sync --check` in CI to fail when a generated `tsconfig.json` drifts from
its inputs.

## Per-project configs

`toolchain.tsconfig` is repository-scoped: the root sync task expands every
workspace `tsconfig.json`, so nested configs **do not inherit** it — inheriting
it would make `dbx tsconfig` re-scan a workspace's own subtree. A nested config
may still declare its own `tsconfig` section when it manages its own workspace
tree (a nested monorepo); otherwise add the workspace's `tsconfig.default.json`
and run `dbx tsconfig` / `dbx sync` from the root. Other sections still inherit
as usual; see [Configuration → Nested configs](/guide/config/nested-configs)
for the rules.

## Scaffolding

`dbx project:init:monorepo` writes `tsconfig.base.json` + a `tsconfig.workspaces.json`;
`dbx project:init:workspace` writes the workspace's `tsconfig.default.json` /
`tsconfig.build.json` / `tsconfig.json` (and a `dbx.config.ts`). See the
[Monorepo Guide](/guide/monorepo#tsconfig-generation) for the full flow.
