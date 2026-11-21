# Changelog

## 3.0.0-beta.2 (November 2026)

<!-- release:start -->

<details>
<summary>Refactors</summary>

- Normalize default JSDoc annotations ([#04f47e8](https://github.com/deltabox-studio/toolchain/commit/04f47e8) by [T0chi](https://github.com/T0chi))

</details>

<!-- release:end -->


## 3.0.0-beta.1 (November 2026)

<details>
<summary>Chores</summary>

- Make the workspace packages private ([#3b3c7d6](https://github.com/deltabox-studio/toolchain/commit/3b3c7d6) by [T0chi](https://github.com/T0chi))

</details>

## 3.0.0-beta.0 (November 2026)

<details>
<summary><strong>BREAKING CHANGES</strong></summary>

#### Docker
- Correct PnP runtimes, nested ignores and Vite+ node versions ([#68eee6f](https://github.com/deltabox-studio/toolchain/commit/68eee6f) by [T0chi](https://github.com/T0chi))
- Correct container builds and runtime setup ([#0567bcd](https://github.com/deltabox-studio/toolchain/commit/0567bcd) by [T0chi](https://github.com/T0chi))
- Use the Bun image and copy Yarn install sources ([#bcf0eec](https://github.com/deltabox-studio/toolchain/commit/bcf0eec) by [T0chi](https://github.com/T0chi))
- Keep COPY sources and installs consistent ([#1ed6b4d](https://github.com/deltabox-studio/toolchain/commit/1ed6b4d) by [T0chi](https://github.com/T0chi))
- Use neutral headers and Bun-aware copies ([#63b4822](https://github.com/deltabox-studio/toolchain/commit/63b4822) by [T0chi](https://github.com/T0chi))
- Make Docker generation scaffolding-only ([#8094d92](https://github.com/deltabox-studio/toolchain/commit/8094d92) by [T0chi](https://github.com/T0chi))
- Allow user-owned files and always add compose ([#51b9ccc](https://github.com/deltabox-studio/toolchain/commit/51b9ccc) by [T0chi](https://github.com/T0chi))

#### Config
- Rename the generated ambient env types to `dbx-env.d.ts` ([#078b316](https://github.com/deltabox-studio/toolchain/commit/078b316) by [T0chi](https://github.com/T0chi))

#### Pack
- Rename the `tsdown` workspace to `pack` ([#02719e5](https://github.com/deltabox-studio/toolchain/commit/02719e5) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>New features</summary>

#### Config
- Add `enabled` and `regenerate` controls ([#7f5444a](https://github.com/deltabox-studio/toolchain/commit/7f5444a) by [T0chi](https://github.com/T0chi))

#### Docker
- Add the `@deltabox/toolchain-docker` package ([#f08cd46](https://github.com/deltabox-studio/toolchain/commit/f08cd46) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Bug fixes</summary>

#### Project
- Harden scaffolds and make Docker plans template-aware ([#e937042](https://github.com/deltabox-studio/toolchain/commit/e937042) by [T0chi](https://github.com/T0chi))

#### Tsconfig
- Reconcile overrides before generation and harden remote extends ([#0fa2caa](https://github.com/deltabox-studio/toolchain/commit/0fa2caa) by [T0chi](https://github.com/T0chi))

</details>

<details>
<summary>Tests</summary>

- Cover Docker generation and containerized scaffolds ([#90148e1](https://github.com/deltabox-studio/toolchain/commit/90148e1) by [T0chi](https://github.com/T0chi))

</details>
