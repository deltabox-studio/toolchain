# Changelog

## 2.5.0 (November 2026)

<!-- release:start -->

### New features
#### Config
- Add a reusable CLI docs generator ([#900566a](https://github.com/deltabox-studio/toolchain/commit/900566a) by [T0chi](https://github.com/T0chi))
  - add generateCliDocs(commands, options?) for custom command descriptors
  - use it to render the dbx CLI reference
  - document generating docs for a consumer's own command list
  - cover hidden/duplicate commands, args/options and custom prefix/title
#### Biome
- Add array removal directives and resolve toolchain debt ([#da100c8](https://github.com/deltabox-studio/toolchain/commit/da100c8) by [T0chi](https://github.com/T0chi))
  - add $remove: / $reset array directives with a resolver step for biome.json
  - fix peer warnings (declare vite, filter the stale VitePress plugin peer)
  - replace the RULE_MAP cast with an Object.hasOwn guard
  - add a direct extension env-propagation test
  - drop the 30s real-git changelog timeout
#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))
### Refactors
- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))
#### Config
- Use string & {} for open index signatures ([#11665c0](https://github.com/deltabox-studio/toolchain/commit/11665c0) by [T0chi](https://github.com/T0chi))
  - Emit [key: string & {}] from the config generator and use it in hand-written open maps, keeping known keys visible to autocomplete. Zod cannot express this key type, so the generator remains the post-processing point.
  - Also make the workflow filename/token defaults literal constants.

<!-- release:end -->


## 2.4.0 (November 2026)

### Chores
- Regenerate managed configs for import sorting ([#ce7a2e6](https://github.com/deltabox-studio/toolchain/commit/ce7a2e6) by [T0chi](https://github.com/T0chi))
  - Regenerate .oxfmtrc.json and every workspace vite.config.ts with the resolved sortImports workspace group.


## 2.3.1 (November 2026)

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
