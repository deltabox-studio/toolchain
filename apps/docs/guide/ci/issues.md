# Issues

The `ci.issues` workflow (`issues.yml`) normalizes new issue titles from the
issue's labels: a bug-labelled issue gets a `[bug]` prefix, an
enhancement/feature/feat-labelled issue gets `[feat]`; issues without either
label are left untouched.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        issues: true,
    },
}
```

The workflow is opt-in and only runs on `issues: opened`. It needs the
`issues: write` permission, which the generated default declares.

Use [Workflow settings](/guide/ci/settings) to change its triggers or add jobs.
