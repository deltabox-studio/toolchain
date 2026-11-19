---
title: Development
outline: [2, 3]
---

# Development

## Setup

You need to fork **or** clone this repo:

```sh
gh repo fork deltabox-studio/toolchain # fork
gh repo clone deltabox-studio/toolchain # clone
```

The `dev` branch is the main branch, so no need to switch branches.

## Commands

This repo is a Yarn 4 workspace. Vite+ (`vp`) drives format, lint, test and the
task runner from the root `vite.config.ts`, which dogfoods the `dbx()` plugin.
There is no root `dbx.config.ts`, `vitest.config.ts` or `tsdown.config.ts`.

The toolchain config lives in the plugin's `toolchain` option; Vitest and the
published package build live in the standard `test` and `pack` fields.

Each workspace uses a hand-written plugin-mode `vite.config.ts`; Vite and Vitest
resolve workspace imports through `resolve.tsconfigPaths`.

```sh
yarn install        # fresh checkout
yarn dev            # run the CLI from src/ via tsx
yarn typecheck      # packages + root
yarn check          # Oxfmt + Oxlint check (no writes)
yarn check:fix      # same, auto-fixing every workspace + the root
yarn format         # `vp fmt`
yarn lint           # `vp lint --fix`
yarn build          # packages + root via `vp run` (root pack config)
yarn test           # builds, then package + root tests
yarn test:clean     # remove leftover emulation temp workspaces
```

> `vp` resolves only at the repo root, so run these from the root. A full
> `yarn build` is only needed for the published `dist`/VSIX: typechecks,
> `vp run`/`fmt`/`lint`/`test`, `yarn dev` and Vitest run from source. The
> emulate suite spawns the built `dist/cli/index.js` and therefore needs a
> build.

The VS Code extension's unit tests run with the root Vitest suite. Its
integration suite launches a real extension host
(`yarn workspace toolchain-vscode test:integration`); CI runs it under Xvfb in
the `vscode-integration` job after `ci`. On Windows it cannot run while VS Code
stable is open.

## Random linter/formatter errors

The root `vite.config.ts` imports the plugin from `@deltabox/toolchain/vite`,
which resolves through the repo's self-link:

```
node_modules/@deltabox/toolchain  ->  .  (repo root)
package.json exports "./vite"     ->  ./dist/vite.js
```

Deleting every `dist/` removes `dist/vite.js`, so loading `vite.config.ts` fails
before Oxc/Vite+ can start. Clearing `.vite-temp` will not help.

**Fix:** rebuild the root `dist` without going through `vp` (which itself needs
the config):

```sh
yarn bootstrap
```

This is the checkout bootstrap already used by `postinstall`. It builds the root
`dist` directly from `scripts/root-pack.ts` using Vite+'s bundled `tsdown`,
bypassing the config-loading cycle.

**Notes:**

- You only need the root `dist/vite.js` for config loading. The root build
  inlines workspace sources, so `packages/*/dist` can stay deleted.
- If you clean all `dist` dirs again, run `yarn bootstrap` (or `yarn install`,
  which re-runs the `postinstall`) before using the Oxc VS Code extension or
  `vp`.

## Docs

The docs live in `apps/docs` (VitePress). See
[Documentation](/contribute/documentation) for the local preview, build and
writing workflow.
