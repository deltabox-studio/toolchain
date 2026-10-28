# TypeScript

`@deltabox/toolchain` is written in TypeScript and ships the config model, the
generated `.d.ts` files and the ambient Zod metadata types. This page covers the
type-safety story for consumers.

## `dbx.config.ts`

`defineConfig` is an identity helper that gives the config file full
autocomplete and type-checking, including the opt-in `toolchain.ci` workflows:

```ts [dbx.config.ts]
import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: { name: 'acme', scope: '@acme' },
        ci: {
            ci: true,
            changelog: {
                commitlint: { scopes: ['api', 'web'] },
                versioning: { target: 'individual' },
            },
        },
    },
});
```

It accepts an object, a promise, or a sync/async callback — the loader resolves
it (see [`defineConfig`](/guide/config/defineconfig)).

## Config types

The `toolchain` shape is exported as `ToolchainConfig` (and the individual
sections as `ToolchainCiConfig`, `ToolchainChangelogConfig`, ...):

```ts
import type { ToolchainConfig, ToolchainCiConfig } from '@deltabox/toolchain';

const ci: ToolchainCiConfig = { ci: true, changelog: true };
const config: ToolchainConfig = { project: { name: 'acme' }, ci };
```

The same types are available from `@deltabox/toolchain/shared`, and each
subpath re-exports the types it owns.

## Ambient schema metadata

Zod's `.meta()` is typed by default, but the toolchain adds its own fields
(`env`, `path`, `required`, `deprecated`, `deprecationMessage`, `example`,
`since`, `see`, `remarks`, `experimental`, `alpha`, `beta`, `secret`, `scope`,
`public`, `defaultValue`). Add the ambient declaration once in a project-wide
`.d.ts`:

```ts [env.d.ts]
/// <reference types="@deltabox/toolchain/globals" />
```

Now a schema used with the [config generator](/guide/config-generator/) is fully
typed:

```ts
import { z } from 'zod';

export const serverConfig = z.object({
    port: z.number().default(3000).meta({
        env: 'MYAPP_PORT',
        description: 'HTTP port',
        example: '3000',
    }),
    password: z.string().meta({
        env: 'MYAPP_AUTH_PASSWORD',
        required: true,
        secret: true,
    }),
});
```

`ConfigMeta` is `ConfigBaseMeta & ConfigEnvMeta`:

- `ConfigBaseMeta`: `description`, `required`, `deprecated`,
  `deprecationMessage`, `example`, `since`, `see`, `remarks`, `experimental`,
  `alpha`, `beta`, `secret`, `scope`, `public`, `defaultValue`.
- `ConfigEnvMeta`: `envName` and `envPath` (both optional, so non-env configs can use
  metadata too).

`.describe()` is still the primary description and is rendered into the
generated types, JSON Schema and markdown reference; `.meta({ description })` is
used as a fallback and adds env/docs metadata.

## Programmatic API

The loader and sync runner are typed end-to-end:

```ts
import {
    defineConfig,
    defaultSyncTasks,
    loadToolchainConfig,
    runSync,
    type ToolchainConfig,
} from '@deltabox/toolchain';

const loaded = await loadToolchainConfig(process.cwd());
const config: ToolchainConfig = loaded.config;
await runSync({
    tasks: defaultSyncTasks(),
    cwd: process.cwd(),
    config,
    tokens: loaded.tokens,
    projectType: loaded.projectType,
});
```

See the [Programmatic API](/guide/api/) guide for the package-by-package
reference.

## Vite+

The generated `vite.config.ts` shim is typed against the project's Vite package
(`vite` or `vite-plus`) and `resolveVite<T>` is generic, so
`resolveVite<ViteUserConfig>({ cwd: import.meta.dirname })` keeps the full Vite+
surface (see [Vite+](/guide/vite)).

## JSON Schema / editor autocomplete

[config.schema.json](/config.schema.json) is generated from the same Zod model and published at the
site root, so a `dbx.config.json` gets editor completion. For a TypeScript config,
`defineConfig` already provides the same information.
