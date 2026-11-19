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

- Resolve the bug-hunt findings ([#f07f951](https://github.com/deltabox-studio/toolchain/commit/f07f951) by [T0chi](https://github.com/T0chi))

#### Config
- Add preserved JSON Schema and markdown docs engine APIs ([#6e3d36c](https://github.com/deltabox-studio/toolchain/commit/6e3d36c) by [T0chi](https://github.com/T0chi))
- Emit valid schemas and guard generated config validity ([#5fb7667](https://github.com/deltabox-studio/toolchain/commit/5fb7667) by [T0chi](https://github.com/T0chi))
- Rename the generated ambient env types to `dbx-env.d.ts` ([#078b316](https://github.com/deltabox-studio/toolchain/commit/078b316) by [T0chi](https://github.com/T0chi))
- Align env parsing and file loading ([#7912425](https://github.com/deltabox-studio/toolchain/commit/7912425) by [T0chi](https://github.com/T0chi))
- Correct schema conversion and generator output ([#10ff4b1](https://github.com/deltabox-studio/toolchain/commit/10ff4b1) by [T0chi](https://github.com/T0chi))
- Add runtime config APIs and grouped `ConfigEngine` types ([#b69980e](https://github.com/deltabox-studio/toolchain/commit/b69980e) by [T0chi](https://github.com/T0chi))
- Add `collect`, parser and config loader APIs ([#4a3b745](https://github.com/deltabox-studio/toolchain/commit/4a3b745) by [T0chi](https://github.com/T0chi))
- Move file generators and complete `config:all` ([#24de58a](https://github.com/deltabox-studio/toolchain/commit/24de58a) by [T0chi](https://github.com/T0chi))

#### Cli
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))

#### Core
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

#### Config
- Update generated formatting and config generators ([#62897df](https://github.com/deltabox-studio/toolchain/commit/62897df) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Escape generated JSDoc comments, closes [#41](https://github.com/deltabox-studio/toolchain/issues/41) ([#220d228](https://github.com/deltabox-studio/toolchain/commit/220d228) by [T0chi](https://github.com/T0chi)) (fixes [#41](https://github.com/deltabox-studio/toolchain/issues/41))
- Harden schema validation and generated output ([#64efa45](https://github.com/deltabox-studio/toolchain/commit/64efa45) by [T0chi](https://github.com/T0chi))
- Report the written type file extension ([#cf56517](https://github.com/deltabox-studio/toolchain/commit/cf56517) by [T0chi](https://github.com/T0chi))

#### Core
- Resolve config from source in repo-local runs ([#4022d37](https://github.com/deltabox-studio/toolchain/commit/4022d37) by [T0chi](https://github.com/T0chi))

#### Cli
- Harden flag parsing and document library-only config commands ([#aaaa11a](https://github.com/deltabox-studio/toolchain/commit/aaaa11a) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Move public typings into src/types barrels ([#f727890](https://github.com/deltabox-studio/toolchain/commit/f727890) by [T0chi](https://github.com/T0chi))
- Split package typings into `src/types` barrels ([#45e5032](https://github.com/deltabox-studio/toolchain/commit/45e5032) by [T0chi](https://github.com/T0chi))

#### Config
- Share the runtime loader with core ([#e84e4e6](https://github.com/deltabox-studio/toolchain/commit/e84e4e6) by [T0chi](https://github.com/T0chi))

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

## 2.5.0 (November 2026)

<details>
<summary>New features</summary>

#### Config
- Add a reusable CLI docs generator ([#900566a](https://github.com/deltabox-studio/toolchain/commit/900566a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - add generateCliDocs(commands, options?) for custom command descriptors
    - use it to render the dbx CLI reference
    - document generating docs for a consumer's own command list
    - cover hidden/duplicate commands, args/options and custom prefix/title

  </details>

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

#### Config
- Contain generator output paths and render object metadata ([#fe94053](https://github.com/deltabox-studio/toolchain/commit/fe94053) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Scope names and file options were used as paths directly, so a \../\ value could write outside the output directory. Resolve every generated file through a containment check. Also render an object node's own description/annotations before its child fields in per-scope markdown.

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
<summary>New features</summary>

#### Config
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Respect secret defaults, `envPathOf` and changelog disabling ([#5cabab8](https://github.com/deltabox-studio/toolchain/commit/5cabab8) by [T0chi](https://github.com/T0chi))
- Keep named `$ref` schema properties ([#0aa03a1](https://github.com/deltabox-studio/toolchain/commit/0aa03a1) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Config
- Document the open `WorkflowJob` type ([#779566b](https://github.com/deltabox-studio/toolchain/commit/779566b) by [T0chi](https://github.com/T0chi))

</details>
