# Migrating from v1 to v2

v2 focuses on a smaller, schema-driven config-generator API. Most runtime
features keep working, but the programmatic config-generator surface is a
breaking change.

## Breaking changes

### `ConfigScopes` and `ConfigScopeDef` are gone

Pass a `ConfigSchema` directly. It accepts a Zod schema, an untyped `Schema`, an
array of schemas, or a record keyed by scope.

```ts
// v1
const engine = createConfigEngine({
    scopes: {
        server: { zodSchema: serverConfig },
        cli: { zodSchema: cliConfig },
    },
});

// v2
const engine = createConfigEngine({
    schema: { server: serverConfig, cli: cliConfig },
});
```

`ConfigSchemaType` is the untyped `Schema` plus the toolchain's `ConfigMeta`.

### Render functions are internal

Use the `generateConfig*` functions or the engine methods. They return generated
contents and only write when you pass an output directory/path.

```ts
// v1
renderConfigTypes(scopes, { outputDir });
renderScopeMarkdown(scopes, { outDir });

// v2
generateConfigTypes(schema, { outputDir });
generateConfigMarkdown(schema, { outputDir });
```

Set `outputDir: false` (or omit it) to generate without writing.

### Schema maps were removed

`CONFIG_SECTION_SCHEMAS`, `CONFIG_TYPE_SCHEMAS` and
`CONFIG_SECTION_DESCRIPTIONS` were removed. Use `configSchema` (the section
schemas) or `dbxConfigSchema`, and read descriptions from each schema's
`.describe()` / `.meta()`.

### Metadata is the source of truth

Generators read `ConfigMeta` from Zod `.meta()` or from untyped schema nodes.
`env`/`path` are deprecated in favour of `envName`/`envPath`; `cliFlag` and
`cliFlagShort` customize CLI flags. Types can use `typeName` / `id` to control
the generated interface name.

### Collection names

- `collectEnvVars` → `collectVars`
- `collectRequiredEnvVars` → `collectRequired`
- `EnvVarDef` → `ConfigDef`
- `EnvValueType` → `ConfigValueType`
- engine `requiredEnvVars` → `requiredVars`
- `writeMarkdown({ outDir })` → `writeMarkdown({ outputDir })`

## Behaviour changes

- `toolchain.fmt` / `toolchain.lint` shorthand (`true` or `{ vscode: ... }`)
  now infers a tool from installed packages, then VS Code user settings, then
  falls back to Oxc defaults. Existing user config files are folded through the
  migration mappings instead of being overwritten.
- Formatter/linter conflict warnings use `fmt.conflict` / `lint.conflict`.
  Missing tools warn with `fmt.no-tool` / `lint.no-tool`.
- `fmt.vscode` / `lint.vscode` only add `editor.defaultFormatter`, language
  blocks and `editor.codeActionsOnSave`; use `{ overrides, exclude }` to adjust
  them.
- A custom logger can be supplied through `toolchain.logger.logger`.
- Changelog versioning supports custom bump rules/callbacks, over-bump opt-in,
  provider selection and commit credit/format options.

## tsconfig changes

### Resolve paths/references programmatically or from the CLI

v2 adds a extends-aware resolver. Use it instead of hand-rolling alias parsing:

```ts
import { resolveTsconfig } from '@deltabox/toolchain/tsconfig';

const { alias, paths, references } = resolveTsconfig({
    root: process.cwd(),
    tsconfig: 'tsconfig.json', // optional; defaults to <root>/tsconfig.json
});
```

```sh
dbx tsconfig --json                       # { alias, paths, references }
dbx tsconfig --alias                      # Vite/Vitest resolve.alias entries
dbx tsconfig --paths                      # resolved compilerOptions.paths
dbx tsconfig --references                 # resolved project references
dbx tsconfig --tsconfig tsconfig.build.json
dbx tsconfig --root packages/app --no-extends
```

The resolver follows `extends` per field: a child can define `paths` while
inheriting `references` (or the reverse). When a config has no `baseUrl`, its
relative paths resolve from the config file that declares them.

### Stop editing generated `tsconfig.json` files

`dbx` owns the generated `tsconfig.json`; move customizations to
`tsconfig.default.json` or `toolchain.tsconfig.overrides` and re-run sync:

```ts
export default defineConfig({
    toolchain: {
        tsconfig: {
            overrides: {
                base: { compilerOptions: { target: 'ES2022' } },
                default: { compilerOptions: { strict: true } },
                build: { compilerOptions: { declaration: true } },
                root: { compilerOptions: { types: ['node'] } },
            },
        },
    },
});
```

```sh
dbx sync --recursive
dbx sync --recursive --check
```

Overrides are deep-merged into the user-owned files (`baseFile`, `rootFile`,
`defaultFile`, `buildFile`; custom names are honoured). The first time a file is
patched, its original content is snapshotted in `.dbx/toolchain/manifest.json`
under `snapshots` (a tree of **relative** paths mirroring the repo), and the
applied override under `tsconfigOverrides`. Deleting an override key reverts it:
the original value comes back when the snapshot defines the key, otherwise the
key is removed (a value edited after the override set it is kept). A missing
target is skipped with a `tsconfig.missing-file` warning instead of being created.

```sh
dbx tsconfig --restore           # remove every applied override now
dbx tsconfig --restore build     # only base | root | default | build
```

`dbx reset` restores the overrides before it removes the manifest. The patched
files are never part of the manifest's managed `files`, so neither a sync nor a
reset deletes them. See [tsconfig → `overrides`](/guide/tsconfig#overrides).

`tsconfig.baseFile` (default `tsconfig.base.json`) names the root base tsconfig
that `overrides.base` targets. Use `tsconfig.extends` to choose what scaffolded
`tsconfig.base/default/build.json` files extend (for example
`build: './tsconfig.json'` to reuse path aliases in builds, at the cost of
pulling workspace source into the build).

### Sync task API

Custom sync tasks can use these additions:

- `SyncTask.watch` / `SyncTask.keep` accept a function of the config
  (`config => string[]`), so globs can follow configured file names.
- A `ManagedFile` returned with `track: false` is written and drift-checked like
  any other, but stays user-owned: it is not recorded in the manifest, never
  pruned by a later sync and never removed by `dbx reset`.
- `SyncContext.manifest` holds task metadata persisted in the manifest between
  syncs (`snapshots`, `tsconfigOverrides`); `SyncContext.check` is true for
  `dbx sync --check`.

### Do not hand-add workspace aliases

Keep `paths`/`references` in `tsconfig.workspaces.json`; the generator expands
them into each workspace. For Vite/Vitest, prefer Vite's native
`resolve.tsconfigPaths: true`, or pass `resolveTsconfig().alias` to
`resolve.alias`. If you created a `vitest.aliases.ts` during the transition,
delete it and use one of those two options.

## Vite and task changes

- Runtime shims are still the default (`vite.shim: 'runtime'`). Static shims
  (`vite.shim: 'static'`) serialize the config and import only `defineConfig`,
  useful when loading the shim without a built package.
- `vite.shimImport` changes the `resolveVite` import specifier for runtime
  shims. Relative values are resolved from the repo root and rewritten per
  generated config.
- `typecheck:ci` was removed; `typecheck` already uses the source tsconfig. Use
  `yarn typecheck` in CI and delete any `typecheck:ci` scripts or Vite+ tasks.
- The emulate test suite can be cleaned with `yarn test:clean`.

## Recommended upgrade steps

1. Replace `scopes` with `schema` in `createConfigEngine`.
2. Replace `render*` imports with `generateConfig*`.
3. Remove imports of the deleted schema maps; use `configSchema` or individual
   schema exports.
4. Rename `env`/`path` metadata to `envName`/`envPath` when convenient (the old
   names still work).
5. Remove hand-written `tsconfig.json` aliases and move them to
   `tsconfig.workspaces.json`; run `dbx sync --recursive`.
6. Replace any custom tsconfig path parser with `resolveTsconfig()` (or
   `dbx tsconfig --json`).
7. Delete `vitest.aliases.ts` if present; enable
   `resolve.tsconfigPaths: true` or use `resolveTsconfig().alias`.
8. Replace `typecheck:ci` with `typecheck` in scripts/CI.
9. Optionally move options you want managed in `tsconfig.base.json` /
   `tsconfig.workspaces.json` / the workspace default and build tsconfigs into
   `toolchain.tsconfig.overrides`, and keep committing
   `.dbx/toolchain/manifest.json` (it now holds their snapshots).
10. Run `yarn dbx sync`, `yarn config:types`, `yarn typecheck`, `yarn test` and
    `yarn dbx sync --recursive --check` after upgrading.
