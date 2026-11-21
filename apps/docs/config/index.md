---
title: Overview
outline: [2,3]
---

# Overview

There are four ways to configure dbx. They all feed the same toolchain
model, so a project can combine them.

## `dbx.config.*`

A standalone config file (`dbx.config.ts`, `.mts`, `.cts`, `.js`, `.mjs`,
`.cjs` or `.json`) exports `{ toolchain: { ... } }` with `defineConfig`.

It is the non-Vite path and is typed as `ToolchainConfig` (see the
[TypeScript guide](/guide/typescript)). Every section is opt-in by presence.

## Vite plugin

In a Vite or Vite+ project, pass the same `toolchain` object to the `dbx()`
plugin in `vite.config.*`.

The CLI reads it back from the Vite config, so no
`dbx.config.*` is required. See [Vite plugin](/guide/vite-plugin).

## CLI

`dbx` command flags configure a command for one run. The available options are
generated from the command descriptors. See the [CLI reference](/config/cli).

## Environment variables

Schema leaves that declare `.meta({ envName })` can be set through env vars (the
toolchain config uses the `DBX_` prefix).

See the [environment reference](/config/env) and the
[Config Generator](/guide/config-generator/).

## Editor JSON Schema

The generated [config.schema.json](https://toolchain.deltabox.studio/config.schema.json)
gives editors completion and validation for `dbx.config.*`.

The exhaustive object reference is [dbx.config](/config/reference).

## Types

Find all static types for the configurations
[here](https://github.com/deltabox-studio/toolchain/blob/main/packages/shared/src/config-types.ts).

### Fields

Every generated config reference page uses the same
[ConfigMeta](https://github.com/deltabox-studio/toolchain/blob/main/packages/config/src/types/meta.ts)
fields defined in Zod/Untyped schemas:

- `description`
- `required`
- `deprecated`
- `example`
- `secret`
- `scope`
- `public`
- `defaultValue`
- `envName` (the env fields)
- `envPath`
- `cli` / `cliCommand` (schema-driven CLI flags and commands)
- `envExpose` (keep a value CLI-only) and more.
