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

## Manual `toolchain.changelog`

The top-level `changelog` section configures manual runs for `dbx changelog`, the
VS Code actions and the programmatic API. It accepts the pipeline options
(commitlint, versioning, VS Code settings), but not the CI-only workflow options
or `branches`:

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
