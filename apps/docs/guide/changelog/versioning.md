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

A stable release can group every prerelease since the last stable release into
one GitHub Release body with `changelog.release.group: true`. See
[Grouped release bodies](/guide/changelog/release#grouped-release-bodies).

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

`versioning.bump` maps `major`, `minor` and `patch` to a matcher. Matchers can be
booleans, substrings, `/regex/flags` strings, arrays, matcher objects
(`{ type, types, scope, scopes, pattern, match, breaking }`) or callbacks
(TS/JS configs only).

```ts
ci: {
    changelog: {
        versioning: {
            bump: {
                major: [{ breaking: true }, { type: 'feat', scope: 'api' }],
                minor: { type: 'feat' },
                patch: { type: 'fix' },
            },
        },
    },
}
```

A matcher object requires only the fields you want; the rest are ignored:

| Field      | Matches                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `type`     | One Conventional-Commits type (for example `feat`).                                              |
| `types`    | Any type in the list.                                                                            |
| `scope`    | One Conventional-Commits scope.                                                                  |
| `scopes`   | Any scope in the list.                                                                           |
| `pattern`  | A regular expression tested against the subject + body.                                          |
| `match`    | A substring of the subject + body.                                                               |
| `breaking` | `true` for breaking commits, `false` for non-breaking commits. Omit it to ignore breaking state. |

### Rules replace Conventional Commits

This is the most important rule: **adding any `bump` level replaces the
Conventional-Commits fallback for that target.** Unlisted levels never match, so
they cannot add their own bump. A run always produces at least a `patch` bump
because semver has no smaller published version.

```ts
bump: {
    minor: { type: 'feat' },
}
```

With only a `minor` rule, a `feat!:` commit is a **minor** bump (there is no
`major` rule), and a `fix:` commit is a **patch** bump (the minimum). If you want
the usual Conventional-Commits behavior plus one override, spell every level out:

```ts
bump: {
    major: { breaking: true },
    minor: { type: 'feat' },
    patch: true,
}
```

`versioning.bump` only decides the next version number. Changelog section
grouping (`feat`, `fix`, ...) is controlled separately by `groups` and still uses
Conventional Commits.

### Disabling a level

Set a level to `false` (or leave it out) to disable it. This is useful when a
team only wants major bumps from an explicit marker, or never wants minor bumps:

```ts
bump: {
    // Breaking changes no longer bump major.
    major: false,
    minor: { type: 'feat' },
    patch: true,
}
```

What each switch does:

| Setting           | Result                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `major: false`    | Breaking commits cannot bump major. They use the highest other match, or patch.                    |
| `minor: false`    | Feats cannot bump minor. They use the highest other match, or patch.                               |
| `patch: false`    | Custom patch matchers stop matching, but a run still produces at least a patch bump.               |
| all three `false` | Nothing matches; the run still produces a patch bump.                                              |
| remove `bump`     | Conventional Commits decides again (`feat` minor, `fix`/other patch, `!`/`BREAKING CHANGE` major). |

`breaking: false` is not the same as omitting `breaking`: it matches only
**non-breaking** commits. `{ breaking: true }` matches only breaking commits.

### More examples

Bump major for an explicit marker instead of Conventional Commits:

```ts
bump: {
    major: 'BREAKING CHANGE:',
    minor: { type: 'feat' },
    patch: true,
}
```

That matches the literal footer text. Use `{ breaking: true }` instead if you
want the configured Conventional-Commits detection (`!` or a `BREAKING CHANGE:`
footer) to decide.

Bump major for a specific scope and keep everything else on Conventional
Commits:

```ts
bump: {
    major: [{ breaking: true }, { type: 'feat', scope: 'api' }],
    minor: { type: 'feat' },
    patch: true,
}
```

Only let `feat` and `fix` drive the higher levels. Other types still produce a
patch (the minimum), but never a minor/major bump through this rule set:

```ts
bump: {
    minor: { type: 'feat' },
    patch: { type: 'fix' },
}
```

Use the commit body, or any custom rule, through a callback. Callbacks receive
`{ env, logger, packageJson?, commit, level }` and return a boolean or the level
name. Returning a level name only matches while that same level is being
evaluated, which keeps the highest-match rule predictable:

```ts
bump: {
    major: ({ commit }) => commit.subject.startsWith('feat!'),
    minor: ({ commit, packageJson }) =>
        commit.subject.startsWith('feat') &&
        packageJson?.name === '@org/ui',
    patch: ({ commit }) => commit.subject.startsWith('fix'),
}
```

Apply one escalation per additional matching commit:

```ts
bump: {
    minor: { type: 'feat' },
    patch: true,
},
// Two matching commits become minor -> major; one stays minor.
allowOverBump: true,
```

Targeted rules apply per workspace. A target with no matching scoped rule falls
back to Conventional Commits (unless it has another scoped rule for that target):
see [Targeted options](#targeted-options).

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

`versioning.provider` selects who writes versions and changelog entries. It
accepts one of:

| Provider             | What it does                                                                                 |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `default` or omitted | The built-in pipeline: derive the bump, write `package.json` versions and changelog entries. |
| `changesets`         | Runs `changeset version` and leaves versions/changelogs to changesets.                       |
| `(ctx) => string`    | A callback that returns a custom version body (TS/JS configs only).                          |
| `{ id, run(ctx) }`   | The same as a callback, with a stable id for readability.                                    |

Unknown string ids throw instead of silently falling back to the built-in
pipeline.

### Use changesets

The changesets provider is for a repository that already uses
[changesets](https://github.com/changesets/changesets) for versions and
changelogs. It runs the repo-wide `changeset version` and does **not** run the
built-in version bump, changelog writer, or version hooks.

1. Install and initialize changesets:

    ```sh
    yarn add -D @changesets/cli
    npx @changesets/cli init
    ```

    This creates `.changeset/config.json`. Commit the `.changeset` directory.

2. Add a changeset with every user-facing change:

    ```sh
    npx @changesets/cli
    ```

3. Select the provider. Keep `versioning` as an object; `versioning: false`
   disables the provider with the rest of the versioning section:

    ```ts
    ci: {
        changelog: {
            versioning: {
                provider: 'changesets',
            },
        },
    }
    ```

4. Run `dbx sync` after changing the provider. The generated changelog workflow
   then also stages the `.changeset/*.md` files that `changeset version`
   consumes, so the version commit is complete.

What changesets owns:

- Package versions and `CHANGELOG.md` files. The built-in `target`,
  `workspaces`, `prerelease`, `bump`, `allowOverBump` and `commit` options are
  ignored (the changelog-specific `groups`, `intro`, `outro` and `details`
  options are also not applied).
- Publishing/tagging. The provider only runs `changeset version`; run
  `changeset publish` (or changesets' GitHub Action) for the release itself.
  The generated release workflow is built around the root `package.json`
  version, so independent-package releases usually need changesets' own
  release automation.

Behavior:

- The command is `npx --yes @changesets/cli version` in the repository root.
  Set `DBX_CHANGESET_BIN` to run a local binary (or a `.js`/`.mjs` entrypoint)
  instead.
- A missing `.changeset/config.json` fails with a setup hint before any writes.
- `--dry-run` explains that changesets owns the output and returns without
  writing a proposed changelog.
- `--version` takes precedence and retags the changelog headings, so do not
  combine it with the changesets provider.
- Version hooks (`beforeVersion`/`afterVersion`) do not run for changesets.
- Use changesets' prerelease mode (`changeset pre enter beta`,
  `changeset pre exit`) for prereleases; `versioning.prerelease` is ignored
  because changesets owns the version strings.

If any versioned target selects `changesets` (for example through a targeted
provider entry), changesets runs once for the whole repository.

### Custom providers

A callback receives `{ cwd, changelog, records }`, where `cwd` is the repository
root and `records` are the commits in the scanned range. Return a string to
replace the version body for that target; return `undefined` to keep the
built-in body.

```ts
ci: {
    changelog: {
        versioning: {
            provider: ctx => {
                if (ctx.records.length === 0) return 'No user-facing changes.';
                return `This release contains ${ctx.records.length} changes.`;
            },
        },
    },
}
```

The object form is the same, with an id:

```ts
provider: {
    id: 'release-summary',
    run: ctx => `${ctx.records.length} commits`,
}
```

The provider output is the body inside the version heading; the heading, release
markers, package-changes footer and version bump are still written by the
built-in pipeline.

### Targeted providers

`provider` accepts the same scoped form as the other versioning options. This
lets the root and each workspace use a different provider:

```ts
ci: {
    changelog: {
        versioning: {
            target: 'individual',
            provider: [
                { target: '.', options: { id: 'root', run: () => 'Root summary' } },
                { target: 'packages/ui', options: 'changesets' },
                { include: 'apps/*', options: ctx => `${ctx.records.length} app commits` },
            ],
        },
    },
}
```

With this config, selecting changesets for `packages/ui` still runs changesets
once for the repository; the root and app providers are not used in that run.
Without a changesets target, each target uses its own provider.

## Targeted options

`prerelease`, `bump.{major,minor,patch}`, `allowOverBump`, `commit` and
`provider` accept either the plain value or a scoped form:

```ts
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
            provider: [
                {
                    target: '.',
                    options: { id: 'custom', run: ctx => ctx.records.length + ' commits' },
                },
            ],
        },
    },
}
```

Each scoped entry shares the same selector as `toolchain.changelog.intro` /
`outro`: `target` (a workspace path, `.` for the root, or a glob like
`apps/*`), `include` and `exclude`. The narrowest matching target wins; when
nothing matches, the plain value is used. Workspaces outside
`versioning.workspaces` are never considered.

A targeted bump rule that does not match a target is **ignored** (not treated as
a match-all rule). If no scoped level applies to that target, it falls back to
Conventional Commits. If at least one level applies, the target uses the custom
rules and unlisted levels do not auto-bump (see
[Rules replace Conventional Commits](#rules-replace-conventional-commits)). If a
level applies but its matcher does not match any commit, the result is patch
(the minimum).

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
- The version stays a normal `##` heading. `--release-body-wrap` wraps the body
  with the `**Release notes**` summary and `details.body` is opt-out there; in
  non-wrapping mode `details.body` is opt-in.
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
`Release notes`. It is opt-in normally and opt-out with
`--release-body-wrap`, and requires at least 10 commits (`minCommits`) when
enabled unless overridden. Release body wrapping uses `details.releaseNotes`
with the same title by default.
