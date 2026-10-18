---
title: dbx.config
outline: [2, 3, 4]
---

# dbx.config

A `dbx.config.ts` file exports `{ toolchain: { ...sections } }`: the
`@deltabox/toolchain` settings live under the `toolchain` key. Every
section is **opt-in by presence** (see [Configuration](/guide/config)):
define it to enable it, omit it to leave that area untouched.

> Generated from the Zod config schema — do not edit by hand.
> Run `yarn config:generate`.

## `project`

Project metadata used as replacement tokens across every template.

### `type`

- **Type**: `'monorepo-root' | 'monorepo-workspace' | 'project'`

The project kind (detected when omitted).

### `name`

- **Type**: `string`

The unscoped project name.

### `scope`

- **Type**: `string`

The npm scope, eg. `@acme`.

### `author`

- **Type**: `string`

Package author.

### `license`

- **Type**: `string`

SPDX license id.

### `homepage`

- **Type**: `string`

Project homepage.

### `repo`

- **Type**: `string`

Repository URL, eg. `https://github.com/acme/app`.

### `nodeVersion`

- **Type**: `string`

Node engine range, eg. `>=22`.

### `packageManager`

- **Type**: `string`

Package manager name (default `yarn`).

### `packageManagerVersion`

- **Type**: `string`

Package manager version, eg. `4.17.1`.

### `description`

- **Type**: `string`

One-line description.

## `changelog`

Conventional-Commits CI, commitlint and the changelog pipeline.

### `enabled`

- **Type**: `boolean`

Master switch (enabled when the section is defined).

### `workflows`

- **Type**: `ChangelogWorkflowsConfig`

Which workflows to write into `.github/workflows`.

#### `ci`

- **Type**: `WorkflowSetting`

##### `enabled`

- **Type**: `boolean`

Enable/disable this workflow (default true).

##### `pushBranches`

- **Type**: `Array<string>`

Replace `on.push.branches`.

##### `pullRequestBranches`

- **Type**: `Array<string>`

Replace `on.pull_request.branches`.

##### `triggers`

- **Type**: `Record<string, unknown>`

Extra `on.*` triggers.

##### `extra`

- **Type**: `Record<string, unknown>`

Extra top-level keys (`permissions`, `concurrency`, `env`, ...).

##### `steps`

- **Type**: `WorkflowStepsConfig | Array<WorkflowStepsConfig>`

Extra steps for a job (one group, or per-job groups).

###### `job`

- **Type**: `string`

Target job id (defaults to the primary/first job).

###### `before`

- **Type**: `Array<WorkflowStep>`

Steps inserted at the start.

###### `name`

- **Type**: `string`

###### `id`

- **Type**: `string`

###### `if`

- **Type**: `string`

###### `uses`

- **Type**: `string`

###### `run`

- **Type**: `string`

###### `shell`

- **Type**: `string`

###### `working-directory`

- **Type**: `string`

###### `with`

- **Type**: `Record<string, unknown>`

###### `env`

- **Type**: `Record<string, unknown>`

###### `after`

- **Type**: `Array<WorkflowStep>`

Steps appended at the end.

##### `jobs`

- **Type**: `Record<string, unknown>`

Extra complete jobs merged in.

##### `tokens`

- **Type**: `Record<string, unknown>`

Per-workflow token overrides (`nodeVersion`, `packageManager`, ...).

#### `changelog`

- **Type**: `WorkflowSetting`

#### `release`

- **Type**: `WorkflowSetting`

#### `issues`

- **Type**: `WorkflowSetting`

#### `sync`

- **Type**: `WorkflowSetting`

### `branches`

- **Type**: `object`

Branch names the workflows target.

#### `main`

- **Type**: `string`

#### `dev`

- **Type**: `string`

### `types`

- **Type**: `Array<string>`

Allowed commit types (commitlint).

### `scopes`

- **Type**: `Array<string>`

Allowed commit scopes (commitlint).

### `versioning`

- **Type**: `ChangelogVersioning`

Automatic version bumping on changelog generation (default `true`).

#### `target`

- **Type**: `'uniform' | 'root-only' | 'individual'`

`uniform` bumps the root and every workspace to one shared version; `root-only` bumps the root only; `individual` bumps each changed workspace independently (default `uniform`).

#### `workspaces`

- **Type**: `Array<string>`

Glob patterns selecting the workspaces to version (relative to the root). Defaults to the root `package.json` `workspaces` field; when there is none the root `package.json` is used on its own.

### `vscode`

- **Type**: `boolean`

Write the Conventional-Commits VS Code settings.

## `biome`

Biome config generation (for consumers that still want a `biome.json`).

### `enabled`

- **Type**: `boolean`

Master switch (enabled when the section is defined).

### `vscode`

- **Type**: `boolean`

Write the Biome VS Code settings (default true).

### `overrides`

- **Type**: `Record<string, unknown>`

Deep-merged over the generated `biome.json` (arrays union).

## `tsconfig`

Workspace tsconfig generation (path aliases + project references).

### `enabled`

- **Type**: `boolean`

Master switch (enabled when the section is defined).

### `glob`

- **Type**: `string`

Glob for workspace `tsconfig.default.json` files.

### `appGlob`

- **Type**: `string`

Glob for "override" (app) workspaces.

### `refs`

- **Type**: `boolean`

Wire project references (default false).

### `composite`

- **Type**: `boolean`

Emit `composite: true` (default false).

### `aliases`

- **Type**: `boolean`

Inject path aliases (default true).

### `indent`

- **Type**: `number`

JSON indentation (default 4).

### `rootFile`

- **Type**: `string`

The monorepo tsconfig file name (default `tsconfig.monorepo.json`).

## `templates`

Template sources / scaffolding.

### `enabled`

- **Type**: `boolean`

Master switch (enabled when the section is defined).

### `sources`

- **Type**: `Array<ToolchainTemplateSource>`

Extra sources on top of the builtin + registry sources.

#### `type`

- **Type**: `'builtin' | 'local' | 'npm' | 'git' | 'vite-plus'`
- **Required**

How to load the source.

#### `locate`

- **Type**: `string`
- **Required**

A builtin id, local dir, npm scope, git URL or Vite+ id.

#### `id`

- **Type**: `string`

Stable id (defaults to the basename/scope).

#### `name`

- **Type**: `string`

Display name override.

#### `description`

- **Type**: `string`

Description override.

#### `kind`

- **Type**: `'project' | 'workspace' | 'application' | 'folder' | 'tooling' | 'pipeline'`

What the template produces.

#### `ref`

- **Type**: `string`

Git branch/tag/commit.

#### `subdir`

- **Type**: `string`

Subdirectory within the source that holds the template.

#### `tags`

- **Type**: `Array<string>`

Free-form tags.

#### `online`

- **Type**: `boolean`

Whether the source needs network access.

## `vite`

The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.

### `config`

- **Type**: `boolean`

Write the managed `vite.config.ts` (default true).

## `watch`

Watch behaviour for `dbx watch`.

### `enabled`

- **Type**: `boolean`

Watch by default (enabled when the section is defined).

### `debounce`

- **Type**: `number`

Debounce window in ms (default 150).

## `logger`

Logging level, colours and prefix for toolchain output.

### `level`

- **Type**: `'debug' | 'info' | 'warn' | 'error' | 'silent'`

Minimum level to print (default `info`).

### `color`

- **Type**: `boolean`

Force colours on/off (default: on; `--no-color` disables).

### `name`

- **Type**: `string`

Prefix non-indented lines with `<name>:` (default `dbx`).

## `providers`

Provider command behaviour (eg. colour for the provider passthrough commands).

### `color`

- **Type**: `boolean`

Force provider command colours on/off (default: inherit the logger).

## Full example

```ts
import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: { type: 'monorepo-root', name: 'acme', scope: '@acme' },
        changelog: { workflows: { ci: true, release: true }, branches: { main: 'main' } },
        tsconfig: { refs: true },
        templates: { sources: [{ type: 'local', locate: './templates', kind: 'application' }] },
        vite: { fmt: { semi: true, singleQuote: true }, test: { include: ['src/**/*.test.ts'] } },
        watch: { debounce: 150 },
    },
});
```
