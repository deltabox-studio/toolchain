---
title: Documentation
outline: [2, 3]
---

# Documentation

Full documentation, guides and examples live at
[toolchain.deltabox.studio](https://toolchain.deltabox.studio/guide).

The source pages live in `apps/docs` and are built with VitePress.

## Preview locally

```sh
yarn workspace @deltabox/toolchain-docs dev
```

## Build

```sh
yarn docs build
```

The build also regenerates the LLM bundles (`llms.txt` and `llms-full.txt`) and
copies them to the repo root.

## Writing pages

- Add Markdown pages under `apps/docs/guide`, `apps/docs/config` or
  `apps/docs/contribute`.
- The guide sidebar is generated from the docs tree, so a new page appears in
  its section automatically. New top-level sections, the navbar and the manual
  Introduction groups are configured in `apps/docs/.vitepress/config.ts`.
- The pages under `apps/docs/config` are generated. Run `yarn config:generate`
  after changing the config schema; do not edit those pages by hand.
- Run `yarn fmt` and `yarn docs build` before opening a PR.

See the [VitePress documentation](https://vitepress.dev/) for Markdown syntax
and theme options.

## Development

See [Development](/contribute/development) for the repo setup, commands and the
linter/formatter bootstrap fix.
