# Changelog & versioning

The `changelog` section drives everything Conventional Commits: the CI that
lints commit messages, the local husky hook, the `commitlint.config.mjs`, and the
changelog pipeline that bumps versions and writes `CHANGELOG.md`.

```ts
export default defineConfig({
    toolchain: {
        changelog: {
            branches: { main: 'main', dev: 'dev' },
            workflows: { ci: true, changelog: true, release: true },
            types: ['feat', 'fix', 'docs', 'chore'],
            scopes: ['api', 'web', 'deps'],
            versioning: { target: 'individual', workspaces: ['packages/*', 'apps/*'] },
        },
    },
});
```

`dbx sync` writes the GitHub workflows (`.github/workflows`), the commitlint
config, and the husky `commit-msg` hook (`.husky/commit-msg`). Activate the hook
with a `postinstall` script (Yarn Berry never runs `prepare`):

```json
{ "scripts": { "commitlint": "commitlint", "postinstall": "husky" } }
```

See [Package scripts](/guide/scripts) for the full recommended script set.

## Workflows

`dbx sync` writes the GitHub workflows into `.github/workflows`. Each id (`ci`,
`changelog`, `release`, `issues`, `sync`) accepts one of three forms:

- `true` / `false` — write the generated default, or skip it;
- a **`WorkflowConfig` object** — override parts of the default (branches,
  triggers, extra top-level keys, extra steps/jobs, token overrides);
- a **raw YAML string** — written **verbatim** as the workflow file, for a
  workflow the object model can't express.

```ts
export default defineConfig({
    toolchain: {
        changelog: {
            workflows: {
                ci: true, // the generated default
                issues: false, // don't write issues.yml
                release: { pushBranches: ['main'] }, // override the default
                // A fully hand-authored workflow, written as-is:
                sync: `name: Toolchain sync
on: [push, pull_request]
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn dbx sync --check
`,
            },
        },
    },
});
```

A raw string is **not** merged with the default, is **not** token-replaced, and
gets **no generated header** — it is the file's exact content. The
`changelog.branches` defaults don't apply to it either (it defines its own
triggers). An empty string disables the workflow.

## Branches

`branches.main` and `branches.dev` pick which branches the generated workflows
target. Each accepts a glob or an array of globs:

| Branch | Drives                                                                         | Default              |
| ------ | ------------------------------------------------------------------------------ | -------------------- |
| `main` | The **CI** workflow (push), the **release** workflow, and the release PR base. | `['main']`           |
| `dev`  | The **changelog/version** workflow (push).                                     | none — reuses `main` |

`dev` has **no default**: when it is omitted the changelog workflow runs on
`main` (so a single-branch repo needs no `dev`). Set it for a `dev` → `main`
flow:

```ts
changelog: { branches: { main: 'main', dev: 'dev' } }
// or multiple branches per purpose:
changelog: { branches: { main: ['main', 'release/**'], dev: ['dev', 'next'] } }
```

The `sync` workflow runs on both. Any per-workflow `pushBranches` override (eg.
`workflows.ci.pushBranches`) still wins.

## commitlint config location

By default the generated `commitlint.config.mjs` lives at the project root. Set
`commitlint.dir` to write it elsewhere:

```ts
changelog: {
    commitlint: {
        dir: '.config';
    }
} // -> .config/commitlint.config.mjs
```

When a custom dir is set, the generated husky hook and the CI commitlint step
both pass `--config <dir>/commitlint.config.mjs`, so commitlint finds it. Note
that editor tooling that discovers the config by convention (eg. the
Conventional Commits VS Code extension, which loads from the repo root) expects
the config at the root — keep the default unless you have a reason to move it.

> The extension's `No "exports" main defined in … conventional-changelog-conventionalcommits …`
> error is an upstream commitlint bug (ESM-only parser preset), not a config
> discovery problem. See [Troubleshooting](#troubleshooting).

## Versioning

`versioning` controls whether — and where — a changelog run writes `version`
fields into `package.json`. It accepts a boolean or an object, and defaults to
`true`.

```ts
changelog: { versioning: true }                       // uniform, defaults
changelog: { versioning: false }                      // never write versions
changelog: { versioning: { target: 'root-only' } }
changelog: { versioning: { target: 'individual', workspaces: ['packages/*'] } }
```

### `target`

| Target       | What it bumps                                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uniform`    | The root (when it has a `package.json`) **and every workspace** to one shared version. **Default.**                                                                          |
| `root-only`  | Only the root `package.json`. Workspaces are left untouched and get no changelog entry.                                                                                      |
| `individual` | The root tracks the overall bump; **each workspace is bumped on its own** from the commits touching its files, so versions can drift apart (like an "independent" monorepo). |

With `versioning: false` no `version` field is written at all — the changelog
entries are still generated (headed as `uniform` would), so you can keep
versioning in another tool (for example changesets).

### `workspaces`

An array of glob patterns selecting the workspaces to version, relative to the
repo root. It resolves in this order:

1. the `workspaces` patterns you pass, when you pass them;
2. otherwise the root `package.json` `workspaces` field, when present;
3. otherwise the root `package.json` alone (a single-package repo);
4. otherwise a warning is logged and nothing is versioned.

```ts
changelog: { versioning: { target: 'individual', workspaces: ['packages/*', '!packages/private-*'] } }
```

`individual` uses a `git log` path filter per workspace, so a workspace is only
bumped when the scanned commit range touched a file inside it — or a file in one
of the workspaces it depends on (see [Workspace changelogs](#workspace-changelogs)).
The root's version always follows the overall bump derived from every scanned
commit.

### How a run decides its versions

Each run:

1. reads the commits in the range (`--range`/`--processing-method`, default
   `HEAD`);
2. derives the semver bump (`feat` → minor, `fix`/other → patch, `!` or a
   `BREAKING CHANGE` footer → major);
3. plans the versions per `target` + `workspaces` (see above);
4. writes the plan's `package.json` versions and prepends the new entry to the
   root `CHANGELOG.md` and each versioned workspace's `CHANGELOG.md`.

Use `dbx changelog --dry-run` to preview the proposed root entry without touching
any file; the log line reports the active `target` (or `disabled`).

### Workspace changelogs

Each versioned workspace gets **its own `CHANGELOG.md`** (created if missing),
headed by the version the plan assigned it. A workspace's entry only lists its
**related commits**: those touching the workspace directory **or any workspace it
transitively depends on**, resolved from the project dependency graph
(`.dbx/toolchain/projects.json`, written by `dbx projects`). So a change in a
shared package shows up in the changelog of every package that consumes it, not
just in its own.

Without a graph (eg. `dbx projects` was never run), a workspace falls back to
filtering on its own directory only. A workspace with no related commits is
skipped (no empty entry, no file created).

## CLI

```bash
dbx changelog                       # bump + write (uses the config versioning)
dbx changelog --dry-run             # preview the root entry
dbx changelog --range v1.2.0..HEAD  # scan a specific range
dbx changelog --version 2.0.0       # force a version (retags the changelogs)
dbx changelog --format-only         # regroup existing changelogs, no bump
```

The generated `changelog` workflow runs `dbx changelog --range …` on every push
to the `dev` branches (or `main` when `dev` is unset), so versioning is applied
from CI as well as locally.

## Writing commit messages

The changelog is rendered from commit **subjects and bodies**, so what you commit
is what readers see. Watch out for characters that a **shell** re-interprets —
especially when a message is drafted by an **AI/LLM** and committed through
`git commit -m "…"`.

### Shell escaping

- **PowerShell** treats a backtick as its escape character, so `` `r `` / `` `n `` /
  `` `t `` / `` `b `` become CR / LF / TAB / backspace. A preceding `\` is left
  behind, so `` `resolveVite `` can land in the changelog as a stray `\`, a CR and
  `esolveVite`.
- **bash** runs an unquoted `` `…` `` as command substitution, and `$(…)` / `${…}`
  expand before `git` ever sees them.

The result is invisible control characters, stray `\` and dropped letters. The
toolchain strips the predictable artifacts
(`stripControlChars`/`sanitizeText`) but **cannot restore a character the shell
already consumed**.

### Authoring safely

- Prefer a **file over `-m`**: `git commit -F message.txt`, or a quoted heredoc
  (`git commit -F - <<'EOF' … EOF`) — nothing is re-interpreted. Avoid assembling
  multi-line messages inline in PowerShell.
- When an AI/LLM drafts the message, strip **typographic characters** before
  committing: curly quotes (`’ “ ”`), em/en dashes (`— –`), non-breaking spaces,
  zero-width characters and emoji all survive into the changelog and can break
  `commitlint` or the markdown.
- **Preview the entry**: `dbx changelog --dry-run` prints the proposed entry —
  check it for stray `\`, `\r`, `\b`, `\t` or mojibake before releasing.

## Troubleshooting

### `No "exports" main defined in … conventional-changelog-conventionalcommits`

Seen from the Conventional Commits VS Code extension (`vivaxy.vscode-conventional-commits`),
usually alongside empty type/scope suggestions and a `The cwd is …` line:

```
commitlint: Error: No "exports" main defined in
  node_modules/conventional-changelog-conventionalcommits/package.json
```

This is a **known upstream commitlint bug** (commitlint#4864): the generated
config `extends: ['@commitlint/config-conventional']`, which sets
`parserPreset: 'conventional-changelog-conventionalcommits'`, and v10 of that
package is **ESM-only** (`exports` has no `require`/`default`), so the extension's
bundled (older) commitlint cannot `require.resolve` it. The config is read fine —
the _preset_ fails to resolve, so the extension falls back to empty rules.

The husky hook and CI are unaffected when commitlint is recent enough to resolve
pure-ESM presets (commitlint ≥ 21.2.3). If your local commitlint is older, pin
the preset to the last CJS-compatible release:

```json
{
    "resolutions": { "conventional-changelog-conventionalcommits": "9.3.1" }
}
```

(Use `overrides` instead of `resolutions` for npm.) Updating the extension to a
version bundling the fixed commitlint also resolves it.

## Releases

The generated `release` workflow opens a release PR whose body is the
**aggregated changelog**: every entry from the last tag (`git describe --tags
--abbrev=0`) up to the latest version, not just the newest one. So a release
that skips versions (eg. `v1.7.0` → `v1.7.8`) still documents `1.7.1`–`1.7.8`
in one place.
