# Sync

The `ci.sync` workflow (`sync.yml`) verifies that every generated file is up to
date: it runs `dbx sync --check` on pushes (to both the `main` and `dev` branch
globs) and on pull requests. A drift in a workflow, tsconfig, `vite.config.ts`
or any other managed file fails the job.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        sync: true,
    },
}
```

The workflow is opt-in. The `ci` check workflow also runs `dbx sync --check`, so
`sync.yml` is useful when you want the check to run on pull requests without the
full build. See [Workflow settings](/guide/ci/settings) for trigger overrides.
