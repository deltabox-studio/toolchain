# Changelog

## 3.0.0-beta.15 (November 2026)

<!-- release:start -->

<details>
<summary>Chores</summary>

- Update domain `toolchain.deltabox.studio` to `toolchain.dbx.studio` ([#966f975](https://github.com/deltabox-studio/toolchain/commit/966f975) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.14 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Changelog
- Escape html-like tags so the docs build succeeds ([#b63280c](https://github.com/deltabox-studio/toolchain/commit/b63280c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - VitePress compiles Markdown as Vue SFCs, so a raw '&lt;Group&gt;' placeholder from a commit body was parsed as an unclosed element and failed apps/docs. Escape tag-like sequences in generated commit subjects and bodies (and while reformatting bullets), while leaving inline code spans, autolinks and comparisons untouched. Also escape the existing beta.19 entry in both changelogs.

  </details>

</details>

## 3.0.0-beta.13 (November 2026)

<details>
<summary>New features</summary>

#### Config
- Sort help commands and add a sort option ([#518d057](https://github.com/deltabox-studio/toolchain/commit/518d057) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Commands now render in ascending name order within every help section, including command groups. A new sort option accepts 'asc' (default), 'desc' or false (declaration order), is exposed as program.sort and threads through createCli/runCli via RootCliOptions. Group headings keep their first-appearance order so the dogfood sidebar grouping is preserved. Docs and llms bundle updated.

  </details>

- Group commands by delimited name paths ([#8598303](https://github.com/deltabox-studio/toolchain/commit/8598303) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Add a groups program option (default true) that renders help commands in grouped sections. With auto enabled (default) commands sharing a name path such as vite:list are grouped under a capitalised heading using the configured delimiter(s), defaulting to ':'. Explicit CliCommand/ConfigProgramCommand group labels override the derived group, groups:false renders a flat list, and groups:{auto:false} only honours explicit groups. dbx createCli/runCli expose the same option.

  </details>

- Group help options by heading ([#4815336](https://github.com/deltabox-studio/toolchain/commit/4815336) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - CliOption gains an optional group label. The default help renderer keeps ungrouped options under Options: and prints each group under its own capitalised heading (case-insensitive, first-appearance order). Grouping works for command options and program globals; the help/format docs and llms bundle are updated.

  </details>

#### Cli
- Group the dogfood commands and options like the docs sidebar ([#4d986db](https://github.com/deltabox-studio/toolchain/commit/4d986db) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Apply the new group feature to the built-in dbx CLI. Core workspace commands stay under Commands:, followed by Project & templates, Tooling, Automation & API, Agents and Vite+ headings in docs-sidebar order. Options gain per-command groups (sync, changelog, migrate, project/template scaffolding, tsconfig, MCP/skills, ...), with groups:false and auto:false still behaving as documented. The generated CLI reference and llms bundle are refreshed.

  </details>

- Make help-on-error opt-in ([#2a01d42](https://github.com/deltabox-studio/toolchain/commit/2a01d42) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Invalid argv no longer appends the full program help automatically, so failures stay short and scriptable. Config programs gain a helpOnError option (exposed as the readonly program.helpOnError), and dbx's createCli/runCli accept { helpOnError: true } to restore the old behavior. Defaults to false and matches the config engine cli program option.

  </details>

#### Mcp
- Teach the official skill to inspect the project ([#1982ac2](https://github.com/deltabox-studio/toolchain/commit/1982ac2) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The installed skill now tells agents to check whether dbx is enabled via dbx.config.*, a vite.config.* dbx() plugin or .vscode/settings.json (deltabox.toolchain.enabled), read .dbx/toolchain/projects.json for the project graph/config locations and manifest.json for managed files, and inspect the enabled toolchain sections. It calls out commitlint/changelog conventions for commits and documents sync --check.

  </details>

- Add the official dbx skill installer ([#359e166](https://github.com/deltabox-studio/toolchain/commit/359e166) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Introduce the official docs skill, which tells agents to read https://toolchain.dbx.studio/llms.txt before answering or editing. The mcp package gains checkSkill/installSkill/installOfficialSkill (idempotent, forceable), a 'dbx skills --official' command with provider/scope/dir options, and a skills sync task driven by the new toolchain.mcp.skills section (opt-in by presence). The VS Code extension exposes an 'Install official skill' prompt action and Home quick action. Config types, schema, generated reference and docs are updated.

  </details>

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Suffix grouped help headings with options or commands ([#342825a](https://github.com/deltabox-studio/toolchain/commit/342825a) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Named option groups now render as '&lt;Group&gt; options:' and command groups as '&lt;Group&gt; commands:', while the default sections stay 'Options:' and 'Commands:'. The program 'groups' option now also flattens option groups when false, so the same toggle controls every help group.

  </details>

</details>

<details>
<summary>Documentation</summary>

- Cover grouped help, sorting and the official skill in v2-v3 ([#d01d5f9](https://github.com/deltabox-studio/toolchain/commit/d01d5f9) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Document the groups/sort program options, opt-in helpOnError, the dbx skills command and API, toolchain.mcp.skills automatic installation, and the VS Code skill installer action in the migration guide.

  </details>

- Update documentation ([#ba637c3](https://github.com/deltabox-studio/toolchain/commit/ba637c3) by [T0chi](https://github.com/T0chi))

#### Cli
- Document the dogfood command groups ([#dcd6d1b](https://github.com/deltabox-studio/toolchain/commit/dcd6d1b) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - List the built-in help groups and their docs-sidebar order.

  </details>

#### Config
- Clarify that groups covers options and commands ([#c80cc9c](https://github.com/deltabox-studio/toolchain/commit/c80cc9c) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - The groups program option flattens both option and command groups when false and auto only affects derived command groups. Update the option JSDoc, RootCliOptions docs and guides to say so explicitly.

  </details>

</details>

<details>
<summary>Styles</summary>

- Replace remaining unicode ellipses ([#0bc4a05](https://github.com/deltabox-studio/toolchain/commit/0bc4a05) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Normalize the docs committed after the last formatter pass so check stays clean.

  </details>

</details>

## 3.0.0-beta.12 (November 2026)

<details>
<summary>New features</summary>

#### Release
- Mark prerelease versions as GitHub prereleases ([#dd1c62f](https://github.com/deltabox-studio/toolchain/commit/dd1c62f) by [T0chi](https://github.com/T0chi))

#### Changelog
- Document bump rules and harden versioning providers ([#5ae5e02](https://github.com/deltabox-studio/toolchain/commit/5ae5e02) by [T0chi](https://github.com/T0chi))
- Group release bodies since the last published release ([#93b8762](https://github.com/deltabox-studio/toolchain/commit/93b8762) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Changelog
- Repair and audit markdown code fences ([#8a4ab01](https://github.com/deltabox-studio/toolchain/commit/8a4ab01) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Update permalinks ([#5abe04e](https://github.com/deltabox-studio/toolchain/commit/5abe04e) by [T0chi](https://github.com/T0chi))
- Add a deprecations section to the v2-v3 guide ([#3121d44](https://github.com/deltabox-studio/toolchain/commit/3121d44) by [T0chi](https://github.com/T0chi))

#### Release
- Clarify auto prerelease detection ([#bc5c01f](https://github.com/deltabox-studio/toolchain/commit/bc5c01f) by [T0chi](https://github.com/T0chi))

#### Changelog
- Add a release bodies guide under the changelog section ([#e00a44b](https://github.com/deltabox-studio/toolchain/commit/e00a44b) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.11 (November 2026)

<details>
<summary>Bug fixes</summary>

- Use the published Vite subpath in generated configs ([#d5f2fab](https://github.com/deltabox-studio/toolchain/commit/d5f2fab) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

- Rename format scripts and tasks to fmt ([#fcd3ae0](https://github.com/deltabox-studio/toolchain/commit/fcd3ae0) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Refresh readmes and extension copy ([#ad7e37d](https://github.com/deltabox-studio/toolchain/commit/ad7e37d) by [T0chi](https://github.com/T0chi))
- Highlight who the toolchain is for ([#bdd324a](https://github.com/deltabox-studio/toolchain/commit/bdd324a) by [T0chi](https://github.com/T0chi))
- Expand who the toolchain is for ([#128d875](https://github.com/deltabox-studio/toolchain/commit/128d875) by [T0chi](https://github.com/T0chi))
- Explain providers for other language toolchains ([#1671f9e](https://github.com/deltabox-studio/toolchain/commit/1671f9e) by [T0chi](https://github.com/T0chi))
- Note the toolchain dogfoods itself ([#e864aef](https://github.com/deltabox-studio/toolchain/commit/e864aef) by [T0chi](https://github.com/T0chi))
- Cover core features in why use this ([#195bba8](https://github.com/deltabox-studio/toolchain/commit/195bba8) by [T0chi](https://github.com/T0chi))
- Split programmatic API examples into sections ([#8f8ebd9](https://github.com/deltabox-studio/toolchain/commit/8f8ebd9) by [T0chi](https://github.com/T0chi))
- Add contextual sidebar sections ([#aca7fdf](https://github.com/deltabox-studio/toolchain/commit/aca7fdf) by [T0chi](https://github.com/T0chi))
- Remove Contribute from the top navbar ([#5dce447](https://github.com/deltabox-studio/toolchain/commit/5dce447) by [T0chi](https://github.com/T0chi))
- Move navbar search beside the logo ([#aa7c7de](https://github.com/deltabox-studio/toolchain/commit/aa7c7de) by [T0chi](https://github.com/T0chi))
- Add v3 new features to the migration guide ([#0a5ee8b](https://github.com/deltabox-studio/toolchain/commit/0a5ee8b) by [T0chi](https://github.com/T0chi))
- Fix invalid folder-tree YAML in template structures ([#c7e8efa](https://github.com/deltabox-studio/toolchain/commit/c7e8efa) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

- Commit pending docs and type updates ([#5701b52](https://github.com/deltabox-studio/toolchain/commit/5701b52) by [T0chi](https://github.com/T0chi))
- Cleanup references ([#a0027cd](https://github.com/deltabox-studio/toolchain/commit/a0027cd) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.10 (November 2026)

<details>
<summary>New features</summary>

- Align hooks and monorepo guidance with Vite+ ([#0aadd01](https://github.com/deltabox-studio/toolchain/commit/0aadd01) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.9 (November 2026)

<details>
<summary>Documentation</summary>

- Clarify vite-plus is a dev dependency ([#b7d5ce6](https://github.com/deltabox-studio/toolchain/commit/b7d5ce6) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.8 (November 2026)

<details>
<summary>Bug fixes</summary>

#### Changelog
- Build release bodies from markers and rename flags ([#825985d](https://github.com/deltabox-studio/toolchain/commit/825985d) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Prefer engine.cli.program.create and update v3 guides ([#325d2fd](https://github.com/deltabox-studio/toolchain/commit/325d2fd) by [T0chi](https://github.com/T0chi))
- Cover template structures and config CLI programs ([#8d5e2c5](https://github.com/deltabox-studio/toolchain/commit/8d5e2c5) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Document folder-tree template structures, the config-engine program/command APIs, schema-driven CLI metadata, and the new source-specific loaders. Refresh generated CLI/config pages and the llms bundles.

  </details>

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

## 3.0.0-beta.7 (November 2026)

<details>
<summary>Documentation</summary>

- Add Contribute to the docs navigation ([#c7a32e4](https://github.com/deltabox-studio/toolchain/commit/c7a32e4) by [T0chi](https://github.com/T0chi))
- Add the contribute guide ([#17c62df](https://github.com/deltabox-studio/toolchain/commit/17c62df) by [T0chi](https://github.com/T0chi))
- Update migration guide links ([#b58b9fb](https://github.com/deltabox-studio/toolchain/commit/b58b9fb) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.6 (November 2026)

<details>
<summary>Documentation</summary>

- Reorganize the documentation navigation ([#342de5a](https://github.com/deltabox-studio/toolchain/commit/342de5a) by [T0chi](https://github.com/T0chi))
- Document the Vite plugin and Vite+ commands ([#95c1e66](https://github.com/deltabox-studio/toolchain/commit/95c1e66) by [T0chi](https://github.com/T0chi))
- Expand the v3 migration guide ([#9a6d0d0](https://github.com/deltabox-studio/toolchain/commit/9a6d0d0) by [T0chi](https://github.com/T0chi))

#### Vscode
- Sync the extension reference ([#9824034](https://github.com/deltabox-studio/toolchain/commit/9824034) by [T0chi](https://github.com/T0chi))

#### Config
- Revamp the configuration overview ([#fe4137e](https://github.com/deltabox-studio/toolchain/commit/fe4137e) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.5 (November 2026)

<details>
<summary>Chores</summary>

#### Ci
- Bump setup-vp to v1.22.0 ([#9c32cae](https://github.com/deltabox-studio/toolchain/commit/9c32cae) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.4 (November 2026)

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

## 3.0.0-beta.3 (November 2026)

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

## 3.0.0-beta.2 (November 2026)

<details>
<summary>New features</summary>

#### Project
- Leave fmt and lint to the root in nested scaffolds ([#c646ea5](https://github.com/deltabox-studio/toolchain/commit/c646ea5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Align the READMEs and guides with v3 ([#c6487b8](https://github.com/deltabox-studio/toolchain/commit/c6487b8) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.1 (November 2026)

<details>
<summary>New features</summary>

#### Changelog
- Add the beforeVersion lifecycle hook ([#3f62f0c](https://github.com/deltabox-studio/toolchain/commit/3f62f0c) by [T0chi](https://github.com/T0chi))
- Add the afterVersion lifecycle hook ([#c927eee](https://github.com/deltabox-studio/toolchain/commit/c927eee) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

- Resolve the bug-hunt findings ([#f07f951](https://github.com/deltabox-studio/toolchain/commit/f07f951) by [T0chi](https://github.com/T0chi))

#### Changelog
- Relabel details summaries and default the release body ([#7ccfc86](https://github.com/deltabox-studio/toolchain/commit/7ccfc86) by [T0chi](https://github.com/T0chi))
- Add collapsible `details` rendering ([#f7d1c6a](https://github.com/deltabox-studio/toolchain/commit/f7d1c6a) by [T0chi](https://github.com/T0chi))
- Make releases idempotent and prerelease-aware ([#610138b](https://github.com/deltabox-studio/toolchain/commit/610138b) by [T0chi](https://github.com/T0chi))

#### Cli
- Add spinners and Dependabot allow rules ([#fa9ba22](https://github.com/deltabox-studio/toolchain/commit/fa9ba22) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Support remote extends with opt-in flattening ([#44b5c8a](https://github.com/deltabox-studio/toolchain/commit/44b5c8a) by [T0chi](https://github.com/T0chi))
- Add `strict` aliases and export-aware auto modes ([#fee5091](https://github.com/deltabox-studio/toolchain/commit/fee5091) by [T0chi](https://github.com/T0chi))
- Serialize regex aliases for JSON transports ([#d7d8caf](https://github.com/deltabox-studio/toolchain/commit/d7d8caf) by [T0chi](https://github.com/T0chi))

#### Docker
- Correct PnP runtimes, nested ignores and Vite+ node versions ([#68eee6f](https://github.com/deltabox-studio/toolchain/commit/68eee6f) by [T0chi](https://github.com/T0chi))
- Allow user-owned files and always add compose ([#51b9ccc](https://github.com/deltabox-studio/toolchain/commit/51b9ccc) by [T0chi](https://github.com/T0chi))

#### Config
- Rename the generated ambient env types to `dbx-env.d.ts` ([#078b316](https://github.com/deltabox-studio/toolchain/commit/078b316) by [T0chi](https://github.com/T0chi))
- Add runtime config APIs and grouped `ConfigEngine` types ([#b69980e](https://github.com/deltabox-studio/toolchain/commit/b69980e) by [T0chi](https://github.com/T0chi))
- Add `collect`, parser and config loader APIs ([#4a3b745](https://github.com/deltabox-studio/toolchain/commit/4a3b745) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

#### Core
- Make managed-file formatting opt-in ([#2a7c709](https://github.com/deltabox-studio/toolchain/commit/2a7c709) by [T0chi](https://github.com/T0chi))
- Format managed files after `dbx sync` ([#fb3d9be](https://github.com/deltabox-studio/toolchain/commit/fb3d9be) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Vscode
- Decorate managed files and reveal the active project ([#a6debec](https://github.com/deltabox-studio/toolchain/commit/a6debec) by [T0chi](https://github.com/T0chi))
- Add scoped auto-sync, the action palette and the Actions view ([#c330378](https://github.com/deltabox-studio/toolchain/commit/c330378) by [T0chi](https://github.com/T0chi))
- Add generic format/lint actions and formatting settings ([#c256de5](https://github.com/deltabox-studio/toolchain/commit/c256de5) by [T0chi](https://github.com/T0chi))

#### Shared
- Add static schema defaults ([#3b810d3](https://github.com/deltabox-studio/toolchain/commit/3b810d3) by [T0chi](https://github.com/T0chi))

#### Config
- Reuse changelog group and option schemas ([#cbd9b54](https://github.com/deltabox-studio/toolchain/commit/cbd9b54) by [T0chi](https://github.com/T0chi))

#### Changelog
- Add `minCommits` and nested `See more...` descriptions ([#9fa603b](https://github.com/deltabox-studio/toolchain/commit/9fa603b) by [T0chi](https://github.com/T0chi))
- Fix details formatting and add release mode ([#5fa519f](https://github.com/deltabox-studio/toolchain/commit/5fa519f) by [T0chi](https://github.com/T0chi))
- Apply details after formatting and add body collapsibles ([#83dd7da](https://github.com/deltabox-studio/toolchain/commit/83dd7da) by [T0chi](https://github.com/T0chi))
- Add scoped versioning options and changelog `intro`/`outro` ([#09cf5d9](https://github.com/deltabox-studio/toolchain/commit/09cf5d9) by [T0chi](https://github.com/T0chi))

#### Cli
- Add changelog intro/outro flags and respect `enabled` ([#7d74c71](https://github.com/deltabox-studio/toolchain/commit/7d74c71) by [T0chi](https://github.com/T0chi))
- Add `dbx enable`/`disable` and `enabled` ([#67ea4c3](https://github.com/deltabox-studio/toolchain/commit/67ea4c3) by [T0chi](https://github.com/T0chi))

#### Mcp
- Add the MCP server, installers and `dbx mcp:*` commands ([#0553843](https://github.com/deltabox-studio/toolchain/commit/0553843) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Escape generated JSDoc comments, closes [#41](https://github.com/deltabox-studio/toolchain/issues/41) ([#220d228](https://github.com/deltabox-studio/toolchain/commit/220d228) by [T0chi](https://github.com/T0chi)) (fixes [#41](https://github.com/deltabox-studio/toolchain/issues/41))

#### Cli
- Harden flag parsing and document library-only config commands ([#aaaa11a](https://github.com/deltabox-studio/toolchain/commit/aaaa11a) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Refactors</summary>

#### Config
- Share the runtime loader with core ([#e84e4e6](https://github.com/deltabox-studio/toolchain/commit/e84e4e6) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

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
<summary>Chores</summary>

- Normalize imports and docs ([#c7f0d25](https://github.com/deltabox-studio/toolchain/commit/c7f0d25) by [T0chi](https://github.com/T0chi))

#### Config
- Regenerate the schema, types and docs ([#2c4dc1e](https://github.com/deltabox-studio/toolchain/commit/2c4dc1e) by [T0chi](https://github.com/T0chi))
- Regenerate the CLI docs and llms output ([#cf8661f](https://github.com/deltabox-studio/toolchain/commit/cf8661f) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#82ca5c3](https://github.com/deltabox-studio/toolchain/commit/82ca5c3) by [T0chi](https://github.com/T0chi))
- Generate plain array unions and `details` types ([#486d264](https://github.com/deltabox-studio/toolchain/commit/486d264) by [T0chi](https://github.com/T0chi))
- Regenerate the schema, types and docs ([#12788f0](https://github.com/deltabox-studio/toolchain/commit/12788f0) by [T0chi](https://github.com/T0chi))
- Regenerate types and references ([#3c7917a](https://github.com/deltabox-studio/toolchain/commit/3c7917a) by [T0chi](https://github.com/T0chi))
- Regenerate types and references ([#de928fa](https://github.com/deltabox-studio/toolchain/commit/de928fa) by [T0chi](https://github.com/T0chi))

</details>

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

</details>

<details>
<summary>Documentation</summary>

- Document watcher scoping and project identity inheritance ([#074bfcd](https://github.com/deltabox-studio/toolchain/commit/074bfcd) by [T0chi](https://github.com/T0chi))

  <details>
  <summary><strong>See more...</strong></summary>

  - Update the VS Code auto-sync section and the project guide to match the implementation: watchers are root-scoped and sync only the changed root; project name/scope/description/type are never inherited. Regenerate llms-full.txt.

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

## 2.3.0 (November 2026)

<details>
<summary>New features</summary>

#### Changelog
- Dispatch workflows with their vendor CLI ([#eea38ae](https://github.com/deltabox-studio/toolchain/commit/eea38ae) by [T0chi](https://github.com/T0chi))

#### Config
- Type tool options and changelog callbacks ([#10bd933](https://github.com/deltabox-studio/toolchain/commit/10bd933) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Config
- Escape CLI reference tables and fail on missing output ([#15978be](https://github.com/deltabox-studio/toolchain/commit/15978be) by [T0chi](https://github.com/T0chi))

#### Core
- Keep managed paths inside the project root ([#2496bee](https://github.com/deltabox-studio/toolchain/commit/2496bee) by [T0chi](https://github.com/T0chi))

#### Changelog
- Preserve hand-corrected text in `--format-only` ([#2041e5f](https://github.com/deltabox-studio/toolchain/commit/2041e5f) by [T0chi](https://github.com/T0chi))

#### Shared
- Restore `PowerShell`-escaped letters ([#4d2be6a](https://github.com/deltabox-studio/toolchain/commit/4d2be6a) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Documentation</summary>

- Document vendor workflows, typed builders and `--format-only` ([#eb66982](https://github.com/deltabox-studio/toolchain/commit/eb66982) by [T0chi](https://github.com/T0chi))

#### Changelog
- Document `formatLine` ([#61e28ec](https://github.com/deltabox-studio/toolchain/commit/61e28ec) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Chores</summary>

#### Config
- Regenerate config-types, schema and docs ([#0b0ca20](https://github.com/deltabox-studio/toolchain/commit/0b0ca20) by [T0chi](https://github.com/T0chi))

</details>
