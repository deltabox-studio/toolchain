# Changelog

## 2.3.1 (November 2026)

<!-- release:start -->

### Bug fixes
#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))
  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.
#### Changelog
- Keep hash links when git history is incomplete ([#182b68a](https://github.com/deltabox-studio/toolchain/commit/182b68a) by [T0chi](https://github.com/T0chi))
  - A shallow clone or no-git checkout cannot resolve every referenced commit, so valid hashes were left unlinked. Fall back to treating letter-containing refs as commits when history is incomplete, and mock the numeric-hash fixture so the tests do not depend on the checkout's history.
#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))
  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.

<!-- release:end -->


## 2.3.0 (November 2026)

### New features
#### Changelog
- Dispatch workflows with their vendor CLI ([#eea38ae](https://github.com/deltabox-studio/toolchain/commit/eea38ae) by [T0chi](https://github.com/T0chi))
#### Config
- Accept complete GitHub, GitLab and Azure workflows ([#070a7f2](https://github.com/deltabox-studio/toolchain/commit/070a7f2) by [T0chi](https://github.com/T0chi))
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Changelog
- Fix workflow staging, `commitlint` and YAML escaping ([#1bb19ad](https://github.com/deltabox-studio/toolchain/commit/1bb19ad) by [T0chi](https://github.com/T0chi))
- Preserve formatting, links and workspace history ([#af5c5dc](https://github.com/deltabox-studio/toolchain/commit/af5c5dc) by [T0chi](https://github.com/T0chi))
- Restore the standalone bin and `--dry-run` handling ([#97ecef2](https://github.com/deltabox-studio/toolchain/commit/97ecef2) by [T0chi](https://github.com/T0chi))
- Preserve hand-corrected text in `--format-only` ([#2041e5f](https://github.com/deltabox-studio/toolchain/commit/2041e5f) by [T0chi](https://github.com/T0chi))
- Resolve hash links and preserve descriptions ([#7633d24](https://github.com/deltabox-studio/toolchain/commit/7633d24) by [T0chi](https://github.com/T0chi))
- Keep numeric hashes as commits and bold breaking markers ([#0521aee](https://github.com/deltabox-studio/toolchain/commit/0521aee) by [T0chi](https://github.com/T0chi))
- Unwrap descriptions and keep list items ([#0dc4bda](https://github.com/deltabox-studio/toolchain/commit/0dc4bda) by [T0chi](https://github.com/T0chi))
