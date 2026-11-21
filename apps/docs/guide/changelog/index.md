# Changelog

## CI

The `ci` section drives everything Conventional Commits (by default): the CI that lints
commit messages, the local commit hook, the `commitlint.config.mjs`, the GitHub
workflows, and the changelog pipeline that bumps versions and writes
`CHANGELOG.md`. Its `ci.changelog` config holds the changelog-specific options.

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        ci: {
            ci: true,
            release: true,
            changelog: {
                branches: { main: 'main', dev: 'dev' },
                commitlint: {
                    types: ['feat', 'fix', 'docs', 'chore'],
                    scopes: ['api', 'web', 'deps'],
                },
                versioning: { target: 'individual', workspaces: ['packages/*', 'apps/*'] },
            },
        },
    },
});
```

`dbx sync` writes the opted-in GitHub workflows (`.github/workflows`), the
commitlint config, and the `commit-msg` hook. On a Vite+ project the hook is
`.vite-hooks/commit-msg`, installed by `vp hooks enable` / `vp config`; projects
without Vite+ keep the husky fallback (`.husky/commit-msg`). Activate the
dispatcher with a `postinstall` script:

```json [package.json]
{
    "scripts": {
        "commitlint": "commitlint",
        "postinstall": "vp hooks enable"
    }
}
```

For Vite+ projects, add a `.vite-hooks/pre-commit` running `vp staged` and put
the staged checks in the root `vite.config.ts` (`staged: { '*': 'vp check
--fix' }`). See [Package scripts](/guide/scripts) for the full recommended script
set.

## Group order and titles

`groups` customizes the Conventional-Commits sections. It works on both
`toolchain.changelog.groups` (manual runs) and `ci.changelog.groups` (CI + manual
when inherited). An array sets the order and optionally the titles:

```ts
ci: {
    changelog: {
        groups: [
            { type: 'feat', title: 'New Features' },
            { type: 'fix', title: 'Bug Fixes' },
            'perf',
        ],
    },
}
```

A record is a shorthand for the same thing, ordered by its keys. Use `false` to
hide a group:

```ts
groups: {
    feat: 'New Features',
    fix: 'Bug Fixes',
    chore: false,
}
```

The default order is **Breaking Changes**, `feat`, `fix`, then the remaining
types (`perf`, `refactor`, `docs`, ...). Types you do not mention are appended in
the default order. `order` overrides the array/record position, and every
title/order/hidden value accepts a callback. The whole `groups` value can also be
a callback, so it can be computed from the types/items in the current run:

```ts
groups: context => [
    {
        type: 'feat',
        title: group => `New Features (${group.groupItems.length})`,
        order: 0,
    },
    { type: 'fix', hidden: group => group.groupItems.length === 0 },
    ...context.types.filter(type => !['feat', 'fix'].includes(type)),
];
```

Callbacks are TS/JS-config-only. `dbx changelog --format-only` also uses the
configured order/titles when regrouping existing entries.

`groups` only groups **commit sections** inside one version. To treat several
changelog versions as one release body, use
[`release.group`](/guide/ci/releases#grouped-release-bodies) instead.

## Breaking-change detection

Breaking commits are detected by Conventional Commits rules by default: a `!`
before the subject colon (`feat!:`, `feat(scope)!:`) or a `BREAKING CHANGE:` /
`BREAKING-CHANGE:` footer line. Configure `breaking` on either
`toolchain.changelog` or `ci.changelog` to override it:

```ts
breaking: 'conventional', // default
// breaking: 'any',       // legacy loose match anywhere in the subject/body
// breaking: false,       // disable breaking detection
// breaking: { pattern: '^feat!:' },
// breaking: { match: 'BREAKING CHANGE' },
// breaking: ({ subject, body }) => subject.includes('!'),
```

The same setting is used for version bumps, changelog grouping and
`--format-only` regrouping.

## Manual `toolchain.changelog`

The top-level `changelog` section configures manual runs for `dbx changelog`, the
VS Code actions and the programmatic API. It accepts the pipeline options
(commitlint, versioning, groups, VS Code settings), but not the CI-only workflow
options or `branches`:

```ts [manual pipeline]
toolchain: {
    changelog: {
        commitlint: { types: ['feat'], scopes: ['api'] },
        versioning: true,
        vscode: true,
    },
}
```

Move the generated workflows to the top-level `ci` section, and put the pipeline
options under `ci.changelog` when CI should use them too. Branches and workflow
overrides only exist on `ci.changelog`:

```ts [after]
toolchain: {
    ci: {
        ci: true,
        release: true,
        changelog: {
            branches: { main: 'main' },
            commitlint: { types: ['feat'], scopes: ['api'] },
            versioning: true,
            vscode: true,
        },
    },
}
```

`ci.changelog` inherits `toolchain.changelog` when it is enabled without
pipeline options (`ci.changelog: true`, a raw workflow string, or workflow-only
overrides). Options set explicitly on `ci.changelog` win.

## GitHub metadata

When `gh` is installed and authenticated, a run resolves commit authors, PR
credit and issue titles/links from GitHub. Lookups are batched so a large range
stays close to a handful of requests:

- one REST `compare/{base}...{head}` request per scanned range for commit
  authors;
- GraphQL `associatedPullRequests` lookups in batches of 100 commits (a PR
  author wins over the commit author, matching the changelog credit rules);
- aliased GraphQL issue lookups, 100 issues per request.

Without `gh` (or with `DBX_NO_GH=1`) the pipeline falls back to git metadata and
plain `#123` references. Commits that no remote-tracking ref reaches are skipped
(GitHub cannot resolve an unpushed SHA), and terminal client errors (eg. a 404
for a missing ref) are not retried. Other failures are retried
`DBX_GH_MAX_RETRIES` times (default 5) with a `DBX_GH_RETRY_DELAY` ms delay
(default 3000), then `gh` is disabled for the rest of the run. Set `DBX_GH_BIN`
to point at a different `gh` executable.

## Where to start

- [CI](/guide/ci/) — the opt-in GitHub workflows (CI checks, changelog, release,
  issues, sync) and their common settings.
- [Branches](/guide/changelog/branches) — `main`/`dev` branch globs.
- [commitlint](/guide/changelog/commitlint) — config location, types/scopes and
  the no-commitlint fallback.
- [Versioning](/guide/changelog/versioning) — which `package.json` versions a run
  bumps.
- [CLI](/guide/changelog/cli) — running the changelog locally.
- [Writing commit messages](/guide/changelog/writing-commit-messages) — avoiding
  shell-mangled messages.
- [Troubleshooting](/guide/changelog/troubleshooting) — the upstream commitlint
  parser-preset error.
- [Releases](/guide/ci/releases) — the aggregated release PR body.
