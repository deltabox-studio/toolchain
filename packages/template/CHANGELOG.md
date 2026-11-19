# Changelog

## 3.0.0-beta.1 (November 2026)

<!-- release:start -->

<details>
<summary>Documentation</summary>

- Align the READMEs and guides with v3 ([#c6487b8](https://github.com/deltabox-studio/toolchain/commit/c6487b8) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Cli
- Finish spinners and conservative scaffold ranges ([#85ea426](https://github.com/deltabox-studio/toolchain/commit/85ea426) by [T0chi](https://github.com/T0chi))
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Docker
- Correct container builds and runtime setup ([#0567bcd](https://github.com/deltabox-studio/toolchain/commit/0567bcd) by [T0chi](https://github.com/T0chi))
- Allow user-owned files and always add compose ([#51b9ccc](https://github.com/deltabox-studio/toolchain/commit/51b9ccc) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Template
- Report create failures and require `--online` ([#dcc5604](https://github.com/deltabox-studio/toolchain/commit/dcc5604) by [T0chi](https://github.com/T0chi))

#### Project
- Correct scaffold dependencies, sync identity and templates ([#a13dae5](https://github.com/deltabox-studio/toolchain/commit/a13dae5) by [T0chi](https://github.com/T0chi))
- Scaffold the Vite plugin, Vite+ toolchain and publishable packages ([#c9d94fe](https://github.com/deltabox-studio/toolchain/commit/c9d94fe) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))

#### Core
- Provision the detected formatter/linter dependencies ([#c5cff9f](https://github.com/deltabox-studio/toolchain/commit/c5cff9f) by [T0chi](https://github.com/T0chi))
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Template
- Add opt-in containerization to scaffolds ([#51732a4](https://github.com/deltabox-studio/toolchain/commit/51732a4) by [T0chi](https://github.com/T0chi))
- Expose the quality-of-life builtins ([#a7a0b3c](https://github.com/deltabox-studio/toolchain/commit/a7a0b3c) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Template
- Validate scaffolds and forward source metadata ([#7953add](https://github.com/deltabox-studio/toolchain/commit/7953add) by [T0chi](https://github.com/T0chi))
- Resolve registry sources from the project root ([#be3c94a](https://github.com/deltabox-studio/toolchain/commit/be3c94a) by [T0chi](https://github.com/T0chi))
- Keep machine output clean and honour registry settings ([#eda93e1](https://github.com/deltabox-studio/toolchain/commit/eda93e1) by [T0chi](https://github.com/T0chi))
- Honour ignore globs and preserve binary assets ([#c2fd467](https://github.com/deltabox-studio/toolchain/commit/c2fd467) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Reconcile overrides before generation and harden remote extends ([#0fa2caa](https://github.com/deltabox-studio/toolchain/commit/0fa2caa) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Split package typings into `src/types` barrels ([#45e5032](https://github.com/deltabox-studio/toolchain/commit/45e5032) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Changelog
- Apply details formatting to historical entries ([#0bfbd98](https://github.com/deltabox-studio/toolchain/commit/0bfbd98) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Tests</summary>

- Cover the quality-of-life templates ([#79822ba](https://github.com/deltabox-studio/toolchain/commit/79822ba) by [T0chi](https://github.com/T0chi))

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

#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))

</details>

## 2.4.0 (November 2026)

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
