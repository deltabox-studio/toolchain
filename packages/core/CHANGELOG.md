# Changelog

## 2.5.0 (November 2026)

<!-- release:start -->

### New features
#### Biome
- Add array removal directives and resolve toolchain debt ([#da100c8](https://github.com/deltabox-studio/toolchain/commit/da100c8) by [T0chi](https://github.com/T0chi))
  - add $remove: / $reset array directives with a resolver step for biome.json
  - fix peer warnings (declare vite, filter the stale VitePress plugin peer)
  - replace the RULE_MAP cast with an Object.hasOwn guard
  - add a direct extension env-propagation test
  - drop the 30s real-git changelog timeout
#### Cli
- Add `sync --only` task selection and `selectSyncTasks` ([#49d73dd](https://github.com/deltabox-studio/toolchain/commit/49d73dd) by [T0chi](https://github.com/T0chi))
#### Core
- Expand VS Code formatter/linter defaults ([#e9ad3ff](https://github.com/deltabox-studio/toolchain/commit/e9ad3ff) by [T0chi](https://github.com/T0chi))
- Resolve concrete watch inputs and update the VS Code watcher ([#425f0d3](https://github.com/deltabox-studio/toolchain/commit/425f0d3) by [T0chi](https://github.com/T0chi))
#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Core
- Inherit only shared sections in configless projects ([#3c62b6f](https://github.com/deltabox-studio/toolchain/commit/3c62b6f) by [T0chi](https://github.com/T0chi))
  - A configless project inherited the ancestor config as-is, so repository-level sections (ci, changelog, catalogs, tsconfig) and workspace-scoped vite.test/vite.run leaked into it. Merge the parent with an empty child config instead, which drops those sections and the parent's project identity while keeping the shared metadata and vite fmt/lint.
- Stop inheriting project identity for configless workspaces ([#8f163ed](https://github.com/deltabox-studio/toolchain/commit/8f163ed) by [T0chi](https://github.com/T0chi))
  - A nested workspace without its own dbx.config.* inherited the parent's project name/scope/description/type, so it could be detected as monorepo-root and lose its package.json identity. Strip the identity fields (and still drop the parent's hooks) when a configless project inherits an ancestor config.
#### Vscode
- Scope auto-sync watchers to their workspace root ([#6604b23](https://github.com/deltabox-studio/toolchain/commit/6604b23) by [T0chi](https://github.com/T0chi))
  - String globs match across every workspace folder, and any watcher event synced every root. Scope each resolved input to its owning root (watching a concrete nested file from its own directory so the watcher stays non-recursive), drop absolute/ancestor globs, and sync only the root whose input changed. The CLI also rejects unsafe user globs.
### Refactors
- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))

<!-- release:end -->


## 2.4.0 (November 2026)

### New features
#### Project
- Add config generation options and migration routing ([#c658b0d](https://github.com/deltabox-studio/toolchain/commit/c658b0d) by [T0chi](https://github.com/T0chi))
  - Support --skip-config, --language and --config-extension, write the project graph before configs, generate TS/JS configs, and route migrated fmt/lint into toolchain.vite only when the existing Vite config owns them.
#### Core
- Add import sorting defaults and workspace groups ([#1c5f5a3](https://github.com/deltabox-studio/toolchain/commit/1c5f5a3) by [T0chi](https://github.com/T0chi))
  - Enable sortImports by default, resolve a workspace custom group from the project graph, and inject it into resolveVite, vite sync and tooling normalization.
### Chores
- Regenerate managed configs for import sorting ([#ce7a2e6](https://github.com/deltabox-studio/toolchain/commit/ce7a2e6) by [T0chi](https://github.com/T0chi))
  - Regenerate .oxfmtrc.json and every workspace vite.config.ts with the resolved sortImports workspace group.

## 2.3.1 (November 2026)

### Bug fixes
#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))
  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.
#### Core
- Preserve .vscode settings comments when adding keys ([#9b4a105](https://github.com/deltabox-studio/toolchain/commit/9b4a105) by [T0chi](https://github.com/T0chi))
  - Merging VS Code settings parsed and reserialized the file, dropping its JSONC comments. Insert missing keys in place (preserving layout) and fall back to a full rewrite only when an existing value or array must change.
#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))
  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.

## 2.3.0 (November 2026)

### Bug fixes
#### Core
- Keep VS Code files user-owned and guard registry cycles ([#9ef027a](https://github.com/deltabox-studio/toolchain/commit/9ef027a) by [T0chi](https://github.com/T0chi))
- Keep watch sessions alive and re-sync config edits ([#2849757](https://github.com/deltabox-studio/toolchain/commit/2849757) by [T0chi](https://github.com/T0chi))
- Reject conflicting `--config` flags ([#1044f2a](https://github.com/deltabox-studio/toolchain/commit/1044f2a) by [T0chi](https://github.com/T0chi))
- Skip parent hooks for config-less workspaces ([#9658c36](https://github.com/deltabox-studio/toolchain/commit/9658c36) by [T0chi](https://github.com/T0chi))
- Keep managed paths inside the project root ([#2496bee](https://github.com/deltabox-studio/toolchain/commit/2496bee) by [T0chi](https://github.com/T0chi))
