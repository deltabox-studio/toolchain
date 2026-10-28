# Create the engine

Bind the schema, an env prefix, the base group and the project root once. A\nschema may be a Zod schema, an untyped Schema, an array, or a record keyed by\nscope:

```ts
import { createConfigEngine } from '@deltabox/toolchain/config';

export const engine = createConfigEngine({
    schema: {
        server: serverConfig,
        frontend: frontendConfig,
        cli: cliConfig,
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
