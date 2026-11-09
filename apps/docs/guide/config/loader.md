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
