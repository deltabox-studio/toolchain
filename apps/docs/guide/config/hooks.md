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
            afterVersion: ({ version }) => console.log('released', version),
            onChange: ({ path }) => console.log('changed', path),
        },
    },
});
```

Return values are awaited.

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

Async hooks are awaited by the CLI, so a failing hook fails the changelog run
before the generated workflow commits. The changelog workflow stages
`.yarnrc.yml` together with `package.json`/`CHANGELOG.md`, so hooks that update a
scaffold catalog are committed in the same version-bump commit.
