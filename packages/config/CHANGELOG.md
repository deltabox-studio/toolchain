# Changelog

## 2.3.1 (November 2026)

<!-- release:start -->

### Bug fixes
#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))
  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.
#### Config
- Contain generator output paths and render object metadata ([#fe94053](https://github.com/deltabox-studio/toolchain/commit/fe94053) by [T0chi](https://github.com/T0chi))
  - Scope names and file options were used as paths directly, so a \../\ value could write outside the output directory. Resolve every generated file through a containment check. Also render an object node's own description/annotations before its child fields in per-scope markdown.
#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))
  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.

<!-- release:end -->


## 2.3.0 (November 2026)

### New features
#### Config
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Config
- Respect secret defaults, `envPathOf` and changelog disabling ([#5cabab8](https://github.com/deltabox-studio/toolchain/commit/5cabab8) by [T0chi](https://github.com/T0chi))
- Keep named `$ref` schema properties ([#0aa03a1](https://github.com/deltabox-studio/toolchain/commit/0aa03a1) by [T0chi](https://github.com/T0chi))
### Documentation
#### Config
- Document the open `WorkflowJob` type ([#779566b](https://github.com/deltabox-studio/toolchain/commit/779566b) by [T0chi](https://github.com/T0chi))
