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

## `enabled`

Enable/disable the toolchain. The shorthand is workspace-scoped; the object form is reserved for APIs and the VS Code extension.

## `project`

Project metadata: canonical `package.json` fields and template tokens (shared fields are inherited by workspaces).

### `type`

- **Type**: `'monorepo-root' | 'monorepo-workspace' | 'project'`

The project kind (detected when omitted).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

### `manageConfigless`

- **Type**: `boolean`

Manage projects that have no dbx.config.* of their own by inheriting the nearest ancestor config (default false). Disabled by default so configless projects are never touched unless explicitly opted in.

## `ci`

GitHub Actions workflows to generate (CI, release, issues, changelog, sync).

### `ci`

- **Type**: `WorkflowSetting`

The CI checks workflow (`ci.yml`).

#### `provider`

- **Required**
- **Type**: `'github'`

Workflow vendor for a full `workflow` object (default `github`).

#### `workflow`

- **Required**
- **Type**: `AzurePipelines`
- **See**: https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/

The complete pipeline object.

#### `filename`

- **Type**: `string`

Override the generated workflow file name (eg. `deploy.yml`).

#### `dir`

- **Type**: `string`

Directory for the workflow file (default `.github/workflows`).

#### `setup`

- **Type**: `boolean`

Inject the shared checkout/Node/Corepack/install steps into custom workflow jobs (default false; built-in workflows already include them).

#### `enabled`

- **Type**: `boolean`

Enable/disable this workflow (default: enabled when present).

#### `pushBranches`

- **Type**: `Array<string>`

Replace `on.push.branches`.

#### `pullRequestBranches`

- **Type**: `Array<string>`

Replace `on.pull_request.branches`.

#### `triggers`

- **Type**: `WorkflowTriggers`

Extra `on.*` workflow triggers.

##### `push`

- **Type**: `JsonObject`

Push trigger (`on.push`).

##### `pull_request`

- **Type**: `JsonObject`

Pull-request trigger (`on.pull_request`).

##### `pull_request_target`

- **Type**: `JsonObject`

Pull-request-target trigger (`on.pull_request_target`).

##### `workflow_dispatch`

- **Type**: `JsonObject`

Manual trigger (`on.workflow_dispatch`).

##### `workflow_call`

- **Type**: `JsonObject`

Reusable workflow trigger (`on.workflow_call`).

##### `workflow_run`

- **Type**: `JsonObject`

Triggered by another workflow (`on.workflow_run`).

##### `schedule`

- **Type**: `Array<JsonObject>`

Scheduled trigger list (`on.schedule`).

##### `release`

- **Type**: `JsonObject`

Release trigger (`on.release`).

#### `extra`

- **Type**: `WorkflowExtra`

Extra top-level workflow keys (`permissions`, `concurrency`, `env`, ...).

##### `permissions`

- **Type**: `Record<string, string>`

Workflow permissions.

##### `concurrency`

- **Type**: `string | object`

Workflow concurrency.

###### `group`

- **Required**
- **Type**: `string`

Concurrency group.

###### `cancel-in-progress`

- **Type**: `boolean | string`

Cancel in-progress runs (boolean or expression).

##### `env`

- **Type**: `Record<string, string>`

Workflow environment variables.

##### `defaults`

- **Type**: `object`

Default settings for `run` steps.

###### `run`

- **Type**: `object`

###### `shell`

- **Type**: `string`

Default shell.

###### `working-directory`

- **Type**: `string`

Default working directory.

##### `name`

- **Type**: `string`

Workflow name.

##### `run-name`

- **Type**: `string`

Workflow run name.

##### `timeout-minutes`

- **Type**: `number`

Job timeout in minutes.

##### `container`

- **Type**: `JsonObject`

Container for the job.

##### `strategy`

- **Type**: `JsonObject`

Build matrix / strategy.

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

- **Type**: `Record<string, WorkflowJob>`

Extra complete jobs merged in.

#### `tokens`

- **Type**: `WorkflowTokens`

Per-workflow token overrides (`nodeVersion`, `packageManager`, ...).

##### `name`

- **Type**: `string`

Project name (`{{name}}`).

##### `scope`

- **Type**: `string`

Package scope (`{{scope}}`).

##### `author`

- **Type**: `string`

Author (`{{author}}`).

##### `license`

- **Type**: `string`

License (`{{license}}`).

##### `homepage`

- **Type**: `string`

Homepage (`{{homepage}}`).

##### `repo`

- **Type**: `string`

Repository URL (`{{repo}}`).

##### `description`

- **Type**: `string`

Description (`{{description}}`).

##### `nodeVersion`

- **Type**: `string`

Node version (`{{nodeVersion}}`).

##### `packageManager`

- **Type**: `string`

Package manager (`{{packageManager}}`).

##### `yarnVersion`

- **Type**: `string`

Yarn version (`{{yarnVersion}}`).

##### `packageManagerVersion`

- **Type**: `string`

Package manager version (`{{packageManagerVersion}}`).

##### `mainBranch`

- **Type**: `string`

Main branch (`{{mainBranch}}`).

##### `devBranch`

- **Type**: `string`

Dev branch (`{{devBranch}}`).

##### `vitePlus`

- **Type**: `boolean`

Use `voidzero-dev/setup-vp` for this workflow (default: detected from the project).

##### `setupVpVersion`

- **Type**: `string`

Exact `voidzero-dev/setup-vp` version or commit SHA to pin.

#### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

### `changelog`

- **Type**: `ChangelogWorkflowSetting`

The changelog/version workflow (`changelog.yml`) plus the changelog pipeline config (versioning, VS Code settings, commitlint).

#### `provider`

- **Type**: `'github'`

Workflow vendor for a full `workflow` object (default `github`).

#### `pushBranches`

- **Type**: `Array<string>`

Replace `on.push.branches`.

#### `pullRequestBranches`

- **Type**: `Array<string>`

Replace `on.pull_request.branches`.

#### `triggers`

- **Type**: `WorkflowTriggers`

Extra `on.*` workflow triggers.

#### `extra`

- **Type**: `WorkflowExtra`

Extra top-level workflow keys (`permissions`, `concurrency`, `env`, ...).

#### `steps`

- **Type**: `WorkflowStepsConfig | Array<WorkflowStepsConfig>`

Extra steps for a job (one group, or per-job groups).

#### `jobs`

- **Type**: `Record<string, WorkflowJob>`

Extra complete jobs merged in.

#### `tokens`

- **Type**: `WorkflowTokens`

Per-workflow token overrides (`nodeVersion`, `packageManager`, ...).

#### `filename`

- **Type**: `string`

Override the generated workflow file name (eg. `deploy.yml`).

#### `dir`

- **Type**: `string`

Directory for the workflow file (default `.github/workflows`).

#### `setup`

- **Type**: `boolean`

Inject the shared checkout/Node/Corepack/install steps into custom workflow jobs (default false; built-in workflows already include them).

#### `enabled`

- **Type**: `boolean`

Enable/disable the changelog workflow and pipeline (default: enabled when present).

#### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

##### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

#### `versioning`

- **Type**: `ChangelogVersioning`

Automatic version bumping on changelog generation (default `true`).

##### `target`

- **Type**: `'uniform' | 'root-only' | 'individual'`

`uniform` bumps the root and every workspace to one shared version; `root-only` bumps the root only; `individual` bumps each changed workspace independently (default `uniform`).

##### `workspaces`

- **Type**: `Array<string>`

Glob patterns selecting the workspaces to version (relative to the root). Defaults to the root `package.json` `workspaces` field; when there is none the root `package.json` is used on its own.

##### `prerelease`

- **Type**: `string | ChangelogTargetedPrerelease | Array<ChangelogTargetedPrerelease>`

The prerelease tag globally, or per-target via `{ target, options }`.

###### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

###### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

###### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

###### `options`

- **Required**
- **Type**: `string`

Opt into a prerelease cycle (eg. `beta`, `rc`). Stable versions bump their core and start at `<tag>.0`; existing prereleases keep their core and increment the counter for the same tag, so the suffix is never appended twice.

##### `bump`

- **Type**: `object`

Custom bump rules for major/minor/patch (matchers or callbacks), globally or per-target via `{ target, options }`.

###### `major`

- **Type**: `ChangelogBumpRule | ChangelogTargetedBump | Array<ChangelogTargetedBump>`

A bump rule globally, or per-target via `{ target, include, exclude, options }`.

###### `breaking`

- **Type**: `boolean`

Match only commits whose breaking state equals this value.

###### `type`

- **Type**: `string`

Match this Conventional-Commits type.

###### `types`

- **Type**: `Array<string>`

Match any of these CC types.

###### `scope`

- **Type**: `string`

Match this Conventional-Commits scope.

###### `scopes`

- **Type**: `Array<string>`

Match any of these CC scopes.

###### `pattern`

- **Type**: `string`

Match this regular expression.

###### `match`

- **Type**: `string`

Match this substring.

###### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

###### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

###### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

###### `options`

- **Required**
- **Type**: `ChangelogBumpRule`

A bump rule: a matcher/callback or a list of matchers/callbacks.

###### `minor`

- **Type**: `ChangelogBumpRule | ChangelogTargetedBump | Array<ChangelogTargetedBump>`

A bump rule globally, or per-target via `{ target, include, exclude, options }`.

###### `patch`

- **Type**: `ChangelogBumpRule | ChangelogTargetedBump | Array<ChangelogTargetedBump>`

A bump rule globally, or per-target via `{ target, include, exclude, options }`.

##### `allowOverBump`

- **Type**: `boolean | ChangelogTargetedAllowOverBump | Array<ChangelogTargetedAllowOverBump>`

Enable over-bumping globally, or per-target via `{ target, options }`.

###### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

###### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

###### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

###### `options`

- **Required**
- **Type**: `boolean`

Apply a bump once per matching change instead of once per run (default false).

##### `commit`

- **Type**: `ChangelogCommitFormatConfig | ChangelogTargetedCommit | Array<ChangelogTargetedCommit>`

Commit formatting globally, or per-target via `{ target, options }`.

###### `author`

- **Type**: `boolean`

Include the `by <author>` credit (default true).

###### `commitSha`

- **Type**: `boolean`

Include the commit hash link (default true).

###### `issues`

- **Type**: `boolean`

Include issue/fixes links (default true).

###### `authorAvatar`

- **Type**: `boolean`

Prefix the author with their GitHub avatar (default false).

###### `format`

- **Type**: `((ctx: ChangelogCommitFormatContext) => string)`

Fully custom commit line formatter (TS/JS configs only; return the bullet body).

###### `details`

- **Type**: `ChangelogDetailsConfig`

Wrap changelog sections/text in markdown `<details>` collapsibles. `true` enables descriptions, release notes, breaking changes and type sections; use an object or `false` to opt out.

###### `enabled`

- **Type**: `boolean`

Enable/disable details wrapping (default true).

###### `lifecycle`

- **Required**
- **Type**: `'after' | 'before'`
- **Default**: `"after"`

Apply details after the changelog formatting pipeline (default `after`, so custom searches regex-match the formatted text) or before it (`before`).

###### `minCommits`

- **Type**: `number`

Default minimum entries for every details section (a nested minCommits wins; the body defaults to 10).

###### `descriptions`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap commit description paragraphs in a nested collapsible (default true).

###### `title`

- **Type**: `string`

Custom `<summary>` text.

###### `expanded`

- **Type**: `boolean`

Render the collapsible open by default.

###### `minCommits`

- **Type**: `number`

Minimum entries in the section before wrapping (nested overrides the top-level default).

###### `body`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the version body in a collapsible titled Release Notes (default outside release mode; requires 10 commits by default).

###### `releaseNotes`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the release-mode entry in a collapsible titled Release Notes.

###### `intro`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the intro text in a collapsible.

###### `outro`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the outro text in a collapsible.

###### `footer`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the package-changes footer in a collapsible.

###### `breaking`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the breaking-changes section in a collapsible.

###### `types`

- **Type**: `boolean | ChangelogDetailsOptions | Array<string>`

Wrap these CC type sections (all types when `true`; enabled by default).

###### `custom`

- **Type**: `ChangelogDetailsCustom | Array<ChangelogDetailsCustom>`

Wrap matching text (the match or `start` match becomes the summary).

###### `title`

- **Type**: `string`

Custom `<summary>` text.

###### `expanded`

- **Type**: `boolean`

Render the collapsible open by default.

###### `minCommits`

- **Type**: `number`

Minimum entries in the section before wrapping (nested overrides the top-level default).

###### `start`

- **Type**: `RegExp | string`

The opening marker.

###### `end`

- **Type**: `RegExp | string`

The closing marker.

###### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

###### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

###### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

###### `options`

- **Required**
- **Type**: `ChangelogCommitFormatConfig`

Commit message formatting/credit options (with an optional formatter callback).

##### `provider`

- **Type**: `string | ChangelogProviderConfig | ((ctx: ChangelogProviderContext) => string | void) | ChangelogTargetedProvider | Array<ChangelogTargetedProvider>`

The provider globally, or per-target via `{ target, options }`.

###### `id`

- **Required**
- **Type**: `string`

The provider id.

###### `run`

- **Required**
- **Type**: `((ctx: ChangelogProviderContext) => string | void)`

A custom provider callback returning the changelog body (TS/JS configs only).

###### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

###### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

###### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

###### `options`

- **Required**
- **Type**: `string | ChangelogProviderConfig | ((ctx: ChangelogProviderContext) => string | void)`

`default`, `changesets`, a provider id, or a custom provider/callback.

#### `intro`

- **Type**: `ChangelogTextSetting`

Opt-in text inserted at the start of the new changelog entry, globally or for matching targets (workspaces/root).

##### `enabled`

- **Type**: `boolean`

Set false to skip this entry (default true).

##### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

##### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

##### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

##### `content`

- **Required**
- **Type**: `unknown`

Not allowed with `file`.

##### `file`

- **Required**
- **Type**: `string`

Path to a file containing the text (relative to the repository root or absolute). It is read at changelog-generation time.

#### `outro`

- **Type**: `ChangelogTextSetting`

Opt-in text appended to the new changelog entry, globally or for matching targets (workspaces/root).

#### `vscode`

- **Type**: `boolean`

Write the Conventional-Commits VS Code settings (default true).

#### `groups`

- **Type**: `Array<string | ChangelogGroupOptions> | Record<string, string | ChangelogGroupOptions | boolean> | ((ctx: ChangelogGroupsContext) => ChangelogGroupsSetting)`

Conventional-Commits group order/titles: an ordered array of CC types or `{ type, title, order, hidden }`, a type->title/options record, or a callback (TS/JS configs only).

##### `type`

- **Type**: `string`

The CC type (required for object entries in an array).

##### `title`

- **Type**: `string | ((ctx: ChangelogGroupContext) => string)`

Custom heading title (or callback; TS/JS configs only).

##### `order`

- **Type**: `number | ((ctx: ChangelogGroupContext) => number)`

Sort position; lower comes first (or callback; TS/JS configs only).

##### `hidden`

- **Type**: `boolean | ((ctx: ChangelogGroupContext) => boolean)`

Omit this group from the rendered changelog (or callback; TS/JS only).

#### `breaking`

- **Type**: `boolean | 'conventional' | 'any' | object | ((commit: ChangelogBreakingCommit) => boolean)`

How breaking changes are detected: `conventional` (default: a `!` in the CC subject or a `BREAKING CHANGE:` footer), `any` (legacy loose match), `false` (disable), `{ pattern }` / `{ match }`, or a callback (TS/JS configs only).

##### `pattern`

- **Type**: `string`

A regular expression matched against the subject and body.

##### `match`

- **Type**: `string`

A substring matched against the subject and body.

### `release`

- **Type**: `WorkflowSetting`

The release workflow (`release.yml`).

### `issues`

- **Type**: `WorkflowSetting`

The issue-title workflow (`issues.yml`).

### `sync`

- **Type**: `WorkflowSetting`

The toolchain sync workflow (`sync.yml`).

### `dependabot`

- **Type**: `boolean | ToolchainDependabotConfig`
- **See**: https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file

Dependabot version-update automation (`.github/dependabot.yml`).

#### `schedule`

- **Type**: `'daily' | 'weekly' | 'monthly'`
- **Default**: `"weekly"`

Dependabot update interval.

#### `directories`

- **Type**: `Array<string>`
- **Default**: `["/"]`

Directories to scan.

#### `ecosystems`

- **Type**: `Array<string>`
- **Default**: `["github-actions","npm"]`

Package ecosystems. `github-actions` keeps `voidzero-dev/setup-vp` and the other actions up to date.

#### `labels`

- **Type**: `Array<string>`

Labels added to the update PRs.

#### `openPullRequestsLimit`

- **Type**: `number`
- **Default**: `5`

Maximum open update PRs per entry.

#### `groups`

- **Type**: `Record<string, object>`

Dependabot update groups, keyed by group name.

#### `filename`

- **Type**: `string`

Override the generated file name (default `dependabot.yml`).

#### `dir`

- **Type**: `string`

Directory for the config (default `.github`).

#### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

#### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

### `custom`

- **Type**: `Record<string, CustomWorkflowSettings>`

Additional custom workflows, keyed by id (eg. `custom.my-workflow`). Each id writes `<dir>/<filename ?? id>.yml`.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

#### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

### `versioning`

- **Type**: `ChangelogVersioning`

Automatic version bumping on changelog generation (default `true`).

#### `target`

- **Type**: `'uniform' | 'root-only' | 'individual'`

`uniform` bumps the root and every workspace to one shared version; `root-only` bumps the root only; `individual` bumps each changed workspace independently (default `uniform`).

#### `workspaces`

- **Type**: `Array<string>`

Glob patterns selecting the workspaces to version (relative to the root). Defaults to the root `package.json` `workspaces` field; when there is none the root `package.json` is used on its own.

#### `prerelease`

- **Type**: `string | ChangelogTargetedPrerelease | Array<ChangelogTargetedPrerelease>`

The prerelease tag globally, or per-target via `{ target, options }`.

##### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

##### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

##### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

##### `options`

- **Required**
- **Type**: `string`

Opt into a prerelease cycle (eg. `beta`, `rc`). Stable versions bump their core and start at `<tag>.0`; existing prereleases keep their core and increment the counter for the same tag, so the suffix is never appended twice.

#### `bump`

- **Type**: `object`

Custom bump rules for major/minor/patch (matchers or callbacks), globally or per-target via `{ target, options }`.

##### `major`

- **Type**: `ChangelogBumpRule | ChangelogTargetedBump | Array<ChangelogTargetedBump>`

A bump rule globally, or per-target via `{ target, include, exclude, options }`.

###### `breaking`

- **Type**: `boolean`

Match only commits whose breaking state equals this value.

###### `type`

- **Type**: `string`

Match this Conventional-Commits type.

###### `types`

- **Type**: `Array<string>`

Match any of these CC types.

###### `scope`

- **Type**: `string`

Match this Conventional-Commits scope.

###### `scopes`

- **Type**: `Array<string>`

Match any of these CC scopes.

###### `pattern`

- **Type**: `string`

Match this regular expression.

###### `match`

- **Type**: `string`

Match this substring.

###### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

###### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

###### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

###### `options`

- **Required**
- **Type**: `ChangelogBumpRule`

A bump rule: a matcher/callback or a list of matchers/callbacks.

##### `minor`

- **Type**: `ChangelogBumpRule | ChangelogTargetedBump | Array<ChangelogTargetedBump>`

A bump rule globally, or per-target via `{ target, include, exclude, options }`.

##### `patch`

- **Type**: `ChangelogBumpRule | ChangelogTargetedBump | Array<ChangelogTargetedBump>`

A bump rule globally, or per-target via `{ target, include, exclude, options }`.

#### `allowOverBump`

- **Type**: `boolean | ChangelogTargetedAllowOverBump | Array<ChangelogTargetedAllowOverBump>`

Enable over-bumping globally, or per-target via `{ target, options }`.

##### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

##### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

##### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

##### `options`

- **Required**
- **Type**: `boolean`

Apply a bump once per matching change instead of once per run (default false).

#### `commit`

- **Type**: `ChangelogCommitFormatConfig | ChangelogTargetedCommit | Array<ChangelogTargetedCommit>`

Commit formatting globally, or per-target via `{ target, options }`.

##### `author`

- **Type**: `boolean`

Include the `by <author>` credit (default true).

##### `commitSha`

- **Type**: `boolean`

Include the commit hash link (default true).

##### `issues`

- **Type**: `boolean`

Include issue/fixes links (default true).

##### `authorAvatar`

- **Type**: `boolean`

Prefix the author with their GitHub avatar (default false).

##### `format`

- **Type**: `((ctx: ChangelogCommitFormatContext) => string)`

Fully custom commit line formatter (TS/JS configs only; return the bullet body).

##### `details`

- **Type**: `ChangelogDetailsConfig`

Wrap changelog sections/text in markdown `<details>` collapsibles. `true` enables descriptions, release notes, breaking changes and type sections; use an object or `false` to opt out.

###### `enabled`

- **Type**: `boolean`

Enable/disable details wrapping (default true).

###### `lifecycle`

- **Required**
- **Type**: `'after' | 'before'`
- **Default**: `"after"`

Apply details after the changelog formatting pipeline (default `after`, so custom searches regex-match the formatted text) or before it (`before`).

###### `minCommits`

- **Type**: `number`

Default minimum entries for every details section (a nested minCommits wins; the body defaults to 10).

###### `descriptions`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap commit description paragraphs in a nested collapsible (default true).

###### `title`

- **Type**: `string`

Custom `<summary>` text.

###### `expanded`

- **Type**: `boolean`

Render the collapsible open by default.

###### `minCommits`

- **Type**: `number`

Minimum entries in the section before wrapping (nested overrides the top-level default).

###### `body`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the version body in a collapsible titled Release Notes (default outside release mode; requires 10 commits by default).

###### `releaseNotes`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the release-mode entry in a collapsible titled Release Notes.

###### `intro`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the intro text in a collapsible.

###### `outro`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the outro text in a collapsible.

###### `footer`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the package-changes footer in a collapsible.

###### `breaking`

- **Type**: `boolean | ChangelogDetailsOptions`

Wrap the breaking-changes section in a collapsible.

###### `types`

- **Type**: `boolean | ChangelogDetailsOptions | Array<string>`

Wrap these CC type sections (all types when `true`; enabled by default).

###### `custom`

- **Type**: `ChangelogDetailsCustom | Array<ChangelogDetailsCustom>`

Wrap matching text (the match or `start` match becomes the summary).

###### `title`

- **Type**: `string`

Custom `<summary>` text.

###### `expanded`

- **Type**: `boolean`

Render the collapsible open by default.

###### `minCommits`

- **Type**: `number`

Minimum entries in the section before wrapping (nested overrides the top-level default).

###### `start`

- **Type**: `RegExp | string`

The opening marker.

###### `end`

- **Type**: `RegExp | string`

The closing marker.

##### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

##### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

##### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

##### `options`

- **Required**
- **Type**: `ChangelogCommitFormatConfig`

Commit message formatting/credit options (with an optional formatter callback).

#### `provider`

- **Type**: `string | ChangelogProviderConfig | ((ctx: ChangelogProviderContext) => string | void) | ChangelogTargetedProvider | Array<ChangelogTargetedProvider>`

The provider globally, or per-target via `{ target, options }`.

##### `id`

- **Required**
- **Type**: `string`

The provider id.

##### `run`

- **Required**
- **Type**: `((ctx: ChangelogProviderContext) => string | void)`

A custom provider callback returning the changelog body (TS/JS configs only).

##### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

##### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

##### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

##### `options`

- **Required**
- **Type**: `string | ChangelogProviderConfig | ((ctx: ChangelogProviderContext) => string | void)`

`default`, `changesets`, a provider id, or a custom provider/callback.

### `intro`

- **Type**: `ChangelogTextSetting`

Opt-in text inserted at the start of the new changelog entry, globally or for matching targets (workspaces/root).

#### `enabled`

- **Type**: `boolean`

Set false to skip this entry (default true).

#### `target`

- **Type**: `string`

A workspace path relative to the repository root (`.` for the root), or a glob such as `apps/*`. When omitted the entry applies to every target.

#### `include`

- **Type**: `string | Array<string>`

Only apply to workspaces whose repo-relative directory matches one of these globs (tsconfig-style include).

#### `exclude`

- **Type**: `string | Array<string>`

Skip workspaces whose repo-relative directory matches these globs.

#### `content`

- **Required**
- **Type**: `unknown`

Not allowed with `file`.

#### `file`

- **Required**
- **Type**: `string`

Path to a file containing the text (relative to the repository root or absolute). It is read at changelog-generation time.

### `outro`

- **Type**: `ChangelogTextSetting`

Opt-in text appended to the new changelog entry, globally or for matching targets (workspaces/root).

### `vscode`

- **Type**: `boolean`

Write the Conventional-Commits VS Code settings (default true).

### `groups`

- **Type**: `Array<string | ChangelogGroupOptions> | Record<string, string | ChangelogGroupOptions | boolean> | ((ctx: ChangelogGroupsContext) => ChangelogGroupsSetting)`

Conventional-Commits group order/titles: an ordered array of CC types or `{ type, title, order, hidden }`, a type->title/options record, or a callback (TS/JS configs only).

#### `type`

- **Type**: `string`

The CC type (required for object entries in an array).

#### `title`

- **Type**: `string | ((ctx: ChangelogGroupContext) => string)`

Custom heading title (or callback; TS/JS configs only).

#### `order`

- **Type**: `number | ((ctx: ChangelogGroupContext) => number)`

Sort position; lower comes first (or callback; TS/JS configs only).

#### `hidden`

- **Type**: `boolean | ((ctx: ChangelogGroupContext) => boolean)`

Omit this group from the rendered changelog (or callback; TS/JS only).

### `breaking`

- **Type**: `boolean | 'conventional' | 'any' | object | ((commit: ChangelogBreakingCommit) => boolean)`

How breaking changes are detected: `conventional` (default: a `!` in the CC subject or a `BREAKING CHANGE:` footer), `any` (legacy loose match), `false` (disable), `{ pattern }` / `{ match }`, or a callback (TS/JS configs only).

#### `pattern`

- **Type**: `string`

A regular expression matched against the subject and body.

#### `match`

- **Type**: `string`

A substring matched against the subject and body.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

## `fmt`

Formatter configuration: Oxc/Biome configs, editor defaults and source-tool options.

### `vscode`

- **Type**: `boolean | ToolchainVscodeSettings`

Add project-scoped VS Code settings: `true`/`false` or `{ overrides, exclude }` (default false; existing keys are kept).

#### `overrides`

- **Type**: `JsonObject`

Settings deep-merged over the generated editor defaults.

#### `exclude`

- **Type**: `Array<string>`

Exact setting keys (eg. `editor.defaultFormatter`) to omit.

### `oxc`

- **Type**: `boolean | OxfmtConfig`
- **See**: https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html

Oxfmt options (`true` = defaults, `false` = disabled). `toolchain.vite.fmt` overrides these (deep merge).

### `biome`

- **Type**: `boolean | BiomeConfig`
- **See**: https://biomejs.dev/reference/configuration/

Biome formatter options (`true` = defaults, `false` = disabled); merged into the generated `biome.json` (arrays union; `$remove:`/`$reset` prune or replace them).

### `prettier`

- **Type**: `boolean | PrettierConfig`
- **See**: https://prettier.io/docs/options

Prettier options (`true` = defaults, `false` = disabled).

### `dprint`

- **Type**: `boolean | DprintConfig`
- **See**: https://dprint.dev/config/

Dprint options (`true` = defaults, `false` = disabled).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

## `lint`

Linter configuration: Oxc/Biome configs, editor defaults and ESLint options.

### `vscode`

- **Type**: `boolean | ToolchainVscodeSettings`

Add project-scoped VS Code settings: `true`/`false` or `{ overrides, exclude }` (default false; existing keys are kept).

#### `overrides`

- **Type**: `JsonObject`

Settings deep-merged over the generated editor defaults.

#### `exclude`

- **Type**: `Array<string>`

Exact setting keys (eg. `editor.defaultFormatter`) to omit.

### `oxc`

- **Type**: `boolean | OxlintConfig`
- **See**: https://oxc.rs/docs/guide/usage/linter/config-file-reference.html

Oxlint options (`true` = defaults, `false` = disabled). `toolchain.vite.lint` overrides these (deep merge).

### `biome`

- **Type**: `boolean | BiomeConfig`
- **See**: https://biomejs.dev/reference/configuration/

Biome linter options (`true` = defaults, `false` = disabled); merged into the generated `biome.json` (arrays union; `$remove:`/`$reset` prune or replace them).

### `eslint`

- **Type**: `boolean | EslintConfig`
- **See**: https://eslint.org/docs/latest/use/configure/configuration-files

ESLint options (`true` = defaults, `false` = disabled).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

## `biome`

Biome config generation (for consumers that still want a `biome.json`).

- **Deprecated**: use `toolchain.fmt.biome` / `toolchain.lint.biome`. Still writes `biome.json`.

### `vscode`

- **Type**: `boolean`

Write the Biome VS Code settings (default true).

### `overrides`

- **Type**: `BiomeConfig`
- **See**: https://biomejs.dev/reference/configuration/

Deep-merged over the generated `biome.json` (arrays union; `$remove:`/`$reset` prune or replace them).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

### `auto`

- **Type**: `boolean | ToolchainTsconfigAliasAutoSetting`

Auto-generate the root workspaces tsconfig paths/references from the project graph (default false). Set true to derive them from the project graph; set false to only use the entries you define yourself. An object additionally accepts `include`/`exclude`, `rewriteAlias`, `modes`, `prefix`, `devMode` and `dist`.

#### `include`

- **Type**: `Array<string>`

Only auto-wire entries matching these globs (`auto`: workspace dirs; `aliasAuto`: rewritten alias keys; `refsAuto`: reference paths).

#### `exclude`

- **Type**: `Array<string>`

Skip entries matching these globs (same targets as `include`).

#### `rewriteAlias`

- **Type**: `ToolchainTsconfigAliasRewrite`

Rewrite the alias keys auto-wiring generates (custom keys are preserved). Patterns are URL-rewrite style: a string is a regular-expression source and replacements support `$1`, `$2`, ... capture groups. Examples: `{ "^@acme/(.+)$": "@acme/pkg/$1" }` (string patterns), `[{ pattern: /^@acme\/(.+)$/, replacement: "@acme/pkg/$1" }]` (RegExp patterns), `[{ pattern: ["^@acme/a$", "^@acme/b$"], replacement: "@acme/x" }]` (an array of keys), and an array of such rules (applied in order; the first matching rule wins). `RegExp` patterns are only available from TS/JS configs; JSON configs use string patterns.

#### `modes`

- **Type**: `'auto' | 'exports' | 'project-structure' | Array<'exports' | 'project-structure'>`

Alias discovery: `auto` (exports, then the project structure), `exports` (package.json exports/types/main only), `project-structure` (scan the source tree), or an array combining `exports` and `project-structure`.

#### `prefix`

- **Type**: `'@' | (string & {})`

Prefix for generated aliases instead of the package scope (eg. `@` produces `@/<package>` and `@/<package>/<subpath>`).

#### `devMode`

- **Type**: `boolean`

Resolve generated aliases to source files (default true). Set false to point at the distributed files instead.

#### `dist`

- **Type**: `string`

Output directory used to map source/dist targets (default: the workspace tsconfig's `outDir`, then `dist`).

### `aliasAuto`

- **Type**: `boolean | ToolchainTsconfigAliasAutoSetting`

Auto-generate path aliases (defaults to `auto`; `aliases` must also be enabled). Accepts the same `include`/`exclude`/`rewriteAlias`/`modes`/`prefix`/`devMode`/`dist` object as `auto`.

### `refsAuto`

- **Type**: `boolean | ToolchainTsconfigAutoSetting`

Auto-generate project references (defaults to `auto`; `refs` must also be enabled).

#### `include`

- **Type**: `Array<string>`

Only auto-wire entries matching these globs (`auto`: workspace dirs; `aliasAuto`: rewritten alias keys; `refsAuto`: reference paths).

#### `exclude`

- **Type**: `Array<string>`

Skip entries matching these globs (same targets as `include`).

### `autoSrcDir`

- **Type**: `'src' | '.' | (string & {})`

Source directory used to resolve workspace entry points when `package.json` does not declare `exports`/`main`/`types` (default: the workspace's final tsconfig `rootDir`/`baseUrl`, falling back to `src`).

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

- **Type**: `TsConfigJson`
- **See**: https://www.typescriptlang.org/tsconfig

Deep-merged into the root base tsconfig (`baseFile`) during sync.

#### `default`

- **Type**: `TsConfigJson`
- **See**: https://www.typescriptlang.org/tsconfig

Deep-merged into every workspace default tsconfig (`defaultFile`) during sync.

#### `build`

- **Type**: `TsConfigJson`
- **See**: https://www.typescriptlang.org/tsconfig

Deep-merged into every workspace build tsconfig (`buildFile`) during sync.

#### `root`

- **Type**: `TsConfigJson`
- **See**: https://www.typescriptlang.org/tsconfig

Deep-merged into the root workspaces tsconfig (`rootFile`) during sync.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

## `loader`

How `dbx.config.*` files are imported (tsconfig discovery).

- **See**: https://tsx.is

### `tsconfig`

- **Type**: `boolean | string`
- **Default**: `true`

The tsconfig the config loader uses. `true` selects the nearest `tsconfig.json`; a string selects a different file (relative to the project root); `false` disables tsconfig resolution.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

## `vite`

The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.

### `config`

- **Type**: `boolean | string`

Write the managed Vite config (default true). A string sets its file name/path (relative to the project, or an absolute path inside it).

### `shim`

- **Type**: `'runtime' | 'static'`

How the generated `vite.config.ts` is rendered. `runtime` (default) loads the config from `dbx.config.*`; `static` serializes it into the file so the shim does not import `@deltabox/toolchain` (it then needs no built `dist`).

### `shimImport`

- **Type**: `string`

Module specifier used to import `resolveVite` in runtime shims (default `vite-plugin-dbx`, or the umbrella `@deltabox/toolchain/vite`). A relative path is resolved from the repo root and rewritten relative to each generated config - useful for dogfooding a source checkout without a built `dist`.

### `fmt`

- **Type**: `boolean | OxfmtConfig`
- **See**: https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html

Oxfmt options; `true` uses the toolchain defaults.

### `lint`

- **Type**: `boolean | OxlintConfig`
- **See**: https://oxc.rs/docs/guide/usage/linter/config-file-reference.html

Oxlint options; `true` uses the toolchain defaults.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

## `sync`

`dbx sync` behaviour (formatting of the managed files).

### `format`

- **Type**: `boolean | object`

Opt-in formatting of the managed files after generation (default off). `true` uses the defaults, `false` disables it, and an object tunes `enabled`/`fix`/`command`/`exclude`.

#### `enabled`

- **Type**: `boolean`

Format the managed files after writing them (default true once enabled).

#### `fix`

- **Type**: `boolean`

Rewrite the managed files with the formatter (default true). Set false to run the formatter in check mode instead.

#### `command`

- **Type**: `string`

Override the formatter command. `{files}` expands to the managed files (space-separated); when it is absent the files are appended.

#### `exclude`

- **Type**: `Array<string>`

Globs of managed files to leave unformatted (per-file opt-out).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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

- **Type**: `object`

Custom `ToolchainLogger` implementation (TS/JS configs only; JSON cannot carry functions).

#### `raw`

- **Required**
- **Type**: `(message?: string) => void`

Write raw stdout.

#### `rawError`

- **Required**
- **Type**: `(message?: string) => void`

Write raw stderr.

#### `write`

- **Required**
- **Type**: `(channel: 'out' | 'err', text: string) => void`

Write to a specific output channel.

#### `debug`

- **Required**
- **Type**: `(message?: string) => void`

Print a debug message.

#### `info`

- **Required**
- **Type**: `(message?: string) => void`

Print an info message.

#### `success`

- **Required**
- **Type**: `(message?: string) => void`

Print a success message.

#### `warn`

- **Required**
- **Type**: `(message?: string, id?: string) => void`

Print a warning.

#### `error`

- **Required**
- **Type**: `(message?: string, id?: string) => void`

Print an error.

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

## `providers`

Provider command behaviour (eg. colour for the passthrough commands).

### `color`

- **Type**: `boolean`

Force provider command colours on/off (default: inherit the logger).

### `enabled`

- **Type**: `boolean`

Enable/disable this section (default: enabled when defined).

### `regenerate`

- **Type**: `boolean`

Regenerate this section's managed files during `dbx sync` (default true). When false, existing files are left untouched and are neither written nor drift-checked.

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
