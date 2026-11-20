# Client and server configs

Config code is often shared between an API and a browser app. The schemas can
share primitives, but for best-practice the **engines**, loaders and runtime imports must stay in
their own context.

A client bundle should never pull in `node:*` (unless your bundler handles them), a server
secret, or the server config engine; a server process should not depend on
browser-only globals.

The safest structure is one folder per context, each with its own schema entry,
engine and public import path. Do not put a single barrel `index.ts` above both
contexts that re-exports their engines or schemas.

## Project layout

```tree
- name: packages/shared/src/config
  children:
    - name: common
      description: Context-free primitives only
      children:
        - name: primitives.ts
        - name: meta.ts
    - name: client
      description: Browser-safe config
      children:
        - name: schema
          children:
            - name: index.ts
              description: Client schemas only
            - name: api.ts
            - name: telemetry.ts
        - name: engine.ts
          description: createConfigEngine(client schemas)
        - name: index.ts
          description: Public client entry
    - name: server
      description: Server-only config
      children:
        - name: schema
          children:
            - name: index.ts
              description: Server schemas only
            - name: database.ts
            - name: http.ts
        - name: engine.ts
          description: createConfigEngine(server schemas)
        - name: index.ts
          description: Public server entry
    - name: index.ts
      status: deleted
      description: Never re-export both contexts
```

`common/` may be imported by either side, but it must stay free of runtime
dependencies such as `node:fs`, database clients or browser APIs. Everything
else is context-specific.

## Server context

### Server schemas

Keep each server schema module focused, and export only server schemas from the
server schema entry:

```ts
// packages/shared/src/config/server/schema/database.ts
import { z } from 'zod';

export const databaseConfig = z.object({
    url: z.string().meta({
        envName: 'APP_DATABASE_URL',
        required: true,
        secret: true,
    }),
    poolSize: z.number().default(10).meta({ envName: 'APP_DATABASE_POOL_SIZE' }),
});
```

```ts
// packages/shared/src/config/server/schema/http.ts
import { z } from 'zod';

export const httpConfig = z.object({
    port: z.number().default(3000).meta({ envName: 'APP_HTTP_PORT' }),
    trustProxy: z.boolean().default(false).meta({ envName: 'APP_HTTP_TRUST_PROXY' }),
});
```

```ts
// packages/shared/src/config/server/schema/index.ts
export { databaseConfig } from './database.js';
export { httpConfig } from './http.js';
```

### Server engine

The server engine imports the server schema entry only:

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
});
```

The public server entry is the only module the server application imports:

```ts
// packages/shared/src/config/server/index.ts
export { serverConfig } from './engine.js';
export * from './schema/index.js';
```

### Loading server config

Read files and `process.env` in the server process:

```ts
// apps/api/src/config.ts
import { loadConfigAsync, parseEnvConfig } from '@deltabox/toolchain/config';
import { serverConfig } from '@acme/shared/config/server';

export async function loadServerConfig() {
    // load config from file, cli and env
    const loaded = await loadConfigAsync({
        parser: serverConfig.schema,
        cwd: process.cwd(),
        names: ['dbx.config.ts', 'dbx.config.js'],
    });

    if (loaded) return loaded.config;

    // fallback to env config
    return parseEnvConfig(serverConfig.schema, process.env, {
        envPrefix: 'APP_',
    });
}
```

`loadConfigAsync` can import TypeScript and read the filesystem, so it must not
appear in a client module graph.

## Client context

### Client schema

Client schemas may only describe browser-visible values. Prefix public values
with the client-visible prefix (`PUBLIC_`), and keep secrets out entirely:

```ts
// packages/shared/src/config/client/schema/api.ts
import { z } from 'zod';

export const apiConfig = z.object({
    baseUrl: z.string().default('/api').meta({ envName: 'PUBLIC_API_BASE_URL' }),
    timeout: z.number().default(10_000).meta({ envName: 'PUBLIC_API_TIMEOUT' }),
});
```

```ts
// packages/shared/src/config/client/schema/telemetry.ts
import { z } from 'zod';

export const telemetryConfig = z.object({
    enabled: z.boolean().default(false).meta({ envName: 'PUBLIC_TELEMETRY_ENABLED' }),
});
```

```ts
// packages/shared/src/config/client/schema/index.ts
export { apiConfig } from './api.js';
export { telemetryConfig } from './telemetry.js';
```

### Client engine

The client engine imports only the client schema entry:

```ts
// packages/shared/src/config/client/engine.ts
import { createConfigEngine } from '@deltabox/toolchain/config';

import * as clientSchema from './schema/index.js';

export const clientConfig = createConfigEngine({
    schema: {
        api: clientSchema.apiConfig,
        telemetry: clientSchema.telemetryConfig,
    },
    envPrefix: 'PUBLIC_', // or VITE_, NEXT_
});
```

```ts
// packages/shared/src/config/client/index.ts
export { clientConfig } from './engine.js';
export * from './schema/index.js';
```

### Loading client config

The browser has `import.meta.env`, not `process.env`, and it must not import
the server engine or `node:fs`:

```ts
// apps/web/src/config.ts
import { parseEnvConfig } from '@deltabox/toolchain/config';
import { clientConfig } from '@acme/shared/config/client';

export const webConfig = parseEnvConfig(
    clientConfig.schema,
    import.meta.env as Record<string, string | undefined>,
    { envPrefix: 'PUBLIC_' }
);
```

Vite/Vite+ only exposes env vars with the configured public prefix; the schema
above uses `PUBLIC_` consistently. Never put a server secret in a client schema.

## Bundlers

Treeshaking depends on what a module **imports**, not on which exports you
happen to use. A top-level barrel defeats the split:

```tree
- name: packages/shared/src/config
  children:
    - name: index.ts
      status: deleted
      description: Re-exports client + server; every importer pulls both
    - name: client/index.ts
      description: Client-only entry
    - name: server/index.ts
      description: Server-only entry
```

Import the context entry explicitly:

```ts
// Bad:
// the barrel can load both engines into the same module graph
import { clientConfig } from '@acme/shared/config';

// Good:
// the client graph only sees the client engine
import { clientConfig } from '@acme/shared/config/client';
```

Expose separate package subpaths instead of one mixed entry:

```json [package.json]
{
    "exports": {
        "./config/client": "./dist/config/client/index.js",
        "./config/server": "./dist/config/server/index.js"
    },
    "sideEffects": false
}
```

### Side effects and boundaries

Treeshaking cannot remove a module with import-time side effects. Keep the config
modules declarative:

- Do not open database connections, read files or start servers at module load.
- Do not import `node:*` from the client schema or client engine (unless your bundler handles them).
- Do not import the client engine from the server engine, or vice versa.
- Keep `createConfigEngine` calls in the context's `engine.ts`; import that file
  only from the matching side.
- If a package needs a server-only guard, make the server entry the only one
  that imports the server dependencies. A client import of the server entry
  should fail at build time, not silently bundle it.

### A correct import graph

```tree
- name: apps/web/src/config.ts
  description: imports @acme/shared/config/client only
  status: added
- name: apps/api/src/config.ts
  description: imports @acme/shared/config/server only
  status: added
```

The client bundle never reaches `server/engine.ts`, `server/schema/*` or
`node:*` (unless your bundler handles them); the server process never reaches `client/schema/*` or
`import.meta.env` parsing.

## Checklist

- One schema folder and one engine per context.
- No `config/index.ts` that re-exports both context engines.
- Client code imports only `config/client`; server code imports only
  `config/server`.
- Shared `common` modules are context-free.
- Client schemas use only public config options and no secrets.
- Server-only modules are never imported from client code.
- `sideEffects: false` plus no import-time side effects, so unused context
  modules are actually removed.

See [Load the config](/guide/config-generator/load-the-config) for the parser
and loader options, and the [API reference](/guide/config-generator/api) for the full API.
