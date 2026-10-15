# deltabox toolchain for VS Code

A VS Code sidebar for managing `@deltabox/toolchain` across projects.

## Sidebar

The **deltabox toolchain** activity-bar container has three views:

- **Home** — a general last-sync line, status, quick actions and an expandable
  **All actions** list, plus a card for every project (root first). Configured
  projects show a per-project Sync button, a last-sync line and a `⋮` menu with
  project-scoped actions; projects without a config show a "no config" badge.
- **Files** — every generated/managed file, grouped per project (read from each
  project's `.dbx/toolchain/manifest.json`); click a file to open it.
- **Projects** — workspace-root groups with every package nested underneath
  (root first). Select one or more and run **Sync selected projects**, use a
  configured project's inline Sync button, or right-click a project for the
  project menu.

The Home quick actions are **Sync all**, **Scaffold project**, **Check sync** and
**Refresh projects**. The scaffold flow prompts for project type (single
project, monorepo root, or a monorepo workspace into an existing root), name,
npm scope, config-file inclusion, and the destination (a target directory, or a
monorepo root + relative workspace directory). **Check sync** reports whether the
tracked outputs are up to date and offers to run a sync or reveal the output
channel.

## Project menu

Every project card (and every project in the **Projects** tree) exposes the same
actions, scoped to that project:

- **Sync** / **Check sync** — regenerate / verify the project's managed files.
- **Generate config** — write a `dbx.config.ts` for the project.
- **Run workflow…** — trigger one or more of the project's generated GitHub
  workflows (`gh workflow run`).
- **Reset tooling…** — remove the generated files + manifest, or everything
  including the config.
- **Go to project** — reveal the project in the Explorer.

## Loop prevention

Auto-sync watches input files only: `dbx.config.*`, `tsconfig.default.json`, and `tsconfig.monorepo.json`. Generated outputs are not watched. The scheduler debounces bursts, allows only one sync at a time, queues at most one follow-up, and suppresses events briefly after a run.

The CLI is resolved from the workspace's local `@deltabox/toolchain` install,
falling back to `npx @deltabox/toolchain`.

## Settings

| Setting                       | Default                  | Description                      |
| ----------------------------- | ------------------------ | -------------------------------- |
| `deltabox.toolchain.enabled`  | `true`                   | Auto-sync on watched changes.    |
| `deltabox.toolchain.debounce` | `300`                    | Debounce (ms).                   |
| `deltabox.toolchain.command`  | `sync`                   | Command used for auto-sync.      |
| `deltabox.toolchain.watch`    | config + tsconfig inputs | Input globs that trigger a sync. |

## Command Palette

Search for `deltabox:` to find **Sync active project**, **Sync selected projects**, **Sync all projects**, **Check sync**, **Scaffold project…**, **Generate configs…**, **Run workflow…**, **Reset tooling…**, **Refresh projects**, and **Toggle auto-sync**.
