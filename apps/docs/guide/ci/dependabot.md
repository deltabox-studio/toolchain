# Dependabot

`ci.dependabot` writes `.github/dependabot.yml` so GitHub keeps the project's
dependencies and pinned actions up to date. Like every workflow it is **opt-in**:
omit it (or set it to `false`) and the file is left unmanaged.

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
            dir: '.github', // default
            filename: 'dependabot.yml', // default
        },
    },
}
```

| Option                  | Default                     | What it does                             |
| ----------------------- | --------------------------- | ---------------------------------------- |
| `schedule`              | `weekly`                    | `daily`, `weekly` or `monthly`.          |
| `directories`           | `['/']`                     | Directories to scan.                     |
| `ecosystems`            | `['github-actions', 'npm']` | Package ecosystems.                      |
| `labels`                | none                        | Labels added to the update PRs.          |
| `openPullRequestsLimit` | Dependabot default (5)      | Maximum open update PRs per entry.       |
| `groups`                | none                        | Update groups (patterns / update types). |
| `dir` / `filename`      | `.github/dependabot.yml`    | Generated path overrides.                |
| `enabled`               | `true` when present         | Set `false` to opt out explicitly.       |

A hand-written `.github/dependabot.yml` without the generated header is left
untouched and reported as a conflict, exactly like a hand-written workflow.
