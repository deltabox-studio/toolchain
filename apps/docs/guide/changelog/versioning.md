# Versioning

`ci.changelog.versioning` controls whether — and where — a changelog run writes
`version` fields into `package.json`. It accepts a boolean or an object, and
defaults to `true`.

```ts
ci: { changelog: { versioning: true } }                       // uniform, defaults
ci: { changelog: { versioning: false } }                      // never write versions
ci: { changelog: { versioning: { target: 'root-only' } } }
ci: { changelog: { versioning: { target: 'individual', workspaces: ['packages/*'] } } }
```

## `target`

| Target       | What it bumps                                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uniform`    | The root (when it has a `package.json`) **and every workspace** to one shared version. **Default.**                                                                          |
| `root-only`  | Only the root `package.json`. Workspaces are left untouched and get no changelog entry.                                                                                      |
| `individual` | The root tracks the overall bump; **each workspace is bumped on its own** from the commits touching its files, so versions can drift apart (like an "independent" monorepo). |

With `versioning: false` no `version` field is written at all — the changelog
entries are still generated (headed as `uniform` would), so you can keep
versioning in another tool (for example changesets).

## `workspaces`

An array of glob patterns selecting the workspaces to version, relative to the
repo root. It resolves in this order:

1. the `workspaces` patterns you pass, when you pass them;
2. otherwise the root `package.json` `workspaces` field, when present;
3. otherwise the root `package.json` alone (a single-package repo);
4. otherwise a warning is logged and nothing is versioned.

```ts
ci: {
    changelog: {
        versioning: {
            target: 'individual',
            workspaces: ['packages/*', '!packages/private-*'],
        },
    },
}
```

Glob negation (`!pattern`) is honoured: the excluded workspaces are removed from
the set, so private packages are never versioned or given a changelog.

`individual` uses a `git log` path filter per workspace, so a workspace is only
bumped when the scanned commit range touched a file inside it — or a file in one
of the workspaces it depends on (see [Workspace changelogs](#workspace-changelogs)).
The root's version always follows the overall bump derived from every scanned
commit.

Re-runs are idempotent: commits already listed in a workspace's own `CHANGELOG.md`
are filtered out before the bump is derived. A workspace with no new commits is
skipped entirely (no bump, no duplicate entry), and an old `feat` cannot re-bump a
workspace as a minor on a later run.

## `prerelease`

Set a tag such as `beta` or `rc` to keep a release on a prerelease channel:

```ts
ci: { changelog: { versioning: { target: 'individual', prerelease: 'beta' } } }
```

- A stable version bumps its core and starts the channel:
  `1.0.0` + a minor bump → `1.1.0-beta.0`.
- An existing prerelease keeps its core and increments the counter instead of
  bumping again: `1.1.0-beta.0` → `1.1.0-beta.1`.
- Switching tags keeps the core and starts the new channel at `.0`:
  `1.1.0-alpha.2` → `1.1.0-beta.0`.
- The suffix is checked before it is applied, so it is never appended twice.

The tag is a single identifier (`^[0-9A-Za-z-]+$`); the numeric counter is added
automatically. The same rule applies to `uniform`, `root-only` and `individual`
targets, including each workspace's own version in `individual` mode.

## How a run decides its versions

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

## Workspace changelogs

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

## Package changes footer

By default the root entry ends with a `### Package changes` footer comparing the
working tree against the previous released version. It reads dependency fields
from every `package.json` and the package-manager catalogs:

- Yarn: `.yarnrc.yml` (`catalog:` and named `catalogs:`);
- pnpm: `pnpm-workspace.yaml` (`catalog:` and named `catalogs:`);
- Bun: `package.json` `workspaces.catalog` / `catalogs`.

Catalog entries are diffed in the same map as declared dependencies, so a
catalog-only range change is reported under the root package at both ends of the
release. Pass `--no-package-changes-section` to omit the footer.

## Custom bump rules

`versioning.bump` maps `major`, `minor` and `patch` to a matcher.
Matchers can be booleans, substrings, `/regex/` strings, arrays, objects
(`{ type, types, scope, scopes, pattern, match, breaking }`) or callbacks.

```ts
ci: {
    changelog: {
        versioning: {
            bump: {
                major: { scope: 'api', breaking: true },
                minor: [{ type: 'feat' }, /^feat\(ui\)/],
                patch: 'fix',
            },
            // Apply one bump per matching change instead of once per run.
            allowOverBump: false,
        },
    },
}
```

Callbacks receive `{ env, logger, packageJson?, commit }` and may return a
boolean or a version index.

## Commit credits and formatting

`versioning.commit` controls the commit bullet credits. All options default to
`true` except `authorAvatar`.

```ts
ci: {
    changelog: {
        versioning: {
            commit: {
                author: true,
                authorAvatar: true,
                commitSha: true,
                issues: true,
                format: ({ commit, author, issues, repo }) =>
                    `${commit.subject} — ${author.name}${issues.length ? ` (${issues.length} issues)` : ''}`,
            },
        },
    },
}
```

## Providers

`versioning.provider` selects the changelog provider:

- `default` (or omitted) uses the built-in pipeline.
- `changesets` runs `npx changeset version` and leaves changelog/version output
  to changesets.
- a callback `(ctx) => string | void` can replace the summary.
- an object `{ id, run(ctx) }` can run custom logic and optionally return the
  summary string.
