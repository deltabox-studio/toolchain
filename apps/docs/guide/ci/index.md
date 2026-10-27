# CI

`dbx sync` writes the opted-in GitHub workflows into `.github/workflows`. Every
workflow is **opt-in**: declare it under `toolchain.ci` to write it; omit it (or
set it to `false`) and the toolchain leaves that file unmanaged. Every id (`ci`,
`changelog`, `release`, `issues`, `sync`) accepts one of three forms:

- `true` / `false` — write the generated default, or skip it;
- a **`WorkflowOptions` object** — override parts of the default (branches,
  triggers, extra top-level keys, extra steps/jobs, token overrides);
- a **raw YAML string** — written **verbatim** as the workflow file, for a
  workflow the object model can't express.

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        ci: {
            ci: true, // the generated CI checks
            issues: false, // don't write issues.yml
            release: { pushBranches: ['main'] }, // override the default
            changelog: { branches: { main: 'main', dev: 'dev' } },
            // A fully hand-authored workflow, written as-is:
            sync: `name: Toolchain sync
on: [push, pull_request]
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn dbx sync --check
`,
        },
    },
});
```

A raw string is **not** merged with the default, is **not** token-replaced, and
gets **no generated header** — it is the file's exact content. The
`ci.changelog.branches` defaults don't apply to it either (it defines its own
triggers). An empty string disables the workflow.

The `ci` key doubles as the CI-checks workflow (`ci.yml`) and the section name, so
`toolchain.ci.ci` is the checks workflow. Set `toolchain.ci.enabled` to `false` to
disable the whole section (and every nested workflow) at once.

## Workflows

| Workflow  | File            | Page                                      |
| --------- | --------------- | ----------------------------------------- |
| CI checks | `ci.yml`        | [CI checks](/guide/ci/ci)                 |
| Changelog | `changelog.yml` | [Changelog workflow](/guide/ci/changelog) |
| Release   | `release.yml`   | [Releases](/guide/ci/releases)            |
| Issues    | `issues.yml`    | [Issues](/guide/ci/issues)                |
| Toolchain | `sync.yml`      | [Sync](/guide/ci/sync)                    |

See [Workflow settings](/guide/ci/settings) for the shared object options and the
[Changelog](/guide/changelog/) guide for the versioning/commitlint pipeline.
