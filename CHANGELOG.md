# Changelog

## 1.1.15 (October 2026)

<!-- release:start -->

### Chores
- Formatted README.md ([#4485c48](https://github.com/deltabox-studio/toolchain/commit/4485c48) by [T0chi](https://github.com/T0chi))

<!-- release:end -->


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
