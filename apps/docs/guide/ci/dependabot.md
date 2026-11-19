# Dependabot

`ci.dependabot` writes `.github/dependabot.yml` so GitHub keeps the project's
dependencies and pinned actions up to date, and can additionally enable native
Dependabot security updates with grouped or individual PRs. Like every workflow
it is **opt-in**: omit it (or set it to `false`) and the file is left unmanaged.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        dependabot: true,
    },
}
```

By default the config watches the **GitHub Actions** and **npm** ecosystems at
the repository root with a **weekly** schedule. The `github-actions` entry also
keeps pinned actions such as
[`voidzero-dev/setup-vp`](https://viteplus.dev/guide/ci#automatic-version-updates),
`actions/checkout` and `actions/setup-node` current, so a Vite+ CI setup does not
drift.

```yaml [.github/dependabot.yml]
version: 2
updates:
    - package-ecosystem: github-actions
      directory: /
      schedule:
          interval: weekly
    - package-ecosystem: npm
      directory: /
      schedule:
          interval: weekly
```

## Security updates

GitHub's native Dependabot security updates open PRs for vulnerable
dependencies. They are a **repository setting**, not a `dependabot.yml` option,
so `ci.dependabot.security` does two things:

1. Adds a `security-updates` group (`applies-to: security-updates`) to the
   generated `dependabot.yml` when the PR strategy is `grouped`.
2. Generates `.github/workflows/dependabot-security.yml`, which runs on the
   Dependabot schedule and enables (or disables) Dependabot security updates
   through the REST API. When a severity threshold is configured, it also
   dismisses alerts below that threshold so Dependabot does not open PRs for
   them.

```ts [dbx.config.ts]
toolchain: {
    ci: {
        dependabot: {
            security: {
                vulnerabilities: { severity: 'high' },
                pr: { strategy: 'grouped' },
            },
        },
    },
}
```

`security: true` is shorthand for:

```ts
security: {
    vulnerabilities: { severity: 'all' },
    pr: { strategy: 'grouped' },
    workflow: true,
}
```

With the grouped strategy the generated config contains:

```yaml [.github/dependabot.yml]
groups:
    security-updates:
        applies-to: security-updates
        patterns:
            - '*'
```

Choosing `pr: { strategy: 'individual' }` omits that group, so Dependabot opens
one security PR per update. User-defined groups with
`applies-to: security-updates` are kept as-is.

The workflow needs a **repository administrator** token to change the repository
setting. Create a `DBX_GITHUB_TOKEN` secret with `administration: write`
(fine-grained) or the `repo` scope (classic). The workflow falls back to
`GITHUB_TOKEN` for the alert-dismissal step (which works with the workflow's
`security-events: write` permission), but `GITHUB_TOKEN` cannot enable the
repository setting. If the token is missing, the step logs a warning and leaves
the setting untouched.

`severity` is applied by the generated workflow because `dependabot.yml` has no
severity filter. It dismisses lower-severity alerts with the `not_used` reason;
if you later lower the threshold, re-open those alerts manually. For native
pre-alert filtering, use GitHub's auto-triage rules and set
`security: { workflow: false }` so the toolchain does not manage the repository
setting.

Set `security: { vulnerabilities: false }` to disable Dependabot security
updates; the generated workflow calls the disable endpoint. Set
`security: { workflow: false }` to leave both the repository setting and alert
dismissal to you.

> `allow` also filters security updates. If you use it to narrow version
> updates, include `'*'` (or every package you want protected) so vulnerability
> PRs are not restricted. `update-types` rules still only affect version
> updates, so the usual major-version `ignore` does not suppress security fixes.

## Options

```ts [dbx.config.ts]
toolchain: {
    ci: {
        dependabot: {
            schedule: 'daily',
            directories: ['/', '/packages/api'],
            ecosystems: ['github-actions', 'npm'],
            labels: ['dependencies'],
            openPullRequestsLimit: 5,
            groups: {
                minor: { 'update-types': ['minor', 'patch'] },
            },
            security: {
                vulnerabilities: { severity: 'high' },
                pr: { strategy: 'grouped' },
            },
            // Allow only the packages you actually want updated...
            allow: {
                npm: [
                    { 'dependency-name': 'vite' },
                    { 'dependency-name': 'vite-plus' },
                ],
                'github-actions': [{ 'dependency-name': '*' }],
            },
            // ...and never cross a major version automatically.
            ignore: {
                npm: [
                    {
                        'dependency-name': '*',
                        'update-types': ['version-update:semver-major'],
                    },
                ],
            },
            dir: '.github', // default
            filename: 'dependabot.yml', // default
        },
    },
}
```

| Option                              | Default                     | What it does                                               |
| ----------------------------------- | --------------------------- | ---------------------------------------------------------- |
| `schedule`                          | `weekly`                    | `daily`, `weekly` or `monthly`.                            |
| `directories`                       | `['/']`                     | Directories to scan.                                       |
| `ecosystems`                        | `['github-actions', 'npm']` | Package ecosystems.                                        |
| `labels`                            | none                        | Labels added to the update PRs.                            |
| `openPullRequestsLimit`             | Dependabot default (5)      | Maximum open update PRs per entry.                         |
| `groups`                            | none                        | Update groups (patterns / update types).                   |
| `security`                          | off                         | Enable security updates (boolean or object).               |
| `security.vulnerabilities`          | `true`                      | Open PRs for vulnerable dependencies.                      |
| `security.vulnerabilities.severity` | `all`                       | Keep alerts at/above a severity, or the listed severities. |
| `security.pr.strategy`              | `grouped`                   | `grouped` (one PR per ecosystem) or `individual`.          |
| `security.workflow`                 | `true`                      | Generate the workflow that applies the setting.            |
| `allow`                             | none                        | Allow rules (an array, or keyed by ecosystem).             |
| `ignore`                            | none                        | Ignore rules (an array, or keyed by ecosystem).            |
| `dir` / `filename`                  | `.github/dependabot.yml`    | Generated path overrides.                                  |
| `enabled`                           | `true` when present         | Set `false` to opt out explicitly.                         |

A hand-written `.github/dependabot.yml` without the generated header is left
untouched and reported as a conflict, exactly like a hand-written workflow.
