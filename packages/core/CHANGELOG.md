# Changelog

## 3.0.0-beta.2 (November 2026)

<!-- release:start -->

<details>
<summary>Chores</summary>

- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.1 (November 2026)

<details>
<summary>Documentation</summary>

- Align the READMEs and guides with v3 ([#c6487b8](https://github.com/deltabox-studio/toolchain/commit/c6487b8) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Core
- Detect plugin projects and correct project typing ([#7780e0d](https://github.com/deltabox-studio/toolchain/commit/7780e0d) by [T0chi](https://github.com/T0chi))
- Make managed-file formatting opt-in ([#2a7c709](https://github.com/deltabox-studio/toolchain/commit/2a7c709) by [T0chi](https://github.com/T0chi))
- Format managed files after `dbx sync` ([#fb3d9be](https://github.com/deltabox-studio/toolchain/commit/fb3d9be) by [T0chi](https://github.com/T0chi))
- Provision the detected formatter/linter dependencies ([#c5cff9f](https://github.com/deltabox-studio/toolchain/commit/c5cff9f) by [T0chi](https://github.com/T0chi))
- Load plugin configs, manage configless projects and inherit parent plugins ([#9a5c049](https://github.com/deltabox-studio/toolchain/commit/9a5c049) by [T0chi](https://github.com/T0chi))
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))

#### Project
- Place fmt/lint in `vite.config` and stop emitting standalone Oxc configs ([#6621669](https://github.com/deltabox-studio/toolchain/commit/6621669) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Config
- Add `enabled` and `regenerate` controls ([#7f5444a](https://github.com/deltabox-studio/toolchain/commit/7f5444a) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Core
- Resolve config from source in repo-local runs ([#4022d37](https://github.com/deltabox-studio/toolchain/commit/4022d37) by [T0chi](https://github.com/T0chi))
- Correct sync checks, manifest paths and watch globs ([#592dbb0](https://github.com/deltabox-studio/toolchain/commit/592dbb0) by [T0chi](https://github.com/T0chi))
- Support brace and class globs in project filters ([#c16f9ab](https://github.com/deltabox-studio/toolchain/commit/c16f9ab) by [T0chi](https://github.com/T0chi))
- Scope managed formatting and keep checks read-only ([#f5adccb](https://github.com/deltabox-studio/toolchain/commit/f5adccb) by [T0chi](https://github.com/T0chi))
- Emit one root `editor.formatOnSave` and support dotted vscode exclusions ([#ef79025](https://github.com/deltabox-studio/toolchain/commit/ef79025) by [T0chi](https://github.com/T0chi))

#### Vite
- Correct shim config resolution and plugin syncing ([#21b0312](https://github.com/deltabox-studio/toolchain/commit/21b0312) by [T0chi](https://github.com/T0chi))

#### Shared
- Tolerate UTF-8 BOM across JSON readers ([#a021da7](https://github.com/deltabox-studio/toolchain/commit/a021da7) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

#### Config
- Share the runtime loader with core ([#e84e4e6](https://github.com/deltabox-studio/toolchain/commit/e84e4e6) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Changelog
- Apply details formatting to historical entries ([#0bfbd98](https://github.com/deltabox-studio/toolchain/commit/0bfbd98) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Styles</summary>

- Restore 4-space formatting for tooling dependency files ([#c8f0d4d](https://github.com/deltabox-studio/toolchain/commit/c8f0d4d) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Tests</summary>

#### Core
- Verify resolved import group formatter output ([#51d5a0d](https://github.com/deltabox-studio/toolchain/commit/51d5a0d) by [T0chi](https://github.com/T0chi))

</details>

## 2.6.1 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Changelog
- Scope package changes by package name ([#0ee9b9e](https://github.com/deltabox-studio/toolchain/commit/0ee9b9e) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - key dependency changes by the declaring package.json name so workspace-specific pins (eg. the docs site's Vite 5) are reported under that workspace
    - scope the catalog to the root package name; keep workspace catalog: refs unresolved so a catalog bump is reported once
    - add regression tests and regenerate every CHANGELOG.md with the scoped footer

  </details>

</details>

## 2.5.0 (November 2026)

<details>
<summary>New features</summary>

#### Biome
- Add array removal directives and resolve toolchain debt ([#da100c8](https://github.com/deltabox-studio/toolchain/commit/da100c8) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - add $remove: / $reset array directives with a resolver step for biome.json
    - fix peer warnings (declare vite, filter the stale VitePress plugin peer)
    - replace the RULE_MAP cast with an Object.hasOwn guard
    - add a direct extension env-propagation test
    - drop the 30s real-git changelog timeout

  </details>

#### Cli
- Add `sync --only` task selection and `selectSyncTasks` ([#49d73dd](https://github.com/deltabox-studio/toolchain/commit/49d73dd) by [T0chi](https://github.com/T0chi))

#### Core
- Expand VS Code formatter/linter defaults ([#e9ad3ff](https://github.com/deltabox-studio/toolchain/commit/e9ad3ff) by [T0chi](https://github.com/T0chi))
- Resolve concrete watch inputs and update the VS Code watcher ([#425f0d3](https://github.com/deltabox-studio/toolchain/commit/425f0d3) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Core
- Inherit only shared sections in configless projects ([#3c62b6f](https://github.com/deltabox-studio/toolchain/commit/3c62b6f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - A configless project inherited the ancestor config as-is, so repository-level sections (ci, changelog, catalogs, tsconfig) and workspace-scoped vite.test/vite.run leaked into it. Merge the parent with an empty child config instead, which drops those sections and the parent's project identity while keeping the shared metadata and vite fmt/lint.

  </details>

- Stop inheriting project identity for configless workspaces ([#8f163ed](https://github.com/deltabox-studio/toolchain/commit/8f163ed) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - A nested workspace without its own dbx.config.* inherited the parent's project name/scope/description/type, so it could be detected as monorepo-root and lose its package.json identity. Strip the identity fields (and still drop the parent's hooks) when a configless project inherits an ancestor config.

  </details>

#### Vscode
- Scope auto-sync watchers to their workspace root ([#6604b23](https://github.com/deltabox-studio/toolchain/commit/6604b23) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - String globs match across every workspace folder, and any watcher event synced every root. Scope each resolved input to its owning root (watching a concrete nested file from its own directory so the watcher stays non-recursive), drop absolute/ancestor globs, and sync only the root whose input changed. The CLI also rejects unsafe user globs.

  </details>

</details>

<details>
<summary>Refactors</summary>

- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))

</details>

## 2.4.0 (November 2026)

<details>
<summary>New features</summary>

#### Project
- Add config generation options and migration routing ([#c658b0d](https://github.com/deltabox-studio/toolchain/commit/c658b0d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Support --skip-config, --language and --config-extension, write the project graph before configs, generate TS/JS configs, and route migrated fmt/lint into toolchain.vite only when the existing Vite config owns them.

  </details>

#### Core
- Add import sorting defaults and workspace groups ([#1c5f5a3](https://github.com/deltabox-studio/toolchain/commit/1c5f5a3) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Enable sortImports by default, resolve a workspace custom group from the project graph, and inject it into resolveVite, vite sync and tooling normalization.

  </details>

</details>

<details>
<summary>Chores</summary>

- Regenerate managed configs for import sorting ([#ce7a2e6](https://github.com/deltabox-studio/toolchain/commit/ce7a2e6) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Regenerate .oxfmtrc.json and every workspace vite.config.ts with the resolved sortImports workspace group.

  </details>

</details>

## 2.3.1 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.

  </details>

#### Core
- Preserve .vscode settings comments when adding keys ([#9b4a105](https://github.com/deltabox-studio/toolchain/commit/9b4a105) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Merging VS Code settings parsed and reserialized the file, dropping its JSONC comments. Insert missing keys in place (preserving layout) and fall back to a full rewrite only when an existing value or array must change.

  </details>

#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.

  </details>

</details>

## 2.3.0 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Core
- Keep VS Code files user-owned and guard registry cycles ([#9ef027a](https://github.com/deltabox-studio/toolchain/commit/9ef027a) by [T0chi](https://github.com/T0chi))
- Keep watch sessions alive and re-sync config edits ([#2849757](https://github.com/deltabox-studio/toolchain/commit/2849757) by [T0chi](https://github.com/T0chi))
- Reject conflicting `--config` flags ([#1044f2a](https://github.com/deltabox-studio/toolchain/commit/1044f2a) by [T0chi](https://github.com/T0chi))
- Skip parent hooks for config-less workspaces ([#9658c36](https://github.com/deltabox-studio/toolchain/commit/9658c36) by [T0chi](https://github.com/T0chi))
- Keep managed paths inside the project root ([#2496bee](https://github.com/deltabox-studio/toolchain/commit/2496bee) by [T0chi](https://github.com/T0chi))

</details>
