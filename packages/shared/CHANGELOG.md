# Changelog

## 2.5.0 (November 2026)

<!-- release:start -->

### New features
#### Changelog
- Inject provider setup into custom and vendor workflows ([#b6b240f](https://github.com/deltabox-studio/toolchain/commit/b6b240f) by [T0chi](https://github.com/T0chi))
  - add an opt-in setup flag to custom workflow options and vendor settings
  - GitHub injects the missing checkout/Node/Corepack/install steps
  - GitLab adds a Node image + before_script; Azure adds UseNode@1 + install
  - avoid duplicating setup steps the workflow already defines
  - resolve vendor workflow tokens from the default token set
#### Biome
- Add array removal directives and resolve toolchain debt ([#da100c8](https://github.com/deltabox-studio/toolchain/commit/da100c8) by [T0chi](https://github.com/T0chi))
  - add $remove: / $reset array directives with a resolver step for biome.json
  - fix peer warnings (declare vite, filter the stale VitePress plugin peer)
  - replace the RULE_MAP cast with an Object.hasOwn guard
  - add a direct extension env-propagation test
  - drop the 30s real-git changelog timeout
#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))
#### Config
- Add self-contained vendor types and `tsconfig` auto/`rewriteAlias` schemas ([#31c47a9](https://github.com/deltabox-studio/toolchain/commit/31c47a9) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Cli
- Sync and watch configless projects with the inherited config ([#346060d](https://github.com/deltabox-studio/toolchain/commit/346060d) by [T0chi](https://github.com/T0chi))
  - The command context did not expose the ancestor config path, so dbx sync/watch in a nested project without its own dbx.config.* warned and did nothing. Pass parentPath through the context and allow both commands when it is set. The VS Code Sync all compensation now works for configless projects, while sync --recursive stays config-bearing-only and is documented as such.
### Refactors
- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))
#### Shared
- Literal-type the Vite+ default rules ([#b55fe2a](https://github.com/deltabox-studio/toolchain/commit/b55fe2a) by [T0chi](https://github.com/T0chi))
  - Type DEFAULT_FMT_RULES and DEFAULT_LINT_RULES with as const satisfies a deeply readonly config view, so their values stay literal instead of widening to the interface. applyFmtCustomGroups accepts the readonly defaults (it never mutates its input), and a type-level test guards the literals.
- Use as const for exported defaults ([#5b37c08](https://github.com/deltabox-studio/toolchain/commit/5b37c08) by [T0chi](https://github.com/T0chi))
  - Prefer literal tuples/objects over broad annotations, derive the related union types, and keep dynamic lookups/mutable copies behind small helpers.
#### Config
- Use string & {} for open index signatures ([#11665c0](https://github.com/deltabox-studio/toolchain/commit/11665c0) by [T0chi](https://github.com/T0chi))
  - Emit [key: string & {}] from the config generator and use it in hand-written open maps, keeping known keys visible to autocomplete. Zod cannot express this key type, so the generator remains the post-processing point.
  - Also make the workflow filename/token defaults literal constants.

<!-- release:end -->


## 2.4.0 (November 2026)

### New features
#### Shared
- Improve workflow config autocomplete ([#5babd18](https://github.com/deltabox-studio/toolchain/commit/5babd18) by [T0chi](https://github.com/T0chi))
  - Add typed WorkflowTriggers, WorkflowExtra and WorkflowTokens shapes so known workflow keys are suggested, and regenerate the config types, schema and reference.
- Expose formatter and linter ignore defaults ([#5f2c8b1](https://github.com/deltabox-studio/toolchain/commit/5f2c8b1) by [T0chi](https://github.com/T0chi))
  - Export DEFAULT_FMT_IGNORE_PATTERNS and DEFAULT_LINT_IGNORE_PATTERNS alongside DEFAULT_IGNORE_PATTERNS, and document how to extend them.
#### Core
- Add import sorting defaults and workspace groups ([#1c5f5a3](https://github.com/deltabox-studio/toolchain/commit/1c5f5a3) by [T0chi](https://github.com/T0chi))
  - Enable sortImports by default, resolve a workspace custom group from the project graph, and inject it into resolveVite, vite sync and tooling normalization.
### Bug fixes
#### Shared
- Repair PowerShell backtick artifacts in changelogs ([#61ced92](https://github.com/deltabox-studio/toolchain/commit/61ced92) by [T0chi](https://github.com/T0chi))
  - Repair paired \\code\\ and lone trailing identifier backslashes back to inline code while leaving paths and regexes alone, and correct the affected 2.3.1-2.3.3 entries.
### Chores
- Regenerate managed configs for import sorting ([#ce7a2e6](https://github.com/deltabox-studio/toolchain/commit/ce7a2e6) by [T0chi](https://github.com/T0chi))
  - Regenerate .oxfmtrc.json and every workspace vite.config.ts with the resolved sortImports workspace group.


## 2.3.1 (November 2026)

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
