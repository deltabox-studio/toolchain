# Changelog

## 3.0.0-beta.9 (November 2026)

<!-- release:start -->

<details>
<summary>New features</summary>

#### Release
- Mark prerelease versions as GitHub prereleases ([#dd1c62f](https://github.com/deltabox-studio/toolchain/commit/dd1c62f) by [T0chi](https://github.com/T0chi))

#### Changelog
- Document bump rules and harden versioning providers ([#5ae5e02](https://github.com/deltabox-studio/toolchain/commit/5ae5e02) by [T0chi](https://github.com/T0chi))
- Group release bodies since the last published release ([#93b8762](https://github.com/deltabox-studio/toolchain/commit/93b8762) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.8 (November 2026)

<details>
<summary>Chores</summary>

- Cleanup references ([#a0027cd](https://github.com/deltabox-studio/toolchain/commit/a0027cd) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.7 (November 2026)

<details>
<summary>New features</summary>

- Align hooks and monorepo guidance with Vite+ ([#0aadd01](https://github.com/deltabox-studio/toolchain/commit/0aadd01) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.6 (November 2026)

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
<summary>Bug fixes</summary>

#### Changelog
- Build release bodies from markers and rename flags ([#825985d](https://github.com/deltabox-studio/toolchain/commit/825985d) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Normalize default JSDoc annotations ([#04f47e8](https://github.com/deltabox-studio/toolchain/commit/04f47e8) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Styles</summary>

- Replace unicode ellipses with three dots ([#2d7c130](https://github.com/deltabox-studio/toolchain/commit/2d7c130) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.5 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Changelog
- Roll prereleases over to their stable core ([#c27bbb5](https://github.com/deltabox-studio/toolchain/commit/c27bbb5) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.4 (November 2026)

<details>
<summary>Chores</summary>

- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.3 (November 2026)

<details>
<summary>Chores</summary>

#### Ci
- Bump setup-vp to v1.22.0 ([#9c32cae](https://github.com/deltabox-studio/toolchain/commit/9c32cae) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.2 (November 2026)

<details>
<summary>Documentation</summary>

- Align the READMEs and guides with v3 ([#c6487b8](https://github.com/deltabox-studio/toolchain/commit/c6487b8) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.1 (November 2026)

<details>
<summary>New features</summary>

#### Changelog
- Add the beforeVersion lifecycle hook ([#3f62f0c](https://github.com/deltabox-studio/toolchain/commit/3f62f0c) by [T0chi](https://github.com/T0chi))
- Add the afterVersion lifecycle hook ([#c927eee](https://github.com/deltabox-studio/toolchain/commit/c927eee) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

- Resolve the bug-hunt findings ([#f07f951](https://github.com/deltabox-studio/toolchain/commit/f07f951) by [T0chi](https://github.com/T0chi))

#### Changelog
- Relabel details summaries and default the release body ([#7ccfc86](https://github.com/deltabox-studio/toolchain/commit/7ccfc86) by [T0chi](https://github.com/T0chi))
- Group package changes and batch ref reads ([#1a5e8a9](https://github.com/deltabox-studio/toolchain/commit/1a5e8a9) by [T0chi](https://github.com/T0chi))
- Add collapsible `details` rendering ([#f7d1c6a](https://github.com/deltabox-studio/toolchain/commit/f7d1c6a) by [T0chi](https://github.com/T0chi))
- Make releases idempotent and prerelease-aware ([#610138b](https://github.com/deltabox-studio/toolchain/commit/610138b) by [T0chi](https://github.com/T0chi))
- Use `setup-vp` for GitLab and Azure CI ([#268b08b](https://github.com/deltabox-studio/toolchain/commit/268b08b) by [T0chi](https://github.com/T0chi))
- Generate Vite+ CI with `voidzero-dev/setup-vp` ([#6dbf702](https://github.com/deltabox-studio/toolchain/commit/6dbf702) by [T0chi](https://github.com/T0chi))

#### Cli
- Finish spinners and conservative scaffold ranges ([#85ea426](https://github.com/deltabox-studio/toolchain/commit/85ea426) by [T0chi](https://github.com/T0chi))
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

#### Ci
- Add Dependabot security updates ([#467e3eb](https://github.com/deltabox-studio/toolchain/commit/467e3eb) by [T0chi](https://github.com/T0chi))

#### Changelog
- Add `minCommits` and nested `See more...` descriptions ([#9fa603b](https://github.com/deltabox-studio/toolchain/commit/9fa603b) by [T0chi](https://github.com/T0chi))
- Batch GitHub metadata lookups ([#9e90e38](https://github.com/deltabox-studio/toolchain/commit/9e90e38) by [T0chi](https://github.com/T0chi))
- Fix details formatting and add release mode ([#5fa519f](https://github.com/deltabox-studio/toolchain/commit/5fa519f) by [T0chi](https://github.com/T0chi))
- Apply details after formatting and add body collapsibles ([#83dd7da](https://github.com/deltabox-studio/toolchain/commit/83dd7da) by [T0chi](https://github.com/T0chi))
- Add scoped versioning options and changelog `intro`/`outro` ([#09cf5d9](https://github.com/deltabox-studio/toolchain/commit/09cf5d9) by [T0chi](https://github.com/T0chi))
- Add opt-in `ci.dependabot` version updates ([#18670f7](https://github.com/deltabox-studio/toolchain/commit/18670f7) by [T0chi](https://github.com/T0chi))

#### Cli
- Add changelog intro/outro flags and respect `enabled` ([#7d74c71](https://github.com/deltabox-studio/toolchain/commit/7d74c71) by [T0chi](https://github.com/T0chi))

#### Config
- Add `enabled` and `regenerate` controls ([#7f5444a](https://github.com/deltabox-studio/toolchain/commit/7f5444a) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

#### Biome,changelog
- Make the packages publishable and run on vite-plus ([#23c3f41](https://github.com/deltabox-studio/toolchain/commit/23c3f41) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Changelog
- Yield between phases so the spinner animates ([#3a82b92](https://github.com/deltabox-studio/toolchain/commit/3a82b92) by [T0chi](https://github.com/T0chi))
- Reformat existing entries with an empty all range ([#c36f3b2](https://github.com/deltabox-studio/toolchain/commit/c36f3b2) by [T0chi](https://github.com/T0chi))
- Preserve reformatted entries and release output ([#5f364e0](https://github.com/deltabox-studio/toolchain/commit/5f364e0) by [T0chi](https://github.com/T0chi))
- Dedupe Azure setup steps in vendor pipelines ([#4752c89](https://github.com/deltabox-studio/toolchain/commit/4752c89) by [T0chi](https://github.com/T0chi))
- Keep commit groups and package footers when reformatting ([#3bea7ab](https://github.com/deltabox-studio/toolchain/commit/3bea7ab) by [T0chi](https://github.com/T0chi))
- Keep manual runs, bullets and release markers intact ([#8af8fc7](https://github.com/deltabox-studio/toolchain/commit/8af8fc7) by [T0chi](https://github.com/T0chi))
- Retry `gh` API calls before falling back ([#def8ce6](https://github.com/deltabox-studio/toolchain/commit/def8ce6) by [T0chi](https://github.com/T0chi))
- Stop retrying `gh` after a timeout ([#d7f5f0c](https://github.com/deltabox-studio/toolchain/commit/d7f5f0c) by [T0chi](https://github.com/T0chi))
- Make release runs idempotent and catalog-aware ([#5bc74af](https://github.com/deltabox-studio/toolchain/commit/5bc74af) by [T0chi](https://github.com/T0chi))

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

<details>
<summary>Tests</summary>

#### Changelog
- Keep `gh` lookups offline in test runs ([#06b59d9](https://github.com/deltabox-studio/toolchain/commit/06b59d9) by [T0chi](https://github.com/T0chi))

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

#### Changelog
- Inject provider setup into custom and vendor workflows ([#b6b240f](https://github.com/deltabox-studio/toolchain/commit/b6b240f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - add an opt-in setup flag to custom workflow options and vendor settings
    - GitHub injects the missing checkout/Node/Corepack/install steps
    - GitLab adds a Node image + before_script; Azure adds UseNode@1 + install
    - avoid duplicating setup steps the workflow already defines
    - resolve vendor workflow tokens from the default token set

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

## 2.3.3 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Disable setup-node auto-cache so Corepack can enable Yarn ([#571f896](https://github.com/deltabox-studio/toolchain/commit/571f896) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - actions/setup-node@v5 now auto-caches from the packageManager field and runs \yarn cache dir\ before the Enable Corepack step, so every job failed with the global Yarn 1.22.22 error. Set package-manager-cache: false on every setup-node step; Corepack still enables the pinned Yarn/pnpm before install.

  </details>

</details>

<details>
<summary>Chores</summary>

#### Ci
- Bump checkout and setup-node actions to v5 ([#485f29d](https://github.com/deltabox-studio/toolchain/commit/485f29d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The runner warns that actions/checkout@v4 and actions/setup-node@v4 target Node 20 and are forced onto Node 24. Bump the generated workflows (and the dogfood config) to v5.

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

#### Changelog
- Keep hash links when git history is incomplete ([#182b68a](https://github.com/deltabox-studio/toolchain/commit/182b68a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - A shallow clone or no-git checkout cannot resolve every referenced commit, so valid hashes were left unlinked. Fall back to treating letter-containing refs as commits when history is incomplete, and mock the numeric-hash fixture so the tests do not depend on the checkout's history.

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

#### Changelog
- Dispatch workflows with their vendor CLI ([#eea38ae](https://github.com/deltabox-studio/toolchain/commit/eea38ae) by [T0chi](https://github.com/T0chi))

#### Config
- Accept complete GitHub, GitLab and Azure workflows ([#070a7f2](https://github.com/deltabox-studio/toolchain/commit/070a7f2) by [T0chi](https://github.com/T0chi))
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Changelog
- Fix workflow staging, `commitlint` and YAML escaping ([#1bb19ad](https://github.com/deltabox-studio/toolchain/commit/1bb19ad) by [T0chi](https://github.com/T0chi))
- Preserve formatting, links and workspace history ([#af5c5dc](https://github.com/deltabox-studio/toolchain/commit/af5c5dc) by [T0chi](https://github.com/T0chi))
- Restore the standalone bin and `--dry-run` handling ([#97ecef2](https://github.com/deltabox-studio/toolchain/commit/97ecef2) by [T0chi](https://github.com/T0chi))
- Preserve hand-corrected text in `--format-only` ([#2041e5f](https://github.com/deltabox-studio/toolchain/commit/2041e5f) by [T0chi](https://github.com/T0chi))
- Resolve hash links and preserve descriptions ([#7633d24](https://github.com/deltabox-studio/toolchain/commit/7633d24) by [T0chi](https://github.com/T0chi))
- Keep numeric hashes as commits and bold breaking markers ([#0521aee](https://github.com/deltabox-studio/toolchain/commit/0521aee) by [T0chi](https://github.com/T0chi))
- Unwrap descriptions and keep list items ([#0dc4bda](https://github.com/deltabox-studio/toolchain/commit/0dc4bda) by [T0chi](https://github.com/T0chi))

</details>
