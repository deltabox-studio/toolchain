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
#### Config
- Derive the CLI reference from the registered commands ([#95dc39f](https://github.com/deltabox-studio/toolchain/commit/95dc39f) by [T0chi](https://github.com/T0chi))
  - The docs generator kept its own command list, so a new builtin could be missing from the generated reference. Use builtinCommands\ (the CLI's source of truth) and mark registry-dependent provider passthroughs as hidden.
#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))
  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.

<!-- release:end -->


## 2.3.0 (November 2026)

### New features
#### Config
- Generate Oxfmt and Oxlint types from vendored schemas ([#8ff5e90](https://github.com/deltabox-studio/toolchain/commit/8ff5e90) by [T0chi](https://github.com/T0chi))
- Accept complete GitHub, GitLab and Azure workflows ([#070a7f2](https://github.com/deltabox-studio/toolchain/commit/070a7f2) by [T0chi](https://github.com/T0chi))
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Shared
- Harden URL policy, merges and token replacement ([#bae1dc8](https://github.com/deltabox-studio/toolchain/commit/bae1dc8) by [T0chi](https://github.com/T0chi))
- Detect relative Windows `.cmd` shims ([#058430c](https://github.com/deltabox-studio/toolchain/commit/058430c) by [T0chi](https://github.com/T0chi))
- Restore `PowerShell`-escaped letters ([#4d2be6a](https://github.com/deltabox-studio/toolchain/commit/4d2be6a) by [T0chi](https://github.com/T0chi))
#### Config
- Respect secret defaults, `envPathOf` and changelog disabling ([#5cabab8](https://github.com/deltabox-studio/toolchain/commit/5cabab8) by [T0chi](https://github.com/T0chi))
#### Changelog
- Fix workflow staging, `commitlint` and YAML escaping ([#1bb19ad](https://github.com/deltabox-studio/toolchain/commit/1bb19ad) by [T0chi](https://github.com/T0chi))
#### Core
- Keep managed paths inside the project root ([#2496bee](https://github.com/deltabox-studio/toolchain/commit/2496bee) by [T0chi](https://github.com/T0chi))
### Documentation
#### Config
- Document the open `WorkflowJob` type ([#779566b](https://github.com/deltabox-studio/toolchain/commit/779566b) by [T0chi](https://github.com/T0chi))
### Chores
#### Config
- Regenerate config-types, schema and docs ([#0b0ca20](https://github.com/deltabox-studio/toolchain/commit/0b0ca20) by [T0chi](https://github.com/T0chi))
- Shrink the generated `BiomeConfig` type ([#0522932](https://github.com/deltabox-studio/toolchain/commit/0522932) by [T0chi](https://github.com/T0chi))
