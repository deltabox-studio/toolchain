# Changelog

## 2.3.1 (November 2026)

<!-- release:start -->

### Bug fixes
#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))
  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.
#### Core
- Preserve .vscode settings comments when adding keys ([#9b4a105](https://github.com/deltabox-studio/toolchain/commit/9b4a105) by [T0chi](https://github.com/T0chi))
  - Merging VS Code settings parsed and reserialized the file, dropping its JSONC comments. Insert missing keys in place (preserving layout) and fall back to a full rewrite only when an existing value or array must change.
#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))
  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.

<!-- release:end -->


## 2.3.0 (November 2026)

### Bug fixes
#### Core
- Keep VS Code files user-owned and guard registry cycles ([#9ef027a](https://github.com/deltabox-studio/toolchain/commit/9ef027a) by [T0chi](https://github.com/T0chi))
- Keep watch sessions alive and re-sync config edits ([#2849757](https://github.com/deltabox-studio/toolchain/commit/2849757) by [T0chi](https://github.com/T0chi))
- Reject conflicting `--config` flags ([#1044f2a](https://github.com/deltabox-studio/toolchain/commit/1044f2a) by [T0chi](https://github.com/T0chi))
- Skip parent hooks for config-less workspaces ([#9658c36](https://github.com/deltabox-studio/toolchain/commit/9658c36) by [T0chi](https://github.com/T0chi))
- Keep managed paths inside the project root ([#2496bee](https://github.com/deltabox-studio/toolchain/commit/2496bee) by [T0chi](https://github.com/T0chi))
