# Workflow settings

A workflow can be a boolean, a raw YAML string, or a `WorkflowOptions` object.
The object is merged over the generated default, so you only describe what
changes. These options apply to every workflow (`ci`, `changelog`, `release`,
`issues`, `sync`).

```ts [dbx.config.ts]
toolchain: {
    ci: {
        ci: {
            enabled: true,
            pushBranches: ['main', 'next'],
            pullRequestBranches: ['main', 'release/**'],
            triggers: { schedule: [{ cron: '0 6 * * *' }] },
            tokens: { nodeVersion: '24' },
            extra: { permissions: { contents: 'read' } },
            steps: {
                after: [{ name: 'Lint', run: 'yarn lint' }],
            },
            jobs: {
                smoke: {
                    'runs-on': 'ubuntu-latest',
                    steps: [{ run: 'echo ok' }],
                },
            },
        },
    },
}
```

| Option                | What it does                                                                    |
| --------------------- | ------------------------------------------------------------------------------- |
| `enabled`             | Enable/disable this workflow (default: enabled when present).                   |
| `pushBranches`        | Replace `on.push.branches`.                                                     |
| `pullRequestBranches` | Replace `on.pull_request.branches`.                                             |
| `triggers`            | Merge extra `on.*` triggers.                                                    |
| `extra`               | Merge extra top-level keys (`permissions`, `concurrency`, `env`, ...).          |
| `steps`               | Inject steps before/after a job's generated steps (one group or per-job).       |
| `jobs`                | Merge extra complete jobs.                                                      |
| `tokens`              | Override workflow tokens (`nodeVersion`, `packageManager`, `yarnVersion`, ...). |
| `filename`            | Override the generated file name (default `ci.yml`, `release.yml`, ...).        |
| `dir`                 | Override the output directory (default `.github/workflows`).                    |

## Steps

`steps` accepts one group or an array of groups. A group targets a job id
(default: the first/primary job) and can add steps before or after the generated
ones:

```ts
steps: [
    { job: 'ci', before: [{ name: 'Install extras', run: 'yarn add -D foo' }] },
    { job: 'ci', after: [{ name: 'Smoke', run: 'yarn smoke' }] },
];
```

## Tokens

The default workflow templates use `{{ token }}` replacements. `tokens` merges
over the project-wide values, so one workflow can use a different Node version or
package manager without changing `project`. Overriding `packageManager` switches
to that manager's default version unless you also set `packageManagerVersion`
(or the legacy `yarnVersion` alias).

## Raw YAML

A string is used as the workflow file's exact content. It is not merged, not
token-replaced and gets no generated header; an empty string disables it.

## Custom workflows

Add any number of extra workflows with `toolchain.ci.custom`, keyed by workflow
id. A custom workflow is enabled by **presence** (there is no boolean form): a
string is written verbatim, or an object is merged over an empty workflow —
build it with `triggers`, `extra` and `jobs` (plus `filename` / `dir`):

```ts [dbx.config.ts]
toolchain: {
    ci: {
        custom: {
            deploy: {
                triggers: { workflow_dispatch: {}, push: { branches: ['main'] } },
                filename: 'deploy.yml', // default: deploy.yml
                dir: '.github/workflows', // default
                jobs: {
                    deploy: {
                        'runs-on': 'ubuntu-latest',
                        steps: [
                            { uses: 'actions/checkout@v4' },
                            { run: 'yarn deploy' },
                        ],
                    },
                },
            },
        },
    },
}
```

This writes `.github/workflows/deploy.yml` and manages it like any built-in
workflow (the generated header is prepended, and `dbx sync --check` tracks it).

## Existing workflows

If a generated workflow path already contains a hand-written workflow that dbx has
never managed (no manifest entry and no generated header), `dbx sync` leaves it
untouched, warns, and records the conflict in `.dbx/toolchain/manifest.json`.
Set `ci.<id>: { enabled: false }` (or, for a custom workflow,
`ci.custom.<id>: { enabled: false }`) to make the opt-out explicit. The file is
also never deleted when the workflow is later disabled, because dbx did not
create it. Use `dbx workflow --list` (or `--list --json`) to see the enabled
workflows and their exact paths; `dbx workflow <id|file>` honours `filename` and
`dir` overrides.
