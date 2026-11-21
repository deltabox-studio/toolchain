# Real-world shape

A real project usually has **two engines**, one per runtime context, rather than
one engine that mixes server and browser settings:

- a server engine with database, HTTP and secret-bearing schemas;
- a client engine with public API URLs, feature flags and other browser-safe
  values.

Keeping them in separate folders and entry points is what lets bundlers drop the
server engine from the browser bundle (and vice versa). See
[Client and server](/guide/config-generator/client-and-server) for the full
layout and bundler guidance.

## Server engine

```ts
// packages/shared/src/config/server/engine.ts
import { createConfigEngine } from '@deltabox/toolchain/config';

import * as serverSchema from './schema/index.js';

export const serverConfig = createConfigEngine({
    schema: {
        database: serverSchema.databaseConfig,
        http: serverSchema.httpConfig,
    },
    envPrefix: 'APP_',
    baseGroup: ['base', 'http'],
    root: monorepoRoot(),
});
```

## Client engine

```ts
// packages/shared/src/config/client/engine.ts
import { createConfigEngine } from '@deltabox/toolchain/config';

import * as clientSchema from './schema/index.js';

export const clientConfig = createConfigEngine({
    schema: {
        api: clientSchema.apiConfig,
        telemetry: clientSchema.telemetryConfig,
    },
    envPrefix: 'PUBLIC_',
});
```

## Generation

Run the generators against each engine so each context's `.env.example`, types,
JSON Schema and markdown reference stay scoped to its own schema:

```ts
import { configCommands } from '@deltabox/toolchain/config';

import { clientConfig } from './client/engine.js';
import { serverConfig } from './server/engine.js';

export const commands = [
    ...configCommands({
        engine: serverConfig,
        defaults: { envDir: 'config/server' },
    }),
    ...configCommands({
        engine: clientConfig,
        defaults: { envDir: 'config/client' },
    }),
];
```

If the project exposes one `config:all` command, call the generators for both
engines explicitly. Do not build a single engine whose schema imports both
`server/` and `client/` modules.

## Loading

At runtime, each context loads its own engine:

```ts
import { serverConfig } from '@org/shared/config/server';

// apps/api/src/config.ts (server)
import { loadConfigAsync } from '@deltabox/toolchain/config';

const loaded = await loadConfigAsync({ parser: serverConfig.schema });
```

```ts
import { clientConfig } from '@org/shared/config/client';

// apps/web/src/config.ts (client)
import { parseEnvConfig } from '@deltabox/toolchain/config';

export const webConfig = parseEnvConfig(
    clientConfig.schema,
    import.meta.env as Record<string, string | undefined>,
    { envPrefix: 'PUBLIC_' }
);
```

`loadConfig*` loads a file and layers env/CLI over it (`loadEnvConfig*` and
`loadCliConfig*` select one explicitly). Use `parseEnvConfig`/`parseCliConfig`/
`parseConfig` when there is no file and you are parsing a pure source.

## Keep the boundaries clean

- Import `@org/shared/config/client` from browser code and
  `@org/shared/config/server` from server code.
- Never create a `packages/shared/src/config/index.ts` that re-exports both
  engines.
- Keep shared `common` modules context-free (no `node:*` unless your bundler handles them, no secrets, no
  browser-only globals).
- Mark config packages as side-effect free and avoid import-time connections or
  file reads.
- Client schemas use public config options only; server secrets never enter the
  client schema.

These `config:*` commands belong to the consumer's own CLI; `dbx` itself does
not expose them.

See [Client and server](/guide/config-generator/client-and-server) for the
complete folder layout, import graph and bundler checklist, and the
[API reference](/guide/config-generator/api) for every generator and runtime
export.
