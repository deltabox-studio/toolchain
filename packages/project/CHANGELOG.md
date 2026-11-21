# Changelog

## 3.0.0-beta.3 (November 2026)

<!-- release:start -->

<details>
<summary>New features</summary>

#### Shared
- Add typed CLI command descriptors ([#afbb10b](https://github.com/deltabox-studio/toolchain/commit/afbb10b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Replace the loose ToolchainCommand interfaces with generic CliCommand types that infer option values from the flags list, and add defineCliCommand for literal inference. Migrate the package command factories and tests, and rename the reset options type accordingly.

  </details>

</details>

<details>
<summary>Refactors</summary>

- Normalize default JSDoc annotations ([#04f47e8](https://github.com/deltabox-studio/toolchain/commit/04f47e8) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Styles</summary>

- Replace unicode ellipses with three dots ([#2d7c130](https://github.com/deltabox-studio/toolchain/commit/2d7c130) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.2 (November 2026)

<details>
<summary>Chores</summary>

- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.1 (November 2026)

<details>
<summary>New features</summary>

#### Project
- Leave fmt and lint to the root in nested scaffolds ([#c646ea5](https://github.com/deltabox-studio/toolchain/commit/c646ea5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Align the READMEs and guides with v3 ([#c6487b8](https://github.com/deltabox-studio/toolchain/commit/c6487b8) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

- Stop managing standalone Oxc configs in Vite+ mode ([#781367f](https://github.com/deltabox-studio/toolchain/commit/781367f) by [T0chi](https://github.com/T0chi))

#### Cli
- Finish spinners and conservative scaffold ranges ([#85ea426](https://github.com/deltabox-studio/toolchain/commit/85ea426) by [T0chi](https://github.com/T0chi))
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Support remote extends with opt-in flattening ([#44b5c8a](https://github.com/deltabox-studio/toolchain/commit/44b5c8a) by [T0chi](https://github.com/T0chi))
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Project
- Avoid inheriting the parent name for `--out` scaffolds ([#1513508](https://github.com/deltabox-studio/toolchain/commit/1513508) by [T0chi](https://github.com/T0chi))
- Correct scaffold dependencies, sync identity and templates ([#a13dae5](https://github.com/deltabox-studio/toolchain/commit/a13dae5) by [T0chi](https://github.com/T0chi))
- Place fmt/lint in `vite.config` and stop emitting standalone Oxc configs ([#6621669](https://github.com/deltabox-studio/toolchain/commit/6621669) by [T0chi](https://github.com/T0chi))
- Scaffold the Vite plugin, Vite+ toolchain and publishable packages ([#c9d94fe](https://github.com/deltabox-studio/toolchain/commit/c9d94fe) by [T0chi](https://github.com/T0chi))

#### Docker
- Allow user-owned files and always add compose ([#51b9ccc](https://github.com/deltabox-studio/toolchain/commit/51b9ccc) by [T0chi](https://github.com/T0chi))

#### Core
- Provision the detected formatter/linter dependencies ([#c5cff9f](https://github.com/deltabox-studio/toolchain/commit/c5cff9f) by [T0chi](https://github.com/T0chi))
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Config
- Add `enabled` and `regenerate` controls ([#7f5444a](https://github.com/deltabox-studio/toolchain/commit/7f5444a) by [T0chi](https://github.com/T0chi))

#### Template
- Add opt-in containerization to scaffolds ([#51732a4](https://github.com/deltabox-studio/toolchain/commit/51732a4) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

#### Project
- Add quality-of-life template generators ([#85cdd6f](https://github.com/deltabox-studio/toolchain/commit/85cdd6f) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Project
- Harden scaffolds and make Docker plans template-aware ([#e937042](https://github.com/deltabox-studio/toolchain/commit/e937042) by [T0chi](https://github.com/T0chi))
- Keep plugin projects in the rewritten graph ([#9f81f8d](https://github.com/deltabox-studio/toolchain/commit/9f81f8d) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Reconcile overrides before generation and harden remote extends ([#0fa2caa](https://github.com/deltabox-studio/toolchain/commit/0fa2caa) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Move public typings into src/types barrels ([#f727890](https://github.com/deltabox-studio/toolchain/commit/f727890) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Changelog
- Apply details formatting to historical entries ([#0bfbd98](https://github.com/deltabox-studio/toolchain/commit/0bfbd98) by [T0chi](https://github.com/T0chi))

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

## 2.6.0 (November 2026)

<details>
<summary>New features</summary>

- Route fmt/lint to the active tool and opt scaffolds into catalogs ([#76df575](https://github.com/deltabox-studio/toolchain/commit/76df575) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - dbx fmt/lint resolve the configured/discovered formatter or linter (oxc > biome > prettier > dprint; oxc > biome > eslint) and run it, falling back to the vp/Oxc passthrough
    - project:init/create scaffolds add the catalogs section for the catalog file they write, so dbx sync owns it instead of leaving the managed file orphaned
    - document the active-tool routing and add the dedicated package catalogs guide

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

#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Core
- Stop inheriting project identity for configless workspaces ([#8f163ed](https://github.com/deltabox-studio/toolchain/commit/8f163ed) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - A nested workspace without its own dbx.config.* inherited the parent's project name/scope/description/type, so it could be detected as monorepo-root and lose its package.json identity. Strip the identity fields (and still drop the parent's hooks) when a configless project inherits an ancestor config.

  </details>

#### Project
- Resolve repository.directory without a git checkout ([#a2d53d6](https://github.com/deltabox-studio/toolchain/commit/a2d53d6) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - fall back to the nearest ancestor dbx.config.* when no .git root is found
    - keep the git checkout as the primary repository root
    - add a regression test for a nested workspace without a .git checkout

  </details>

</details>

<details>
<summary>Refactors</summary>

- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))

#### Shared
- Use as const for exported defaults ([#5b37c08](https://github.com/deltabox-studio/toolchain/commit/5b37c08) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Prefer literal tuples/objects over broad annotations, derive the related union types, and keep dynamic lookups/mutable copies behind small helpers.

  </details>

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

#### Project
- Validate workspace paths before writing ([#0ef515e](https://github.com/deltabox-studio/toolchain/commit/0ef515e) by [T0chi](https://github.com/T0chi))

</details>
