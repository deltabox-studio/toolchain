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
bumped when the scanned commit range touched a file inside it. The root's version
always follows the overall bump derived from every scanned commit.

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

## CLI

```bash
dbx changelog                       # bump + write (uses the config versioning)
dbx changelog --dry-run             # preview the root entry
dbx changelog --range v1.2.0..HEAD  # scan a specific range
dbx changelog --version 2.0.0       # force a version (retags the changelogs)
dbx changelog --format-only         # regroup existing changelogs, no bump
```

The generated `changelog` workflow runs `dbx changelog --range …` on every push
to the dev branch, so versioning is applied from CI as well as locally.
