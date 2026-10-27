# Biome

> **Deprecated:** prefer `toolchain.fmt.biome` / `toolchain.lint.biome` — see
> [Formatting & linting](/guide/formatting). The top-level `biome` section still
> works and still writes `biome.json`.

The `biome` section generates a `biome.json` for consumers that still want a
Biome config. The toolchain itself is built on **Oxc** (Oxfmt + Oxlint) through
Vite+, but a repo that runs Biome directly can let the toolchain manage its
`biome.json` from the same `dbx.config.*`.

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        biome: true, // or { overrides: { ... } }
    },
});
```

`dbx sync` writes `biome.json`, resolving the `{{name}}` / `{{scope}}`
replacement tokens and merging your overrides over the defaults.

If `vite.fmt` / `vite.lint` are also configured, sync still writes both the
Biome and Oxc config files, but warns that the two formatters/linters may
conflict. Silencing it is possible with
`logger: { suppress: ['biome.oxc-conflict'] }`; prefer one toolchain per repo.

## Options

| Option      | Type                      | Default              | Description                                  |
| ----------- | ------------------------- | -------------------- | -------------------------------------------- |
| `enabled`   | `boolean`                 | enabled when defined | Master switch.                               |
| `vscode`    | `boolean`                 | `true`               | Write the Biome VS Code settings/extensions. |
| `overrides` | `Record<string, unknown>` | —                    | Deep-merged over the generated `biome.json`. |

### `overrides`

Overrides are merged into the generated config **recursively**, and **arrays are
unioned** (not replaced) — so `files.includes` can be extended:

```ts
biome: {
    overrides: {
        files: { includes: ['!**/generated/**'] },
        formatter: { indentWidth: 2 },
    },
}
```

### `vscode`

When on (the default), the sync also writes the recommended Biome VS Code
settings and the Biome extension recommendation (see
[VS Code Extension](/guide/vscode)). Set `biome: { vscode: false }` to skip them.

## Programmatic API

```ts
import {
    biomeConfig,
    biomeSyncTask,
    biomeVscodeSettings,
    mergeBiomeConfig,
    renderBiomeConfig,
    renderBiomeJson,
} from '@deltabox/toolchain/biome';
```

| Export                                  | Description                                              |
| --------------------------------------- | -------------------------------------------------------- |
| `biomeSyncTask()`                       | The sync task (writes `biome.json`).                     |
| `biomeConfig` / `biomeVscodeSettings`   | The generic Biome config / recommended VS Code settings. |
| `renderBiomeConfig(tokens, overrides?)` | Resolve tokens + merge overrides into an object.         |
| `renderBiomeJson(tokens, overrides?)`   | Serialize the rendered config.                           |
| `mergeBiomeConfig(base, patch)`         | The recursive/array-union merge used above.              |

> Migrating **from** Biome to Oxc is a different concern — see
> [Migrations](/guide/migrations).
