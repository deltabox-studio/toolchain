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
- Add self-contained vendor types and `tsconfig` auto/`rewriteAlias` schemas ([#31c47a9](https://github.com/deltabox-studio/toolchain/commit/31c47a9) by [T0chi](https://github.com/T0chi))
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
#### Cli
- Add `sync --only` task selection and `selectSyncTasks` ([#49d73dd](https://github.com/deltabox-studio/toolchain/commit/49d73dd) by [T0chi](https://github.com/T0chi))
#### Vscode
- Split extension modules and add `syncTsconfig` action ([#f121c47](https://github.com/deltabox-studio/toolchain/commit/f121c47) by [T0chi](https://github.com/T0chi))
#### Tsconfig
- Auto-wire aliases/references with `rewriteAlias` and gating ([#124f4b5](https://github.com/deltabox-studio/toolchain/commit/124f4b5) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Cli
- Sync and watch configless projects with the inherited config ([#346060d](https://github.com/deltabox-studio/toolchain/commit/346060d) by [T0chi](https://github.com/T0chi))
  - The command context did not expose the ancestor config path, so dbx sync/watch in a nested project without its own dbx.config.* warned and did nothing. Pass parentPath through the context and allow both commands when it is set. The VS Code Sync all compensation now works for configless projects, while sync --recursive stays config-bearing-only and is documented as such.
### Documentation
- Document watcher scoping and project identity inheritance ([#074bfcd](https://github.com/deltabox-studio/toolchain/commit/074bfcd) by [T0chi](https://github.com/T0chi))
  - Update the VS Code auto-sync section and the project guide to match the implementation: watchers are root-scoped and sync only the changed root; project name/scope/description/type are never inherited. Regenerate llms-full.txt.
#### Tsconfig
- Note that refsAuto requires tsc --build ([#74a25b2](https://github.com/deltabox-studio/toolchain/commit/74a25b2) by [T0chi](https://github.com/T0chi))
  - Project references are only followed by tsc --build; tsc -p --noEmit ignores them. Document the refsAuto requirement and why this repo keeps the references hand-written (refsAuto: false).
#### Config
- Document every generator and generateCliDocs ([#28f812e](https://github.com/deltabox-studio/toolchain/commit/28f812e) by [T0chi](https://github.com/T0chi))
  - add engine + standalone examples for each generator
  - document CLI docs, post-processing and advanced options
  - cross-link generateCliDocs from the config-generator index and CLI commands
#### Vscode
- Expand the extension guide and README ([#942aa55](https://github.com/deltabox-studio/toolchain/commit/942aa55) by [T0chi](https://github.com/T0chi))
  - Restore the updated provider/template sections, settings and auto-sync documentation in both the guide and the extension README.

<!-- release:end -->


## 2.4.0 (November 2026)

### New features
#### Shared
- Improve workflow config autocomplete ([#5babd18](https://github.com/deltabox-studio/toolchain/commit/5babd18) by [T0chi](https://github.com/T0chi))
  - Add typed WorkflowTriggers, WorkflowExtra and WorkflowTokens shapes so known workflow keys are suggested, and regenerate the config types, schema and reference.
- Expose formatter and linter ignore defaults ([#5f2c8b1](https://github.com/deltabox-studio/toolchain/commit/5f2c8b1) by [T0chi](https://github.com/T0chi))
  - Export DEFAULT_FMT_IGNORE_PATTERNS and DEFAULT_LINT_IGNORE_PATTERNS alongside DEFAULT_IGNORE_PATTERNS, and document how to extend them.
#### Project
- Add config generation options and migration routing ([#c658b0d](https://github.com/deltabox-studio/toolchain/commit/c658b0d) by [T0chi](https://github.com/T0chi))
  - Support --skip-config, --language and --config-extension, write the project graph before configs, generate TS/JS configs, and route migrated fmt/lint into toolchain.vite only when the existing Vite config owns them.
#### Vscode
- Add tooling actions and config generation ([#31da418](https://github.com/deltabox-studio/toolchain/commit/31da418) by [T0chi](https://github.com/T0chi))
  - Add the format import-group setting, migrate/global Home actions, and config generation prompts (TS/JS, graph-only) that also work from the Command Palette.
#### Core
- Add import sorting defaults and workspace groups ([#1c5f5a3](https://github.com/deltabox-studio/toolchain/commit/1c5f5a3) by [T0chi](https://github.com/T0chi))
  - Enable sortImports by default, resolve a workspace custom group from the project graph, and inject it into resolveVite, vite sync and tooling normalization.
### Bug fixes
#### Shared
- Repair PowerShell backtick artifacts in changelogs ([#61ced92](https://github.com/deltabox-studio/toolchain/commit/61ced92) by [T0chi](https://github.com/T0chi))
  - Repair paired \\code\\ and lone trailing identifier backslashes back to inline code while leaving paths and regexes alone, and correct the affected 2.3.1-2.3.3 entries.

## 2.3.0 (November 2026)

### New features
#### Changelog
- Dispatch workflows with their vendor CLI ([#eea38ae](https://github.com/deltabox-studio/toolchain/commit/eea38ae) by [T0chi](https://github.com/T0chi))
#### Config
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Config
- Escape CLI reference tables and fail on missing output ([#15978be](https://github.com/deltabox-studio/toolchain/commit/15978be) by [T0chi](https://github.com/T0chi))
#### Core
- Keep managed paths inside the project root ([#2496bee](https://github.com/deltabox-studio/toolchain/commit/2496bee) by [T0chi](https://github.com/T0chi))
#### Changelog
- Preserve hand-corrected text in `--format-only` ([#2041e5f](https://github.com/deltabox-studio/toolchain/commit/2041e5f) by [T0chi](https://github.com/T0chi))
#### Shared
- Restore `PowerShell`-escaped letters ([#4d2be6a](https://github.com/deltabox-studio/toolchain/commit/4d2be6a) by [T0chi](https://github.com/T0chi))
### Documentation
- Document vendor workflows, typed builders and `--format-only` ([#eb66982](https://github.com/deltabox-studio/toolchain/commit/eb66982) by [T0chi](https://github.com/T0chi))
#### Changelog
- Document `formatLine` ([#61e28ec](https://github.com/deltabox-studio/toolchain/commit/61e28ec) by [T0chi](https://github.com/T0chi))
### Chores
#### Config
- Regenerate config-types, schema and docs ([#0b0ca20](https://github.com/deltabox-studio/toolchain/commit/0b0ca20) by [T0chi](https://github.com/T0chi))
