# Branches

`ci.changelog.branches.main` and `ci.changelog.branches.dev` pick which branches
the generated workflows target. Each accepts a glob or an array of globs:

| Branch | Drives                                                                         | Default              |
| ------ | ------------------------------------------------------------------------------ | -------------------- |
| `main` | The **CI** workflow (push), the **release** workflow, and the release PR base. | `['main']`           |
| `dev`  | The **changelog/version** workflow (push).                                     | none — reuses `main` |

`dev` has **no default**: when it is omitted the changelog workflow runs on
`main` (so a single-branch repo needs no `dev`). Set it for a `dev` → `main`
flow:

```ts
ci: { changelog: { branches: { main: 'main', dev: 'dev' } } }
// or multiple branches per purpose:
ci: { changelog: { branches: { main: ['main', 'release/**'], dev: ['dev', 'next'] } } }
```

The `sync` workflow runs on both. Any per-workflow `pushBranches` override (eg.
`ci.release.pushBranches`) still wins.
