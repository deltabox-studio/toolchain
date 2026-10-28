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

## Shorthand opt-in

`fmt: true` / `lint: true` (or an options object with only `vscode`) picks a tool
automatically. `dbx sync` first checks the project/workspace dependencies for an
installed tool (in precedence order), then the VS Code user settings language
blocks, and finally falls back to Oxc. If nothing is found, sync warns
(`fmt.no-tool` / `lint.no-tool`) and still applies the Oxc defaults.

Existing user-owned config files are not overwritten blindly: the shorthand
folds them into the matching `toolchain.fmt.*` / `toolchain.lint.*` options
using the same mapping as [`dbx migrate`](/guide/migrations). When the mapped
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

The settings file is **not managed**: existing keys are never overridden, and
`dbx sync` never rewrites or removes it. Remove or change the generated keys
freely. Setting `vscode: false` (or omitting it) adds nothing.

## Migrating

```sh
dbx migrate --from oxc --write        # .oxfmtrc/.oxlintrc -> fmt.oxc/lint.oxc
dbx migrate --from biome --from prettier --write
dbx migrate --from all --write
```

See [Migrations](/guide/migrations).
