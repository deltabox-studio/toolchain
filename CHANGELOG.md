# Changelog

## 1.5.0 (October 2026)

<!-- release:start -->

### New features
#### Changelog
- Emit the husky commit-msg hook for consumers ([#6898386](https://github.com/deltabox-studio/toolchain/issues/6898386) by [T0chi](https://github.com/T0chi))
  - \dbx sync\ now writes .husky/commit-msg (running commitlint) alongside the workflows and commitlint.config.mjs, so consumers using the Conventional-Commits CI lint commits locally too. The docs recommend \postinstall: husky\ (Yarn Berry never runs \prepare\) and \.husky/* text eol=lf\ (a trailing CR breaks the hook).

<!-- release:end -->


## 1.4.1 (October 2026)

### Bug fixes
#### Tsdown
- Pin the changelog and tsconfig bins explicitly ([#f616626](https://github.com/deltabox-studio/toolchain/commit/f616626) by [T0chi](https://github.com/T0chi))
  - With \exports: true\ and no \in\, tsdown soft auto-detects the shebang entry and derives the command name from the package name, rewriting the committed \in\ on every build. Map the command names explicitly so the field is stable and the build is idempotent.
#### Ci
- Bootstrap the dist the vite shim needs before build ([#b96b89a](https://github.com/deltabox-studio/toolchain/commit/b96b89a) by [T0chi](https://github.com/T0chi))
  - \prepare\ never runs on \yarn install\ under Yarn Berry, so scripts/bootstrap.mjs never built dist/vite.js and \yarn build\ failed to load the generated vite.config.ts shim on a fresh CI checkout. Run the bootstrap from a root \postinstall\ and at the start of build/typecheck/test (all begin with \p run\, which loads the shim); it is a no-op once dist/vite.js exists.

## 1.4.0 (October 2026)

### New features
- Render the dbx CLI with clack, author the Vite+ config in dbx.config ([#fb8b9ef](https://github.com/deltabox-studio/toolchain/commit/fb8b9ef) by [T0chi](https://github.com/T0chi))
  - vite.config.ts in and adds the fmt ignore; dbx resolves its own binary first
    and colour Commander's help
#### Vscode
- Add Providers and Templates views ([#9aa6d12](https://github.com/deltabox-studio/toolchain/commit/9aa6d12) by [T0chi](https://github.com/T0chi))
  - add/remove/run-command/open-homepage/copy-id actions
    toolchainProviders(), so a registered provider's commands become dbx commands
    Templates -> Managed Files
#### Vite
- Drive dbx from the dbx plugin, drop defineDbxConfig ([#8d11557](https://github.com/deltabox-studio/toolchain/commit/8d11557) by [T0chi](https://github.com/T0chi))
  - The Vite/Vite+ integration is now the dbx() plugin plus spreading DBX_TASKS into
    run.tasks, so the consumer's own vite config stays the config:
  - export default defineConfig({
    plugins: [dbx()],
    run: { tasks: { ...DBX_TASKS } },
    });
  - Remove the defineDbxConfig wrapper (and DbxViteConfig) and update the README, the
    Providers guide and the API reference.
- Author the Vite+ config in dbx.config, generate vite.config.ts ([#9885225](https://github.com/deltabox-studio/toolchain/issues/9885225) by [T0chi](https://github.com/T0chi))
  - toolchain.vite now holds the whole Vite+ config (a loose object) with a
    config: false opt-out, and dbx sync generates the managed root
    vite.config.ts from it, so dbx.config.* is the only hand-authored root config.
  - Add dbx migrate --from vite (auto-detected): it extracts the object passed to
    defineConfig in an existing root vite.config.ts and folds it into dbx.config.*'s
    toolchain.vite, refusing configs it cannot migrate faithfully.
  - The config-types generator now honors .catchall, emitting an index signature.
#### Config
- Expose the Vite+ config type, rename Tooling* to Toolchain* ([#088de56](https://github.com/deltabox-studio/toolchain/commit/088de56) by [T0chi](https://github.com/T0chi))
  - ToolchainViteConfig is now Vite+ ViteUserConfig intersected with the managed
    config?: boolean opt-out, instead of a generated loose object. The config-types
    generator gains a hand-written type override plus an imports block, used for the
    vite type, and vite-plus becomes an optional peer dependency.
  - Rename every Tooling* type, schema id and identifier to Toolchain*. That covers
    the config schema ids, CONFIG_TYPE_SCHEMAS keys, the provider/migration models
    and the CLI helpers (toolchainConfigSchema, loadToolchainConfig,
    toolchainProviders, registerToolchainCommands). Regenerated types/schema/docs.
### Bug fixes
#### Deps
- Sync the lockfile for @clack/prompts ([#568a7c6](https://github.com/deltabox-studio/toolchain/commit/568a7c6) by [T0chi](https://github.com/T0chi))
  - The lockfile was missing the @clack/prompts entry for packages/shared and
    packages/template, so 'yarn install --immutable' failed in CI (YN0028).
### Refactors
- Rename Ox to Oxc across the project ([#39b37d3](https://github.com/deltabox-studio/toolchain/commit/39b37d3) by [T0chi](https://github.com/T0chi))
  - (Oxfmt/Oxlint and .oxlintrc/.oxfmtrc are unchanged)
### Documentation
- Cover the clack CLI output, prompts and dbx binary resolution ([#f45ed3f](https://github.com/deltabox-studio/toolchain/commit/f45ed3f) by [T0chi](https://github.com/T0chi))
- Document the Vite+ config type and the Toolchain* names ([#1e70950](https://github.com/deltabox-studio/toolchain/commit/1e70950) by [T0chi](https://github.com/T0chi))
  - Note that toolchain.vite is typed as Vite's UserConfig as augmented by Vite+
    (ToolchainViteConfig), and list ToolchainViteConfig among the shared config
    types. Covers the unreleased changes since v1.3.1 together with the sections the
    feature commits already added (the Vite+ config in dbx.config, the generated
    vite.config.ts, the vite migration and the dbx plugin).
#### Vscode
- Refresh the extension screenshot and add its LICENSE ([#49d4510](https://github.com/deltabox-studio/toolchain/commit/49d4510) by [T0chi](https://github.com/T0chi))
### Build system
- Package the VS Code extension in yarn build ([#1dd14a1](https://github.com/deltabox-studio/toolchain/commit/1dd14a1) by [T0chi](https://github.com/T0chi))
  - yarn build now also runs the vscode package:vsix, so deltabox-toolchain.vsix
    is always produced.

### Package changes
#### Added
- `@clack/prompts` `^1.8.1`
#### Updated
- `vite-plus` `^1.2.0` → `>=1`

## 1.3.1 (October 2026)

### Documentation
- Update config generator documentation ([#0dfbf88](https://github.com/deltabox-studio/toolchain/commit/0dfbf88) by [T0chi](https://github.com/T0chi))
- Update config generator reference link ([#2f0adde](https://github.com/deltabox-studio/toolchain/commit/2f0adde) by [T0chi](https://github.com/T0chi))
- Update features descriptions ([#e9c0a6d](https://github.com/deltabox-studio/toolchain/commit/e9c0a6d) by [T0chi](https://github.com/T0chi))

## 1.3.0 (October 2026)

### New features
#### Core
- Keep the generated .dbx directory out of git ([#9fc1434](https://github.com/deltabox-studio/toolchain/commit/9fc1434) by [T0chi](https://github.com/T0chi))
  - dbx sync now appends the .dbx ignore block (everything under .dbx/ except the
    manifest, which holds no absolute paths) to an existing .gitignore, and the
    installation guide documents the pattern and the automatic step.
#### Cli
- Route CLI output through the logger, add a providers colour option ([#ce76a4d](https://github.com/deltabox-studio/toolchain/commit/ce76a4d) by [T0chi](https://github.com/T0chi))
  - Commander's help and errors now go through the shared logger (help to stdout,
    errors to stderr, colour-aware, ANSI stripped when colour is off). Vite+
    passthrough commands keep commander's defaults so the spawned vp keeps its own
    coloured logging.
  - Add a providers config section (color?: boolean): color: false forces plain
    provider output, the global --no-color still turns it off, and runVp sets
    NO_COLOR / FORCE_COLOR on the child when colour is disabled.
- Check for a newer dbx version ([#772aae2](https://github.com/deltabox-studio/toolchain/commit/772aae2) by [T0chi](https://github.com/T0chi))
  - On each run, check the npm registry in the background (cached for a day, never
    blocking) and print a short notice with a link to the release when a newer
    @deltabox/toolchain exists. Skipped in CI and by NO_UPDATE_NOTIFIER or
    DBX_NO_UPDATE_CHECK, and can be turned off with the new --no-update-check flag.
- Default a bare Vite+ command to the `vite` passthrough ([#75770e4](https://github.com/deltabox-studio/toolchain/commit/75770e4) by [T0chi](https://github.com/T0chi))
  - `dbx fmt` / `dbx lint` / `dbx run` / `dbx dev` now work: when the first operand
    is not a built-in command but names a Vite+ subcommand (or one of its aliases),
    `vite` is inserted before it and the whole Vite+ CLI stays reachable without the
    explicit namespace. Built-in commands win, so `dbx migrate` remains the
    toolchain's migration (`dbx vite migrate` is Vite+'s).
  - The Package scripts, Migrations, Monorepo, CLI and Providers guides now show the
    bare form, and the consumers' root scripts were updated to match.
#### Vscode
- Bundle the dbx CLI into the extension ([#bf12403](https://github.com/deltabox-studio/toolchain/commit/bf12403) by [T0chi](https://github.com/T0chi))
  - Ship a self-contained dbx.cjs inside the VSIX (built by the new
    tsdown.bin.config.ts) and prefer it in the extension, so a consumer no longer
    needs to install @deltabox/toolchain. It falls back to a workspace-local
    install and then npx.
  - Make the changelog and tsconfig direct-run guards basename-aware so they do not
    fire when the module is inlined into the single-file bundle.
#### Shared
- Add a configurable shared logger ([#54b51fa](https://github.com/deltabox-studio/toolchain/commit/54b51fa) by [T0chi](https://github.com/T0chi))
  - Add packages/shared/src/logger.ts: one level-aware, colour-aware sink (colours
    via picocolors, the same package Vite uses) with debug, info, success, warn,
    error and raw (unprefixed machine output). It is configurable from dbx.config's
    new logger section and from the CLI (--log-level, --no-color), with the CLI
    taking precedence.
  - Every console call in the toolchain now goes through the logger (JSON output
    through raw), including the sync/watch log callback and the run helper's
    verbose line. The generated config types, the JSON schema, the docs reference
    and the Configuration/CLI guides document the new logger section.
### Bug fixes
- Correct tsconfig aliases under --cwd, prune self-referential task runs ([#40e0c34](https://github.com/deltabox-studio/toolchain/commit/40e0c34) by [T0chi](https://github.com/T0chi))
  - Two bugs found by exercising the CLI against the local consumer projects:
  - instead of process.cwd(), so `dbx sync --cwd <dir>` (run from elsewhere)
    writes correct relative paths rather than paths pointing at the caller.
    spawning the task runner, and prunes itself when the same command runs again
    from the same root. A root task whose script calls `run -r <task>` can no
    longer recurse.
- Changelog links, oxfmt map, build idempotency, watch timer, vscode spawn ([#2389c98](https://github.com/deltabox-studio/toolchain/commit/2389c98) by [T0chi](https://github.com/T0chi))
  - render commits as a plain short hash instead of a github.com/undefined link
    `yarn build` no longer rewrites it and the working tree stays idempotent
    spawnCli and cliInvocation
- Sync --check writes, quiet level, log flags and template tokens ([#7f5690f](https://github.com/deltabox-studio/toolchain/commit/7f5690f) by [T0chi](https://github.com/T0chi))
  - Audit pass over the toolchain source:
  - actually generated by dbx sync
### Documentation
- Document the full public API surface ([#6f78245](https://github.com/deltabox-studio/toolchain/commit/6f78245) by [T0chi](https://github.com/T0chi))
  - Expand guide/api.md to cover the umbrella plus every subpath export, grouped by
    package. Add the logging API (logger, createLogger, setLogConfig,
    setLogOverrides, levels, colours, raw) to the API and Configuration guides, and
    document the config generator's formatGenerated helper and the Vite and CLI
    programmatic helpers.
### Chores
- Track only the .dbx manifest ([#a254062](https://github.com/deltabox-studio/toolchain/commit/a254062) by [T0chi](https://github.com/T0chi))
  - Ignore everything under .dbx/ except .dbx/toolchain/manifest.json, which records the managed files and holds no absolute paths. The project graph (which embeds the absolute root) stays ignored.
- Stop tracking the generated .dbx directory ([#b7c53f0](https://github.com/deltabox-studio/toolchain/commit/b7c53f0) by [T0chi](https://github.com/T0chi))
  - The managed-file manifest and project graph under .dbx/ are generated state, so ignore them and untrack the two committed files.

### Package changes
#### Added
- `picocolors` `^1.1.1`

## 1.2.8 (October 2026)

### Documentation
- Drive Vite+ from `dbx` in the recommended package scripts ([#6131c59](https://github.com/deltabox-studio/toolchain/commit/6131c59) by [T0chi](https://github.com/T0chi))
  - Use `dbx vite <command>` (the Vite+ passthrough) instead of calling `vp`
    directly in the Package scripts, Migrations and Monorepo guides, so a project
    only needs the one `dbx` command.

## 1.2.7 (October 2026)

### Documentation
- Link package script migrations from the Migrations page ([#036ebf5](https://github.com/deltabox-studio/toolchain/commit/036ebf5) by [T0chi](https://github.com/T0chi))
  - Add a "Package scripts" section to the Migrations guide with the Biome/Turbo
    script swaps and a link to the full Package scripts page.

## 1.2.6 (October 2026)

### Bug fixes
#### Config
- Tidy generated types and format them with Oxfmt ([#6fef440](https://github.com/deltabox-studio/toolchain/commit/6fef440) by [T0chi](https://github.com/T0chi))
  - untyped's type generator emits a blank line between every member and verbose
    multi-line JSDoc. Strip the member blank lines in the generator, then run the
    generated output through Oxfmt's programmatic `format()` (with `jsdoc: true`)
    at generation time instead of shelling out to the repo-root `vp`, so the file
    is written already formatted and resembles the hand-written `types.ts`.
  - Also drop the toolchain-specific `yarn config:types` hint from the generated
    header: the types ship through `@deltabox/toolchain-shared`, so a script name
    that only exists in this repo's package.json is misleading to consumers (a
    consumer supplies its own header via the `header` option).
### Documentation
- Add Package scripts guide and a navbar version ([#b279739](https://github.com/deltabox-studio/toolchain/commit/b279739) by [T0chi](https://github.com/T0chi))
  - Add a guide page covering the recommended root scripts (Vite+ format/lint and
    Vite Task) and how to migrate an existing Biome + Turbo project onto them, and
    surface it in the sidebar and Getting Started list. Also show the current
    version in the navbar (linked to the changelog, releases and npm), like the
    Proxified docs.

## 1.2.5 (October 2026)

### Bug fixes
#### Changelog
- Keep generated commitlint enums expanded ([#a6ad600](https://github.com/deltabox-studio/toolchain/commit/a6ad600) by [T0chi](https://github.com/T0chi))
  - Oxfmt collapses an array onto one line when it fits the print width, so a
    generated `commitlint.config.mjs` whose type/scope enum is short was
    reformatted by `vp fmt` and then failed `dbx sync --check`. An inert leading
    line comment inside each enum keeps the list expanded regardless of the
    consumer's print width, so the generated file is now Oxfmt-idempotent and
    consumers no longer need to exclude it from formatting.

## 1.2.4 (October 2026)

### Documentation
- Update documentation ([#3880aaa](https://github.com/deltabox-studio/toolchain/commit/3880aaa) by [T0chi](https://github.com/T0chi))

## 1.2.3 (October 2026)

### Documentation
- Update vscode extension screenshot ([#e3e189d](https://github.com/deltabox-studio/toolchain/commit/e3e189d) by [T0chi](https://github.com/T0chi))

## 1.2.2 (October 2026)

### Documentation
- Update config generator documentation ([#8305ef8](https://github.com/deltabox-studio/toolchain/commit/8305ef8) by [T0chi](https://github.com/T0chi))

## 1.2.1 (October 2026)

### Documentation
- Show how to load the generated config ([#0f4d0d1](https://github.com/deltabox-studio/toolchain/commit/0f4d0d1) by [T0chi](https://github.com/T0chi))
  - Add a "Load the config at runtime" section to the config generator guide
    (`parseEnvTree`, the typed accessors, `applyOverrides`, and schema validation via
    `compileZodSchema`) plus a short loading example in the README.
- Update description and tags ([#64b64aa](https://github.com/deltabox-studio/toolchain/commit/64b64aa) by [T0chi](https://github.com/T0chi))

## 1.2.0 (October 2026)

### New features
#### Config
- Generate the shared config types via the config generator ([#a063a2d](https://github.com/deltabox-studio/toolchain/commit/a063a2d) by [T0chi](https://github.com/T0chi))
  - Teach the config engine's Zod->untyped bridge and types generator to handle
    unions (anyOf/oneOf), `const`, and unknown records, and to render a schema's
    fields on the main interface when it has no `base` group (plus type aliases for
    non-object roots). Named `$ref`s (via `.meta({ id })`) render as the type name,
    so the generated config types reference each other instead of inlining.
  - Generate `packages/shared/src/config-types.ts` from the Zod config model with the
    engine's `renderConfigTypes` (`yarn config:types`); `config-schema.ts` keeps only
    the schemas and the types are exported from `config-types.ts`.
### Bug fixes
#### Vscode
- Group managed files by project and reorder the views ([#f5b49d9](https://github.com/deltabox-studio/toolchain/commit/f5b49d9) by [T0chi](https://github.com/T0chi))
  - The Managed Files view read a manifest per project, so a monorepo's root-level
    managed files never showed. Read each workspace root's manifest and group its
    files by the deepest project that owns them. Move the Projects view above
    Managed Files (renamed from Files).
### Documentation
- Document the config generator outputs ([#fcfcd69](https://github.com/deltabox-studio/toolchain/commit/fcfcd69) by [T0chi](https://github.com/T0chi))
  - Show a short example of each generated output (config types, markdown, env,
    JSON schema) in the config generator guide and the README.
- Update vscode extension preview ([#fd90dda](https://github.com/deltabox-studio/toolchain/commit/fd90dda) by [T0chi](https://github.com/T0chi))

## 1.1.24 (October 2026)

### Documentation
- Update features ([#071006e](https://github.com/deltabox-studio/toolchain/commit/071006e) by [T0chi](https://github.com/T0chi))

## 1.1.23 (October 2026)

### Documentation
- Using different logo for the hero ([#552172d](https://github.com/deltabox-studio/toolchain/commit/552172d) by [T0chi](https://github.com/T0chi))

## 1.1.22 (October 2026)

### Bug fixes
#### Ci
- Skip the Marketplace publish when VSCE_PAT is unset ([#fe4b3ad](https://github.com/deltabox-studio/toolchain/commit/fe4b3ad) by [T0chi](https://github.com/T0chi))
  - The VS Code Marketplace publish was the only failing release step (no
    VSCE_PAT set). Make it a no-op while the secret is unset and publish
    automatically once it is added to the `toolchain / release` environment.
  - Also remove the temporary OIDC diagnostic step now that the release publishes.

## 1.1.21 (October 2026)

### Bug fixes
#### Ci
- Publish to npm directly, falling back to a staged publish ([#85cffe7](https://github.com/deltabox-studio/toolchain/commit/85cffe7) by [T0chi](https://github.com/T0chi))
  - Try `npm publish` first and fall back to `npm stage publish` on failure, so
    toggling the trusted publisher's publish/stage permissions on npm never breaks
    the release: a direct publish succeeds when allowed, and a staged publish (always
    permitted) is used otherwise.
### Documentation
- Show the published npm version in the README badge ([#5f83ca2](https://github.com/deltabox-studio/toolchain/commit/5f83ca2) by [T0chi](https://github.com/T0chi))
  - Replace the static npm-name badge with a shields.io npm/v badge so the README
    shows the currently published version.

## 1.1.20 (October 2026)

### Bug fixes
#### Ci
- Stage npm releases via OIDC instead of publishing directly ([#53d1f52](https://github.com/deltabox-studio/toolchain/commit/53d1f52) by [T0chi](https://github.com/T0chi))
  - Default to `npm stage publish` for OIDC trusted publishing: it always stages
    the version and defers the maintainer's 2FA approval, and is always permitted
    for a trusted publisher (unlike direct `npm publish`, which the package's 2FA
    policy rejects). Drop the automation-token fallback and require npm >= 11.15.1
    (the first with `npm stage`).

## 1.1.19 (October 2026)

### Chores
#### Ci
- Add a temporary OIDC diagnostic to the release workflow ([#7b42e33](https://github.com/deltabox-studio/toolchain/commit/7b42e33) by [T0chi](https://github.com/T0chi))
  - The publish still fails after binding the environment, and npm falls back to
    the (automation) token and 403s. Add a temporary step that decodes the OIDC
    claims and calls the token-exchange endpoint directly so the exact
    trusted-publisher mismatch is visible in the log. Removed once fixed.

## 1.1.18 (October 2026)

### Bug fixes
#### Ci
- Bind the release job to the OIDC environment ([#7b8f1b4](https://github.com/deltabox-studio/toolchain/commit/7b8f1b4) by [T0chi](https://github.com/T0chi))
  - The npm OIDC trusted publisher is bound to the GitHub environment
    "toolchain / release", but the release job declared no environment. The OIDC
    environment claim therefore did not match, the token exchange failed, and npm
    silently fell back to the placeholder token (the misleading E404).
  - Declare `environment: 'toolchain / release'` on the job and add an optional
    NODE_AUTH_TOKEN fallback (the environment's NPM_TOKEN) to the publish step.
    OIDC is still tried first, so the token is never relied on.
#### Vscode
- Spawn the CLI safely on Windows ([#99e3ad1](https://github.com/deltabox-studio/toolchain/commit/99e3ad1) by [T0chi](https://github.com/T0chi))
  - `spawn('npx.cmd', ...)` throws EINVAL synchronously on Windows, and
    `captureCli`/`runCli` call spawn inside a Promise executor, so the throw
    rejected the promise and the command aborted with no UI ("nothing happens").
    This fired whenever the CLI resolved to the npx.cmd fallback (a workspace
    without a local @deltabox/toolchain), e.g. "From template..." which round-trips
    template:list --json through captureCli.
  - Add a pure win-spawn module (ported from the shared spawnCross) that escapes
    the command + args and runs a .cmd shim through cmd.exe; use it from spawnCli.
    captureCli/runCli no longer reject on a spawn failure. Also fix cliInvocation
    for the integrated terminal: process.execPath is the VS Code binary in the
    extension host, so it now uses `npx dbx` / `npx --yes @deltabox/toolchain`.

## 1.1.17 (October 2026)

### Bug fixes
#### Ci
- Upgrade npm before publishing for OIDC trusted publishing ([#657d4b9](https://github.com/deltabox-studio/toolchain/commit/657d4b9) by [T0chi](https://github.com/T0chi))
  - Node 22 bundles npm 10.x, but npm OIDC trusted publishing requires
    npm >= 11.5.1. Without it `npm publish` fell back to token auth and the
    registry answered a misleading 404, so every release since 1.0.7 failed
    at the publish step. Add an explicit npm upgrade step before the publish
    step in the generated release workflow.

## 1.1.16 (October 2026)

### Documentation
- Reindent the README table of contents ([#5646bcc](https://github.com/deltabox-studio/toolchain/commit/5646bcc) by [T0chi](https://github.com/T0chi))
- Theme-aware logo (light/dark) + invert the home hero logo in dark mode ([#fd3691f](https://github.com/deltabox-studio/toolchain/commit/fd3691f) by [T0chi](https://github.com/T0chi))

## 1.1.15 (October 2026)

### Chores
- Formatted README.md ([#4485c48](https://github.com/deltabox-studio/toolchain/commit/4485c48) by [T0chi](https://github.com/T0chi))

## 1.1.14 (October 2026)

### Documentation
- Highlight the Vite/Vite+ plugin in the README and docs ([#8218179](https://github.com/deltabox-studio/toolchain/issues/8218179) by [T0chi](https://github.com/T0chi))

## 1.1.13 (October 2026)

### Chores
- Re-enable npm provenance (repo is public) ([#71ed60d](https://github.com/deltabox-studio/toolchain/commit/71ed60d) by [T0chi](https://github.com/T0chi))

## 1.1.12 (October 2026)

### Chores
- Disable npm provenance (unsupported from a private repo) ([#f118193](https://github.com/deltabox-studio/toolchain/commit/f118193) by [T0chi](https://github.com/T0chi))

## 1.1.11 (October 2026)

### Documentation
- Drop backticks from the landing feature cards ([#9d6ed28](https://github.com/deltabox-studio/toolchain/commit/9d6ed28) by [T0chi](https://github.com/T0chi))
- Use currentColor for the logo so it shows on light mode ([#907a07e](https://github.com/deltabox-studio/toolchain/commit/907a07e) by [T0chi](https://github.com/T0chi))
- Fix README formatting ([#2dc01d4](https://github.com/deltabox-studio/toolchain/commit/2dc01d4) by [T0chi](https://github.com/T0chi))
- Make the logo black in light mode (white in dark) ([#c6d9410](https://github.com/deltabox-studio/toolchain/commit/c6d9410) by [T0chi](https://github.com/T0chi))
### CI
- Auto-fix format + lint in the CI check step ([#9da9797](https://github.com/deltabox-studio/toolchain/commit/9da9797) by [T0chi](https://github.com/T0chi))

## 1.1.10 (October 2026)

### Chores
- Removed unnecessary shields ([#1efbe68](https://github.com/deltabox-studio/toolchain/commit/1efbe68) by [T0chi](https://github.com/T0chi))

## 1.1.9 (October 2026)

### Documentation
- Reindent the README lists ([#1d41d68](https://github.com/deltabox-studio/toolchain/commit/1d41d68) by [T0chi](https://github.com/T0chi))
- Mirror the VS Code extension installation guide from the README ([#1889832](https://github.com/deltabox-studio/toolchain/issues/1889832) by [T0chi](https://github.com/T0chi))
### Chores
- Update VS Code extension installation guide in README.md ([#aab06d5](https://github.com/deltabox-studio/toolchain/commit/aab06d5) by [T0chi](https://github.com/T0chi))

## 1.1.8 (October 2026)

### Documentation
- Hide the site title next to the navbar logo ([#c7935ec](https://github.com/deltabox-studio/toolchain/commit/c7935ec) by [T0chi](https://github.com/T0chi))

## 1.1.7 (October 2026)

### Chores
- Revise CLI commands and VS Code extension details ([#7f043f9](https://github.com/deltabox-studio/toolchain/commit/7f043f9) by [T0chi](https://github.com/T0chi))

## 1.1.6 (October 2026)

### Documentation
- Use box2d.svg for the navbar/hero logo and box2d_bg.svg for the favicon ([#2c7a094](https://github.com/deltabox-studio/toolchain/commit/2c7a094) by [T0chi](https://github.com/T0chi))

## 1.1.5 (October 2026)

### Bug fixes
#### Changelog
- Bump only the version field and stage only owned files ([#8b14cc9](https://github.com/deltabox-studio/toolchain/commit/8b14cc9) by [T0chi](https://github.com/T0chi))

## 1.1.4 (October 2026)

### Documentation
- Trim the README and refresh the docs/license sections ([#a20deb5](https://github.com/deltabox-studio/toolchain/commit/a20deb5) by [T0chi](https://github.com/T0chi))
### Chores
- Name the changelog and tsconfig bins explicitly ([#50144cd](https://github.com/deltabox-studio/toolchain/commit/50144cd) by [T0chi](https://github.com/T0chi))

## 1.1.3 (October 2026)

### Chores
#### Changelog
- Title the CI section "CI" instead of "Continuous integration" ([#09deb7f](https://github.com/deltabox-studio/toolchain/commit/09deb7f) by [T0chi](https://github.com/T0chi))

## 1.1.2 (October 2026)

### Documentation
- Add a tests badge to the README ([#01513ee](https://github.com/deltabox-studio/toolchain/commit/01513ee) by [T0chi](https://github.com/T0chi))
- Fix CHANGELOG.md mojibake and add backticks to code refs ([#6b721eb](https://github.com/deltabox-studio/toolchain/commit/6b721eb) by [T0chi](https://github.com/T0chi))

## 1.1.1 (October 2026)

### Documentation

- Publish `config.schema.json` at the docs site root ([#b7680cb](https://github.com/deltabox-studio/toolchain/commit/b7680cb) by [T0chi](https://github.com/T0chi))
    - The VitePress build now copies the generated dbx JSON schema into the dist
      root, so it is served at https://toolchain.deltabox.studio/config.schema.json.

### CI

#### Release

- Publish to npm via trusted publishing (OIDC) ([#41be869](https://github.com/deltabox-studio/toolchain/commit/41be869) by [T0chi](https://github.com/T0chi))
    - Drop the `NPM_TOKEN`-based `yarn npm publish` (which also staged). Use npm
      trusted publishing: `id-token: write`, setup-node `registry-url`, `yarn pack`
      (resolves `catalog:`/`workspace:`) + `npm publish <tarball>` — provenance is
      generated automatically. Re-enable `publishConfig.provenance`.

## 1.1.0 (October 2026)

### New features

#### Vite

- Add a `dbx()` Vite+ plugin and `defineDbxConfig` wrapper ([#a1edaf9](https://github.com/deltabox-studio/toolchain/commit/a1edaf9) by [T0chi](https://github.com/T0chi))
    - Lets Vite+-only consumers drive dbx from `vite.config.ts`: `dbx()` runs
      `dbx sync` before dev/build (or `dbx sync --check` in CI) and re-syncs on
      input changes; `defineDbxConfig()` also registers the `vp run dbx:*` tasks
      (Vite+ reads `run.tasks` from the static config, not a plugin hook).

### Chores

- Name the `changelog`/`tsconfig` bins explicitly ([#94c6c17](https://github.com/deltabox-studio/toolchain/commit/94c6c17) by [T0chi](https://github.com/T0chi))

### Package changes

#### Updated

- `vite` `^8.3.0` → `>=5`

## 1.0.8 (October 2026)

### CI

#### Release

- Manage the release workflow from `dbx.config.ts` ([#bf55b70](https://github.com/deltabox-studio/toolchain/commit/bf55b70) by [T0chi](https://github.com/T0chi))
    - Drop the hand-written `.github/workflows/release.yml`; the release flow (tag +
      GitHub Release with the VSIX + notes, `npm publish`, Marketplace publish) is
      now defined under `changelog.workflows.release` in the config and generated
      by `dbx sync`. Removes the need to hand-write CI.

## 1.0.7 (October 2026)

### Bug fixes

#### Vscode

- Package the VSIX without `vp`; ignore `vite.config.ts`; untrack `*.vsix` ([#9d1e403](https://github.com/deltabox-studio/toolchain/commit/9d1e403) by [T0chi](https://github.com/T0chi))

### CI

#### Release

- Release on push to `main` (tag + GitHub Release + npm + Marketplace) ([#4714b1a](https://github.com/deltabox-studio/toolchain/commit/4714b1a) by [T0chi](https://github.com/T0chi))
    - Replaces the generated release-PR workflow with a hand-written one that, on
      each push to `main`, packages the VS Code extension, creates the `v<version>`
      tag and a GitHub Release (notes from `CHANGELOG.md` + the `.vsix` asset),
      publishes `@deltabox/toolchain` to npm, and publishes the extension to the VS
      Code Marketplace. Idempotent: skipped when the tag already exists.

## 1.0.6 (October 2026)

### Documentation

- Add GitHub social links to the navbar and footer ([#2925f1a](https://github.com/deltabox-studio/toolchain/commit/2925f1a) by [T0chi](https://github.com/T0chi))

### Chores

- Name the `changelog`/`tsconfig` bins explicitly and disable publish provenance ([#ba2737d](https://github.com/deltabox-studio/toolchain/commit/ba2737d) by [T0chi](https://github.com/T0chi))

## 1.0.5 (October 2026)

### Documentation

- Update tagline ([#e1fa86e](https://github.com/deltabox-studio/toolchain/commit/e1fa86e) by [T0chi](https://github.com/T0chi))

## 1.0.4 (October 2026)

### Documentation

- Add a table of contents to the `README` ([#b2702e8](https://github.com/deltabox-studio/toolchain/commit/b2702e8) by [T0chi](https://github.com/T0chi))

### Chores

- Fix grammar in the package description ([#8a199b8](https://github.com/deltabox-studio/toolchain/commit/8a199b8) by [T0chi](https://github.com/T0chi))

## 1.0.3 (October 2026)

### Documentation

- Highlight the config generator and link `toolchain.deltabox.studio` ([#836cd36](https://github.com/deltabox-studio/toolchain/commit/836cd36) by [T0chi](https://github.com/T0chi))

### Chores

- Exclude `CHANGELOG.md` from Oxfmt (the changelog pipeline owns its format) ([#f6ad3c0](https://github.com/deltabox-studio/toolchain/commit/f6ad3c0) by [T0chi](https://github.com/T0chi))
- Add MPL-2.0 `LICENSE` and the project homepage ([#cea0fb5](https://github.com/deltabox-studio/toolchain/commit/cea0fb5) by [T0chi](https://github.com/T0chi))

## 1.0.2 (October 2026)

### Tests

#### Changelog

- Update the release workflow reference fixture ([#e7efe0a](https://github.com/deltabox-studio/toolchain/commit/e7efe0a) by [T0chi](https://github.com/T0chi))

## 1.0.1 (October 2026)

### Bug fixes

#### Changelog

- Tolerate a missing `CHANGELOG.md` in the release workflow ([#18ad219](https://github.com/deltabox-studio/toolchain/commit/18ad219) by [T0chi](https://github.com/T0chi))
    - The release PR job extracted notes with `awk`, which failed when
      `CHANGELOG.md` did not exist yet (a fresh repo). Fall back to an empty notes
      string.
- Create `CHANGELOG.md` when missing; ignore dry-run output ([#f5e4926](https://github.com/deltabox-studio/toolchain/commit/f5e4926) by [T0chi](https://github.com/T0chi))
    - `prependChangelogEntry` read the existing file unconditionally, so the first
      run on a repo without a `CHANGELOG.md` failed with `ENOENT`. Seed it with a
      `# Changelog` header instead. Also gitignore `CHANGELOG.proposed.md`.
- Resolve repo root from `cwd` instead of the module location ([#5278e57](https://github.com/deltabox-studio/toolchain/commit/5278e57) by [T0chi](https://github.com/T0chi))
    - Running `dbx changelog` from source (or from the published package in
      `node_modules`) walked up from `import.meta.url` and landed on the wrong
      `package.json`, so it looked for `CHANGELOG.md` in the wrong directory and
      failed. Resolve the nearest `package.json` above the working directory
      instead.

### Chores

- Add extension keyword ([#99721f3](https://github.com/deltabox-studio/toolchain/commit/99721f3) by [T0chi](https://github.com/T0chi))
- Drop Netlify config (docs move to Railway); move `PLAN.md` out of the repo ([#e51b714](https://github.com/deltabox-studio/toolchain/commit/e51b714) by [T0chi](https://github.com/T0chi))
- Update package description and keywords ([#d75b503](https://github.com/deltabox-studio/toolchain/commit/d75b503) by [T0chi](https://github.com/T0chi))
- Initial commit of `@deltabox/toolchain` ([#ed4673b](https://github.com/deltabox-studio/toolchain/commit/ed4673b) by [T0chi](https://github.com/T0chi))
    - Self-hosts CI + changelog: `dbx.config.ts` drives the generated workflows,
      commitlint config and Conventional-Commits VS Code settings. Config file is
      `dbx.config.*` with sections wrapped under `toolchain`.
