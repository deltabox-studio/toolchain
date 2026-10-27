---
title: CLI reference
outline: [2, 3]
---

# CLI reference

Generated from the same `ToolchainCommand` descriptors the `dbx` binary
registers. Run `yarn config:docs` after changing a command.

| Command                                                 | Description                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [`dbx projects`](#projects)                             | Discover projects and write .dbx/toolchain/projects.json.                                        |
| [`dbx sync`](#sync)                                     | Regenerate every managed file from dbx.config.*.                                                 |
| [`dbx watch`](#watch)                                   | Sync once, then watch key files and re-sync on change.                                           |
| [`dbx reset`](#reset)                                   | Remove generated files, the .dbx/toolchain manifest and/or the dbx config from a project.        |
| [`dbx providers`](#providers)                           | List the tooling providers (Vite+, ...) and their commands.                                      |
| [`dbx tsconfig`](#tsconfig)                             | Generate workspace tsconfig.json files from the default tsconfig (aliases + references).         |
| [`dbx cleanup`](#cleanup)                               | Remove build artifacts (*.tsbuildinfo, dist/).                                                   |
| [`dbx cleanup:turbo`](#cleanup-turbo)                   | Remove the turbo cache (.turbo/).                                                                |
| [`dbx workflow`](#workflow)                             | Trigger one or more generated GitHub workflows (via `gh workflow run`).                          |
| [`dbx changelog`](#changelog)                           | Scan commits, derive the semver bump and update the CHANGELOG.md files + versions.               |
| [`dbx migrate`](#migrate)                               | Migrate Biome / ESLint / Prettier / Dprint config to Oxc, or fold vite.config.* into dbx.config. |
| [`dbx migrate:list`](#migrate-list)                     | List the registered migrations and whether each is detected.                                     |
| [`dbx project:init`](#project-init)                     | Scaffold a single-package TypeScript project.                                                    |
| [`dbx project:init:monorepo`](#project-init-monorepo)   | Scaffold a monorepo root (add --example for one example workspace).                              |
| [`dbx project:init:workspace`](#project-init-workspace) | Scaffold a monorepo workspace package into an existing monorepo root.                            |
| [`dbx project:config`](#project-config)                 | Generate dbx.config.ts for existing projects that are missing one.                               |
| [`dbx template:list`](#template-list)                   | List templates (builtin + local + opted-in online sources).                                      |
| [`dbx template:init`](#template-init)                   | Write a template.json to a directory, making it a local template.                                |
| [`dbx template:add`](#template-add)                     | Record a template source in .dbx/toolchain/templates.json.                                       |
| [`dbx template:remove`](#template-remove)               | Remove a source from .dbx/toolchain/templates.json.                                              |
| [`dbx template:registry`](#template-registry)           | Manage the global template search paths (and sync them to the VS Code setting).                  |
| [`dbx registry`](#registry)                             | List or manage the template/provider registries.                                                 |
| [`dbx template:info`](#template-info)                   | Show one template by id.                                                                         |
| [`dbx create`](#create)                                 | Scaffold a project from a template (builtin, local or Vite+).                                    |
| [`dbx vite`](#vite)                                     | Run any Vite+ command through `vp` (eg. `dbx vite dev`).                                         |
| [`dbx vite:create`](#vite-create)                       | Vite+: Create a new project from a template.                                                     |
| [`dbx vite:migrate`](#vite-migrate)                     | Vite+: Migrate an existing project to Vite+.                                                     |
| [`dbx vite:config`](#vite-config)                       | Vite+: Configure hooks and agent integration.                                                    |
| [`dbx vite:hooks`](#vite-hooks)                         | Vite+: Manage the Git hook dispatcher.                                                           |
| [`dbx vite:staged`](#vite-staged)                       | Vite+: Run linters on staged files.                                                              |
| [`dbx vite:install`](#vite-install)                     | Vite+: Install dependencies with the detected package manager.                                   |
| [`dbx vite:env`](#vite-env)                             | Vite+: Manage Node.js and package managers.                                                      |
| [`dbx vite:dev`](#vite-dev)                             | Vite+: Run the Vite development server.                                                          |
| [`dbx vite:check`](#vite-check)                         | Vite+: Run format, lint and type checks.                                                         |
| [`dbx vite:lint`](#vite-lint)                           | Vite+: Lint code with Oxlint.                                                                    |
| [`dbx vite:fmt`](#vite-fmt)                             | Vite+: Format code with Oxfmt.                                                                   |
| [`dbx vite:test`](#vite-test)                           | Vite+: Run tests through bundled Vitest.                                                         |
| [`dbx vite:run`](#vite-run)                             | Vite+: Run package scripts and monorepo tasks.                                                   |
| [`dbx vite:exec`](#vite-exec)                           | Vite+: Execute a binary from local node_modules.                                                 |
| [`dbx vite:node`](#vite-node)                           | Vite+: Run a Node.js script in the Vite+ env.                                                    |
| [`dbx vite:dlx`](#vite-dlx)                             | Vite+: Run a package binary without installing it.                                               |
| [`dbx vite:cache`](#vite-cache)                         | Vite+: Manage the task cache.                                                                    |
| [`dbx vite:build`](#vite-build)                         | Vite+: Build for production.                                                                     |
| [`dbx vite:pack`](#vite-pack)                           | Vite+: Build libraries for npm or standalone binaries.                                           |
| [`dbx vite:preview`](#vite-preview)                     | Vite+: Preview the production build.                                                             |
| [`dbx vite:add`](#vite-add)                             | Vite+: Add packages to dependencies.                                                             |
| [`dbx vite:remove`](#vite-remove)                       | Vite+: Remove packages from dependencies.                                                        |
| [`dbx vite:update`](#vite-update)                       | Vite+: Update packages.                                                                          |
| [`dbx vite:dedupe`](#vite-dedupe)                       | Vite+: Deduplicate dependencies.                                                                 |
| [`dbx vite:outdated`](#vite-outdated)                   | Vite+: Check for outdated packages.                                                              |
| [`dbx vite:list`](#vite-list)                           | Vite+: List installed packages.                                                                  |
| [`dbx vite:why`](#vite-why)                             | Vite+: Explain why a package is installed.                                                       |
| [`dbx vite:info`](#vite-info)                           | Vite+: View package metadata.                                                                    |
| [`dbx vite:link`](#vite-link)                           | Vite+: Link local packages.                                                                      |
| [`dbx vite:unlink`](#vite-unlink)                       | Vite+: Unlink local packages.                                                                    |
| [`dbx vite:rebuild`](#vite-rebuild)                     | Vite+: Rebuild native modules.                                                                   |
| [`dbx vite:pm`](#vite-pm)                               | Vite+: Forward a command to the package manager.                                                 |
| [`dbx vite:toolchain`](#vite-toolchain)                 | Vite+: Show Vite+ tool versions.                                                                 |
| [`dbx vite:upgrade`](#vite-upgrade)                     | Vite+: Update `vp` itself.                                                                       |
| [`dbx vite:implode`](#vite-implode)                     | Vite+: Remove `vp` and all related data.                                                         |

## `dbx projects`

Discover projects and write .dbx/toolchain/projects.json.

- `--cwd ‹dir›` — Root to scan (default: cwd).
- `--max-depth ‹n›` — Max directory depth. (default: `5`)
- `--no-write` — Do not write the graph file.
- `--json` — Print the graph as JSON.

## `dbx sync`

Regenerate every managed file from dbx.config.*.

- `--cwd ‹dir›` — Project root (default: cwd).
- `-q, --quiet` — Only log errors.
- `--check` — Do not write; fail if files are out of date.
- `--watch` — Keep running and re-sync on change.
- `--recursive` — Sync every discovered dbx project in dependency order.
- `--force` — Run even when no dbx.config.* is present.
- `--json` — Print the sync result (including removed files) as JSON.

## `dbx watch`

Sync once, then watch key files and re-sync on change.

- `--cwd ‹dir›` — Project root (default: cwd).
- `-q, --quiet` — Only log errors.
- `--force` — Run even when no dbx.config.* is present.

## `dbx reset`

Remove generated files, the .dbx/toolchain manifest and/or the dbx config from a project.

- `--cwd ‹dir›` — Project root (default: cwd).
- `--recursive` — Reset every discovered project under the root.
- `--include ‹pattern...›` — Only projects matching these patterns (glob or substring).
- `--exclude ‹pattern...›` — Skip projects matching these patterns (glob or substring).
- `--generated` — Remove only the generated/managed files.
- `--manifest` — Remove only the .dbx/toolchain directory.
- `--config` — Also remove dbx.config.*.
- `--all` — Remove generated files, the manifest and the config.
- `--dry-run` — Report what would be removed without deleting.
- `--json` — Print the result as JSON.

## `dbx providers`

List the tooling providers (Vite+, ...) and their commands.

- `--json` — Print the providers (with actions) as JSON.

## `dbx tsconfig`

Generate workspace tsconfig.json files from the default tsconfig (aliases + references).

- `--cwd ‹dir›` — Repo root to scan (default: cwd).
- `--no-aliases` — Skip path aliases.
- `--composite` — Emit composite + references.
- `--refs` — Wire project references.
- `-i, --indent ‹n›` — JSON indentation.
- `--glob ‹glob...›` — Glob(s) for the default tsconfig files.
- `--exclude ‹glob...›` — Glob(s) to exclude (on top of the common ignored paths).
- `--no-gitignore` — Do not respect .gitignore files.
- `--default-file ‹file›` — Default tsconfig file name.
- `--build-file ‹file›` — Build tsconfig file name.
- `--root-file ‹file›` — Workspaces tsconfig file name.

## `dbx cleanup`

Remove build artifacts (*.tsbuildinfo, dist/).

- `--cwd ‹dir›` — Directory to clean (default: cwd).
- `--pattern ‹glob...›` — Override the match globs.

## `dbx cleanup:turbo`

Remove the turbo cache (.turbo/).

- `--cwd ‹dir›` — Directory to clean (default: cwd).

## `dbx workflow`

Trigger one or more generated GitHub workflows (via `gh workflow run`).

- `[workflows]` — Workflow ids or file names (default: every enabled workflow).
- `--cwd ‹dir›` — Project root (default: cwd).
- `--ref ‹ref›` — Git ref to run the workflow on.
- `--gh ‹cmd›` — The gh executable (default: gh).

## `dbx changelog`

Scan commits, derive the semver bump and update the CHANGELOG.md files + versions.

- `--range ‹range›` — Git revision range to scan.
- `--dry-run` — Print the proposed entry without writing.
- `--version ‹semver›` — Override the version.
- `--base-version ‹semver›` — Bump from this version instead.
- `--processing-method ‹method›` — `latest` (default), `all`, or a git range.
- `--format-only` — Only regroup existing changelogs.
- `--no-package-changes-section` — Skip the package-changes footer.

## `dbx migrate`

Migrate Biome / ESLint / Prettier / Dprint config to Oxc, or fold vite.config.* into dbx.config.

- `--from ‹tool›` — Source tool: biome | eslint | prettier | dprint | vite | all.
- `--to ‹tool›` — Target tool (default: oxc). (default: `oxc`)
- `--cwd ‹dir›` — Project root (default: cwd).
- `--recursive` — Also migrate the discovered projects under the root (default: root only).
- `--write` — Write the files (default: dry-run).
- `--dry-run` — Do not write anything (default).
- `--check` — CI: exit non-zero when the oxc config is stale.
- `--target ‹target›` — files (default) | vite.
- `--online` — Allow network (e.g. @oxlint/migrate).
- `--ignore-vite-config-file` — Do not remove the folded `vite.config.*`.
- `--ignore-managed-files` — Skip the post-migration sync (leave the toolchain-managed files as-is).
- `--ignore-changelog` — Skip the changelog task in the post-migration sync.
- `--json` — Print the result as JSON.

## `dbx migrate:list`

List the registered migrations and whether each is detected.

- `--cwd ‹dir›` — Project root (default: cwd).
- `--json` — Print as JSON.

## `dbx project:init`

Scaffold a single-package TypeScript project.

- `-n, --name ‹name›` — Project name.
- `-s, --scope ‹scope›` — npm scope, eg. @acme.
- `-o, --out ‹dir›` — Output directory (default: cwd).
- `--package-manager ‹pm›` — Package manager: yarn (default) | pnpm | npm | bun.
- `--no-config` — Skip the dbx.config.ts file.
- `--type ‹type›` — Project type: project | monorepo-root | monorepo-workspace.

## `dbx project:init:monorepo`

Scaffold a monorepo root (add --example for one example workspace).

- `-n, --name ‹name›` — Project name.
- `-s, --scope ‹scope›` — npm scope, eg. @acme.
- `-o, --out ‹dir›` — Output directory (default: cwd).
- `--example` — Also scaffold one example workspace package.
- `--package-manager ‹pm›` — Package manager: yarn (default) | pnpm | npm | bun.
- `--no-config` — Skip the dbx.config.ts file.
- `--type ‹type›` — Project type: project | monorepo-root | monorepo-workspace.

## `dbx project:init:workspace`

Scaffold a monorepo workspace package into an existing monorepo root.

- `-n, --name ‹name›` — Workspace package name (unscoped).
- `-s, --scope ‹scope›` — npm scope, eg. @acme.
- `-r, --root ‹dir›` — Monorepo root (default: cwd).
- `-d, --dir ‹dir›` — Workspace dir relative to the root (default: packages/&lt;name&gt;).
- `--package-manager ‹pm›` — Package manager: yarn (default) | pnpm | npm | bun.
- `--no-config` — Skip the dbx.config.ts file.
- `--type ‹type›` — Project type: project | monorepo-root | monorepo-workspace.

## `dbx project:config`

Generate dbx.config.ts for existing projects that are missing one.

- `--cwd ‹dir›` — Root to scan (default: cwd).
- `--include ‹pattern...›` — Only projects matching these patterns (glob or substring).
- `--exclude ‹pattern...›` — Skip projects matching these patterns (glob or substring).
- `--type ‹type›` — Force a project type for every config.
- `--force` — Overwrite configs that already exist.
- `--dry-run` — Report what would be written without writing.
- `--json` — Print the result as JSON.

## `dbx template:list`

List templates (builtin + local + opted-in online sources).

- `--cwd ‹dir›` — Project root (default: cwd).
- `--online` — Resolve online sources (npm/git).
- `--offline` — Force offline (skip npm/git).
- `--global` — Only the global registry templates.
- `--kind ‹kind›` — project | workspace | application | folder | tooling | pipeline.
- `--registry` — List only the .dbx/toolchain/templates.json sources.
- `--json` — Print the templates as JSON.

## `dbx template:init`

Write a template.json to a directory, making it a local template.

- `[dir]` — Directory (default: cwd).
- `--cwd ‹dir›` — Project root (default: cwd).
- `--kind ‹kind›` — project | workspace | application | folder | tooling | pipeline.
- `--name ‹name›` — Display name (default: folder name).
- `--id ‹id›` — Stable template id (default: folder name).
- `--description ‹text›` — Description.
- `--var ‹pair...›` — Variable name[:default] (repeatable).
- `--tag ‹tag...›` — Tag (repeatable).
- `--force` — Overwrite an existing template.json.
- `--add` — Also record the folder in .dbx/toolchain/templates.json.
- `--no-global` — Do not also store the template in the global registry.
- `--json` — Print the manifest as JSON.

## `dbx template:add`

Record a template source in .dbx/toolchain/templates.json.

- `‹source›` — local path | git URL | @scope/create | type:locate
- `--cwd ‹dir›` — Project root (default: cwd).
- `--type ‹type›` — Force: builtin | local | npm | git | vite-plus | remote.
- `--name ‹name›` — Display name.
- `--id ‹id›` — Stable template id (default: inferred).
- `--kind ‹kind›` — project | workspace | application | folder | tooling | pipeline.
- `--ref ‹ref›` — Git branch/tag/commit.
- `--registry ‹url›` — Custom npm registry (default: the project package manager).
- `--subdir ‹dir›` — Subdirectory within the source.
- `--no-global` — Do not also register the source in the global registry.
- `--json` — Print the updated registry as JSON.

## `dbx template:remove`

Remove a source from .dbx/toolchain/templates.json.

- `‹id›` — Source id or type:locate.
- `--cwd ‹dir›` — Project root (default: cwd).
- `--global` — Remove the template from the global registry.
- `--json` — Print the registry as JSON.

## `dbx template:registry`

Manage the global template search paths (and sync them to the VS Code setting).

- `--list` — List the resolved search paths (default).
- `--add ‹path...›` — Add global search path(s).
- `--remove ‹path...›` — Remove global search path(s).
- `--set ‹path...›` — Replace the global search paths.
- `--clear` — Reset the global search paths to the default.
- `--vscode-dir ‹dir›` — Record the VS Code user dir (its settings.json holds the paths).
- `--json` — Print the resolved config as JSON.

## `dbx registry`

List or manage the template/provider registries.

- `--cwd ‹dir›` — Project root (default: cwd).
- `--kind ‹kind›` — What --add/--remove manages: templates | providers.
- `--add ‹path›` — Add a registry path (or remote URL).
- `--remove ‹path›` — Remove a registry path.
- `--set ‹path...›` — Replace the registry search paths.
- `--clear` — Clear the registry search paths.
- `--scope ‹scope›` — project | global (default: global).
- `--json` — Print the registries as JSON.

## `dbx template:info`

Show one template by id.

- `‹id›` — The template id.
- `--cwd ‹dir›` — Project root (default: cwd).
- `--online` — Resolve online sources.
- `--json` — Print the template as JSON (the default).

## `dbx create`

Scaffold a project from a template (builtin, local or Vite+).

- `-t, --template ‹id›` — Template id (see template:list).
- `--kind ‹kind›` — project | workspace | application | folder | tooling | pipeline.
- `-n, --name ‹name›` — Project / package name.
- `-s, --scope ‹scope›` — npm scope, eg. @acme.
- `-o, --out ‹dir›` — Output directory (default: cwd).
- `--cwd ‹dir›` — Project root (default: cwd).
- `--var ‹pair...›` — Template variables as key=value (repeatable).
- `--action ‹id...›` — Action id to run after scaffolding (repeatable).
- `--online` — Resolve online templates too.
- `--json` — Print the result as JSON.

## `dbx vite`

Run any Vite+ command through `vp` (eg. `dbx vite dev`).

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:create`

Vite+: Create a new project from a template.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:migrate`

Vite+: Migrate an existing project to Vite+.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:config`

Vite+: Configure hooks and agent integration.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:hooks`

Vite+: Manage the Git hook dispatcher.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:staged`

Vite+: Run linters on staged files.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:install`

Vite+: Install dependencies with the detected package manager.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:env`

Vite+: Manage Node.js and package managers.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:dev`

Vite+: Run the Vite development server.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:check`

Vite+: Run format, lint and type checks.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:lint`

Vite+: Lint code with Oxlint.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:fmt`

Vite+: Format code with Oxfmt.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:test`

Vite+: Run tests through bundled Vitest.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:run`

Vite+: Run package scripts and monorepo tasks.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:exec`

Vite+: Execute a binary from local node_modules.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:node`

Vite+: Run a Node.js script in the Vite+ env.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:dlx`

Vite+: Run a package binary without installing it.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:cache`

Vite+: Manage the task cache.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:build`

Vite+: Build for production.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:pack`

Vite+: Build libraries for npm or standalone binaries.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:preview`

Vite+: Preview the production build.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:add`

Vite+: Add packages to dependencies.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:remove`

Vite+: Remove packages from dependencies.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:update`

Vite+: Update packages.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:dedupe`

Vite+: Deduplicate dependencies.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:outdated`

Vite+: Check for outdated packages.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:list`

Vite+: List installed packages.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:why`

Vite+: Explain why a package is installed.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:info`

Vite+: View package metadata.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:link`

Vite+: Link local packages.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:unlink`

Vite+: Unlink local packages.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:rebuild`

Vite+: Rebuild native modules.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:pm`

Vite+: Forward a command to the package manager.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:toolchain`

Vite+: Show Vite+ tool versions.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:upgrade`

Vite+: Update `vp` itself.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).

## `dbx vite:implode`

Vite+: Remove `vp` and all related data.

- `--cwd ‹dir›` — Project root to run `vp` in (default: cwd).
