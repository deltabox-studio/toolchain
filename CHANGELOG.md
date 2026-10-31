# Changelog

## 2.1.0 (October 2026)

<!-- release:start -->

### New features
#### Changelog
- Configure breaking-change detection ([#f80634f](https://github.com/deltabox-studio/toolchain/commit/f80634f) by [T0chi](https://github.com/T0chi))
  - Detect breaking changes by Conventional Commits rules by default (! in the subject or a BREAKING CHANGE: footer) and add a changelog.breaking / ci.changelog.breaking override (conventional, ny, alse, pattern/match, or a callback).

<!-- release:end -->


## 2.0.1 (October 2026)

### Bug fixes
#### Vscode
- Always show builtin providers and templates ([#d67c2ad](https://github.com/deltabox-studio/toolchain/commit/d67c2ad) by [T0chi](https://github.com/T0chi))
#### Changelog
- Make release notes first-release safe ([#25e39ef](https://github.com/deltabox-studio/toolchain/commit/25e39ef) by [T0chi](https://github.com/T0chi))
  - Extract release bodies through a tested CLI helper that only uses tag versions present in CHANGELOG.md, skips the current version, and falls back to the newest entry when there is no prior release.
- Group breaking changes first ([#c30d212](https://github.com/deltabox-studio/toolchain/commit/c30d212) by [T0chi](https://github.com/T0chi))
  - Detect subject and footer breaks, group them under the breaking section ahead of feat/fix, and keep the grouping with custom commit formatters and --format-only.
### Documentation
- Auto-generate sidebar and reorganize guides ([#3485f53](https://github.com/deltabox-studio/toolchain/commit/3485f53) by [T0chi](https://github.com/T0chi))
- Document release-notes extraction ([#fcac0b8](https://github.com/deltabox-studio/toolchain/commit/fcac0b8) by [T0chi](https://github.com/T0chi))
  - Document dbx changelog --release-notes, the last-released-version matching and the first-release fallback.
- Document breaking changes group order ([#5aa2397](https://github.com/deltabox-studio/toolchain/commit/5aa2397) by [T0chi](https://github.com/T0chi))
  - Note the default order (breaking, feat, fix) and that breaking grouping works with custom commit formatters.

### Package changes
#### Added
- `vite-plugin-vitepress-auto-sidebar` `^1.7.1`

## 2.0.0 (October 2026)

### New features
#### Changelog
- Customize CC group order and titles ([#856842b](https://github.com/deltabox-studio/toolchain/commit/856842b) by [T0chi](https://github.com/T0chi))
  - Support ordered arrays, title records, hidden groups and callbacks for the whole group config and per-group title/order/hidden values, including --format-only.
- Add custom workflow paths, listing and non-Yarn support ([#2e96e6e](https://github.com/deltabox-studio/toolchain/commit/2e96e6e) by [T0chi](https://github.com/T0chi))
- Add a New contributors footer ([#1e49596](https://github.com/deltabox-studio/toolchain/commit/1e49596) by [T0chi](https://github.com/T0chi))
  - scanned range (explicit range start, or the oldest commit's parent).
    login is known) and a nested list of their commit messages, reusing
    the normal commit bullet formatting without the author/body.
    only the CC rule/scope grouping is replaced by major/minor/patch.
#### Config
- Type changelog group callbacks ([#a5c6186](https://github.com/deltabox-studio/toolchain/commit/a5c6186) by [T0chi](https://github.com/T0chi))
  - Add the shared ChangelogGroupsSetting types, expose groups on both changelog sections, and regenerate the config schema/types/reference.
- Revamp config generators and extend tooling customization ([#b924255](https://github.com/deltabox-studio/toolchain/commit/b924255) by [T0chi](https://github.com/T0chi))
  - and generateConfig* functions (optional disk writes, schema metadata)
  - **BREAKING CHANGE:** ConfigScopes, ConfigScopeDef, CONFIG_SECTION_SCHEMAS,
  - CONFIG_TYPE_SCHEMAS and CONFIG_SECTION_DESCRIPTIONS are removed. Consumers
    should use ConfigSchema with generateConfigTypes/Env/Markdown/Cli/All and read
    section descriptions from schema metadata.
- Support metadata annotations in generated output ([#1417bb2](https://github.com/deltabox-studio/toolchain/commit/1417bb2) by [T0chi](https://github.com/T0chi))
- Add fmt/lint sections and manual changelog config ([#16000e5](https://github.com/deltabox-studio/toolchain/commit/16000e5) by [T0chi](https://github.com/T0chi))
- Inherit shared sections and add fmt/lint defaults ([#94add6f](https://github.com/deltabox-studio/toolchain/commit/94add6f) by [T0chi](https://github.com/T0chi))
- Registry source policies and duplicate template-id prompts ([#e030af7](https://github.com/deltabox-studio/toolchain/commit/e030af7) by [T0chi](https://github.com/T0chi))
  - host and path globs, enforced for local paths, npm registries and
    remote URLs (also when loading global/remote registries and the
    provider/registry listings).
    builtin or project source; non-interactive runs fail with a clear
    `--id` hint instead of prompting.
    plus Templates/Providers docs.
- Ambient Zod meta types and project-tsconfig typechecks ([#e73661b](https://github.com/deltabox-studio/toolchain/commit/e73661b) by [T0chi](https://github.com/T0chi))
  - `/// <reference types="@deltabox/toolchain/globals" />` and get typed
    `.meta({ env, path, required, example, ... })` fields.
    `ConfigBaseMeta.deprecated` the JSON-Schema boolean.
    instead of `tsconfig.build.json`.
- Move CI workflows and changelog config under toolchain.ci ([#af1b536](https://github.com/deltabox-studio/toolchain/commit/af1b536) by [T0chi](https://github.com/T0chi))
  - workflows and move the changelog pipeline to `ci.changelog`.
    `ci.changelog.commitlint: false` and fall back to coarse
    major/minor/patch changelog groups.
    `ChangelogBranchesConfig` as a named schema.
    consumers, but reject it in the loader with a migration error.
    into the `config-schema/` folder.
    per-workflow overrides are `WorkflowOptions`, and the new section type
    is `ToolchainCiConfig`.
    generated types.
- Let defineConfig accept a promise or a callback ([#111776c](https://github.com/deltabox-studio/toolchain/commit/111776c) by [T0chi](https://github.com/T0chi))
  - `defineConfig` now mirrors Vite's helper: the argument may be a plain object,
    a `Promise<DbxConfig>`, or a `() => DbxConfig | Promise<DbxConfig>` callback.
    The loader resolves the module export (awaits a promise, calls a callback and
    awaits its result), so a config can do async work before returning
    `{ toolchain }`.
#### Vscode
- Surface workflow conflicts in managed files ([#e692511](https://github.com/deltabox-studio/toolchain/commit/e692511) by [T0chi](https://github.com/T0chi))
  - Read workflowConflicts from the manifest and render them as a warning group with the owning config key.
- Watch the inputs resolved from the dbx config ([#953f071](https://github.com/deltabox-studio/toolchain/commit/953f071) by [T0chi](https://github.com/T0chi))
  - watch globs: auto-sync now asks the CLI (`dbx watch --list --json`) per
    workspace root and watches the returned globs relative to that root, so
    custom `tsconfig.rootFile`/`defaultFile` names are respected
    ignore stale results from an older resolve
    older pinned `dbx`)
    set value, in any scope, still replaces the resolved inputs
    `tsconfig.default.json`
    the behaviour
- Add extension settings link to Home ([#f39cb35](https://github.com/deltabox-studio/toolchain/commit/f39cb35) by [T0chi](https://github.com/T0chi))
- Add Select dbx version to the Home More actions ([#13ef688](https://github.com/deltabox-studio/toolchain/commit/13ef688) by [T0chi](https://github.com/T0chi))
- Add the Registries view ([#e3e808e](https://github.com/deltabox-studio/toolchain/commit/e3e808e) by [T0chi](https://github.com/T0chi))
  - A new collapsible **Registries** view (below Templates) shows **Providers** and
    (explorer folder or browser for remote URLs), **Add new registry** (the category's
    add flow) and **Remove registry** (removes the path, keeps the files). The title
    bar has **New registry…** / **Remove registry…** (global or project scope), also
    available in the Home "More actions". Removing a template now offers the stored
    global templates too (`template:remove --global`).
- Rename registry paths, add a version picker and UI polish ([#9c8b51c](https://github.com/deltabox-studio/toolchain/commit/9c8b51c) by [T0chi](https://github.com/T0chi))
  - config and code).
    "which dbx?" notification, only ask when they differ, and add a **Select dbx
    version…** command that pins one in the workspace settings (npx fallback).
    More actions), prefix More-actions buttons with a play glyph, start Managed
    Files collapsed, expand the Vite+ provider by default, and drop unused icon
    resources.
- Sync the global registry with the VS Code settings ([#86a0671](https://github.com/deltabox-studio/toolchain/commit/86a0671) by [T0chi](https://github.com/T0chi))
  - Add the `deltabox.templatesSearchPaths` setting, record the VS Code user dir in
    the CLI config on activation, and mirror setting changes into it (so the CLI and
    editor agree). Adding a template now asks whether to register it globally (yes
    by default), and adding a provider asks for a project or global scope; the
    Providers view reads the merged registry.
#### Project
- Inherit root Oxc config and harden scaffolds ([#56a1895](https://github.com/deltabox-studio/toolchain/commit/56a1895) by [T0chi](https://github.com/T0chi))
  - Nested projects omit local Oxc files/opt-ins when the root owns them, template create gains --force, and scaffold writes now reject duplicates, BOM catalogs and root scope fallbacks are handled.
- Make scaffolds runnable and safer ([#eab297b](https://github.com/deltabox-studio/toolchain/commit/eab297b) by [T0chi](https://github.com/T0chi))
- Fold an existing vite config when generating a config ([#5891154](https://github.com/deltabox-studio/toolchain/issues/5891154) by [T0chi](https://github.com/T0chi))
  - `project:config` now checks for a hand-written `vite.config.*` and folds its
    literal props into the generated `dbx.config.ts`'s `toolchain.vite` (using the
    vite migration's extract/scan/fold helpers), adding the `/vite.config.ts` fmt
    ignore. A non-foldable config is reported and left alone. The VS Code "Generate
    config" actions run `dbx sync` afterwards so the managed shim is written.
#### Core
- Resolve watched inputs from the config and add `dbx watch --list` ([#0ab08a9](https://github.com/deltabox-studio/toolchain/commit/0ab08a9) by [T0chi](https://github.com/T0chi))
  - `watch` globs with function forms resolved (eg. custom
    `tsconfig.rootFile`/`defaultFile` names); `runWatch` now uses it, so only the
    inputs of tasks that actually run are watched
    resolved tsconfig file names (`{ globs, tsconfig }`) without watching
    a `tsconfig` section
- Untracked managed files, config-derived task globs and a reset restore hook ([#5da6691](https://github.com/deltabox-studio/toolchain/commit/5da6691) by [T0chi](https://github.com/T0chi))
  - it in the manifest, so a user-owned file a task patches is never pruned by a
    later sync or removed by `dbx reset`
    follow configured file names
    (written before `files`/`origins`, which it can never clobber), and
    `SyncContext.check` flags `dbx sync --check`
    the manifest is removed and report the `restored` files
- Provider registry search paths and safer managed-file sync ([#4033009](https://github.com/deltabox-studio/toolchain/issues/4033009) by [T0chi](https://github.com/T0chi))
  - http(s) URLs), keeping the legacy provider files for compatibility.
    providers`, `--set`, `--clear`), the CLI config and the VS Code
    `deltabox.providerRegistrySearchPaths` setting; the Registries view
    now manages both kinds and the Providers view can fetch remote
    registries through `loadToolchainProviders()`.
    pre-existing file. Adopted files are unmanaged, never deleted.
    their previous content); the extension shows a notification listing
    removed files with Restore/Close.
- Merge global providers with the project registry ([#81c510b](https://github.com/deltabox-studio/toolchain/commit/81c510b) by [T0chi](https://github.com/T0chi))
  - Providers can live in `~/.dbx/toolchain/.registry/providers.json` too.
    `readAllProviders` merges them with the project's `.dbx/toolchain/providers.json`
    (project wins on an id clash), and the CLI's provider list and passthrough
    commands use it so a global provider works in every project.
#### Tsconfig
- Resolver, `extends`/`baseFile` options and snapshot-backed overrides ([#2b38963](https://github.com/deltabox-studio/toolchain/commit/2b38963) by [T0chi](https://github.com/T0chi))
  - JSONC) and `dbx tsconfig --json/--alias/--paths/--references/--tsconfig/--root/--no-extends`;
    the generator now resolves the workspaces tsconfig through it
    templates, and `tsconfig.baseFile` for the root base tsconfig
    into the user-owned tsconfigs on sync, honouring custom
    `baseFile`/`rootFile`/`defaultFile`/`buildFile` names (also in the task's
    watched/kept globs and in `dbx tsconfig`)
    (repo-relative paths only) and record the applied override per file in
    `tsconfigOverrides`; removing a key restores the snapshot value when the
    original defined it, otherwise removes it (pruning emptied parents), and keeps
    a value edited after the override applied it
    `tsconfig.override-edited`) and skip instead of creating missing targets;
    patched files are untracked, so sync/reset never delete them
    (`restoreTsconfigOverrides`), warning with `tsconfig.restore-reapply` while
    the overrides are still configured; `dbx reset` restores before removing the
    manifest
#### Vite
- Add static shims and a configurable shim import ([#bddcb62](https://github.com/deltabox-studio/toolchain/commit/bddcb62) by [T0chi](https://github.com/T0chi))
  - the generated `vite.config.ts`, so Vite+ can load it without a built
    `@deltabox/toolchain` (rejects functions, regexps and class instances)
    shims; relative values resolve from the repo root and are rewritten per
    generated config
- Preserve existing imports/comments when regenerating the shim ([#194461c](https://github.com/deltabox-studio/toolchain/commit/194461c) by [T0chi](https://github.com/T0chi))
  - `renderViteConfig` now accepts the existing `vite.config.ts` source: it keeps
    the file's leading comments and import statements and merges `defineConfig` (and
    the config type) into the existing `vite`/`vite-plus` import, preserving default,
    namespace, other named and type-only specifiers. Regeneration is idempotent, and
    the sync task feeds the current file in so a custom import block/comment is not
    dropped.
- Detect the project's vite package and allow resolveVite overrides ([#dfaedee](https://github.com/deltabox-studio/toolchain/commit/dfaedee) by [T0chi](https://github.com/T0chi))
  - The generated `vite.config.ts` shim now imports `defineConfig` (and its config
    type) from whichever package the project installs — `vite` or `vite-plus` —
    detected from `package.json` and walking up so a hoisted workspace dependency
    resolves. `resolveVite` is generic so the shim type-checks against both, and
    `ResolveViteOptions` now carries inline `vite` overrides that are deep-merged
    over the loaded section.
#### Migrate
- Add Oxc migration and repeatable --from ([#0f6930d](https://github.com/deltabox-studio/toolchain/commit/0f6930d) by [T0chi](https://github.com/T0chi))
#### Cli
- Add config selection and logger suppression ([#9b69e3f](https://github.com/deltabox-studio/toolchain/commit/9b69e3f) by [T0chi](https://github.com/T0chi))
#### Template
- Re-prompt on duplicate ids in init and the editor ([#a4d7cde](https://github.com/deltabox-studio/toolchain/commit/a4d7cde) by [T0chi](https://github.com/T0chi))
  - one (or fails with an `--id` hint when non-interactive), and accepts
    `--id`.
    the provider already exists, updating its command names too.
- Unscoped npm packages, custom registries and remote sources ([#08cb68c](https://github.com/deltabox-studio/toolchain/commit/08cb68c) by [T0chi](https://github.com/T0chi))
  - npm create packages. The registry defaults to the project package
    manager's (`npmRegistryServer` / `.npmrc`) and can be overridden per
    source with `--registry` or the new `ToolchainTemplateSource.registry`.
    whose `{ sources }` / `{ templates }` / array is merged recursively.
    docs.
- Add project registries, registry listing and global removal ([#ff3cd16](https://github.com/deltabox-studio/toolchain/commit/ff3cd16) by [T0chi](https://github.com/T0chi))
  - to `<project>/.dbx/toolchain/.registry/templates`; the project paths are
    resolved before the global ones (remote `http(s)` entries are kept as URLs).
    `dbx registry` command lists them (`--json`) and adds/removes template paths
    (`--add`/`--remove`, `--scope global|project`).
    remove stored global templates; remote registries accept `{ sources }`,
    `{ templates }` or an array of sources.
- Add a global template registry ([#638dd3b](https://github.com/deltabox-studio/toolchain/commit/638dd3b) by [T0chi](https://github.com/T0chi))
  - Templates registered with `template:init --add`/`template:add` are also stored
    under `~/.dbx/toolchain/.registry/templates` (unless `--no-global`), so they are
    available in every project and the VS Code extension. Global templates merge
    with the project's own (project wins on an id clash).
  - Search paths default to that directory and can be configured as a string/array
    of directories or `http(s)` remote registries. They live in
    `~/.dbx/toolchain/cli/config.json` (`templatesSearchPaths`, plus a `vscodeDir`
    pointing at the VS Code user dir) and are managed with the new
    `dbx template:registry` command (`--add`/`--set`/`--remove`/`--clear`), which
    also writes the VS Code `deltabox.templatesSearchPaths` setting.
### Bug fixes
#### Cli
- Filter denied providers at registration ([#74c49bb](https://github.com/deltabox-studio/toolchain/commit/74c49bb) by [T0chi](https://github.com/T0chi))
  - Load the registry policy before registering provider commands, and make config-flag extraction work for argv without a node/script prefix.
- Preserve provider flags and emit clean machine output ([#8f6c404](https://github.com/deltabox-studio/toolchain/commit/8f6c404) by [T0chi](https://github.com/T0chi))
#### Config
- Support boolean formatter and linter opt-ins ([#d99384b](https://github.com/deltabox-studio/toolchain/commit/d99384b) by [T0chi](https://github.com/T0chi))
  - Allow true/false for every fmt/lint tool, honour explicit biome opt-outs, and ignore disabled biome overrides.
- Honour disabled sections and regenerate config types ([#dddd9a7](https://github.com/deltabox-studio/toolchain/commit/dddd9a7) by [T0chi](https://github.com/T0chi))
- Keep union, enum and nested types in the combined markdown reference ([#2eaa373](https://github.com/deltabox-studio/toolchain/commit/2eaa373) by [T0chi](https://github.com/T0chi))
  - The combined (`combined: true`) markdown renderer received the untyped
    lowering of Zod scopes, which collapses unions/enums to `any` with a `{}`
    default. Render Zod scopes from `toJSONSchema` instead (resolving the root
    `$ref` into `$defs`), so the reference shows real types and nested options
    again.
- Finish generator ergonomics and changelog customization ([#38f6d5b](https://github.com/deltabox-studio/toolchain/commit/38f6d5b) by [T0chi](https://github.com/T0chi))
#### Changelog
- Honour workflow token overrides and disabled ci ([#de266dd](https://github.com/deltabox-studio/toolchain/commit/de266dd) by [T0chi](https://github.com/T0chi))
  - Use the overridden package manager's version, honour legacy yarnVersion, and ignore workflow paths when ci is disabled.
#### Core
- Reload edited code configs in watch ([#10ba473](https://github.com/deltabox-studio/toolchain/commit/10ba473) by [T0chi](https://github.com/T0chi))
  - Cache-bust the ESM/CJS config import when watch reloads, and add loader + live watch coverage.
- Protect adopted files, keep check read-only and reload watch config ([#c6fe500](https://github.com/deltabox-studio/toolchain/commit/c6fe500) by [T0chi](https://github.com/T0chi))
#### Vscode
- List custom workflows and read BOM-prefixed manifests ([#2f62b47](https://github.com/deltabox-studio/toolchain/commit/2f62b47) by [T0chi](https://github.com/T0chi))
- Use the default provider registry path and clarify template docs ([#017cfe6](https://github.com/deltabox-studio/toolchain/commit/017cfe6) by [T0chi](https://github.com/T0chi))
#### Tsconfig
- Make sync generation quiet, one-pass and non-fatal ([#f0d7663](https://github.com/deltabox-studio/toolchain/commit/f0d7663) by [T0chi](https://github.com/T0chi))
#### Ci
- Keep the build tsconfigs for CI typechecks ([#b1502ad](https://github.com/deltabox-studio/toolchain/commit/b1502ad) by [T0chi](https://github.com/T0chi))
  - the generated CI workflow.
    root + package `tsconfig.json` (including tests).
#### Migrate
- Deep-merge the folded vite config ([#f74d2ed](https://github.com/deltabox-studio/toolchain/commit/f74d2ed) by [T0chi](https://github.com/T0chi))
  - Folding a hand-written `vite.config.*` into an existing `toolchain.vite` now
    deep-merges object literals (nested objects combine; arrays/scalars from the
    vite config win) instead of replacing the section, and flips a previous
    `config: false` to `true` since the hand-written file is removed.
  - Also fixes `findTopLevelValue` so a scalar last key no longer swallows the
    object's closing `}`, updates the managed-shim detection for the generic
    `resolveVite<T>(...)` form, and corrects the "nothing to migrate" message when
    the migration is registered but no source is detected.
### Refactors
- Run quality checks through vp tasks ([#2fee264](https://github.com/deltabox-studio/toolchain/commit/2fee264) by [T0chi](https://github.com/T0chi))
- Run build and test through vp tasks too ([#e890665](https://github.com/deltabox-studio/toolchain/commit/e890665) by [T0chi](https://github.com/T0chi))
- Run typechecks through vp tasks (dev vs CI tsconfigs) ([#7b3420b](https://github.com/deltabox-studio/toolchain/commit/7b3420b) by [T0chi](https://github.com/T0chi))
### Documentation
- Document changelog group customization ([#5443ea0](https://github.com/deltabox-studio/toolchain/commit/5443ea0) by [T0chi](https://github.com/T0chi))
  - Cover ordered groups, custom titles, hidden groups and callback examples for manual and CI changelog config.
- Document nested Oxc inheritance and workflow token versions ([#4f43cd9](https://github.com/deltabox-studio/toolchain/commit/4f43cd9) by [T0chi](https://github.com/T0chi))
  - Cover scaffold --force, root Oxc inheritance, boolean tool opt-ins, workflow package-manager version defaults and the managed-file conflict group.
- Regenerate config artifacts and document the fixes ([#9be4d73](https://github.com/deltabox-studio/toolchain/commit/9be4d73) by [T0chi](https://github.com/T0chi))
- Document tsconfig overrides, snapshots and `--restore` ([#dad4084](https://github.com/deltabox-studio/toolchain/commit/dad4084) by [T0chi](https://github.com/T0chi))
  - snapshots, removal rules, restoring, warnings) and the new CLI flags/exports
    the sync task API additions and an upgrade step
    the package reference
    `llms-full.txt`
- Document v2 generators, custom logger and changelog customization ([#f0f7f5d](https://github.com/deltabox-studio/toolchain/commit/f0f7f5d) by [T0chi](https://github.com/T0chi))
- Update README highlights and regenerate LLM docs ([#6380770](https://github.com/deltabox-studio/toolchain/issues/6380770) by [T0chi](https://github.com/T0chi))
- Add the CI guide, TypeScript page and interactive CLI sections ([#fc6099a](https://github.com/deltabox-studio/toolchain/commit/fc6099a) by [T0chi](https://github.com/T0chi))
  - `guide/ci/` section (overview + settings + ci/issues/changelog/sync/
    releases) and retitle the overview to "CI".
    metadata, programmatic API, Vite+ generics).
    VS Code sync notification and CLI `sync --json` docs.
- Split the config, API, config-generator and changelog guides ([#4153d86](https://github.com/deltabox-studio/toolchain/commit/4153d86) by [T0chi](https://github.com/T0chi))
  - `guide/changelog.md` into folders with an index + one sibling page per
    second-level section.
    commitlint, Versioning, CLI, writing messages, Troubleshooting and
    Releases into sibling pages.
    workflows, the commitlint opt-out fallback and the migration from the
    deprecated top-level `changelog` section.
    LLM bundles.
- Document the Registries view, project registries and dbx version picker ([#752d1cd](https://github.com/deltabox-studio/toolchain/commit/752d1cd) by [T0chi](https://github.com/T0chi))
  - Cover `registrySearchPaths`, project registries, the `registry` command, remote
    registries, the Registries view/actions, and the extension's version selection.
- Document the global template/provider registry ([#55651e1](https://github.com/deltabox-studio/toolchain/commit/55651e1) by [T0chi](https://github.com/T0chi))
  - Cover the global templates dir, `--no-global`, the `template:registry` command,
    the CLI config and `deltabox.templatesSearchPaths` sync, remote registries, and
    global providers.
- Document defineConfig callbacks, shim detection and deep-merge migration ([#701de7c](https://github.com/deltabox-studio/toolchain/commit/701de7c) by [T0chi](https://github.com/T0chi))
  - Cover `defineConfig` promises/callbacks, the shim importing from the project's
    vite package, inline `resolveVite` overrides, and the vite migration deep-merging
    into `toolchain.vite`.
#### Vscode
- Document extension requirements ([#07fd6fa](https://github.com/deltabox-studio/toolchain/commit/07fd6fa) by [T0chi](https://github.com/T0chi))
#### Config
- Generate CLI, env and config-type references ([#ba640a3](https://github.com/deltabox-studio/toolchain/commit/ba640a3) by [T0chi](https://github.com/T0chi))
  - `config:docs`) to generate `apps/docs/config/index.md`, `cli.md` from
    the ToolchainCommand descriptors, and `env.md` from ConfigMeta.
### Tests
- Run the emulate suite in a temp sandbox outside the repo ([#a94fa4c](https://github.com/deltabox-studio/toolchain/commit/a94fa4c) by [T0chi](https://github.com/T0chi))
  - `node_modules` link back to the repo install) instead of `tests/emulate`,
    so a stray sync can never touch the toolchain repo
    every test, and clean up on `SIGHUP`/`SIGBREAK` too
    sandboxes
- Cover provider search paths, registry policy and remote sources ([#91a5859](https://github.com/deltabox-studio/toolchain/commit/91a5859) by [T0chi](https://github.com/T0chi))
### Build system
- Run typechecks, tests and Vite+ from source without a built `dist` ([#4353a36](https://github.com/deltabox-studio/toolchain/commit/4353a36) by [T0chi](https://github.com/T0chi))
  - `tsconfig.workspaces.json` and regenerate every workspace `tsconfig.json`,
    so typechecks resolve workspace source instead of `dist`
    building the package first
    the source tsconfigs
### Chores
- Fix lint warnings and remove unused helper ([#ac890d8](https://github.com/deltabox-studio/toolchain/commit/ac890d8) by [T0chi](https://github.com/T0chi))
- Add lint and check vp tasks to every workspace ([#83bb7e5](https://github.com/deltabox-studio/toolchain/commit/83bb7e5) by [T0chi](https://github.com/T0chi))

### Package changes
#### Added
- `jsonc-parser` `^3.3.1`

## 1.11.4 (October 2026)

### Documentation
- Updated misleading docs ([#5a5e44c](https://github.com/deltabox-studio/toolchain/commit/5a5e44c) by [T0chi](https://github.com/T0chi))
### Chores
#### Vscode
- Rearranged views order ([#0620097](https://github.com/deltabox-studio/toolchain/issues/0620097) by [T0chi](https://github.com/T0chi))

## 1.11.3 (October 2026)

### Bug fixes
#### Ci
- Emit the dbx.config.ts fence title in the generated reference ([#d154039](https://github.com/deltabox-studio/toolchain/commit/d154039) by [T0chi](https://github.com/T0chi))
  - `apps/docs/config/reference.md` is generated by `scripts/generate-config.ts`
    (and the CI `Verify generated config artifacts are up to date` step), so its
    "Full example" fence must be produced by the generator. The docs rebrand added
    a `[dbx.config.ts]` title to that fence by hand, which `yarn config:generate`
    then stripped, failing the drift check. Emit the title from the generator so
    the regenerated (and formatted) file matches the committed one.
### Styles
- Format the docs brand stylesheet ([#fb3a711](https://github.com/deltabox-studio/toolchain/commit/fb3a711) by [T0chi](https://github.com/T0chi))
  - Run the formatter over `apps/docs/.vitepress/theme/style.css` (trailing
    whitespace, indentation, numeric normalization) so `yarn format` no longer
    dirties the tree.

## 1.11.2 (October 2026)

### Chores
- Update `README.md` ([#3e7f4e1](https://github.com/deltabox-studio/toolchain/commit/3e7f4e1) by [T0chi](https://github.com/T0chi))

## 1.11.1 (October 2026)

### Bug fixes
- Write scaffold files only at the end and resolve "." names ([#c01fcf3](https://github.com/deltabox-studio/toolchain/commit/c01fcf3) by [T0chi](https://github.com/T0chi))
  - Two scaffolding robustness fixes:
  - Cancelling any prompt (scope, package manager, include-config, the
    folder picker) aborts the whole command instead of falling back to a
    default and creating orphan files/dirs. The local-template copier also
    reads and renders the entire tree into memory before writing, so a
    failed or interrupted run can never leave a half-copied template.
  - directory it is created in (`--out`/`--root`), so
    `dbx create --name . --out ./my-app` names the package `my-app`.
  - Tests: emulate the `.` name through both `create` and `project:init`.
#### Shared
- Quote a Windows command path that contains spaces ([#2e1f2ab](https://github.com/deltabox-studio/toolchain/commit/2e1f2ab) by [T0chi](https://github.com/T0chi))
  - `spawnCross` routes every Windows command through `cmd.exe`, which splits an
    unquoted command at whitespace, so an absolute path like
    `C:\Program Files\nodejs\node.exe` was resolved as `C:\Program` and never ran.
    Quote the command when it contains whitespace instead of caret-escaping the
    space (which `cmd.exe` still splits on). The same fix is mirrored in the
    extension's `win-spawn` port.
  - Tests: a functional case that hardlinks `node.exe` into a space-containing
    temp dir and runs it, plus unit assertions for `escapeCmdCommand`.
#### Vscode
- Run template create without a shell so npm scopes survive ([#0863cf2](https://github.com/deltabox-studio/toolchain/commit/0863cf2) by [T0chi](https://github.com/T0chi))
  - `createFromTemplate` sent online/Vite+ creates to an integrated terminal as a
    shell string. On PowerShell a bare `@scope` is read as splatting (`@deltabox` ->
    splat of an undefined variable), so the value was dropped and commander failed
    with `option '-s, --scope <scope>' argument missing`.
  - Run every template through the same argv pipeline (`runCli`, no shell) so values
    like an npm scope are never mangled. Vite+ projects skip the post-create sync
    since they are not dbx-managed.
### Documentation
- Updated `vscode-example.mp4` ([#58c0061](https://github.com/deltabox-studio/toolchain/commit/58c0061) by [T0chi](https://github.com/T0chi))
- Rebrand to the new logo and blue theme ([#e28c1f9](https://github.com/deltabox-studio/toolchain/commit/e28c1f9) by [T0chi](https://github.com/T0chi))
  - Swap the toolchain/box2d logos for the new `logo/*` assets, re-theme the
    site with the blue brand tokens and hero/logo animations, update the home
    page (GitHub action, feature icons), and refresh the guide/reference copy
    and code fences. Regenerated `llms.txt` / `llms-full.txt`.
- Adopt the Carbon theme with code-group icons ([#09b2608](https://github.com/deltabox-studio/toolchain/commit/09b2608) by [T0chi](https://github.com/T0chi))
  - Build the docs on vitepress-carbon: spread its base config and override
    `vite.plugins` so the LLM plugin runs once (with our copy instead of
    Carbon's default), add `vitepress-plugin-group-icons` for language icons on
    `::: code-group` / `[title]` blocks, and register the theme. Also refresh
    the year/footer config. Adds the two dev dependencies.
- Rename the "LLM context files" page to "LLMs" ([#9a9e8c7](https://github.com/deltabox-studio/toolchain/commit/9a9e8c7) by [T0chi](https://github.com/T0chi))
### Chores
#### Vscode
- Rebrand the extension icon and README ([#bbde675](https://github.com/deltabox-studio/toolchain/commit/bbde675) by [T0chi](https://github.com/T0chi))
  - Point the extension icon at the new `resources/logo.png` / `icon.svg`,
    drop the old `icon.png` / `logo.svg`, and update the README with the new
    banner.

### Package changes
#### Added
- `vitepress-carbon` `^1.7.0`
- `vitepress-plugin-group-icons` `^1.8.1`

## 1.11.0 (October 2026)

### New features
#### Vscode
- Scaffold any template and drive Vite+ create from the extension ([#fb4a55c](https://github.com/deltabox-studio/toolchain/commit/fb4a55c) by [T0chi](https://github.com/T0chi))
  - project" picker (`template:list --online`) instead of only the dbx builtins;
    each entry runs the same create pipeline (name/scope/variables/actions).
    bare `vite-plus` template — through the extension's prompt pipeline: pick a
    concrete Vite+ template, then create like any other template. Consumers no
    longer land in the interactive `vp create` CLI menu.
### Bug fixes
#### Project
- Tag a scaffolded workspace with its own project type ([#9d05637](https://github.com/deltabox-studio/toolchain/commit/9d05637) by [T0chi](https://github.com/T0chi))
  - `resolveType` fell back to the loaded config's `project.type`, but a scaffold
    runs with the config of the directory it is invoked from — the monorepo root
    when adding a workspace. A workspace was therefore tagged `monorepo-root`, and
    the post-scaffold sync then generated root-only CI, husky and VS Code files
    inside the workspace.
  - Only honour an explicit `--type` (or the command's implied default); ignore the
    ambient config type.
### Documentation
- Update descriptions and vscode screenshot ([#215bc4f](https://github.com/deltabox-studio/toolchain/commit/215bc4f) by [T0chi](https://github.com/T0chi))
### Styles
- Wrap long description lines for the formatter ([#213ea73](https://github.com/deltabox-studio/toolchain/commit/213ea73) by [T0chi](https://github.com/T0chi))
  - Long single-line descriptions from earlier commits; `vp fmt` wraps them back.
### Tests
- Emulate custom templates/providers and workspace scaffolding ([#37d370e](https://github.com/deltabox-studio/toolchain/commit/37d370e) by [T0chi](https://github.com/T0chi))
  - Code extension writes) and assert the CLI lists, scaffolds and runs them —
    i.e. the payloads the extension's trees consume.
    assert the workspace does NOT inherit their outputs
    (.github/.husky/.vscode/commitlint.config.mjs).
### Chores
#### Vscode
- Rename the Home "All actions" section to "More actions" ([#b8a2137](https://github.com/deltabox-studio/toolchain/commit/b8a2137) by [T0chi](https://github.com/T0chi))

## 1.10.4 (October 2026)

### Documentation
- Removed video preview dimensions ([#322b4b1](https://github.com/deltabox-studio/toolchain/commit/322b4b1) by [T0chi](https://github.com/T0chi))

## 1.10.3 (October 2026)

### Bug fixes
#### Vscode
- Recompute the Home model when the provider list loads ([#fd6f6f1](https://github.com/deltabox-studio/toolchain/commit/fd6f6f1) by [T0chi](https://github.com/T0chi))
  - The Home "Run Vite+" button is disabled while the Home model's `hasVite` is
    false, and that value comes from the asynchronously-loaded provider list (a
    `dbx providers --json` spawn). A webview rendered before the list resolved was
    never re-posted, so the button could stay disabled from a cold start even though
    the `deltabox.hasVite` context key (command palette) was updated.
  - Recompute the context keys and the Home model whenever the provider tree
    reloads, via its `onDidChangeTreeData` event. Vite+ is always contributed by the
    toolchain, so `hasVite` is true as soon as the list loads.
#### Core
- Split the last-sync timestamp into a gitignored timestamps.json ([#0aa6f77](https://github.com/deltabox-studio/toolchain/commit/0aa6f77) by [T0chi](https://github.com/T0chi))
  - The per-project `manifest.json` embedded `syncedAt`, so every sync rewrote a
    committed file with a new clock value — noisy diffs in the repo and in every
    consumer. Move the timestamp out into a sibling, gitignored
    `.dbx/toolchain/timestamps.json`:
  - to `timestamps.json`, so the next sync migrates a legacy inline value
    automatically (the property is gone from `manifest.json`).
    inline `syncedAt` until that migration runs, so nothing breaks in between.
    only the block's comment was updated.
### Documentation
- Added a video preview of the extension ([#6b0ca40](https://github.com/deltabox-studio/toolchain/commit/6b0ca40) by [T0chi](https://github.com/T0chi))

## 1.10.2 (October 2026)

### Documentation
#### Vscode
- Updated extension description & more ([#48993f0](https://github.com/deltabox-studio/toolchain/commit/48993f0) by [T0chi](https://github.com/T0chi))

## 1.10.1 (October 2026)

### Bug fixes
#### Core
- Only fall back to tsx when Node cannot load TypeScript ([#c96ae7d](https://github.com/deltabox-studio/toolchain/commit/c96ae7d) by [T0chi](https://github.com/T0chi))
  - The config loader retried every failed native import through `tsx`, so a
    genuinely broken `dbx.config.*` could be silently loaded as an empty config.
    On Linux the root build had baked an absolute path to `tsx` into the bundle,
    which happened to resolve there: tsx elided the unresolvable (unused) import,
    the config "loaded", no error was recorded, and `dbx sync` exited 0 instead of
    failing (the emulation suite caught this in CI).
  - (`ERR_UNKNOWN_FILE_EXTENSION`, `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`); let
    genuine errors (module-not-found, syntax errors, throws) propagate.
    `import('tsx/esm/api')` instead of a build-machine path, and promote `tsx` to
    a runtime dependency so the config-loader fallback works for consumers.

## 1.10.0 (October 2026)

### New features
#### Template
- Scaffold actions, package-manager choice and catalogs ([#6c66c97](https://github.com/deltabox-studio/toolchain/commit/6c66c97) by [T0chi](https://github.com/T0chi))
  - `module` (relative to the template dir, `export default async (ctx) => {}`,
    not copied to the output) or a shell `command`. Actions run through the same
    pipeline everywhere (CLI prompts / `--action <id>`, extension prompts,
    programmatic API `actions: string[]`).
    (`builtin: 'install'`, default off) and a `packageManager` input
    (yarn default | pnpm | npm | bun).
    when supported: `.yarnrc.yml` (yarn), `pnpm-workspace.yaml` (pnpm),
    `package.json` `workspaces.catalog` (bun); npm pins versions inline.
    task that keeps `.yarnrc.yml` / `pnpm-workspace.yaml` catalogs in sync. It
    only writes a file that is absent or toolchain-managed (marker comment), so a
    hand-written file is never clobbered; bun/npm warn.
    the manager.
    config reference/schema/types regenerated.
- Generic builtins + inputs + Vite+ templates; resilient config loading ([#fb8d7cc](https://github.com/deltabox-studio/toolchain/commit/fb8d7cc) by [T0chi](https://github.com/T0chi))
  - `catalog:` protocol from generated projects, add a pinned
    `@deltabox/toolchain` devDependency, and generate a `dbx.config.ts` with only
    the `project` section — every other section is now opt-in.
    `monorepo-example`, and expose every Vite+ template
    (`vite-plus-monorepo`, `-application`, `-library`, `-generator`).
    shared by the CLI, the programmatic API, the VS Code extension and the
    builtins; document it in the Templates guide.
    `@deltabox/toolchain/tsdown` (the private `@deltabox/toolchain-tsdown` package
    is never published).
    stderr instead of aborting unrelated commands (`template:list`, `providers`,
    ...), so the extension views no longer empty out after scaffolding; `sync`
    still fails on a broken config (and `--recursive` reports per project).
    choice, and add a "Need help? Go to documentation" link to the Home view.
### Bug fixes
- Issues found emulating the extension + command palette ([#1049afa](https://github.com/deltabox-studio/toolchain/commit/1049afa) by [T0chi](https://github.com/T0chi))
  - Emulated the extension (bundled and portal `dbx`) against a consumer workspace:
  - name ("No version specified for X") for yarn/pnpm/npm/bun, so `projectToPackageJson`
    skips the field when no version is known, and scaffolds/`project:config` seed a
    default version (`DEFAULT_PACKAGE_MANAGER_VERSIONS`) or the existing
    package.json manager. `renderToolchainConfig` always emits `packageManagerVersion`.
    `vite-plus` ships two bins, so `npx vite-plus` failed with "could not determine
    executable to run" (broke `dbx vite:*`).
    `@deltabox/toolchain/vite` no longer runs `resolveDbx` at module load, so every
    command stopped printing spurious `dbx`-resolution warnings.
    option").
    template), so the Managed Files and Home views populate instead of staying empty.
#### Project
- Preserve scoped package name and never delete catalog files ([#dbb0b21](https://github.com/deltabox-studio/toolchain/commit/dbb0b21) by [T0chi](https://github.com/T0chi))
  - Found by exercising a portal-linked consumer workspace:
  - defines `name` without `scope` (eg. a nested workspace), instead of renaming
    `@acme/a` to `a`. Mirrors the token resolution in the config loader.
    a previously toolchain-managed catalog file is never deleted when the task
    stops producing it (eg. the user replaces it with a hand-written one) — it
    already refused to overwrite it, but `runSync` would still remove it.
### Tests
- Add a real CLI emulation suite under tests/emulate ([#2c76d66](https://github.com/deltabox-studio/toolchain/commit/2c76d66) by [T0chi](https://github.com/T0chi))
  - extension and command palette drive) in a per-test scratch workspace under
    `tests/emulate/<id>` and asserts on real behavior: builtins + inputs/actions,
    per-package-manager scaffolding (catalog vs pinned), bare/nested monorepos,
    custom module/command actions, the opt-in install action, catalog sync +
    never-delete, config-load resilience, `template:info --json`, and the
    post-scaffold extension flow.
    boundary and never inherits the toolchain repo's own config/manifest. Scratch
    dirs are removed after every test (pass or fail), once more on `afterAll`, and
    again on process exit; the repo's own manifest is snapshotted and restored so
    the working tree stays clean.
    always execute against a fresh CLI bundle.
    emitting a dangling `catalog:` — Bun's catalog lives in `package.json`
    `workspaces.catalog`, which only a monorepo root writes. Regression tests added.

## 1.9.2 (October 2026)

### Documentation
- Added `llms` entry to the sidebar ([#098cc7e](https://github.com/deltabox-studio/toolchain/commit/098cc7e) by [T0chi](https://github.com/T0chi))

## 1.9.1 (October 2026)

### CI
#### Vscode
- Target the release environment by name (drop resourceType) ([#2bbd25a](https://github.com/deltabox-studio/toolchain/commit/2bbd25a) by [T0chi](https://github.com/T0chi))
  - `resourceType` only accepts `virtualMachine`/`Kubernetes`. `resourceType: none`
    made the deployment job look for a resource of type `none`, so it failed with
    "No resource were found in the environment ... ResourceType Undefined". Use the
    string form `environment: 'release'`, which records the deployment against the
    resource-less environment and still applies its approvals/checks.

## 1.9.0 (October 2026)

### New features
#### Changelog
- Allow a raw YAML string as a workflow setting ([#aa0e1b7](https://github.com/deltabox-studio/toolchain/commit/aa0e1b7) by [T0chi](https://github.com/T0chi))
  - `changelog.workflows.<id>` now accepts a raw YAML string in addition to a
    boolean or a `WorkflowConfig` object. A raw string is written verbatim as the
    workflow file: no default merge, no token replacement and no generated header,
    and the `changelog.branches` defaults don't apply (it defines its own triggers).
    An empty string disables the workflow.
  - Docs: add a "Workflows" section covering the three forms, and a "Writing commit
    messages" section warning about shell escaping (PowerShell backtick escapes and
    bash command substitution) and AI/LLM-drafted messages introducing stray control
    characters, curly quotes, dashes and other typographic characters. Regenerate
    the schema, types and docs reference.
### CI
#### Vscode
- Skip the release when the extension version is already published ([#0d54cfe](https://github.com/deltabox-studio/toolchain/commit/0d54cfe) by [T0chi](https://github.com/T0chi))
  - `vsce publish` fails with "already exists" when `deltabox.toolchain-vscode@<version>`
    is already on the Marketplace, failing the whole pipeline. Add a `Check` stage
    before `Build` that reads the version from `packages/vscode/package.json`,
    queries the Marketplace `extensionquery` API, and exposes an `alreadyPublished`
    stage output. `Build` and `Release` now depend on `Check` and skip when it is
    `true` (a failed query assumes "not published" so a release is never silently
    skipped).
### Chores
#### Changelog
- Repair escaped text in the 1.8.0 entry ([#587e47d](https://github.com/deltabox-studio/toolchain/commit/587e47d) by [T0chi](https://github.com/T0chi))
  - The shared/core/project/tsconfig/vite commits were authored with PowerShell
    `\``-escaped backticks, so their bodies carried `\` + control-character
    artifacts (e.g. `` `r `` -> `\`+CR, `` `b `` -> backspace). The changelog
    sanitizer stripped the control characters but left the stray backslashes and
    dropped letters, so the 1.8.0 entry read `esolveVite`, `\{ ... }\`, `epo\`, etc.
    Restore the intended text (backticked code, `resolveVite`, `repo`/`repository`,
    `name`/`scope`/`description`/`type`, `rootFile`/`defaultFile`/`buildFile`).

## 1.8.0 (October 2026)

### New features
#### Cli
- Expose the sync tasks to commands and keep --json output clean ([#1e4ecec](https://github.com/deltabox-studio/toolchain/commit/1e4ecec) by [T0chi](https://github.com/T0chi))
  - The command context now carries `syncTasks` (`defaultSyncTasks()`) so a package
    command such as `migrate` can regenerate managed files without depending on
    every sync package. Skip the update-check notice when `--json` is passed so it
    never lands on stdout and corrupts machine output.
#### Changelog
- Per-workspace changelogs and configurable branches ([#0aa329c](https://github.com/deltabox-studio/toolchain/commit/0aa329c) by [T0chi](https://github.com/T0chi))
  - Scan a workspace's own commits (plus its transitive dependencies) via
    `relatedWorkspacePaths` and create a missing workspace `CHANGELOG.md` instead of
    skipping it. `changelog.branches.main`/`dev` accept a string or an array, `dev`
    defaults to `main`, and the branch list is injected into the generated
    workflows. Add `changelog.commitlint.dir` for a custom commitlint config
    location. Release notes aggregate every changelog entry since the last tag.
#### Migrate
- Recursive, interactive migration and post-migration sync ([#bb87b33](https://github.com/deltabox-studio/toolchain/commit/bb87b33) by [T0chi](https://github.com/T0chi))
  - `dbx migrate` is now `--recursive` (off by default): it discovers the projects
    under the root and, on a TTY, prompts a multi-select with an "All projects"
    option. The `vite` migration creates a fresh nested `dbx.config.ts` (wrapped in
    `defineConfig`) when the project has none, and removes the folded
    `vite.config.*` unless `--ignore-vite-config-file`. `--write` also regenerates
    the project's managed files unless `--ignore-managed-files`, dropping the
    changelog task when `--ignore-changelog`; removals are reported. Adds
    `@clack/prompts`, `@deltabox/toolchain-core` and `glob` to the package.
#### Vite
- Accept a single options object in resolveVite ([#2e2384b](https://github.com/deltabox-studio/toolchain/commit/2e2384b) by [T0chi](https://github.com/T0chi))
  - `resolveVite(options?: DbxConfig & ResolveViteOptions)` replaces the two-argument form. The generated shim passes `{ cwd: import.meta.dirname }` so a nested shim resolves its own `dbx.config.*` instead of the process cwd's.
#### Tsconfig
- Generate workspace tsconfigs from a workspaces file ([#40db765](https://github.com/deltabox-studio/toolchain/commit/40db765) by [T0chi](https://github.com/T0chi))
  - Rename `tsconfig.monorepo.json` to `tsconfig.workspaces.json`; `tsconfig.build.json` and the workspaces file are optional; `glob` accepts a string or an array (with `!` negation); add `exclude`/`gitignore` (nested-aware, symlink-safe) and the `rootFile`/`defaultFile`/`buildFile` renames; warn when references/composite are configured but no workspace tsconfigs are found.
#### Project
- Sync package.json fields and generate configs ([#e5209ee](https://github.com/deltabox-studio/toolchain/commit/e5209ee) by [T0chi](https://github.com/T0chi))
  - Add a `project` sync task that writes the fields a `dbx.config.project` defines into `package.json` (with `repo` -> `repository` + `directory` for workspaces), plus `project:config` generation for existing projects. Scaffolding validates the name/type.
#### Core
- Inherit project config and make discovery symlink-safe ([#92b2b0a](https://github.com/deltabox-studio/toolchain/commit/92b2b0a) by [T0chi](https://github.com/T0chi))
  - Nested configs inherit the ancestor `project` minus its identity keys (`name`/`scope`/`description`/`type`), with `project.inherit: false` to opt out. Discovery no longer follows symlinks/junctions (a self-link would loop), and `DBX_GITIGNORE_BLOCK` now covers a nested project's `.dbx/` while still tracking its manifest.
#### Shared
- Add ignore resolution, project helpers and config schema updates ([#144b2f0](https://github.com/deltabox-studio/toolchain/commit/144b2f0) by [T0chi](https://github.com/T0chi))
  - Add symlink-safe gitignore collection (`collectGitignorePatterns`) and `resolveIgnorePatterns` for the glob-based consumers, `projectFromPackageJson`/`projectToPackageJson`, and the `ToolchainCommandContext.syncTasks` field. Regenerate `config.schema.json` and the docs config reference.
### Bug fixes
#### Vscode
- Resolve the bundled CLI and gate commands on availability ([#5220ed3](https://github.com/deltabox-studio/toolchain/commit/5220ed3) by [T0chi](https://github.com/T0chi))
  - Capture the running extension's path and version at activation instead of
    hardcoding the id (`deltabox.toolchain` is stale: the id is
    `<publisher>.<name>`), so `bundledCliEntry()`/`pinnedToolchainSpec()` find the
    shipped `dbx.cjs` and Providers/Templates/scaffolding work without a
    project-local install. Disable the sync commands (`deltabox.canSync`) and the
    Vite+ commands (`deltabox.hasVite`) via context keys + command `enablement` and
    the Home buttons when there is nothing to sync / the provider is unavailable.
    Exclude `dbx.config.ts` and `.dbx/**` from the VSIX.
### Documentation
- Add guides for every config section and the llms output ([#4c231dc](https://github.com/deltabox-studio/toolchain/commit/4c231dc) by [T0chi](https://github.com/T0chi))
  - Add per-section guides (project, biome, vite, watch, logger, tsconfig), refresh
    the CLI/config/monorepo/VS Code/api pages and the sidebar, and wire
    `vitepress-plugin-llms` with `apps/docs/llms.md` plus the script that copies the
    generated `llms.txt`/`llms-full.txt` to the repo root.
### Build system
- Make the published package installable ([#b2597ee](https://github.com/deltabox-studio/toolchain/commit/b2597ee) by [T0chi](https://github.com/T0chi))
  - npm runs a dependency's `postinstall` on install, so the repo-only
    `husky && node scripts/bootstrap.mjs` broke every consumer (and global) install
    with `'husky' is not recognized`. Move the logic into `scripts/bootstrap.mjs`,
    publish it, and guard every checkout-only step: husky runs only when `.husky`
    exists and the dist build only when `packages/` exists. A consumer install is
    now a clean no-op.
### CI
- Aggregate release notes and refresh the generated workflows ([#9426a40](https://github.com/deltabox-studio/toolchain/commit/9426a40) by [T0chi](https://github.com/T0chi))
  - The release workflow now extracts every changelog entry since the last tag, and
    the generated `ci.yml`/`release.yml` are regenerated from `dbx.config.ts`.
    Includes the hand-written `release-vscode.yml` pipeline.
#### Vscode
- Fix the release-vscode Azure Pipelines trigger ([#b59964c](https://github.com/deltabox-studio/toolchain/commit/b59964c) by [T0chi](https://github.com/T0chi))
  - `pr` is a top-level pipeline keyword, not a child of `trigger` (whose full
    syntax only accepts `batch`, `branches`, `paths` and `tags`), so `trigger.pr`
    was reported as an unexpected property. Move `pr: none` to the top level and
    trigger on `v*` tags through `tags` (with `branches: exclude: ['*']` for a
    tag-only trigger) instead of the invalid `branches.include: refs/tags/v*`.
### Chores
- Self-host nested dbx configs across the workspaces ([#003cb9f](https://github.com/deltabox-studio/toolchain/commit/003cb9f) by [T0chi](https://github.com/T0chi))
  - Every workspace now has its own `dbx.config.ts` (holding its Vite Task
    definitions) and a generated `vite.config.ts` shim, plus its own tracked
    manifest. The root gains a `@deltabox/toolchain` `portal:.` self-link so the
    shims resolve `@deltabox/toolchain/vite`, and `.gitignore` keeps nested
    manifests while ignoring the rest. The root `tsconfig.monorepo.json` is renamed
    to `tsconfig.workspaces.json`.
#### Deps
- Refresh the lockfile ([#420c805](https://github.com/deltabox-studio/toolchain/commit/420c805) by [T0chi](https://github.com/T0chi))
  - Covers `vitepress-plugin-llms` (docs), `@clack/prompts`/`glob`/core (migrate)
    and the root `@deltabox/toolchain` `portal:.` self-link.

### Package changes
#### Added
- `@deltabox/toolchain` `portal:.`
- `vitepress-plugin-llms` `^1.14.0`

## 1.7.8 (October 2026)

### Bug fixes
#### Vscode
- Reverted VS Code extension package name to `toolchain-vscode` due to `toolchain` ([#5d0d38b](https://github.com/deltabox-studio/toolchain/commit/5d0d38b) by [T0chi](https://github.com/T0chi))

## 1.7.7 (October 2026)

### CI
#### Vscode
- Upload `release-vscode.yml` pipeline ([#3080357](https://github.com/deltabox-studio/toolchain/issues/3080357) by [T0chi](https://github.com/T0chi))

## 1.7.6 (October 2026)

### CI
#### Vscode
- Fixed failed build in `release-vscode.yml` for Azure Pipelines ([#f6f4b14](https://github.com/deltabox-studio/toolchain/commit/f6f4b14) by [T0chi](https://github.com/T0chi))
  - The build failed due to missing workspace builds, specifically from `@deltabox/toolchain-tsdown`

## 1.7.5 (October 2026)

### Chores
- Revert `extend` value to `tsconfig.base.json` for vscode workspace's `tsconfig.default.json` ([#96e021e](https://github.com/deltabox-studio/toolchain/commit/96e021e) by [T0chi](https://github.com/T0chi))

## 1.7.4 (October 2026)

### Bug fixes
#### Vscode
- Extending root `tsconfig.json` instead of root `tsconfig.base.json` ([#9aa9669](https://github.com/deltabox-studio/toolchain/commit/9aa9669) by [T0chi](https://github.com/T0chi))

## 1.7.3 (October 2026)

### CI
#### Vscode
- Set up CI with `Azure Pipelines` ([#2ec1863](https://github.com/deltabox-studio/toolchain/commit/2ec1863) by [T0chi](https://github.com/T0chi))
  - [skip ci]
### Chores
#### Ci
- Remove `azure-pipelines-setup.yml` ([#03a4196](https://github.com/deltabox-studio/toolchain/commit/03a4196) by [T0chi](https://github.com/T0chi))

## 1.7.2 (October 2026)

### CI
#### Vscode
- Set up ci with `Azure Pipelines` ([#5bc736f](https://github.com/deltabox-studio/toolchain/commit/5bc736f) by [T0chi](https://github.com/T0chi))
  - [skip ci]
### Chores
- Remove `azure-pipelines.yml` ([#7965965](https://github.com/deltabox-studio/toolchain/issues/7965965) by [T0chi](https://github.com/T0chi))

## 1.7.1 (October 2026)

### Chores
#### Vscode
- Uploaded the vscode extension to the Marketplace ([#993aadf](https://github.com/deltabox-studio/toolchain/commit/993aadf) by [T0chi](https://github.com/T0chi))

## 1.7.0 (October 2026)

### New features
#### Vscode
- Let users choose the project or bundled dbx ([#6cdd686](https://github.com/deltabox-studio/toolchain/commit/6cdd686) by [T0chi](https://github.com/T0chi))
  - The extension had no awareness of a workspace's own @deltabox/toolchain, so its auto-sync ran the bundled (possibly older) dbx. On activation it now detects the workspace dbx, shows a notification with action buttons (project vs bundled), remembers the choice per workspace (workspaceState) and falls back to the bundled CLI. Adds the deltabox.toolchain.chooseDbxSource command + a getDbxSource/setDbxSource API.
#### Shared
- Sanitize shell-escape artifacts in generated markdown ([#fcac95e](https://github.com/deltabox-studio/toolchain/commit/fcac95e) by [T0chi](https://github.com/T0chi))
  - Add stripControlChars/stripEscapeArtifacts/sanitizeText to the shared string utils: they strip the predictable shell-escape artifacts (a backslash before a control character) and any remaining bare control characters, while leaving ordinary backslashes and normal whitespace alone. Apply them to the config markdown generator's descriptions and the changelog commit reader/formatter, and cap generated headings at h6 (VitePress dropped the literal #######).
### Chores
#### Changelog
- Repair escaped commit text and label code refs ([#1425419](https://github.com/deltabox-studio/toolchain/issues/1425419) by [T0chi](https://github.com/T0chi))
  - PowerShell interpreted the escaped backticks in the commit bodies as control-character escapes, so the changelog carried backslash+control artifacts (TAB/CR/LF/BS/FF/VT) and mojibake. Repair the affected 1.4.1-1.6.1 entries and add backticks around commands, paths, flags, types and identifiers throughout the file.

## 1.6.1 (October 2026)

### Documentation
#### Config
- Inline nested sub-schemas in the generated reference ([#5a9a9e3](https://github.com/deltabox-studio/toolchain/commit/5a9a9e3) by [T0chi](https://github.com/T0chi))
  - `renderConfigFileMarkdown` only recursed into inline objects, so named sub-schemas (`changelog.workflows`, `changelog.versioning.target/workspaces`, `templates.sources[]`, `project.type`) rendered as a bare type name. It now resolves the JSON Schema `$defs` and expands objects, object unions and array items inline (each named type once per section), so the reference documents every option with types, required markers, defaults and descriptions.

## 1.6.0 (October 2026)

### New features
#### Changelog
- Add a configurable versioning option ([#e5cbefc](https://github.com/deltabox-studio/toolchain/commit/e5cbefc) by [T0chi](https://github.com/T0chi))
  - Add `toolchain.changelog.versioning` (boolean | { target, workspaces }) to the shared Zod model, defaulting to `true`/uniform. `target` selects `uniform` (root + all workspaces), `root-only`, or `individual` (each changed workspace bumps on its own); `workspaces` globs select which workspaces to version (defaulting to the root `workspaces` field, else the root `package.json` alone). The CLI now threads the changelog config into the generator and `writeChangelogs` takes per-workspace versions. Documented in the new 'Changelog & versioning' guide.
### Bug fixes
#### Shared
- Add spawn timeouts so a stalled child can't hang the tool ([#e7fdf96](https://github.com/deltabox-studio/toolchain/commit/e7fdf96) by [T0chi](https://github.com/T0chi))
  - `spawnCross`/`run` gain `timeoutMs` (kills the child's whole tree — `taskkill /t` on Windows — with a warning); `runVp` forwards it; the plugin's one-shot `runDbx` sync/check defaults to 5 min; the VS Code extension's captured `dbx` commands default to 5 min. Dev servers/watchers stay unbounded. Adds `killProcessTree()` + a timeout test.
#### Vite
- Build `DBX_TASKS` from a resolved binary and warn on fallbacks ([#c1a29db](https://github.com/deltabox-studio/toolchain/commit/c1a29db) by [T0chi](https://github.com/T0chi))
  - Vite Task runs a task's command through a shell, so a bare `dbx sync` depended on `PATH`/environment and could miss or pick a stale binary. `DBX_TASKS` now bakes in the `resolveDbx` result (project's own, or pinned `npx`) at config load; `dbxTaskCommand(sub)` builds one for any subcommand. `resolveDbx` also warns (once) when it ignores an invalid `DBX_BIN`, skips a global for a pinned project, or falls back to `npx`.
- Warn and fall back on missing `DBX_BIN`/`PATH`/`ComSpec` ([#f91ad12](https://github.com/deltabox-studio/toolchain/commit/f91ad12) by [T0chi](https://github.com/T0chi))
  - `resolveDbx` now ignores a `DBX_BIN` that points at a missing file (warn + fall through) instead of wedging every `dbx` call; `which` warns once when `PATH` is empty; the Windows spawner warns once when `ComSpec` is unset before falling back to `cmd.exe`.
- Never run a stale global `dbx` from a pinned project ([#d441427](https://github.com/deltabox-studio/toolchain/commit/d441427) by [T0chi](https://github.com/T0chi))
  - `resolveDbx` fell back to a global `dbx` on `PATH` whenever the project's own binary wasn't resolvable — which happens in the toolchain repo itself (Yarn doesn't link the root's own bin, and `findOwnCliEntry` needs a built `dist`). A stale global `dbx` would then run `dbx sync` and rewrite generated files in an older format. Now a project that pins `@deltabox/toolchain` (`node_modules` or the repo itself) never uses a global `dbx`: it warns and uses `npx @deltabox/toolchain@<pinned>`; the global is only used when the project pins nothing. Adds `localToolchainVersion()` + tests, and documents the resolution.
#### Vscode
- Pin the `npx` fallback to the extension's version ([#57d27fa](https://github.com/deltabox-studio/toolchain/commit/57d27fa) by [T0chi](https://github.com/T0chi))
  - The extension's last-resort `npx --yes @deltabox/toolchain` resolved `@latest`, which could drift from the workspace's generated files. It now pins its own version (`@deltabox/toolchain@<extension version>`), since the extension is versioned in lockstep with the toolchain.
#### Tsdown
- Let Yarn own the single-entry `bin` field ([#d6198b5](https://github.com/deltabox-studio/toolchain/commit/d6198b5) by [T0chi](https://github.com/T0chi))
  - Reproduced (and minimised) the 'unexplained' `bin` revert: Yarn 4 normalises a single-entry `bin` object to a plain string on every `yarn install`, so an explicit tsdown `bin` object could never persist — install and build fought over `package.json`. Set tsdown's `exports.bin` to `false` so tsdown leaves the field alone, and commit the string form Yarn writes. install + build are now idempotent.
- Re-apply the explicit changelog and tsconfig bins ([#192a2d3](https://github.com/deltabox-studio/toolchain/commit/192a2d3) by [T0chi](https://github.com/T0chi))
  - The generated version bump commit dropped the explicit `bin` mapping (object form) from both `package.json`s; regenerate it from the pinned tsdown `exports.bin` so `yarn build` stays idempotent.

## 1.5.0 (October 2026)

### New features
#### Changelog
- Emit the husky `commit-msg` hook for consumers ([#6898386](https://github.com/deltabox-studio/toolchain/issues/6898386) by [T0chi](https://github.com/T0chi))
  - `dbx sync` now writes `.husky/commit-msg` (running `commitlint`) alongside the workflows and `commitlint.config.mjs`, so consumers using the Conventional-Commits CI lint commits locally too. The docs recommend `postinstall: husky` (Yarn Berry never runs `prepare`) and `.husky/* text eol=lf` (a trailing CR breaks the hook).

## 1.4.1 (October 2026)

### Bug fixes
#### Tsdown
- Pin the changelog and tsconfig bins explicitly ([#f616626](https://github.com/deltabox-studio/toolchain/commit/f616626) by [T0chi](https://github.com/T0chi))
  - With `exports: true` and no `bin`, tsdown soft auto-detects the shebang entry and derives the command name from the package name, rewriting the committed `bin` on every build. Map the command names explicitly so the field is stable and the build is idempotent.
#### Ci
- Bootstrap the `dist` the vite shim needs before build ([#b96b89a](https://github.com/deltabox-studio/toolchain/commit/b96b89a) by [T0chi](https://github.com/T0chi))
  - `prepare` never runs on `yarn install` under Yarn Berry, so `scripts/bootstrap.mjs` never built `dist/vite.js` and `yarn build` failed to load the generated `vite.config.ts` shim on a fresh CI checkout. Run the bootstrap from a root `postinstall` and at the start of `build`/`typecheck`/`test` (all begin with `vp run`, which loads the shim); it is a no-op once `dist/vite.js` exists.

## 1.4.0 (October 2026)

### New features
- Render the `dbx` CLI with `clack`, author the Vite+ config in `dbx.config` ([#fb8b9ef](https://github.com/deltabox-studio/toolchain/commit/fb8b9ef) by [T0chi](https://github.com/T0chi))
  - `vite.config.ts` in and adds the `fmt` ignore; `dbx` resolves its own binary first
    and colour `Commander`'s help
#### Vscode
- Add Providers and Templates views ([#9aa6d12](https://github.com/deltabox-studio/toolchain/commit/9aa6d12) by [T0chi](https://github.com/T0chi))
  - `add`/`remove`/`run-command`/`open-homepage`/`copy-id` actions
    `toolchainProviders()`, so a registered provider's commands become `dbx` commands
    Templates -> Managed Files
#### Vite
- Drive `dbx` from the `dbx()` plugin, drop `defineDbxConfig` ([#8d11557](https://github.com/deltabox-studio/toolchain/commit/8d11557) by [T0chi](https://github.com/T0chi))
  - The Vite/Vite+ integration is now the `dbx()` plugin plus spreading `DBX_TASKS` into
    `run.tasks`, so the consumer's own `vite` config stays the config:
  - `export default defineConfig({`
    `plugins: [dbx()],`
    `run: { tasks: { ...DBX_TASKS } },`
    `});`
  - Remove the `defineDbxConfig` wrapper (and `DbxViteConfig`) and update the README, the
    Providers guide and the API reference.
- Author the Vite+ config in `dbx.config`, generate `vite.config.ts` ([#9885225](https://github.com/deltabox-studio/toolchain/issues/9885225) by [T0chi](https://github.com/T0chi))
  - `toolchain.vite` now holds the whole Vite+ config (a loose object) with a
    `config: false` opt-out, and `dbx sync` generates the managed root
    `vite.config.ts` from it, so `dbx.config.*` is the only hand-authored root config.
  - Add `dbx migrate --from vite` (auto-detected): it extracts the object passed to
    `defineConfig` in an existing root `vite.config.ts` and folds it into `dbx.config.*`'s
    `toolchain.vite`, refusing configs it cannot migrate faithfully.
  - The config-types generator now honors `.catchall`, emitting an index signature.
#### Config
- Expose the Vite+ config type, rename `Tooling*` to `Toolchain*` ([#088de56](https://github.com/deltabox-studio/toolchain/commit/088de56) by [T0chi](https://github.com/T0chi))
  - `ToolchainViteConfig` is now Vite+ `ViteUserConfig` intersected with the managed
    `config?: boolean` opt-out, instead of a generated loose object. The config-types
    generator gains a hand-written type override plus an imports block, used for the
    vite type, and `vite-plus` becomes an optional peer dependency.
  - Rename every `Tooling*` type, schema id and identifier to `Toolchain*`. That covers
    the config schema ids, `CONFIG_TYPE_SCHEMAS` keys, the provider/migration models
    and the CLI helpers (`toolchainConfigSchema`, `loadToolchainConfig`,
    `toolchainProviders`, `registerToolchainCommands`). Regenerated types/schema/docs.
### Bug fixes
#### Deps
- Sync the lockfile for `@clack/prompts` ([#568a7c6](https://github.com/deltabox-studio/toolchain/commit/568a7c6) by [T0chi](https://github.com/T0chi))
  - The lockfile was missing the `@clack/prompts` entry for `packages/shared` and
    `packages/template`, so `yarn install --immutable` failed in CI (YN0028).
### Refactors
- Rename Ox to Oxc across the project ([#39b37d3](https://github.com/deltabox-studio/toolchain/commit/39b37d3) by [T0chi](https://github.com/T0chi))
  - (`Oxfmt`/`Oxlint` and `.oxlintrc`/`.oxfmtrc` are unchanged)
### Documentation
- Cover the clack CLI output, prompts and `dbx` binary resolution ([#f45ed3f](https://github.com/deltabox-studio/toolchain/commit/f45ed3f) by [T0chi](https://github.com/T0chi))
- Document the Vite+ config type and the `Toolchain*` names ([#1e70950](https://github.com/deltabox-studio/toolchain/commit/1e70950) by [T0chi](https://github.com/T0chi))
  - Note that `toolchain.vite` is typed as Vite's `UserConfig` as augmented by Vite+
    (`ToolchainViteConfig`), and list `ToolchainViteConfig` among the shared config
    types. Covers the unreleased changes since v1.3.1 together with the sections the
    feature commits already added (the Vite+ config in `dbx.config`, the generated
    `vite.config.ts`, the vite migration and the `dbx` plugin).
#### Vscode
- Refresh the extension screenshot and add its `LICENSE` ([#49d4510](https://github.com/deltabox-studio/toolchain/commit/49d4510) by [T0chi](https://github.com/T0chi))
### Build system
- Package the VS Code extension in `yarn build` ([#1dd14a1](https://github.com/deltabox-studio/toolchain/commit/1dd14a1) by [T0chi](https://github.com/T0chi))
  - `yarn build` now also runs the vscode `package:vsix`, so `deltabox-toolchain.vsix`
    is always produced.

### Package changes
#### Added
- `@clack/prompts` `^1.8.1`
#### Updated
- `vite-plus` `^1.2.0` → `>=1`

## 1.3.1 (October 2026)

### Documentation
- Update config generator documentation ([#0dfbf88](https://github.com/deltabox-studio/toolchain/commit/0dfbf88) by [T0chi](https://github.com/T0chi))
- Update config generator reference link ([#2f0adde](https://github.com/deltabox-studio/toolchain/commit/2f0adde) by [T0chi](https://github.com/T0chi))
- Update features descriptions ([#e9c0a6d](https://github.com/deltabox-studio/toolchain/commit/e9c0a6d) by [T0chi](https://github.com/T0chi))

## 1.3.0 (October 2026)

### New features
#### Core
- Keep the generated `.dbx` directory out of git ([#9fc1434](https://github.com/deltabox-studio/toolchain/commit/9fc1434) by [T0chi](https://github.com/T0chi))
  - `dbx sync` now appends the `.dbx` ignore block (everything under `.dbx/` except the
    manifest, which holds no absolute paths) to an existing `.gitignore`, and the
    installation guide documents the pattern and the automatic step.
#### Cli
- Route CLI output through the logger, add a providers colour option ([#ce76a4d](https://github.com/deltabox-studio/toolchain/commit/ce76a4d) by [T0chi](https://github.com/T0chi))
  - `Commander`'s help and errors now go through the shared logger (help to stdout,
    errors to stderr, colour-aware, ANSI stripped when colour is off). Vite+
    passthrough commands keep `commander`'s defaults so the spawned `vp` keeps its own
    coloured logging.
  - Add a `providers` config section (`color?: boolean`): `color: false` forces plain
    provider output, the global `--no-color` still turns it off, and `runVp` sets
    `NO_COLOR` / `FORCE_COLOR` on the child when colour is disabled.
- Check for a newer `dbx` version ([#772aae2](https://github.com/deltabox-studio/toolchain/commit/772aae2) by [T0chi](https://github.com/T0chi))
  - On each run, check the npm registry in the background (cached for a day, never
    blocking) and print a short notice with a link to the release when a newer
    `@deltabox/toolchain` exists. Skipped in CI and by `NO_UPDATE_NOTIFIER` or
    `DBX_NO_UPDATE_CHECK`, and can be turned off with the new `--no-update-check` flag.
- Default a bare Vite+ command to the `vite` passthrough ([#75770e4](https://github.com/deltabox-studio/toolchain/commit/75770e4) by [T0chi](https://github.com/T0chi))
  - `dbx fmt` / `dbx lint` / `dbx run` / `dbx dev` now work: when the first operand
    is not a built-in command but names a Vite+ subcommand (or one of its aliases),
    `vite` is inserted before it and the whole Vite+ CLI stays reachable without the
    explicit namespace. Built-in commands win, so `dbx migrate` remains the
    toolchain's migration (`dbx vite migrate` is Vite+'s).
  - The Package scripts, Migrations, Monorepo, CLI and Providers guides now show the
    bare form, and the consumers' root scripts were updated to match.
#### Vscode
- Bundle the `dbx` CLI into the extension ([#bf12403](https://github.com/deltabox-studio/toolchain/commit/bf12403) by [T0chi](https://github.com/T0chi))
  - Ship a self-contained `dbx.cjs` inside the VSIX (built by the new
    `tsdown.bin.config.ts`) and prefer it in the extension, so a consumer no longer
    needs to install `@deltabox/toolchain`. It falls back to a workspace-local
    install and then `npx`.
  - Make the changelog and tsconfig direct-run guards basename-aware so they do not
    fire when the module is inlined into the single-file bundle.
#### Shared
- Add a configurable shared logger ([#54b51fa](https://github.com/deltabox-studio/toolchain/commit/54b51fa) by [T0chi](https://github.com/T0chi))
  - Add `packages/shared/src/logger.ts`: one level-aware, colour-aware sink (colours
    via `picocolors`, the same package Vite uses) with `debug`, `info`, `success`, `warn`,
    `error` and `raw` (unprefixed machine output). It is configurable from `dbx.config`'s
    new `logger` section and from the CLI (`--log-level`, `--no-color`), with the CLI
    taking precedence.
  - Every `console` call in the toolchain now goes through the logger (JSON output
    through `raw`), including the sync/watch log callback and the `run` helper's
    verbose line. The generated config types, the JSON schema, the docs reference
    and the Configuration/CLI guides document the new `logger` section.
### Bug fixes
- Correct tsconfig aliases under `--cwd`, prune self-referential task runs ([#40e0c34](https://github.com/deltabox-studio/toolchain/commit/40e0c34) by [T0chi](https://github.com/T0chi))
  - Two bugs found by exercising the CLI against the local consumer projects:
  - instead of `process.cwd()`, so `dbx sync --cwd <dir>` (run from elsewhere)
    writes correct relative paths rather than paths pointing at the caller.
    spawning the task runner, and prunes itself when the same command runs again
    from the same root. A root task whose script calls `run -r <task>` can no
    longer recurse.
- Changelog links, oxfmt map, build idempotency, watch timer, vscode spawn ([#2389c98](https://github.com/deltabox-studio/toolchain/commit/2389c98) by [T0chi](https://github.com/T0chi))
  - render commits as a plain short hash instead of a `github.com/undefined` link
    `yarn build` no longer rewrites it and the working tree stays idempotent
    `spawnCli` and `cliInvocation`
- Sync `--check` writes, quiet level, log flags and template tokens ([#7f5690f](https://github.com/deltabox-studio/toolchain/commit/7f5690f) by [T0chi](https://github.com/T0chi))
  - Audit pass over the toolchain source:
  - actually generated by `dbx sync`
### Documentation
- Document the full public API surface ([#6f78245](https://github.com/deltabox-studio/toolchain/commit/6f78245) by [T0chi](https://github.com/T0chi))
  - Expand `guide/api.md` to cover the umbrella plus every subpath export, grouped by
    package. Add the logging API (`logger`, `createLogger`, `setLogConfig`,
    `setLogOverrides`, levels, colours, `raw`) to the API and Configuration guides, and
    document the config generator's `formatGenerated` helper and the Vite and CLI
    programmatic helpers.
### Chores
- Track only the `.dbx` manifest ([#a254062](https://github.com/deltabox-studio/toolchain/commit/a254062) by [T0chi](https://github.com/T0chi))
  - Ignore everything under `.dbx/` except `.dbx/toolchain/manifest.json`, which records the managed files and holds no absolute paths. The project graph (which embeds the absolute root) stays ignored.
- Stop tracking the generated `.dbx` directory ([#b7c53f0](https://github.com/deltabox-studio/toolchain/commit/b7c53f0) by [T0chi](https://github.com/T0chi))
  - The managed-file manifest and project graph under `.dbx/` are generated state, so ignore them and untrack the two committed files.

### Package changes
#### Added
- `picocolors` `^1.1.1`

## 1.2.8 (October 2026)

### Documentation
- Drive Vite+ from `dbx` in the recommended package scripts ([#6131c59](https://github.com/deltabox-studio/toolchain/commit/6131c59) by [T0chi](https://github.com/T0chi))
  - Use `dbx vite <command>` (the Vite+ passthrough) instead of calling `vp`
    directly in the Package scripts, Migrations and Monorepo guides, so a project
    only needs the one `dbx` command.

## 1.2.7 (October 2026)

### Documentation
- Link package script migrations from the Migrations page ([#036ebf5](https://github.com/deltabox-studio/toolchain/commit/036ebf5) by [T0chi](https://github.com/T0chi))
  - Add a "Package scripts" section to the Migrations guide with the Biome/Turbo
    script swaps and a link to the full Package scripts page.

## 1.2.6 (October 2026)

### Bug fixes
#### Config
- Tidy generated types and format them with Oxfmt ([#6fef440](https://github.com/deltabox-studio/toolchain/commit/6fef440) by [T0chi](https://github.com/T0chi))
  - `untyped`'s type generator emits a blank line between every member and verbose
    multi-line JSDoc. Strip the member blank lines in the generator, then run the
    generated output through Oxfmt's programmatic `format()` (with `jsdoc: true`)
    at generation time instead of shelling out to the repo-root `vp`, so the file
    is written already formatted and resembles the hand-written `types.ts`.
  - Also drop the toolchain-specific `yarn config:types` hint from the generated
    header: the types ship through `@deltabox/toolchain-shared`, so a script name
    that only exists in this repo's `package.json` is misleading to consumers (a
    consumer supplies its own header via the `header` option).
### Documentation
- Add Package scripts guide and a navbar version ([#b279739](https://github.com/deltabox-studio/toolchain/commit/b279739) by [T0chi](https://github.com/T0chi))
  - Add a guide page covering the recommended root scripts (Vite+ format/lint and
    Vite Task) and how to migrate an existing Biome + Turbo project onto them, and
    surface it in the sidebar and Getting Started list. Also show the current
    version in the navbar (linked to the changelog, releases and npm), like the
    Proxified docs.

## 1.2.5 (October 2026)

### Bug fixes
#### Changelog
- Keep generated commitlint enums expanded ([#a6ad600](https://github.com/deltabox-studio/toolchain/commit/a6ad600) by [T0chi](https://github.com/T0chi))
  - Oxfmt collapses an array onto one line when it fits the print width, so a
    generated `commitlint.config.mjs` whose type/scope enum is short was
    reformatted by `vp fmt` and then failed `dbx sync --check`. An inert leading
    line comment inside each enum keeps the list expanded regardless of the
    consumer's print width, so the generated file is now Oxfmt-idempotent and
    consumers no longer need to exclude it from formatting.

## 1.2.4 (October 2026)

### Documentation
- Update documentation ([#3880aaa](https://github.com/deltabox-studio/toolchain/commit/3880aaa) by [T0chi](https://github.com/T0chi))

## 1.2.3 (October 2026)

### Documentation
- Update vscode extension screenshot ([#e3e189d](https://github.com/deltabox-studio/toolchain/commit/e3e189d) by [T0chi](https://github.com/T0chi))

## 1.2.2 (October 2026)

### Documentation
- Update config generator documentation ([#8305ef8](https://github.com/deltabox-studio/toolchain/commit/8305ef8) by [T0chi](https://github.com/T0chi))

## 1.2.1 (October 2026)

### Documentation
- Show how to load the generated config ([#0f4d0d1](https://github.com/deltabox-studio/toolchain/commit/0f4d0d1) by [T0chi](https://github.com/T0chi))
  - Add a "Load the config at runtime" section to the config generator guide
    (`parseEnvTree`, the typed accessors, `applyOverrides`, and schema validation via
    `compileZodSchema`) plus a short loading example in the README.
- Update description and tags ([#64b64aa](https://github.com/deltabox-studio/toolchain/commit/64b64aa) by [T0chi](https://github.com/T0chi))

## 1.2.0 (October 2026)

### New features
#### Config
- Generate the shared config types via the config generator ([#a063a2d](https://github.com/deltabox-studio/toolchain/commit/a063a2d) by [T0chi](https://github.com/T0chi))
  - Teach the config engine's Zod->untyped bridge and types generator to handle
    unions (`anyOf`/`oneOf`), `const`, and unknown records, and to render a schema's
    fields on the main interface when it has no `base` group (plus type aliases for
    non-object roots). Named `$ref`s (via `.meta({ id })`) render as the type name,
    so the generated config types reference each other instead of inlining.
  - Generate `packages/shared/src/config-types.ts` from the Zod config model with the
    engine's `renderConfigTypes` (`yarn config:types`); `config-schema.ts` keeps only
    the schemas and the types are exported from `config-types.ts`.
### Bug fixes
#### Vscode
- Group managed files by project and reorder the views ([#f5b49d9](https://github.com/deltabox-studio/toolchain/commit/f5b49d9) by [T0chi](https://github.com/T0chi))
  - The Managed Files view read a manifest per project, so a monorepo's root-level
    managed files never showed. Read each workspace root's manifest and group its
    files by the deepest project that owns them. Move the Projects view above
    Managed Files (renamed from Files).
### Documentation
- Document the config generator outputs ([#fcfcd69](https://github.com/deltabox-studio/toolchain/commit/fcfcd69) by [T0chi](https://github.com/T0chi))
  - Show a short example of each generated output (config types, markdown, env,
    JSON schema) in the config generator guide and the README.
- Update vscode extension preview ([#fd90dda](https://github.com/deltabox-studio/toolchain/commit/fd90dda) by [T0chi](https://github.com/T0chi))

## 1.1.24 (October 2026)

### Documentation
- Update features ([#071006e](https://github.com/deltabox-studio/toolchain/commit/071006e) by [T0chi](https://github.com/T0chi))

## 1.1.23 (October 2026)

### Documentation
- Using different logo for the hero ([#552172d](https://github.com/deltabox-studio/toolchain/commit/552172d) by [T0chi](https://github.com/T0chi))

## 1.1.22 (October 2026)

### Bug fixes
#### Ci
- Skip the Marketplace publish when `VSCE_PAT` is unset ([#fe4b3ad](https://github.com/deltabox-studio/toolchain/commit/fe4b3ad) by [T0chi](https://github.com/T0chi))
  - The VS Code Marketplace publish was the only failing release step (no
    `VSCE_PAT` set). Make it a no-op while the secret is unset and publish
    automatically once it is added to the `toolchain / release` environment.
  - Also remove the temporary OIDC diagnostic step now that the release publishes.

## 1.1.21 (October 2026)

### Bug fixes
#### Ci
- Publish to npm directly, falling back to a staged publish ([#85cffe7](https://github.com/deltabox-studio/toolchain/commit/85cffe7) by [T0chi](https://github.com/T0chi))
  - Try `npm publish` first and fall back to `npm stage publish` on failure, so
    toggling the trusted publisher's publish/stage permissions on npm never breaks
    the release: a direct publish succeeds when allowed, and a staged publish (always
    permitted) is used otherwise.
### Documentation
- Show the published npm version in the README badge ([#5f83ca2](https://github.com/deltabox-studio/toolchain/commit/5f83ca2) by [T0chi](https://github.com/T0chi))
  - Replace the static npm-name badge with a shields.io npm/v badge so the README
    shows the currently published version.

## 1.1.20 (October 2026)

### Bug fixes
#### Ci
- Stage npm releases via OIDC instead of publishing directly ([#53d1f52](https://github.com/deltabox-studio/toolchain/commit/53d1f52) by [T0chi](https://github.com/T0chi))
  - Default to `npm stage publish` for OIDC trusted publishing: it always stages
    the version and defers the maintainer's 2FA approval, and is always permitted
    for a trusted publisher (unlike direct `npm publish`, which the package's 2FA
    policy rejects). Drop the automation-token fallback and require npm >= 11.15.1
    (the first with `npm stage`).

## 1.1.19 (October 2026)

### Chores
#### Ci
- Add a temporary OIDC diagnostic to the release workflow ([#7b42e33](https://github.com/deltabox-studio/toolchain/commit/7b42e33) by [T0chi](https://github.com/T0chi))
  - The publish still fails after binding the environment, and npm falls back to
    the (automation) token and 403s. Add a temporary step that decodes the OIDC
    claims and calls the token-exchange endpoint directly so the exact
    trusted-publisher mismatch is visible in the log. Removed once fixed.

## 1.1.18 (October 2026)

### Bug fixes
#### Ci
- Bind the release job to the OIDC environment ([#7b8f1b4](https://github.com/deltabox-studio/toolchain/commit/7b8f1b4) by [T0chi](https://github.com/T0chi))
  - The npm OIDC trusted publisher is bound to the GitHub environment
    "toolchain / release", but the release job declared no environment. The OIDC
    environment claim therefore did not match, the token exchange failed, and npm
    silently fell back to the placeholder token (the misleading E404).
  - Declare `environment: 'toolchain / release'` on the job and add an optional
    `NODE_AUTH_TOKEN` fallback (the environment's `NPM_TOKEN`) to the publish step.
    OIDC is still tried first, so the token is never relied on.
#### Vscode
- Spawn the CLI safely on Windows ([#99e3ad1](https://github.com/deltabox-studio/toolchain/commit/99e3ad1) by [T0chi](https://github.com/T0chi))
  - `spawn('npx.cmd', ...)` throws EINVAL synchronously on Windows, and
    `captureCli`/`runCli` call spawn inside a Promise executor, so the throw
    rejected the promise and the command aborted with no UI ("nothing happens").
    This fired whenever the CLI resolved to the `npx.cmd` fallback (a workspace
    without a local `@deltabox/toolchain`), e.g. "From template..." which round-trips
    `template:list --json` through `captureCli`.
  - Add a pure `win-spawn` module (ported from the shared `spawnCross`) that escapes
    the command + args and runs a `.cmd` shim through `cmd.exe`; use it from `spawnCli`.
    `captureCli`/`runCli` no longer reject on a spawn failure. Also fix `cliInvocation`
    for the integrated terminal: `process.execPath` is the VS Code binary in the
    extension host, so it now uses `npx dbx` / `npx --yes @deltabox/toolchain`.

## 1.1.17 (October 2026)

### Bug fixes
#### Ci
- Upgrade npm before publishing for OIDC trusted publishing ([#657d4b9](https://github.com/deltabox-studio/toolchain/commit/657d4b9) by [T0chi](https://github.com/T0chi))
  - Node 22 bundles npm 10.x, but npm OIDC trusted publishing requires
    npm >= 11.5.1. Without it `npm publish` fell back to token auth and the
    registry answered a misleading 404, so every release since 1.0.7 failed
    at the publish step. Add an explicit npm upgrade step before the publish
    step in the generated release workflow.

## 1.1.16 (October 2026)

### Documentation
- Reindent the README table of contents ([#5646bcc](https://github.com/deltabox-studio/toolchain/commit/5646bcc) by [T0chi](https://github.com/T0chi))
- Theme-aware logo (light/dark) + invert the home hero logo in dark mode ([#fd3691f](https://github.com/deltabox-studio/toolchain/commit/fd3691f) by [T0chi](https://github.com/T0chi))

## 1.1.15 (October 2026)

### Chores
- Formatted `README.md` ([#4485c48](https://github.com/deltabox-studio/toolchain/commit/4485c48) by [T0chi](https://github.com/T0chi))

## 1.1.14 (October 2026)

### Documentation
- Highlight the Vite/Vite+ plugin in the README and docs ([#8218179](https://github.com/deltabox-studio/toolchain/issues/8218179) by [T0chi](https://github.com/T0chi))

## 1.1.13 (October 2026)

### Chores
- Re-enable npm provenance (repo is public) ([#71ed60d](https://github.com/deltabox-studio/toolchain/commit/71ed60d) by [T0chi](https://github.com/T0chi))

## 1.1.12 (October 2026)

### Chores
- Disable npm provenance (unsupported from a private repo) ([#f118193](https://github.com/deltabox-studio/toolchain/commit/f118193) by [T0chi](https://github.com/T0chi))

## 1.1.11 (October 2026)

### Documentation
- Drop backticks from the landing feature cards ([#9d6ed28](https://github.com/deltabox-studio/toolchain/commit/9d6ed28) by [T0chi](https://github.com/T0chi))
- Use `currentColor` for the logo so it shows on light mode ([#907a07e](https://github.com/deltabox-studio/toolchain/commit/907a07e) by [T0chi](https://github.com/T0chi))
- Fix README formatting ([#2dc01d4](https://github.com/deltabox-studio/toolchain/commit/2dc01d4) by [T0chi](https://github.com/T0chi))
- Make the logo black in light mode (white in dark) ([#c6d9410](https://github.com/deltabox-studio/toolchain/commit/c6d9410) by [T0chi](https://github.com/T0chi))
### CI
- Auto-fix format + lint in the CI check step ([#9da9797](https://github.com/deltabox-studio/toolchain/commit/9da9797) by [T0chi](https://github.com/T0chi))

## 1.1.10 (October 2026)

### Chores
- Removed unnecessary shields ([#1efbe68](https://github.com/deltabox-studio/toolchain/commit/1efbe68) by [T0chi](https://github.com/T0chi))

## 1.1.9 (October 2026)

### Documentation
- Reindent the README lists ([#1d41d68](https://github.com/deltabox-studio/toolchain/commit/1d41d68) by [T0chi](https://github.com/T0chi))
- Mirror the VS Code extension installation guide from the README ([#1889832](https://github.com/deltabox-studio/toolchain/issues/1889832) by [T0chi](https://github.com/T0chi))
### Chores
- Update VS Code extension installation guide in `README.md` ([#aab06d5](https://github.com/deltabox-studio/toolchain/commit/aab06d5) by [T0chi](https://github.com/T0chi))

## 1.1.8 (October 2026)

### Documentation
- Hide the site title next to the navbar logo ([#c7935ec](https://github.com/deltabox-studio/toolchain/commit/c7935ec) by [T0chi](https://github.com/T0chi))

## 1.1.7 (October 2026)

### Chores
- Revise CLI commands and VS Code extension details ([#7f043f9](https://github.com/deltabox-studio/toolchain/commit/7f043f9) by [T0chi](https://github.com/T0chi))

## 1.1.6 (October 2026)

### Documentation
- Use `box2d.svg` for the navbar/hero logo and `box2d_bg.svg` for the favicon ([#2c7a094](https://github.com/deltabox-studio/toolchain/commit/2c7a094) by [T0chi](https://github.com/T0chi))

## 1.1.5 (October 2026)

### Bug fixes
#### Changelog
- Bump only the version field and stage only owned files ([#8b14cc9](https://github.com/deltabox-studio/toolchain/commit/8b14cc9) by [T0chi](https://github.com/T0chi))

## 1.1.4 (October 2026)

### Documentation
- Trim the README and refresh the docs/license sections ([#a20deb5](https://github.com/deltabox-studio/toolchain/commit/a20deb5) by [T0chi](https://github.com/T0chi))
### Chores
- Name the changelog and tsconfig bins explicitly ([#50144cd](https://github.com/deltabox-studio/toolchain/commit/50144cd) by [T0chi](https://github.com/T0chi))

## 1.1.3 (October 2026)

### Chores
#### Changelog
- Title the CI section "CI" instead of "Continuous integration" ([#09deb7f](https://github.com/deltabox-studio/toolchain/commit/09deb7f) by [T0chi](https://github.com/T0chi))

## 1.1.2 (October 2026)

### Documentation
- Add a tests badge to the README ([#01513ee](https://github.com/deltabox-studio/toolchain/commit/01513ee) by [T0chi](https://github.com/T0chi))
- Fix `CHANGELOG.md` mojibake and add backticks to code refs ([#6b721eb](https://github.com/deltabox-studio/toolchain/commit/6b721eb) by [T0chi](https://github.com/T0chi))

## 1.1.1 (October 2026)

### Documentation

- Publish `config.schema.json` at the docs site root ([#b7680cb](https://github.com/deltabox-studio/toolchain/commit/b7680cb) by [T0chi](https://github.com/T0chi))
    - The VitePress build now copies the generated `dbx` JSON schema into the dist
      root, so it is served at https://toolchain.deltabox.studio/config.schema.json.

### CI

#### Release

- Publish to npm via trusted publishing (OIDC) ([#41be869](https://github.com/deltabox-studio/toolchain/commit/41be869) by [T0chi](https://github.com/T0chi))
    - Drop the `NPM_TOKEN`-based `yarn npm publish` (which also staged). Use npm
      trusted publishing: `id-token: write`, setup-node `registry-url`, `yarn pack`
      (resolves `catalog:`/`workspace:`) + `npm publish <tarball>` — provenance is
      generated automatically. Re-enable `publishConfig.provenance`.

## 1.1.0 (October 2026)

### New features

#### Vite

- Add a `dbx()` Vite+ plugin and `defineDbxConfig` wrapper ([#a1edaf9](https://github.com/deltabox-studio/toolchain/commit/a1edaf9) by [T0chi](https://github.com/T0chi))
    - Lets Vite+-only consumers drive `dbx` from `vite.config.ts`: `dbx()` runs
      `dbx sync` before dev/build (or `dbx sync --check` in CI) and re-syncs on
      input changes; `defineDbxConfig()` also registers the `vp run dbx:*` tasks
      (Vite+ reads `run.tasks` from the static config, not a plugin hook).

### Chores

- Name the `changelog`/`tsconfig` bins explicitly ([#94c6c17](https://github.com/deltabox-studio/toolchain/commit/94c6c17) by [T0chi](https://github.com/T0chi))

### Package changes

#### Updated

- `vite` `^8.3.0` → `>=5`

## 1.0.8 (October 2026)

### CI

#### Release

- Manage the release workflow from `dbx.config.ts` ([#bf55b70](https://github.com/deltabox-studio/toolchain/commit/bf55b70) by [T0chi](https://github.com/T0chi))
    - Drop the hand-written `.github/workflows/release.yml`; the release flow (tag +
      GitHub Release with the VSIX + notes, `npm publish`, Marketplace publish) is
      now defined under `changelog.workflows.release` in the config and generated
      by `dbx sync`. Removes the need to hand-write CI.

## 1.0.7 (October 2026)

### Bug fixes

#### Vscode

- Package the VSIX without `vp`; ignore `vite.config.ts`; untrack `*.vsix` ([#9d1e403](https://github.com/deltabox-studio/toolchain/commit/9d1e403) by [T0chi](https://github.com/T0chi))

### CI

#### Release

- Release on push to `main` (tag + GitHub Release + npm + Marketplace) ([#4714b1a](https://github.com/deltabox-studio/toolchain/commit/4714b1a) by [T0chi](https://github.com/T0chi))
    - Replaces the generated release-PR workflow with a hand-written one that, on
      each push to `main`, packages the VS Code extension, creates the `v<version>`
      tag and a GitHub Release (notes from `CHANGELOG.md` + the `.vsix` asset),
      publishes `@deltabox/toolchain` to npm, and publishes the extension to the VS
      Code Marketplace. Idempotent: skipped when the tag already exists.

## 1.0.6 (October 2026)

### Documentation

- Add GitHub social links to the navbar and footer ([#2925f1a](https://github.com/deltabox-studio/toolchain/commit/2925f1a) by [T0chi](https://github.com/T0chi))

### Chores

- Name the `changelog`/`tsconfig` bins explicitly and disable publish provenance ([#ba2737d](https://github.com/deltabox-studio/toolchain/commit/ba2737d) by [T0chi](https://github.com/T0chi))

## 1.0.5 (October 2026)

### Documentation

- Update tagline ([#e1fa86e](https://github.com/deltabox-studio/toolchain/commit/e1fa86e) by [T0chi](https://github.com/T0chi))

## 1.0.4 (October 2026)

### Documentation

- Add a table of contents to the `README` ([#b2702e8](https://github.com/deltabox-studio/toolchain/commit/b2702e8) by [T0chi](https://github.com/T0chi))

### Chores

- Fix grammar in the package description ([#8a199b8](https://github.com/deltabox-studio/toolchain/commit/8a199b8) by [T0chi](https://github.com/T0chi))

## 1.0.3 (October 2026)

### Documentation

- Highlight the config generator and link `toolchain.deltabox.studio` ([#836cd36](https://github.com/deltabox-studio/toolchain/commit/836cd36) by [T0chi](https://github.com/T0chi))

### Chores

- Exclude `CHANGELOG.md` from Oxfmt (the changelog pipeline owns its format) ([#f6ad3c0](https://github.com/deltabox-studio/toolchain/commit/f6ad3c0) by [T0chi](https://github.com/T0chi))
- Add `MPL-2.0` `LICENSE` and the project homepage ([#cea0fb5](https://github.com/deltabox-studio/toolchain/commit/cea0fb5) by [T0chi](https://github.com/T0chi))

## 1.0.2 (October 2026)

### Tests

#### Changelog

- Update the release workflow reference fixture ([#e7efe0a](https://github.com/deltabox-studio/toolchain/commit/e7efe0a) by [T0chi](https://github.com/T0chi))

## 1.0.1 (October 2026)

### Bug fixes

#### Changelog

- Tolerate a missing `CHANGELOG.md` in the release workflow ([#18ad219](https://github.com/deltabox-studio/toolchain/commit/18ad219) by [T0chi](https://github.com/T0chi))
    - The release PR job extracted notes with `awk`, which failed when
      `CHANGELOG.md` did not exist yet (a fresh repo). Fall back to an empty notes
      string.
- Create `CHANGELOG.md` when missing; ignore dry-run output ([#f5e4926](https://github.com/deltabox-studio/toolchain/commit/f5e4926) by [T0chi](https://github.com/T0chi))
    - `prependChangelogEntry` read the existing file unconditionally, so the first
      run on a repo without a `CHANGELOG.md` failed with `ENOENT`. Seed it with a
      `# Changelog` header instead. Also gitignore `CHANGELOG.proposed.md`.
- Resolve repo root from `cwd` instead of the module location ([#5278e57](https://github.com/deltabox-studio/toolchain/commit/5278e57) by [T0chi](https://github.com/T0chi))
    - Running `dbx changelog` from source (or from the published package in
      `node_modules`) walked up from `import.meta.url` and landed on the wrong
      `package.json`, so it looked for `CHANGELOG.md` in the wrong directory and
      failed. Resolve the nearest `package.json` above the working directory
      instead.

### Chores

- Add extension keyword ([#99721f3](https://github.com/deltabox-studio/toolchain/commit/99721f3) by [T0chi](https://github.com/T0chi))
- Drop Netlify config (docs move to Railway); move `PLAN.md` out of the repo ([#e51b714](https://github.com/deltabox-studio/toolchain/commit/e51b714) by [T0chi](https://github.com/T0chi))
- Update package description and keywords ([#d75b503](https://github.com/deltabox-studio/toolchain/commit/d75b503) by [T0chi](https://github.com/T0chi))
- Initial commit of `@deltabox/toolchain` ([#ed4673b](https://github.com/deltabox-studio/toolchain/commit/ed4673b) by [T0chi](https://github.com/T0chi))
    - Self-hosts CI + changelog: `dbx.config.ts` drives the generated workflows,
      commitlint config and Conventional-Commits VS Code settings. Config file is
      `dbx.config.*` with sections wrapped under `toolchain`.
