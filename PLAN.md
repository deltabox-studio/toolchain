# PLAN — Vite+ provider, custom templates, and the `dbx` rebrand

> Handoff document. Keep the **Milestones** section at the bottom up to date:
> check items off as they land, and add a short note when a decision changes.
> Everything above the milestones is context so a future contributor (human or
> agent) can pick this up without the chat history.

---

## 1. Objective

Integrate **Vite+** (`https://github.com/voidzero-dev/vite-plus`) into
`@deltabox/toolchain` as a first-class **provider** across all three surfaces:

1. **CLI** — every `vp` command reachable through `dbx`.
2. **Programmatic API** — importable functions in the published package.
3. **VS Code extension** — run `vp` commands and create Vite+ projects from the UI.

Plus two adjacent features:

4. **Custom project/tooling templates & pipelines** — offline (bundled + local
   dirs) **and** online (git repos, npm `@scope/create` manifests).
5. **Self-migration** — convert `@deltabox/toolchain`'s own build/test/lint to
   Vite+ (`vite.config.ts` + `vp` scripts).

And a repo-wide **rebrand** (**DONE**): the old names `dbx-tooling`,
`dbx tooling`, `@deltabox/tooling` are now `dbx`, `dbx toolchain`,
`@deltabox/toolchain` (contents **and** matching folder/file names). Related
identifiers were renamed too — see section 7.

## 2. Locked decisions (from the scoping Q&A)

| Question           | Answer                                                          |
| ------------------ | --------------------------------------------------------------- |
| Vite+ scope        | **Full** — provider + self-migrate tooling + templates via `vp` |
| Template sources   | **Both** offline (bundled + local dirs) and online (git / npm)  |
| Build order        | **Vite+ provider package first**, then the rest                 |
| Rebrand breadth    | **Also related identifiers** (config names, dir, editor ids)    |
| Rebrand sequencing | Rebrand **before** the self-migration                           |

## 3. Key facts about Vite+

- One binary, `vp`, wrapping Vite, Vitest, Oxlint, Oxfmt, Rolldown, tsdown and
  Vite Task. Install: `curl -fsSL https://vite.plus | bash` (POSIX) or
  `irm https://viteplus.dev/install.ps1 | iex` (Windows).
- Commands: `create`, `migrate`, `config`, `hooks`, `staged`, `install`(`i`),
  `env`, `dev`, `check`, `lint`, `fmt`, `test`, `run`, `exec`, `node`, `dlx`,
  `cache`, `build`, `pack`, `preview`, `add`, `remove`, `update`(`up`),
  `dedupe`, `outdated`, `list`, `why`, `info`, `link`, `unlink`, `rebuild`,
  `pm`, `toolchain`, `upgrade`, `implode`.
- Config is a single `vite.config.ts` with `test` / `lint` / `fmt` / `run` /
  `staged` / `create` sections. `create: { defaultTemplate: '@org' }` plus a
  published `@org/create` package (with `createConfig.templates`) is the
  **online template** mechanism.
- Migration aliases: `resolutions` (Yarn) / `overrides` (pnpm/npm) mapping
  `vite` → `@voidzero-dev/vite-plus-core` and pinning `vitest`.

## 4. Architecture

- Root `dbx` CLI (`src/cli/index.ts`) composes framework-agnostic
  `ToolingCommand` descriptors exported by each `packages/*` package and
  registers them with commander via `registerToolingCommands`
  (`src/cli/register.ts`). Before a non-passthrough command runs, the consumer's
  `dbx.config.*` is loaded and passed as `ToolingCommandContext`.
- Config model lives in `packages/shared/src/toolchain.ts`: `ToolingConfig` with
  opt-in-by-presence sections (`changelog`, `biome`, `tsconfig`, `templates`,
  `vite`, `watch`), `SyncTask`s, `resolveTokens`, `sectionEnabled` /
  `sectionConfig`.
- Sync engine: `packages/core` loads config (`loader.ts`), detects project type
  (`project-type.ts`), runs tasks (`sync.ts`) writing managed files tracked in
  `.dbx/toolchain/manifest.json` (`manifest.ts`), with a `keep` escape hatch.
- Root `src/sync.ts` `defaultSyncTasks()` wires the tasks.
- Scaffolding: `packages/project/src/typescript.ts` (single / monorepo root /
  workspace) + the template registry in `packages/template`.
- VS Code extension (`packages/vscode`) spawns the resolved local CLI and drives
  everything through it; it does **not** import the toolchain packages at build
  time. The `dbx providers --json` command is the bridge.
- Providers: `ToolingProvider` (`packages/shared/src/provider.ts`); the Vite+
  provider is `packages/vite` (`@deltabox/toolchain-vite`).

## 5. What was built

### 5.1 Vite+ provider (`packages/vite`)

- `src/vp.ts` — resolve `vp` (local `node_modules/.bin/vp` → global `PATH` →
  `npx --yes vite-plus`), `runVp` (never exits the host), `vpVersion`,
  `describeVp`. Uses the shared cross-platform `spawnCross`.
- `src/commands.ts` — the `vp` command catalog (`VP_COMMANDS`), grouped.
- `src/provider.ts` — `viteProvider()` descriptor (commands + curated actions).
- `src/sync.ts` — `viteSyncTask()` managing an opt-in `vite.config.ts`
  (`vite` config section; `config: false` opts out).
- `src/cli/index.ts` — `viteCommands()`: generic `vite` passthrough + one
  `vite:<sub>` per catalogued command.
- `ToolingCommand.passthrough` (shared) makes `register.ts` register with
  `allowUnknownOption` + `allowExcessArguments` and forward raw operands
  (`command.args`) under `opts.args`, skipping config load.

### 5.2 Providers bridge + VS Code

- `dbx providers [--json]` + root `toolingProviders()` aggregator
  (`src/providers.ts`).
- Extension `packages/vscode/src/cli.ts` (`resolveCliCommand`, `captureCli`,
  `cliInvocation`, `workspaceRoots`) and `providers.ts` (`loadProviders`).
- Commands `deltabox.toolchain.runVite` / `.runProjectVite` (QuickPick over the
  provider commands) and `.createVite` (`vp create`); they open an integrated
  terminal at the project root and run `dbx vite:<sub>`.
- Home view: "Run Vite+…" quick action + "All actions" entry + per-project menu.

### 5.3 Templates (`packages/template`)

- `src/types.ts` model; `src/builtin.ts` (project / monorepo / workspace /
  vite-plus); `src/local.ts` (`template.json` discovery); `src/online.ts`
  (npm registry `createConfig.templates` + git); `src/registry.ts`
  (`.dbx/toolchain/templates.json`); `src/scaffold.ts` (builtin generators,
  local copy with token replacement in **paths and contents**, `vp create` for
  online); `src/cli/index.ts` (`template:list|add|info`, `create`).
- VS Code: "From template…" in the scaffold flow.

## 6. Conventions / gotchas

- Packages mirror `packages/biome`: `package.json` (+ `private: true`),
  `tsconfig.json` / `tsconfig.build.json` / `tsconfig.default.json`,
  `tsdown.config.ts` (`baseTsdownConfig`), `vitest.config.ts`.
- Root wiring for a new package: root `package.json` devDependency
  (`workspace:*`) + `./<name>` export + `src/<name>.ts` re-export; root
  `tsdown.config.ts` entry **and** alias; root `tsconfig.json` `paths`.
- Root `yarn build` = `turbo build build:root`. Packages are private and inlined
  into the root dist via tsdown aliases.
- **Package typechecks/tests resolve workspace deps from their built `dist`.**
  After editing a package's exports, run a full `yarn build` (turbo orders
  deps first) — `yarn build:root` alone leaves package `dist` stale.
- **JSDoc gotcha:** a comment containing `**/*.ts` closes early (the `*/` in
  `**/`). Avoid glob-with-slash inside comments.
- **BOM:** PowerShell-authored JSON often starts with a UTF-8 BOM; readers
  strip `^\uFEFF` before `JSON.parse`.
- PowerShell: quote `@scope` args (`"@acme"`), no `??` operator (PS 5.1), and
  avoid `"$t\")"`-style backslash-before-quote (it terminates the string).
- Fresh checkout has no `node_modules` — run `yarn install` first.
- Windows: spawning a `.cmd` shim needs the `spawnCross` cmd.exe wrapping.

## 7. Rebrand — DONE (`dbx-tooling` -> `dbx`)

Applied across the repo (contents + matching folder/file names). The old names
appear below only in this record; a leftover scan should exclude this file.

Primary literal replacements:

| From                | To                    |
| ------------------- | --------------------- |
| `dbx-tooling`       | `dbx`                 |
| `dbx tooling`       | `dbx toolchain`       |
| `@deltabox/tooling` | `@deltabox/toolchain` |

Related identifiers (also renamed — the locked "Also related identifiers"):

- Package names: `@deltabox/tooling` -> `@deltabox/toolchain`;
  `@deltabox/tooling-*` -> `@deltabox/toolchain-*` (10 workspaces).
- Config file names: `dbx.tooling.config.*` -> `dbx.toolchain.config.*`.
- Manifest dir: `.dbx-tooling/` -> `.dbx/toolchain/`.
- VS Code: section + command/config/webview ids `deltabox.tooling.*` ->
  `deltabox.toolchain.*`; titles `deltabox tooling` -> `deltabox toolchain`;
  output channel `deltabox tooling` -> `deltabox toolchain`.
- Extension package `tooling-vscode` -> `toolchain-vscode`; VSIX
  `deltabox-tooling.vsix` -> `deltabox-toolchain.vsix`; activity-bar icon
  `resources/tooling.svg` -> `resources/toolchain.svg`.
- Source module `packages/shared/src/tooling.ts` -> `toolchain.ts`.
- CLI bin `dbx-tooling` -> `dbx`.

Renamed (done):

- Root folder `tooling` -> `toolchain` (**done**). Reinstalled both repos so
  the `node_modules/@deltabox/*` junctions and the `portal:../toolchain` link
  were recreated, then rebuilt the toolchain (the emitted `dist` `.d.ts` had
  absolute `tooling` paths baked in).

Not renamed (deliberate):

- Generic internal API names (`ToolingConfig`, `ToolingCommand`,
  `toolingProviders`, `packages/*` dirs) — not brand strings.

**Consumer migration — DONE.** `proxified` was rebranded in place: the three
literals replaced (30 files), `dbx.tooling.config.ts` -> `dbx.toolchain.config.ts`,
`.dbx-tooling/` -> `.dbx/toolchain/`, `@deltabox/tooling` dep -> `@deltabox/toolchain`
(`portal:../toolchain`), scripts `dbx-tooling` -> `dbx`, then
`yarn install` (relinked the junction) + `dbx sync` + `yarn typecheck`
(9/9) + `@proxified/shared` tests (39 passed).

**Still to do (manual):** uninstall the old VSIX (`deltabox-tooling.vsix`) and
install the new `deltabox-toolchain.vsix`.

---

## 8. Milestones

Legend: `[x]` done · `[~]` in progress · `[ ]` todo · `[?]` needs confirmation.

### Phase A — Vite+ provider package (`packages/vite`) — DONE

- [x] `packages/shared/src/provider.ts` provider model + export.
- [x] `ToolingConfig.vite` section + `ToolingViteConfig`.
- [x] `ToolingCommand.passthrough` flag.
- [x] `spawnCross` exported from `packages/shared/src/run.ts`.
- [x] `register.ts` passthrough support.
- [x] `packages/vite` package (`vp` resolver, catalog, provider, sync, CLI).
- [x] Root wiring (devDep, `./vite` + `./providers` exports, tsdown, tsconfig).
- [x] Register `viteCommands()` in `builtinCommands()`.
- [x] Tests (9) + smoke tests.

### Phase B — providers bridge + VS Code — DONE

- [x] `providers` CLI command (JSON + table).
- [x] `toolingProviders()` aggregator + `./providers` export.
- [x] Extension `runVite` / `runProjectVite` / `createVite` (terminal-based),
      Home actions, `package.json` commands/menus.
- [x] VSIX repackaged.

### Phase C — custom templates & pipelines (offline + online) — DONE

- [x] `packages/template` (`@deltabox/toolchain-template`).
- [x] Offline: builtin + local dirs, token replacement in paths + contents.
- [~] Online: npm `@scope/create` listing + git metadata; **creating** from
  npm/git/vite-plus delegates to `vp create` (no first-party fetch yet).
- [x] CLI `template:list|add|info` + `create --template <id>`.
- [x] `vite.defaultTemplate` -> `create.defaultTemplate`.
- [x] VS Code "From template…".
- [x] Tests (6).
- [ ] Docs/README for the `template.json` authoring format.

### Phase E — rebrand — DONE

- [x] Inventory + content replacement of the three literals + related ids.
- [x] Rename `@deltabox/tooling-*` package names + imports/aliases/paths.
- [x] Rename `dbx.tooling.config.*`, `.dbx-tooling/`, `deltabox.tooling.*` ids.
- [x] Rename files: `shared/src/tooling.ts` -> `toolchain.ts`,
      `resources/tooling.svg` -> `toolchain.svg`, VSIX -> `deltabox-toolchain.vsix`.
- [x] `yarn install` + full build green (41/41) + tests (12/12) + VSIX.
- [?] Rename the root folder `tooling` -> `toolchain` (deferred; confirm first).

### Phase D — self-migrate `@deltabox/toolchain` to Ox (Vite+) — DONE

- [x] `vite-plus@^1.2.0` devDependency (platform binary via optionalDependencies) + root `vite.config.ts` (test / lint / fmt / run).
- [x] **Adopted Oxfmt + Oxlint**: `fmt`/`lint` in `vite.config.ts` are the
      migration output; the repo is reformatted to Oxfmt style.
- [x] **Removed Biome** from the repo pipeline: `biome.json` deleted,
      `@biomejs/biome` + per-package `format`/`lint` scripts removed; root
      `format`/`lint`/`check` now run `vp fmt` / `vp lint` / `vp check`.
- [x] `turbo` + `turbo.json` removed; `vp run` (Vite Task) drives build /
      typecheck / test (format/lint run once at the root — `vp` only resolves at
      the repo root).
- [x] Verified: `vp fmt --check` clean (177 files); `vp lint` 0 errors;
      `vp:test` 19 files / 117 passed; `yarn build` 32/32.
- [x] Turbo fully replaced by Vite Task: each package declares `build` /
      `typecheck` / `test` in its own `vite.config.ts` with explicit
      `cache.input`/`output` (`dist` excluded from inputs, `tsbuildinfo`
      excluded; typecheck/test restore no outputs). The per-package
      `build`/`typecheck`/`test` scripts were removed (a task and a script cannot
      share a name); `yarn build`/`typecheck`/`test` now report 100% cache hits.
- [ ] Package-manager alias mapping (`vite` -> vite-plus core, pin `vitest`).
- Note: `vp fmt`/`vp lint` ignore `.ox*rc.json` and read `vite.config.ts`, so
  the ox config lives there (not in `.oxfmtrc.json`/`.oxlintrc.json`).
  YAML is excluded from formatting (the changelog reference workflows are 2-space).

### Phase G — migration subsystem (any tool -> Ox) — DONE

- [x] New `packages/migrate` (`@deltabox/toolchain-migrate`): `ToolingMigration`
      model + extensible registry (`migrations()`, `detectMigrations`,
      `runMigration`, `listMigrations`).
- [x] `biome-to-ox`: formatter options, `files.includes` negations ->
      `ignorePatterns`, `organizeImports.groups` -> Oxfmt `sortImports`
      (`groups`/`customGroups`/`internalPattern`), curated Biome -> Oxlint rule
      map; string-aware JSONC reader (`stripJsonc`).
- [x] `prettier-to-ox` + `eslint-to-ox` (ESLint JSON configs map directly; JS
      configs point at `@oxlint/migrate`).
- [x] CLI `migrate` (`--from`, `--write`, `--cwd`, `--json`, `--target`) +
      `migrate:list`; programmatic API.
- [x] Tests (6) + full build green.
- [x] Used it on this repo (`dbx migrate --from biome --write`) and
      inlined the result into `vite.config.ts`.
- [x] `--target vite`: fold output straight into `vite.config.ts` (implemented
      via string-aware `mergeViteConfig` / `renderViteTarget`).
- [x] Migration DX: `MigrationResult.files` (path + content) so `--check` can
      compare on disk and exit non-zero in CI; `--from all` runs every detected
      source; `--online` runs `@oxlint/migrate` for ESLint flat configs (with
      `--write`); tests + docs updated.
- [ ] Add more source tools (Stylelint, Svgo, ...) as `ToolingMigration`s.

### Phase F — verification & handoff — MOSTLY DONE

- [x] Toolchain `yarn install && yarn build` green (32/32); `vp fmt --check`
      clean; `vp lint` 0 errors; `vp:test` 19 files / 117 passed.
- [x] CLI smoke: 59 commands; `providers`, `vite:*`, `template:list`,
      `migrate:list`, `create`, `sync` all respond. Phase I re-smoke:
      `template:list` shows every kind, `template:init --add` +
      `template:list --registry` + `template:remove`, and `create --kind folder`
      / `create --template <local>` (token replacement) all work.
- [x] `proxified` migrated + verified: `dbx sync`, typecheck 9/9,
      `@proxified/shared` tests 39 passed.
- [ ] VS Code extension smoke (install `deltabox-toolchain.vsix`, run the Vite+
      and template actions in a real workspace) — needs VS Code.
- [x] Plan updated.

### Phase H — docs, DX & follow-ups — IN PROGRESS

- [x] Rename `defineToolingConfig` -> `defineConfig` (the alias was removed);
      scaffolds/generators emit `defineConfig`. Also removed the
      `defaultTsdownConfig` alias (now `baseTsdownConfig`).
- [x] `migrate --target vite`: folds `fmt`/`lint` into an existing
      `vite.config.ts` (string-aware insert/replace; verified on a scratch repo).
- [x] More `ToolingMigration` sources: added `dprint-to-ox`.
- [x] `proxified` fully on Ox: `vite.config.ts` (fmt + lint folded from
      `biome.json`), root `format`/`lint` = `vp fmt` / `vp lint --fix`,
      `vite-plus` added; `@biomejs/biome`, `biome.json`, `.oxfmtrc.json`,
      `.oxlintrc.json` and the per-workspace Biome scripts removed; repo
      reformatted (`vp fmt --check` clean, `vp lint` 0 errors / 49 warnings);
      `yarn typecheck` 9/9 + `@proxified/shared` tests 39 pass.
- [x] Toolchain: `vscodeSyncTask` accepts a `settings` function, so
      `defaultSyncTasks` only injects the Biome VS Code settings when the
      `biome` section is enabled (a Biome-less consumer no longer gets
      `biome.lsp.watcher.kind`).
- [x] Toolchain: `renderCommitlintConfig` emits Oxfmt-formatted output, so the
      generated `commitlint.config.mjs` passes `vp fmt --check`.
- [x] `migrate`: extended the Biome → Oxlint rule map
      (`useNodejsImportProtocol`, `noStaticOnlyClass`, `useSemanticElements`,
      `noLabelWithoutControl`, `noAccumulatingSpread`).
- [x] Replaced Turbo with Vite Task: `turbo` dep + `turbo.json` removed; root
      `build`/`typecheck`/`test` run `vp run` (root tasks in `vite.config.ts`).
- [x] `apps/docs`: VitePress workspace (`@deltabox/toolchain-docs`) documenting
      the toolchain (Introduction + Guide + Config reference), built OK.
- [x] Docs polish: expanded `config/reference.md` with a per-section example +
      a full example; added `guide/config-generator.md` (the Zod/env config
      engine: `.meta()`, `createConfigEngine`, generators, `config:*` commands,
      with a Proxified-style example); local search is enabled in
      `.vitepress/config.ts`; added `.github/workflows/ci.yml`
      (install → build → check → test → docs build) and a root `netlify.toml`
      deploy config.
- [x] Docs coverage audit: `cli.md` (added `template:init`/`template:remove`,
      `create --kind`, `migrate --check`/`--from all`, a config-generator note),
      refreshed `vscode.md` (views, full command table incl. **Add/Remove
      template**, project menu, loop prevention, settings, command palette),
      fixed the config-generator `config:*` note (consumer CLI, not
      `dbx`), and added `guide/api.md` (umbrella + every subpath
      export).
- [x] Verified + documented every area (commitlint, changelog/CI, tsconfig,
      templates, vite, watch, hooks) is configurable from
      `dbx.toolchain.config.ts`; added `packages/shared/tests/config.test.ts`.
- [x] Cleanup: removed the 13 stale `.turbo/` dirs + the Turborepo `.gitignore`
      entry; added a root `README.md` (badges, quickstart, CLI/API/packages/dev
      sections) documenting `@deltabox/toolchain` / `defineConfig`.
- [x] Vite Task caching: per-package `vite.config.ts` tasks with explicit
      `cache.input`/`output` so `vp run` reports cache hits instead of "not
      cached because they modified their inputs" (`yarn build` 12/12 + root,
      `yarn test`/`yarn typecheck` 100% on a warm cache). Also fixed a latent
      `sectionConfig({ refs: true })` type error in
      `packages/shared/tests/config.test.ts` (root tsconfig typechecks
      `packages/*/tests`).
- [x] Removed stray emitted declarations that had leaked next to sources
      (`src/{index,config,sync,tsdown}.d.ts`); builds now only write `.d.ts`
      under `dist/**` (explicit task `cache.output`, task cache cleared).
      Verified a cold `yarn build` + `typecheck`/`test`/`check` emit none.
- [x] Renamed the root folder `tooling` -> `toolchain`. Updated `proxified`'s
      `portal:../toolchain` dep + every `tsconfig*.json` path alias, reinstalled
      both repos (the toolchain's `node_modules/@deltabox/*` junctions were
      dangling absolute links to the old path; clearing `.yarn-state.yml` +
      reinstalling recreated them), rebuilt the toolchain (`dist` `.d.ts` had
      absolute `tooling` paths), re-ran `dbx sync`, and verified green:
      `proxified` typecheck 9/9, toolchain build + typecheck 12/12 + test +
      check (0 errors, 4 warnings).

### Phase I — easy template authoring & registry kinds — DONE

Goal: make it trivial to register and create templates of any kind —
**project / workspace / application / folder** (plus the existing tooling /
pipeline) — from the CLI, and expose the same flow in the VS Code extension
(which drives the CLI, exactly like the sync/scaffold/provider features).

Template kinds

- [x] Shared `ToolingTemplateKind =
      project | workspace | application | folder | tooling | pipeline`, reused by
      `Template.kind` and `ToolingTemplateSource.kind`.
- [x] Builtins cover the common kinds: `project`, `application`, `folder`,
      `monorepo`, `workspace` (kind `workspace`), plus `vite-plus`.

Registry authoring (CLI)

- [x] `template:init [dir]` — write a `template.json` (kind, name, description,
      variables, tags) into a directory, with `--add` to register it too.
- [x] `template:add <spec>` — accepts a local folder, `--kind`, and auto-inits a
      `template.json` when the folder has none.
- [x] `template:remove <id|type:locate>` — drop a source from
      `.dbx/toolchain/templates.json`.
- [x] `template:list --kind` / `--registry` and `create --kind <kind>`.

VS Code parity (via the CLI)

- [x] Commands `deltabox.toolchain.templateAdd` ("Add template…", runs
      `template:init --add`) and `.templateRemove` ("Remove template…", runs
      `template:list --registry` + `template:remove`); Home quick actions +
      "All actions" + command palette entries.

Docs & tests

- [x] `apps/docs/guide/templates.md`: kinds, the `template.json` authoring
      format, `template:init/add/remove`, and the VS Code flow.
- [x] Tests: `template:init` manifest, kind filtering, registry add/remove,
      folder builtin.

### Phase J — schema-driven config + `dbx` CLI — DONE

- [x] The `dbx.toolchain.config` model is now **Zod schemas**
      (`packages/shared/src/config-schema.ts`); the TS types are derived
      (`z.infer`) and re-exported, so there is no hand-written type to drift.
      (`hooks` stays hand-written — functions aren't JSON-Schema-able.)
- [x] Generated from the schema: `apps/docs/config/reference.md` (via a new
      `renderConfigFileMarkdown` in `@deltabox/toolchain-config`) and
      `config.schema.json` (editor autocomplete). `yarn config:generate`, wired
      into CI with a `git diff --exit-code` guard. The hand-written reference is
      gone.
- [x] Renamed the CLI `dbx-toolchain` -> **`dbx`** everywhere (bin in
      `package.json` + `tsdown.config.ts`, log prefixes, docs, the VS Code
      extension's resolution) — no alias. `proxified`'s scripts updated to `dbx`
      too (`.dbx/toolchain/` and `dbx.toolchain.config.*` unchanged).
- [x] Fixed the VS Code extension's local-CLI path
      (`@deltabox/tooling` -> `@deltabox/toolchain`), a rebrand leftover.
- [x] Renamed the manifest directory `.dbx-toolchain/` -> **`.dbx/toolchain/`**
      (core `MANIFEST_DIR`/graph, template registry, VS Code reader, docs);
      `proxified`'s directory moved and re-synced.

### Phase K — `dbx.config` + self-hosting — DONE

Goal: the config file becomes the generic `dbx.config.*` (sections wrapped under
`toolchain`), the repo dogfoods its own CI + changelog, and the remote is renamed.

- [x] Config file renamed `dbx.toolchain.config.*` -> **`dbx.config.*`** (new name
      only, no fallback). `CONFIG_FILE_NAMES`, the loader (`findConfigFile`),
      the VS Code reader/glob, the scaffold (`GENERATED_CONFIG_FILENAME`), docs
      and tests all updated.
- [x] Config **shape wrapped**: a `dbx.config.*` exports
      `defineConfig({ toolchain: { ...sections } })`. New `dbxConfigSchema`
      (`{ toolchain: toolingConfigSchema }`) + `DbxConfig` type; `defineConfig`
      now takes `DbxConfig`; the loader unwraps `config.toolchain` so tasks keep
      seeing flat sections. The generated docs reference + `config.schema.json`
      are now `dbx.config` (schema nests under `toolchain`).
- [x] **Self-hosting**: added the repo's own `dbx.config.ts` (project +
      changelog). `dbx sync` generates `.github/workflows/{ci,changelog,release,
      sync,issues}.yml`, `commitlint.config.mjs` and the Conventional-Commits
      VS Code settings; the managed `ci.yml` keeps the repo's checks (check, test,
      config-artifact guard, docs build) via `changelog.workflows.ci.steps.after`.
- [x] Remote renamed `deltabox-studio/tooling` -> `deltabox-studio/toolchain`
      (package.json repository URLs, README/docs links, the VitePress edit link).

---

## 9. Open questions

- Templates: build a first-party npm/git fetch+materialize path, or keep routing
  online creation through `vp create`?
- ~~Replace turbo with `vp run` (Vite Task) for build/test, or keep turbo?~~ —
  resolved: turbo removed; Vite Task with per-package cached tasks.
- Migration `--target vite`: implement an AST-safe merge into `vite.config.ts`?
- ~~Rename the root folder `tooling` -> `toolchain`?~~ — done (see Phase H /
  the rename notes above).
