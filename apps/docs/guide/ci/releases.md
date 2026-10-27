# Releases

The generated `ci.release` workflow (`release.yml`) opens a release PR whose body
is the **aggregated changelog**: every entry from the last tag
(`git describe --tags --abbrev=0`) up to the latest version, not just the newest
one. So a release that skips versions (eg. `v1.7.0` → `v1.7.8`) still
documents `1.7.1`–`1.7.8` in one place.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        release: { pushBranches: ['main'] },
    },
}
```

The workflow is opt-in. Use [Workflow settings](/guide/ci/settings) to override
the job's extra steps/jobs or supply a fully hand-authored workflow.
