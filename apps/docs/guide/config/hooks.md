# Hooks

`.ts`/`.js` configs can declare lifecycle hooks (JSON cannot):

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        hooks: {
            afterLoad: ({ tokens }) => console.log(tokens),
            beforeSync: ctx => ctx.log('syncing…'),
            afterTask: ({ task, files }) => console.log(task.name, files?.length),
            afterSync: ({ result }) => console.log(result.written.length),
            beforeVersion: ({ previousVersion, version }) =>
                console.log(`${previousVersion} -> ${version}`),
            afterVersion: ({ version }) => console.log('released', version),
            onChange: ({ path }) => console.log('changed', path),
        },
    },
});
```

Return values are awaited.

## `beforeVersion`

`beforeVersion` runs after the bump is planned and **before** `dbx changelog`
writes the new versions or changelogs. It receives the repository root, the
planned `version` and the `previousVersion`:

```ts [dbx.config.ts]
hooks: {
    beforeVersion: async ({ cwd, previousVersion, version }) => {
        await assertReleaseAllowed(previousVersion, version, cwd);
    },
},
```

Throwing (or a rejected async hook) aborts the run before any files are
written. It does not run for `--dry-run`, `--release-notes` or `--format-only`.

## `afterVersion`

`afterVersion` runs after `dbx changelog` writes the new versions and
changelogs (it does not run for `--dry-run`, `--release-notes` or
`--format-only`). It receives the repository root and the new version:

```ts [dbx.config.ts]
hooks: {
    afterVersion: async ({ cwd, version }) => {
        console.log('released', version);
        await updateScaffoldCatalog(cwd);
    },
},
```

Async hooks are awaited by the CLI and `runChangelogAsync`; the synchronous
`runChangelog` wrapper rejects async hooks. A failing `beforeVersion` hook aborts
the run before any files are written (a failing `afterVersion` hook runs after
the writes). The changelog workflow stages `.yarnrc.yml` together with
`package.json`/`CHANGELOG.md`, so hooks that update a scaffold catalog are
committed in the same version-bump commit.
