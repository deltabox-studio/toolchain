# Changelog

## 1.0.4 (October 2026)

<!-- release:start -->

### Documentation
- Add a table of contents to the README ([#b2702e8](https://github.com/deltabox-studio/toolchain/commit/b2702e8) by [T0chi](https://github.com/T0chi))
### Chores
- Fix grammar in the package description ([#8a199b8](https://github.com/deltabox-studio/toolchain/commit/8a199b8) by [T0chi](https://github.com/T0chi))

<!-- release:end -->


## 1.0.3 (October 2026)

### Documentation
- Highlight the config generator and link toolchain.deltabox.studio ([#836cd36](https://github.com/deltabox-studio/toolchain/commit/836cd36) by [T0chi](https://github.com/T0chi))
### Chores
- Exclude CHANGELOG.md from Oxfmt (the changelog pipeline owns its format) ([#f6ad3c0](https://github.com/deltabox-studio/toolchain/commit/f6ad3c0) by [T0chi](https://github.com/T0chi))
- Add MPL-2.0 LICENSE and the project homepage ([#cea0fb5](https://github.com/deltabox-studio/toolchain/commit/cea0fb5) by [T0chi](https://github.com/T0chi))

## 1.0.2 (October 2026)

### Tests
#### Changelog
- Update the release workflow reference fixture ([#e7efe0a](https://github.com/deltabox-studio/toolchain/commit/e7efe0a) by [T0chi](https://github.com/T0chi))

## 1.0.1 (October 2026)

### Bug fixes
#### Changelog
- Tolerate a missing CHANGELOG.md in the release workflow ([#18ad219](https://github.com/deltabox-studio/toolchain/commit/18ad219) by [T0chi](https://github.com/T0chi))
  - The release PR job extracted notes with awk, which failed when CHANGELOG.md
    did not exist yet (a fresh repo). Fall back to an empty notes string.
- Create CHANGELOG.md when missing; ignore dry-run output ([#f5e4926](https://github.com/deltabox-studio/toolchain/commit/f5e4926) by [T0chi](https://github.com/T0chi))
  - prependChangelogEntry read the existing file unconditionally, so the first
    run on a repo without a CHANGELOG.md failed with ENOENT. Seed it with a
    '# Changelog' header instead. Also gitignore CHANGELOG.proposed.md.
- Resolve repo root from cwd instead of the module location ([#5278e57](https://github.com/deltabox-studio/toolchain/commit/5278e57) by [T0chi](https://github.com/T0chi))
  - Running dbx changelog from source (or from the published package in
    node_modules) walked up from import.meta.url and landed on the wrong
    package.json, so it looked for CHANGELOG.md in the wrong directory and
    failed. Resolve the nearest package.json above the working directory instead.
### Chores
- Add extension keyword ([#99721f3](https://github.com/deltabox-studio/toolchain/commit/99721f3) by [T0chi](https://github.com/T0chi))
- Drop Netlify config (docs move to Railway); move PLAN.md out of the repo ([#e51b714](https://github.com/deltabox-studio/toolchain/commit/e51b714) by [T0chi](https://github.com/T0chi))
- Update package description and keywords ([#d75b503](https://github.com/deltabox-studio/toolchain/commit/d75b503) by [T0chi](https://github.com/T0chi))
- Initial commit of @deltabox/toolchain ([#ed4673b](https://github.com/deltabox-studio/toolchain/commit/ed4673b) by [T0chi](https://github.com/T0chi))
  - Self-hosts CI + changelog: dbx.config.ts drives the generated workflows,
    commitlint config and Conventional-Commits VS Code settings. Config file is
    dbx.config.* with sections wrapped under 	oolchain.
