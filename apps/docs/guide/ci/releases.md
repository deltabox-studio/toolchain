# Releases

The generated `ci.release` workflow (`release.yml`) opens a release PR whose body
is the **aggregated changelog**: every entry from the last released version up to
the latest one, not just the newest entry. So a release that skips versions
(eg. `v1.7.0` → `v1.7.8`) still documents `1.7.1`–`1.7.8` in one place.

The body is produced by `dbx changelog --release-notes <version>`, which only
considers tags whose version actually appears in `CHANGELOG.md` (so unrelated
CI/calendar tags are ignored). For a first release, when there is no prior
version, it falls back to the newest changelog entry instead of the whole file.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        release: { pushBranches: ['main'] },
    },
}
```

The workflow is opt-in. Use [Workflow settings](/guide/ci/settings) to override
the job's extra steps/jobs or supply a fully hand-authored workflow.
