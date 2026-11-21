# Monorepo Guide

## Project graph

`dbx projects` discovers every workspace package and writes a
dependency graph to `.dbx/toolchain/projects.json`. The VS Code extension and the
`sync --recursive` command consume it.

## tsconfig generation

Enable the `tsconfig` section and the toolchain generates each workspace's
`tsconfig.json` (extending `tsconfig.default.json`) and, for a monorepo root, a
`tsconfig.workspaces.json` wiring project references and path aliases:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        project: { type: 'monorepo-root', name: 'acme', scope: '@acme' },
        tsconfig: { refs: true, aliases: true, indent: 4 },
    },
});
```

See the [tsconfig guide](/guide/tsconfig) for every option and why the toolchain
splits the config across several files.

## Scaffolding a monorepo

```sh
dbx project:init:monorepo --name acme --scope @acme --out .
dbx project:init:workspace --name utils --scope @acme --root . --dir packages/utils
```

## Tasks

`deltabox toolchain` (and Vite+ consumers) use **Vite Task** (`vp run`, exposed
as `dbx run`) instead of Turbo. The package graph orders execution via each
package's `package.json` dependencies.

Run tasks from the workspace root. `vp run -r <task>` runs every package's task
in dependency order; `vp run --filter ./apps/web <task>` narrows it. For the
built-in app commands, Vite+ resolves the target package from the root and prints
the direct `vp -C <dir> <command>` form, so you never need to `cd` between
packages. Use `-C` when a command must behave as if it ran inside a package.
To always target one app from the root, set `defaultPackage: './apps/web'`
(a per-command object also works) in the root `vite.config.ts`.

Each package can declare `build`, `typecheck` and `test` in its own
`vite.config.ts` `run.tasks` (or in `dbx.config.ts` under `toolchain.vite`) with
explicit cache input/output, so `vp run` reports cache hits (a `package.json`
script cannot carry cache config). Use `vp pack` / `vp test` instead of the
individual `tsdown` / `vitest` binaries:

```ts [packages/<pkg>/vite.config.ts]
import { defineConfig } from 'vite-plus';

export default defineConfig({
    run: {
        tasks: {
            build: {
                command: 'vp pack',
                cache: {
                    input: [{ auto: true }, '!dist/**', '!**/*.tsbuildinfo'],
                    output: ['dist/**'],
                },
            },
            typecheck: {
                command: 'tsc -p tsconfig.build.json --noEmit',
                cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
            },
            test: {
                command: 'vp test run',
                cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
            },
        },
    },
});
```

The root `package.json` orchestrates them and adds the umbrella build:

```json [package.json]
{
    "scripts": {
        "build": "dbx run --filter \"./packages/*\" build && dbx run build:root",
        "test": "dbx run --filter \"./packages/*\" test && dbx run test:root"
    }
}
```

`dbx run --filter "./packages/*" build` runs each package's `build` in
dependency order (excluding the root, which avoids recursion), then `build:root`
builds the umbrella dist.

## Shared formatting and linting

Define `fmt` and `lint` once in the root `vite.config.ts`, and run `vp fmt`,
`vp lint` and `vp check` from the root. Vite+ does not apply nested configs to
individual files, and `vp check` always uses the root blocks, so package-level
`fmt` / `lint` blocks are not recommended. Use `overrides` for package- or
file-specific settings:

```ts [vite.config.ts]
export default defineConfig({
    lint: {
        overrides: [
            { files: ['apps/api/**'], env: { node: true } },
            { files: ['**/*.test.ts'], plugins: ['vitest'] },
        ],
    },
    fmt: {
        overrides: [{ files: ['**/*.md'], options: { proseWrap: 'always' } }],
    },
});
```

Globs resolve from the root config, so use workspace paths such as
`apps/web/**`; do not add per-package formatter/linter blocks.
