# Changelog workflow

The `ci.changelog` workflow (`changelog.yml`) generates the changelog and applies
the version bump. It runs on every push to `ci.changelog.branches.dev` (or
`main` when `dev` is not set), then commits the updated `CHANGELOG.md` files and
`package.json` versions back to the branch.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        changelog: {
            branches: { main: 'main', dev: 'dev' },
            pushBranches: ['dev'], // optional per-workflow override
        },
    },
}
```

`ci.changelog` is also the changelog **pipeline** config. Its options are
documented in the [Changelog](/guide/changelog/) guide:

- [Branches](/guide/changelog/branches)
- [commitlint](/guide/changelog/commitlint)
- [Versioning](/guide/changelog/versioning)
- [CLI](/guide/changelog/cli)

The workflow is opt-in (`ci.changelog: true` or an object). `ci.changelog:
false` leaves it unmanaged; `ci.changelog.commitlint: false` still generates the
workflow but skips commitlint, its config and the local hook.
