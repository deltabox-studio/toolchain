# Migrations

`dbx migrate` converts a project's tooling config from another tool to
**Oxc** (Oxfmt + Oxlint), or folds an existing Oxc/Vite config into
`dbx.config.*`. Migrations are pluggable — adding a source tool is a
matter of implementing one interface.

```sh
dbx migrate:list                       # what's available + detected
dbx migrate --from biome               # dry-run
dbx migrate --from biome --write       # writes the oxc config
dbx migrate --from biome --target vite --write
dbx migrate --from biome --from prettier --write  # several sources
dbx migrate --from oxc --write         # fold .oxfmtrc/.oxlintrc into dbx.config
dbx migrate --from all                 # every detected source
dbx migrate --check                    # CI: exit 1 when the oxc config is stale
dbx migrate --from eslint --online --write   # flat config via @oxlint/migrate
```

`dbx migrate` is a dry-run unless you pass `--write` (or `--check`). `--from`
is repeatable; `--from all` (or omitting it) selects every detected source.

## Sources

| Source     | Notes                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `biome`    | Formatter options, `files.includes` negations → `ignorePatterns`, **`organizeImports.groups` → Oxfmt `sortImports`**, and a curated Biome → Oxlint rule map. |
| `prettier` | Prettier-compatible options transfer directly; Tailwind/PackageJson plugins detected; `.prettierignore` → `ignorePatterns`.                                  |
| `eslint`   | JSON configs map rule names + severities (`@typescript-eslint/*` → `typescript/*`); JS/flat configs use `@oxlint/migrate` with `--online --write`.           |
| `dprint`   | `dprint.json` layout + TypeScript options → Oxfmt.                                                                                                           |
| `oxc`      | Folds `.oxfmtrc.json` / `.oxlintrc.json` into `dbx.config.*`'s `toolchain.fmt.oxc` / `toolchain.lint.oxc`; `dbx sync` manages them again.                    |
| `vite`     | Folds a hand-written `vite.config.*` into `dbx.config.*`'s `toolchain.vite` (see below).                                                                     |

## Targets

- `--target files` (default) — writes `.oxfmtrc.json` and `.oxlintrc.json`.
- `--target vite` — folds the result into an existing `vite.config.ts`
  (inserting/replacing `fmt` and `lint`), which is what Vite+ reads.
- The `oxc` source always targets `dbx.config.*` (`toolchain.fmt.oxc` /
  `toolchain.lint.oxc`); `--target` does not apply.

## Recursive migration

By default `dbx migrate` only touches the root (`--cwd`, or the current
directory). `--recursive` walks the discovered projects under the root and
migrates each one that has a **detected source**:

```sh
dbx migrate --from biome --from prettier --recursive --write
```

On an interactive terminal it first asks which projects to migrate with a
multi-select — every candidate is listed by its relative path (with its package
name as a hint), plus an **All projects** option. Non-interactive runs (piped
output, CI, or `--json`) migrate every candidate without prompting. A project is
a candidate when a migration matching `--from` (or any migration, for `all`/no
`--from`) is detected in its directory — so a workspace with its own
`biome.json` or `vite.config.*` is included, and one without is skipped.

## `vite.config`

The `vite` source moves a hand-written `vite.config.*` into `dbx.config.*`'s
`toolchain.vite`, so the whole Vite+ config lives in the one hand-authored config
and `dbx sync` writes a thin `vite.config.ts` shim that resolves it at load time:

```sh
dbx migrate --from vite          # dry-run: shows what would fold in
dbx migrate --from vite --write  # folds the object into toolchain.vite
dbx sync                         # writes the managed vite.config.ts shim
```

It also adds `/vite.config.ts` to `toolchain.vite.fmt.ignorePatterns`, so Oxfmt
leaves the generated shim alone (otherwise `vp fmt` would rewrite it and
`dbx sync --check` would report drift).

It extracts the object literal passed to `defineConfig(...)` (or the
default-exported object) with a string-aware, balanced-paren scanner and
text-splices it into the nearest `dbx.config.*`: it inserts `vite: { ... }`, or
**deep-merges** into an existing `toolchain.vite` (nested objects are combined;
arrays and scalars from the vite config win), so its settings are kept. A
previous `config: false` opt-out is flipped to `config: true`, since the
hand-written file is being removed. When the config references imports, plugins
or any non-literal expression it is reported as **unmapped** and nothing is
written, rather than emitting broken output. A JSON `dbx.config.json` is also
left alone (the object is folded by hand).

When the project has a `vite.config.*` but **no** `dbx.config.*` (a workspace
that never had one), the migration creates a fresh `dbx.config.ts` holding the
folded `toolchain.vite`, wrapped in `defineConfig` from `@deltabox/toolchain`
(like the scaffold). A workspace resolves that import through the root's
installed dependency — in a self-hosted repo, via a root `portal:.` self-link.

The now-redundant `vite.config.*` is removed and recreated by `dbx sync` as a
shim that imports `defineConfig` from the project's own Vite package (`vite` or
`vite-plus`, detected from `package.json`). Pass `--ignore-vite-config-file` to
keep the original file.

### Nested configs

In a monorepo, pass `--recursive` to fold **each workspace's** own
`vite.config.*` into that workspace's `dbx.config.*` (creating one when it is
missing) instead of the root's:

```sh
dbx migrate --from vite --recursive --write
```

Without `--recursive`, only the root's `vite.config.*` is migrated and nested
ones are left alone. Detection is per project root (a directory with a
`package.json` or `dbx.config.*`, up to five levels deep), so a `vite.config.*`
in a deeper subdirectory of a project is not discovered. A workspace with no
`dbx.config.*` gets a fresh one holding just its `toolchain.vite`; it inherits
the rest of the config from the nearest ancestor at load time.

## Post-migration sync

A `--write` run finishes by regenerating the project's toolchain-managed files
(the same files `dbx sync` writes) for every project it changed — so a migrated
project is immediately consistent, eg. the managed `vite.config.ts` shim appears
right after folding a hand-written config. Two flags narrow that step:

| Flag                     | Effect                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| `--ignore-managed-files` | Skip the post-migration sync entirely; managed files are left untouched.  |
| `--ignore-changelog`     | Run the sync but drop the `changelog` task (workflows, commitlint, hook). |

The sync only runs after `--write`; a dry-run reports what it would do instead.

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
can require that a repo is fully on Oxc:

```sh
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
