# Changelog

## 3.0.0-beta.4 (November 2026)

<!-- release:start -->

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Cli
- Replace commander with the config program ([#b515346](https://github.com/deltabox-studio/toolchain/commit/b515346) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Build the dbx CLI from createConfigProgram, wire schema-derived sync/watch flags through the root engine, and move context loading/framing into withCliContext. Remove commander from the dependency tree and update the root CLI tests for the engine runtime's invoke/help APIs.

  </details>

</details>

<details>
<summary>New features</summary>

#### Config
- Complete typed CLI program runtime and generator hooks ([#9dfb665](https://github.com/deltabox-studio/toolchain/commit/9dfb665) by [T0chi](https://github.com/T0chi))
- Generate CLI programs from config schemas ([#29808e9](https://github.com/deltabox-studio/toolchain/commit/29808e9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a config-engine program runtime with typed command chains, subcommands, global option inheritance, help formatting and output routing. Generate options and programs from schema metadata (cli/cliCommand), support array/variadic flags and custom parsers, and split the CLI types into their own modules. Annotate the shared schemas with the CLI-specific flags they map to.

  </details>

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
<summary>Documentation</summary>

#### Config
- Regenerate schema and reference artifacts ([#2f0b6af](https://github.com/deltabox-studio/toolchain/commit/2f0b6af) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Styles</summary>

- Format generated config artifacts and docs ([#2ff28be](https://github.com/deltabox-studio/toolchain/commit/2ff28be) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.3 (November 2026)

<details>
<summary>Chores</summary>

- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))

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
- Add collapsible `details` rendering ([#f7d1c6a](https://github.com/deltabox-studio/toolchain/commit/f7d1c6a) by [T0chi](https://github.com/T0chi))
- Make releases idempotent and prerelease-aware ([#610138b](https://github.com/deltabox-studio/toolchain/commit/610138b) by [T0chi](https://github.com/T0chi))
- Generate Vite+ CI with `voidzero-dev/setup-vp` ([#6dbf702](https://github.com/deltabox-studio/toolchain/commit/6dbf702) by [T0chi](https://github.com/T0chi))

#### Cli
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Config
- Emit valid schemas and guard generated config validity ([#5fb7667](https://github.com/deltabox-studio/toolchain/commit/5fb7667) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Support remote extends with opt-in flattening ([#44b5c8a](https://github.com/deltabox-studio/toolchain/commit/44b5c8a) by [T0chi](https://github.com/T0chi))
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Docker
- Make Docker generation scaffolding-only ([#8094d92](https://github.com/deltabox-studio/toolchain/commit/8094d92) by [T0chi](https://github.com/T0chi))
- Allow user-owned files and always add compose ([#51b9ccc](https://github.com/deltabox-studio/toolchain/commit/51b9ccc) by [T0chi](https://github.com/T0chi))

#### Core
- Make managed-file formatting opt-in ([#2a7c709](https://github.com/deltabox-studio/toolchain/commit/2a7c709) by [T0chi](https://github.com/T0chi))
- Format managed files after `dbx sync` ([#fb3d9be](https://github.com/deltabox-studio/toolchain/commit/fb3d9be) by [T0chi](https://github.com/T0chi))
- Provision the detected formatter/linter dependencies ([#c5cff9f](https://github.com/deltabox-studio/toolchain/commit/c5cff9f) by [T0chi](https://github.com/T0chi))
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

#### Shared
- Add the dbx plugin contract and shared config updates ([#3790a5e](https://github.com/deltabox-studio/toolchain/commit/3790a5e) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Ci
- Add Dependabot security updates ([#467e3eb](https://github.com/deltabox-studio/toolchain/commit/467e3eb) by [T0chi](https://github.com/T0chi))

#### Config
- Add static schema defaults ([#8e9ae1a](https://github.com/deltabox-studio/toolchain/commit/8e9ae1a) by [T0chi](https://github.com/T0chi))
- Generate `toolchain.hooks` from function schemas ([#4f6ceeb](https://github.com/deltabox-studio/toolchain/commit/4f6ceeb) by [T0chi](https://github.com/T0chi))
- Reuse changelog group and option schemas ([#cbd9b54](https://github.com/deltabox-studio/toolchain/commit/cbd9b54) by [T0chi](https://github.com/T0chi))
- Add `enabled` and `regenerate` controls ([#7f5444a](https://github.com/deltabox-studio/toolchain/commit/7f5444a) by [T0chi](https://github.com/T0chi))

#### Shared
- Add static schema defaults ([#3b810d3](https://github.com/deltabox-studio/toolchain/commit/3b810d3) by [T0chi](https://github.com/T0chi))
- Add `loader` and `project.manageConfigless` config sections ([#1f5e06d](https://github.com/deltabox-studio/toolchain/commit/1f5e06d) by [T0chi](https://github.com/T0chi))

#### Changelog
- Add `minCommits` and nested `See more...` descriptions ([#9fa603b](https://github.com/deltabox-studio/toolchain/commit/9fa603b) by [T0chi](https://github.com/T0chi))
- Apply details after formatting and add body collapsibles ([#83dd7da](https://github.com/deltabox-studio/toolchain/commit/83dd7da) by [T0chi](https://github.com/T0chi))
- Add scoped versioning options and changelog `intro`/`outro` ([#09cf5d9](https://github.com/deltabox-studio/toolchain/commit/09cf5d9) by [T0chi](https://github.com/T0chi))
- Add opt-in `ci.dependabot` version updates ([#18670f7](https://github.com/deltabox-studio/toolchain/commit/18670f7) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

#### Docker
- Add the `@deltabox/toolchain-docker` package ([#f08cd46](https://github.com/deltabox-studio/toolchain/commit/f08cd46) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Tsconfig
- Reconcile overrides before generation and harden remote extends ([#0fa2caa](https://github.com/deltabox-studio/toolchain/commit/0fa2caa) by [T0chi](https://github.com/T0chi))

#### Config
- Harden schema validation and generated output ([#64efa45](https://github.com/deltabox-studio/toolchain/commit/64efa45) by [T0chi](https://github.com/T0chi))

#### Shared
- Harden YAML, JSONC and logging helpers ([#ecc793a](https://github.com/deltabox-studio/toolchain/commit/ecc793a) by [T0chi](https://github.com/T0chi))
- Quote unsafe YAML scalars in the emitter ([#b8c87cf](https://github.com/deltabox-studio/toolchain/commit/b8c87cf) by [T0chi](https://github.com/T0chi))
- Match brace and class globs and anchor gitignore paths ([#0763205](https://github.com/deltabox-studio/toolchain/commit/0763205) by [T0chi](https://github.com/T0chi))
- Declare `type-fest` as a dependency ([#7a9e71b](https://github.com/deltabox-studio/toolchain/commit/7a9e71b) by [T0chi](https://github.com/T0chi))
- Tolerate UTF-8 BOM across JSON readers ([#a021da7](https://github.com/deltabox-studio/toolchain/commit/a021da7) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Split package typings into `src/types` barrels ([#45e5032](https://github.com/deltabox-studio/toolchain/commit/45e5032) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Changelog
- Apply details formatting to historical entries ([#0bfbd98](https://github.com/deltabox-studio/toolchain/commit/0bfbd98) by [T0chi](https://github.com/T0chi))

#### Config
- Regenerate schema, types and reference ([#6f48302](https://github.com/deltabox-studio/toolchain/commit/6f48302) by [T0chi](https://github.com/T0chi))
- Link external schemas and add real defaults ([#04dc8d1](https://github.com/deltabox-studio/toolchain/commit/04dc8d1) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Styles</summary>

- Restore 4-space formatting for tooling dependency files ([#c8f0d4d](https://github.com/deltabox-studio/toolchain/commit/c8f0d4d) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Tests</summary>

- Update Oxc-file expectations for Vite+ config mode ([#4a45455](https://github.com/deltabox-studio/toolchain/commit/4a45455) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Shared
- Regenerate config types and schema artifacts ([#5ffed68](https://github.com/deltabox-studio/toolchain/commit/5ffed68) by [T0chi](https://github.com/T0chi))

#### Config
- Regenerate the config types ([#e87d3a2](https://github.com/deltabox-studio/toolchain/commit/e87d3a2) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#2c4dc1e](https://github.com/deltabox-studio/toolchain/commit/2c4dc1e) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#82ca5c3](https://github.com/deltabox-studio/toolchain/commit/82ca5c3) by [T0chi](https://github.com/T0chi))
- Generate plain array unions and `details` types ([#486d264](https://github.com/deltabox-studio/toolchain/commit/486d264) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#12788f0](https://github.com/deltabox-studio/toolchain/commit/12788f0) by [T0chi](https://github.com/T0chi))
- Regenerate types and references ([#3c7917a](https://github.com/deltabox-studio/toolchain/commit/3c7917a) by [T0chi](https://github.com/T0chi))
- Regenerate types and references ([#de928fa](https://github.com/deltabox-studio/toolchain/commit/de928fa) by [T0chi](https://github.com/T0chi))

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

#### Config
- Add self-contained vendor types and `tsconfig` auto/`rewriteAlias` schemas ([#31c47a9](https://github.com/deltabox-studio/toolchain/commit/31c47a9) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Cli
- Sync and watch configless projects with the inherited config ([#346060d](https://github.com/deltabox-studio/toolchain/commit/346060d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The command context did not expose the ancestor config path, so dbx sync/watch in a nested project without its own dbx.config.* warned and did nothing. Pass parentPath through the context and allow both commands when it is set. The VS Code Sync all compensation now works for configless projects, while sync --recursive stays config-bearing-only and is documented as such.

  </details>

</details>

<details>
<summary>Refactors</summary>

- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))

#### Shared
- Literal-type the Vite+ default rules ([#b55fe2a](https://github.com/deltabox-studio/toolchain/commit/b55fe2a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Type DEFAULT_FMT_RULES and DEFAULT_LINT_RULES with as const satisfies a deeply readonly config view, so their values stay literal instead of widening to the interface. applyFmtCustomGroups accepts the readonly defaults (it never mutates its input), and a type-level test guards the literals.

  </details>

- Use as const for exported defaults ([#5b37c08](https://github.com/deltabox-studio/toolchain/commit/5b37c08) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Prefer literal tuples/objects over broad annotations, derive the related union types, and keep dynamic lookups/mutable copies behind small helpers.

  </details>

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
<summary>New features</summary>

#### Shared
- Improve workflow config autocomplete ([#5babd18](https://github.com/deltabox-studio/toolchain/commit/5babd18) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add typed WorkflowTriggers, WorkflowExtra and WorkflowTokens shapes so known workflow keys are suggested, and regenerate the config types, schema and reference.

  </details>

- Expose formatter and linter ignore defaults ([#5f2c8b1](https://github.com/deltabox-studio/toolchain/commit/5f2c8b1) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Export DEFAULT_FMT_IGNORE_PATTERNS and DEFAULT_LINT_IGNORE_PATTERNS alongside DEFAULT_IGNORE_PATTERNS, and document how to extend them.

  </details>

#### Core
- Add import sorting defaults and workspace groups ([#1c5f5a3](https://github.com/deltabox-studio/toolchain/commit/1c5f5a3) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Enable sortImports by default, resolve a workspace custom group from the project graph, and inject it into resolveVite, vite sync and tooling normalization.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Shared
- Repair PowerShell backtick artifacts in changelogs ([#61ced92](https://github.com/deltabox-studio/toolchain/commit/61ced92) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Repair paired \\code\\ and lone trailing identifier backslashes back to inline code while leaving paths and regexes alone, and correct the affected 2.3.1-2.3.3 entries.

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

## 2.3.1 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.

  </details>

#### Core
- Preserve .vscode settings comments when adding keys ([#9b4a105](https://github.com/deltabox-studio/toolchain/commit/9b4a105) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Merging VS Code settings parsed and reserialized the file, dropping its JSONC comments. Insert missing keys in place (preserving layout) and fall back to a full rewrite only when an existing value or array must change.

  </details>

#### Config
- Derive the CLI reference from the registered commands ([#95dc39f](https://github.com/deltabox-studio/toolchain/commit/95dc39f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The docs generator kept its own command list, so a new builtin could be missing from the generated reference. Use builtinCommands\ (the CLI's source of truth) and mark registry-dependent provider passthroughs as hidden.

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

#### Config
- Generate Oxfmt and Oxlint types from vendored schemas ([#8ff5e90](https://github.com/deltabox-studio/toolchain/commit/8ff5e90) by [T0chi](https://github.com/T0chi))
- Accept complete GitHub, GitLab and Azure workflows ([#070a7f2](https://github.com/deltabox-studio/toolchain/commit/070a7f2) by [T0chi](https://github.com/T0chi))
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

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

</details>

<details>
<summary>Documentation</summary>

#### Config
- Document the open `WorkflowJob` type ([#779566b](https://github.com/deltabox-studio/toolchain/commit/779566b) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Config
- Regenerate config-types, schema and docs ([#0b0ca20](https://github.com/deltabox-studio/toolchain/commit/0b0ca20) by [T0chi](https://github.com/T0chi))
- Shrink the generated `BiomeConfig` type ([#0522932](https://github.com/deltabox-studio/toolchain/commit/0522932) by [T0chi](https://github.com/T0chi))

</details>
