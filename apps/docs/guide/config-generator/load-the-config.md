# Load the config at runtime

Generation is only half of it: the same schema loads the value back. The runtime
parsers read the `envName` / `cliFlag` metadata, coerce env and CLI strings,
merge overrides and validate the result through the schema, so the returned
object matches the generated types.

```ts
import { parseCliConfig, parseConfig, parseEnvConfig } from '@deltabox/toolchain/config';

// MYAPP_HOST, MYAPP_PORT, ... -> { host: '0.0.0.0', port: 3000 }
const fromEnv = parseEnvConfig(serverConfig, process.env, { envPrefix: 'MYAPP_' });

// env + CLI (argv defaults to `process.argv.slice(2)`), overrides merged on top
const config = parseConfig(serverConfig, { host: '127.0.0.1' }, { envPrefix: 'MYAPP_' });

// CLI only: `--port 8080 --host localhost`
const fromCli = parseCliConfig(serverConfig, process.argv.slice(2), { envPrefix: 'MYAPP_' });
```

| Export                                             | Sources                                                         |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `parseConfig(schema, overrides?, opts?)`           | env + CLI, with `overrides` merged last and validated           |
| `parseEnvConfig(schema, env?, opts?)`              | env only                                                        |
| `parseCliConfig(schema, argv?, opts?)`             | CLI only                                                        |
| `collect(schema, opts?)`                           | env + CLI, no overrides (pass `validate: true` to check)        |
| `loadConfig(options)` / `loadConfigAsync(options)` | a config file, **parsed** through `parser` (no ambient env/CLI) |

Async variants (`parseConfigAsync`, `parseEnvConfigAsync`, `parseCliConfigAsync`)
accept a promise for the env source, argv or overrides; the `*Sync` aliases keep
the synchronous call shape.

## Scopes

Parsing the engine's `schema` returns the nested `{ server, frontend }` object;
parsing one scope's schema returns that scope's fields directly:

```ts
const scoped = parseEnvConfig(engine.schema, process.env, { envPrefix: 'MYAPP_' });
// { server: { port: 8080, host: '0.0.0.0' } }

const server = parseEnvConfig(serverConfig, process.env, { envPrefix: 'MYAPP_' });
// { port: 8080, host: '0.0.0.0' }
```

The same works for untyped and plain/primitive schemas:

```ts
const untyped = {
    type: 'object',
    properties: {
        port: { type: 'number', default: 3000, envName: 'MYAPP_PORT' },
        host: { type: 'string', default: 'localhost' },
    },
};

parseEnvConfig(untyped, { MYAPP_PORT: '4000' }); // { port: 4000, host: 'localhost' }

const plain = { server: { port: 3000, host: 'localhost' } };
parseEnvConfig(plain, { APP_SERVER_PORT: '4000' });
// { server: { port: 4000, host: 'localhost' } }
```

## Common options

Every parser shares the collect options:

- `envPrefix` — the prefix stripped from env names (default `APP_`, `null` disables it).
- `envSource` / `argv` — the env record and argument list to read (defaults to
  `process.env` and `process.argv.slice(2)`).
- `include` / `exclude` — path globs (`server.*`, `**.port`) or presence kinds
  (`required`, `defined`, `undefined`, `null`).
- `validate` — parse the resolved value through the schema (the `parse*` family
  defaults to `true`).
- `errorOptions` — `errorLevel` (`throw`/`warn`/`silent`), `logger`,
  `rewriteMessage`, `defaultMessage` and `trigger` for validation problems.
  A thrown problem is a `ConfigParseError`.
- `envPathOf` — override env-name -> dotted-path derivation (eg. dual prefixes).

Env names come from `.meta({ envName })`; without it, the prefix plus the field
path is used (`MYAPP_SERVER_PORT`). CLI flags come from `.meta({ cliFlag })`,
falling back to `--server-port`.

## Load from a file

`loadConfig` / `loadConfigAsync` discover a config file (plus JSON/YAML/custom
loaders), import it, merge `overrides`, and then **parse the value through the
passed `parser`** (or validate it through `schema`). This means you do not need
to call `parseConfig`, `parseEnvConfig`, `parseCliConfig` or
`parse<...>Config` afterwards — `loadConfig*` already did it.

```ts
import { loadConfigAsync } from '@deltabox/toolchain/config';

const loaded = await loadConfigAsync({
    parser: serverConfig,
    cwd: process.cwd(),
    // Discovery (flat fields; `configFileOptions` also works)
    locations: ['.', '.myapp'],
    names: ['dbx.config.ts', 'dbx.config.js'],
    // The loaded value is validated/parsed (default true with a parser)
    validate: true,
});

if (loaded) {
    console.log(loaded.path, loaded.config); // the file and the parsed value
}
```

`loadConfig*` parses the **file value**; it does not merge ambient env vars or
CLI args. Use `parseConfig` when you want to read env + CLI instead:

```ts
import { parseConfig } from '@deltabox/toolchain/config';

const fromEnvAndCli = parseConfig(serverConfig, undefined, { envPrefix: 'MYAPP_' });
```

Use `overrides` for values that should win over the file:

```ts
const loaded = await loadConfig({
    parser: serverConfig,
    cwd: process.cwd(),
    overrides: { host: '127.0.0.1' },
});
```

Without a `parser`/`schema` the raw loaded value is returned unchanged:

```ts
const raw = await loadConfig({ cwd: process.cwd() });
```

Options include `configFileOptions` (filename, extensions, locations,
`packageJson`, ancestor search), `required`, `overrides`, `fresh` (re-import in
watch mode), `tsconfig` (path-alias resolution for TS configs) and `loader`.
`loadConfigSync` supports JSON/YAML/CJS and synchronous loaders;
`loadConfigAsync` also supports ESM and TypeScript.

> The dotted path is the env name with the prefix removed and `_` folded to `.`,
> so `MYAPP_AUTH_TOKEN_TTL` reads as `auth.token.ttl`. Env names live on the
> schema as `.meta({ envName })`, so the generated `.env` file and the runtime
> parser stay in step.
