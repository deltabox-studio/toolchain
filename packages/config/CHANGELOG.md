# Changelog

## 3.0.0-beta.6 (November 2026)

<!-- release:start -->

<details>
<summary>New features</summary>

#### Config
- Sort help commands and add a sort option ([#518d057](https://github.com/deltabox-studio/toolchain/commit/518d057) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Commands now render in ascending name order within every help section, including command groups. A new sort option accepts 'asc' (default), 'desc' or false (declaration order), is exposed as program.sort and threads through createCli/runCli via RootCliOptions. Group headings keep their first-appearance order so the dogfood sidebar grouping is preserved. Docs and llms bundle updated.

  </details>

- Group commands by delimited name paths ([#8598303](https://github.com/deltabox-studio/toolchain/commit/8598303) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a groups program option (default true) that renders help commands in grouped sections. With auto enabled (default) commands sharing a name path such as vite:list are grouped under a capitalised heading using the configured delimiter(s), defaulting to ':'. Explicit CliCommand/ConfigProgramCommand group labels override the derived group, groups:false renders a flat list, and groups:{auto:false} only honours explicit groups. dbx createCli/runCli expose the same option.

  </details>

- Group help options by heading ([#4815336](https://github.com/deltabox-studio/toolchain/commit/4815336) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - CliOption gains an optional group label. The default help renderer keeps ungrouped options under Options: and prints each group under its own capitalised heading (case-insensitive, first-appearance order). Grouping works for command options and program globals; the help/format docs and llms bundle are updated.

  </details>

#### Cli
- Make help-on-error opt-in ([#2a01d42](https://github.com/deltabox-studio/toolchain/commit/2a01d42) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Invalid argv no longer appends the full program help automatically, so failures stay short and scriptable. Config programs gain a helpOnError option (exposed as the readonly program.helpOnError), and dbx's createCli/runCli accept { helpOnError: true } to restore the old behavior. Defaults to false and matches the config engine cli program option.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Suffix grouped help headings with options or commands ([#342825a](https://github.com/deltabox-studio/toolchain/commit/342825a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Named option groups now render as '&lt;Group&gt; options:' and command groups as '&lt;Group&gt; commands:', while the default sections stay 'Options:' and 'Commands:'. The program 'groups' option now also flattens option groups when false, so the same toggle controls every help group.

  </details>

- Accept hyphenated long options in the CLI program ([#d2f24df](https://github.com/deltabox-studio/toolchain/commit/d2f24df) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - node:util parseArgs matches option keys against the literal long name, but the program runtime keyed them by the camel-cased value name. Every hyphenated flag (dbx changelog --release-body, sync --dry-run, ...) was therefore rejected as unknown by the selected command. Key the parseArgs config by the literal flag and map the result back to the camel-cased values.

  </details>

</details>

<details>
<summary>Refactors</summary>

#### Config
- Split the cli program runtime into modules ([#e9f39ce](https://github.com/deltabox-studio/toolchain/commit/e9f39ce) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Move the commander-like runtime out of the single cli/program.ts file into cli/program/*, with index.ts as the public entry point. Routing, option definitions, parsing, colour resolution, invocation helpers and execution now live in focused modules; the exported createConfigProgram/suggest/renderBox surface is unchanged.

  </details>

</details>

<details>
<summary>Documentation</summary>

#### Config
- Clarify that groups covers options and commands ([#c80cc9c](https://github.com/deltabox-studio/toolchain/commit/c80cc9c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The groups program option flattens both option and command groups when false and auto only affects derived command groups. Update the option JSDoc, RootCliOptions docs and guides to say so explicitly.

  </details>

</details>

<details>
<summary>Tests</summary>

#### Config
- Cover grouping opt-outs and edge cases ([#0967adc](https://github.com/deltabox-studio/toolchain/commit/0967adc) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Verify that groups:false disables explicit option/command groups from ConfigProgramOptions and createCli/RootCliOptions, that runCli flattens built-in groups, that auto:false keeps explicit labels, and that delimiter/heading edge cases and nested subcommand groups behave. Also add skill-guidance and skill installer edge-case assertions.

  </details>

</details>

<!-- release:end -->


## 3.0.0-beta.5 (November 2026)

<details>
<summary>Refactors</summary>

- Rename format scripts and tasks to fmt ([#fcd3ae0](https://github.com/deltabox-studio/toolchain/commit/fcd3ae0) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Build system</summary>

- Move jsonc-parser and untyped to the yarn catalog ([#8a77bf2](https://github.com/deltabox-studio/toolchain/commit/8a77bf2) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Commit pending docs and type updates ([#5701b52](https://github.com/deltabox-studio/toolchain/commit/5701b52) by [T0chi](https://github.com/T0chi))
- Cleanup references ([#a0027cd](https://github.com/deltabox-studio/toolchain/commit/a0027cd) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.4 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Config
- Preserve markdown key narrowing with typed options ([#0cd420a](https://github.com/deltabox-studio/toolchain/commit/0cd420a) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.3 (November 2026)

<details>
<summary>New features</summary>

#### Config
- Complete typed CLI program runtime and generator hooks ([#9dfb665](https://github.com/deltabox-studio/toolchain/commit/9dfb665) by [T0chi](https://github.com/T0chi))
- Generate CLI programs from config schemas ([#29808e9](https://github.com/deltabox-studio/toolchain/commit/29808e9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a config-engine program runtime with typed command chains, subcommands, global option inheritance, help formatting and output routing. Generate options and programs from schema metadata (cli/cliCommand), support array/variadic flags and custom parsers, and split the CLI types into their own modules. Annotate the shared schemas with the CLI-specific flags they map to.

  </details>

- Add source-specific config loaders ([#bf1fef0](https://github.com/deltabox-studio/toolchain/commit/bf1fef0) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add file/env/CLI loader variants plus base-value merging so file values are overridden by env and argv without schema defaults replacing them. Support multi-source selections, neutral config.* discovery names, and envExpose metadata for CLI-only values.

  </details>

- Add scoped CLI generation and reorganize types ([#bfefaa4](https://github.com/deltabox-studio/toolchain/commit/bfefaa4) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Normalize default JSDoc annotations ([#04f47e8](https://github.com/deltabox-studio/toolchain/commit/04f47e8) by [T0chi](https://github.com/T0chi))

#### Config
- Narrow explicit program command scopes ([#e910d0f](https://github.com/deltabox-studio/toolchain/commit/e910d0f) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Styles</summary>

- Format generated config artifacts and docs ([#2ff28be](https://github.com/deltabox-studio/toolchain/commit/2ff28be) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.2 (November 2026)

<details>
<summary>Chores</summary>

- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.1 (November 2026)

<details>
<summary>Documentation</summary>

- Align the READMEs and guides with v3 ([#c6487b8](https://github.com/deltabox-studio/toolchain/commit/c6487b8) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

- Resolve the bug-hunt findings ([#f07f951](https://github.com/deltabox-studio/toolchain/commit/f07f951) by [T0chi](https://github.com/T0chi))

#### Config
- Add preserved JSON Schema and markdown docs engine APIs ([#6e3d36c](https://github.com/deltabox-studio/toolchain/commit/6e3d36c) by [T0chi](https://github.com/T0chi))
- Emit valid schemas and guard generated config validity ([#5fb7667](https://github.com/deltabox-studio/toolchain/commit/5fb7667) by [T0chi](https://github.com/T0chi))
- Rename the generated ambient env types to `dbx-env.d.ts` ([#078b316](https://github.com/deltabox-studio/toolchain/commit/078b316) by [T0chi](https://github.com/T0chi))
- Align env parsing and file loading ([#7912425](https://github.com/deltabox-studio/toolchain/commit/7912425) by [T0chi](https://github.com/T0chi))
- Correct schema conversion and generator output ([#10ff4b1](https://github.com/deltabox-studio/toolchain/commit/10ff4b1) by [T0chi](https://github.com/T0chi))
- Add runtime config APIs and grouped `ConfigEngine` types ([#b69980e](https://github.com/deltabox-studio/toolchain/commit/b69980e) by [T0chi](https://github.com/T0chi))
- Add `collect`, parser and config loader APIs ([#4a3b745](https://github.com/deltabox-studio/toolchain/commit/4a3b745) by [T0chi](https://github.com/T0chi))
- Move file generators and complete `config:all` ([#24de58a](https://github.com/deltabox-studio/toolchain/commit/24de58a) by [T0chi](https://github.com/T0chi))

#### Cli
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))

#### Core
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

#### Config
- Update generated formatting and config generators ([#62897df](https://github.com/deltabox-studio/toolchain/commit/62897df) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Escape generated JSDoc comments, closes [#41](https://github.com/deltabox-studio/toolchain/issues/41) ([#220d228](https://github.com/deltabox-studio/toolchain/commit/220d228) by [T0chi](https://github.com/T0chi)) (fixes [#41](https://github.com/deltabox-studio/toolchain/issues/41))
- Harden schema validation and generated output ([#64efa45](https://github.com/deltabox-studio/toolchain/commit/64efa45) by [T0chi](https://github.com/T0chi))
- Report the written type file extension ([#cf56517](https://github.com/deltabox-studio/toolchain/commit/cf56517) by [T0chi](https://github.com/T0chi))

#### Core
- Resolve config from source in repo-local runs ([#4022d37](https://github.com/deltabox-studio/toolchain/commit/4022d37) by [T0chi](https://github.com/T0chi))

#### Cli
- Harden flag parsing and document library-only config commands ([#aaaa11a](https://github.com/deltabox-studio/toolchain/commit/aaaa11a) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Move public typings into src/types barrels ([#f727890](https://github.com/deltabox-studio/toolchain/commit/f727890) by [T0chi](https://github.com/T0chi))
- Split package typings into `src/types` barrels ([#45e5032](https://github.com/deltabox-studio/toolchain/commit/45e5032) by [T0chi](https://github.com/T0chi))

#### Config
- Share the runtime loader with core ([#e84e4e6](https://github.com/deltabox-studio/toolchain/commit/e84e4e6) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Changelog
- Apply details formatting to historical entries ([#0bfbd98](https://github.com/deltabox-studio/toolchain/commit/0bfbd98) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Normalize imports and docs ([#c7f0d25](https://github.com/deltabox-studio/toolchain/commit/c7f0d25) by [T0chi](https://github.com/T0chi))

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

#### Config
- Add a reusable CLI docs generator ([#900566a](https://github.com/deltabox-studio/toolchain/commit/900566a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - add generateCliDocs(commands, options?) for custom command descriptors
    - use it to render the dbx CLI reference
    - document generating docs for a consumer's own command list
    - cover hidden/duplicate commands, args/options and custom prefix/title

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

</details>

<details>
<summary>Refactors</summary>

- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))

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

#### Config
- Contain generator output paths and render object metadata ([#fe94053](https://github.com/deltabox-studio/toolchain/commit/fe94053) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Scope names and file options were used as paths directly, so a \../\ value could write outside the output directory. Resolve every generated file through a containment check. Also render an object node's own description/annotations before its child fields in per-scope markdown.

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
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Respect secret defaults, `envPathOf` and changelog disabling ([#5cabab8](https://github.com/deltabox-studio/toolchain/commit/5cabab8) by [T0chi](https://github.com/T0chi))
- Keep named `$ref` schema properties ([#0aa03a1](https://github.com/deltabox-studio/toolchain/commit/0aa03a1) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

#### Config
- Document the open `WorkflowJob` type ([#779566b](https://github.com/deltabox-studio/toolchain/commit/779566b) by [T0chi](https://github.com/T0chi))

</details>
