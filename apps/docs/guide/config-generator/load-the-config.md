# Load the config at runtime

Generation is only half of it. The same schema backs a small, dependency-free
**loader**. `parseEnvTree` folds `PREFIX_*` variables into a nested tree
(splitting the remainder on `_`), and the typed accessors read dotted paths out
of it:

```ts
import {
    envBool,
    envInt,
    envList,
    envMap,
    envString,
    parseEnvTree,
} from '@deltabox/toolchain/config';
import { applyOverrides } from '@deltabox/toolchain/shared';

// MYAPP_HOST, MYAPP_PORT, MYAPP_LOG_PRETTY, ... -> a nested tree
const tree = parseEnvTree(process.env, 'MYAPP_');

const config = {
    host: envString(tree, 'host', '0.0.0.0'),
    port: envInt(tree, 'port', 3000),
    pretty: envBool(tree, 'log.pretty', true),
    corsOrigins: envList(tree, 'cors.origin', []),
    headers: envMap(tree, 'response.headers.map'), // `Key=value,...` -> record
};
```

| Helper                       | Reads                                                |
| ---------------------------- | ---------------------------------------------------- |
| `envString(tree, path, fb?)` | string (unset/empty -> fallback)                     |
| `envInt` / `envBool`         | number / boolean (`true/1/yes/on`, `false/0/no/off`) |
| `envList`                    | comma-separated list                                 |
| `envMap`                     | `Key=value,...` into a lowercase-keyed record        |
| `readEnvPath(tree, path)`    | the raw value at a dotted path                       |

Layer typed overrides on top of the env values (a config file, then CLI flags)
with `applyOverrides`, then validate the result through the scope schema so it is
guaranteed to match the generated types:

```ts
import { compileZodSchema } from '@deltabox/toolchain/config';

const schemaCompiler = compileZodSchema(serverConfig);

export function loadConfig(env = process.env, file = {}, cli = {}) {
    const tree = parseEnvTree(env, 'MYAPP_');
    const fromEnv = {
        base: {
            host: envString(tree, 'host', '0.0.0.0'),
            port: envInt(tree, 'port', 3000),
        },
        auth: {
            password: envString(tree, 'auth.password', ''),
            tokenTtl: envInt(tree, 'auth.token.ttl', 3600),
        },
    };
    return schemaCompiler.parse(applyOverrides(fromEnv, file, cli));
}
```

A resolver like this is the runtime counterpart of the generators — same schema,
same defaults, one typed object out.

> The dotted path is the env name with the prefix removed and `_` folded to `.`,
> so `MYAPP_AUTH_TOKEN_TTL` reads as `auth.token.ttl`. When a field name differs
> from its env-derived path, map it explicitly in the resolver (as above).
