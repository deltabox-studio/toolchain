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

The activity-bar container has five views:

- **Home** — a dashboard: a last-sync line, status, quick actions, an expandable
  **All actions** list, and a card per project (root first). Configured projects
  show a per-project Sync button, a last-sync line and a `⋮` menu; projects
  without a config show a "no config" badge.
- **Providers** — the registered providers (`dbx providers --json`) with their
  commands nested underneath. The title bar has **Add provider...**; a provider's
  context menu runs a command (**Run command...**), opens its homepage, copies its
  id, and — for a provider you added — **Remove provider**. A command runs as
  `dbx <command.name>` in a terminal.
- **Projects** — workspace-root groups with every package nested underneath
  (root first). Select one or more and run **Sync selected projects**, use a
  configured project's inline Sync button, or right-click a project for its menu.
- **Templates** — the available templates (`dbx template:list --json`). The title
  bar has **Add template...** / **Remove template source...** / **Refresh**; a
  template's context menu creates a project from it, shows its info, or copies its
  id.
- **Files** — every generated/managed file, grouped per project (read from each
  project's `.dbx/toolchain/manifest.json`); click a file to open it.

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
| Add provider...              | Register a custom provider in `.dbx/toolchain/providers.json`.   |
| Run command...               | Run a provider command (`dbx <command>`) in a terminal.          |
| Create from template...      | `dbx create --template <id>` (terminal for online templates).    |
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

## Providers, templates and Vite+ in the editor

The **Providers** and **Templates** views read `dbx providers --json` and
`dbx template:list --json`, so adding one surfaces it in the UI automatically.
**Add provider...** writes a custom provider to `.dbx/toolchain/providers.json`,
which `toolchainProviders()` merges with the built-ins — so a registered
provider's commands also become `dbx` commands (`dbx <command>`), runnable from
the view. **Add template...** runs `template:init --add` and **Remove template
source...** runs `template:list --registry` + `template:remove`.

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
**Add template…**, **Remove template…**, **Add provider...**, **Refresh
providers**, **Add template...**, **Remove template source...**, **Refresh
templates**, **Generate configs…**, **Run workflow…**, **Run Vite+ command…**,
**Create Vite+ project…**, **Reset tooling…**, **Refresh projects** and
**Toggle auto-sync**.
