# Loader

The `toolchain.loader` section controls how `dbx.config.*` files are imported.
A TS/JS config is loaded through [`tsx`](https://tsx.is), so it can use the
project's TypeScript path aliases and import `.ts` sources with a `.js`
specifier.

## Options

| Option     | Type                | Default | Description                                                             |
| ---------- | ------------------- | ------- | ----------------------------------------------------------------------- |
| `tsconfig` | `boolean \| string` | `true`  | The tsconfig used to resolve imports. `true` = nearest `tsconfig.json`. |

- `true` (default) — use the nearest `tsconfig.json` above the config file
  (the workspace's own).
- `"path/to/tsconfig.json"` — use a different tsconfig. The path is resolved
  from the project root.
- `false` — disable tsconfig resolution. Relative `.js` → `.ts` rewriting still
  works, but tsconfig `paths` aliases do not.

```ts [dbx.config.ts]
import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        loader: { tsconfig: 'tsconfig.loader.json' },
    },
});
```

`loader` is repository-scoped: it is **not merged into a nested workspace's
config**. A nested config uses its parent's loader choice when it does not set
one itself.

## Path aliases and source extensions

With the default loader, imports resolve the way the project's TypeScript does:

```ts [dbx.config.ts]
import { shared } from '@acme/shared/config.js'; // shared/config.ts

import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: shared.project,
    },
});
```

The loader rewrites these specifiers when the target exists:

| Import         | Resolves to                    |
| -------------- | ------------------------------ |
| `./helper.js`  | `helper.ts`, `helper.tsx`, ... |
| `./helper.mjs` | `helper.mts`                   |
| `./helper.cjs` | `helper.cts`                   |
| `./helper.jsx` | `helper.tsx`                   |

It also follows a tsconfig's relative `extends` chain for `baseUrl` / `paths`.
A genuinely missing package or module is still an error: the loader does not
silently turn it into an empty module.

## Programmatic API

`loadToolchainConfig` accepts the same override directly:

```ts
import { loadToolchainConfig } from '@deltabox/toolchain';

const loaded = await loadToolchainConfig(process.cwd(), {
    loaderTsconfig: 'tsconfig.loader.json', // or false
});
```

The option takes precedence over the config's own `loader.tsconfig` and over
the parent config's choice. When omitted, the loader uses the config's
`loader.tsconfig`, then the parent config's, then the nearest `tsconfig.json`.

## Notes

- The loader reads `loader.tsconfig` from the config it is loading, so the
  first import must already be resolvable. Put a shared choice on the root
  config (it is used for nested configs) or point the nearest `tsconfig.json`
  at it.
- `.json` configs are parsed directly and do not use a tsconfig.

## Reusing the loader in another project

`@deltabox/toolchain/config` exposes the same building blocks for consumers with
their own config format:

```ts
import {
    collect,
    createConfigFile,
    loadConfig,
    loadConfigSync,
    parseCliConfig,
    parseConfig,
    parseEnvConfig,
} from '@deltabox/toolchain/config';

// Discover + validate a config (JSON, CJS, ESM or TypeScript).
const loaded = await loadConfig({ packageJsonKeys: ['myapp'], schema });

// Or parse a specific source.
const fromEnv = parseEnvConfig(schema, process.env, { envPrefix: 'MYAPP_' });
const fromCli = parseCliConfig(schema, process.argv.slice(2));
const fromFile = parseConfig(schema, loaded?.config);

// Scaffold a starter config file.
createConfigFile({ name: 'myapp.config.ts', content: '{ enabled: true }' });
```

The loader also accepts the same tsconfig, ancestor and filter options as the
built-in one:

```ts
const loaded = await loadConfig({
    parser: schema,
    configFileOptions: {
        filename: 'myapp.config',
        commonLocation: [{ path: '.' }, { cwd: 'packages', path: '*/' }],
        // Resolve TS imports through this tsconfig (`false` disables it).
        tsconfig: 'tsconfig.loader.json',
        // Search ancestors when nothing is found at cwd (stops at `.git`).
        parent: true,
        // Skip files that are not valid candidates for this loader.
        accept: file => !file.endsWith('.shim.ts'),
    },
});
```

The object API accepts `tsconfig`, `parent` and `accept` directly instead of
nesting them in `configFileOptions`. `findConfigFile` and
`findParentConfigFile` run the same discovery without loading anything.

Discovery defaults to `.`, `config` and `configs`, matching the built-in loader.
`commonLocation.path` globs support `*`, `**`, `?`, simple `[...]` character
classes and `{a,b}` alternatives. A function export is resolved when a
`parser`/`schema` is passed; without one the raw export is returned, so a caller
can supply its own environment (as the dbx plugin probe does).

`collect(schema, options)` lists every config leaf (env/CLI metadata) and
accepts `envPrefix`, `include`/`exclude`, `maxDepth`, and `validate` with
`errorOptions` for required/empty values. `loadConfigSync` handles JSON and
CommonJS only; use `loadConfigAsync` (or a custom `loader`) for TypeScript.

### Scaffolding formats

`createConfigFile` infers the format from the file name (or takes an explicit
`type`): `file` (TypeScript/JavaScript `defineConfig`), `json`, `yaml`, `env`
(`KEY=value` lines) and `cli` (`--flag=value` lines). Object `content` is
serialized for the chosen format, and `defaults`/`overrides` merge under/over it:

```ts
createConfigFile({
    name: 'myapp.config.yaml',
    content: { project: { name: 'acme' } },
    defaults: { project: { license: 'MIT' } },
});

createConfigFile({ name: '.env.example', content: { APP_HOST: 'localhost' } });
```
