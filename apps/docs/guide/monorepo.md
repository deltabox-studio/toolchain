# Monorepo Guide

## Project graph

`dbx projects` discovers every workspace package and writes a
dependency graph to `.dbx/toolchain/projects.json`. The VS Code extension and the
`sync --recursive` command consume it.

## tsconfig generation

Enable the `tsconfig` section and the toolchain generates each workspace's
`tsconfig.json` (extending `tsconfig.default.json`) and, for a monorepo root, a
`tsconfig.monorepo.json` wiring project references and path aliases:

```ts
export default defineConfig({
    toolchain: {
        project: { type: 'monorepo-root', name: 'acme', scope: '@acme' },
        tsconfig: { refs: true, aliases: true, indent: 4 },
    },
});
```

## Scaffolding a monorepo

```bash
dbx project:init:monorepo --name acme --scope @acme --out .
dbx project:init:workspace --name utils --scope @acme --root . --dir packages/utils
```

## Tasks

This repo (and Vite+ consumers) use **Vite Task** (`vp run`) instead of Turbo.
The package graph orders execution via each package's `package.json`
dependencies.

Each package declares `build`, `typecheck` and `test` in its own
`vite.config.ts` with explicit cache input/output, so `vp run` reports cache
hits (a `package.json` script cannot carry cache config):

```ts
// packages/<pkg>/vite.config.ts
export default defineConfig({
    run: {
        tasks: {
            build: {
                command: 'tsdown --config-loader unrun',
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
                command: 'vitest run',
                cache: { input: [{ auto: true }, '!**/*.tsbuildinfo'], output: [] },
            },
        },
    },
});
```

The root `package.json` orchestrates them and adds the umbrella build:

```json
{
    "scripts": {
        "build": "vp run --filter \"./packages/*\" build && vp run build:root",
        "test": "vp run --filter \"./packages/*\" test && vp run test:root"
    }
}
```

`vp run --filter "./packages/*" build` runs each package's `build` in dependency
order (excluding the root, which avoids recursion), then `build:root` builds the
umbrella dist.
