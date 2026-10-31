# Changelog

## CI

The `ci` section drives everything Conventional Commits (by default): the CI that lints
commit messages, the local husky hook, the `commitlint.config.mjs`, the GitHub
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
commitlint config, and the husky `commit-msg` hook (`.husky/commit-msg`). Activate
the hook with a `postinstall` script (Yarn Berry never runs `prepare`):

```json [package.json]
{ "scripts": { "commitlint": "commitlint", "postinstall": "husky" } }
```

See [Package scripts](/guide/scripts) for the full recommended script set.

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

Types you do not mention are appended in the default order (`feat`, `fix`,
`perf`, ...). `order` overrides the array/record position, and every
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
