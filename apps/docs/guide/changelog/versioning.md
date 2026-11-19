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

## Version hooks

Use [`toolchain.hooks.beforeVersion`](/guide/config/hooks#beforeversion) for
work that must happen before the writes (for example a release guard), and
[`toolchain.hooks.afterVersion`](/guide/config/hooks#afterversion) for work that
must follow a version bump, such as syncing a scaffold catalog:

```ts [dbx.config.ts]
hooks: {
    beforeVersion: ({ previousVersion, version }) => {
        assertReleaseAllowed(previousVersion, version);
    },
    afterVersion: ({ cwd }) => syncScaffoldCatalog(cwd),
},
```

Both hooks receive the repository root and the new version (`beforeVersion`
also receives `previousVersion`); async hooks are awaited. The generated
changelog workflow stages `.yarnrc.yml` with the bump, so a catalog update lands
in the same commit.

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
release. Entries are grouped by the declaring package (one top-level bullet per
package, with each changed dependency nested under it). Pass
`--no-package-changes-section` to omit the footer.

`--format-only` recomputes each released entry's footer from its release refs.
The newest entry is usually unreleased, so its footer compares the working tree
with the previous release — the same diff `dbx changelog` wrote. A tagged newest
entry keeps its ref-to-ref diff and never picks up uncommitted dependency
changes.

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

## Targeted options

prerelease, `bump.{major,minor,patch}`, `allowOverBump`, `commit` and
`provider` accept either the plain value or a scoped form:

`ts
ci: {
    changelog: {
        versioning: {
            prerelease: [
                { target: 'packages/ui', options: 'beta' },
                { include: 'apps/*', options: 'rc' },
            ],
            bump: { minor: [{ target: 'packages/core', options: /^feat/ }] },
            allowOverBump: [{ target: 'packages/ui', options: true }],
            commit: [{ exclude: 'packages/legacy', options: { authorAvatar: true } }],
            provider: [{ target: '.', options: { id: 'custom', run: ctx => ctx.records.length + ' commits' } }],
        },
    },
}
`

Each scoped entry shares the same selector as `toolchain.changelog.intro` /
`outro`: `target` (a workspace path, `.` for the root, or a glob like
`apps/*`), `include` and `exclude`. The narrowest matching target wins; when
nothing matches, the plain value is used. Workspaces outside
`versioning.workspaces` are never considered.

`Arrayable` entries (one value or an array) are supported for every targeted
option and for the intro/outro settings.

## Collapsible details

`versioning.commit.details` wraps changelog sections in markdown
`<details>`/`<summary>` blocks. It is enabled by default; `details: false` opts
out.

- `descriptions` (default on) nests a commit's description body under its bullet
  as a collapsible whose summary is `**See more...**`.
- `breaking` (default on) wraps the breaking section; the summary names the
  section, so the duplicate heading is not repeated inside.
- The version stays a normal `##` heading. Release mode wraps the body with the
  `**Release notes**` summary and `details.body` is opt-out there; in
  non-release mode `details.body` is opt-in.
- `intro`/`outro`/`footer` are opt-in wrappers; `types` (default on) wraps the
  CC type sections, leaving the generated `Package changes`/`New contributors`
  footers alone.

Summaries accept inline Markdown, which is converted to HTML (`<strong>`,
`<em>`, `<code>`, links, images and `<del>`) because Markdown is not parsed
inside `<summary>`. Heading elements are not used there; summaries are bold or
plain inline content.

```ts
ci: {
    changelog: {
        versioning: {
            commit: {
                details: {
                    descriptions: { title: 'More', expanded: true },
                    releaseNotes: { title: 'Release notes' },
                    intro: true,
                    outro: true,
                    footer: true,
                    breaking: false,
                    types: ['feat', 'fix'],
                    custom: { start: '<!-- details:start -->', end: '<!-- details:end -->' },
                },
            },
        },
    },
}
```

- `descriptions` uses `See more...` by default and only applies when the commit has a body; the collapsible is nested under the commit bullet.
- `releaseNotes`/`body` use `Release notes` by default; `breaking`/`types` use the section title (bold for breaking).
- `intro`, `outro` and `footer` keep inline summaries.
- `types` (default on) wraps CC type sections (all types when `true`), using the section title by default.
- `minCommits` on a toggle skips the collapsible until that section has at least
  N commit entries. A top-level `minCommits` sets the default for every section;
  a nested value wins. The body defaults to **10** commits.
- `custom` accepts a regex/string or `{ start, end }` markers; the match (or start match) becomes the summary.

Every flag also accepts `{ title?: string; expanded?: boolean }`.

### Details lifecycle

`details.lifecycle` controls when wrapping happens:

- `after` (default): details are applied to the fully formatted entry. Custom
  `RegExp`/string searches therefore match the formatted text (bold headings,
  credits, etc.).
- `before`: details are applied while the entry is rendered.

`details.body` wraps the whole version body in a collapsible titled
`Release notes`. It is opt-in in non-release mode and opt-out in release mode,
and requires at least 10 commits (`minCommits`) when enabled unless overridden.
Release mode uses `details.releaseNotes` with the same title by default.
