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
#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Core
- Stop inheriting project identity for configless workspaces ([#8f163ed](https://github.com/deltabox-studio/toolchain/commit/8f163ed) by [T0chi](https://github.com/T0chi))
  - A nested workspace without its own dbx.config.* inherited the parent's project name/scope/description/type, so it could be detected as monorepo-root and lose its package.json identity. Strip the identity fields (and still drop the parent's hooks) when a configless project inherits an ancestor config.
#### Project
- Resolve repository.directory without a git checkout ([#a2d53d6](https://github.com/deltabox-studio/toolchain/commit/a2d53d6) by [T0chi](https://github.com/T0chi))
  - fall back to the nearest ancestor dbx.config.* when no .git root is found
  - keep the git checkout as the primary repository root
  - add a regression test for a nested workspace without a .git checkout
### Refactors
- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))
#### Shared
- Use as const for exported defaults ([#5b37c08](https://github.com/deltabox-studio/toolchain/commit/5b37c08) by [T0chi](https://github.com/T0chi))
  - Prefer literal tuples/objects over broad annotations, derive the related union types, and keep dynamic lookups/mutable copies behind small helpers.

<!-- release:end -->


## 2.4.0 (November 2026)

### New features
#### Project
- Add config generation options and migration routing ([#c658b0d](https://github.com/deltabox-studio/toolchain/commit/c658b0d) by [T0chi](https://github.com/T0chi))
  - Support --skip-config, --language and --config-extension, write the project graph before configs, generate TS/JS configs, and route migrated fmt/lint into toolchain.vite only when the existing Vite config owns them.
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
#### Project
- Validate workspace paths before writing ([#0ef515e](https://github.com/deltabox-studio/toolchain/commit/0ef515e) by [T0chi](https://github.com/T0chi))
