# Changelog

## 3.0.0-beta.3 (November 2026)

<!-- release:start -->

<details>
<summary>New features</summary>

#### Shared
- Add typed CLI command descriptors ([#afbb10b](https://github.com/deltabox-studio/toolchain/commit/afbb10b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Replace the loose ToolchainCommand interfaces with generic CliCommand types that infer option values from the flags list, and add defineCliCommand for literal inference. Migrate the package command factories and tests, and rename the reset options type accordingly.

  </details>

</details>

<details>
<summary>Refactors</summary>

- Normalize default JSDoc annotations ([#04f47e8](https://github.com/deltabox-studio/toolchain/commit/04f47e8) by [T0chi](https://github.com/T0chi))

#### Mcp
- Export public types explicitly ([#b78d810](https://github.com/deltabox-studio/toolchain/commit/b78d810) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


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

#### Cli
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

#### Mcp
- Add the MCP server, installers and `dbx mcp:*` commands ([#0553843](https://github.com/deltabox-studio/toolchain/commit/0553843) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Mcp
- Preserve JSONC configs and resolve relative roots ([#46ad6cf](https://github.com/deltabox-studio/toolchain/commit/46ad6cf) by [T0chi](https://github.com/T0chi))
- Preserve JSONC configs, tool flags and stdio ([#446249a](https://github.com/deltabox-studio/toolchain/commit/446249a) by [T0chi](https://github.com/T0chi))
- Use the supported tsconfig print flag ([#473738c](https://github.com/deltabox-studio/toolchain/commit/473738c) by [T0chi](https://github.com/T0chi))
- Advertise the real version and load installed skills ([#1827bc2](https://github.com/deltabox-studio/toolchain/commit/1827bc2) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Split package typings into `src/types` barrels ([#45e5032](https://github.com/deltabox-studio/toolchain/commit/45e5032) by [T0chi](https://github.com/T0chi))

</details>
