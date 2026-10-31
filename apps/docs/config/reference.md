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

- **Type**: `'monorepo-root' | 'monorepo-workspace' | 'project'`

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

Inherit the parent project metadata (default true). Set false to keep this project metadata independent of the root config (other sections still merge normally).

## `ci`

GitHub Actions workflows to generate (CI, release, issues, changelog, sync).

### `ci`

- **Type**: `WorkflowSetting`

The CI checks workflow (`ci.yml`).

#### `pushBranches`

- **Type**: `Array<string>`

Replace `on.push.branches`.

#### `pullRequestBranches`

- **Type**: `Array<string>`

Replace `on.pull_request.branches`.

#### `triggers`

- **Type**: `Record<string, unknown>`

Extra `on.*` triggers.

#### `extra`

- **Type**: `Record<string, unknown>`

Extra top-level keys (`permissions`, `concurrency`, `env`, ...).

#### `steps`

- **Type**: `WorkflowStepsConfig | Array<WorkflowStepsConfig>`

Extra steps for a job (one group, or per-job groups).

##### `job`

- **Type**: `string`

Target job id (defaults to the primary/first job).

##### `before`

- **Type**: `Array<WorkflowStep>`

Steps inserted at the start.

###### `name`

- **Type**: `string`

Step display name.

###### `id`

- **Type**: `string`

Step id (for `steps.<id>` outputs).

###### `if`

- **Type**: `string`

Conditional expression (`if:`).

###### `uses`

- **Type**: `string`

Action to run (`uses:`), eg. `actions/checkout@v4`.

###### `run`

- **Type**: `string`

Shell command(s) to run (`run:`).

###### `shell`

- **Type**: `string`

Shell to run `run` in, eg. `bash`.

###### `working-directory`

- **Type**: `string`

Directory the step runs in.

###### `with`

- **Type**: `Record<string, string | number | boolean>`

Inputs for a `uses` action.

###### `env`

- **Type**: `Record<string, string>`

Environment variables for the step.

##### `after`

- **Type**: `Array<WorkflowStep>`

Steps appended at the end.

#### `jobs`

- **Type**: `Record<string, unknown>`

Extra complete jobs merged in.

#### `tokens`

- **Type**: `Record<string, string | number | boolean>`

Per-workflow token overrides (`nodeVersion`, `packageManager`, ...).

#### `filename`

- **Type**: `string`

Override the generated workflow file name (eg. `deploy.yml`).

#### `dir`

- **Type**: `string`

Directory for the workflow file (default `.github/workflows`).

#### `enabled`

- **Type**: `boolean`

Enable/disable this workflow (default: enabled when present).

### `changelog`

- **Type**: `ChangelogWorkflowSetting`

The changelog/version workflow (`changelog.yml`) plus the changelog pipeline config (versioning, VS Code settings, commitlint).

#### `pushBranches`

- **Type**: `Array<string>`

Replace `on.push.branches`.

#### `pullRequestBranches`

- **Type**: `Array<string>`

Replace `on.pull_request.branches`.

#### `triggers`

- **Type**: `Record<string, unknown>`

Extra `on.*` triggers.

#### `extra`

- **Type**: `Record<string, unknown>`

Extra top-level keys (`permissions`, `concurrency`, `env`, ...).

#### `steps`

- **Type**: `WorkflowStepsConfig | Array<WorkflowStepsConfig>`

Extra steps for a job (one group, or per-job groups).

#### `jobs`

- **Type**: `Record<string, unknown>`

Extra complete jobs merged in.

#### `tokens`

- **Type**: `Record<string, string | number | boolean>`

Per-workflow token overrides (`nodeVersion`, `packageManager`, ...).

#### `filename`

- **Type**: `string`

Override the generated workflow file name (eg. `deploy.yml`).

#### `dir`

- **Type**: `string`

Directory for the workflow file (default `.github/workflows`).

#### `enabled`

- **Type**: `boolean`

Enable/disable the changelog workflow and pipeline (default: enabled when present).

#### `branches`

- **Type**: `ChangelogBranchesConfig`

Branches the generated workflows target.

##### `main`

- **Type**: `string | Array<string>`

Branch glob(s) the CI + release workflows run on, and the release PR base (default `["main"]`).

##### `dev`

- **Type**: `string | Array<string>`

Branch glob(s) the changelog/version workflow runs on. No default: when omitted it reuses `main` (so a single-branch repo needs no `dev`).

#### `commitlint`

- **Type**: `boolean | ChangelogCommitlintConfig`

commitlint config; set `false` to disable the Conventional-Commits pipeline.

##### `dir`

- **Type**: `string`

Directory the generated `commitlint.config.mjs` is written to (default: the project root). The husky hook and CI use `--config` to point at it.

##### `types`

- **Type**: `Array<string>`

Allowed commit types (commitlint).

##### `scopes`

- **Type**: `Array<string>`

Allowed commit scopes (commitlint).

##### `enabled`

- **Type**: `boolean`

Enable commitlint (default true when the changelog is enabled). Set false to generate changelogs without the Conventional-Commits pipeline.

#### `versioning`

- **Type**: `ChangelogVersioning`

Automatic version bumping on changelog generation (default `true`).

##### `target`

- **Type**: `'uniform' | 'root-only' | 'individual'`

`uniform` bumps the root and every workspace to one shared version; `root-only` bumps the root only; `individual` bumps each changed workspace independently (default `uniform`).

##### `workspaces`

- **Type**: `Array<string>`

Glob patterns selecting the workspaces to version (relative to the root). Defaults to the root `package.json` `workspaces` field; when there is none the root `package.json` is used on its own.

##### `bump`

- **Type**: `Record<string, unknown>`

Custom bump rules for major/minor/patch (matchers or callbacks).

##### `allowOverBump`

- **Type**: `boolean`

Apply a bump once per matching change instead of once per run (default false).

##### `commit`

- **Type**: `unknown`

Commit message formatting/credit options or callback.

##### `provider`

- **Type**: `unknown`

`default`, `changesets`, a provider id, or a custom provider/callback.

#### `vscode`

- **Type**: `boolean`

Write the Conventional-Commits VS Code settings (default true).

### `release`

- **Type**: `WorkflowSetting`

The release workflow (`release.yml`).

### `issues`

- **Type**: `WorkflowSetting`

The issue-title workflow (`issues.yml`).

### `sync`

- **Type**: `WorkflowSetting`

The toolchain sync workflow (`sync.yml`).

### `custom`

- **Type**: `Record<string, CustomWorkflowSettings>`

Additional custom workflows, keyed by id (eg. `custom.my-workflow`). Each id writes `<dir>/<filename ?? id>.yml`.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `changelog`

Manual `toolchain.changelog` pipeline config for `dbx changelog`, the VS Code actions and the API; `ci.changelog` inherits these options.

### `commitlint`

- **Type**: `boolean | ChangelogCommitlintConfig`

commitlint config; set `false` to disable the Conventional-Commits pipeline.

#### `dir`

- **Type**: `string`

Directory the generated `commitlint.config.mjs` is written to (default: the project root). The husky hook and CI use `--config` to point at it.

#### `types`

- **Type**: `Array<string>`

Allowed commit types (commitlint).

#### `scopes`

- **Type**: `Array<string>`

Allowed commit scopes (commitlint).

#### `enabled`

- **Type**: `boolean`

Enable commitlint (default true when the changelog is enabled). Set false to generate changelogs without the Conventional-Commits pipeline.

### `versioning`

- **Type**: `ChangelogVersioning`

Automatic version bumping on changelog generation (default `true`).

#### `target`

- **Type**: `'uniform' | 'root-only' | 'individual'`

`uniform` bumps the root and every workspace to one shared version; `root-only` bumps the root only; `individual` bumps each changed workspace independently (default `uniform`).

#### `workspaces`

- **Type**: `Array<string>`

Glob patterns selecting the workspaces to version (relative to the root). Defaults to the root `package.json` `workspaces` field; when there is none the root `package.json` is used on its own.

#### `bump`

- **Type**: `Record<string, unknown>`

Custom bump rules for major/minor/patch (matchers or callbacks).

#### `allowOverBump`

- **Type**: `boolean`

Apply a bump once per matching change instead of once per run (default false).

#### `commit`

- **Type**: `unknown`

Commit message formatting/credit options or callback.

#### `provider`

- **Type**: `unknown`

`default`, `changesets`, a provider id, or a custom provider/callback.

### `vscode`

- **Type**: `boolean`

Write the Conventional-Commits VS Code settings (default true).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `fmt`

Formatter configuration: Oxc/Biome configs, editor defaults and source-tool options.

### `vscode`

- **Type**: `boolean | ToolchainVscodeSettings`

Add project-scoped VS Code settings: `true`/`false` or `{ overrides, exclude }` (default false; existing keys are kept).

#### `overrides`

- **Type**: `Record<string, unknown>`

Settings deep-merged over the generated editor defaults.

#### `exclude`

- **Type**: `Array<string>`

Exact setting keys (eg. `editor.defaultFormatter`) to omit.

### `oxc`

- **Type**: `Record<string, unknown>`

Oxfmt options. `toolchain.vite.fmt` overrides these (deep merge).

### `biome`

- **Type**: `Record<string, unknown>`

Biome formatter options (merged into the generated `biome.json`).

### `prettier`

- **Type**: `Record<string, unknown>`

Prettier options (editor defaults/migrations).

### `dprint`

- **Type**: `Record<string, unknown>`

Dprint options (editor defaults/migrations).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `lint`

Linter configuration: Oxc/Biome configs, editor defaults and ESLint options.

### `vscode`

- **Type**: `boolean | ToolchainVscodeSettings`

Add project-scoped VS Code settings: `true`/`false` or `{ overrides, exclude }` (default false; existing keys are kept).

#### `overrides`

- **Type**: `Record<string, unknown>`

Settings deep-merged over the generated editor defaults.

#### `exclude`

- **Type**: `Array<string>`

Exact setting keys (eg. `editor.defaultFormatter`) to omit.

### `oxc`

- **Type**: `Record<string, unknown>`

Oxlint options. `toolchain.vite.lint` overrides these (deep merge).

### `biome`

- **Type**: `Record<string, unknown>`

Biome linter options (merged into the generated `biome.json`).

### `eslint`

- **Type**: `Record<string, unknown>`

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

Deep-merged over the generated `biome.json` (arrays union).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `tsconfig`

Workspace tsconfig generation (path aliases + project references).

### `glob`

- **Type**: `string | Array<string>`

Glob(s) for the workspace default tsconfig files. Defaults to matching every `defaultFile` recursively.

### `exclude`

- **Type**: `string | Array<string>`

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

### `baseFile`

- **Type**: `string`

The root base tsconfig file name (default `tsconfig.base.json`).

### `extends`

- **Type**: `object`

Per-file `extends` overrides for generated/scaffolded tsconfig templates.

#### `base`

- **Type**: `string | Array<string> | false`

`extends` written into scaffolded `tsconfig.base.json` files (or `false` to remove the field).

#### `default`

- **Type**: `string | Array<string> | false`

`extends` written into scaffolded `tsconfig.default.json` files (or `false` to remove the field).

#### `build`

- **Type**: `string | Array<string> | false`

`extends` written into scaffolded `tsconfig.build.json` files. Default `./tsconfig.default.json`; use `./tsconfig.json` to let builds reuse the path aliases (at the cost of pulling workspace source into the build).

### `overrides`

- **Type**: `ToolchainTsconfigOverrides`

Managed overrides deep-merged into the base/root/default/build tsconfig files during sync. The originals are snapshotted in the manifest, so removing a key reverts it (restoring the original value when the file defined one).

#### `base`

- **Type**: `Record<string, unknown>`

Deep-merged into the root base tsconfig (`baseFile`) during sync.

#### `default`

- **Type**: `Record<string, unknown>`

Deep-merged into every workspace default tsconfig (`defaultFile`) during sync.

#### `build`

- **Type**: `Record<string, unknown>`

Deep-merged into every workspace build tsconfig (`buildFile`) during sync.

#### `root`

- **Type**: `Record<string, unknown>`

Deep-merged into the root workspaces tsconfig (`rootFile`) during sync.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `templates`

Template sources / scaffolding.

### `sources`

- **Type**: `Array<ToolchainTemplateSource>`

Extra sources on top of the builtin + registry sources.

#### `type`

- **Required**
- **Type**: `'builtin' | 'local' | 'npm' | 'git' | 'vite-plus' | 'remote'`

How to load the source.

#### `locate`

- **Required**
- **Type**: `string`

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

#### `registry`

- **Type**: `string`

Custom npm registry URL (default: the project package manager registry).

#### `subdir`

- **Type**: `string`

Subdirectory within the source that holds the template.

#### `tags`

- **Type**: `Array<string>`

Free-form tags.

#### `online`

- **Type**: `boolean`

Whether the source needs network access.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `registry`

Registry source allow/deny policies (templates + providers).

### `templates`

- **Type**: `ToolchainRegistryPolicy`

Allow/deny globs for template sources and registries.

#### `allow`

- **Type**: `Array<string>`

Allowed host/path globs. When non-empty, only matching sources are used (eg. `*.example.com`, `https://registry.example.com/**`).

#### `deny`

- **Type**: `Array<string>`

Denied host/path globs (checked before `allow`).

### `providers`

- **Type**: `ToolchainRegistryPolicy`

Allow/deny globs for provider sources and registries.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `catalogs`

Package catalogs written to the package manager catalog file (`catalog:`).

### `packages`

- **Type**: `Record<string, string>`

The default catalog: package name -> version range.

### `named`

- **Type**: `Record<string, Record<string, string>>`

Named catalogs (Yarn `catalogs:` / pnpm `catalogs:`): name -> packages.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

## `vite`

The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.

### `config`

- **Type**: `boolean | string`

Write the managed Vite config (default true). A string sets its file name/path (relative to the project, or absolute).

### `shim`

- **Type**: `'runtime' | 'static'`

How the generated `vite.config.ts` is rendered. `runtime` (default) loads the config from `dbx.config.*`; `static` serializes it into the file so the shim does not import `@deltabox/toolchain` (it then needs no built `dist`).

### `shimImport`

- **Type**: `string`

Module specifier used to import `resolveVite` in runtime shims (default `@deltabox/toolchain/vite`). A relative path is resolved from the repo root and rewritten relative to each generated config - useful for dogfooding a source checkout without a built `dist`.

### `fmt`

- **Type**: `boolean | Record<string, unknown>`

Oxfmt options; `true` uses the toolchain defaults.

### `lint`

- **Type**: `boolean | Record<string, unknown>`

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

- **Type**: `string | Array<string>`

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

- **Type**: `'debug' | 'info' | 'warn' | 'error' | 'silent'`

Minimum level to print (default `info`).

### `color`

- **Type**: `boolean`

Force colours on/off (default: on; `--no-color` disables).

### `name`

- **Type**: `string`

Prefix non-indented lines with `<name>:` (default `dbx`).

### `suppress`

- **Type**: `string | Array<string>`

Warning/error id, message substring, or `/regex/` to silence (single value or array).

### `logger`

- **Type**: `unknown`

Custom `ToolchainLogger` implementation (TS/JS configs only; JSON cannot carry functions).

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
