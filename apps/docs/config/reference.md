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

- **Type**: `ProjectType`
- **Default**: `{}`

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
- **Default**: `{}`

### `branches`

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
- **Default**: `{}`

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

Force colours on/off (default: auto).

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
