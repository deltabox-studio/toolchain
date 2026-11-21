# Changelog

## 3.0.0-beta.14 (November 2026)

<!-- release:start -->

<details>
<summary>Bug fixes</summary>

#### Config
- Preserve markdown key narrowing with typed options ([#0cd420a](https://github.com/deltabox-studio/toolchain/commit/0cd420a) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.13 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Cli
- Replace commander with the config program ([#b515346](https://github.com/deltabox-studio/toolchain/commit/b515346) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Build the dbx CLI from createConfigProgram, wire schema-derived sync/watch flags through the root engine, and move context loading/framing into withCliContext. Remove commander from the dependency tree and update the root CLI tests for the engine runtime's invoke/help APIs.

  </details>

</details>

<details>
<summary>New features</summary>

#### Config
- Complete typed CLI program runtime and generator hooks ([#9dfb665](https://github.com/deltabox-studio/toolchain/commit/9dfb665) by [T0chi](https://github.com/T0chi))
- Generate CLI programs from config schemas ([#29808e9](https://github.com/deltabox-studio/toolchain/commit/29808e9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a config-engine program runtime with typed command chains, subcommands, global option inheritance, help formatting and output routing. Generate options and programs from schema metadata (cli/cliCommand), support array/variadic flags and custom parsers, and split the CLI types into their own modules. Annotate the shared schemas with the CLI-specific flags they map to.

  </details>

- Add source-specific config loaders ([#bf1fef0](https://github.com/deltabox-studio/toolchain/commit/bf1fef0) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add file/env/CLI loader variants plus base-value merging so file values are overridden by env and argv without schema defaults replacing them. Support multi-source selections, neutral config.* discovery names, and envExpose metadata for CLI-only values.

  </details>

- Add scoped CLI generation and reorganize types ([#bfefaa4](https://github.com/deltabox-studio/toolchain/commit/bfefaa4) by [T0chi](https://github.com/T0chi))

#### Shared
- Add typed CLI command descriptors ([#afbb10b](https://github.com/deltabox-studio/toolchain/commit/afbb10b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Replace the loose ToolchainCommand interfaces with generic CliCommand types that infer option values from the flags list, and add defineCliCommand for literal inference. Migrate the package command factories and tests, and rename the reset options type accordingly.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Changelog
- Build release bodies from markers and rename flags ([#825985d](https://github.com/deltabox-studio/toolchain/commit/825985d) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Normalize default JSDoc annotations ([#04f47e8](https://github.com/deltabox-studio/toolchain/commit/04f47e8) by [T0chi](https://github.com/T0chi))

#### Config
- Narrow explicit program command scopes ([#e910d0f](https://github.com/deltabox-studio/toolchain/commit/e910d0f) by [T0chi](https://github.com/T0chi))

#### Vscode
- Sanitize registry paths for display ([#a1e8d56](https://github.com/deltabox-studio/toolchain/commit/a1e8d56) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Render registry paths relative to the workspace (and without control characters) in the tree, picker and confirmation prompts, and cover the shared helper plus registry tree with tests.

  </details>

#### Tsconfig
- Split resolution and derive flags from schema ([#4d1d784](https://github.com/deltabox-studio/toolchain/commit/4d1d784) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Break the tsconfig resolver into focused modules and generate the tsconfig command's config-backed flags from the config engine. Runtime-only auto switches stay explicit, while aliases, refs, indentation, globs and gitignore now inherit config/env/CLI precedence from the schema.

  </details>

#### Mcp
- Export public types explicitly ([#b78d810](https://github.com/deltabox-studio/toolchain/commit/b78d810) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Refresh llms bundle ([#d988259](https://github.com/deltabox-studio/toolchain/commit/d988259) by [T0chi](https://github.com/T0chi))
- Prefer engine.cli.program.create and update v3 guides ([#325d2fd](https://github.com/deltabox-studio/toolchain/commit/325d2fd) by [T0chi](https://github.com/T0chi))
- Cover template structures and config CLI programs ([#8d5e2c5](https://github.com/deltabox-studio/toolchain/commit/8d5e2c5) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Document folder-tree template structures, the config-engine program/command APIs, schema-driven CLI metadata, and the new source-specific loaders. Refresh generated CLI/config pages and the llms bundles.

  </details>

- Refresh generated llms bundles ([#b4f29e6](https://github.com/deltabox-studio/toolchain/commit/b4f29e6) by [T0chi](https://github.com/T0chi))
- Document static config types in the overview ([#fd00295](https://github.com/deltabox-studio/toolchain/commit/fd00295) by [T0chi](https://github.com/T0chi))
- Expand the v2 to v3 migration guide ([#854baaf](https://github.com/deltabox-studio/toolchain/commit/854baaf) by [T0chi](https://github.com/T0chi))
- Revamp the config generator guides ([#f54c5f1](https://github.com/deltabox-studio/toolchain/commit/f54c5f1) by [T0chi](https://github.com/T0chi))
- Add client and server config guide ([#5dcbedc](https://github.com/deltabox-studio/toolchain/commit/5dcbedc) by [T0chi](https://github.com/T0chi))

#### Config
- Regenerate schema and reference artifacts ([#2f0b6af](https://github.com/deltabox-studio/toolchain/commit/2f0b6af) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Styles</summary>

- Format generated config artifacts and docs ([#2ff28be](https://github.com/deltabox-studio/toolchain/commit/2ff28be) by [T0chi](https://github.com/T0chi))
- Replace unicode ellipses with three dots ([#2d7c130](https://github.com/deltabox-studio/toolchain/commit/2d7c130) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Build system</summary>

- Split config generator scripts ([#2322fa6](https://github.com/deltabox-studio/toolchain/commit/2322fa6) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Added
- `@deltabox/toolchain-docs`
  - `vitepress-plugin-folder-tree` `1.2.1`
- `@deltabox/toolchain-tsconfig`
  - `@deltabox/toolchain-config` `workspace:*`

#### Removed
- `@deltabox/toolchain`
  - `commander` `^14.0.0`

## 3.0.0-beta.12 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Release
- Publish prereleases with an npm dist-tag ([#ebc3574](https://github.com/deltabox-studio/toolchain/commit/ebc3574) by [T0chi](https://github.com/T0chi))

#### Changelog
- Roll prereleases over to their stable core ([#c27bbb5](https://github.com/deltabox-studio/toolchain/commit/c27bbb5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Streamline the README introduction ([#8076c13](https://github.com/deltabox-studio/toolchain/commit/8076c13) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.11 (November 2026)

<details>
<summary>Documentation</summary>

- Refresh the generated llms bundles ([#47a0c34](https://github.com/deltabox-studio/toolchain/commit/47a0c34) by [T0chi](https://github.com/T0chi))
- Update the Vite plugin README ([#7adb895](https://github.com/deltabox-studio/toolchain/commit/7adb895) by [T0chi](https://github.com/T0chi))
- Add Contribute to the docs navigation ([#c7a32e4](https://github.com/deltabox-studio/toolchain/commit/c7a32e4) by [T0chi](https://github.com/T0chi))
- Add the contribute guide ([#17c62df](https://github.com/deltabox-studio/toolchain/commit/17c62df) by [T0chi](https://github.com/T0chi))
- Update migration guide links ([#b58b9fb](https://github.com/deltabox-studio/toolchain/commit/b58b9fb) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>CI</summary>

#### Vscode
- Publish pre-release extensions from Azure ([#ce29c2f](https://github.com/deltabox-studio/toolchain/commit/ce29c2f) by [T0chi](https://github.com/T0chi))

#### Release
- Support pre-release VS Code extensions ([#6e4910e](https://github.com/deltabox-studio/toolchain/commit/6e4910e) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Revert to `beta` versioning ([#cfcd8f3](https://github.com/deltabox-studio/toolchain/commit/cfcd8f3) by [T0chi](https://github.com/T0chi))
- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))
- Sync the workspace metadata ([#1104d1b](https://github.com/deltabox-studio/toolchain/commit/1104d1b) by [T0chi](https://github.com/T0chi))
- Sync the root package metadata ([#aec39e5](https://github.com/deltabox-studio/toolchain/commit/aec39e5) by [T0chi](https://github.com/T0chi))
- Sync the Vite package metadata ([#459670b](https://github.com/deltabox-studio/toolchain/commit/459670b) by [T0chi](https://github.com/T0chi))
- Update the package keywords ([#8554023](https://github.com/deltabox-studio/toolchain/commit/8554023) by [T0chi](https://github.com/T0chi))
- Use the oxc keyword ([#aa24a65](https://github.com/deltabox-studio/toolchain/commit/aa24a65) by [T0chi](https://github.com/T0chi))
- Add the checkout bootstrap script ([#d49b378](https://github.com/deltabox-studio/toolchain/commit/d49b378) by [T0chi](https://github.com/T0chi))
- Remove prerelease tag ([#c75bb61](https://github.com/deltabox-studio/toolchain/commit/c75bb61) by [T0chi](https://github.com/T0chi))

#### Vscode
- Add the pre-release VSIX script ([#385fa01](https://github.com/deltabox-studio/toolchain/commit/385fa01) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.10 (November 2026)

<details>
<summary>Documentation</summary>

- Refresh the generated llms bundles ([#dcf052b](https://github.com/deltabox-studio/toolchain/commit/dcf052b) by [T0chi](https://github.com/T0chi))
- Reorder the README introduction ([#df3b5b0](https://github.com/deltabox-studio/toolchain/commit/df3b5b0) by [T0chi](https://github.com/T0chi))
- Reorganize the documentation navigation ([#342de5a](https://github.com/deltabox-studio/toolchain/commit/342de5a) by [T0chi](https://github.com/T0chi))
- Document the Vite plugin and Vite+ commands ([#95c1e66](https://github.com/deltabox-studio/toolchain/commit/95c1e66) by [T0chi](https://github.com/T0chi))
- Expand the v3 migration guide ([#9a6d0d0](https://github.com/deltabox-studio/toolchain/commit/9a6d0d0) by [T0chi](https://github.com/T0chi))

#### Vscode
- Sync the extension reference ([#9824034](https://github.com/deltabox-studio/toolchain/commit/9824034) by [T0chi](https://github.com/T0chi))

#### Config
- Revamp the configuration overview ([#fe4137e](https://github.com/deltabox-studio/toolchain/commit/fe4137e) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.9 (November 2026)

<details>
<summary>Documentation</summary>

- Refresh the generated llms bundle ([#e3beaac](https://github.com/deltabox-studio/toolchain/commit/e3beaac) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Ci
- Bump setup-vp to v1.22.0 ([#9c32cae](https://github.com/deltabox-studio/toolchain/commit/9c32cae) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.8 (November 2026)

<details>
<summary>Chores</summary>

#### Deps
- Bump the minor-and-patch group across 1 directory with 59 updates ([#45](https://github.com/deltabox-studio/toolchain/issues/45)) ([#1c2276c](https://github.com/deltabox-studio/toolchain/commit/1c2276c) by [dependabot[bot]](https://github.com/dependabot[bot]))

  <details>
  <summary><strong>See more...</strong></summary>

  - chore(deps): bump the minor-and-patch group across 1 directory with 59 updates
    - Bumps the minor-and-patch group with 59 updates in the / directory:
    - | Package | From | To | | --- | --- | --- | | [@commitlint/cli](https://github.com/conventional-changelog/commitlint/tree/HEAD/@commitlint/cli) | `21.2.3` | `21.2.4` | | [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/HEAD/@commitlint/config-conventional) | `21.2.3` | `21.2.4` | | [@types/vscode](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/vscode) | `1.140.0` | `1.146.0` | | [vitepress-plugin-group-icons](https://github.com/yuyinws/vitepress-plugin-group-icons) | `1.8.1` | `1.8.2` | | [vitepress-plugin-llms](https://github.com/okineadev/vitepress-plugin-llms) | `1.14.0` | `1.15.0` | | [@babel/helper-string-parser](https://github.com/babel/babel/tree/HEAD/packages/babel-helper-string-parser) | `7.29.7` | `7.29.14` | | [@babel/parser](https://github.com/babel/babel/tree/HEAD/packages/babel-parser) | `7.29.9` | `7.29.14` | | [@babel/runtime](https://github.com/babel/babel/tree/HEAD/packages/babel-runtime) | `7.29.10` | `7.29.14` | | [@babel/types](https://github.com/babel/babel/tree/HEAD/packages/babel-types) | `7.29.8` | `7.29.14` | | [@clack/prompts](https://github.com/bombshell-dev/clack/tree/HEAD/packages/prompts) | `1.8.1` | `1.9.0` | | [@commitlint/ensure](https://github.com/conventional-changelog/commitlint/tree/HEAD/@commitlint/ensure) | `21.2.3` | `21.2.4` | | [@commitlint/lint](https://github.com/conventional-changelog/commitlint/tree/HEAD/@commitlint/lint) | `21.2.3` | `21.2.4` | | [@commitlint/load](https://github.com/conventional-changelog/commitlint/tree/HEAD/@commitlint/load) | `21.2.3` | `21.2.4` | | [@commitlint/rules](https://github.com/conventional-changelog/commitlint/tree/HEAD/@commitlint/rules) | `21.2.3` | `21.2.4` | | [@conventional-changelog/template](https://github.com/conventional-changelog/conventional-changelog/tree/HEAD/packages/template) | `1.4.0` | `1.4.1` | | [@eslint-community/regexpp](https://github.com/eslint-community/regexpp) | `4.12.2` | `4.12.3` | | [@eslint/config-array](https://github.com/eslint/rewrite/tree/HEAD/packages/config-array) | `0.23.5` | `0.23.6` | | [@fastify/deepmerge](https://github.com/fastify/deepmerge) | `3.2.2` | `3.2.4` | | [@fastify/fast-json-stringify-compiler](https://github.com/fastify/fast-json-stringify-compiler) | `5.1.1` | `5.2.0` | | [@fastify/forwarded](https://github.com/fastify/forwarded) | `3.1.1` | `3.1.2` | | [@fastify/proxy-addr](https://github.com/fastify/proxy-addr) | `5.1.2` | `5.1.3` | | [@iconify-json/logos](https://github.com/iconify/icon-sets) | `1.2.17` | `1.2.20` | | [@iconify-json/vscode-icons](https://github.com/iconify/icon-sets) | `1.2.93` | `1.2.99` | | [@jridgewell/resolve-uri](https://github.com/jridgewell/resolve-uri) | `3.1.2` | `3.1.3` | | [@rolldown/pluginutils](https://github.com/rolldown/plugins/tree/HEAD/packages/pluginutils) | `1.0.1` | `1.1.1` | | [@shikijs/vscode-textmate](https://github.com/shikijs/vscode-textmate) | `10.0.2` | `10.1.0` | | [@types/lodash](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/HEAD/types/lodash) | `4.17.26` | `4.17.27` | | [brace-expansion](https://github.com/juliangruber/brace-expansion) | `1.1.21` | `1.1.22` | | [conventional-commits-parser](https://github.com/conventional-changelog/conventional-changelog/tree/HEAD/packages/conventional-commits-parser) | `7.1.3` | `7.1.4` | | [cookie](https://github.com/jshttp/cookie) | `2.0.1` | `2.0.2` | | [dotenv](https://github.com/motdotla/dotenv) | `18.0.7` | `18.0.10` | | [enhanced-resolve](https://github.com/webpack/enhanced-resolve) | `5.26.0` | `5.27.0` | | [es-toolkit](https://github.com/toss/es-toolkit) | `1.52.0` | `1.53.2` | | [fast-json-stringify](https://github.com/fastify/fast-json-stringify) | `7.1.0` | `7.3.6` | | [fast-uri](https://github.com/fastify/fast-uri) | `3.1.8` | `3.1.9` | | [fastify](https://github.com/fastify/fastify) | `5.12.5` | `5.12.8` | | [find-my-way](https://github.com/delvedor/find-my-way) | `9.10.0` | `9.10.1` | | [graceful-fs](https://github.com/isaacs/node-graceful-fs) | `4.2.11` | `4.2.12` | | [is-core-module](https://github.com/inspect-js/is-core-module) | `2.17.0` | `2.18.0` | | [jiti](https://github.com/unjs/jiti) | `2.6.1` | `2.7.0` | | [light-my-request](https://github.com/fastify/light-my-request) | `6.8.0` | `6.8.1` | | [mdast-util-to-hast](https://github.com/syntax-tree/mdast-util-to-hast) | `13.2.1` | `13.2.2` | | [mdast-util-to-markdown](https://github.com/syntax-tree/mdast-util-to-markdown) | `2.2.0` | `2.2.3` | | [postcss](https://github.com/postcss/postcss) | `8.5.29` | `8.5.33` | | [ret](https://github.com/fent/ret.js) | `0.5.0` | `0.5.1` | | [semver](https://github.com/npm/node-semver) | `6.3.1` | `6.3.2` | | [sisteransi](https://github.com/terkelg/sisteransi) | `1.0.5` | `2.0.0` | | [tabbable](https://github.com/focus-trap/tabbable) | `6.5.0` | `6.5.2` | | [tapable](https://github.com/webpack/tapable) | `2.3.3` | `2.3.4` | | [tar](https://github.com/isaacs/node-tar) | `7.5.22` | `7.5.23` | | [thread-stream](https://github.com/mcollina/thread-stream) | `4.2.0` | `4.2.1` | | [undici](https://github.com/nodejs/undici) | `8.11.2` | `8.12.4` | | [unist-util-visit-parents](https://github.com/syntax-tree/unist-util-visit-parents) | `6.0.2` | `6.1.0` | | [unist-util-visit](https://github.com/syntax-tree/unist-util-visit) | `5.1.0` | `5.2.0` | | [vfile-message](https://github.com/vfile/vfile-message) | `4.0.3` | `4.0.4` | | [vue-tsc](https://github.com/vuejs/language-tools/tree/HEAD/packages/tsc) | `3.3.13` | `3.3.14` | | [vue](https://github.com/vuejs/core) | `3.5.44` | `3.5.45` | | [ws](https://github.com/websockets/ws) | `8.22.0` | `8.23.0` | | [zod](https://github.com/colinhacks/zod) | `4.6.5` | `4.6.7` |
    - Updates `@commitlint/cli` from 21.2.3 to 21.2.4
    - [Release notes](https://github.com/conventional-changelog/commitlint/releases)
    - [Changelog](https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/cli/CHANGELOG.md)
    - [Commits](https://github.com/conventional-changelog/commitlint/commits/v21.2.4/@commitlint/cli)
    - Updates `@commitlint/config-conventional` from 21.2.3 to 21.2.4
    - [Release notes](https://github.com/conventional-changelog/commitlint/releases)
    - [Changelog](https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/config-conventional/CHANGELOG.md)
    - [Commits](https://github.com/conventional-changelog/commitlint/commits/v21.2.4/@commitlint/config-conventional)
    - Updates `@types/vscode` from 1.140.0 to 1.146.0
    - [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
    - [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/vscode)
    - Updates `vitepress-plugin-group-icons` from 1.8.1 to 1.8.2
    - [Release notes](https://github.com/yuyinws/vitepress-plugin-group-icons/releases)
    - [Commits](https://github.com/yuyinws/vitepress-plugin-group-icons/compare/v1.8.1...v1.8.2)
    - Updates `vitepress-plugin-llms` from 1.14.0 to 1.15.0
    - [Release notes](https://github.com/okineadev/vitepress-plugin-llms/releases)
    - [Commits](https://github.com/okineadev/vitepress-plugin-llms/compare/v1.14.0...v1.15.0)
    - Updates `@babel/helper-string-parser` from 7.29.7 to 7.29.14
    - [Release notes](https://github.com/babel/babel/releases)
    - [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/babel/babel/commits/v7.29.14/packages/babel-helper-string-parser)
    - Updates `@babel/parser` from 7.29.9 to 7.29.14
    - [Release notes](https://github.com/babel/babel/releases)
    - [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/babel/babel/commits/v7.29.14/packages/babel-parser)
    - Updates `@babel/runtime` from 7.29.10 to 7.29.14
    - [Release notes](https://github.com/babel/babel/releases)
    - [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/babel/babel/commits/v7.29.14/packages/babel-runtime)
    - Updates `@babel/types` from 7.29.8 to 7.29.14
    - [Release notes](https://github.com/babel/babel/releases)
    - [Changelog](https://github.com/babel/babel/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/babel/babel/commits/v7.29.14/packages/babel-types)
    - Updates `@clack/prompts` from 1.8.1 to 1.9.0
    - [Release notes](https://github.com/bombshell-dev/clack/releases)
    - [Changelog](https://github.com/bombshell-dev/clack/blob/main/packages/prompts/CHANGELOG.md)
    - [Commits](https://github.com/bombshell-dev/clack/commits/@clack/prompts@1.9.0/packages/prompts)
    - Updates `@commitlint/ensure` from 21.2.3 to 21.2.4
    - [Release notes](https://github.com/conventional-changelog/commitlint/releases)
    - [Changelog](https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/ensure/CHANGELOG.md)
    - [Commits](https://github.com/conventional-changelog/commitlint/commits/v21.2.4/@commitlint/ensure)
    - Updates `@commitlint/lint` from 21.2.3 to 21.2.4
    - [Release notes](https://github.com/conventional-changelog/commitlint/releases)
    - [Changelog](https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/lint/CHANGELOG.md)
    - [Commits](https://github.com/conventional-changelog/commitlint/commits/v21.2.4/@commitlint/lint)
    - Updates `@commitlint/load` from 21.2.3 to 21.2.4
    - [Release notes](https://github.com/conventional-changelog/commitlint/releases)
    - [Changelog](https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/load/CHANGELOG.md)
    - [Commits](https://github.com/conventional-changelog/commitlint/commits/v21.2.4/@commitlint/load)
    - Updates `@commitlint/rules` from 21.2.3 to 21.2.4
    - [Release notes](https://github.com/conventional-changelog/commitlint/releases)
    - [Changelog](https://github.com/conventional-changelog/commitlint/blob/master/@commitlint/rules/CHANGELOG.md)
    - [Commits](https://github.com/conventional-changelog/commitlint/commits/v21.2.4/@commitlint/rules)
    - Updates `@conventional-changelog/template` from 1.4.0 to 1.4.1
    - [Release notes](https://github.com/conventional-changelog/conventional-changelog/releases)
    - [Changelog](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/template/CHANGELOG.md)
    - [Commits](https://github.com/conventional-changelog/conventional-changelog/commits/template-v1.4.1/packages/template)
    - Updates `@eslint-community/regexpp` from 4.12.2 to 4.12.3
    - [Release notes](https://github.com/eslint-community/regexpp/releases)
    - [Commits](https://github.com/eslint-community/regexpp/compare/v4.12.2...v4.12.3)
    - Updates `@eslint/config-array` from 0.23.5 to 0.23.6
    - [Release notes](https://github.com/eslint/rewrite/releases)
    - [Changelog](https://github.com/eslint/rewrite/blob/main/packages/config-array/CHANGELOG.md)
    - [Commits](https://github.com/eslint/rewrite/commits/config-array-v0.23.6/packages/config-array)
    - Updates `@fastify/deepmerge` from 3.2.2 to 3.2.4
    - [Release notes](https://github.com/fastify/deepmerge/releases)
    - [Commits](https://github.com/fastify/deepmerge/compare/v3.2.2...v3.2.4)
    - Updates `@fastify/fast-json-stringify-compiler` from 5.1.1 to 5.2.0
    - [Release notes](https://github.com/fastify/fast-json-stringify-compiler/releases)
    - [Commits](https://github.com/fastify/fast-json-stringify-compiler/compare/v5.1.1...v5.2.0)
    - Updates `@fastify/forwarded` from 3.1.1 to 3.1.2
    - [Release notes](https://github.com/fastify/forwarded/releases)
    - [Commits](https://github.com/fastify/forwarded/compare/v3.1.1...v3.1.2)
    - Updates `@fastify/proxy-addr` from 5.1.2 to 5.1.3
    - [Release notes](https://github.com/fastify/proxy-addr/releases)
    - [Commits](https://github.com/fastify/proxy-addr/compare/v5.1.2...v5.1.3)
    - Updates `@iconify-json/logos` from 1.2.17 to 1.2.20
    - [Commits](https://github.com/iconify/icon-sets/commits)
    - Updates `@iconify-json/vscode-icons` from 1.2.93 to 1.2.99
    - [Commits](https://github.com/iconify/icon-sets/commits)
    - Updates `@jridgewell/resolve-uri` from 3.1.2 to 3.1.3
    - [Release notes](https://github.com/jridgewell/resolve-uri/releases)
    - [Commits](https://github.com/jridgewell/resolve-uri/compare/v3.1.2...v3.1.3)
    - Updates `@rolldown/pluginutils` from 1.0.1 to 1.1.1
    - [Release notes](https://github.com/rolldown/plugins/releases)
    - [Changelog](https://github.com/rolldown/plugins/blob/main/packages/pluginutils/CHANGELOG.md)
    - [Commits](https://github.com/rolldown/plugins/commits/pluginutils@1.1.1/packages/pluginutils)
    - Updates `@shikijs/vscode-textmate` from 10.0.2 to 10.1.0
    - [Commits](https://github.com/shikijs/vscode-textmate/compare/v10.0.2...v10.1.0)
    - Updates `@types/lodash` from 4.17.26 to 4.17.27
    - [Release notes](https://github.com/DefinitelyTyped/DefinitelyTyped/releases)
    - [Commits](https://github.com/DefinitelyTyped/DefinitelyTyped/commits/HEAD/types/lodash)
    - Updates `brace-expansion` from 1.1.21 to 1.1.22
    - [Release notes](https://github.com/juliangruber/brace-expansion/releases)
    - [Commits](https://github.com/juliangruber/brace-expansion/compare/v1.1.21...v1.1.22)
    - Updates `conventional-commits-parser` from 7.1.3 to 7.1.4
    - [Release notes](https://github.com/conventional-changelog/conventional-changelog/releases)
    - [Changelog](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-commits-parser/CHANGELOG.md)
    - [Commits](https://github.com/conventional-changelog/conventional-changelog/commits/conventional-commits-parser-v7.1.4/packages/conventional-commits-parser)
    - Updates `cookie` from 2.0.1 to 2.0.2
    - [Release notes](https://github.com/jshttp/cookie/releases)
    - [Commits](https://github.com/jshttp/cookie/compare/v2.0.1...v2.0.2)
    - Updates `dotenv` from 18.0.7 to 18.0.10
    - [Changelog](https://github.com/motdotla/dotenv/blob/master/CHANGELOG.md)
    - [Commits](https://github.com/motdotla/dotenv/compare/v18.0.7...v18.0.10)
    - Updates `enhanced-resolve` from 5.26.0 to 5.27.0
    - [Release notes](https://github.com/webpack/enhanced-resolve/releases)
    - [Changelog](https://github.com/webpack/enhanced-resolve/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/webpack/enhanced-resolve/compare/v5.26.0...v5.27.0)
    - Updates `es-toolkit` from 1.52.0 to 1.53.2
    - [Release notes](https://github.com/toss/es-toolkit/releases)
    - [Changelog](https://github.com/toss/es-toolkit/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/toss/es-toolkit/compare/v1.52.0...v1.53.2)
    - Updates `fast-json-stringify` from 7.1.0 to 7.3.6
    - [Release notes](https://github.com/fastify/fast-json-stringify/releases)
    - [Commits](https://github.com/fastify/fast-json-stringify/compare/v7.1.0...v7.3.6)
    - Updates `fast-uri` from 3.1.8 to 3.1.9
    - [Release notes](https://github.com/fastify/fast-uri/releases)
    - [Commits](https://github.com/fastify/fast-uri/compare/v3.1.8...v3.1.9)
    - Updates `fastify` from 5.12.5 to 5.12.8
    - [Release notes](https://github.com/fastify/fastify/releases)
    - [Commits](https://github.com/fastify/fastify/compare/v5.12.5...v5.12.8)
    - Updates `find-my-way` from 9.10.0 to 9.10.1
    - [Release notes](https://github.com/delvedor/find-my-way/releases)
    - [Commits](https://github.com/delvedor/find-my-way/compare/v9.10.0...v9.10.1)
    - Updates `graceful-fs` from 4.2.11 to 4.2.12
    - [Commits](https://github.com/isaacs/node-graceful-fs/compare/v4.2.11...v4.2.12)
    - Updates `is-core-module` from 2.17.0 to 2.18.0
    - [Changelog](https://github.com/inspect-js/is-core-module/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/inspect-js/is-core-module/compare/v2.17.0...v2.18.0)
    - Updates `jiti` from 2.6.1 to 2.7.0
    - [Release notes](https://github.com/unjs/jiti/releases)
    - [Changelog](https://github.com/unjs/jiti/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/unjs/jiti/compare/v2.6.1...v2.7.0)
    - Updates `light-my-request` from 6.8.0 to 6.8.1
    - [Release notes](https://github.com/fastify/light-my-request/releases)
    - [Commits](https://github.com/fastify/light-my-request/compare/v6.8.0...v6.8.1)
    - Updates `mdast-util-to-hast` from 13.2.1 to 13.2.2
    - [Release notes](https://github.com/syntax-tree/mdast-util-to-hast/releases)
    - [Commits](https://github.com/syntax-tree/mdast-util-to-hast/compare/13.2.1...13.2.2)
    - Updates `mdast-util-to-markdown` from 2.2.0 to 2.2.3
    - [Release notes](https://github.com/syntax-tree/mdast-util-to-markdown/releases)
    - [Commits](https://github.com/syntax-tree/mdast-util-to-markdown/compare/2.2.0...2.2.3)
    - Updates `postcss` from 8.5.29 to 8.5.33
    - [Release notes](https://github.com/postcss/postcss/releases)
    - [Changelog](https://github.com/postcss/postcss/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/postcss/postcss/compare/8.5.29...8.5.33)
    - Updates `ret` from 0.5.0 to 0.5.1
    - [Release notes](https://github.com/fent/ret.js/releases)
    - [Commits](https://github.com/fent/ret.js/compare/v0.5.0...v0.5.1)
    - Updates `semver` from 6.3.1 to 6.3.2
    - [Release notes](https://github.com/npm/node-semver/releases)
    - [Changelog](https://github.com/npm/node-semver/blob/v6.3.2/CHANGELOG.md)
    - [Commits](https://github.com/npm/node-semver/compare/v6.3.1...v6.3.2)
    - Updates `sisteransi` from 1.0.5 to 2.0.0
    - [Release notes](https://github.com/terkelg/sisteransi/releases)
    - [Commits](https://github.com/terkelg/sisteransi/compare/v1.0.5...v2.0.0)
    - Updates `tabbable` from 6.5.0 to 6.5.2
    - [Release notes](https://github.com/focus-trap/tabbable/releases)
    - [Changelog](https://github.com/focus-trap/tabbable/blob/master/CHANGELOG.md)
    - [Commits](https://github.com/focus-trap/tabbable/commits)
    - Updates `tapable` from 2.3.3 to 2.3.4
    - [Release notes](https://github.com/webpack/tapable/releases)
    - [Changelog](https://github.com/webpack/tapable/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/webpack/tapable/compare/v2.3.3...v2.3.4)
    - Updates `tar` from 7.5.22 to 7.5.23
    - [Release notes](https://github.com/isaacs/node-tar/releases)
    - [Changelog](https://github.com/isaacs/node-tar/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/isaacs/node-tar/compare/v7.5.22...v7.5.23)
    - Updates `thread-stream` from 4.2.0 to 4.2.1
    - [Release notes](https://github.com/mcollina/thread-stream/releases)
    - [Commits](https://github.com/mcollina/thread-stream/compare/v4.2.0...v4.2.1)
    - Updates `undici` from 8.11.2 to 8.12.4
    - [Release notes](https://github.com/nodejs/undici/releases)
    - [Commits](https://github.com/nodejs/undici/compare/v8.11.2...v8.12.4)
    - Updates `unist-util-visit-parents` from 6.0.2 to 6.1.0
    - [Release notes](https://github.com/syntax-tree/unist-util-visit-parents/releases)
    - [Commits](https://github.com/syntax-tree/unist-util-visit-parents/compare/6.0.2...6.1.0)
    - Updates `unist-util-visit` from 5.1.0 to 5.2.0
    - [Release notes](https://github.com/syntax-tree/unist-util-visit/releases)
    - [Commits](https://github.com/syntax-tree/unist-util-visit/compare/5.1.0...5.2.0)
    - Updates `vfile-message` from 4.0.3 to 4.0.4
    - [Release notes](https://github.com/vfile/vfile-message/releases)
    - [Commits](https://github.com/vfile/vfile-message/compare/4.0.3...4.0.4)
    - Updates `vue-tsc` from 3.3.13 to 3.3.14
    - [Release notes](https://github.com/vuejs/language-tools/releases)
    - [Changelog](https://github.com/vuejs/language-tools/blob/master/CHANGELOG.md)
    - [Commits](https://github.com/vuejs/language-tools/commits/v3.3.14/packages/tsc)
    - Updates `vue` from 3.5.44 to 3.5.45
    - [Release notes](https://github.com/vuejs/core/releases)
    - [Changelog](https://github.com/vuejs/core/blob/main/CHANGELOG.md)
    - [Commits](https://github.com/vuejs/core/compare/v3.5.44...v3.5.45)
    - Updates `ws` from 8.22.0 to 8.23.0
    - [Release notes](https://github.com/websockets/ws/releases)
    - [Commits](https://github.com/websockets/ws/compare/8.22.0...8.23.0)
    - Updates `zod` from 4.6.5 to 4.6.7
    - [Release notes](https://github.com/colinhacks/zod/releases)
    - [Commits](https://github.com/colinhacks/zod/compare/v4.6.5...v4.6.7)
    - --- updated-dependencies:
    - dependency-name: "@babel/helper-string-parser" dependency-version: 7.29.14 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@babel/parser" dependency-version: 7.29.14 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@babel/runtime" dependency-version: 7.29.14 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@babel/types" dependency-version: 7.29.14 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@clack/prompts" dependency-version: 1.9.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: "@commitlint/cli" dependency-version: 21.2.4 dependency-type: direct:development update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@commitlint/config-conventional" dependency-version: 21.2.4 dependency-type: direct:development update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@commitlint/ensure" dependency-version: 21.2.4 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@commitlint/lint" dependency-version: 21.2.4 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@commitlint/load" dependency-version: 21.2.4 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@commitlint/rules" dependency-version: 21.2.4 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@conventional-changelog/template" dependency-version: 1.4.1 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@eslint-community/regexpp" dependency-version: 4.12.3 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@eslint/config-array" dependency-version: 0.23.6 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@fastify/deepmerge" dependency-version: 3.2.4 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@fastify/fast-json-stringify-compiler" dependency-version: 5.2.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: "@fastify/forwarded" dependency-version: 3.1.2 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@fastify/proxy-addr" dependency-version: 5.1.3 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@iconify-json/logos" dependency-version: 1.2.20 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@iconify-json/vscode-icons" dependency-version: 1.2.99 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@jridgewell/resolve-uri" dependency-version: 3.1.3 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@rolldown/pluginutils" dependency-version: 1.1.1 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: "@shikijs/vscode-textmate" dependency-version: 10.1.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: "@types/lodash" dependency-version: 4.17.27 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: "@types/vscode" dependency-version: 1.146.0 dependency-type: direct:development update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: brace-expansion dependency-version: 1.1.22 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: conventional-commits-parser dependency-version: 7.1.4 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: cookie dependency-version: 2.0.2 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: dotenv dependency-version: 18.0.10 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: enhanced-resolve dependency-version: 5.27.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: es-toolkit dependency-version: 1.53.2 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: fast-json-stringify dependency-version: 7.3.6 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: fast-uri dependency-version: 3.1.9 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: fastify dependency-version: 5.12.8 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: find-my-way dependency-version: 9.10.1 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: graceful-fs dependency-version: 4.2.12 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: is-core-module dependency-version: 2.18.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: jiti dependency-version: 2.7.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: light-my-request dependency-version: 6.8.1 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: mdast-util-to-hast dependency-version: 13.2.2 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: mdast-util-to-markdown dependency-version: 2.2.3 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: postcss dependency-version: 8.5.33 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: ret dependency-version: 0.5.1 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: semver dependency-version: 6.3.2 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: sisteransi dependency-version: 2.0.0 dependency-type: indirect update-type: version-update:semver-major dependency-group: minor-and-patch
    - dependency-name: tabbable dependency-version: 6.5.2 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: tapable dependency-version: 2.3.4 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: tar dependency-version: 7.5.23 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: thread-stream dependency-version: 4.2.1 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: undici dependency-version: 8.12.4 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: unist-util-visit dependency-version: 5.2.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: unist-util-visit-parents dependency-version: 6.1.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: vfile-message dependency-version: 4.0.4 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: vitepress-plugin-group-icons dependency-version: 1.8.2 dependency-type: direct:development update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: vitepress-plugin-llms dependency-version: 1.15.0 dependency-type: direct:development update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: vue dependency-version: 3.5.45 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: vue-tsc dependency-version: 3.3.14 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch
    - dependency-name: ws dependency-version: 8.23.0 dependency-type: indirect update-type: version-update:semver-minor dependency-group: minor-and-patch
    - dependency-name: zod dependency-version: 4.6.7 dependency-type: indirect update-type: version-update:semver-patch dependency-group: minor-and-patch ...
    - **Signed-off-by:** dependabot[bot] <support@github.com>
    - chore(deps): regenerate the lockfile for the minor and patch updates
    - chore(deps): keep @types/vscode aligned with engines.vscode
    - ---------
    - **Signed-off-by:** dependabot[bot] <support@github.com>
    - **Co-authored-by:** dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>
    - **Co-authored-by:** T0chi <34287213+T0chi@users.noreply.github.com>

  </details>

</details>

### Package changes

#### Updated
- `@deltabox/toolchain`
  - `@commitlint/cli` `^21.2.2` → `^21.2.4`
  - `@commitlint/config-conventional` `^21.2.2` → `^21.2.4`
- `@deltabox/toolchain-docs`
  - `vitepress-plugin-group-icons` `^1.8.1` → `^1.8.2`
  - `vitepress-plugin-llms` `^1.14.0` → `^1.15.0`

## 3.0.0-beta.7 (November 2026)

<details>
<summary>Chores</summary>

#### Deps
- Bump the security-updates group across 1 directory with 3 updates ([#44](https://github.com/deltabox-studio/toolchain/issues/44)) ([#ce9a835](https://github.com/deltabox-studio/toolchain/commit/ce9a835) by [dependabot](https://github.com/dependabot))

  <details>
  <summary><strong>See more...</strong></summary>

  - chore(deps): bump the security-updates group across 1 directory with 3 updates
    - Bumps the security-updates group with 3 updates in the / directory: [vite](https://github.com/vitejs/vite/tree/HEAD/packages/vite), [fast-uri](https://github.com/fastify/fast-uri) and [undici](https://github.com/nodejs/undici).
    - Updates `vite` from 5.4.21 to 6.4.5
    - [Release notes](https://github.com/vitejs/vite/releases)
    - [Changelog](https://github.com/vitejs/vite/blob/v6.4.5/packages/vite/CHANGELOG.md)
    - [Commits](https://github.com/vitejs/vite/commits/v6.4.5/packages/vite)
    - Updates `fast-uri` from 3.1.8 to 3.1.9
    - [Release notes](https://github.com/fastify/fast-uri/releases)
    - [Commits](https://github.com/fastify/fast-uri/compare/v3.1.8...v3.1.9)
    - Updates `undici` from 8.11.2 to 8.12.4
    - [Release notes](https://github.com/nodejs/undici/releases)
    - [Commits](https://github.com/nodejs/undici/compare/v8.11.2...v8.12.4)
    - --- updated-dependencies:
    - dependency-name: fast-uri dependency-version: 3.1.9 dependency-type: indirect dependency-group: security-updates
    - dependency-name: undici dependency-version: 8.12.4 dependency-type: indirect dependency-group: security-updates
    - dependency-name: vite dependency-version: 6.4.5 dependency-type: direct:development dependency-group: security-updates ...
    - **Signed-off-by:** dependabot[bot] <support@github.com>
    - chore(deps): regenerate the lockfile for the security updates
    - ---------
    - **Signed-off-by:** dependabot[bot] <support@github.com>
    - **Co-authored-by:** dependabot[bot] <49699333+dependabot[bot]@users.noreply.github.com>
    - **Co-authored-by:** T0chi <34287213+T0chi@users.noreply.github.com>

  </details>

</details>

### New contributors
- [dependabot](https://github.com/dependabot)
  - Bump the security-updates group across 1 directory with 3 updates ([#44](https://github.com/deltabox-studio/toolchain/issues/44)) ([#ce9a835](https://github.com/deltabox-studio/toolchain/commit/ce9a835))

### Package changes

#### Updated
- `@deltabox/toolchain-docs`
  - `vite` `^5.4.14` → `^6.4.5`

## 3.0.0-beta.6 (November 2026)

<details>
<summary>Documentation</summary>

- Add MCP to the README table of contents ([#2d7acfb](https://github.com/deltabox-studio/toolchain/commit/2d7acfb) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.5 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Drop allowImportingTsExtensions from the integration test config ([#c241654](https://github.com/deltabox-studio/toolchain/commit/c241654) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.4 (November 2026)

<details>
<summary>New features</summary>

#### Project
- Leave fmt and lint to the root in nested scaffolds ([#c646ea5](https://github.com/deltabox-studio/toolchain/commit/c646ea5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Vite
- Inherit the root fmt and lint config in workspaces ([#b32e8e7](https://github.com/deltabox-studio/toolchain/commit/b32e8e7) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Align the READMEs and guides with v3 ([#c6487b8](https://github.com/deltabox-studio/toolchain/commit/c6487b8) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Add the codegen keyword to the package manifests ([#5e608fe](https://github.com/deltabox-studio/toolchain/commit/5e608fe) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.3 (November 2026)

<details>
<summary>New features</summary>

#### Changelog
- Add the beforeVersion lifecycle hook ([#3f62f0c](https://github.com/deltabox-studio/toolchain/commit/3f62f0c) by [T0chi](https://github.com/T0chi))
- Add the afterVersion lifecycle hook ([#c927eee](https://github.com/deltabox-studio/toolchain/commit/c927eee) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Release
- Add a GitHub release notes reformatter ([#95310f9](https://github.com/deltabox-studio/toolchain/commit/95310f9) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Updated
- `@deltabox/toolchain`
  - `vite-plugin-dbx` `^3.0.0-beta.1` → `^3.0.0-beta.2`

## 3.0.0-beta.2 (November 2026)

<details>
<summary>Chores</summary>

#### Deps
- Sync the scaffold vite-plugin-dbx catalog ([#b9a87dc](https://github.com/deltabox-studio/toolchain/commit/b9a87dc) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Updated
- `@deltabox/toolchain`
  - `vite-plugin-dbx` `^2.6.1` → `^3.0.0-beta.1`

## 3.0.0-beta.1 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vite
- Load build configs on a clean checkout ([#22812b8](https://github.com/deltabox-studio/toolchain/commit/22812b8) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

- Resolve the bug-hunt findings ([#f07f951](https://github.com/deltabox-studio/toolchain/commit/f07f951) by [T0chi](https://github.com/T0chi))
- Stop managing standalone Oxc configs in Vite+ mode ([#781367f](https://github.com/deltabox-studio/toolchain/commit/781367f) by [T0chi](https://github.com/T0chi))
- Adopt vite-plus only and per-package releases ([#faa6bcb](https://github.com/deltabox-studio/toolchain/commit/faa6bcb) by [T0chi](https://github.com/T0chi))

#### Config
- Add preserved JSON Schema and markdown docs engine APIs ([#6e3d36c](https://github.com/deltabox-studio/toolchain/commit/6e3d36c) by [T0chi](https://github.com/T0chi))
- Emit valid schemas and guard generated config validity ([#5fb7667](https://github.com/deltabox-studio/toolchain/commit/5fb7667) by [T0chi](https://github.com/T0chi))
- Rename the generated ambient env types to `dbx-env.d.ts` ([#078b316](https://github.com/deltabox-studio/toolchain/commit/078b316) by [T0chi](https://github.com/T0chi))
- Align env parsing and file loading ([#7912425](https://github.com/deltabox-studio/toolchain/commit/7912425) by [T0chi](https://github.com/T0chi))
- Correct schema conversion and generator output ([#10ff4b1](https://github.com/deltabox-studio/toolchain/commit/10ff4b1) by [T0chi](https://github.com/T0chi))
- Add runtime config APIs and grouped `ConfigEngine` types ([#b69980e](https://github.com/deltabox-studio/toolchain/commit/b69980e) by [T0chi](https://github.com/T0chi))
- Add `collect`, parser and config loader APIs ([#4a3b745](https://github.com/deltabox-studio/toolchain/commit/4a3b745) by [T0chi](https://github.com/T0chi))
- Move file generators and complete `config:all` ([#24de58a](https://github.com/deltabox-studio/toolchain/commit/24de58a) by [T0chi](https://github.com/T0chi))

#### Changelog
- Relabel details summaries and default the release body ([#7ccfc86](https://github.com/deltabox-studio/toolchain/commit/7ccfc86) by [T0chi](https://github.com/T0chi))
- Group package changes and batch ref reads ([#1a5e8a9](https://github.com/deltabox-studio/toolchain/commit/1a5e8a9) by [T0chi](https://github.com/T0chi))
- Add collapsible `details` rendering ([#f7d1c6a](https://github.com/deltabox-studio/toolchain/commit/f7d1c6a) by [T0chi](https://github.com/T0chi))
- Make releases idempotent and prerelease-aware ([#610138b](https://github.com/deltabox-studio/toolchain/commit/610138b) by [T0chi](https://github.com/T0chi))
- Use `setup-vp` for GitLab and Azure CI ([#268b08b](https://github.com/deltabox-studio/toolchain/commit/268b08b) by [T0chi](https://github.com/T0chi))
- Generate Vite+ CI with `voidzero-dev/setup-vp` ([#6dbf702](https://github.com/deltabox-studio/toolchain/commit/6dbf702) by [T0chi](https://github.com/T0chi))

#### Cli
- Finish spinners and conservative scaffold ranges ([#85ea426](https://github.com/deltabox-studio/toolchain/commit/85ea426) by [T0chi](https://github.com/T0chi))
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))
- Validate conflicting flags and unmanaged sync checks ([#c919b10](https://github.com/deltabox-studio/toolchain/commit/c919b10) by [T0chi](https://github.com/T0chi))
- Plugin-first config discovery, MCP commands and Vite+ passthroughs ([#20ce187](https://github.com/deltabox-studio/toolchain/commit/20ce187) by [T0chi](https://github.com/T0chi))
- Add `--configless` managed-project `sync` and `watch` ([#d222742](https://github.com/deltabox-studio/toolchain/commit/d222742) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Support remote extends with opt-in flattening ([#44b5c8a](https://github.com/deltabox-studio/toolchain/commit/44b5c8a) by [T0chi](https://github.com/T0chi))
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))
- Serialize regex aliases for JSON transports ([#d7d8caf](https://github.com/deltabox-studio/toolchain/commit/d7d8caf) by [T0chi](https://github.com/T0chi))
- Hoist include/exclude and respect custom file names ([#e926b8a](https://github.com/deltabox-studio/toolchain/commit/e926b8a) by [T0chi](https://github.com/T0chi))

#### Docker
- Correct PnP runtimes, nested ignores and Vite+ node versions ([#68eee6f](https://github.com/deltabox-studio/toolchain/commit/68eee6f) by [T0chi](https://github.com/T0chi))
- Correct container builds and runtime setup ([#0567bcd](https://github.com/deltabox-studio/toolchain/commit/0567bcd) by [T0chi](https://github.com/T0chi))
- Use the Bun image and copy Yarn install sources ([#bcf0eec](https://github.com/deltabox-studio/toolchain/commit/bcf0eec) by [T0chi](https://github.com/T0chi))
- Keep COPY sources and installs consistent ([#1ed6b4d](https://github.com/deltabox-studio/toolchain/commit/1ed6b4d) by [T0chi](https://github.com/T0chi))
- Use neutral headers and Bun-aware copies ([#63b4822](https://github.com/deltabox-studio/toolchain/commit/63b4822) by [T0chi](https://github.com/T0chi))
- Make Docker generation scaffolding-only ([#8094d92](https://github.com/deltabox-studio/toolchain/commit/8094d92) by [T0chi](https://github.com/T0chi))
- Allow user-owned files and always add compose ([#51b9ccc](https://github.com/deltabox-studio/toolchain/commit/51b9ccc) by [T0chi](https://github.com/T0chi))

#### Pack
- Make `createTsdownConfig` options configurable ([#f1a13a7](https://github.com/deltabox-studio/toolchain/commit/f1a13a7) by [T0chi](https://github.com/T0chi))
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))
- Keep declaration imports bare and report path leaks ([#8c2e099](https://github.com/deltabox-studio/toolchain/commit/8c2e099) by [T0chi](https://github.com/T0chi))

#### Project
- Avoid inheriting the parent name for `--out` scaffolds ([#1513508](https://github.com/deltabox-studio/toolchain/commit/1513508) by [T0chi](https://github.com/T0chi))
- Correct scaffold dependencies, sync identity and templates ([#a13dae5](https://github.com/deltabox-studio/toolchain/commit/a13dae5) by [T0chi](https://github.com/T0chi))
- Place fmt/lint in `vite.config` and stop emitting standalone Oxc configs ([#6621669](https://github.com/deltabox-studio/toolchain/commit/6621669) by [T0chi](https://github.com/T0chi))
- Scaffold the Vite plugin, Vite+ toolchain and publishable packages ([#c9d94fe](https://github.com/deltabox-studio/toolchain/commit/c9d94fe) by [T0chi](https://github.com/T0chi))

#### Vscode
- Prefer the project `dbx` by default ([#5ae1d94](https://github.com/deltabox-studio/toolchain/commit/5ae1d94) by [T0chi](https://github.com/T0chi))

#### Core
- Detect plugin projects and correct project typing ([#7780e0d](https://github.com/deltabox-studio/toolchain/commit/7780e0d) by [T0chi](https://github.com/T0chi))
- Make managed-file formatting opt-in ([#2a7c709](https://github.com/deltabox-studio/toolchain/commit/2a7c709) by [T0chi](https://github.com/T0chi))
- Format managed files after `dbx sync` ([#fb3d9be](https://github.com/deltabox-studio/toolchain/commit/fb3d9be) by [T0chi](https://github.com/T0chi))
- Provision the detected formatter/linter dependencies ([#c5cff9f](https://github.com/deltabox-studio/toolchain/commit/c5cff9f) by [T0chi](https://github.com/T0chi))
- Load plugin configs, manage configless projects and inherit parent plugins ([#9a5c049](https://github.com/deltabox-studio/toolchain/commit/9a5c049) by [T0chi](https://github.com/T0chi))
- Strict opt-in config inheritance and configless management in `loader.ts` ([#cc38570](https://github.com/deltabox-studio/toolchain/commit/cc38570) by [T0chi](https://github.com/T0chi))

#### Template
- Report create failures and require `--online` ([#dcc5604](https://github.com/deltabox-studio/toolchain/commit/dcc5604) by [T0chi](https://github.com/T0chi))

#### Vite
- Rename the package to `vite-plugin-dbx` and default to plugin mode ([#3a2cdcb](https://github.com/deltabox-studio/toolchain/commit/3a2cdcb) by [T0chi](https://github.com/T0chi))
- Only write a shim when the project declares its own `vite` section ([#fa7de36](https://github.com/deltabox-studio/toolchain/commit/fa7de36) by [T0chi](https://github.com/T0chi))

#### Migrate
- Migrate tooling to the Vite plugin and Vite+ Oxc setup ([#b2469a8](https://github.com/deltabox-studio/toolchain/commit/b2469a8) by [T0chi](https://github.com/T0chi))

#### Shared
- Add the dbx plugin contract and shared config updates ([#3790a5e](https://github.com/deltabox-studio/toolchain/commit/3790a5e) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Ci
- Add Dependabot security updates ([#467e3eb](https://github.com/deltabox-studio/toolchain/commit/467e3eb) by [T0chi](https://github.com/T0chi))

#### Cli
- Keep spinners readable and surface passthrough failures ([#747937b](https://github.com/deltabox-studio/toolchain/commit/747937b) by [T0chi](https://github.com/T0chi))
- Add changelog intro/outro flags and respect `enabled` ([#7d74c71](https://github.com/deltabox-studio/toolchain/commit/7d74c71) by [T0chi](https://github.com/T0chi))
- Add `dbx enable`/`disable` and `enabled` ([#67ea4c3](https://github.com/deltabox-studio/toolchain/commit/67ea4c3) by [T0chi](https://github.com/T0chi))
- Add the `test:repo` integration harness runner ([#0317b26](https://github.com/deltabox-studio/toolchain/commit/0317b26) by [T0chi](https://github.com/T0chi))

#### Config
- Add static schema defaults ([#8e9ae1a](https://github.com/deltabox-studio/toolchain/commit/8e9ae1a) by [T0chi](https://github.com/T0chi))
- Generate `toolchain.hooks` from function schemas ([#4f6ceeb](https://github.com/deltabox-studio/toolchain/commit/4f6ceeb) by [T0chi](https://github.com/T0chi))
- Reuse changelog group and option schemas ([#cbd9b54](https://github.com/deltabox-studio/toolchain/commit/cbd9b54) by [T0chi](https://github.com/T0chi))
- Add `enabled` and `regenerate` controls ([#7f5444a](https://github.com/deltabox-studio/toolchain/commit/7f5444a) by [T0chi](https://github.com/T0chi))
- Update generated formatting and config generators ([#62897df](https://github.com/deltabox-studio/toolchain/commit/62897df) by [T0chi](https://github.com/T0chi))

#### Vscode
- Decorate managed files and reveal the active project ([#a6debec](https://github.com/deltabox-studio/toolchain/commit/a6debec) by [T0chi](https://github.com/T0chi))
- Add scoped auto-sync, the action palette and the Actions view ([#c330378](https://github.com/deltabox-studio/toolchain/commit/c330378) by [T0chi](https://github.com/T0chi))
- Prompt for Docker when scaffolding ([#3fdfac3](https://github.com/deltabox-studio/toolchain/commit/3fdfac3) by [T0chi](https://github.com/T0chi))
- Add generic format/lint actions and formatting settings ([#c256de5](https://github.com/deltabox-studio/toolchain/commit/c256de5) by [T0chi](https://github.com/T0chi))
- Support plugin-mode projects, MCP install and sync UX ([#bfb2588](https://github.com/deltabox-studio/toolchain/commit/bfb2588) by [T0chi](https://github.com/T0chi))
- Sync notifications, `sync all`, migration target, `manageConfigless` ([#4147500](https://github.com/deltabox-studio/toolchain/commit/4147500) by [T0chi](https://github.com/T0chi))

#### Shared
- Add static schema defaults ([#3b810d3](https://github.com/deltabox-studio/toolchain/commit/3b810d3) by [T0chi](https://github.com/T0chi))
- Add `loader` and `project.manageConfigless` config sections ([#1f5e06d](https://github.com/deltabox-studio/toolchain/commit/1f5e06d) by [T0chi](https://github.com/T0chi))

#### Changelog
- Add `minCommits` and nested `See more...` descriptions ([#9fa603b](https://github.com/deltabox-studio/toolchain/commit/9fa603b) by [T0chi](https://github.com/T0chi))
- Batch GitHub metadata lookups ([#9e90e38](https://github.com/deltabox-studio/toolchain/commit/9e90e38) by [T0chi](https://github.com/T0chi))
- Fix details formatting and add release mode ([#5fa519f](https://github.com/deltabox-studio/toolchain/commit/5fa519f) by [T0chi](https://github.com/T0chi))
- Apply details after formatting and add body collapsibles ([#83dd7da](https://github.com/deltabox-studio/toolchain/commit/83dd7da) by [T0chi](https://github.com/T0chi))
- Add scoped versioning options and changelog `intro`/`outro` ([#09cf5d9](https://github.com/deltabox-studio/toolchain/commit/09cf5d9) by [T0chi](https://github.com/T0chi))
- Add opt-in `ci.dependabot` version updates ([#18670f7](https://github.com/deltabox-studio/toolchain/commit/18670f7) by [T0chi](https://github.com/T0chi))

#### Template
- Add opt-in containerization to scaffolds ([#51732a4](https://github.com/deltabox-studio/toolchain/commit/51732a4) by [T0chi](https://github.com/T0chi))
- Expose the quality-of-life builtins ([#a7a0b3c](https://github.com/deltabox-studio/toolchain/commit/a7a0b3c) by [T0chi](https://github.com/T0chi))

#### Core
- Wire `@deltabox/toolchain-docker` into the umbrella ([#5322f8b](https://github.com/deltabox-studio/toolchain/commit/5322f8b) by [T0chi](https://github.com/T0chi))

#### Docker
- Add the `@deltabox/toolchain-docker` package ([#f08cd46](https://github.com/deltabox-studio/toolchain/commit/f08cd46) by [T0chi](https://github.com/T0chi))

#### Project
- Add quality-of-life template generators ([#85cdd6f](https://github.com/deltabox-studio/toolchain/commit/85cdd6f) by [T0chi](https://github.com/T0chi))

#### Biome,changelog
- Make the packages publishable and run on vite-plus ([#23c3f41](https://github.com/deltabox-studio/toolchain/commit/23c3f41) by [T0chi](https://github.com/T0chi))

#### Pack
- Provide the shared pack config and workspace aliases without a tsdown dependency ([#503d021](https://github.com/deltabox-studio/toolchain/commit/503d021) by [T0chi](https://github.com/T0chi))

#### Mcp
- Add the MCP server, installers and `dbx mcp:*` commands ([#0553843](https://github.com/deltabox-studio/toolchain/commit/0553843) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Changelog
- Yield between phases so the spinner animates ([#3a82b92](https://github.com/deltabox-studio/toolchain/commit/3a82b92) by [T0chi](https://github.com/T0chi))
- Reformat existing entries with an empty all range ([#c36f3b2](https://github.com/deltabox-studio/toolchain/commit/c36f3b2) by [T0chi](https://github.com/T0chi))
- Preserve reformatted entries and release output ([#5f364e0](https://github.com/deltabox-studio/toolchain/commit/5f364e0) by [T0chi](https://github.com/T0chi))
- Dedupe Azure setup steps in vendor pipelines ([#4752c89](https://github.com/deltabox-studio/toolchain/commit/4752c89) by [T0chi](https://github.com/T0chi))
- Keep commit groups and package footers when reformatting ([#3bea7ab](https://github.com/deltabox-studio/toolchain/commit/3bea7ab) by [T0chi](https://github.com/T0chi))
- Keep manual runs, bullets and release markers intact ([#8af8fc7](https://github.com/deltabox-studio/toolchain/commit/8af8fc7) by [T0chi](https://github.com/T0chi))
- Retry `gh` API calls before falling back ([#def8ce6](https://github.com/deltabox-studio/toolchain/commit/def8ce6) by [T0chi](https://github.com/T0chi))
- Stop retrying `gh` after a timeout ([#d7f5f0c](https://github.com/deltabox-studio/toolchain/commit/d7f5f0c) by [T0chi](https://github.com/T0chi))
- Make release runs idempotent and catalog-aware ([#5bc74af](https://github.com/deltabox-studio/toolchain/commit/5bc74af) by [T0chi](https://github.com/T0chi))

#### Config
- Escape generated JSDoc comments, closes [#41](https://github.com/deltabox-studio/toolchain/issues/41) ([#220d228](https://github.com/deltabox-studio/toolchain/commit/220d228) by [T0chi](https://github.com/T0chi)) (fixes [#41](https://github.com/deltabox-studio/toolchain/issues/41))
- Harden schema validation and generated output ([#64efa45](https://github.com/deltabox-studio/toolchain/commit/64efa45) by [T0chi](https://github.com/T0chi))
- Report the written type file extension ([#cf56517](https://github.com/deltabox-studio/toolchain/commit/cf56517) by [T0chi](https://github.com/T0chi))
- Keep the root package description in sync with the toolchain config ([#cc0438d](https://github.com/deltabox-studio/toolchain/commit/cc0438d) by [T0chi](https://github.com/T0chi))

#### Core
- Resolve config from source in repo-local runs ([#4022d37](https://github.com/deltabox-studio/toolchain/commit/4022d37) by [T0chi](https://github.com/T0chi))
- Correct sync checks, manifest paths and watch globs ([#592dbb0](https://github.com/deltabox-studio/toolchain/commit/592dbb0) by [T0chi](https://github.com/T0chi))
- Support brace and class globs in project filters ([#c16f9ab](https://github.com/deltabox-studio/toolchain/commit/c16f9ab) by [T0chi](https://github.com/T0chi))
- Scope managed formatting and keep checks read-only ([#f5adccb](https://github.com/deltabox-studio/toolchain/commit/f5adccb) by [T0chi](https://github.com/T0chi))
- Emit one root `editor.formatOnSave` and support dotted vscode exclusions ([#ef79025](https://github.com/deltabox-studio/toolchain/commit/ef79025) by [T0chi](https://github.com/T0chi))

#### Vscode
- Repair the action palette and multi-root sync ([#0556f0a](https://github.com/deltabox-studio/toolchain/commit/0556f0a) by [T0chi](https://github.com/T0chi))
- Validate manifest metadata ([#9e742e8](https://github.com/deltabox-studio/toolchain/commit/9e742e8) by [T0chi](https://github.com/T0chi))
- Quote shim paths in the terminal command ([#859d08d](https://github.com/deltabox-studio/toolchain/commit/859d08d) by [T0chi](https://github.com/T0chi))
- Keep watchers when an input resolve fails ([#e11adc5](https://github.com/deltabox-studio/toolchain/commit/e11adc5) by [T0chi](https://github.com/T0chi))
- Remove config actions that have no CLI command ([#f75ebd0](https://github.com/deltabox-studio/toolchain/commit/f75ebd0) by [T0chi](https://github.com/T0chi))
- Absorb a pending debounce on manual sync ([#74cde55](https://github.com/deltabox-studio/toolchain/commit/74cde55) by [T0chi](https://github.com/T0chi))
- Discover hoisted and multi-root project `dbx` ([#4a017b0](https://github.com/deltabox-studio/toolchain/commit/4a017b0) by [T0chi](https://github.com/T0chi))

#### Template
- Validate scaffolds and forward source metadata ([#7953add](https://github.com/deltabox-studio/toolchain/commit/7953add) by [T0chi](https://github.com/T0chi))
- Resolve registry sources from the project root ([#be3c94a](https://github.com/deltabox-studio/toolchain/commit/be3c94a) by [T0chi](https://github.com/T0chi))
- Keep machine output clean and honour registry settings ([#eda93e1](https://github.com/deltabox-studio/toolchain/commit/eda93e1) by [T0chi](https://github.com/T0chi))
- Honour ignore globs and preserve binary assets ([#c2fd467](https://github.com/deltabox-studio/toolchain/commit/c2fd467) by [T0chi](https://github.com/T0chi))

#### Project
- Harden scaffolds and make Docker plans template-aware ([#e937042](https://github.com/deltabox-studio/toolchain/commit/e937042) by [T0chi](https://github.com/T0chi))
- Keep plugin projects in the rewritten graph ([#9f81f8d](https://github.com/deltabox-studio/toolchain/commit/9f81f8d) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Reconcile overrides before generation and harden remote extends ([#0fa2caa](https://github.com/deltabox-studio/toolchain/commit/0fa2caa) by [T0chi](https://github.com/T0chi))
- Support directory and self project references ([#98018b6](https://github.com/deltabox-studio/toolchain/commit/98018b6) by [T0chi](https://github.com/T0chi))
- Resolve nested root files and honour them in --json ([#d1ce26d](https://github.com/deltabox-studio/toolchain/commit/d1ce26d) by [T0chi](https://github.com/T0chi))
- Normalize auto-wired reference paths ([#2a0ce95](https://github.com/deltabox-studio/toolchain/commit/2a0ce95) by [T0chi](https://github.com/T0chi))
- Sort generated paths consistently ([#053d331](https://github.com/deltabox-studio/toolchain/commit/053d331) by [T0chi](https://github.com/T0chi))

#### Mcp
- Preserve JSONC configs and resolve relative roots ([#46ad6cf](https://github.com/deltabox-studio/toolchain/commit/46ad6cf) by [T0chi](https://github.com/T0chi))
- Preserve JSONC configs, tool flags and stdio ([#446249a](https://github.com/deltabox-studio/toolchain/commit/446249a) by [T0chi](https://github.com/T0chi))
- Use the supported tsconfig print flag ([#473738c](https://github.com/deltabox-studio/toolchain/commit/473738c) by [T0chi](https://github.com/T0chi))
- Advertise the real version and load installed skills ([#1827bc2](https://github.com/deltabox-studio/toolchain/commit/1827bc2) by [T0chi](https://github.com/T0chi))

#### Shared
- Harden YAML, JSONC and logging helpers ([#ecc793a](https://github.com/deltabox-studio/toolchain/commit/ecc793a) by [T0chi](https://github.com/T0chi))
- Quote unsafe YAML scalars in the emitter ([#b8c87cf](https://github.com/deltabox-studio/toolchain/commit/b8c87cf) by [T0chi](https://github.com/T0chi))
- Match brace and class globs and anchor gitignore paths ([#0763205](https://github.com/deltabox-studio/toolchain/commit/0763205) by [T0chi](https://github.com/T0chi))
- Declare `type-fest` as a dependency ([#7a9e71b](https://github.com/deltabox-studio/toolchain/commit/7a9e71b) by [T0chi](https://github.com/T0chi))
- Tolerate UTF-8 BOM across JSON readers ([#a021da7](https://github.com/deltabox-studio/toolchain/commit/a021da7) by [T0chi](https://github.com/T0chi))

#### Cli
- Suppress the update notice for `-V` ([#162b49c](https://github.com/deltabox-studio/toolchain/commit/162b49c) by [T0chi](https://github.com/T0chi))
- Suppress the update notice for `mcp:serve` ([#0d0e870](https://github.com/deltabox-studio/toolchain/commit/0d0e870) by [T0chi](https://github.com/T0chi))
- Reject `--recursive --watch` ([#dccc511](https://github.com/deltabox-studio/toolchain/commit/dccc511) by [T0chi](https://github.com/T0chi))
- Harden flag parsing and document library-only config commands ([#aaaa11a](https://github.com/deltabox-studio/toolchain/commit/aaaa11a) by [T0chi](https://github.com/T0chi))
- Validate `projects --max-depth` and `sync --json` errors ([#78bb9eb](https://github.com/deltabox-studio/toolchain/commit/78bb9eb) by [T0chi](https://github.com/T0chi))

#### Pack
- Keep test runtimes and null export blockers ([#777e43e](https://github.com/deltabox-studio/toolchain/commit/777e43e) by [T0chi](https://github.com/T0chi))

#### Migrate
- Merge into the existing vite config file ([#9d0be5f](https://github.com/deltabox-studio/toolchain/commit/9d0be5f) by [T0chi](https://github.com/T0chi))
- Resolve inherited config in `--check` ([#1311114](https://github.com/deltabox-studio/toolchain/commit/1311114) by [T0chi](https://github.com/T0chi))
- Handle BOM input and clean `--check` ([#2860f9b](https://github.com/deltabox-studio/toolchain/commit/2860f9b) by [T0chi](https://github.com/T0chi))

#### Vite
- Correct shim config resolution and plugin syncing ([#21b0312](https://github.com/deltabox-studio/toolchain/commit/21b0312) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Move public typings into src/types barrels ([#f727890](https://github.com/deltabox-studio/toolchain/commit/f727890) by [T0chi](https://github.com/T0chi))
- Split package typings into `src/types` barrels ([#45e5032](https://github.com/deltabox-studio/toolchain/commit/45e5032) by [T0chi](https://github.com/T0chi))

#### Config
- Share the runtime loader with core ([#e84e4e6](https://github.com/deltabox-studio/toolchain/commit/e84e4e6) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Regenerate `llms-full.txt` ([#a515500](https://github.com/deltabox-studio/toolchain/commit/a515500) by [T0chi](https://github.com/T0chi))
- Regenerate the llms bundle ([#a7afae9](https://github.com/deltabox-studio/toolchain/commit/a7afae9) by [T0chi](https://github.com/T0chi))
- Regenerate the llms output ([#a0a4e6f](https://github.com/deltabox-studio/toolchain/commit/a0a4e6f) by [T0chi](https://github.com/T0chi))
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
<summary>Styles</summary>

- Restore 4-space formatting for tooling dependency files ([#c8f0d4d](https://github.com/deltabox-studio/toolchain/commit/c8f0d4d) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Tests</summary>

- Cover Docker generation and containerized scaffolds ([#90148e1](https://github.com/deltabox-studio/toolchain/commit/90148e1) by [T0chi](https://github.com/T0chi))
- Cover the quality-of-life templates ([#79822ba](https://github.com/deltabox-studio/toolchain/commit/79822ba) by [T0chi](https://github.com/T0chi))
- Update Oxc-file expectations for Vite+ config mode ([#4a45455](https://github.com/deltabox-studio/toolchain/commit/4a45455) by [T0chi](https://github.com/T0chi))
- Cover plugin-mode projects and the vite-plus toolchain ([#626e8ba](https://github.com/deltabox-studio/toolchain/commit/626e8ba) by [T0chi](https://github.com/T0chi))

#### Core
- Verify resolved import group formatter output ([#51d5a0d](https://github.com/deltabox-studio/toolchain/commit/51d5a0d) by [T0chi](https://github.com/T0chi))

#### Cli
- Expect exact scaffold toolchain ranges ([#8c54b91](https://github.com/deltabox-studio/toolchain/commit/8c54b91) by [T0chi](https://github.com/T0chi))

#### Changelog
- Keep `gh` lookups offline in test runs ([#06b59d9](https://github.com/deltabox-studio/toolchain/commit/06b59d9) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Update lockfile ([#35bf7f0](https://github.com/deltabox-studio/toolchain/commit/35bf7f0) by [T0chi](https://github.com/T0chi))
- Normalize imports and docs ([#c7f0d25](https://github.com/deltabox-studio/toolchain/commit/c7f0d25) by [T0chi](https://github.com/T0chi))

#### Shared
- Regenerate config types and schema artifacts ([#5ffed68](https://github.com/deltabox-studio/toolchain/commit/5ffed68) by [T0chi](https://github.com/T0chi))

#### Config
- Regenerate the config types ([#e87d3a2](https://github.com/deltabox-studio/toolchain/commit/e87d3a2) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#2c4dc1e](https://github.com/deltabox-studio/toolchain/commit/2c4dc1e) by [T0chi](https://github.com/T0chi))
- Regenerate the CLI docs and llms output ([#cf8661f](https://github.com/deltabox-studio/toolchain/commit/cf8661f) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#82ca5c3](https://github.com/deltabox-studio/toolchain/commit/82ca5c3) by [T0chi](https://github.com/T0chi))
- Generate plain array unions and `details` types ([#486d264](https://github.com/deltabox-studio/toolchain/commit/486d264) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#12788f0](https://github.com/deltabox-studio/toolchain/commit/12788f0) by [T0chi](https://github.com/T0chi))
- Regenerate types and references ([#3c7917a](https://github.com/deltabox-studio/toolchain/commit/3c7917a) by [T0chi](https://github.com/T0chi))
- Regenerate types and references ([#de928fa](https://github.com/deltabox-studio/toolchain/commit/de928fa) by [T0chi](https://github.com/T0chi))

#### Ci
- Configure Dependabot groups for the dogfood repo ([#615e253](https://github.com/deltabox-studio/toolchain/commit/615e253) by [T0chi](https://github.com/T0chi))
- Regenerate the workflows with `setup-vp` ([#1e5f7c3](https://github.com/deltabox-studio/toolchain/commit/1e5f7c3) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Regenerate workspace paths ([#4ad047a](https://github.com/deltabox-studio/toolchain/commit/4ad047a) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Added
- `@deltabox/toolchain`
  - `@deltabox/toolchain-docker` `workspace:*`
  - `@deltabox/toolchain-mcp` `workspace:*`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `ajv` `^8.20.0`
  - `vite-plugin-dbx` `^2.6.1`
- `@deltabox/toolchain-biome`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-changelog`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-config`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `ajv` `^8.20.0`
  - `js-yaml` `^4.1.0`
  - `tsx` `catalog:`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-core`
  - `@deltabox/toolchain-config` `workspace:*`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-docker`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `@deltabox/toolchain-shared` `workspace:*`
  - `@types/node` `catalog:`
  - `typescript` `catalog:`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-mcp`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `@deltabox/toolchain-shared` `workspace:*`
  - `@types/node` `catalog:`
  - `typescript` `catalog:`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-migrate`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-pack`
  - `@deltabox/toolchain-shared` `workspace:*`
  - `@types/node` `catalog:`
  - `glob` `catalog:`
  - `type-fest` `catalog:`
  - `typescript` `catalog:`
  - `vite-plus` `>=1`
- `@deltabox/toolchain-project`
  - `@deltabox/toolchain-docker` `workspace:*`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-shared`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-template`
  - `@deltabox/toolchain-docker` `workspace:*`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `vite-plugin-dbx` `workspace:*`
  - `vite-plus` `catalog:`
- `@deltabox/toolchain-tsconfig`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `vite-plus` `catalog:`
- `toolchain-vscode`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `vite-plus` `catalog:`
- `vite-plugin-dbx`
  - `@deltabox/toolchain-core` `workspace:*`
  - `@deltabox/toolchain-pack` `workspace:*`
  - `@deltabox/toolchain-shared` `workspace:*`
  - `@types/node` `catalog:`
  - `typescript` `catalog:`
  - `vite-plus` `>=1`

#### Updated
- `@deltabox/toolchain`
  - `vite-plus` `>=1` → `1.2.0`

#### Removed
- `@deltabox/toolchain`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `@deltabox/toolchain-vite` `workspace:*`
  - `tsdown` `^0.23.0`
  - `vite` `^8.3.0`
  - `vitest` `^5.0.0`
- `@deltabox/toolchain-biome`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-changelog`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-config`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-core`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-migrate`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-project`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-shared`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-template`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `@deltabox/toolchain-vite` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-tsconfig`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-tsdown`
  - `@deltabox/toolchain-shared` `workspace:*`
  - `@types/node` `catalog:`
  - `glob` `catalog:`
  - `tsdown` `catalog:`
  - `type-fest` `catalog:`
  - `typescript` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`
- `@deltabox/toolchain-vite`
  - `@deltabox/toolchain-core` `workspace:*`
  - `@deltabox/toolchain-shared` `workspace:*`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `@types/node` `catalog:`
  - `tsdown` `catalog:`
  - `typescript` `catalog:`
  - `vite` `>=5`
  - `vitest` `catalog:`
- `toolchain-vscode`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `tsdown` `catalog:`
  - `vite` `catalog:`
  - `vitest` `catalog:`

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

#### Core
- Expand VS Code formatter/linter defaults ([#e9ad3ff](https://github.com/deltabox-studio/toolchain/commit/e9ad3ff) by [T0chi](https://github.com/T0chi))
- Resolve concrete watch inputs and update the VS Code watcher ([#425f0d3](https://github.com/deltabox-studio/toolchain/commit/425f0d3) by [T0chi](https://github.com/T0chi))

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

#### Core
- Inherit only shared sections in configless projects ([#3c62b6f](https://github.com/deltabox-studio/toolchain/commit/3c62b6f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - A configless project inherited the ancestor config as-is, so repository-level sections (ci, changelog, catalogs, tsconfig) and workspace-scoped vite.test/vite.run leaked into it. Merge the parent with an empty child config instead, which drops those sections and the parent's project identity while keeping the shared metadata and vite fmt/lint.

  </details>

- Stop inheriting project identity for configless workspaces ([#8f163ed](https://github.com/deltabox-studio/toolchain/commit/8f163ed) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - A nested workspace without its own dbx.config.* inherited the parent's project name/scope/description/type, so it could be detected as monorepo-root and lose its package.json identity. Strip the identity fields (and still drop the parent's hooks) when a configless project inherits an ancestor config.

  </details>

#### Vscode
- Scope auto-sync watchers to their workspace root ([#6604b23](https://github.com/deltabox-studio/toolchain/commit/6604b23) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - String globs match across every workspace folder, and any watcher event synced every root. Scope each resolved input to its owning root (watching a concrete nested file from its own directory so the watcher stays non-recursive), drop absolute/ancestor globs, and sync only the root whose input changed. The CLI also rejects unsafe user globs.

  </details>

- Sync configless projects from Sync all ([#d9c185e](https://github.com/deltabox-studio/toolchain/commit/d9c185e) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - keep the CLI recursive pass for projects with their own config
    - sync projects that only inherit the root config individually
    - refresh the project graph first so newly discovered projects are included

  </details>

#### Project
- Resolve repository.directory without a git checkout ([#a2d53d6](https://github.com/deltabox-studio/toolchain/commit/a2d53d6) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - fall back to the nearest ancestor dbx.config.* when no .git root is found
    - keep the git checkout as the primary repository root
    - add a regression test for a nested workspace without a .git checkout

  </details>

</details>

<details>
<summary>Refactors</summary>

- Use `@deltabox/toolchain/<name>` import subpaths and workspace-aware tsdown aliases ([#691445a](https://github.com/deltabox-studio/toolchain/commit/691445a) by [T0chi](https://github.com/T0chi))

#### Shared
- Literal-type the Vite+ default rules ([#b55fe2a](https://github.com/deltabox-studio/toolchain/commit/b55fe2a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Type DEFAULT_FMT_RULES and DEFAULT_LINT_RULES with as const satisfies a deeply readonly config view, so their values stay literal instead of widening to the interface. applyFmtCustomGroups accepts the readonly defaults (it never mutates its input), and a type-level test guards the literals.

  </details>

- Use as const for exported defaults ([#5b37c08](https://github.com/deltabox-studio/toolchain/commit/5b37c08) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Prefer literal tuples/objects over broad annotations, derive the related union types, and keep dynamic lookups/mutable copies behind small helpers.

  </details>

#### Vscode
- Extract sync, generate, migrate and reset commands ([#b2b146d](https://github.com/deltabox-studio/toolchain/commit/b2b146d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Move the sync/check, config generation, migrate and reset handlers out of extension.ts into commands modules. Expand CommandDeps with the shared run/refresh helpers and add a focused syncAll/syncSelected test.

  </details>

#### Config
- Use string & {} for open index signatures ([#11665c0](https://github.com/deltabox-studio/toolchain/commit/11665c0) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Emit [key: string & {}] from the config generator and use it in hand-written open maps, keeping known keys visible to autocomplete. Zod cannot express this key type, so the generator remains the post-processing point.
    - Also make the workflow filename/token defaults literal constants.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Document watcher scoping and project identity inheritance ([#074bfcd](https://github.com/deltabox-studio/toolchain/commit/074bfcd) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Update the VS Code auto-sync section and the project guide to match the implementation: watchers are root-scoped and sync only the changed root; project name/scope/description/type are never inherited. Regenerate llms-full.txt.

  </details>

- Refresh `llms-full.txt` ([#e075ff1](https://github.com/deltabox-studio/toolchain/commit/e075ff1) by [T0chi](https://github.com/T0chi))
- Regenerate llms docs ([#c1bf94a](https://github.com/deltabox-studio/toolchain/commit/c1bf94a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Refresh the generated llms bundle after the 2.4.0 changelog and VS Code documentation updates.

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

### Package changes

#### Added
- `@deltabox/toolchain-biome`
  - `vite` `catalog:`
- `@deltabox/toolchain-changelog`
  - `vite` `catalog:`
- `@deltabox/toolchain-config`
  - `vite` `catalog:`
- `@deltabox/toolchain-core`
  - `vite` `catalog:`
- `@deltabox/toolchain-docs`
  - `vite` `^5.4.14`
- `@deltabox/toolchain-migrate`
  - `vite` `catalog:`
- `@deltabox/toolchain-project`
  - `vite` `catalog:`
- `@deltabox/toolchain-shared`
  - `vite` `catalog:`
- `@deltabox/toolchain-template`
  - `vite` `catalog:`
- `@deltabox/toolchain-tsconfig`
  - `@deltabox/toolchain-core` `workspace:*`
  - `vite` `catalog:`
- `@deltabox/toolchain-tsdown`
  - `vite` `catalog:`
- `toolchain-vscode`
  - `vite` `catalog:`

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

<details>
<summary>Documentation</summary>

- Regenerate llms docs ([#9b5869d](https://github.com/deltabox-studio/toolchain/commit/9b5869d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Refresh the generated llms.txt and llms-full.txt bundles after the documentation changes.

  </details>

</details>

<details>
<summary>Chores</summary>

- Regenerate managed configs for import sorting ([#ce7a2e6](https://github.com/deltabox-studio/toolchain/commit/ce7a2e6) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Regenerate .oxfmtrc.json and every workspace vite.config.ts with the resolved sortImports workspace group.

  </details>

#### Deps
- Update lockfile for @clack/prompts ([#52c08df](https://github.com/deltabox-studio/toolchain/commit/52c08df) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Record the new project workspace dependency so immutable CI installs no longer fail.

  </details>

</details>

### Package changes

#### Added
- `@deltabox/toolchain-project`
  - `@clack/prompts` `catalog:`

## 2.3.4 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Cache the VS Code integration test download ([#4941b90](https://github.com/deltabox-studio/toolchain/commit/4941b90) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The integration job downloaded the ~361 MB VS Code stable build on every run. Resolve the exact stable version, cache only that version's unpacked directory, and key the cache by it so a new stable release is downloaded and saved under a fresh key.

  </details>

</details>

## 2.3.3 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Disable setup-node auto-cache so Corepack can enable Yarn ([#571f896](https://github.com/deltabox-studio/toolchain/commit/571f896) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - actions/setup-node@v5 now auto-caches from the packageManager field and runs `yarn cache dir` before the Enable Corepack step, so every job failed with the global Yarn 1.22.22 error. Set package-manager-cache: false on every setup-node step; Corepack still enables the pinned Yarn/pnpm before install.

  </details>

</details>

<details>
<summary>Chores</summary>

#### Ci
- Bump checkout and setup-node actions to v5 ([#485f29d](https://github.com/deltabox-studio/toolchain/commit/485f29d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The runner warns that actions/checkout@v4 and actions/setup-node@v4 target Node 20 and are forced onto Node 24. Bump the generated workflows (and the dogfood config) to v5.

  </details>

</details>

## 2.3.2 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Load the tsdown base config from source ([#0537c62](https://github.com/deltabox-studio/toolchain/commit/0537c62) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The VS Code integration job builds the extension after only `yarn install`, so the private `@deltabox/toolchain-tsdown` dist does not exist and unrun failed to load the config. Import `baseTsdownConfig` from the workspace source instead (as the root tsdown config already does).

  </details>

</details>

## 2.3.1 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Validate webview messages and use a secure nonce ([#94bed68](https://github.com/deltabox-studio/toolchain/commit/94bed68) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The Home webview handler trusted the incoming shape and acted on arbitrary project paths, and the CSP nonce came from Math.random. Validate every message, only act on projects the dashboard listed, and generate the nonce from crypto.randomBytes.

  </details>

#### Vite
- Use the Oxlint rule name react/exhaustive-deps ([#ea02ef7](https://github.com/deltabox-studio/toolchain/commit/ea02ef7) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The dogfood config used the legacy ESLint name, so the generated Oxc configs carried both spellings. Rename it to the name in the vendored Oxlint schema and add a guard that every default rule exists there.

  </details>

#### Changelog
- Keep hash links when git history is incomplete ([#182b68a](https://github.com/deltabox-studio/toolchain/commit/182b68a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - A shallow clone or no-git checkout cannot resolve every referenced commit, so valid hashes were left unlinked. Fall back to treating letter-containing refs as commits when history is incomplete, and mock the numeric-hash fixture so the tests do not depend on the checkout's history.

  </details>

#### Config
- Contain generator output paths and render object metadata ([#fe94053](https://github.com/deltabox-studio/toolchain/commit/fe94053) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Scope names and file options were used as paths directly, so a `../` value could write outside the output directory. Resolve every generated file through a containment check. Also render an object node's own description/annotations before its child fields in per-scope markdown.

  </details>

- Derive the CLI reference from the registered commands ([#95dc39f](https://github.com/deltabox-studio/toolchain/commit/95dc39f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The docs generator kept its own command list, so a new builtin could be missing from the generated reference. Use `builtinCommands` (the CLI's source of truth) and mark registry-dependent provider passthroughs as hidden.

  </details>

#### Core
- Preserve .vscode settings comments when adding keys ([#9b4a105](https://github.com/deltabox-studio/toolchain/commit/9b4a105) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Merging VS Code settings parsed and reserialized the file, dropping its JSONC comments. Insert missing keys in place (preserving layout) and fall back to a full rewrite only when an existing value or array must change.

  </details>

#### Ci
- Check and regenerate nested workspace configs recursively ([#711c7b4](https://github.com/deltabox-studio/toolchain/commit/711c7b4) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The generated schema types are formatted at printWidth 300 and excluded from the formatter, but the ignore patterns were repo-root-relative. Per-workspace vp fmt resolves them from each package directory, so yarn format reformatted biome-config.ts and failed the artifact check. Use **/ globs and make the generated CI/sync workflows run dbx sync --check --recursive so stale workspace configs are caught and regenerated.

  </details>

</details>

## 2.3.0 (November 2026)

<details>
<summary>New features</summary>

#### Vscode
- Show the workflow provider in the run picker ([#af4cc3f](https://github.com/deltabox-studio/toolchain/commit/af4cc3f) by [T0chi](https://github.com/T0chi))

#### Changelog
- Dispatch workflows with their vendor CLI ([#eea38ae](https://github.com/deltabox-studio/toolchain/commit/eea38ae) by [T0chi](https://github.com/T0chi))

#### Config
- Generate Oxfmt and Oxlint types from vendored schemas ([#8ff5e90](https://github.com/deltabox-studio/toolchain/commit/8ff5e90) by [T0chi](https://github.com/T0chi))
- Accept complete GitHub, GitLab and Azure workflows ([#070a7f2](https://github.com/deltabox-studio/toolchain/commit/070a7f2) by [T0chi](https://github.com/T0chi))
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Escape CLI reference tables and fail on missing output ([#15978be](https://github.com/deltabox-studio/toolchain/commit/15978be) by [T0chi](https://github.com/T0chi))
- Respect secret defaults, `envPathOf` and changelog disabling ([#5cabab8](https://github.com/deltabox-studio/toolchain/commit/5cabab8) by [T0chi](https://github.com/T0chi))
- Keep named `$ref` schema properties ([#0aa03a1](https://github.com/deltabox-studio/toolchain/commit/0aa03a1) by [T0chi](https://github.com/T0chi))

#### Vscode
- Prefer CLI descriptors and sync all workspace roots ([#e68301a](https://github.com/deltabox-studio/toolchain/commit/e68301a) by [T0chi](https://github.com/T0chi))
- Report signal and timeout exits as failures ([#b7b1ad5](https://github.com/deltabox-studio/toolchain/commit/b7b1ad5) by [T0chi](https://github.com/T0chi))

#### Cli
- Forward passthrough flags and validate the update cache ([#a36d586](https://github.com/deltabox-studio/toolchain/commit/a36d586) by [T0chi](https://github.com/T0chi))
- Leave `reset --config` to the reset command ([#8a3fbec](https://github.com/deltabox-studio/toolchain/commit/8a3fbec) by [T0chi](https://github.com/T0chi))

#### Vite
- Surface sync failures and preserve config values ([#93ee933](https://github.com/deltabox-studio/toolchain/commit/93ee933) by [T0chi](https://github.com/T0chi))

#### Tsdown
- Write sorted package exports ([#3886a56](https://github.com/deltabox-studio/toolchain/commit/3886a56) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Read referenced configs as JSONC ([#49ded19](https://github.com/deltabox-studio/toolchain/commit/49ded19) by [T0chi](https://github.com/T0chi))

#### Migrate
- Surface unsupported and incomplete migrations ([#f50a5d2](https://github.com/deltabox-studio/toolchain/commit/f50a5d2) by [T0chi](https://github.com/T0chi))

#### Core
- Keep VS Code files user-owned and guard registry cycles ([#9ef027a](https://github.com/deltabox-studio/toolchain/commit/9ef027a) by [T0chi](https://github.com/T0chi))
- Keep watch sessions alive and re-sync config edits ([#2849757](https://github.com/deltabox-studio/toolchain/commit/2849757) by [T0chi](https://github.com/T0chi))
- Reject conflicting `--config` flags ([#1044f2a](https://github.com/deltabox-studio/toolchain/commit/1044f2a) by [T0chi](https://github.com/T0chi))
- Skip parent hooks for config-less workspaces ([#9658c36](https://github.com/deltabox-studio/toolchain/commit/9658c36) by [T0chi](https://github.com/T0chi))
- Keep managed paths inside the project root ([#2496bee](https://github.com/deltabox-studio/toolchain/commit/2496bee) by [T0chi](https://github.com/T0chi))

#### Shared
- Harden URL policy, merges and token replacement ([#bae1dc8](https://github.com/deltabox-studio/toolchain/commit/bae1dc8) by [T0chi](https://github.com/T0chi))
- Detect relative Windows `.cmd` shims ([#058430c](https://github.com/deltabox-studio/toolchain/commit/058430c) by [T0chi](https://github.com/T0chi))
- Restore `PowerShell`-escaped letters ([#4d2be6a](https://github.com/deltabox-studio/toolchain/commit/4d2be6a) by [T0chi](https://github.com/T0chi))

#### Changelog
- Fix workflow staging, `commitlint` and YAML escaping ([#1bb19ad](https://github.com/deltabox-studio/toolchain/commit/1bb19ad) by [T0chi](https://github.com/T0chi))
- Preserve formatting, links and workspace history ([#af5c5dc](https://github.com/deltabox-studio/toolchain/commit/af5c5dc) by [T0chi](https://github.com/T0chi))
- Restore the standalone bin and `--dry-run` handling ([#97ecef2](https://github.com/deltabox-studio/toolchain/commit/97ecef2) by [T0chi](https://github.com/T0chi))
- Preserve hand-corrected text in `--format-only` ([#2041e5f](https://github.com/deltabox-studio/toolchain/commit/2041e5f) by [T0chi](https://github.com/T0chi))
- Resolve hash links and preserve descriptions ([#7633d24](https://github.com/deltabox-studio/toolchain/commit/7633d24) by [T0chi](https://github.com/T0chi))
- Keep numeric hashes as commits and bold breaking markers ([#0521aee](https://github.com/deltabox-studio/toolchain/commit/0521aee) by [T0chi](https://github.com/T0chi))
- Unwrap descriptions and keep list items ([#0dc4bda](https://github.com/deltabox-studio/toolchain/commit/0dc4bda) by [T0chi](https://github.com/T0chi))

#### Project
- Validate workspace paths before writing ([#0ef515e](https://github.com/deltabox-studio/toolchain/commit/0ef515e) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Document vendor workflows, typed builders and `--format-only` ([#eb66982](https://github.com/deltabox-studio/toolchain/commit/eb66982) by [T0chi](https://github.com/T0chi))
- Normalize changelog links and breaking markers ([#c3875e4](https://github.com/deltabox-studio/toolchain/commit/c3875e4) by [T0chi](https://github.com/T0chi))
- Reflow changelog descriptions ([#bc6a40c](https://github.com/deltabox-studio/toolchain/commit/bc6a40c) by [T0chi](https://github.com/T0chi))

#### Config
- Document the open `WorkflowJob` type ([#779566b](https://github.com/deltabox-studio/toolchain/commit/779566b) by [T0chi](https://github.com/T0chi))

#### Changelog
- Document `formatLine` ([#61e28ec](https://github.com/deltabox-studio/toolchain/commit/61e28ec) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>CI</summary>

- Add VS Code integration job ([#18b2b7b](https://github.com/deltabox-studio/toolchain/commit/18b2b7b) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Changelog
- Update the lockfile bin entry ([#f946648](https://github.com/deltabox-studio/toolchain/commit/f946648) by [T0chi](https://github.com/T0chi))

#### Config
- Regenerate config-types, schema and docs ([#0b0ca20](https://github.com/deltabox-studio/toolchain/commit/0b0ca20) by [T0chi](https://github.com/T0chi))
- Shrink the generated `BiomeConfig` type ([#0522932](https://github.com/deltabox-studio/toolchain/commit/0522932) by [T0chi](https://github.com/T0chi))

#### Vscode
- Move mocha types to the default tsconfig ([#b604811](https://github.com/deltabox-studio/toolchain/commit/b604811) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Added
- `@deltabox/toolchain`
  - `@dprint/types` `^0.4.0`
  - `eslint` `^10.14.0`
  - `prettier` `^3.6.2`
- `@deltabox/toolchain-shared`
  - `@dprint/types` `catalog:`
  - `eslint` `catalog:`
  - `prettier` `catalog:`

## 2.2.0 (November 2026)

<details>
<summary>New features</summary>

#### Core
- Improve formatter/linter auto-detection ([#8324e9a](https://github.com/deltabox-studio/toolchain/commit/8324e9a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Prefer the project .vscode/settings.json, then the nearest workspace package.json/config file before walking to the root, and include tooling config files as detection candidates.

  </details>

</details>

<details>
<summary>Tests</summary>

#### Vscode
- Add extension host test setup ([#66aeda6](https://github.com/deltabox-studio/toolchain/commit/66aeda6) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add @vscode/test-cli/test-electron integration tests, a fixture workspace, build/debug launch tasks, source maps, and documented local test commands.

  </details>

</details>

### Package changes

#### Added
- `toolchain-vscode`
  - `@types/mocha` `^10.0.10`
  - `@vscode/test-cli` `^0.0.15`
  - `@vscode/test-electron` `^3.1.0`

## 2.1.3 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Core
- Read JSONC VS Code settings and bundle jsonc-parser ([#57d908d](https://github.com/deltabox-studio/toolchain/commit/57d908d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Parse .vscode/settings.json as JSONC so comments/trailing commas don't block editor defaults, and resolve jsonc-parser's ESM entry in the bundled dbx CLI to avoid the missing ./impl/format module.

  </details>

</details>

## 2.1.2 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Align Home action icons with provider commands ([#05fd6c8](https://github.com/deltabox-studio/toolchain/commit/05fd6c8) by [T0chi](https://github.com/T0chi))

</details>

## 2.1.1 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Changelog
- Use the release-notes helper for releases ([#36616f0](https://github.com/deltabox-studio/toolchain/commit/36616f0) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Replace the custom release workflow's awk/git-describe extraction with dbx changelog --release-notes, treat --release-notes as machine output, and normalize v-prefixed current versions.

  </details>

</details>

## 2.1.0 (October 2026)

<details>
<summary>New features</summary>

#### Changelog
- Configure breaking-change detection ([#f80634f](https://github.com/deltabox-studio/toolchain/commit/f80634f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Detect breaking changes by Conventional Commits rules by default (! in the subject or a **BREAKING CHANGE:** footer) and add a changelog.breaking / ci.changelog.breaking override (conventional, any, false, pattern/match, or a callback).

  </details>

</details>

## 2.0.1 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Always show builtin providers and templates ([#d67c2ad](https://github.com/deltabox-studio/toolchain/commit/d67c2ad) by [T0chi](https://github.com/T0chi))

#### Changelog
- Make release notes first-release safe ([#25e39ef](https://github.com/deltabox-studio/toolchain/commit/25e39ef) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Extract release bodies through a tested CLI helper that only uses tag versions present in CHANGELOG.md, skips the current version, and falls back to the newest entry when there is no prior release.

  </details>

- Group breaking changes first ([#c30d212](https://github.com/deltabox-studio/toolchain/commit/c30d212) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Detect subject and footer breaks, group them under the breaking section ahead of feat/fix, and keep the grouping with custom commit formatters and --format-only.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Auto-generate sidebar and reorganize guides ([#3485f53](https://github.com/deltabox-studio/toolchain/commit/3485f53) by [T0chi](https://github.com/T0chi))
- Document release-notes extraction ([#fcac0b8](https://github.com/deltabox-studio/toolchain/commit/fcac0b8) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Document dbx changelog --release-notes, the last-released-version matching and the first-release fallback.

  </details>

- Document breaking changes group order ([#5aa2397](https://github.com/deltabox-studio/toolchain/commit/5aa2397) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Note the default order (breaking, feat, fix) and that breaking grouping works with custom commit formatters.

  </details>

</details>

### Package changes

#### Added
- `@deltabox/toolchain-docs`
  - `vite-plugin-vitepress-auto-sidebar` `^1.7.1`

## 2.0.0 (October 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Config
- Revamp config generators and extend tooling customization ([#b924255](https://github.com/deltabox-studio/toolchain/commit/b924255) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - replace env-first ConfigScopes/ConfigScopeDef/render* APIs with ConfigSchema and generateConfig* functions (optional disk writes, schema metadata)
    - consolidate configSchema and remove duplicated schema maps/descriptions
    - support Zod and untyped Schema inputs with env/cli metadata
    - add markdown frontmatter customization and env/cli JSDoc output
    - add custom logger support and shorthand fmt/lint tool inference
    - add changelog bump rules, over-bump opt-in, and provider/commit options
    - **BREAKING CHANGE:** ConfigScopes, ConfigScopeDef, CONFIG_SECTION_SCHEMAS, CONFIG_TYPE_SCHEMAS and CONFIG_SECTION_DESCRIPTIONS are removed. Consumers should use ConfigSchema with generateConfigTypes/Env/Markdown/Cli/All and read section descriptions from schema metadata.

  </details>

- Move CI workflows and changelog config under toolchain.ci ([#af1b536](https://github.com/deltabox-studio/toolchain/commit/af1b536) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add the opt-in `ci` section for the ci/release/issues/changelog/sync workflows and move the changelog pipeline to `ci.changelog`.
    - Make every workflow setting opt-in; disable commitlint with `ci.changelog.commitlint: false` and fall back to coarse major/minor/patch changelog groups.
    - Move `types`/`scopes` to `ci.changelog.commitlint` and extract `ChangelogBranchesConfig` as a named schema.
    - Keep the old top-level `changelog` schema marked deprecated for older consumers, but reject it in the loader with a migration error.
    - Add `withEnabled()` to the schema model and split `config-schema.ts` into the `config-schema/` folder.
    - Rename the workflow types: the workflow map is `WorkflowConfig`, the per-workflow overrides are `WorkflowOptions`, and the new section type is `ToolchainCiConfig`.
    - Surface `.meta()` descriptions for `$ref` and object nodes in the generated types.

  </details>

</details>

<details>
<summary>New features</summary>

#### Changelog
- Customize CC group order and titles ([#856842b](https://github.com/deltabox-studio/toolchain/commit/856842b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Support ordered arrays, title records, hidden groups and callbacks for the whole group config and per-group title/order/hidden values, including --format-only.

  </details>

- Add custom workflow paths, listing and non-Yarn support ([#2e96e6e](https://github.com/deltabox-studio/toolchain/commit/2e96e6e) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - support `ci.custom.*` workflows with custom `filename`/`dir` and verbatim YAML
    - make `dbx workflow` honour dir/filename, include custom workflows, and add `--list [--json]`
    - use package-manager-aware CI setup and commands for yarn, pnpm, npm and bun
    - fix custom-workflow opt-out hints to `ci.custom.<id>` and preserve conflicts in the manifest
    - support Bun object-form workspaces and non-interactive changesets on Windows
    - keep changelog tests offline and document the `major`/`minor`/`patch` bump rules

  </details>

- Add a New contributors footer ([#1e49596](https://github.com/deltabox-studio/toolchain/commit/1e49596) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Detect first-time contributors by checking the authors before the scanned range (explicit range start, or the oldest commit's parent).
    - Render them as a footer with the contributor (linked when the GitHub login is known) and a nested list of their commit messages, reusing the normal commit bullet formatting without the author/body.
    - Keep the same formatting in the commitlint-disabled fallback summary; only the CC rule/scope grouping is replaced by major/minor/patch.

  </details>

#### Config
- Type changelog group callbacks ([#a5c6186](https://github.com/deltabox-studio/toolchain/commit/a5c6186) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add the shared ChangelogGroupsSetting types, expose groups on both changelog sections, and regenerate the config schema/types/reference.

  </details>

- Support metadata annotations in generated output ([#1417bb2](https://github.com/deltabox-studio/toolchain/commit/1417bb2) by [T0chi](https://github.com/T0chi))
- Add fmt/lint sections and manual changelog config ([#16000e5](https://github.com/deltabox-studio/toolchain/commit/16000e5) by [T0chi](https://github.com/T0chi))
- Inherit shared sections and add fmt/lint defaults ([#94add6f](https://github.com/deltabox-studio/toolchain/commit/94add6f) by [T0chi](https://github.com/T0chi))
- Registry source policies and duplicate template-id prompts ([#e030af7](https://github.com/deltabox-studio/toolchain/commit/e030af7) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add `toolchain.registry.{templates,providers}` with `allow`/`deny` host and path globs, enforced for local paths, npm registries and remote URLs (also when loading global/remote registries and the provider/registry listings).
    - Prompt for a unique template id when `template:add` collides with a builtin or project source; non-interactive runs fail with a clear `--id` hint instead of prompting.
    - Add `--id` to `template:add`, policy tests and the generated reference plus Templates/Providers docs.

  </details>

- Ambient Zod meta types and project-tsconfig typechecks ([#e73661b](https://github.com/deltabox-studio/toolchain/commit/e73661b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Export `@deltabox/toolchain/globals` so a consumer can add `/// <reference types="@deltabox/toolchain/globals" />` and get typed `.meta({ env, path, required, example, ... })` fields.
    - Add the shared/config ambient declarations and make `ConfigBaseMeta.deprecated` the JSON-Schema boolean.
    - Run the root and every workspace typecheck against `tsconfig.json` instead of `tsconfig.build.json`.

  </details>

- Let defineConfig accept a promise or a callback ([#111776c](https://github.com/deltabox-studio/toolchain/commit/111776c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `defineConfig` now mirrors Vite's helper: the argument may be a plain object, a `Promise<DbxConfig>`, or a `() => DbxConfig | Promise<DbxConfig>` callback. The loader resolves the module export (awaits a promise, calls a callback and awaits its result), so a config can do async work before returning `{ toolchain }`.

  </details>

#### Vscode
- Surface workflow conflicts in managed files ([#e692511](https://github.com/deltabox-studio/toolchain/commit/e692511) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Read workflowConflicts from the manifest and render them as a warning group with the owning config key.

  </details>

- Watch the inputs resolved from the dbx config ([#953f071](https://github.com/deltabox-studio/toolchain/commit/953f071) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - drop the hard-coded `tsconfig.default.json` / `tsconfig.workspaces.json` watch globs: auto-sync now asks the CLI (`dbx watch --list --json`) per workspace root and watches the returned globs relative to that root, so custom `tsconfig.rootFile`/`defaultFile` names are respected
    - re-resolve the inputs (debounced) whenever a `dbx.config.*` changes, and ignore stale results from an older resolve
    - fall back to the default inputs when the CLI cannot report them (eg. an older pinned `dbx`)
    - `deltabox.toolchain.watch` now defaults to `[]` (resolved); an explicitly set value, in any scope, still replaces the resolved inputs
    - detect workspace projects with the resolved `defaultFile` instead of `tsconfig.default.json`
    - unit-test the parsing and watch planning (`watch-inputs.ts`) and document the behaviour

  </details>

- Add extension settings link to Home ([#f39cb35](https://github.com/deltabox-studio/toolchain/commit/f39cb35) by [T0chi](https://github.com/T0chi))
- Add Select dbx version to the Home More actions ([#13ef688](https://github.com/deltabox-studio/toolchain/commit/13ef688) by [T0chi](https://github.com/T0chi))
- Add the Registries view ([#e3e808e](https://github.com/deltabox-studio/toolchain/commit/e3e808e) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - A new collapsible **Registries** view (below Templates) shows **Providers** and (explorer folder or browser for remote URLs), **Add new registry** (the category's add flow) and **Remove registry** (removes the path, keeps the files). The title bar has **New registry...** / **Remove registry...** (global or project scope), also available in the Home "More actions". Removing a template now offers the stored global templates too (`template:remove --global`).

  </details>

- Rename registry paths, add a version picker and UI polish ([#9c8b51c](https://github.com/deltabox-studio/toolchain/commit/9c8b51c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Rename `templatesSearchPaths` to `registrySearchPaths` (VS Code setting, CLI config and code).
    - Show the detected project/extension `@deltabox/toolchain` versions in the "which dbx?" notification, only ask when they differ, and add a **Select dbx version...** command that pins one in the workspace settings (npx fallback).
    - Replace the Home "Run Vite+..." quick action with **Add provider...** (also in More actions), prefix More-actions buttons with a play glyph, start Managed Files collapsed, expand the Vite+ provider by default, and drop unused icon resources.

  </details>

- Sync the global registry with the VS Code settings ([#86a0671](https://github.com/deltabox-studio/toolchain/commit/86a0671) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add the `deltabox.templatesSearchPaths` setting, record the VS Code user dir in the CLI config on activation, and mirror setting changes into it (so the CLI and editor agree). Adding a template now asks whether to register it globally (yes by default), and adding a provider asks for a project or global scope; the Providers view reads the merged registry.

  </details>

#### Project
- Inherit root Oxc config and harden scaffolds ([#56a1895](https://github.com/deltabox-studio/toolchain/commit/56a1895) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Nested projects omit local Oxc files/opt-ins when the root owns them, template create gains --force, and scaffold writes now reject duplicates, BOM catalogs and root scope fallbacks are handled.

  </details>

- Make scaffolds runnable and safer ([#eab297b](https://github.com/deltabox-studio/toolchain/commit/eab297b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - generate runnable `src/index.ts` + smoke tests, real Vite application entries and tsdown exports
    - write the selected package-manager catalog and keep scaffold defaults in sync with the toolchain
    - wire monorepo root tsconfigs, workspace refs and JSONC-preserving tsconfig updates
    - honour `--no-config`, add `--force`, and refuse to overwrite files or write outside the output directory
    - expand builtin template inputs/actions and only resolve online templates when `--online` is set
    - add `jsonc-parser`, update `yarn.lock`, and refresh the tsconfig templates

  </details>

- Fold an existing vite config when generating a config ([#5891154](https://github.com/deltabox-studio/toolchain/commit/5891154) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `project:config` now checks for a hand-written `vite.config.*` and folds its literal props into the generated `dbx.config.ts`'s `toolchain.vite` (using the vite migration's extract/scan/fold helpers), adding the `/vite.config.ts` fmt ignore. A non-foldable config is reported and left alone. The VS Code "Generate config" actions run `dbx sync` afterwards so the managed shim is written.

  </details>

#### Core
- Resolve watched inputs from the config and add `dbx watch --list` ([#0ab08a9](https://github.com/deltabox-studio/toolchain/commit/0ab08a9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - add `resolveWatchGlobs(tasks, config, projectType?)`: the active tasks' `watch` globs with function forms resolved (eg. custom `tsconfig.rootFile`/`defaultFile` names); `runWatch` now uses it, so only the inputs of tasks that actually run are watched
    - add `dbx watch --list [--json]`, printing the resolved input globs plus the resolved tsconfig file names (`{ globs, tsconfig }`) without watching
    - emulate the report for the default names, custom names and a config without a `tsconfig` section

  </details>

- Untracked managed files, config-derived task globs and a reset restore hook ([#5da6691](https://github.com/deltabox-studio/toolchain/commit/5da6691) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `ManagedFile.track: false` writes and drift-checks a file without recording it in the manifest, so a user-owned file a task patches is never pruned by a later sync or removed by `dbx reset`
    - `SyncTask.watch` / `SyncTask.keep` accept `config => string[]`, so globs can follow configured file names
    - `SyncContext.manifest` persists task metadata in the manifest between syncs (written before `files`/`origins`, which it can never clobber), and `SyncContext.check` flags `dbx sync --check`
    - `resetToolchain` / `resetProjects` take a `restore` hook that runs before the manifest is removed and report the `restored` files

  </details>

- Provider registry search paths and safer managed-file sync ([#4033009](https://github.com/deltabox-studio/toolchain/commit/4033009) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Load providers from project/global search paths (JSON files, dirs or http(s) URLs), keeping the legacy provider files for compatibility.
    - Add provider search-path management to `dbx registry` (`--kind providers`, `--set`, `--clear`), the CLI config and the VS Code `deltabox.providerRegistrySearchPaths` setting; the Registries view now manages both kinds and the Providers view can fetch remote registries through `loadToolchainProviders()`.
    - Track whether a managed file was created by dbx or adopted from a pre-existing file. Adopted files are unmanaged, never deleted.
    - `dbx sync --json` reports the sync result (including removed files and their previous content); the extension shows a notification listing removed files with Restore/Close.

  </details>

- Merge global providers with the project registry ([#81c510b](https://github.com/deltabox-studio/toolchain/commit/81c510b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Providers can live in `~/.dbx/toolchain/.registry/providers.json` too. `readAllProviders` merges them with the project's `.dbx/toolchain/providers.json` (project wins on an id clash), and the CLI's provider list and passthrough commands use it so a global provider works in every project.

  </details>

#### Tsconfig
- Resolver, `extends`/`baseFile` options and snapshot-backed overrides ([#2b38963](https://github.com/deltabox-studio/toolchain/commit/2b38963) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - add an extends-aware `resolveTsconfig` (+ `readTsconfig`/`parseTsconfig` for JSONC) and `dbx tsconfig --json/--alias/--paths/--references/--tsconfig/--root/--no-extends`; the generator now resolves the workspaces tsconfig through it
    - add `tsconfig.extends` for the `extends` of scaffolded base/default/build templates, and `tsconfig.baseFile` for the root base tsconfig
    - add `tsconfig.overrides` (`base`, `root`, `default`, `build`): deep-merged into the user-owned tsconfigs on sync, honouring custom `baseFile`/`rootFile`/`defaultFile`/`buildFile` names (also in the task's watched/kept globs and in `dbx tsconfig`)
    - snapshot the original files in the manifest's top-level `snapshots` tree (repo-relative paths only) and record the applied override per file in `tsconfigOverrides`; removing a key restores the snapshot value when the original defined it, otherwise removes it (pruning emptied parents), and keeps a value edited after the override applied it
    - warn (`tsconfig.missing-file`, `tsconfig.outside-root`, `tsconfig.override-edited`) and skip instead of creating missing targets; patched files are untracked, so sync/reset never delete them
    - add `dbx tsconfig --restore [base|root|default|build]` (`restoreTsconfigOverrides`), warning with `tsconfig.restore-reapply` while the overrides are still configured; `dbx reset` restores before removing the manifest
    - type the override bodies as `TsConfigJson` (`type-fest` is now a dependency)
    - cover the overrides with unit and emulate tests

  </details>

#### Vite
- Add static shims and a configurable shim import ([#bddcb62](https://github.com/deltabox-studio/toolchain/commit/bddcb62) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `vite.shim: 'static'` serializes the resolved `toolchain.vite` config into the generated `vite.config.ts`, so Vite+ can load it without a built `@deltabox/toolchain` (rejects functions, regexps and class instances)
    - `vite.shimImport` changes the `resolveVite` import specifier of runtime shims; relative values resolve from the repo root and are rewritten per generated config
    - type both options in `ToolchainViteConfig` and document them

  </details>

- Preserve existing imports/comments when regenerating the shim ([#194461c](https://github.com/deltabox-studio/toolchain/commit/194461c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `renderViteConfig` now accepts the existing `vite.config.ts` source: it keeps the file's leading comments and import statements and merges `defineConfig` (and the config type) into the existing `vite`/`vite-plus` import, preserving default, namespace, other named and type-only specifiers. Regeneration is idempotent, and the sync task feeds the current file in so a custom import block/comment is not dropped.

  </details>

- Detect the project's vite package and allow resolveVite overrides ([#dfaedee](https://github.com/deltabox-studio/toolchain/commit/dfaedee) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The generated `vite.config.ts` shim now imports `defineConfig` (and its config type) from whichever package the project installs — `vite` or `vite-plus` — detected from `package.json` and walking up so a hoisted workspace dependency resolves. `resolveVite` is generic so the shim type-checks against both, and `ResolveViteOptions` now carries inline `vite` overrides that are deep-merged over the loaded section.

  </details>

#### Migrate
- Add Oxc migration and repeatable --from ([#0f6930d](https://github.com/deltabox-studio/toolchain/commit/0f6930d) by [T0chi](https://github.com/T0chi))

#### Cli
- Add config selection and logger suppression ([#9b69e3f](https://github.com/deltabox-studio/toolchain/commit/9b69e3f) by [T0chi](https://github.com/T0chi))

#### Template
- Re-prompt on duplicate ids in init and the editor ([#a4d7cde](https://github.com/deltabox-studio/toolchain/commit/a4d7cde) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `template:init --add` checks builtin + project ids, prompts for a unique one (or fails with an `--id` hint when non-interactive), and accepts `--id`.
    - The VS Code Add provider flow suggests and validates a renamed id when the provider already exists, updating its command names too.

  </details>

- Unscoped npm packages, custom registries and remote sources ([#08cb68c](https://github.com/deltabox-studio/toolchain/commit/08cb68c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Support scoped (`@scope/create`) and unscoped (`create-*`, `*-create`) npm create packages. The registry defaults to the project package manager's (`npmRegistryServer` / `.npmrc`) and can be overridden per source with `--registry` or the new `ToolchainTemplateSource.registry`.
    - Add the `remote` template source type: an `http(s)` JSON source registry whose `{ sources }` / `{ templates }` / array is merged recursively.
    - Refresh the generated schema/types/reference and the online template docs.

  </details>

- Add project registries, registry listing and global removal ([#ff3cd16](https://github.com/deltabox-studio/toolchain/commit/ff3cd16) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Project-scoped registries live in `.dbx/toolchain/registries.json` and default to `<project>/.dbx/toolchain/.registry/templates`; the project paths are resolved before the global ones (remote `http(s)` entries are kept as URLs).
    - `listRegistries(cwd)` exposes the detected template/provider registries, the `dbx registry` command lists them (`--json`) and adds/removes template paths (`--add`/`--remove`, `--scope global|project`).
    - `dbx template:list --global` and `dbx template:remove --global <id>` list and remove stored global templates; remote registries accept `{ sources }`, `{ templates }` or an array of sources.

  </details>

- Add a global template registry ([#638dd3b](https://github.com/deltabox-studio/toolchain/commit/638dd3b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Templates registered with `template:init --add`/`template:add` are also stored under `~/.dbx/toolchain/.registry/templates` (unless `--no-global`), so they are available in every project and the VS Code extension. Global templates merge with the project's own (project wins on an id clash).
    - Search paths default to that directory and can be configured as a string/array of directories or `http(s)` remote registries. They live in `~/.dbx/toolchain/cli/config.json` (`templatesSearchPaths`, plus a `vscodeDir` pointing at the VS Code user dir) and are managed with the new `dbx template:registry` command (`--add`/`--set`/`--remove`/`--clear`), which also writes the VS Code `deltabox.templatesSearchPaths` setting.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Cli
- Filter denied providers at registration ([#74c49bb](https://github.com/deltabox-studio/toolchain/commit/74c49bb) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Load the registry policy before registering provider commands, and make config-flag extraction work for argv without a node/script prefix.

  </details>

- Preserve provider flags and emit clean machine output ([#8f6c404](https://github.com/deltabox-studio/toolchain/commit/8f6c404) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - leave `--config`/`--no-config` untouched after a provider/Vite+ passthrough
    - share the registered command set between dispatch, default Vite routing and config extraction
    - honour `watch: false` and treat `template:info` as machine output
    - recognise `--alias`/`--paths`/`--references` when deciding whether to run the update check
    - enforce `toolchain.registry.providers` when running custom provider passthroughs
    - add config-selection tests for flags before/after commands and after `--`

  </details>

#### Config
- Support boolean formatter and linter opt-ins ([#d99384b](https://github.com/deltabox-studio/toolchain/commit/d99384b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Allow true/false for every fmt/lint tool, honour explicit biome opt-outs, and ignore disabled biome overrides.

  </details>

- Honour disabled sections and regenerate config types ([#dddd9a7](https://github.com/deltabox-studio/toolchain/commit/dddd9a7) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - treat an explicit `false` formatter/linter as disabled instead of configured
    - skip Vite, Biome and editor defaults when their section is `enabled: false`
    - strip toolchain-only keys (`enabled`) from the resolved Vite config
    - resolve package-manager default versions from the shared token model
    - keep catalogs out of nested config inheritance
    - add the custom `logger.logger` field to the schema and generated types
    - read UTF-8 BOM-prefixed JSON and fix record rendering in generated markdown
    - regenerate `config-types.ts` and its generator override

  </details>

- Keep union, enum and nested types in the combined markdown reference ([#2eaa373](https://github.com/deltabox-studio/toolchain/commit/2eaa373) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The combined (`combined: true`) markdown renderer received the untyped lowering of Zod scopes, which collapses unions/enums to `any` with a `{}` default. Render Zod scopes from `toJSONSchema` instead (resolving the root `$ref` into `$defs`), so the reference shows real types and nested options again.

  </details>

- Finish generator ergonomics and changelog customization ([#38f6d5b](https://github.com/deltabox-studio/toolchain/commit/38f6d5b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - infer config type names from schema metadata and generate types from dbxConfigSchema
    - move JSON Schema metadata normalization into the config generator API
    - use the config engine in the dogfood generation scripts
    - rename requiredEnvVars to requiredVars and writeMarkdown outDir to outputDir
    - wire changelog commit credits/formatter options, custom providers and changesets
    - add the v1 to v2 migration guide and an end-to-end shorthand/custom-logger test

  </details>

#### Changelog
- Honour workflow token overrides and disabled ci ([#de266dd](https://github.com/deltabox-studio/toolchain/commit/de266dd) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Use the overridden package manager's version, honour legacy yarnVersion, and ignore workflow paths when ci is disabled.

  </details>

#### Core
- Reload edited code configs in watch ([#10ba473](https://github.com/deltabox-studio/toolchain/commit/10ba473) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Cache-bust the ESM/CJS config import when watch reloads, and add loader + live watch coverage.

  </details>

- Protect adopted files, keep check read-only and reload watch config ([#c6fe500](https://github.com/deltabox-studio/toolchain/commit/c6fe500) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - make `dbx reset` skip files recorded as adopted instead of deleting user-owned files
    - stop `dbx sync --check` from writing `.vscode/settings.json`
    - persist arbitrary task metadata in the manifest and round-trip it through `SyncContext`
    - reload the config and rebuild the watched inputs when a `dbx.config.*` changes
    - read BOM-prefixed project graphs and extend the emulation coverage

  </details>

#### Vscode
- List custom workflows and read BOM-prefixed manifests ([#2f62b47](https://github.com/deltabox-studio/toolchain/commit/2f62b47) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - build the Run workflow picker from `dbx workflow --list --json`, including `ci.custom` workflows
    - pass `--online` when creating an online template so npm/git templates still resolve
    - read project graphs/manifests written with a UTF-8 BOM

  </details>

- Use the default provider registry path and clarify template docs ([#017cfe6](https://github.com/deltabox-studio/toolchain/commit/017cfe6) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Make sync generation quiet, one-pass and non-fatal ([#f0d7663](https://github.com/deltabox-studio/toolchain/commit/f0d7663) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - route generation logs through a caller-supplied sink so `dbx sync --json`/`--quiet` stays clean
    - keep project references when the target tsconfig is generated in the same run
    - throw instead of calling `process.exit` from library code
    - cover first-run reference wiring in the generator tests

  </details>

#### Ci
- Keep the build tsconfigs for CI typechecks ([#b1502ad](https://github.com/deltabox-studio/toolchain/commit/b1502ad) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Revert the package/root `typecheck` tasks to `tsconfig.build.json`.
    - Add `typecheck:ci` (the old build-based pipeline) for CI and run it in the generated CI workflow.
    - Make `yarn typecheck` a development-only workspace check that uses the root + package `tsconfig.json` (including tests).

  </details>

#### Migrate
- Deep-merge the folded vite config ([#f74d2ed](https://github.com/deltabox-studio/toolchain/commit/f74d2ed) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Folding a hand-written `vite.config.*` into an existing `toolchain.vite` now deep-merges object literals (nested objects combine; arrays/scalars from the vite config win) instead of replacing the section, and flips a previous `config: false` to `true` since the hand-written file is removed.
    - Also fixes `findTopLevelValue` so a scalar last key no longer swallows the object's closing `}`, updates the managed-shim detection for the generic `resolveVite<T>(...)` form, and corrects the "nothing to migrate" message when the migration is registered but no source is detected.

  </details>

</details>

<details>
<summary>Refactors</summary>

- Run quality checks through vp tasks ([#2fee264](https://github.com/deltabox-studio/toolchain/commit/2fee264) by [T0chi](https://github.com/T0chi))
- Run build and test through vp tasks too ([#e890665](https://github.com/deltabox-studio/toolchain/commit/e890665) by [T0chi](https://github.com/T0chi))
- Run typechecks through vp tasks (dev vs CI tsconfigs) ([#7b3420b](https://github.com/deltabox-studio/toolchain/commit/7b3420b) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Document changelog group customization ([#5443ea0](https://github.com/deltabox-studio/toolchain/commit/5443ea0) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Cover ordered groups, custom titles, hidden groups and callback examples for manual and CI changelog config.

  </details>

- Document nested Oxc inheritance and workflow token versions ([#4f43cd9](https://github.com/deltabox-studio/toolchain/commit/4f43cd9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Cover scaffold --force, root Oxc inheritance, boolean tool opt-ins, workflow package-manager version defaults and the managed-file conflict group.

  </details>

- Regenerate config artifacts and document the fixes ([#9be4d73](https://github.com/deltabox-studio/toolchain/commit/9be4d73) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - include the manual `toolchain.changelog` section in the generated dbx.config reference
    - document custom workflow paths/listing, `ci.custom` opt-out and scaffold `--force`/safety
    - clarify `project.type` handling, inherited sections, watch reload, editor settings and versioning rules
    - regenerate `config/cli.md`, `config/reference.md`, the JSON schema and `llms-full.txt`

  </details>

- Document tsconfig overrides, snapshots and `--restore` ([#dad4084](https://github.com/deltabox-studio/toolchain/commit/dad4084) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `guide/tsconfig.md`: `baseFile`, custom file names, overrides (deep merge, snapshots, removal rules, restoring, warnings) and the new CLI flags/exports
    - `migration-v1-v2.md`: overrides, manifest `snapshots`/`tsconfigOverrides`, the sync task API additions and an upgrade step
    - note the override revert in the `dbx reset` / `dbx tsconfig` CLI docs and the package reference
    - regenerate `config/reference.md`, `config/cli.md`, `config.schema.json` and `llms-full.txt`

  </details>

- Document v2 generators, custom logger and changelog customization ([#f0f7f5d](https://github.com/deltabox-studio/toolchain/commit/f0f7f5d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - refresh config-generator/package-reference APIs (ConfigSchema, generateConfig*)
    - document markdown frontmatter, env/cli metadata and include flags
    - document custom logger support
    - document changelog bump rules, commit credits and providers

  </details>

- Update README highlights and regenerate LLM docs ([#6380770](https://github.com/deltabox-studio/toolchain/commit/6380770) by [T0chi](https://github.com/T0chi))
- Add the CI guide, TypeScript page and interactive CLI sections ([#fc6099a](https://github.com/deltabox-studio/toolchain/commit/fc6099a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Move the workflow/release pages from the Changelog guide into a new `guide/ci/` section (overview + settings + ci/issues/changelog/sync/ releases) and retitle the overview to "CI".
    - Add `guide/typescript.md` (defineConfig, config types, ambient Zod metadata, programmatic API, Vite+ generics).
    - Add `## Interactive CLI` sections and update the provider registry, VS Code sync notification and CLI `sync --json` docs.
    - Refresh the LLM bundles.

  </details>

- Split the config, API, config-generator and changelog guides ([#4153d86](https://github.com/deltabox-studio/toolchain/commit/4153d86) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Turn `guide/api.md`, `guide/config.md`, `guide/config-generator.md` and `guide/changelog.md` into folders with an index + one sibling page per second-level section.
    - Retitle the changelog index to "Changelog" and move Workflows, Branches, commitlint, Versioning, CLI, writing messages, Troubleshooting and Releases into sibling pages.
    - Document the new `toolchain.ci` / `ci.changelog` structure, opt-in workflows, the commitlint opt-out fallback and the migration from the deprecated top-level `changelog` section.
    - Update sidebar entries, cross-links, the generated reference and the LLM bundles.

  </details>

- Document the Registries view, project registries and dbx version picker ([#752d1cd](https://github.com/deltabox-studio/toolchain/commit/752d1cd) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Cover `registrySearchPaths`, project registries, the `registry` command, remote registries, the Registries view/actions, and the extension's version selection.

  </details>

- Document the global template/provider registry ([#55651e1](https://github.com/deltabox-studio/toolchain/commit/55651e1) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Cover the global templates dir, `--no-global`, the `template:registry` command, the CLI config and `deltabox.templatesSearchPaths` sync, remote registries, and global providers.

  </details>

- Document defineConfig callbacks, shim detection and deep-merge migration ([#701de7c](https://github.com/deltabox-studio/toolchain/commit/701de7c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Cover `defineConfig` promises/callbacks, the shim importing from the project's vite package, inline `resolveVite` overrides, and the vite migration deep-merging into `toolchain.vite`.

  </details>

#### Vscode
- Document extension requirements ([#07fd6fa](https://github.com/deltabox-studio/toolchain/commit/07fd6fa) by [T0chi](https://github.com/T0chi))

#### Config
- Generate CLI, env and config-type references ([#ba640a3](https://github.com/deltabox-studio/toolchain/commit/ba640a3) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add `scripts/generate-config-docs.ts` (wired into `config:generate` and `config:docs`) to generate `apps/docs/config/index.md`, `cli.md` from the ToolchainCommand descriptors, and `env.md` from ConfigMeta.
    - Add the three pages to the config sidebar and frontmatter outlines.
    - Extend the CI drift check to cover the new generated files.

  </details>

</details>

<details>
<summary>Tests</summary>

- Run the emulate suite in a temp sandbox outside the repo ([#a94fa4c](https://github.com/deltabox-studio/toolchain/commit/a94fa4c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - create the scratch workspaces under `<tmp>/dbx-emulate-*` (with a `node_modules` link back to the repo install) instead of `tests/emulate`, so a stray sync can never touch the toolchain repo
    - snapshot and restore the repo's managed files (not only the manifest) after every test, and clean up on `SIGHUP`/`SIGBREAK` too
    - add `yarn test:clean` (`scripts/clean-emulate.mjs`) to remove leftover sandboxes
    - update the README development section (source-first workflow, `test:clean`)

  </details>

- Cover provider search paths, registry policy and remote sources ([#91a5859](https://github.com/deltabox-studio/toolchain/commit/91a5859) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Build system</summary>

- Run typechecks, tests and Vite+ from source without a built `dist` ([#4353a36](https://github.com/deltabox-studio/toolchain/commit/4353a36) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - alias `@deltabox/toolchain` (+ subpaths) to `src` in `tsconfig.workspaces.json` and regenerate every workspace `tsconfig.json`, so typechecks resolve workspace source instead of `dist`
    - enable `resolve.tsconfigPaths` for Vite/Vitest (root + every workspace)
    - dogfood `vite.shim: 'static'`, so `vp` loads the generated shims without building the package first
    - drop the `typecheck:ci` script, tasks and CI step; `typecheck` already runs the source tsconfigs
    - apply pending formatter output to the config/changelog sources

  </details>

</details>

<details>
<summary>Chores</summary>

- Fix lint warnings and remove unused helper ([#ac890d8](https://github.com/deltabox-studio/toolchain/commit/ac890d8) by [T0chi](https://github.com/T0chi))
- Add lint and check vp tasks to every workspace ([#83bb7e5](https://github.com/deltabox-studio/toolchain/commit/83bb7e5) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Added
- `@deltabox/toolchain`
  - `jsonc-parser` `^3.3.1`
- `@deltabox/toolchain-project`
  - `@deltabox/toolchain-migrate` `workspace:*`
  - `jsonc-parser` `^3.3.1`
- `@deltabox/toolchain-template`
  - `@deltabox/toolchain-core` `workspace:*`

#### Removed
- `@deltabox/toolchain-project`
  - `@deltabox/toolchain-biome` `workspace:*`

## 1.11.4 (October 2026)

<details>
<summary>Documentation</summary>

- Updated misleading docs ([#5a5e44c](https://github.com/deltabox-studio/toolchain/commit/5a5e44c) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Vscode
- Rearranged views order ([#0620097](https://github.com/deltabox-studio/toolchain/commit/0620097) by [T0chi](https://github.com/T0chi))

</details>

## 1.11.3 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Emit the dbx.config.ts fence title in the generated reference ([#d154039](https://github.com/deltabox-studio/toolchain/commit/d154039) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `apps/docs/config/reference.md` is generated by `scripts/generate-config.ts` (and the CI `Verify generated config artifacts are up to date` step), so its "Full example" fence must be produced by the generator. The docs rebrand added a `[dbx.config.ts]` title to that fence by hand, which `yarn config:generate` then stripped, failing the drift check. Emit the title from the generator so the regenerated (and formatted) file matches the committed one.

  </details>

</details>

<details>
<summary>Styles</summary>

- Format the docs brand stylesheet ([#fb3a711](https://github.com/deltabox-studio/toolchain/commit/fb3a711) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Run the formatter over `apps/docs/.vitepress/theme/style.css` (trailing whitespace, indentation, numeric normalization) so `yarn format` no longer dirties the tree.

  </details>

</details>

## 1.11.2 (October 2026)

<details>
<summary>Chores</summary>

- Update `README.md` ([#3e7f4e1](https://github.com/deltabox-studio/toolchain/commit/3e7f4e1) by [T0chi](https://github.com/T0chi))

</details>

## 1.11.1 (October 2026)

<details>
<summary>Bug fixes</summary>

- Write scaffold files only at the end and resolve "." names ([#c01fcf3](https://github.com/deltabox-studio/toolchain/commit/c01fcf3) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Two scaffolding robustness fixes:
    - A scaffold now writes nothing until every prompt has been answered. Cancelling any prompt (scope, package manager, include-config, the folder picker) aborts the whole command instead of falling back to a default and creating orphan files/dirs. The local-template copier also reads and renders the entire tree into memory before writing, so a failed or interrupted run can never leave a half-copied template.
    - A project/workspace name of `.` resolves to the basename of the directory it is created in (`--out`/`--root`), so `dbx create --name . --out ./my-app` names the package `my-app`.
    - Tests: emulate the `.` name through both `create` and `project:init`.

  </details>

#### Shared
- Quote a Windows command path that contains spaces ([#2e1f2ab](https://github.com/deltabox-studio/toolchain/commit/2e1f2ab) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `spawnCross` routes every Windows command through `cmd.exe`, which splits an unquoted command at whitespace, so an absolute path like `C:\Program Files\nodejs\node.exe` was resolved as `C:\Program` and never ran. Quote the command when it contains whitespace instead of caret-escaping the space (which `cmd.exe` still splits on). The same fix is mirrored in the extension's `win-spawn` port.
    - Tests: a functional case that hardlinks `node.exe` into a space-containing temp dir and runs it, plus unit assertions for `escapeCmdCommand`.

  </details>

#### Vscode
- Run template create without a shell so npm scopes survive ([#0863cf2](https://github.com/deltabox-studio/toolchain/commit/0863cf2) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `createFromTemplate` sent online/Vite+ creates to an integrated terminal as a shell string. On PowerShell a bare `@scope` is read as splatting (`@deltabox` -> splat of an undefined variable), so the value was dropped and commander failed with `option '-s, --scope <scope>' argument missing`.
    - Run every template through the same argv pipeline (`runCli`, no shell) so values like an npm scope are never mangled. Vite+ projects skip the post-create sync since they are not dbx-managed.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Updated `vscode-example.mp4` ([#58c0061](https://github.com/deltabox-studio/toolchain/commit/58c0061) by [T0chi](https://github.com/T0chi))
- Rebrand to the new logo and blue theme ([#e28c1f9](https://github.com/deltabox-studio/toolchain/commit/e28c1f9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Swap the toolchain/box2d logos for the new `logo/*` assets, re-theme the site with the blue brand tokens and hero/logo animations, update the home page (GitHub action, feature icons), and refresh the guide/reference copy and code fences. Regenerated `llms.txt` / `llms-full.txt`.

  </details>

- Adopt the Carbon theme with code-group icons ([#09b2608](https://github.com/deltabox-studio/toolchain/commit/09b2608) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Build the docs on vitepress-carbon: spread its base config and override `vite.plugins` so the LLM plugin runs once (with our copy instead of Carbon's default), add `vitepress-plugin-group-icons` for language icons on `::: code-group` / `[title]` blocks, and register the theme. Also refresh the year/footer config. Adds the two dev dependencies.

  </details>

- Rename the "LLM context files" page to "LLMs" ([#9a9e8c7](https://github.com/deltabox-studio/toolchain/commit/9a9e8c7) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Vscode
- Rebrand the extension icon and README ([#bbde675](https://github.com/deltabox-studio/toolchain/commit/bbde675) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Point the extension icon at the new `resources/logo.png` / `icon.svg`, drop the old `icon.png` / `logo.svg`, and update the README with the new banner.

  </details>

</details>

### Package changes

#### Added
- `@deltabox/toolchain-docs`
  - `vitepress-carbon` `^1.7.0`
  - `vitepress-plugin-group-icons` `^1.8.1`

## 1.11.0 (October 2026)

<details>
<summary>New features</summary>

#### Vscode
- Scaffold any template and drive Vite+ create from the extension ([#fb4a55c](https://github.com/deltabox-studio/toolchain/commit/fb4a55c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - List every template (builtin + local + npm/git + Vite+) in the "Scaffold project" picker (`template:list --online`) instead of only the dbx builtins; each entry runs the same create pipeline (name/scope/variables/actions).
    - Route `vite:create` — from the Vite+ command picker, the provider tree and the bare `vite-plus` template — through the extension's prompt pipeline: pick a concrete Vite+ template, then create like any other template. Consumers no longer land in the interactive `vp create` CLI menu.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Project
- Tag a scaffolded workspace with its own project type ([#9d05637](https://github.com/deltabox-studio/toolchain/commit/9d05637) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `resolveType` fell back to the loaded config's `project.type`, but a scaffold runs with the config of the directory it is invoked from — the monorepo root when adding a workspace. A workspace was therefore tagged `monorepo-root`, and the post-scaffold sync then generated root-only CI, husky and VS Code files inside the workspace.
    - Only honour an explicit `--type` (or the command's implied default); ignore the ambient config type.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Update descriptions and vscode screenshot ([#215bc4f](https://github.com/deltabox-studio/toolchain/commit/215bc4f) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Styles</summary>

- Wrap long description lines for the formatter ([#213ea73](https://github.com/deltabox-studio/toolchain/commit/213ea73) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Long single-line descriptions from earlier commits; `vp fmt` wraps them back.

  </details>

</details>

<details>
<summary>Tests</summary>

- Emulate custom templates/providers and workspace scaffolding ([#37d370e](https://github.com/deltabox-studio/toolchain/commit/37d370e) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Register a custom local template plus a custom provider (the JSON shape the VS Code extension writes) and assert the CLI lists, scaffolds and runs them — i.e. the payloads the extension's trees consume.
    - Scaffold a workspace into a root that enables the root-only sections, and assert the workspace does NOT inherit their outputs (.github/.husky/.vscode/commitlint.config.mjs).

  </details>

</details>

<details>
<summary>Chores</summary>

#### Vscode
- Rename the Home "All actions" section to "More actions" ([#b8a2137](https://github.com/deltabox-studio/toolchain/commit/b8a2137) by [T0chi](https://github.com/T0chi))

</details>

## 1.10.4 (October 2026)

<details>
<summary>Documentation</summary>

- Removed video preview dimensions ([#322b4b1](https://github.com/deltabox-studio/toolchain/commit/322b4b1) by [T0chi](https://github.com/T0chi))

</details>

## 1.10.3 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Recompute the Home model when the provider list loads ([#fd6f6f1](https://github.com/deltabox-studio/toolchain/commit/fd6f6f1) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The Home "Run Vite+" button is disabled while the Home model's `hasVite` is false, and that value comes from the asynchronously-loaded provider list (a `dbx providers --json` spawn). A webview rendered before the list resolved was never re-posted, so the button could stay disabled from a cold start even though the `deltabox.hasVite` context key (command palette) was updated.
    - Recompute the context keys and the Home model whenever the provider tree reloads, via its `onDidChangeTreeData` event. Vite+ is always contributed by the toolchain, so `hasVite` is true as soon as the list loads.

  </details>

#### Core
- Split the last-sync timestamp into a gitignored timestamps.json ([#0aa6f77](https://github.com/deltabox-studio/toolchain/commit/0aa6f77) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The per-project `manifest.json` embedded `syncedAt`, so every sync rewrote a committed file with a new clock value — noisy diffs in the repo and in every consumer. Move the timestamp out into a sibling, gitignored `.dbx/toolchain/timestamps.json`:
    - `writeManifest` writes only the file list to `manifest.json` and the timestamp to `timestamps.json`, so the next sync migrates a legacy inline value automatically (the property is gone from `manifest.json`).
    - `readManifest`/`readSyncedAt` (and the VS Code reader) fall back to a legacy inline `syncedAt` until that migration runs, so nothing breaks in between.
    - The new file is covered by the existing `.dbx/toolchain/*` gitignore glob; only the block's comment was updated.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Added a video preview of the extension ([#6b0ca40](https://github.com/deltabox-studio/toolchain/commit/6b0ca40) by [T0chi](https://github.com/T0chi))

</details>

## 1.10.2 (October 2026)

<details>
<summary>Documentation</summary>

#### Vscode
- Updated extension description & more ([#48993f0](https://github.com/deltabox-studio/toolchain/commit/48993f0) by [T0chi](https://github.com/T0chi))

</details>

## 1.10.1 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Core
- Only fall back to tsx when Node cannot load TypeScript ([#c96ae7d](https://github.com/deltabox-studio/toolchain/commit/c96ae7d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The config loader retried every failed native import through `tsx`, so a genuinely broken `dbx.config.*` could be silently loaded as an empty config. On Linux the root build had baked an absolute path to `tsx` into the bundle, which happened to resolve there: tsx elided the unresolvable (unused) import, the config "loaded", no error was recorded, and `dbx sync` exited 0 instead of failing (the emulation suite caught this in CI).
    - Only use the `tsx` fallback for errors that mean Node cannot load TS itself (`ERR_UNKNOWN_FILE_EXTENSION`, `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`); let genuine errors (module-not-found, syntax errors, throws) propagate.
    - Unwrap tsx's possibly-nested default export.
    - Keep `tsx` external in the root bundle so `dist` keeps the portable bare `import('tsx/esm/api')` instead of a build-machine path, and promote `tsx` to a runtime dependency so the config-loader fallback works for consumers.

  </details>

</details>

## 1.10.0 (October 2026)

<details>
<summary>New features</summary>

#### Template
- Scaffold actions, package-manager choice and catalogs ([#6c66c97](https://github.com/deltabox-studio/toolchain/commit/6c66c97) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Templates can declare post-scaffold `actions`: a `builtin` (`install`), a JS `module` (relative to the template dir, `export default async (ctx) => {}`, not copied to the output) or a shell `command`. Actions run through the same pipeline everywhere (CLI prompts / `--action <id>`, extension prompts, programmatic API `actions: string[]`).
    - Built-in templates declare an opt-in **Install dependencies?** action (`builtin: 'install'`, default off) and a `packageManager` input (yarn default | pnpm | npm | bun).
    - Scaffolds write the chosen manager's catalog file and reference `catalog:` when supported: `.yarnrc.yml` (yarn), `pnpm-workspace.yaml` (pnpm), `package.json` `workspaces.catalog` (bun); npm pins versions inline.
    - Add a `catalogs` config section (`packages` + `named`) and a `catalogs` sync task that keeps `.yarnrc.yml` / `pnpm-workspace.yaml` catalogs in sync. It only writes a file that is absent or toolchain-managed (marker comment), so a hand-written file is never clobbered; bun/npm warn.
    - `project:init*` gains `--package-manager`; the extension scaffold prompts for the manager.
    - Docs: templates (inputs + actions), project (package manager & catalogs), config reference/schema/types regenerated.

  </details>

- Generic builtins + inputs + Vite+ templates; resilient config loading ([#fb8d7cc](https://github.com/deltabox-studio/toolchain/commit/fb8d7cc) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Templates: drop Turbo (no `turbo.json`, dep or scripts) and the repo-internal `catalog:` protocol from generated projects, add a pinned `@deltabox/toolchain` devDependency, and generate a `dbx.config.ts` with only the `project` section — every other section is now opt-in.
    - Add a bare `monorepo` builtin (no example workspace), keep `monorepo-example`, and expose every Vite+ template (`vite-plus-monorepo`, `-application`, `-library`, `-generator`).
    - Add a template input pipeline (`variables` with prompt/default/options/required) shared by the CLI, the programmatic API, the VS Code extension and the builtins; document it in the Templates guide.
    - Fix the generated workspace `tsdown.config.ts` to import `@deltabox/toolchain/tsdown` (the private `@deltabox/toolchain-tsdown` package is never published).
    - Load `dbx.config.*` tolerantly in the CLI: a broken config now warns on stderr instead of aborting unrelated commands (`template:list`, `providers`, ...), so the extension views no longer empty out after scaffolding; `sync` still fails on a broken config (and `--recursive` reports per project).
    - Extension: prompt for template inputs, offer a bare/example monorepo scaffold choice, and add a "Need help? Go to documentation" link to the Home view.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

- Issues found emulating the extension + command palette ([#1049afa](https://github.com/deltabox-studio/toolchain/commit/1049afa) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Emulated the extension (bundled and portal `dbx`) against a consumer workspace:
    - `packageManager` is never written without a version. Corepack rejects a bare name ("No version specified for X") for yarn/pnpm/npm/bun, so `projectToPackageJson` skips the field when no version is known, and scaffolds/`project:config` seed a default version (`DEFAULT_PACKAGE_MANAGER_VERSIONS`) or the existing package.json manager. `renderToolchainConfig` always emits `packageManagerVersion`.
    - `resolveVp`'s `npx` fallback names the bin (`npx --yes --package vite-plus vp`): `vite-plus` ships two bins, so `npx vite-plus` failed with "could not determine executable to run" (broke `dbx vite:*`).
    - `DBX_TASKS` computes its commands lazily (getters): importing `@deltabox/toolchain/vite` no longer runs `resolveDbx` at module load, so every command stopped printing spurious `dbx`-resolution warnings.
    - `template:info` accepts `--json` (the extension passed it; it errored "unknown option").
    - The extension syncs right after a successful scaffold (project/root/workspace/ template), so the Managed Files and Home views populate instead of staying empty.
    - Regression tests for the version-less `packageManager` and the versioned scaffold.

  </details>

#### Project
- Preserve scoped package name and never delete catalog files ([#dbb0b21](https://github.com/deltabox-studio/toolchain/commit/dbb0b21) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Found by exercising a portal-linked consumer workspace:
    - `projectSyncTask` now falls back to the `package.json` scope when a config defines `name` without `scope` (eg. a nested workspace), instead of renaming `@acme/a` to `a`. Mirrors the token resolution in the config loader.
    - `catalogsSyncTask` declares `keep: ['.yarnrc.yml', 'pnpm-workspace.yaml']`, so a previously toolchain-managed catalog file is never deleted when the task stops producing it (eg. the user replaces it with a hand-written one) — it already refused to overwrite it, but `runSync` would still remove it.
    - Regression tests for both.

  </details>

</details>

<details>
<summary>Tests</summary>

- Add a real CLI emulation suite under tests/emulate ([#2c76d66](https://github.com/deltabox-studio/toolchain/commit/2c76d66) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `tests/emulate.test.ts` spawns the **built** `dbx` CLI (the surface the VS Code extension and command palette drive) in a per-test scratch workspace under `tests/emulate/<id>` and asserts on real behavior: builtins + inputs/actions, per-package-manager scaffolding (catalog vs pinned), bare/nested monorepos, custom module/command actions, the opt-in install action, catalog sync + never-delete, config-load resilience, `template:info --json`, and the post-scaffold extension flow.
    - Each scratch root carries an empty `.git` so `dbx` treats it as a repository boundary and never inherits the toolchain repo's own config/manifest. Scratch dirs are removed after every test (pass or fail), once more on `afterAll`, and again on process exit; the repo's own manifest is snapshotted and restored so the working tree stays clean.
    - `.gitignore`: ignore `tests/emulate/*` (the scratch content).
    - root `test` script now runs `vp run build:root` first, so the emulation tests always execute against a fresh CLI bundle.
    - fix(project): a single Bun project now pins its dependencies instead of emitting a dangling `catalog:` — Bun's catalog lives in `package.json` `workspaces.catalog`, which only a monorepo root writes. Regression tests added.

  </details>

</details>

## 1.9.2 (October 2026)

<details>
<summary>Documentation</summary>

- Added `llms` entry to the sidebar ([#098cc7e](https://github.com/deltabox-studio/toolchain/commit/098cc7e) by [T0chi](https://github.com/T0chi))

</details>

## 1.9.1 (October 2026)

<details>
<summary>CI</summary>

#### Vscode
- Target the release environment by name (drop resourceType) ([#2bbd25a](https://github.com/deltabox-studio/toolchain/commit/2bbd25a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `resourceType` only accepts `virtualMachine`/`Kubernetes`. `resourceType: none` made the deployment job look for a resource of type `none`, so it failed with "No resource were found in the environment ... ResourceType Undefined". Use the string form `environment: 'release'`, which records the deployment against the resource-less environment and still applies its approvals/checks.

  </details>

</details>

## 1.9.0 (October 2026)

<details>
<summary>New features</summary>

#### Changelog
- Allow a raw YAML string as a workflow setting ([#aa0e1b7](https://github.com/deltabox-studio/toolchain/commit/aa0e1b7) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `changelog.workflows.<id>` now accepts a raw YAML string in addition to a boolean or a `WorkflowConfig` object. A raw string is written verbatim as the workflow file: no default merge, no token replacement and no generated header, and the `changelog.branches` defaults don't apply (it defines its own triggers). An empty string disables the workflow.
    - Docs: add a "Workflows" section covering the three forms, and a "Writing commit messages" section warning about shell escaping (PowerShell backtick escapes and bash command substitution) and AI/LLM-drafted messages introducing stray control characters, curly quotes, dashes and other typographic characters. Regenerate the schema, types and docs reference.

  </details>

</details>

<details>
<summary>CI</summary>

#### Vscode
- Skip the release when the extension version is already published ([#0d54cfe](https://github.com/deltabox-studio/toolchain/commit/0d54cfe) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `vsce publish` fails with "already exists" when `deltabox.toolchain-vscode@<version>` is already on the Marketplace, failing the whole pipeline. Add a `Check` stage before `Build` that reads the version from `packages/vscode/package.json`, queries the Marketplace `extensionquery` API, and exposes an `alreadyPublished` stage output. `Build` and `Release` now depend on `Check` and skip when it is `true` (a failed query assumes "not published" so a release is never silently skipped).

  </details>

</details>

<details>
<summary>Chores</summary>

#### Changelog
- Repair escaped text in the 1.8.0 entry ([#587e47d](https://github.com/deltabox-studio/toolchain/commit/587e47d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The shared/core/project/tsconfig/vite commits were authored with PowerShell `\``-escaped backticks, so their bodies carried `\` + control-character artifacts (e.g. `` `r `` -> `\`+CR, `` `b `` -> backspace). The changelog sanitizer stripped the control characters but left the stray backslashes and dropped letters, so the 1.8.0 entry read `esolveVite`, `\{ ... }\`, `epo\`, etc. Restore the intended text (backticked code, `resolveVite`, `repo`/`repository`, `name`/`scope`/`description`/`type`, `rootFile`/`defaultFile`/`buildFile`).

  </details>

</details>

## 1.8.0 (October 2026)

<details>
<summary>New features</summary>

#### Cli
- Expose the sync tasks to commands and keep --json output clean ([#1e4ecec](https://github.com/deltabox-studio/toolchain/commit/1e4ecec) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The command context now carries `syncTasks` (`defaultSyncTasks()`) so a package command such as `migrate` can regenerate managed files without depending on every sync package. Skip the update-check notice when `--json` is passed so it never lands on stdout and corrupts machine output.

  </details>

#### Changelog
- Per-workspace changelogs and configurable branches ([#0aa329c](https://github.com/deltabox-studio/toolchain/commit/0aa329c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Scan a workspace's own commits (plus its transitive dependencies) via `relatedWorkspacePaths` and create a missing workspace `CHANGELOG.md` instead of skipping it. `changelog.branches.main`/`dev` accept a string or an array, `dev` defaults to `main`, and the branch list is injected into the generated workflows. Add `changelog.commitlint.dir` for a custom commitlint config location. Release notes aggregate every changelog entry since the last tag.

  </details>

#### Migrate
- Recursive, interactive migration and post-migration sync ([#bb87b33](https://github.com/deltabox-studio/toolchain/commit/bb87b33) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `dbx migrate` is now `--recursive` (off by default): it discovers the projects under the root and, on a TTY, prompts a multi-select with an "All projects" option. The `vite` migration creates a fresh nested `dbx.config.ts` (wrapped in `defineConfig`) when the project has none, and removes the folded `vite.config.*` unless `--ignore-vite-config-file`. `--write` also regenerates the project's managed files unless `--ignore-managed-files`, dropping the changelog task when `--ignore-changelog`; removals are reported. Adds `@clack/prompts`, `@deltabox/toolchain-core` and `glob` to the package.

  </details>

#### Vite
- Accept a single options object in resolveVite ([#2e2384b](https://github.com/deltabox-studio/toolchain/commit/2e2384b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `resolveVite(options?: DbxConfig & ResolveViteOptions)` replaces the two-argument form. The generated shim passes `{ cwd: import.meta.dirname }` so a nested shim resolves its own `dbx.config.*` instead of the process cwd's.

  </details>

#### Tsconfig
- Generate workspace tsconfigs from a workspaces file ([#40db765](https://github.com/deltabox-studio/toolchain/commit/40db765) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Rename `tsconfig.monorepo.json` to `tsconfig.workspaces.json`; `tsconfig.build.json` and the workspaces file are optional; `glob` accepts a string or an array (with `!` negation); add `exclude`/`gitignore` (nested-aware, symlink-safe) and the `rootFile`/`defaultFile`/`buildFile` renames; warn when references/composite are configured but no workspace tsconfigs are found.

  </details>

#### Project
- Sync package.json fields and generate configs ([#e5209ee](https://github.com/deltabox-studio/toolchain/commit/e5209ee) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a `project` sync task that writes the fields a `dbx.config.project` defines into `package.json` (with `repo` -> `repository` + `directory` for workspaces), plus `project:config` generation for existing projects. Scaffolding validates the name/type.

  </details>

#### Core
- Inherit project config and make discovery symlink-safe ([#92b2b0a](https://github.com/deltabox-studio/toolchain/commit/92b2b0a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Nested configs inherit the ancestor `project` minus its identity keys (`name`/`scope`/`description`/`type`), with `project.inherit: false` to opt out. Discovery no longer follows symlinks/junctions (a self-link would loop), and `DBX_GITIGNORE_BLOCK` now covers a nested project's `.dbx/` while still tracking its manifest.

  </details>

#### Shared
- Add ignore resolution, project helpers and config schema updates ([#144b2f0](https://github.com/deltabox-studio/toolchain/commit/144b2f0) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add symlink-safe gitignore collection (`collectGitignorePatterns`) and `resolveIgnorePatterns` for the glob-based consumers, `projectFromPackageJson`/`projectToPackageJson`, and the `ToolchainCommandContext.syncTasks` field. Regenerate `config.schema.json` and the docs config reference.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Vscode
- Resolve the bundled CLI and gate commands on availability ([#5220ed3](https://github.com/deltabox-studio/toolchain/commit/5220ed3) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Capture the running extension's path and version at activation instead of hardcoding the id (`deltabox.toolchain` is stale: the id is `<publisher>.<name>`), so `bundledCliEntry()`/`pinnedToolchainSpec()` find the shipped `dbx.cjs` and Providers/Templates/scaffolding work without a project-local install. Disable the sync commands (`deltabox.canSync`) and the Vite+ commands (`deltabox.hasVite`) via context keys + command `enablement` and the Home buttons when there is nothing to sync / the provider is unavailable. Exclude `dbx.config.ts` and `.dbx/**` from the VSIX.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Add guides for every config section and the llms output ([#4c231dc](https://github.com/deltabox-studio/toolchain/commit/4c231dc) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add per-section guides (project, biome, vite, watch, logger, tsconfig), refresh the CLI/config/monorepo/VS Code/api pages and the sidebar, and wire `vitepress-plugin-llms` with `apps/docs/llms.md` plus the script that copies the generated `llms.txt`/`llms-full.txt` to the repo root.

  </details>

</details>

<details>
<summary>Build system</summary>

- Make the published package installable ([#b2597ee](https://github.com/deltabox-studio/toolchain/commit/b2597ee) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - npm runs a dependency's `postinstall` on install, so the repo-only `husky && node scripts/bootstrap.mjs` broke every consumer (and global) install with `'husky' is not recognized`. Move the logic into `scripts/bootstrap.mjs`, publish it, and guard every checkout-only step: husky runs only when `.husky` exists and the dist build only when `packages/` exists. A consumer install is now a clean no-op.

  </details>

</details>

<details>
<summary>CI</summary>

- Aggregate release notes and refresh the generated workflows ([#9426a40](https://github.com/deltabox-studio/toolchain/commit/9426a40) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The release workflow now extracts every changelog entry since the last tag, and the generated `ci.yml`/`release.yml` are regenerated from `dbx.config.ts`. Includes the hand-written `release-vscode.yml` pipeline.

  </details>

#### Vscode
- Fix the release-vscode Azure Pipelines trigger ([#b59964c](https://github.com/deltabox-studio/toolchain/commit/b59964c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `pr` is a top-level pipeline keyword, not a child of `trigger` (whose full syntax only accepts `batch`, `branches`, `paths` and `tags`), so `trigger.pr` was reported as an unexpected property. Move `pr: none` to the top level and trigger on `v*` tags through `tags` (with `branches: exclude: ['*']` for a tag-only trigger) instead of the invalid `branches.include: refs/tags/v*`.

  </details>

</details>

<details>
<summary>Chores</summary>

- Self-host nested dbx configs across the workspaces ([#003cb9f](https://github.com/deltabox-studio/toolchain/commit/003cb9f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Every workspace now has its own `dbx.config.ts` (holding its Vite Task definitions) and a generated `vite.config.ts` shim, plus its own tracked manifest. The root gains a `@deltabox/toolchain` `portal:.` self-link so the shims resolve `@deltabox/toolchain/vite`, and `.gitignore` keeps nested manifests while ignoring the rest. The root `tsconfig.monorepo.json` is renamed to `tsconfig.workspaces.json`.

  </details>

#### Deps
- Refresh the lockfile ([#420c805](https://github.com/deltabox-studio/toolchain/commit/420c805) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Covers `vitepress-plugin-llms` (docs), `@clack/prompts`/`glob`/core (migrate) and the root `@deltabox/toolchain` `portal:.` self-link.

  </details>

</details>

### Package changes

#### Added
- `@deltabox/toolchain`
  - `@deltabox/toolchain` `portal:.`
- `@deltabox/toolchain-docs`
  - `vitepress-plugin-llms` `^1.14.0`
- `@deltabox/toolchain-migrate`
  - `@clack/prompts` `catalog:`
  - `@deltabox/toolchain-core` `workspace:*`
  - `glob` `catalog:`

## 1.7.8 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Reverted VS Code extension package name to `toolchain-vscode` due to `toolchain` ([#5d0d38b](https://github.com/deltabox-studio/toolchain/commit/5d0d38b) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Added
- `toolchain-vscode`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `@types/node` `catalog:`
  - `@types/vscode` `^1.85.0`
  - `tsdown` `catalog:`
  - `typescript` `catalog:`
  - `vitest` `catalog:`

#### Removed
- `toolchain`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `@types/node` `catalog:`
  - `@types/vscode` `^1.85.0`
  - `tsdown` `catalog:`
  - `typescript` `catalog:`
  - `vitest` `catalog:`

## 1.7.7 (October 2026)

<details>
<summary>CI</summary>

#### Vscode
- Upload `release-vscode.yml` pipeline ([#3080357](https://github.com/deltabox-studio/toolchain/commit/3080357) by [T0chi](https://github.com/T0chi))

</details>

## 1.7.6 (October 2026)

<details>
<summary>CI</summary>

#### Vscode
- Fixed failed build in `release-vscode.yml` for Azure Pipelines ([#f6f4b14](https://github.com/deltabox-studio/toolchain/commit/f6f4b14) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The build failed due to missing workspace builds, specifically from `@deltabox/toolchain-tsdown`

  </details>

</details>

## 1.7.5 (October 2026)

<details>
<summary>Chores</summary>

- Revert `extend` value to `tsconfig.base.json` for vscode workspace's `tsconfig.default.json` ([#96e021e](https://github.com/deltabox-studio/toolchain/commit/96e021e) by [T0chi](https://github.com/T0chi))

</details>

## 1.7.4 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Extending root `tsconfig.json` instead of root `tsconfig.base.json` ([#9aa9669](https://github.com/deltabox-studio/toolchain/commit/9aa9669) by [T0chi](https://github.com/T0chi))

</details>

## 1.7.3 (October 2026)

<details>
<summary>CI</summary>

#### Vscode
- Set up CI with `Azure Pipelines` ([#2ec1863](https://github.com/deltabox-studio/toolchain/commit/2ec1863) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - [skip ci]

  </details>

</details>

<details>
<summary>Chores</summary>

#### Ci
- Remove `azure-pipelines-setup.yml` ([#03a4196](https://github.com/deltabox-studio/toolchain/commit/03a4196) by [T0chi](https://github.com/T0chi))

</details>

## 1.7.2 (October 2026)

<details>
<summary>CI</summary>

#### Vscode
- Set up ci with `Azure Pipelines` ([#5bc736f](https://github.com/deltabox-studio/toolchain/commit/5bc736f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - [skip ci]

  </details>

</details>

<details>
<summary>Chores</summary>

- Remove `azure-pipelines.yml` ([#7965965](https://github.com/deltabox-studio/toolchain/commit/7965965) by [T0chi](https://github.com/T0chi))

</details>

## 1.7.1 (October 2026)

<details>
<summary>Chores</summary>

#### Vscode
- Uploaded the vscode extension to the Marketplace ([#993aadf](https://github.com/deltabox-studio/toolchain/commit/993aadf) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Added
- `toolchain`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `@types/node` `catalog:`
  - `@types/vscode` `^1.85.0`
  - `tsdown` `catalog:`
  - `typescript` `catalog:`
  - `vitest` `catalog:`

#### Removed
- `toolchain-vscode`
  - `@deltabox/toolchain-tsdown` `workspace:*`
  - `@types/node` `catalog:`
  - `@types/vscode` `^1.85.0`
  - `tsdown` `catalog:`
  - `typescript` `catalog:`
  - `vitest` `catalog:`

## 1.7.0 (October 2026)

<details>
<summary>New features</summary>

#### Vscode
- Let users choose the project or bundled dbx ([#6cdd686](https://github.com/deltabox-studio/toolchain/commit/6cdd686) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The extension had no awareness of a workspace's own @deltabox/toolchain, so its auto-sync ran the bundled (possibly older) dbx. On activation it now detects the workspace dbx, shows a notification with action buttons (project vs bundled), remembers the choice per workspace (workspaceState) and falls back to the bundled CLI. Adds the deltabox.toolchain.chooseDbxSource command + a getDbxSource/setDbxSource API.

  </details>

#### Shared
- Sanitize shell-escape artifacts in generated markdown ([#fcac95e](https://github.com/deltabox-studio/toolchain/commit/fcac95e) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add stripControlChars/stripEscapeArtifacts/sanitizeText to the shared string utils: they strip the predictable shell-escape artifacts (a backslash before a control character) and any remaining bare control characters, while leaving ordinary backslashes and normal whitespace alone. Apply them to the config markdown generator's descriptions and the changelog commit reader/formatter, and cap generated headings at h6 (VitePress dropped the literal #######).

  </details>

</details>

<details>
<summary>Chores</summary>

#### Changelog
- Repair escaped commit text and label code refs ([#1425419](https://github.com/deltabox-studio/toolchain/commit/1425419) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - PowerShell interpreted the escaped backticks in the commit bodies as control-character escapes, so the changelog carried backslash+control artifacts (TAB/CR/LF/BS/FF/VT) and mojibake. Repair the affected 1.4.1-1.6.1 entries and add backticks around commands, paths, flags, types and identifiers throughout the file.

  </details>

</details>

## 1.6.1 (October 2026)

<details>
<summary>Documentation</summary>

#### Config
- Inline nested sub-schemas in the generated reference ([#5a9a9e3](https://github.com/deltabox-studio/toolchain/commit/5a9a9e3) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `renderConfigFileMarkdown` only recursed into inline objects, so named sub-schemas (`changelog.workflows`, `changelog.versioning.target/workspaces`, `templates.sources[]`, `project.type`) rendered as a bare type name. It now resolves the JSON Schema `$defs` and expands objects, object unions and array items inline (each named type once per section), so the reference documents every option with types, required markers, defaults and descriptions.

  </details>

</details>

## 1.6.0 (October 2026)

<details>
<summary>New features</summary>

#### Changelog
- Add a configurable versioning option ([#e5cbefc](https://github.com/deltabox-studio/toolchain/commit/e5cbefc) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add `toolchain.changelog.versioning` (boolean | { target, workspaces }) to the shared Zod model, defaulting to `true`/uniform. `target` selects `uniform` (root + all workspaces), `root-only`, or `individual` (each changed workspace bumps on its own); `workspaces` globs select which workspaces to version (defaulting to the root `workspaces` field, else the root `package.json` alone). The CLI now threads the changelog config into the generator and `writeChangelogs` takes per-workspace versions. Documented in the new 'Changelog & versioning' guide.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Shared
- Add spawn timeouts so a stalled child can't hang the tool ([#e7fdf96](https://github.com/deltabox-studio/toolchain/commit/e7fdf96) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `spawnCross`/`run` gain `timeoutMs` (kills the child's whole tree — `taskkill /t` on Windows — with a warning); `runVp` forwards it; the plugin's one-shot `runDbx` sync/check defaults to 5 min; the VS Code extension's captured `dbx` commands default to 5 min. Dev servers/watchers stay unbounded. Adds `killProcessTree()` + a timeout test.

  </details>

#### Vite
- Build `DBX_TASKS` from a resolved binary and warn on fallbacks ([#c1a29db](https://github.com/deltabox-studio/toolchain/commit/c1a29db) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Vite Task runs a task's command through a shell, so a bare `dbx sync` depended on `PATH`/environment and could miss or pick a stale binary. `DBX_TASKS` now bakes in the `resolveDbx` result (project's own, or pinned `npx`) at config load; `dbxTaskCommand(sub)` builds one for any subcommand. `resolveDbx` also warns (once) when it ignores an invalid `DBX_BIN`, skips a global for a pinned project, or falls back to `npx`.

  </details>

- Warn and fall back on missing `DBX_BIN`/`PATH`/`ComSpec` ([#f91ad12](https://github.com/deltabox-studio/toolchain/commit/f91ad12) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `resolveDbx` now ignores a `DBX_BIN` that points at a missing file (warn + fall through) instead of wedging every `dbx` call; `which` warns once when `PATH` is empty; the Windows spawner warns once when `ComSpec` is unset before falling back to `cmd.exe`.

  </details>

- Never run a stale global `dbx` from a pinned project ([#d441427](https://github.com/deltabox-studio/toolchain/commit/d441427) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `resolveDbx` fell back to a global `dbx` on `PATH` whenever the project's own binary wasn't resolvable — which happens in the toolchain repo itself (Yarn doesn't link the root's own bin, and `findOwnCliEntry` needs a built `dist`). A stale global `dbx` would then run `dbx sync` and rewrite generated files in an older format. Now a project that pins `@deltabox/toolchain` (`node_modules` or the repo itself) never uses a global `dbx`: it warns and uses `npx @deltabox/toolchain@<pinned>`; the global is only used when the project pins nothing. Adds `localToolchainVersion()` + tests, and documents the resolution.

  </details>

#### Vscode
- Pin the `npx` fallback to the extension's version ([#57d27fa](https://github.com/deltabox-studio/toolchain/commit/57d27fa) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The extension's last-resort `npx --yes @deltabox/toolchain` resolved `@latest`, which could drift from the workspace's generated files. It now pins its own version (`@deltabox/toolchain@<extension version>`), since the extension is versioned in lockstep with the toolchain.

  </details>

#### Tsdown
- Let Yarn own the single-entry `bin` field ([#d6198b5](https://github.com/deltabox-studio/toolchain/commit/d6198b5) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Reproduced (and minimised) the 'unexplained' `bin` revert: Yarn 4 normalises a single-entry `bin` object to a plain string on every `yarn install`, so an explicit tsdown `bin` object could never persist — install and build fought over `package.json`. Set tsdown's `exports.bin` to `false` so tsdown leaves the field alone, and commit the string form Yarn writes. install + build are now idempotent.

  </details>

- Re-apply the explicit changelog and tsconfig bins ([#192a2d3](https://github.com/deltabox-studio/toolchain/commit/192a2d3) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The generated version bump commit dropped the explicit `bin` mapping (object form) from both `package.json`s; regenerate it from the pinned tsdown `exports.bin` so `yarn build` stays idempotent.

  </details>

</details>

## 1.5.0 (October 2026)

<details>
<summary>New features</summary>

#### Changelog
- Emit the husky `commit-msg` hook for consumers ([#6898386](https://github.com/deltabox-studio/toolchain/commit/6898386) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `dbx sync` now writes `.husky/commit-msg` (running `commitlint`) alongside the workflows and `commitlint.config.mjs`, so consumers using the Conventional-Commits CI lint commits locally too. The docs recommend `postinstall: husky` (Yarn Berry never runs `prepare`) and `.husky/* text eol=lf` (a trailing CR breaks the hook).

  </details>

</details>

## 1.4.1 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Tsdown
- Pin the changelog and tsconfig bins explicitly ([#f616626](https://github.com/deltabox-studio/toolchain/commit/f616626) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - With `exports: true` and no `bin`, tsdown soft auto-detects the shebang entry and derives the command name from the package name, rewriting the committed `bin` on every build. Map the command names explicitly so the field is stable and the build is idempotent.

  </details>

#### Ci
- Bootstrap the `dist` the vite shim needs before build ([#b96b89a](https://github.com/deltabox-studio/toolchain/commit/b96b89a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `prepare` never runs on `yarn install` under Yarn Berry, so `scripts/bootstrap.mjs` never built `dist/vite.js` and `yarn build` failed to load the generated `vite.config.ts` shim on a fresh CI checkout. Run the bootstrap from a root `postinstall` and at the start of `build`/`typecheck`/`test` (all begin with `vp run`, which loads the shim); it is a no-op once `dist/vite.js` exists.

  </details>

</details>

## 1.4.0 (October 2026)

<details>
<summary>New features</summary>

- Render the `dbx` CLI with `clack`, author the Vite+ config in `dbx.config` ([#fb8b9ef](https://github.com/deltabox-studio/toolchain/commit/fb8b9ef) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - resolveVite() + a generated vite.config.ts shim (no drift); dbx migrate folds vite.config.ts in and adds the fmt ignore; dbx resolves its own binary first
    - render dbx output with @clack/prompts (logger, intro/outro, create prompts) and colour Commander's help
    - fix the Toolchain* typecheck errors and stale tsdown rename leftovers
    - add a dist bootstrap so the generated shim resolves on a fresh checkout

  </details>

#### Vscode
- Add Providers and Templates views ([#9aa6d12](https://github.com/deltabox-studio/toolchain/commit/9aa6d12) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Providers: lists providers (dbx providers --json + a custom registry) with add/remove/run-command/open-homepage/copy-id actions
    - Templates: lists templates with add/remove-source/create/info actions
    - custom provider registry (.dbx/toolchain/providers.json) merged into toolchainProviders(), so a registered provider's commands become dbx commands
    - viewsWelcome empty states; view order Home -> Providers -> Projects -> Templates -> Managed Files

  </details>

#### Vite
- Drive `dbx` from the `dbx()` plugin, drop `defineDbxConfig` ([#8d11557](https://github.com/deltabox-studio/toolchain/commit/8d11557) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The Vite/Vite+ integration is now the `dbx()` plugin plus spreading `DBX_TASKS` into `run.tasks`, so the consumer's own `vite` config stays the config:
    - `export default defineConfig({` `plugins: [dbx()],` `run: { tasks: { ...DBX_TASKS } },` `});`
    - Remove the `defineDbxConfig` wrapper (and `DbxViteConfig`) and update the README, the Providers guide and the API reference.

  </details>

- Author the Vite+ config in `dbx.config`, generate `vite.config.ts` ([#9885225](https://github.com/deltabox-studio/toolchain/commit/9885225) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `toolchain.vite` now holds the whole Vite+ config (a loose object) with a `config: false` opt-out, and `dbx sync` generates the managed root `vite.config.ts` from it, so `dbx.config.*` is the only hand-authored root config.
    - Add `dbx migrate --from vite` (auto-detected): it extracts the object passed to `defineConfig` in an existing root `vite.config.ts` and folds it into `dbx.config.*`'s `toolchain.vite`, refusing configs it cannot migrate faithfully.
    - The config-types generator now honors `.catchall`, emitting an index signature.

  </details>

#### Config
- Expose the Vite+ config type, rename `Tooling*` to `Toolchain*` ([#088de56](https://github.com/deltabox-studio/toolchain/commit/088de56) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `ToolchainViteConfig` is now Vite+ `ViteUserConfig` intersected with the managed `config?: boolean` opt-out, instead of a generated loose object. The config-types generator gains a hand-written type override plus an imports block, used for the vite type, and `vite-plus` becomes an optional peer dependency.
    - Rename every `Tooling*` type, schema id and identifier to `Toolchain*`. That covers the config schema ids, `CONFIG_TYPE_SCHEMAS` keys, the provider/migration models and the CLI helpers (`toolchainConfigSchema`, `loadToolchainConfig`, `toolchainProviders`, `registerToolchainCommands`). Regenerated types/schema/docs.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Deps
- Sync the lockfile for `@clack/prompts` ([#568a7c6](https://github.com/deltabox-studio/toolchain/commit/568a7c6) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The lockfile was missing the `@clack/prompts` entry for `packages/shared` and `packages/template`, so `yarn install --immutable` failed in CI (YN0028).

  </details>

</details>

<details>
<summary>Refactors</summary>

- Rename Ox to Oxc across the project ([#39b37d3](https://github.com/deltabox-studio/toolchain/commit/39b37d3) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - migrate: the target tool value is 'oxc' and the ids are *-to-oxc (Oxfmt/Oxlint and .oxlintrc/.oxfmtrc are unchanged)
    - docs + README prose

  </details>

</details>

<details>
<summary>Documentation</summary>

- Cover the clack CLI output, prompts and `dbx` binary resolution ([#f45ed3f](https://github.com/deltabox-studio/toolchain/commit/f45ed3f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - cli: an Output section (clack rendering, intro/outro, coloured help), the --color flag, and the `create` prompts
    - api: document findOwnCliEntry / TOOLCHAIN_PACKAGE
    - providers: document the dbx() plugin's binary resolution
    - scripts: note the Vite+ config can live in dbx.config's toolchain.vite

  </details>

- Document the Vite+ config type and the `Toolchain*` names ([#1e70950](https://github.com/deltabox-studio/toolchain/commit/1e70950) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Note that `toolchain.vite` is typed as Vite's `UserConfig` as augmented by Vite+ (`ToolchainViteConfig`), and list `ToolchainViteConfig` among the shared config types. Covers the unreleased changes since v1.3.1 together with the sections the feature commits already added (the Vite+ config in `dbx.config`, the generated `vite.config.ts`, the vite migration and the `dbx` plugin).

  </details>

#### Vscode
- Refresh the extension screenshot and add its `LICENSE` ([#49d4510](https://github.com/deltabox-studio/toolchain/commit/49d4510) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Build system</summary>

- Package the VS Code extension in `yarn build` ([#1dd14a1](https://github.com/deltabox-studio/toolchain/commit/1dd14a1) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `yarn build` now also runs the vscode `package:vsix`, so `deltabox-toolchain.vsix` is always produced.

  </details>

</details>

### Package changes

#### Added
- `@deltabox/toolchain`
  - `@clack/prompts` `^1.8.1`
- `@deltabox/toolchain-shared`
  - `@clack/prompts` `catalog:`
- `@deltabox/toolchain-template`
  - `@clack/prompts` `catalog:`
- `@deltabox/toolchain-vite`
  - `@deltabox/toolchain-core` `workspace:*`

#### Updated
- `@deltabox/toolchain`
  - `vite-plus` `^1.2.0` → `>=1`

## 1.3.1 (October 2026)

<details>
<summary>Documentation</summary>

- Update config generator documentation ([#0dfbf88](https://github.com/deltabox-studio/toolchain/commit/0dfbf88) by [T0chi](https://github.com/T0chi))
- Update config generator reference link ([#2f0adde](https://github.com/deltabox-studio/toolchain/commit/2f0adde) by [T0chi](https://github.com/T0chi))
- Update features descriptions ([#e9c0a6d](https://github.com/deltabox-studio/toolchain/commit/e9c0a6d) by [T0chi](https://github.com/T0chi))

</details>

## 1.3.0 (October 2026)

<details>
<summary>New features</summary>

#### Core
- Keep the generated `.dbx` directory out of git ([#9fc1434](https://github.com/deltabox-studio/toolchain/commit/9fc1434) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `dbx sync` now appends the `.dbx` ignore block (everything under `.dbx/` except the manifest, which holds no absolute paths) to an existing `.gitignore`, and the installation guide documents the pattern and the automatic step.

  </details>

#### Cli
- Route CLI output through the logger, add a providers colour option ([#ce76a4d](https://github.com/deltabox-studio/toolchain/commit/ce76a4d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `Commander`'s help and errors now go through the shared logger (help to stdout, errors to stderr, colour-aware, ANSI stripped when colour is off). Vite+ passthrough commands keep `commander`'s defaults so the spawned `vp` keeps its own coloured logging.
    - Add a `providers` config section (`color?: boolean`): `color: false` forces plain provider output, the global `--no-color` still turns it off, and `runVp` sets `NO_COLOR` / `FORCE_COLOR` on the child when colour is disabled.

  </details>

- Check for a newer `dbx` version ([#772aae2](https://github.com/deltabox-studio/toolchain/commit/772aae2) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - On each run, check the npm registry in the background (cached for a day, never blocking) and print a short notice with a link to the release when a newer `@deltabox/toolchain` exists. Skipped in CI and by `NO_UPDATE_NOTIFIER` or `DBX_NO_UPDATE_CHECK`, and can be turned off with the new `--no-update-check` flag.

  </details>

- Default a bare Vite+ command to the `vite` passthrough ([#75770e4](https://github.com/deltabox-studio/toolchain/commit/75770e4) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `dbx fmt` / `dbx lint` / `dbx run` / `dbx dev` now work: when the first operand is not a built-in command but names a Vite+ subcommand (or one of its aliases), `vite` is inserted before it and the whole Vite+ CLI stays reachable without the explicit namespace. Built-in commands win, so `dbx migrate` remains the toolchain's migration (`dbx vite migrate` is Vite+'s).
    - The Package scripts, Migrations, Monorepo, CLI and Providers guides now show the bare form, and the consumers' root scripts were updated to match.

  </details>

#### Vscode
- Bundle the `dbx` CLI into the extension ([#bf12403](https://github.com/deltabox-studio/toolchain/commit/bf12403) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Ship a self-contained `dbx.cjs` inside the VSIX (built by the new `tsdown.bin.config.ts`) and prefer it in the extension, so a consumer no longer needs to install `@deltabox/toolchain`. It falls back to a workspace-local install and then `npx`.
    - Make the changelog and tsconfig direct-run guards basename-aware so they do not fire when the module is inlined into the single-file bundle.

  </details>

#### Shared
- Add a configurable shared logger ([#54b51fa](https://github.com/deltabox-studio/toolchain/commit/54b51fa) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add `packages/shared/src/logger.ts`: one level-aware, colour-aware sink (colours via `picocolors`, the same package Vite uses) with `debug`, `info`, `success`, `warn`, `error` and `raw` (unprefixed machine output). It is configurable from `dbx.config`'s new `logger` section and from the CLI (`--log-level`, `--no-color`), with the CLI taking precedence.
    - Every `console` call in the toolchain now goes through the logger (JSON output through `raw`), including the sync/watch log callback and the `run` helper's verbose line. The generated config types, the JSON schema, the docs reference and the Configuration/CLI guides document the new `logger` section.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

- Correct tsconfig aliases under `--cwd`, prune self-referential task runs ([#40e0c34](https://github.com/deltabox-studio/toolchain/commit/40e0c34) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Two bugs found by exercising the CLI against the local consumer projects:
    - tsconfig: monorepo path aliases are now resolved against the project root instead of process.cwd(), so `dbx sync --cwd <dir>` (run from elsewhere) writes correct relative paths rather than paths pointing at the caller.
    - run: a `run` command records its root and operands in an env marker before spawning the task runner, and prunes itself when the same command runs again from the same root. A root task whose script calls `run -r <task>` can no longer recurse.

  </details>

- Changelog links, oxfmt map, build idempotency, watch timer, vscode spawn ([#2389c98](https://github.com/deltabox-studio/toolchain/commit/2389c98) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - changelog: with no GitHub remote (and a non-GitHub package.json repository), render commits as a plain short hash instead of a github.com/undefined link
    - migrate: read javascript.formatter.jsxQuoteStyle so it is reported unmapped
    - set the changelog and tsconfig package.json bin to the object form, so `yarn build` no longer rewrites it and the working tree stays idempotent
    - core watch: clear the pending debounce timer on SIGINT/SIGTERM
    - vscode: document the ELECTRON_RUN_AS_NODE mechanism consistently between spawnCli and cliInvocation

  </details>

- Sync `--check` writes, quiet level, log flags and template tokens ([#7f5690f](https://github.com/deltabox-studio/toolchain/commit/7f5690f) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Audit pass over the toolchain source:
    - include the vite sync task in defaultSyncTasks, so a `vite` config section is actually generated by dbx sync
    - stop dbx sync --check from writing the project graph (it must not write)
    - make --quiet hide info/debug/warn but still show errors
    - stop the logger flag pre-scan at `--`, and reject inherited level keys
    - strip a UTF-8 BOM from a JSON dbx.config
    - let explicit --name/--scope win over dbx.config project values in dbx create

  </details>

</details>

<details>
<summary>Documentation</summary>

- Document the full public API surface ([#6f78245](https://github.com/deltabox-studio/toolchain/commit/6f78245) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Expand `guide/api.md` to cover the umbrella plus every subpath export, grouped by package. Add the logging API (`logger`, `createLogger`, `setLogConfig`, `setLogOverrides`, levels, colours, `raw`) to the API and Configuration guides, and document the config generator's `formatGenerated` helper and the Vite and CLI programmatic helpers.

  </details>

</details>

<details>
<summary>Chores</summary>

- Track only the `.dbx` manifest ([#a254062](https://github.com/deltabox-studio/toolchain/commit/a254062) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Ignore everything under `.dbx/` except `.dbx/toolchain/manifest.json`, which records the managed files and holds no absolute paths. The project graph (which embeds the absolute root) stays ignored.

  </details>

- Stop tracking the generated `.dbx` directory ([#b7c53f0](https://github.com/deltabox-studio/toolchain/commit/b7c53f0) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The managed-file manifest and project graph under `.dbx/` are generated state, so ignore them and untrack the two committed files.

  </details>

</details>

### Package changes

#### Added
- `@deltabox/toolchain`
  - `picocolors` `^1.1.1`
- `@deltabox/toolchain-shared`
  - `picocolors` `catalog:`

## 1.2.8 (October 2026)

<details>
<summary>Documentation</summary>

- Drive Vite+ from `dbx` in the recommended package scripts ([#6131c59](https://github.com/deltabox-studio/toolchain/commit/6131c59) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Use `dbx vite <command>` (the Vite+ passthrough) instead of calling `vp` directly in the Package scripts, Migrations and Monorepo guides, so a project only needs the one `dbx` command.

  </details>

</details>

## 1.2.7 (October 2026)

<details>
<summary>Documentation</summary>

- Link package script migrations from the Migrations page ([#036ebf5](https://github.com/deltabox-studio/toolchain/commit/036ebf5) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a "Package scripts" section to the Migrations guide with the Biome/Turbo script swaps and a link to the full Package scripts page.

  </details>

</details>

## 1.2.6 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Config
- Tidy generated types and format them with Oxfmt ([#6fef440](https://github.com/deltabox-studio/toolchain/commit/6fef440) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `untyped`'s type generator emits a blank line between every member and verbose multi-line JSDoc. Strip the member blank lines in the generator, then run the generated output through Oxfmt's programmatic `format()` (with `jsdoc: true`) at generation time instead of shelling out to the repo-root `vp`, so the file is written already formatted and resembles the hand-written `types.ts`.
    - Also drop the toolchain-specific `yarn config:types` hint from the generated header: the types ship through `@deltabox/toolchain-shared`, so a script name that only exists in this repo's `package.json` is misleading to consumers (a consumer supplies its own header via the `header` option).

  </details>

</details>

<details>
<summary>Documentation</summary>

- Add Package scripts guide and a navbar version ([#b279739](https://github.com/deltabox-studio/toolchain/commit/b279739) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a guide page covering the recommended root scripts (Vite+ format/lint and Vite Task) and how to migrate an existing Biome + Turbo project onto them, and surface it in the sidebar and Getting Started list. Also show the current version in the navbar (linked to the changelog, releases and npm), like the Proxified docs.

  </details>

</details>

## 1.2.5 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Changelog
- Keep generated commitlint enums expanded ([#a6ad600](https://github.com/deltabox-studio/toolchain/commit/a6ad600) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Oxfmt collapses an array onto one line when it fits the print width, so a generated `commitlint.config.mjs` whose type/scope enum is short was reformatted by `vp fmt` and then failed `dbx sync --check`. An inert leading line comment inside each enum keeps the list expanded regardless of the consumer's print width, so the generated file is now Oxfmt-idempotent and consumers no longer need to exclude it from formatting.

  </details>

</details>

## 1.2.4 (October 2026)

<details>
<summary>Documentation</summary>

- Update documentation ([#3880aaa](https://github.com/deltabox-studio/toolchain/commit/3880aaa) by [T0chi](https://github.com/T0chi))

</details>

## 1.2.3 (October 2026)

<details>
<summary>Documentation</summary>

- Update vscode extension screenshot ([#e3e189d](https://github.com/deltabox-studio/toolchain/commit/e3e189d) by [T0chi](https://github.com/T0chi))

</details>

## 1.2.2 (October 2026)

<details>
<summary>Documentation</summary>

- Update config generator documentation ([#8305ef8](https://github.com/deltabox-studio/toolchain/commit/8305ef8) by [T0chi](https://github.com/T0chi))

</details>

## 1.2.1 (October 2026)

<details>
<summary>Documentation</summary>

- Show how to load the generated config ([#0f4d0d1](https://github.com/deltabox-studio/toolchain/commit/0f4d0d1) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a "Load the config at runtime" section to the config generator guide (`parseEnvTree`, the typed accessors, `applyOverrides`, and schema validation via `compileZodSchema`) plus a short loading example in the README.

  </details>

- Update description and tags ([#64b64aa](https://github.com/deltabox-studio/toolchain/commit/64b64aa) by [T0chi](https://github.com/T0chi))

</details>

## 1.2.0 (October 2026)

<details>
<summary>New features</summary>

#### Config
- Generate the shared config types via the config generator ([#a063a2d](https://github.com/deltabox-studio/toolchain/commit/a063a2d) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Teach the config engine's Zod->untyped bridge and types generator to handle unions (`anyOf`/`oneOf`), `const`, and unknown records, and to render a schema's fields on the main interface when it has no `base` group (plus type aliases for non-object roots). Named `$ref`s (via `.meta({ id })`) render as the type name, so the generated config types reference each other instead of inlining.
    - Generate `packages/shared/src/config-types.ts` from the Zod config model with the engine's `renderConfigTypes` (`yarn config:types`); `config-schema.ts` keeps only the schemas and the types are exported from `config-types.ts`.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Vscode
- Group managed files by project and reorder the views ([#f5b49d9](https://github.com/deltabox-studio/toolchain/commit/f5b49d9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The Managed Files view read a manifest per project, so a monorepo's root-level managed files never showed. Read each workspace root's manifest and group its files by the deepest project that owns them. Move the Projects view above Managed Files (renamed from Files).

  </details>

</details>

<details>
<summary>Documentation</summary>

- Document the config generator outputs ([#fcfcd69](https://github.com/deltabox-studio/toolchain/commit/fcfcd69) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Show a short example of each generated output (config types, markdown, env, JSON schema) in the config generator guide and the README.

  </details>

- Update vscode extension preview ([#fd90dda](https://github.com/deltabox-studio/toolchain/commit/fd90dda) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.24 (October 2026)

<details>
<summary>Documentation</summary>

- Update features ([#071006e](https://github.com/deltabox-studio/toolchain/commit/071006e) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.23 (October 2026)

<details>
<summary>Documentation</summary>

- Using different logo for the hero ([#552172d](https://github.com/deltabox-studio/toolchain/commit/552172d) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.22 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Skip the Marketplace publish when `VSCE_PAT` is unset ([#fe4b3ad](https://github.com/deltabox-studio/toolchain/commit/fe4b3ad) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The VS Code Marketplace publish was the only failing release step (no `VSCE_PAT` set). Make it a no-op while the secret is unset and publish automatically once it is added to the `toolchain / release` environment.
    - Also remove the temporary OIDC diagnostic step now that the release publishes.

  </details>

</details>

## 1.1.21 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Publish to npm directly, falling back to a staged publish ([#85cffe7](https://github.com/deltabox-studio/toolchain/commit/85cffe7) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Try `npm publish` first and fall back to `npm stage publish` on failure, so toggling the trusted publisher's publish/stage permissions on npm never breaks the release: a direct publish succeeds when allowed, and a staged publish (always permitted) is used otherwise.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Show the published npm version in the README badge ([#5f83ca2](https://github.com/deltabox-studio/toolchain/commit/5f83ca2) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Replace the static npm-name badge with a shields.io npm/v badge so the README shows the currently published version.

  </details>

</details>

## 1.1.20 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Stage npm releases via OIDC instead of publishing directly ([#53d1f52](https://github.com/deltabox-studio/toolchain/commit/53d1f52) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Default to `npm stage publish` for OIDC trusted publishing: it always stages the version and defers the maintainer's 2FA approval, and is always permitted for a trusted publisher (unlike direct `npm publish`, which the package's 2FA policy rejects). Drop the automation-token fallback and require npm >= 11.15.1 (the first with `npm stage`).

  </details>

</details>

## 1.1.19 (October 2026)

<details>
<summary>Chores</summary>

#### Ci
- Add a temporary OIDC diagnostic to the release workflow ([#7b42e33](https://github.com/deltabox-studio/toolchain/commit/7b42e33) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The publish still fails after binding the environment, and npm falls back to the (automation) token and 403s. Add a temporary step that decodes the OIDC claims and calls the token-exchange endpoint directly so the exact trusted-publisher mismatch is visible in the log. Removed once fixed.

  </details>

</details>

## 1.1.18 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Bind the release job to the OIDC environment ([#7b8f1b4](https://github.com/deltabox-studio/toolchain/commit/7b8f1b4) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The npm OIDC trusted publisher is bound to the GitHub environment "toolchain / release", but the release job declared no environment. The OIDC environment claim therefore did not match, the token exchange failed, and npm silently fell back to the placeholder token (the misleading E404).
    - Declare `environment: 'toolchain / release'` on the job and add an optional `NODE_AUTH_TOKEN` fallback (the environment's `NPM_TOKEN`) to the publish step. OIDC is still tried first, so the token is never relied on.

  </details>

#### Vscode
- Spawn the CLI safely on Windows ([#99e3ad1](https://github.com/deltabox-studio/toolchain/commit/99e3ad1) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - `spawn('npx.cmd', ...)` throws EINVAL synchronously on Windows, and `captureCli`/`runCli` call spawn inside a Promise executor, so the throw rejected the promise and the command aborted with no UI ("nothing happens"). This fired whenever the CLI resolved to the `npx.cmd` fallback (a workspace without a local `@deltabox/toolchain`), e.g. "From template..." which round-trips `template:list --json` through `captureCli`.
    - Add a pure `win-spawn` module (ported from the shared `spawnCross`) that escapes the command + args and runs a `.cmd` shim through `cmd.exe`; use it from `spawnCli`. `captureCli`/`runCli` no longer reject on a spawn failure. Also fix `cliInvocation` for the integrated terminal: `process.execPath` is the VS Code binary in the extension host, so it now uses `npx dbx` / `npx --yes @deltabox/toolchain`.

  </details>

</details>

## 1.1.17 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Ci
- Upgrade npm before publishing for OIDC trusted publishing ([#657d4b9](https://github.com/deltabox-studio/toolchain/commit/657d4b9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Node 22 bundles npm 10.x, but npm OIDC trusted publishing requires npm >= 11.5.1. Without it `npm publish` fell back to token auth and the registry answered a misleading 404, so every release since 1.0.7 failed at the publish step. Add an explicit npm upgrade step before the publish step in the generated release workflow.

  </details>

</details>

## 1.1.16 (October 2026)

<details>
<summary>Documentation</summary>

- Reindent the README table of contents ([#5646bcc](https://github.com/deltabox-studio/toolchain/commit/5646bcc) by [T0chi](https://github.com/T0chi))
- Theme-aware logo (light/dark) + invert the home hero logo in dark mode ([#fd3691f](https://github.com/deltabox-studio/toolchain/commit/fd3691f) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.15 (October 2026)

<details>
<summary>Chores</summary>

- Formatted `README.md` ([#4485c48](https://github.com/deltabox-studio/toolchain/commit/4485c48) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.14 (October 2026)

<details>
<summary>Documentation</summary>

- Highlight the Vite/Vite+ plugin in the README and docs ([#8218179](https://github.com/deltabox-studio/toolchain/commit/8218179) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.13 (October 2026)

<details>
<summary>Chores</summary>

- Re-enable npm provenance (repo is public) ([#71ed60d](https://github.com/deltabox-studio/toolchain/commit/71ed60d) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.12 (October 2026)

<details>
<summary>Chores</summary>

- Disable npm provenance (unsupported from a private repo) ([#f118193](https://github.com/deltabox-studio/toolchain/commit/f118193) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.11 (October 2026)

<details>
<summary>Documentation</summary>

- Drop backticks from the landing feature cards ([#9d6ed28](https://github.com/deltabox-studio/toolchain/commit/9d6ed28) by [T0chi](https://github.com/T0chi))
- Use `currentColor` for the logo so it shows on light mode ([#907a07e](https://github.com/deltabox-studio/toolchain/commit/907a07e) by [T0chi](https://github.com/T0chi))
- Fix README formatting ([#2dc01d4](https://github.com/deltabox-studio/toolchain/commit/2dc01d4) by [T0chi](https://github.com/T0chi))
- Make the logo black in light mode (white in dark) ([#c6d9410](https://github.com/deltabox-studio/toolchain/commit/c6d9410) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>CI</summary>

- Auto-fix format + lint in the CI check step ([#9da9797](https://github.com/deltabox-studio/toolchain/commit/9da9797) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.10 (October 2026)

<details>
<summary>Chores</summary>

- Removed unnecessary shields ([#1efbe68](https://github.com/deltabox-studio/toolchain/commit/1efbe68) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.9 (October 2026)

<details>
<summary>Documentation</summary>

- Reindent the README lists ([#1d41d68](https://github.com/deltabox-studio/toolchain/commit/1d41d68) by [T0chi](https://github.com/T0chi))
- Mirror the VS Code extension installation guide from the README ([#1889832](https://github.com/deltabox-studio/toolchain/commit/1889832) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Update VS Code extension installation guide in `README.md` ([#aab06d5](https://github.com/deltabox-studio/toolchain/commit/aab06d5) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.8 (October 2026)

<details>
<summary>Documentation</summary>

- Hide the site title next to the navbar logo ([#c7935ec](https://github.com/deltabox-studio/toolchain/commit/c7935ec) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.7 (October 2026)

<details>
<summary>Chores</summary>

- Revise CLI commands and VS Code extension details ([#7f043f9](https://github.com/deltabox-studio/toolchain/commit/7f043f9) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.6 (October 2026)

<details>
<summary>Documentation</summary>

- Use `box2d.svg` for the navbar/hero logo and `box2d_bg.svg` for the favicon ([#2c7a094](https://github.com/deltabox-studio/toolchain/commit/2c7a094) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.5 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Changelog
- Bump only the version field and stage only owned files ([#8b14cc9](https://github.com/deltabox-studio/toolchain/commit/8b14cc9) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.4 (October 2026)

<details>
<summary>Documentation</summary>

- Trim the README and refresh the docs/license sections ([#a20deb5](https://github.com/deltabox-studio/toolchain/commit/a20deb5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Name the changelog and tsconfig bins explicitly ([#50144cd](https://github.com/deltabox-studio/toolchain/commit/50144cd) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.3 (October 2026)

<details>
<summary>Chores</summary>

#### Changelog
- Title the CI section "CI" instead of "Continuous integration" ([#09deb7f](https://github.com/deltabox-studio/toolchain/commit/09deb7f) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.2 (October 2026)

<details>
<summary>Documentation</summary>

- Add a tests badge to the README ([#01513ee](https://github.com/deltabox-studio/toolchain/commit/01513ee) by [T0chi](https://github.com/T0chi))
- Fix `CHANGELOG.md` mojibake and add backticks to code refs ([#6b721eb](https://github.com/deltabox-studio/toolchain/commit/6b721eb) by [T0chi](https://github.com/T0chi))

</details>

## 1.1.1 (October 2026)

<details>
<summary>Documentation</summary>

- Publish `config.schema.json` at the docs site root ([#b7680cb](https://github.com/deltabox-studio/toolchain/commit/b7680cb) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - The VitePress build now copies the generated `dbx` JSON schema into the dist root, so it is served at https://toolchain.deltabox.studio/config.schema.json.

  </details>

</details>

<details>
<summary>CI</summary>

#### Release
- Publish to npm via trusted publishing (OIDC) ([#41be869](https://github.com/deltabox-studio/toolchain/commit/41be869) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - Drop the `NPM_TOKEN`-based `yarn npm publish` (which also staged). Use npm trusted publishing: `id-token: write`, setup-node `registry-url`, `yarn pack` (resolves `catalog:`/`workspace:`) + `npm publish <tarball>` — provenance is generated automatically. Re-enable `publishConfig.provenance`.

  </details>

</details>

## 1.1.0 (October 2026)

<details>
<summary>New features</summary>

#### Vite
- Add a `dbx()` Vite+ plugin and `defineDbxConfig` wrapper ([#a1edaf9](https://github.com/deltabox-studio/toolchain/commit/a1edaf9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - Lets Vite+-only consumers drive `dbx` from `vite.config.ts`: `dbx()` runs `dbx sync` before dev/build (or `dbx sync --check` in CI) and re-syncs on input changes; `defineDbxConfig()` also registers the `vp run dbx:*` tasks (Vite+ reads `run.tasks` from the static config, not a plugin hook).

  </details>

</details>

<details>
<summary>Chores</summary>

- Name the `changelog`/`tsconfig` bins explicitly ([#94c6c17](https://github.com/deltabox-studio/toolchain/commit/94c6c17) by [T0chi](https://github.com/T0chi))

</details>

### Package changes

#### Added
- `@deltabox/toolchain-vite`
  - `vite` `>=5`

## 1.0.8 (October 2026)

<details>
<summary>CI</summary>

#### Release
- Manage the release workflow from `dbx.config.ts` ([#bf55b70](https://github.com/deltabox-studio/toolchain/commit/bf55b70) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - Drop the hand-written `.github/workflows/release.yml`; the release flow (tag + GitHub Release with the VSIX + notes, `npm publish`, Marketplace publish) is now defined under `changelog.workflows.release` in the config and generated by `dbx sync`. Removes the need to hand-write CI.

  </details>

</details>

## 1.0.7 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Vscode
- Package the VSIX without `vp`; ignore `vite.config.ts`; untrack `*.vsix` ([#9d1e403](https://github.com/deltabox-studio/toolchain/commit/9d1e403) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>CI</summary>

#### Release
- Release on push to `main` (tag + GitHub Release + npm + Marketplace) ([#4714b1a](https://github.com/deltabox-studio/toolchain/commit/4714b1a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - Replaces the generated release-PR workflow with a hand-written one that, on each push to `main`, packages the VS Code extension, creates the `v<version>` tag and a GitHub Release (notes from `CHANGELOG.md` + the `.vsix` asset), publishes `@deltabox/toolchain` to npm, and publishes the extension to the VS Code Marketplace. Idempotent: skipped when the tag already exists.

  </details>

</details>

## 1.0.6 (October 2026)

<details>
<summary>Documentation</summary>

- Add GitHub social links to the navbar and footer ([#2925f1a](https://github.com/deltabox-studio/toolchain/commit/2925f1a) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Name the `changelog`/`tsconfig` bins explicitly and disable publish provenance ([#ba2737d](https://github.com/deltabox-studio/toolchain/commit/ba2737d) by [T0chi](https://github.com/T0chi))

</details>

## 1.0.5 (October 2026)

<details>
<summary>Documentation</summary>

- Update tagline ([#e1fa86e](https://github.com/deltabox-studio/toolchain/commit/e1fa86e) by [T0chi](https://github.com/T0chi))

</details>

## 1.0.4 (October 2026)

<details>
<summary>Documentation</summary>

- Add a table of contents to the `README` ([#b2702e8](https://github.com/deltabox-studio/toolchain/commit/b2702e8) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Fix grammar in the package description ([#8a199b8](https://github.com/deltabox-studio/toolchain/commit/8a199b8) by [T0chi](https://github.com/T0chi))

</details>

## 1.0.3 (October 2026)

<details>
<summary>Documentation</summary>

- Highlight the config generator and link `toolchain.deltabox.studio` ([#836cd36](https://github.com/deltabox-studio/toolchain/commit/836cd36) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Exclude `CHANGELOG.md` from Oxfmt (the changelog pipeline owns its format) ([#f6ad3c0](https://github.com/deltabox-studio/toolchain/commit/f6ad3c0) by [T0chi](https://github.com/T0chi))
- Add `MPL-2.0` `LICENSE` and the project homepage ([#cea0fb5](https://github.com/deltabox-studio/toolchain/commit/cea0fb5) by [T0chi](https://github.com/T0chi))

</details>

## 1.0.2 (October 2026)

<details>
<summary>Tests</summary>

#### Changelog
- Update the release workflow reference fixture ([#e7efe0a](https://github.com/deltabox-studio/toolchain/commit/e7efe0a) by [T0chi](https://github.com/T0chi))

</details>

## 1.0.1 (October 2026)

<details>
<summary>Bug fixes</summary>

#### Changelog
- Tolerate a missing `CHANGELOG.md` in the release workflow ([#18ad219](https://github.com/deltabox-studio/toolchain/commit/18ad219) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - The release PR job extracted notes with `awk`, which failed when `CHANGELOG.md` did not exist yet (a fresh repo). Fall back to an empty notes string.

  </details>

- Create `CHANGELOG.md` when missing; ignore dry-run output ([#f5e4926](https://github.com/deltabox-studio/toolchain/commit/f5e4926) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - `prependChangelogEntry` read the existing file unconditionally, so the first run on a repo without a `CHANGELOG.md` failed with `ENOENT`. Seed it with a `# Changelog` header instead. Also gitignore `CHANGELOG.proposed.md`.

  </details>

- Resolve repo root from `cwd` instead of the module location ([#5278e57](https://github.com/deltabox-studio/toolchain/commit/5278e57) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - Running `dbx changelog` from source (or from the published package in `node_modules`) walked up from `import.meta.url` and landed on the wrong `package.json`, so it looked for `CHANGELOG.md` in the wrong directory and failed. Resolve the nearest `package.json` above the working directory instead.

  </details>

</details>

<details>
<summary>Chores</summary>

- Add extension keyword ([#99721f3](https://github.com/deltabox-studio/toolchain/commit/99721f3) by [T0chi](https://github.com/T0chi))
- Drop Netlify config (docs move to Railway); move `PLAN.md` out of the repo ([#e51b714](https://github.com/deltabox-studio/toolchain/commit/e51b714) by [T0chi](https://github.com/T0chi))
- Update package description and keywords ([#d75b503](https://github.com/deltabox-studio/toolchain/commit/d75b503) by [T0chi](https://github.com/T0chi))
- Initial commit of `@deltabox/toolchain` ([#ed4673b](https://github.com/deltabox-studio/toolchain/commit/ed4673b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - - Self-hosts CI + changelog: `dbx.config.ts` drives the generated workflows, commitlint config and Conventional-Commits VS Code settings. Config file is `dbx.config.*` with sections wrapped under `toolchain`.

  </details>

</details>
