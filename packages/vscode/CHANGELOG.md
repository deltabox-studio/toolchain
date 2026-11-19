# Changelog

## 3.0.0-beta.0 (November 2026)

<!-- release:start -->

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Vscode
- Prefer the project `dbx` by default ([#5ae1d94](https://github.com/deltabox-studio/toolchain/commit/5ae1d94) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))

#### Core
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Vscode
- Decorate managed files and reveal the active project ([#a6debec](https://github.com/deltabox-studio/toolchain/commit/a6debec) by [T0chi](https://github.com/T0chi))
- Add scoped auto-sync, the action palette and the Actions view ([#c330378](https://github.com/deltabox-studio/toolchain/commit/c330378) by [T0chi](https://github.com/T0chi))
- Prompt for Docker when scaffolding ([#3fdfac3](https://github.com/deltabox-studio/toolchain/commit/3fdfac3) by [T0chi](https://github.com/T0chi))
- Add generic format/lint actions and formatting settings ([#c256de5](https://github.com/deltabox-studio/toolchain/commit/c256de5) by [T0chi](https://github.com/T0chi))
- Support plugin-mode projects, MCP install and sync UX ([#bfb2588](https://github.com/deltabox-studio/toolchain/commit/bfb2588) by [T0chi](https://github.com/T0chi))
- Sync notifications, `sync all`, migration target, `manageConfigless` ([#4147500](https://github.com/deltabox-studio/toolchain/commit/4147500) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

#### Template
- Expose the quality-of-life builtins ([#a7a0b3c](https://github.com/deltabox-studio/toolchain/commit/a7a0b3c) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Vscode
- Repair the action palette and multi-root sync ([#0556f0a](https://github.com/deltabox-studio/toolchain/commit/0556f0a) by [T0chi](https://github.com/T0chi))
- Validate manifest metadata ([#9e742e8](https://github.com/deltabox-studio/toolchain/commit/9e742e8) by [T0chi](https://github.com/T0chi))
- Quote shim paths in the terminal command ([#859d08d](https://github.com/deltabox-studio/toolchain/commit/859d08d) by [T0chi](https://github.com/T0chi))
- Keep watchers when an input resolve fails ([#e11adc5](https://github.com/deltabox-studio/toolchain/commit/e11adc5) by [T0chi](https://github.com/T0chi))
- Remove config actions that have no CLI command ([#f75ebd0](https://github.com/deltabox-studio/toolchain/commit/f75ebd0) by [T0chi](https://github.com/T0chi))
- Absorb a pending debounce on manual sync ([#74cde55](https://github.com/deltabox-studio/toolchain/commit/74cde55) by [T0chi](https://github.com/T0chi))
- Discover hoisted and multi-root project `dbx` ([#4a017b0](https://github.com/deltabox-studio/toolchain/commit/4a017b0) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Reconcile overrides before generation and harden remote extends ([#0fa2caa](https://github.com/deltabox-studio/toolchain/commit/0fa2caa) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Changelog
- Apply details formatting to historical entries ([#0bfbd98](https://github.com/deltabox-studio/toolchain/commit/0bfbd98) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


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

#### Vscode
- Split extension modules and add `syncTsconfig` action ([#f121c47](https://github.com/deltabox-studio/toolchain/commit/f121c47) by [T0chi](https://github.com/T0chi))

#### Core
- Resolve concrete watch inputs and update the VS Code watcher ([#425f0d3](https://github.com/deltabox-studio/toolchain/commit/425f0d3) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Vscode
- Scope auto-sync watchers to their workspace root ([#6604b23](https://github.com/deltabox-studio/toolchain/commit/6604b23) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - String globs match across every workspace folder, and any watcher event synced every root. Scope each resolved input to its owning root (watching a concrete nested file from its own directory so the watcher stays non-recursive), drop absolute/ancestor globs, and sync only the root whose input changed. The CLI also rejects unsafe user globs.

  </details>

- Sync configless projects from Sync all ([#d9c185e](https://github.com/deltabox-studio/toolchain/commit/d9c185e) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - keep the CLI recursive pass for projects with their own config
    - sync projects that only inherit the root config individually
    - refresh the project graph first so newly discovered projects are included

  </details>

</details>

<details>
<summary>Refactors</summary>

#### Vscode
- Extract sync, generate, migrate and reset commands ([#b2b146d](https://github.com/deltabox-studio/toolchain/commit/b2b146d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Move the sync/check, config generation, migrate and reset handlers out of extension.ts into commands modules. Expand CommandDeps with the shared run/refresh helpers and add a focused syncAll/syncSelected test.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Document watcher scoping and project identity inheritance ([#074bfcd](https://github.com/deltabox-studio/toolchain/commit/074bfcd) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Update the VS Code auto-sync section and the project guide to match the implementation: watchers are root-scoped and sync only the changed root; project name/scope/description/type are never inherited. Regenerate llms-full.txt.

  </details>

#### Vscode
- Expand the extension guide and README ([#942aa55](https://github.com/deltabox-studio/toolchain/commit/942aa55) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Restore the updated provider/template sections, settings and auto-sync documentation in both the guide and the extension README.

  </details>

</details>

## 2.4.0 (November 2026)

<details>
<summary>New features</summary>

#### Vscode
- Add tooling actions and config generation ([#31da418](https://github.com/deltabox-studio/toolchain/commit/31da418) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add the format import-group setting, migrate/global Home actions, and config generation prompts (TS/JS, graph-only) that also work from the Command Palette.

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

## 2.3.2 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Load the tsdown base config from source ([#0537c62](https://github.com/deltabox-studio/toolchain/commit/0537c62) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The VS Code integration job builds the extension after only \yarn install\, so the private \@deltabox/toolchain-tsdown\ dist does not exist and unrun failed to load the config. Import baseTsdownConfig\ from the workspace source instead (as the root tsdown config already does).

  </details>

</details>

## 2.3.1 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Validate webview messages and use a secure nonce ([#94bed68](https://github.com/deltabox-studio/toolchain/commit/94bed68) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The Home webview handler trusted the incoming shape and acted on arbitrary project paths, and the CSP nonce came from Math.random. Validate every message, only act on projects the dashboard listed, and generate the nonce from crypto.randomBytes.

  </details>

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
<summary>New features</summary>

#### Vscode
- Show the workflow provider in the run picker ([#af4cc3f](https://github.com/deltabox-studio/toolchain/commit/af4cc3f) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Vscode
- Prefer CLI descriptors and sync all workspace roots ([#e68301a](https://github.com/deltabox-studio/toolchain/commit/e68301a) by [T0chi](https://github.com/T0chi))
- Report signal and timeout exits as failures ([#b7b1ad5](https://github.com/deltabox-studio/toolchain/commit/b7b1ad5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Document vendor workflows, typed builders and `--format-only` ([#eb66982](https://github.com/deltabox-studio/toolchain/commit/eb66982) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Vscode
- Move mocha types to the default tsconfig ([#b604811](https://github.com/deltabox-studio/toolchain/commit/b604811) by [T0chi](https://github.com/T0chi))

</details>
