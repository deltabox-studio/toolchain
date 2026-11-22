# Create the engine

Bind the schema, an env prefix, the base group(s) and the project root once. The
schema may be a Zod schema, an untyped schema, a plain object/primitive, an array
or a record keyed by scope:

```ts
import { createConfigEngine } from '@deltabox/toolchain/config';

export const engine = createConfigEngine({
    schema: {
        server: serverConfig,
        frontend: frontendConfig,
        cli: cliConfig,
    },
    envPrefix: 'MYAPP_',
    // One group or several; hoisted into the generated `...Base` interface.
    baseGroup: ['base', 'server'],
    root: process.cwd(),
    // Optional: custom env-name -> dotted-path derivation (eg. dual prefixes).
    envPathOf: env =>
        env
            .replace(/^(MYAPP_|VITE_)/, '')
            .toLowerCase()
            .replace(/_/g, '.'),
});
```

The engine keeps the exact schema type:

```ts
engine.schema; // typeof mySchema
engine.envPrefix; // 'MYAPP_'
engine.baseGroup; // ['base', 'server']
engine.root; // process.cwd()
```

## Options

| Option      | Description                                                                            |
| ----------- | -------------------------------------------------------------------------------------- |
| `schema`    | Zod, untyped, plain object/primitive, an array or a scoped record.                     |
| `envPrefix` | Env-var prefix (default `APP_`).                                                       |
| `baseGroup` | A group name or an array of names to hoist into the `...Base` output (default `base`). |
| `flatten`   | `true` or `{ level }` / `{ maxDepth }` to flatten top-level keys instead.              |
| `root`      | Project root for default output paths (defaults to the nearest project).               |
| `envPathOf` | Custom env-name -> dotted-path derivation.                                             |

## Base groups

With the default `baseGroup: 'base'`, a `base` object is hoisted:

```ts
const schema = {
    server: {
        base: { port: 3000, host: 'localhost' },
        auth: { tokenTtl: 3600 },
    },
};
```

`port` and `host` become fields of `ServerConfigBase`; `auth` stays a nested
group.

Pass an array to hoist several groups; they are merged in order:

```ts
createConfigEngine({
    schema,
    baseGroup: ['base', 'auth'],
});
```

Now `port`, `host` and `tokenTtl` are all top-level `...Base` fields. The same
flattening is applied to the markdown and JSON Schema outputs.

## Collect from the engine

```ts
engine.collect(); // every ConfigDef (env/cli metadata included)
engine.requiredVars(); // required definitions
engine.requiredVars('server'); // required definitions in one scope
```

See the [API reference](/guide/config-generator/api) for every member and
generator option.
