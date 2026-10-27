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
package manager without changing `project`.

## Raw YAML

A string is used as the workflow file's exact content. It is not merged, not
token-replaced and gets no generated header; an empty string disables it.
