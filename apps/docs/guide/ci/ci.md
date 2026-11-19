# CI checks

The `ci.ci` workflow (`ci.yml`) is the repository's main check. It runs on
pushes to `ci.changelog.branches.main` and on pull requests to the generated
branch globs, and its default job:

1. checks out the repo, then sets up the toolchain: a Vite/Vite+ project uses
   [`voidzero-dev/setup-vp`](https://viteplus.dev/guide/ci) (which installs
   Vite+, Node.js and the package manager, then runs `vp install`), while any
   other project sets up Node and Corepack and installs dependencies;
2. runs commitlint over the pushed range — **removed when commitlint is
   disabled** with `ci.changelog.commitlint: false`;
3. runs `dbx sync --check` so generated files cannot drift;
4. runs the package manager's `build`.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        ci: {
            pullRequestBranches: ['main', 'dev', 'release/**', 'dependabot/**'],
            steps: {
                after: [
                    { name: 'Format + lint', run: 'yarn check:fix' },
                    { name: 'Test', run: 'yarn test' },
                ],
            },
        },
    },
}
```

Use [Workflow settings](/guide/ci/settings) for the shared options, including
how a project is detected as Vite+ and how to force or disable that setup. The
workflow is opt-in: `ci: { ci: true }` writes it; omitting `ci.ci` (or setting it
to `false`) leaves the file unmanaged. Set `provider` (`gitlab`/`azure`) with a
complete `workflow` object to write that vendor's pipeline instead.
