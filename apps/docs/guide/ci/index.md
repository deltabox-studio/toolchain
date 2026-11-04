# CI

`dbx sync` writes the opted-in workflows for **GitHub Actions**, **GitLab CI**
and **Azure Pipelines**. Every workflow is **opt-in**: declare it under
`toolchain.ci` to write it; omit it (or set it to `false`) and the toolchain
leaves that file unmanaged. Every id (`ci`, `changelog`, `release`, `issues`,
`sync`) accepts one of four forms:

- `true` / `false` — write the generated GitHub default, or skip it;
- a **`WorkflowOptions` object** — override parts of the GitHub default
  (branches, triggers, extra top-level keys, extra steps/jobs, token overrides);
- a **complete vendor workflow** — `{ provider, workflow }` for `github`,
  `gitlab` or `azure`, written as-is;
- a **raw YAML string** — written **verbatim** as the workflow file, for a
  workflow the object model can't express.

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        ci: {
            ci: true, // the generated GitHub CI checks
            issues: false, // don't write issues.yml
            release: { pushBranches: ['main'] }, // override the GitHub default
            changelog: { branches: { main: 'main', dev: 'dev' } },
            // A complete GitLab pipeline, written to `.gitlab-ci.yml`:
            sync: {
                provider: 'gitlab',
                workflow: {
                    stages: ['check'],
                    check: { stage: 'check', script: ['yarn dbx sync --check'] },
                },
            },
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

## Vendor workflows

A complete vendor workflow always has `provider` and `workflow`; `filename`,
`dir` and `enabled` are optional:

| `provider` | Default file          | Run with           |
| ---------- | --------------------- | ------------------ |
| `github`   | `.github/workflows/`  | `gh workflow run`  |
| `gitlab`   | `.gitlab-ci.yml`      | `glab ci run`      |
| `azure`    | `azure-pipelines.yml` | `az pipelines run` |

```ts [dbx.config.ts]
toolchain: {
    ci: {
        // .gitlab-ci.yml (the default GitLab path)
        ci: {
            provider: 'gitlab',
            workflow: { stages: ['test'], test: { stage: 'test', script: ['yarn test'] } },
        },
        // azure-pipelines.yml (the default Azure path)
        release: {
            provider: 'azure',
            workflow: { trigger: ['main'], pool: { vmImage: 'ubuntu-latest' }, steps: [] },
        },
        // A complete GitHub workflow, written to the default `.github/workflows/deploy.yml`
        custom: {
            deploy: {
                provider: 'github',
                workflow: {
                    name: 'Deploy',
                    on: { push: { branches: ['main'] } },
                    jobs: { deploy: { 'runs-on': 'ubuntu-latest', steps: [] } },
                },
            },
        },
    },
}
```

`filename` and `dir` override the generated path for any provider. The workflow
object is written as-is (only the toolchain's `{{ token }}` replacements are
applied), so it must be a complete pipeline. `dbx workflow` dispatches each
workflow with its vendor CLI — see [CLI](/guide/cli#tsconfig-cleanup-changelog-workflows).

## Typed GitHub workflows

If you prefer a typed builder over hand-writing YAML, use
[`@github-actions-workflow-ts/lib`](https://github.com/emmanuelnk/github-actions-workflow-ts)
(and its `@github-actions-workflow-ts/actions` catalog). The builder produces a
plain workflow object in `.workflow`, which the `github` vendor form accepts:

```ts [dbx.config.ts]
import { ActionsCheckoutV4, ActionsSetupNodeV4 } from '@github-actions-workflow-ts/actions';
import { NormalJob, Step, Workflow } from '@github-actions-workflow-ts/lib';

import { defineConfig, type GitHubWorkflow } from '@deltabox/toolchain';

const test = new NormalJob('test', { 'runs-on': 'ubuntu-latest' });
test.addStep(new ActionsCheckoutV4({ name: 'Checkout' }));
test.addStep(new ActionsSetupNodeV4({ name: 'Setup Node', with: { 'node-version': '22' } }));
test.addStep(new Step({ name: 'Test', run: 'yarn test' }));

const ci = new Workflow('ci.yml', {
    name: 'CI',
    on: { push: { branches: ['main'] } },
});
ci.addJob(test);

export default defineConfig({
    toolchain: {
        ci: {
            ci: {
                provider: 'github',
                workflow: ci.workflow as unknown as GitHubWorkflow,
            },
        },
    },
});
```

The toolchain does not depend on the builder, so the `workflow` field is typed
from its own vendored GitHub schema. The two schemas can drift slightly (for
example the builder's `Partial<Workflow>` makes `on` optional, and its
`permissions` allows `id-token: read`), so cast the object when TypeScript
rejects it. At runtime the workflow is validated by GitHub, exactly like a
hand-written object.

## Workflows

| Workflow  | GitHub file     | Page                                      |
| --------- | --------------- | ----------------------------------------- |
| CI checks | `ci.yml`        | [CI checks](/guide/ci/ci)                 |
| Changelog | `changelog.yml` | [Changelog workflow](/guide/ci/changelog) |
| Release   | `release.yml`   | [Releases](/guide/ci/releases)            |
| Issues    | `issues.yml`    | [Issues](/guide/ci/issues)                |
| Toolchain | `sync.yml`      | [Sync](/guide/ci/sync)                    |

Extra workflows can be defined under `toolchain.ci.custom.<id>` (for example
`ci.custom.deploy` writes `.github/workflows/deploy.yml`, or the vendor default
when it sets `provider`). Each accepts the same workflow forms, plus `filename`
and `dir` overrides.

See [Workflow settings](/guide/ci/settings) for the shared object options and the
[Changelog](/guide/changelog/) guide for the versioning/commitlint pipeline.
