# Changelog

The `ci` section drives everything Conventional Commits: the CI that lints
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

## Migrating from `toolchain.changelog`

The old top-level `changelog` section is **deprecated** and is rejected by the
loader. Move its workflows to the top-level `ci` section and the rest to
`ci.changelog`; `types`/`scopes` now live under `ci.changelog.commitlint`:

```ts [before]
toolchain: {
    changelog: {
        workflows: { ci: true, release: true },
        branches: { main: 'main' },
        types: ['feat'],
        scopes: ['api'],
        versioning: true,
        vscode: true,
    },
}
```

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

## Where to start

- [Workflows](/guide/changelog/workflows) — how each `ci` workflow entry opts in.
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
- [Releases](/guide/changelog/releases) — the aggregated release PR body.
