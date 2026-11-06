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
#### Vscode
- Split extension modules and add `syncTsconfig` action ([#f121c47](https://github.com/deltabox-studio/toolchain/commit/f121c47) by [T0chi](https://github.com/T0chi))
#### Core
- Resolve concrete watch inputs and update the VS Code watcher ([#425f0d3](https://github.com/deltabox-studio/toolchain/commit/425f0d3) by [T0chi](https://github.com/T0chi))
#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Vscode
- Scope auto-sync watchers to their workspace root ([#6604b23](https://github.com/deltabox-studio/toolchain/commit/6604b23) by [T0chi](https://github.com/T0chi))
  - String globs match across every workspace folder, and any watcher event synced every root. Scope each resolved input to its owning root (watching a concrete nested file from its own directory so the watcher stays non-recursive), drop absolute/ancestor globs, and sync only the root whose input changed. The CLI also rejects unsafe user globs.
- Sync configless projects from Sync all ([#d9c185e](https://github.com/deltabox-studio/toolchain/commit/d9c185e) by [T0chi](https://github.com/T0chi))
  - keep the CLI recursive pass for projects with their own config
  - sync projects that only inherit the root config individually
  - refresh the project graph first so newly discovered projects are included
### Refactors
#### Vscode
- Extract sync, generate, migrate and reset commands ([#b2b146d](https://github.com/deltabox-studio/toolchain/commit/b2b146d) by [T0chi](https://github.com/T0chi))
  - Move the sync/check, config generation, migrate and reset handlers out of extension.ts into commands modules. Expand CommandDeps with the shared run/refresh helpers and add a focused syncAll/syncSelected test.
### Documentation
- Document watcher scoping and project identity inheritance ([#074bfcd](https://github.com/deltabox-studio/toolchain/commit/074bfcd) by [T0chi](https://github.com/T0chi))
  - Update the VS Code auto-sync section and the project guide to match the implementation: watchers are root-scoped and sync only the changed root; project name/scope/description/type are never inherited. Regenerate llms-full.txt.
#### Vscode
- Expand the extension guide and README ([#942aa55](https://github.com/deltabox-studio/toolchain/commit/942aa55) by [T0chi](https://github.com/T0chi))
  - Restore the updated provider/template sections, settings and auto-sync documentation in both the guide and the extension README.

<!-- release:end -->


## 2.4.0 (November 2026)

### New features
#### Vscode
- Add tooling actions and config generation ([#31da418](https://github.com/deltabox-studio/toolchain/commit/31da418) by [T0chi](https://github.com/T0chi))
  - Add the format import-group setting, migrate/global Home actions, and config generation prompts (TS/JS, graph-only) that also work from the Command Palette.
### Chores
- Regenerate managed configs for import sorting ([#ce7a2e6](https://github.com/deltabox-studio/toolchain/commit/ce7a2e6) by [T0chi](https://github.com/T0chi))
  - Regenerate .oxfmtrc.json and every workspace vite.config.ts with the resolved sortImports workspace group.


## 2.3.2 (November 2026)

### Bug fixes
#### Vscode
- Load the tsdown base config from source ([#0537c62](https://github.com/deltabox-studio/toolchain/commit/0537c62) by [T0chi](https://github.com/T0chi))
  - The VS Code integration job builds the extension after only \yarn install\, so the private \@deltabox/toolchain-tsdown\ dist does not exist and unrun failed to load the config. Import baseTsdownConfig\ from the workspace source instead (as the root tsdown config already does).


## 2.3.1 (November 2026)

### Bug fixes
#### Vscode
- Validate webview messages and use a secure nonce ([#94bed68](https://github.com/deltabox-studio/toolchain/commit/94bed68) by [T0chi](https://github.com/T0chi))
  - The Home webview handler trusted the incoming shape and acted on arbitrary project paths, and the CSP nonce came from Math.random. Validate every message, only act on projects the dashboard listed, and generate the nonce from crypto.randomBytes.
#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))
  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.
#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))
  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.


## 2.3.0 (November 2026)

### New features
#### Vscode
- Show the workflow provider in the run picker ([#af4cc3f](https://github.com/deltabox-studio/toolchain/commit/af4cc3f) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Vscode
- Prefer CLI descriptors and sync all workspace roots ([#e68301a](https://github.com/deltabox-studio/toolchain/commit/e68301a) by [T0chi](https://github.com/T0chi))
- Report signal and timeout exits as failures ([#b7b1ad5](https://github.com/deltabox-studio/toolchain/commit/b7b1ad5) by [T0chi](https://github.com/T0chi))
### Documentation
- Document vendor workflows, typed builders and `--format-only` ([#eb66982](https://github.com/deltabox-studio/toolchain/commit/eb66982) by [T0chi](https://github.com/T0chi))
### Chores
#### Vscode
- Move mocha types to the default tsconfig ([#b604811](https://github.com/deltabox-studio/toolchain/commit/b604811) by [T0chi](https://github.com/T0chi))
