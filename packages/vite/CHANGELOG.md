# Changelog

## 2.6.0 (November 2026)

<!-- release:start -->

### New features
- Route fmt/lint to the active tool and opt scaffolds into catalogs ([#76df575](https://github.com/deltabox-studio/toolchain/commit/76df575) by [T0chi](https://github.com/T0chi))
  - dbx fmt/lint resolve the configured/discovered formatter or linter (oxc > biome > prettier > dprint; oxc > biome > eslint) and run it, falling back to the vp/Oxc passthrough
  - project:init/create scaffolds add the catalogs section for the catalog file they write, so dbx sync owns it instead of leaving the managed file orphaned
  - document the active-tool routing and add the dedicated package catalogs guide

<!-- release:end -->


## 2.5.0 (November 2026)

### New features
#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))
### Refactors
- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))


## 2.4.0 (November 2026)

### New features
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
#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))
  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.


## 2.3.0 (November 2026)

### Bug fixes
#### Vite
- Surface sync failures and preserve config values ([#93ee933](https://github.com/deltabox-studio/toolchain/commit/93ee933) by [T0chi](https://github.com/T0chi))
