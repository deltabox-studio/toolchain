# Real-world shape

Proxified binds three scopes under a `PROXIFIED_` prefix and reuses the engine
for every generator:

```ts
import { createConfigEngine } from '@deltabox/toolchain/config';

export const configEngine = createConfigEngine({
    schema: {
        server: serverConfig,
        frontend: frontendConfig,
        cli: cliConfig,
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

These `config:*` commands belong to the consumer's own CLI, `dbx`
itself does not expose them.
