# Config Generator

`@deltabox/toolchain/config` is a generic, Zod-backed configuration engine. A
**Zod schema is the single source of truth**: attach env metadata to leaves with
`.meta()`, then generate the `.env` file, env/config TypeScript types, a JSON
Schema, a markdown reference, config metadata JSON and CLI option definitions —
all from that one schema. This is the engine Proxified uses for its
`PROXIFIED_*` config.

## 1. Describe a scope

Each scope is a Zod object. Leaves that are backed by an environment variable
carry an `.meta()` describing that variable:

```ts
import { z } from 'zod';

export const serverConfig = z.object({
    base: z.object({
        port: z.number().default(3000).meta({
            env: 'MYAPP_PORT',
            description: 'HTTP port',
        }),
        host: z.string().default('0.0.0.0').meta({
            env: 'MYAPP_HOST',
            description: 'Bind address',
        }),
    }),
    auth: z.object({
        password: z.string().meta({
            env: 'MYAPP_AUTH_PASSWORD',
            description: 'Admin password',
            required: true,
            secret: true,
        }),
        tokenTtl: z.number().default(3600).meta({
            env: 'MYAPP_AUTH_TOKEN_TTL',
            description: 'Session lifetime (seconds)',
        }),
    }),
});
```

`EnvVarMeta` fields: `env`, `path` (dotted config path), `description`,
`required`, `secret`, `scope`, `public` (safe to expose to the browser) and
`defaultValue` (when the resolved default differs from the env default).

## 2. Create the engine

Bind the scopes, an env prefix, the base group and the project root once:

```ts
import { createConfigEngine } from '@deltabox/toolchain/config';

export const engine = createConfigEngine({
    scopes: {
        server: { zodSchema: serverConfig },
        frontend: { zodSchema: frontendConfig },
        cli: { zodSchema: cliConfig },
    },
    envPrefix: 'MYAPP_',
    baseGroup: 'base', // the flat fields hoisted out of the nested groups
    root: process.cwd(),
    // Optional: custom env-name -> dotted-path derivation (eg. dual prefixes).
    envPathOf: env =>
        env
            .replace(/^(MYAPP_|VITE_)/, '')
            .toLowerCase()
            .replace(/_/g, '.'),
});
```

## 3. Generate

Every generator is a method on the bound engine:

```ts
engine.collectEnvVars(); // EnvVarDef[] across every scope
engine.requiredEnvVars('server'); // required var names for a scope

engine.writeEnvFile({ output: '.env.example' });
engine.writeConfigTypes({ outputDir: 'types' });
engine.writeEnvTypes({ outputDir: 'types' });
await engine.writeJsonSchema({ output: 'config.schema.json' });
engine.writeMarkdown({ outDir: 'docs/reference/configuration' });
engine.generateCliOptions({ output: 'cli-options.json' });
engine.buildConfigJson(); // the config metadata document
```

## 4. CLI commands

`configCommands({ engine, defaults })` returns `ToolingCommand[]` (register them
on your commander program with `@deltabox/toolchain/cli`):

| Command           | Writes                                       |
| ----------------- | -------------------------------------------- |
| `config:env`      | `.env.example`                               |
| `config:types`    | config types (`--env` also writes env types) |
| `config:json`     | `config.json` (metadata)                     |
| `config:schema`   | `config.schema.json`                         |
| `config:markdown` | the markdown reference                       |
| `config:cli`      | `cli-options.json`                           |
| `config:all`      | everything, under one output directory       |

```ts
import { configCommands } from '@deltabox/toolchain/config';

const commands = configCommands({
    engine,
    defaults: { typesDir: 'packages/shared/src/types', docsDir: 'docs/reference' },
});
// register `commands` on your commander program
```

## Generated outputs

Every generator writes from the same Zod schema. The engine's own config model
is the living example: its types are committed at
`packages/shared/src/config-types.ts`.

### Config types — `renderConfigTypes()` / `writeConfigTypes()`

Named `interface`s (and `type` aliases for enums/unions) with jsdoc taken from
`.describe()`. Unions and refs stay named, so nested objects are referenced
rather than inlined:

```ts
// engine.renderConfigTypes() -> { server: "...", cli: "..." }
engine.writeConfigTypes({ outputDir: 'types' }); // types/server.ts, types/cli.ts
```

```ts
// types/server.ts
export interface ServerConfig {
    /** Bind host. */
    host?: string;
    port?: number;
    auth?: { password?: string; enabled?: boolean };
}
```

### Markdown — `writeMarkdown()`

One reference page per scope plus an index listing the required/core env vars:

```ts
engine.writeMarkdown({ outDir: 'docs/reference/configuration' });
// docs/reference/configuration/server.md, .../index.md
```

### Env — `renderEnvFile()` / `writeEnvFile()`

A `.env.example`; secrets are emitted commented out so operators fill them in:

```bash
engine.writeEnvFile({ output: '.env.example' });

# ---- SERVER ----
MYAPP_HOST=localhost
# MYAPP_AUTH_PASSWORD=
```

### JSON Schema — `generateJsonSchema()` / `writeJsonSchema()`

The resolved untyped JSON Schema for every scope, for editor autocomplete:

```ts
await engine.writeJsonSchema({ output: 'config.schema.json' });
```

For a full, real example of the generated config types, see
`packages/shared/src/config-types.ts`.

## Real-world shape (Proxified)

Proxified binds three scopes under a `PROXIFIED_` prefix and reuses the engine
for every generator:

```ts
import { createConfigEngine } from '@deltabox/toolchain/config';

export const configEngine = createConfigEngine({
    scopes: {
        server: { zodSchema: serverConfig },
        frontend: { zodSchema: frontendConfig },
        cli: { zodSchema: cliConfig },
    },
    envPrefix: 'PROXIFIED_',
    baseGroup: 'base',
    root: monorepoRoot(),
    envPathOf: env => envPathOf(env),
});
```

The generators then run from a `config:generate-all` script (built on the
`configCommands({ engine })` helpers) to keep `.env.example`, the JSON Schema,
the markdown reference, the types and the CLI options in sync with the schemas.
These `config:*` commands belong to the consumer's own CLI — `dbx`
itself does not expose them.
