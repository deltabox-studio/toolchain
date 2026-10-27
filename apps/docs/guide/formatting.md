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

## Precedence

When more than one formatter/linter is configured, editor defaults use:

- **formatters**: `oxc` > `biome` > `prettier` > `dprint`.
- **linters**: `oxc` > `biome` > `eslint`.

`dbx sync` warns (`fmt.multiple` / `lint.multiple`) when this happens; silence it
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

When Biome and Oxc are both configured, sync warns (`biome.oxc-conflict`) that
their configs may conflict.

## VS Code editor defaults

Set `fmt.vscode: true` and/or `lint.vscode: true` (both default `false`) to add
missing project-scoped settings to `.vscode/settings.json`, including the
language-specific `editor.defaultFormatter` blocks and save actions.

The settings file is **not managed**: existing keys are never overridden, and
`dbx sync` never rewrites or removes it. Remove or change the generated keys
freely. With Oxc the defaults follow
[Vite+'s VS Code setup](https://viteplus.dev/guide/ide-integration#vs-code);
other tools use their extension id and save action.

## Migrating

```sh
dbx migrate --from oxc --write        # .oxfmtrc/.oxlintrc -> fmt.oxc/lint.oxc
dbx migrate --from biome --from prettier --write
dbx migrate --from all --write
```

See [Migrations](/guide/migrations).
