# Migrations

`dbx migrate` converts a project's tooling config from another tool to
**Ox** (Oxfmt + Oxlint). Migrations are pluggable — adding a source tool is a
matter of implementing one interface.

```bash
dbx migrate:list                       # what's available + detected
dbx migrate --from biome               # dry-run
dbx migrate --from biome --write       # writes the ox config
dbx migrate --from biome --target vite --write
dbx migrate --from all                 # every detected source
dbx migrate --check                    # CI: exit 1 when the ox config is stale
dbx migrate --from eslint --online --write   # flat config via @oxlint/migrate
```

## Sources

| Source     | Notes                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `biome`    | Formatter options, `files.includes` negations → `ignorePatterns`, **`organizeImports.groups` → Oxfmt `sortImports`**, and a curated Biome → Oxlint rule map. |
| `prettier` | Prettier-compatible options transfer directly; Tailwind/PackageJson plugins detected; `.prettierignore` → `ignorePatterns`.                                  |
| `eslint`   | JSON configs map rule names + severities (`@typescript-eslint/*` → `typescript/*`); JS/flat configs use `@oxlint/migrate` with `--online --write`.           |
| `dprint`   | `dprint.json` layout + TypeScript options → Oxfmt.                                                                                                           |
| `vite`     | Folds a hand-written root `vite.config.*` into `dbx.config.*`'s `toolchain.vite` (see below).                                                                |

## Targets

- `--target files` (default) — writes `.oxfmtrc.json` and `.oxlintrc.json`.
- `--target vite` — folds the result into an existing `vite.config.ts`
  (inserting/replacing `fmt` and `lint`), which is what Vite+ reads.

## `vite.config`

The `vite` source moves a hand-written root `vite.config.*` into
`dbx.config.*`'s `toolchain.vite`, so the whole Vite+ config lives in the one
hand-authored root config and `dbx sync` regenerates `vite.config.ts` from it:

```bash
dbx migrate --from vite          # dry-run: shows what would fold in
dbx migrate --from vite --write  # folds the object into toolchain.vite
dbx sync                         # regenerates the managed vite.config.ts
```

It extracts the object literal passed to `defineConfig(...)` (or the
default-exported object) with a string-aware, balanced-paren scanner and
text-splices it into the nearest `dbx.config.*` (inserting `vite: { ... }`, or
replacing an existing `vite` value). When the config references imports, plugins
or any non-literal expression it is reported as **unmapped** and nothing is
written, rather than emitting broken output. A JSON `dbx.config.json` is also
left alone (the object is folded by hand).

## Package scripts

`dbx migrate` migrates the tooling **files**; the matching `package.json` scripts
are a small follow-up. The common swaps:

| Before                   | After                       |
| ------------------------ | --------------------------- |
| `biome format --write .` | `dbx fmt`                   |
| `biome check --fix .`    | `dbx lint --fix`            |
| `turbo build`            | `dbx run -r build`          |
| `turbo typecheck`        | `dbx run -r typecheck`      |
| `turbo test`             | `dbx run -r test`           |
| `turbo dev`              | `dbx run -r --parallel dev` |

Then drop `@biomejs/biome` + `turbo` (and `biome.json` + `turbo.json`) and add
`@deltabox/toolchain` + `vite-plus`. The full walkthrough — recommended scripts,
the dependency diff and per-workspace tasks — is on the
[Package scripts](/guide/scripts) page.

## CI check

`--check` runs the migrations without writing and exits non-zero when a target
file is missing or differs from what the migration would produce, so a pipeline
can require that a repo is fully on Ox:

```bash
dbx migrate --check || echo "still on Biome/ESLint — run migrate --write"
```

`--online` allows network access: the ESLint migration shells out to
`@oxlint/migrate` to evaluate JS/flat configs (it writes `.oxlintrc.json`, so it
runs only together with `--write`).

## Honest output

Anything that cannot be mapped faithfully is reported instead of dropped:

```
unmapped (7):
  - organizeImports !lucide*: negated group members are approximated
  - linter.rules.suspicious.noUnknownAtRules: no Oxlint equivalent
```

## Programmatic

```ts
import { listMigrations, detectMigrations, runMigration } from '@deltabox/toolchain/migrate';

const detected = detectMigrations(process.cwd());
const result = await runMigration('biome', { cwd: process.cwd(), target: 'vite', write: true });
console.log(result.unmapped);
```

## Notes

`oxfmt --migrate biome`-style tools cover formatter options only; the pieces the
upstream tools skip (Biome `organizeImports`, Biome linter rules, Dprint) are
handled here.
