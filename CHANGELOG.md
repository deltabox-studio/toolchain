# Changelog

## 1.2.8 (October 2026)

<!-- release:start -->

### Documentation
- Drive Vite+ from `dbx` in the recommended package scripts ([#6131c59](https://github.com/deltabox-studio/toolchain/commit/6131c59) by [T0chi](https://github.com/T0chi))
  - Use `dbx vite <command>` (the Vite+ passthrough) instead of calling `vp`
    directly in the Package scripts, Migrations and Monorepo guides, so a project
    only needs the one `dbx` command.

<!-- release:end -->


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
