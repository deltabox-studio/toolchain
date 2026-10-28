---
title: Config types
outline: [2, 3]
---

# Config types

The toolchain has three configuration surfaces, all derived from the same Zod
model:

- **Programmatic** — `defineConfig({ toolchain: { ... } })` in
  `dbx.config.ts`; typed as `ToolchainConfig` (see the
  [TypeScript guide](/guide/typescript)).
- **CLI** — the `dbx` command options, generated from the command descriptors;
  see the [CLI reference](/config/cli).
- **Environment** — schema leaves can opt into env vars with
  `.meta({ env })`; see the [environment reference](/config/env) and the
  [Config Generator](/guide/config-generator/).

The exhaustive object reference is [dbx.config](/config/reference); the editor
JSON Schema is [config.schema.json](https://toolchain.deltabox.studio/config.schema.json).

## Fields

Every generated page uses the same `ConfigMeta` fields: `description`,
`required`, `deprecated`, `example`, `secret`, `scope`, `public`,
`defaultValue`, the env fields `envName`, `envPath` and more.
