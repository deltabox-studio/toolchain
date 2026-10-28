---
title: dbx.config
outline: [2, 3, 4]
---

# dbx.config

A `dbx.config.ts` file exports `{ toolchain: { ...sections } }`: the
`@deltabox/toolchain` settings live under the `toolchain` key. Every
section is **opt-in by presence** (see [Configuration](/guide/config/opt-in-by-presence)):
define it to enable it, omit it to leave that area untouched.

> Generated from the Zod config schema — do not edit by hand.
> Run `yarn config:generate`.

## `project`

Project metadata: canonical `package.json` fields and template tokens (shared fields are inherited by workspaces).

### `type`

- **Type**: `any`
- **Default**: `{}`

The project kind (detected when omitted).

### `name`

- **Type**: `string`

The unscoped project name (written as `<scope>/<name>`).

### `scope`

- **Type**: `string`

The npm scope, eg. `@acme`.

### `author`

- **Type**: `string`

Package author (`package.json` `author`).

### `license`

- **Type**: `string`

SPDX license id (`package.json` `license`).

### `homepage`

- **Type**: `string`

Project homepage (`package.json` `homepage`).

### `repo`

- **Type**: `string`

Repository URL (`package.json` `repository`). For a workspace it also resolves to the workspace path (`repository.directory`).

### `nodeVersion`

- **Type**: `string`

Node version for CI/templates, eg. `22` (not `package.json` `engines`).

### `packageManager`

- **Type**: `string`

Package manager name, written as `<name>@<version>` (default `yarn`).

### `packageManagerVersion`

- **Type**: `string`

Package manager version, eg. `4.17.1`.

### `description`

- **Type**: `string`

One-line description (`package.json` `description`).

### `inherit`

- **Type**: `boolean`

Inherit the parent project metadata (default true). Set false to keep this project entirely independent of the root config.

## `ci`

GitHub Actions workflows to generate (CI, release, issues, changelog, sync).

### `ci`

- **Type**: `any`
- **Default**: `{}`

The CI checks workflow (`ci.yml`).

### `changelog`

- **Type**: `any`
- **Default**: `{}`

The changelog/version workflow (`changelog.yml`) plus the changelog pipeline config (versioning, VS Code settings, commitlint).

### `release`

- **Type**: `any`
- **Default**: `{}`

The release workflow (`release.yml`).

### `issues`

- **Type**: `any`
- **Default**: `{}`

The issue-title workflow (`issues.yml`).

### `sync`

- **Type**: `any`
- **Default**: `{}`

The toolchain sync workflow (`sync.yml`).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `fmt`

Formatter configuration: Oxc/Biome configs, editor defaults and source-tool options.

### `vscode`

- **Type**: `any`
- **Default**: `{}`

Add project-scoped VS Code settings: `true`/`false` or `{ overrides, exclude }` (default false; existing keys are kept).

### `oxc`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

Oxfmt options. `toolchain.vite.fmt` overrides these (deep merge).

### `biome`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

Biome formatter options (merged into the generated `biome.json`).

### `prettier`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

Prettier options (editor defaults/migrations).

### `dprint`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

Dprint options (editor defaults/migrations).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `lint`

Linter configuration: Oxc/Biome configs, editor defaults and ESLint options.

### `vscode`

- **Type**: `any`
- **Default**: `{}`

Add project-scoped VS Code settings: `true`/`false` or `{ overrides, exclude }` (default false; existing keys are kept).

### `oxc`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

Oxlint options. `toolchain.vite.lint` overrides these (deep merge).

### `biome`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

Biome linter options (merged into the generated `biome.json`).

### `eslint`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

ESLint options (editor defaults/migrations).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `biome`

Biome config generation (for consumers that still want a `biome.json`).

- **Deprecated**: use `toolchain.fmt.biome` / `toolchain.lint.biome`. Still writes `biome.json`.

### `vscode`

- **Type**: `boolean`

Write the Biome VS Code settings (default true).

### `overrides`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

Deep-merged over the generated `biome.json` (arrays union).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `tsconfig`

Workspace tsconfig generation (path aliases + project references).

### `glob`

- **Type**: `any`
- **Default**: `{}`

Glob(s) for the workspace default tsconfig files. Defaults to matching every `defaultFile` recursively.

### `exclude`

- **Type**: `any`
- **Default**: `{}`

Glob(s) to exclude from `glob`. Defaults to the common ignored paths (`node_modules`, `.dbx`, `dist`, `build`, ...).

### `gitignore`

- **Type**: `boolean`

Also respect `.gitignore` files (root + nested) when matching `glob` (default true).

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

The workspaces tsconfig file name that holds `paths` + `references` (default `tsconfig.workspaces.json`).

### `defaultFile`

- **Type**: `string`

The workspace default tsconfig file name that the generator expands (default `tsconfig.default.json`).

### `buildFile`

- **Type**: `string`

The workspace build tsconfig file name (default `tsconfig.build.json`).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `templates`

Template sources / scaffolding.

### `sources`

- **Type**: `Array<any>`

Extra sources on top of the builtin + registry sources.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `registry`

Registry source allow/deny policies (templates + providers).

### `templates`

- **Type**: `any`
- **Default**: `{}`

Allow/deny globs for template sources and registries.

### `providers`

- **Type**: `any`
- **Default**: `{}`

Allow/deny globs for provider sources and registries.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `catalogs`

Package catalogs written to the package manager catalog file (`catalog:`).

### `packages`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

The default catalog: package name -> version range.

### `named`

- **Type**: `Record<string, unknown>`
- **Default**: `{}`

Named catalogs (Yarn `catalogs:` / pnpm `catalogs:`): name -> packages.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `vite`

The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.

### `config`

- **Type**: `boolean`

Write the managed Vite config (default true). A string sets its file name/path (relative to the project, or absolute).

### `fmt`

- **Type**: `any`
- **Default**: `{}`

Oxfmt options; `true` uses the toolchain defaults.

### `lint`

- **Type**: `any`
- **Default**: `{}`

Oxlint options; `true` uses the toolchain defaults.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `watch`

Watch behaviour for `dbx watch`.

### `debounce`

- **Type**: `number`

Debounce window in ms (default 150).

### `exclude`

- **Type**: `any`
- **Default**: `{}`

Glob(s) excluded from watching. Defaults to the common ignored paths (`node_modules`, `.dbx`, `dist`, `build`, ...).

### `gitignore`

- **Type**: `boolean`

Also respect `.gitignore` files (root + nested) when watching (default true).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `logger`

Logging level, colours and prefix for toolchain output.

### `level`

- **Type**: `string`

Minimum level to print (default `info`).

### `color`

- **Type**: `boolean`

Force colours on/off (default: on; `--no-color` disables).

### `name`

- **Type**: `string`

Prefix non-indented lines with `<name>:` (default `dbx`).

### `suppress`

- **Type**: `any`
- **Default**: `{}`

Warning/error id, message substring, or `/regex/` to silence (single value or array).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `providers`

Provider command behaviour (eg. colour for the passthrough commands).

### `color`

- **Type**: `boolean`

Force provider command colours on/off (default: inherit the logger).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## Full example

```ts [dbx.config.ts]
import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: { type: 'monorepo-root', name: 'acme', scope: '@acme' },
        ci: { ci: true, release: true, changelog: { branches: { main: 'main' } } },
        tsconfig: { refs: true },
        templates: { sources: [{ type: 'local', locate: './templates', kind: 'application' }] },
        vite: { fmt: { semi: true, singleQuote: true }, test: { include: ['src/**/*.test.ts'] } },
        watch: { debounce: 150 },
    },
});
```
