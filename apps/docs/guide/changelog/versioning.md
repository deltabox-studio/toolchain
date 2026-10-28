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

`individual` uses a `git log` path filter per workspace, so a workspace is only
bumped when the scanned commit range touched a file inside it — or a file in one
of the workspaces it depends on (see [Workspace changelogs](#workspace-changelogs)).
The root's version always follows the overall bump derived from every scanned
commit.

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

## Custom bump rules

`versioning.bump` maps `major`, `minor`, `patch` (and `alpha`) to a matcher.
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