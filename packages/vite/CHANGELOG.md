# Changelog

## 3.0.0-beta.7 (November 2026)

<!-- release:start -->

<details>
<summary>Chores</summary>

- Update domain `toolchain.deltabox.studio` to `toolchain.dbx.studio` ([#966f975](https://github.com/deltabox-studio/toolchain/commit/966f975) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.6 (November 2026)

<details>
<summary>Bug fixes</summary>

- Use the published Vite subpath in generated configs ([#d5f2fab](https://github.com/deltabox-studio/toolchain/commit/d5f2fab) by [T0chi](https://github.com/T0chi))

#### Vite
- Harden resolution, shim merging and Vite+ detection ([#0558430](https://github.com/deltabox-studio/toolchain/commit/0558430) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Refresh readmes and extension copy ([#ad7e37d](https://github.com/deltabox-studio/toolchain/commit/ad7e37d) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Cleanup references ([#a0027cd](https://github.com/deltabox-studio/toolchain/commit/a0027cd) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.5 (November 2026)

<details>
<summary>New features</summary>

- Align hooks and monorepo guidance with Vite+ ([#0aadd01](https://github.com/deltabox-studio/toolchain/commit/0aadd01) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.4 (November 2026)

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

## 3.0.0-beta.3 (November 2026)

<details>
<summary>Documentation</summary>

- Update the Vite plugin README ([#7adb895](https://github.com/deltabox-studio/toolchain/commit/7adb895) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))
- Sync the workspace metadata ([#1104d1b](https://github.com/deltabox-studio/toolchain/commit/1104d1b) by [T0chi](https://github.com/T0chi))
- Sync the Vite package metadata ([#459670b](https://github.com/deltabox-studio/toolchain/commit/459670b) by [T0chi](https://github.com/T0chi))
- Update the package keywords ([#8554023](https://github.com/deltabox-studio/toolchain/commit/8554023) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.2 (November 2026)

<details>
<summary>Documentation</summary>

- Document the Vite plugin and Vite+ commands ([#95c1e66](https://github.com/deltabox-studio/toolchain/commit/95c1e66) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.1 (November 2026)

<details>
<summary>Chores</summary>

- Add the codegen keyword to the package manifests ([#5e608fe](https://github.com/deltabox-studio/toolchain/commit/5e608fe) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Cli
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))
- Serialize regex aliases for JSON transports ([#d7d8caf](https://github.com/deltabox-studio/toolchain/commit/d7d8caf) by [T0chi](https://github.com/T0chi))

#### Project
- Place fmt/lint in `vite.config` and stop emitting standalone Oxc configs ([#6621669](https://github.com/deltabox-studio/toolchain/commit/6621669) by [T0chi](https://github.com/T0chi))

#### Vite
- Rename the package to `vite-plugin-dbx` and default to plugin mode ([#3a2cdcb](https://github.com/deltabox-studio/toolchain/commit/3a2cdcb) by [T0chi](https://github.com/T0chi))
- Only write a shim when the project declares its own `vite` section ([#fa7de36](https://github.com/deltabox-studio/toolchain/commit/fa7de36) by [T0chi](https://github.com/T0chi))

#### Core
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Cli
- Keep spinners readable and surface passthrough failures ([#747937b](https://github.com/deltabox-studio/toolchain/commit/747937b) by [T0chi](https://github.com/T0chi))

#### Config
- Add `enabled` and `regenerate` controls ([#7f5444a](https://github.com/deltabox-studio/toolchain/commit/7f5444a) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Tsconfig
- Reconcile overrides before generation and harden remote extends ([#0fa2caa](https://github.com/deltabox-studio/toolchain/commit/0fa2caa) by [T0chi](https://github.com/T0chi))

#### Vite
- Correct shim config resolution and plugin syncing ([#21b0312](https://github.com/deltabox-studio/toolchain/commit/21b0312) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Changelog
- Apply details formatting to historical entries ([#0bfbd98](https://github.com/deltabox-studio/toolchain/commit/0bfbd98) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Normalize imports and docs ([#c7f0d25](https://github.com/deltabox-studio/toolchain/commit/c7f0d25) by [T0chi](https://github.com/T0chi))

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

#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))

</details>

## 2.4.0 (November 2026)

<details>
<summary>New features</summary>

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

#### Vite
- Surface sync failures and preserve config values ([#93ee933](https://github.com/deltabox-studio/toolchain/commit/93ee933) by [T0chi](https://github.com/T0chi))

</details>
