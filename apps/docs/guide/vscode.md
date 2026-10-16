# VS Code Extension

The `deltabox toolchain` extension drives everything through the resolved local
CLI.

It never imports the toolchain packages at build time, so it stays in sync
with whatever `@deltabox/toolchain` version a project has installed.

<div align="center">
  <img src="/vscode-screenshot.png" width="300" />
</div>

## Install

A VS Code extension is available for `deltabox toolchain`. Follow the steps
below to use it. It will be published to the Marketplace in the future.

1. Download `deltabox-toolchain.vsix` from [releases](https://github.com/deltabox-studio/toolchain/releases).
2. In VS Code, install it by going to the Extensions sidebar panel, clicking the
   three dotted menu on the panel header and selecting **Install from VSIX…**.
3. A screwdriver icon appears in the activity bar, and the commands are also in
   the command palette (`Ctrl`+`P` → `deltabox:`):
    1. Sync / Check sync / Scaffold project, From template…
    2. Run Vite+ command…
    3. Create Vite+ project…

To build the VSIX from a checkout instead:

```bash
yarn workspace toolchain-vscode package:vsix
code --install-extension packages/vscode/deltabox-toolchain.vsix
```

The CLI is resolved from the workspace's local `@deltabox/toolchain` install,
falling back to `npx @deltabox/toolchain`.

## Views

The activity-bar container has three views:

- **Home** — a dashboard: a last-sync line, status, quick actions, an expandable
  **All actions** list, and a card per project (root first). Configured projects
  show a per-project Sync button, a last-sync line and a `⋮` menu; projects
  without a config show a "no config" badge.
- **Files** — every generated/managed file, grouped per project (read from each
  project's `.dbx/toolchain/manifest.json`); click a file to open it.
- **Projects** — workspace-root groups with every package nested underneath
  (root first). Select one or more and run **Sync selected projects**, use a
  configured project's inline Sync button, or right-click a project for its menu.

The Home quick actions are **Sync all**, **Scaffold project**, **Run Vite+…**,
**Add template…**, **Check sync** and **Refresh projects**.

## Commands

| Command                      | What it does                                                     |
| ---------------------------- | ---------------------------------------------------------------- |
| Sync all / active / selected | Run `dbx sync` (`--recursive` / per project).                    |
| Check sync                   | `sync --check` across the workspace.                             |
| Scaffold project             | Single project, monorepo root, workspace, or **From template…**. |
| Add template…                | `template:init --add` on a folder you pick (any kind).           |
| Remove template…             | `template:list --registry` then `template:remove`.               |
| Generate configs             | `project:config` for projects missing a config.                  |
| Run workflow                 | Trigger generated GitHub workflows.                              |
| Run Vite+ command…           | QuickPick over the Vite+ provider commands, run in a terminal.   |
| Create Vite+ project…        | `vp create` in a terminal.                                       |
| Reset tooling                | Remove generated files / manifest / config.                      |
| Toggle auto-sync             | Enable/disable sync-on-change.                                   |

Interactive commands (the dev server, `vp create`, online scaffolding) run in an
integrated terminal at the project root; everything else runs in the output
channel.

## Project menu

Every project card (and every project in the **Projects** tree) exposes the same
actions, scoped to that project:

- **Sync** / **Check sync** — regenerate / verify the project's managed files.
- **Generate config** — write a `dbx.config.ts`.
- **Run workflow…** — trigger one of the project's generated GitHub workflows.
- **Run Vite+ command…** — run a `vp` command in that project.
- **Reset tooling…** — remove the generated files + manifest, or everything
  including the config.
- **Go to project** — reveal the project in the Explorer.

## Templates, Vite+ and providers in the editor

The extension reads `dbx providers --json` for the **Run Vite+
command…** menu and `dbx template:list --json` for **From template…**;
**Add template…** runs `template:init --add` and **Remove template…** runs
`template:list --registry` + `template:remove`. Adding a provider or a template
surfaces it in the UI automatically.

## Loop prevention

Auto-sync watches input files only: `dbx.config.*`,
`tsconfig.default.json`, and `tsconfig.monorepo.json`. Generated outputs are
never watched. The scheduler debounces bursts, allows one sync at a time, queues
at most one follow-up, and suppresses events briefly after a run.

## Settings

| Setting                       | Default                 | Description                   |
| ----------------------------- | ----------------------- | ----------------------------- |
| `deltabox.toolchain.enabled`  | `true`                  | Auto sync on watched changes. |
| `deltabox.toolchain.debounce` | `300`                   | Debounce (ms) before a sync.  |
| `deltabox.toolchain.command`  | `sync`                  | The command to run on change. |
| `deltabox.toolchain.watch`    | config + tsconfig globs | Inputs that trigger a sync.   |

## Command palette

Search for `deltabox:` to find **Sync active project**, **Sync selected
projects**, **Sync all projects**, **Check sync**, **Scaffold project…**,
**Add template…**, **Remove template…**, **Generate configs…**, **Run
workflow…**, **Run Vite+ command…**, **Create Vite+ project…**, **Reset
tooling…**, **Refresh projects** and **Toggle auto-sync**.
