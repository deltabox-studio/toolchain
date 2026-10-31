# Formatting & linting

`toolchain.fmt` and `toolchain.lint` select a formatter/linter, hold its
options, and optionally add project-scoped VS Code defaults:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        fmt: {
            vscode: true, // add missing VS Code formatter settings (default false)
            oxc: { printWidth: 100, singleQuote: true },
            biome: { formatter: { indentWidth: 4 } },
        },
        lint: {
            vscode: true,
            oxc: { rules: { eqeqeq: 'warn' } },
            eslint: { rules: {} },
        },
    },
});
```

The supported tools are:

- `fmt`: `oxc` (Oxfmt), `biome`, `prettier`, `dprint`.
- `lint`: `oxc` (Oxlint), `biome`, `eslint`.

Each tool accepts `true` (use the defaults) or `false` (disable that tool), in
addition to its options object.

## Shorthand opt-in

`fmt: true` / `lint: true` (or an options object with only `vscode`) picks a tool
automatically. `dbx sync` first checks the project/workspace dependencies for an
installed tool (in precedence order), then the VS Code user settings language
blocks, and finally falls back to Oxc. If nothing is found, sync warns
(`fmt.no-tool` / `lint.no-tool`) and still applies the Oxc defaults.

Existing user-owned config files are not overwritten blindly: the shorthand
folds them into the matching `toolchain.fmt.*` / `toolchain.lint.*` options
using the same mapping as [`dbx migrate`](/guide/migrations/). When the mapped
options are already the dbx defaults, the shorthand simply enables those
defaults.

## Precedence

When more than one formatter/linter is configured, editor defaults use:

- **formatters**: `oxc` > `biome` > `prettier` > `dprint`.
- **linters**: `oxc` > `biome` > `eslint`.

`dbx sync` warns (`fmt.conflict` / `lint.conflict`) when this happens; silence it
with [`logger.suppress`](/guide/config/logging).

`toolchain.vite.fmt` / `toolchain.vite.lint` are the Oxc config written by Vite+,
and **override** `fmt.oxc` / `lint.oxc` with a deep merge (scalars, arrays and
booleans in `vite.*` win). With both:

```ts
toolchain: {
    fmt: { oxc: { semi: false, singleQuote: true } },
    vite: { fmt: { singleQuote: false } },
}
// effective Oxfmt options: { semi: false, singleQuote: false }
```

## Generated config files

- `fmt.oxc` / `lint.oxc` (+ `vite.fmt` / `vite.lint`) write managed
  `.oxfmtrc.json` / `.oxlintrc.json`.
- `fmt.biome` / `lint.biome` merge into the managed `biome.json`.
- The deprecated top-level `biome` section still works; prefer
  `fmt.biome` / `lint.biome`.

Oxc files are root-only unless a nested `dbx.config.*` defines `fmt.oxc` /
`lint.oxc` / `vite.fmt` / `vite.lint` itself. Biome keeps its existing
per-project behaviour.

When more than one formatter or linter is configured, sync warns (`fmt.conflict`
/ `lint.conflict`) because the generated config files and editor defaults may
conflict.

## VS Code editor defaults

Set `fmt.vscode` and/or `lint.vscode` (both default `false`) to add missing
project-scoped settings to `.vscode/settings.json`. The generated defaults are
deliberately small:

- `editor.defaultFormatter`
- language blocks (`[javascript]`, `[typescript]`, ...)
- `editor.codeActionsOnSave` (lint only)

Use an options object to override or exclude individual keys:

```ts
toolchain: {
    fmt: {
        oxc: {},
        vscode: {
            overrides: {
                'editor.defaultFormatter': 'oxc.oxc-vscode',
                '[typescript]': { 'editor.defaultFormatter': 'esbenp.prettier-vscode' },
            },
            exclude: ['[javascript]'],
        },
    },
    lint: { oxc: {}, vscode: true },
}
```

These editor defaults are **not tracked** and existing keys are never
overridden. (The separate Conventional Commits/Biome VS Code sync may track
`.vscode/settings.json` when those sections are enabled.) Remove or change the
generated keys freely. Setting `vscode: false` (or omitting it) adds nothing.

A nested project scaffolded below a root that already has `.oxfmtrc.json` /
`.oxlintrc.json` omits its own Oxc files and `fmt.oxc` / `lint.oxc` opt-ins, so
`dbx fmt` / `dbx lint` keep using the root configuration.

## Migrating

```sh
dbx migrate --from oxc --write        # .oxfmtrc/.oxlintrc -> fmt.oxc/lint.oxc
dbx migrate --from biome --from prettier --write
dbx migrate --from all --write
```

See [Migrations](/guide/migrations/).

## Biome

> **Deprecated:** prefer `toolchain.fmt.biome` / `toolchain.lint.biome` (see
> above). The top-level `biome` section still works and still writes
> `biome.json`.

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

If any other formatter/linter is also configured, sync still writes both the
Biome and Oxc config files, but warns (`fmt.conflict` / `lint.conflict`) that the
two tools may conflict. Silencing it is possible with
`logger: { suppress: ['fmt.conflict'] }`; prefer one toolchain per repo.

### Options

| Option      | Type                      | Default              | Description                                  |
| ----------- | ------------------------- | -------------------- | -------------------------------------------- |
| `enabled`   | `boolean`                 | enabled when defined | Master switch.                               |
| `vscode`    | `boolean`                 | `true`               | Write the Biome VS Code settings/extensions. |
| `overrides` | `Record<string, unknown>` | —                    | Deep-merged over the generated `biome.json`. |

#### `overrides`

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

#### `vscode`

When on (the default), the sync also writes the recommended Biome VS Code
settings and the Biome extension recommendation (see
[VS Code Extension](/guide/vscode)). Set `biome: { vscode: false }` to skip them.

### Programmatic API

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
> [Migrations](/guide/migrations/).
