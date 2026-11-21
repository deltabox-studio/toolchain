# Changelog

## 3.0.0-beta.3 (November 2026)

<!-- release:start -->

<details>
<summary>Refactors</summary>

- Normalize default JSDoc annotations ([#04f47e8](https://github.com/deltabox-studio/toolchain/commit/04f47e8) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Split resolution and derive flags from schema ([#4d1d784](https://github.com/deltabox-studio/toolchain/commit/4d1d784) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Break the tsconfig resolver into focused modules and generate the tsconfig command's config-backed flags from the config engine. Runtime-only auto switches stay explicit, while aliases, refs, indentation, globs and gitignore now inherit config/env/CLI precedence from the schema.

  </details>

</details>

<!-- release:end -->


## 3.0.0-beta.2 (November 2026)

<details>
<summary>Chores</summary>

- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.1 (November 2026)

<details>
<summary>Documentation</summary>

- Align the READMEs and guides with v3 ([#c6487b8](https://github.com/deltabox-studio/toolchain/commit/c6487b8) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Tsconfig
- Support remote extends with opt-in flattening ([#44b5c8a](https://github.com/deltabox-studio/toolchain/commit/44b5c8a) by [T0chi](https://github.com/T0chi))
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))
- Serialize regex aliases for JSON transports ([#d7d8caf](https://github.com/deltabox-studio/toolchain/commit/d7d8caf) by [T0chi](https://github.com/T0chi))
- Hoist include/exclude and respect custom file names ([#e926b8a](https://github.com/deltabox-studio/toolchain/commit/e926b8a) by [T0chi](https://github.com/T0chi))

#### Config
- Rename the generated ambient env types to `dbx-env.d.ts` ([#078b316](https://github.com/deltabox-studio/toolchain/commit/078b316) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Core
- Format managed files after `dbx sync` ([#fb3d9be](https://github.com/deltabox-studio/toolchain/commit/fb3d9be) by [T0chi](https://github.com/T0chi))
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Cli
- Add changelog intro/outro flags and respect `enabled` ([#7d74c71](https://github.com/deltabox-studio/toolchain/commit/7d74c71) by [T0chi](https://github.com/T0chi))

#### Config
- Add `enabled` and `regenerate` controls ([#7f5444a](https://github.com/deltabox-studio/toolchain/commit/7f5444a) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Tsconfig
- Reconcile overrides before generation and harden remote extends ([#0fa2caa](https://github.com/deltabox-studio/toolchain/commit/0fa2caa) by [T0chi](https://github.com/T0chi))
- Support directory and self project references ([#98018b6](https://github.com/deltabox-studio/toolchain/commit/98018b6) by [T0chi](https://github.com/T0chi))
- Resolve nested root files and honour them in --json ([#d1ce26d](https://github.com/deltabox-studio/toolchain/commit/d1ce26d) by [T0chi](https://github.com/T0chi))
- Normalize auto-wired reference paths ([#2a0ce95](https://github.com/deltabox-studio/toolchain/commit/2a0ce95) by [T0chi](https://github.com/T0chi))
- Sort generated paths consistently ([#053d331](https://github.com/deltabox-studio/toolchain/commit/053d331) by [T0chi](https://github.com/T0chi))

#### Shared
- Tolerate UTF-8 BOM across JSON readers ([#a021da7](https://github.com/deltabox-studio/toolchain/commit/a021da7) by [T0chi](https://github.com/T0chi))

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

#### Config
- Use string & {} for open index signatures ([#11665c0](https://github.com/deltabox-studio/toolchain/commit/11665c0) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Emit [key: string & {}] from the config generator and use it in hand-written open maps, keeping known keys visible to autocomplete. Zod cannot express this key type, so the generator remains the post-processing point.
    - Also make the workflow filename/token defaults literal constants.

  </details>

#### Shared
- Use as const for exported defaults ([#5b37c08](https://github.com/deltabox-studio/toolchain/commit/5b37c08) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Prefer literal tuples/objects over broad annotations, derive the related union types, and keep dynamic lookups/mutable copies behind small helpers.

  </details>

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

#### Tsconfig
- Read referenced configs as JSONC ([#49ded19](https://github.com/deltabox-studio/toolchain/commit/49ded19) by [T0chi](https://github.com/T0chi))

</details>
