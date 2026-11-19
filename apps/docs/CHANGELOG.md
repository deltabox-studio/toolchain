# Changelog

## 3.0.0-beta.0 (November 2026)

<!-- release:start -->

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

- Resolve the bug-hunt findings ([#f07f951](https://github.com/deltabox-studio/toolchain/commit/f07f951) by [T0chi](https://github.com/T0chi))

#### Changelog
- Relabel details summaries and default the release body ([#7ccfc86](https://github.com/deltabox-studio/toolchain/commit/7ccfc86) by [T0chi](https://github.com/T0chi))
- Add collapsible `details` rendering ([#f7d1c6a](https://github.com/deltabox-studio/toolchain/commit/f7d1c6a) by [T0chi](https://github.com/T0chi))
- Make releases idempotent and prerelease-aware ([#610138b](https://github.com/deltabox-studio/toolchain/commit/610138b) by [T0chi](https://github.com/T0chi))

#### Cli
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Support remote extends with opt-in flattening ([#44b5c8a](https://github.com/deltabox-studio/toolchain/commit/44b5c8a) by [T0chi](https://github.com/T0chi))
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))
- Serialize regex aliases for JSON transports ([#d7d8caf](https://github.com/deltabox-studio/toolchain/commit/d7d8caf) by [T0chi](https://github.com/T0chi))

#### Docker
- Correct PnP runtimes, nested ignores and Vite+ node versions ([#68eee6f](https://github.com/deltabox-studio/toolchain/commit/68eee6f) by [T0chi](https://github.com/T0chi))
- Allow user-owned files and always add compose ([#51b9ccc](https://github.com/deltabox-studio/toolchain/commit/51b9ccc) by [T0chi](https://github.com/T0chi))

#### Config
- Rename the generated ambient env types to `dbx-env.d.ts` ([#078b316](https://github.com/deltabox-studio/toolchain/commit/078b316) by [T0chi](https://github.com/T0chi))
- Add runtime config APIs and grouped `ConfigEngine` types ([#b69980e](https://github.com/deltabox-studio/toolchain/commit/b69980e) by [T0chi](https://github.com/T0chi))
- Add `collect`, parser and config loader APIs ([#4a3b745](https://github.com/deltabox-studio/toolchain/commit/4a3b745) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Core
- Make managed-file formatting opt-in ([#2a7c709](https://github.com/deltabox-studio/toolchain/commit/2a7c709) by [T0chi](https://github.com/T0chi))
- Format managed files after `dbx sync` ([#fb3d9be](https://github.com/deltabox-studio/toolchain/commit/fb3d9be) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Vscode
- Decorate managed files and reveal the active project ([#a6debec](https://github.com/deltabox-studio/toolchain/commit/a6debec) by [T0chi](https://github.com/T0chi))
- Add scoped auto-sync, the action palette and the Actions view ([#c330378](https://github.com/deltabox-studio/toolchain/commit/c330378) by [T0chi](https://github.com/T0chi))
- Add generic format/lint actions and formatting settings ([#c256de5](https://github.com/deltabox-studio/toolchain/commit/c256de5) by [T0chi](https://github.com/T0chi))

#### Shared
- Add static schema defaults ([#3b810d3](https://github.com/deltabox-studio/toolchain/commit/3b810d3) by [T0chi](https://github.com/T0chi))

#### Config
- Reuse changelog group and option schemas ([#cbd9b54](https://github.com/deltabox-studio/toolchain/commit/cbd9b54) by [T0chi](https://github.com/T0chi))

#### Changelog
- Add `minCommits` and nested `See more...` descriptions ([#9fa603b](https://github.com/deltabox-studio/toolchain/commit/9fa603b) by [T0chi](https://github.com/T0chi))
- Fix details formatting and add release mode ([#5fa519f](https://github.com/deltabox-studio/toolchain/commit/5fa519f) by [T0chi](https://github.com/T0chi))
- Apply details after formatting and add body collapsibles ([#83dd7da](https://github.com/deltabox-studio/toolchain/commit/83dd7da) by [T0chi](https://github.com/T0chi))
- Add scoped versioning options and changelog `intro`/`outro` ([#09cf5d9](https://github.com/deltabox-studio/toolchain/commit/09cf5d9) by [T0chi](https://github.com/T0chi))

#### Cli
- Add changelog intro/outro flags and respect `enabled` ([#7d74c71](https://github.com/deltabox-studio/toolchain/commit/7d74c71) by [T0chi](https://github.com/T0chi))
- Add `dbx enable`/`disable` and `enabled` ([#67ea4c3](https://github.com/deltabox-studio/toolchain/commit/67ea4c3) by [T0chi](https://github.com/T0chi))

#### Mcp
- Add the MCP server, installers and `dbx mcp:*` commands ([#0553843](https://github.com/deltabox-studio/toolchain/commit/0553843) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Escape generated JSDoc comments, closes [#41](https://github.com/deltabox-studio/toolchain/issues/41) ([#220d228](https://github.com/deltabox-studio/toolchain/commit/220d228) by [T0chi](https://github.com/T0chi)) (fixes [#41](https://github.com/deltabox-studio/toolchain/issues/41))

#### Cli
- Harden flag parsing and document library-only config commands ([#aaaa11a](https://github.com/deltabox-studio/toolchain/commit/aaaa11a) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

#### Config
- Share the runtime loader with core ([#e84e4e6](https://github.com/deltabox-studio/toolchain/commit/e84e4e6) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Add the v2 to v3 guide and refresh behavior docs ([#c6efc52](https://github.com/deltabox-studio/toolchain/commit/c6efc52) by [T0chi](https://github.com/T0chi))
- Describe Docker as scaffolding-only ([#8e5c46e](https://github.com/deltabox-studio/toolchain/commit/8e5c46e) by [T0chi](https://github.com/T0chi))
- Document the opt-in Dependabot config ([#7028669](https://github.com/deltabox-studio/toolchain/commit/7028669) by [T0chi](https://github.com/T0chi))
- Document Docker support ([#e618041](https://github.com/deltabox-studio/toolchain/commit/e618041) by [T0chi](https://github.com/T0chi))
- Document the quality-of-life templates ([#a9b62b2](https://github.com/deltabox-studio/toolchain/commit/a9b62b2) by [T0chi](https://github.com/T0chi))
- Document the GitLab and Azure `setup-vp` setup ([#d385e7d](https://github.com/deltabox-studio/toolchain/commit/d385e7d) by [T0chi](https://github.com/T0chi))
- Document the Vite+ CI detection and tokens ([#64c394e](https://github.com/deltabox-studio/toolchain/commit/64c394e) by [T0chi](https://github.com/T0chi))
- Add managed-file examples and refresh generated docs ([#e9dba38](https://github.com/deltabox-studio/toolchain/commit/e9dba38) by [T0chi](https://github.com/T0chi))
- Describe the plugin-first Vite+ superset and regenerate docs ([#01008f6](https://github.com/deltabox-studio/toolchain/commit/01008f6) by [T0chi](https://github.com/T0chi))
- Document the config loader, strict opt-in inheritance and configless projects ([#2eff4c8](https://github.com/deltabox-studio/toolchain/commit/2eff4c8) by [T0chi](https://github.com/T0chi))

#### Ci
- Document security updates in the v3 migration guide ([#1aa7091](https://github.com/deltabox-studio/toolchain/commit/1aa7091) by [T0chi](https://github.com/T0chi))

#### Changelog
- Apply details formatting to historical entries ([#0bfbd98](https://github.com/deltabox-studio/toolchain/commit/0bfbd98) by [T0chi](https://github.com/T0chi))
- Document package changes on `--format-only` ([#a8b6cdb](https://github.com/deltabox-studio/toolchain/commit/a8b6cdb) by [T0chi](https://github.com/T0chi))

#### Config
- Refresh generated reference and llms bundle ([#fd2f709](https://github.com/deltabox-studio/toolchain/commit/fd2f709) by [T0chi](https://github.com/T0chi))
- Refresh generated config artifacts and guides ([#067760e](https://github.com/deltabox-studio/toolchain/commit/067760e) by [T0chi](https://github.com/T0chi))
- Regenerate schema, types and reference ([#6f48302](https://github.com/deltabox-studio/toolchain/commit/6f48302) by [T0chi](https://github.com/T0chi))
- Link external schemas and add real defaults ([#04dc8d1](https://github.com/deltabox-studio/toolchain/commit/04dc8d1) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Normalize imports and docs ([#c7f0d25](https://github.com/deltabox-studio/toolchain/commit/c7f0d25) by [T0chi](https://github.com/T0chi))

#### Config
- Regenerate the schema, types and docs ([#2c4dc1e](https://github.com/deltabox-studio/toolchain/commit/2c4dc1e) by [T0chi](https://github.com/T0chi))
- Regenerate the CLI docs and llms output ([#cf8661f](https://github.com/deltabox-studio/toolchain/commit/cf8661f) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#82ca5c3](https://github.com/deltabox-studio/toolchain/commit/82ca5c3) by [T0chi](https://github.com/T0chi))
- Generate plain array unions and `details` types ([#486d264](https://github.com/deltabox-studio/toolchain/commit/486d264) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#12788f0](https://github.com/deltabox-studio/toolchain/commit/12788f0) by [T0chi](https://github.com/T0chi))
- Regenerate types and references ([#3c7917a](https://github.com/deltabox-studio/toolchain/commit/3c7917a) by [T0chi](https://github.com/T0chi))
- Regenerate types and references ([#de928fa](https://github.com/deltabox-studio/toolchain/commit/de928fa) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


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

## 2.6.0 (November 2026)

<details>
<summary>New features</summary>

- Route fmt/lint to the active tool and opt scaffolds into catalogs ([#76df575](https://github.com/deltabox-studio/toolchain/commit/76df575) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - dbx fmt/lint resolve the configured/discovered formatter or linter (oxc > biome > prettier > dprint; oxc > biome > eslint) and run it, falling back to the vp/Oxc passthrough
    - project:init/create scaffolds add the catalogs section for the catalog file they write, so dbx sync owns it instead of leaving the managed file orphaned
    - document the active-tool routing and add the dedicated package catalogs guide

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

- Add self-contained vendor types and `tsconfig` auto/`rewriteAlias` schemas ([#31c47a9](https://github.com/deltabox-studio/toolchain/commit/31c47a9) by [T0chi](https://github.com/T0chi))

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

#### Cli
- Add `sync --only` task selection and `selectSyncTasks` ([#49d73dd](https://github.com/deltabox-studio/toolchain/commit/49d73dd) by [T0chi](https://github.com/T0chi))

#### Vscode
- Split extension modules and add `syncTsconfig` action ([#f121c47](https://github.com/deltabox-studio/toolchain/commit/f121c47) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))

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
<summary>Documentation</summary>

- Document watcher scoping and project identity inheritance ([#074bfcd](https://github.com/deltabox-studio/toolchain/commit/074bfcd) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Update the VS Code auto-sync section and the project guide to match the implementation: watchers are root-scoped and sync only the changed root; project name/scope/description/type are never inherited. Regenerate llms-full.txt.

  </details>

#### Tsconfig
- Note that refsAuto requires tsc --build ([#74a25b2](https://github.com/deltabox-studio/toolchain/commit/74a25b2) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Project references are only followed by tsc --build; tsc -p --noEmit ignores them. Document the refsAuto requirement and why this repo keeps the references hand-written (refsAuto: false).

  </details>

#### Config
- Document every generator and generateCliDocs ([#28f812e](https://github.com/deltabox-studio/toolchain/commit/28f812e) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - add engine + standalone examples for each generator
    - document CLI docs, post-processing and advanced options
    - cross-link generateCliDocs from the config-generator index and CLI commands

  </details>

#### Vscode
- Expand the extension guide and README ([#942aa55](https://github.com/deltabox-studio/toolchain/commit/942aa55) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Restore the updated provider/template sections, settings and auto-sync documentation in both the guide and the extension README.

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

#### Project
- Add config generation options and migration routing ([#c658b0d](https://github.com/deltabox-studio/toolchain/commit/c658b0d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Support --skip-config, --language and --config-extension, write the project graph before configs, generate TS/JS configs, and route migrated fmt/lint into toolchain.vite only when the existing Vite config owns them.

  </details>

#### Vscode
- Add tooling actions and config generation ([#31da418](https://github.com/deltabox-studio/toolchain/commit/31da418) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add the format import-group setting, migrate/global Home actions, and config generation prompts (TS/JS, graph-only) that also work from the Command Palette.

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

## 2.3.0 (November 2026)

<details>
<summary>New features</summary>

#### Changelog
- Dispatch workflows with their vendor CLI ([#eea38ae](https://github.com/deltabox-studio/toolchain/commit/eea38ae) by [T0chi](https://github.com/T0chi))

#### Config
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Escape CLI reference tables and fail on missing output ([#15978be](https://github.com/deltabox-studio/toolchain/commit/15978be) by [T0chi](https://github.com/T0chi))

#### Core
- Keep managed paths inside the project root ([#2496bee](https://github.com/deltabox-studio/toolchain/commit/2496bee) by [T0chi](https://github.com/T0chi))

#### Changelog
- Preserve hand-corrected text in `--format-only` ([#2041e5f](https://github.com/deltabox-studio/toolchain/commit/2041e5f) by [T0chi](https://github.com/T0chi))

#### Shared
- Restore `PowerShell`-escaped letters ([#4d2be6a](https://github.com/deltabox-studio/toolchain/commit/4d2be6a) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Document vendor workflows, typed builders and `--format-only` ([#eb66982](https://github.com/deltabox-studio/toolchain/commit/eb66982) by [T0chi](https://github.com/T0chi))

#### Changelog
- Document `formatLine` ([#61e28ec](https://github.com/deltabox-studio/toolchain/commit/61e28ec) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Config
- Regenerate config-types, schema and docs ([#0b0ca20](https://github.com/deltabox-studio/toolchain/commit/0b0ca20) by [T0chi](https://github.com/T0chi))

</details>
