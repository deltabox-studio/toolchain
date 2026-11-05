# Changelog

## 2.3.2 (November 2026)

<!-- release:start -->

### Bug fixes
#### Vscode
- Load the tsdown base config from source ([#0537c62](https://github.com/deltabox-studio/toolchain/commit/0537c62) by [T0chi](https://github.com/T0chi))
  - The VS Code integration job builds the extension after only \yarn install\, so the private \@deltabox/toolchain-tsdown\ dist does not exist and unrun failed to load the config. Import baseTsdownConfig\ from the workspace source instead (as the root tsdown config already does).

<!-- release:end -->


## 2.3.1 (November 2026)

### Bug fixes
#### Vscode
- Validate webview messages and use a secure nonce ([#94bed68](https://github.com/deltabox-studio/toolchain/commit/94bed68) by [T0chi](https://github.com/T0chi))
  - The Home webview handler trusted the incoming shape and acted on arbitrary project paths, and the CSP nonce came from Math.random. Validate every message, only act on projects the dashboard listed, and generate the nonce from crypto.randomBytes.
#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))
  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.
#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))
  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.

## 2.3.0 (November 2026)

### New features
#### Vscode
- Show the workflow provider in the run picker ([#af4cc3f](https://github.com/deltabox-studio/toolchain/commit/af4cc3f) by [T0chi](https://github.com/T0chi))
### Bug fixes
#### Vscode
- Prefer CLI descriptors and sync all workspace roots ([#e68301a](https://github.com/deltabox-studio/toolchain/commit/e68301a) by [T0chi](https://github.com/T0chi))
- Report signal and timeout exits as failures ([#b7b1ad5](https://github.com/deltabox-studio/toolchain/commit/b7b1ad5) by [T0chi](https://github.com/T0chi))
### Documentation
- Document vendor workflows, typed builders and `--format-only` ([#eb66982](https://github.com/deltabox-studio/toolchain/commit/eb66982) by [T0chi](https://github.com/T0chi))
### Chores
#### Vscode
- Move mocha types to the default tsconfig ([#b604811](https://github.com/deltabox-studio/toolchain/commit/b604811) by [T0chi](https://github.com/T0chi))
