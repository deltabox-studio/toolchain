<div align="center">
  <img src="https://toolchain.deltabox.studio/logo/logo.png" width="150" />
</div>

# deltabox toolchain

Provides a sidebar for managing projects.

All-in-one development toolchain that let's you scaffold projects, generate and manage configs, tsconfigs, custom templates, syncing, changelogs, CI, Vite+, migrations, and more.

- **Save and use templates (local/remote)** so you never have to scaffold the same projects over and over again.
- **Generate** config types, env variables, cli flags, markdown and JSON schemas, so your codebase stays consistent, validated and well-documented.
- **Extend or setup** CI for your changelogs, releases, issues etc.
- **Sync** your entire project so workspaces, docs and CI are always up-to-date.
- **Plug it into Vite / Vite+** and streamline your DX for your existing Vite setup.

See the [list of features](https://github.com/deltabox-studio/toolchain#features).

See docs [here](https://toolchain.deltabox.studio/).

See all the [commands](#commands) below.

**Requirements:**

- Visual Studio Code version >= 1.85.0
- Node.js version >= 22.5.0

**Quick showcase:**

<div align="left">
  <video width="1342" controls>
    <source src="https://toolchain.deltabox.studio/vscode-example.mp4" type="video/mp4">
  </video>
</div>

<div align="left">
  <img src="https://toolchain.deltabox.studio/vscode-screenshot.png" width="300" />
</div>

## Commands

| Command                      | What it does                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Sync all / active / selected | Run `dbx sync` (`--recursive` / per project).                                           |
| Check sync                   | `sync --check` across the workspace.                                                    |
| Sync tsconfig                | Run `dbx sync --only tsconfig` (refresh aliases/references after builds).               |
| Manage tsconfig…             | Auto-wire the root workspaces tsconfig paths/references (`dbx tsconfig`).               |
| Scaffold project             | Single project, monorepo root (with/without example), workspace, or **From template…**. |
| Add template…                | `template:init --add` on a folder you pick; asks whether to register it globally.       |
| Remove template…             | `template:list --registry` then `template:remove`.                                      |
| Generate configs             | `project:config` for missing configs, or refresh the project graph only; picks TS/JS.   |
| Generate config              | Per-project `project:config` (also works from the Command Palette).                     |
| Migrate tooling…             | Migrate Biome/Prettier/Dprint/ESLint/Oxc/vite config to the toolchain (`dbx migrate`).  |
| Run workflow                 | Trigger generated workflows with their vendor CLI (`gh`/`glab`/`az`).                   |
| Run Vite+ command…           | QuickPick over the Vite+ provider commands, run in a terminal.                          |
| Create Vite+ project…        | `vp create` in a terminal.                                                              |
| Add provider...              | Register a custom provider (project or global registry).                                |
| Run command...               | Run a provider command (`dbx <command>`) in a terminal.                                 |
| Create from template...      | `dbx create --template <id>` (terminal for online templates).                           |
| Reset tooling                | Remove generated files / manifest / config.                                             |
| Toggle auto-sync             | Enable/disable sync-on-change.                                                          |

Interactive commands (the dev server, `vp create`, online scaffolding) run in an
integrated terminal at the project root; everything else runs in the output
channel.

## Project menu

Every project card (and every project in the **Projects** tree) exposes the same
actions, scoped to that project:

- **Sync** / **Check sync** — regenerate / verify the project's managed files.
- **Generate config** — write a `dbx.config.*` (TS/JS), or refresh only the project graph.
- **Run workflow…** — trigger one of the project's generated workflows. The picker
  lists every enabled workflow with its provider and path, and dispatches it
  through the matching vendor CLI (`gh`, `glab` or `az`).
- **Run Vite+ command…** — run a `vp` command in that project.
- **Reset tooling…** — remove the generated files + manifest, or everything
  including the config.
- **Go to project** — reveal the project in the Explorer.

## Providers, templates and Vite+ in the editor

The **Providers** and **Templates** views read `dbx providers --json` and `dbx template:list --json`, so adding one surfaces it in the UI automatically.

### Add provider...

Writes a custom provider to the default project registry (`.dbx/toolchain/.registry/providers/providers.json`) or the global
`~/.dbx/toolchain/.registry/providers/` when you choose the global scope, which
`toolchainProviders()` merges with the built-ins, so a registered provider's
commands also become `dbx` commands (`dbx <command>`), runnable from the view.

Provider search paths can also be added with the **Registries** view; the
`deltabox.providerRegistrySearchPaths` setting mirrors them globally.

### Add template...

Runs `template:init --add` and asks whether to add the template to the **global** registry (yes by default), so it is available in every
project.

See [Global templates](/guide/templates#global-templates).

The
`deltabox.registrySearchPaths` setting controls the global search paths and is
kept in sync with the CLI config.

### Remove template source...

Runs `template:list --registry` + `template:remove`.

The **Registries** view (below **Templates**) shows the detected provider and
template registries as **Providers** / **Templates** roots.

Each item has **Open registry** (the folder in the explorer, or the website for remote URLs), **Add new registry** and **Remove registry** (it only drops the path, keeping the files).

The title bar's **New registry…** / **Remove registry…** actions add or remove
search paths for either kind, asking whether they are global or project-scoped.

Remote registries are `http(s)` JSON registries: template registries accept
`{ sources }` or an array of sources; provider registries accept
`{ providers }` or an array of provider descriptors.

### Create from template...

Prompts for the template's inputs and actions (see
[Templates](/guide/templates)) before running `dbx create`. Scaffolding also asks
for a package manager (`yarn` default).

The Home view links to this documentation with **Need help? Go to documentation**.

## Auto-sync

Auto-sync watches input files only. The extension asks the CLI
(`dbx watch --list --json`) for the concrete, project-graph-resolved files:
every `dbx.config.*` plus each enabled project's `tsconfig.baseFile`,
`tsconfig.defaultFile` and the root `tsconfig.rootFile`. Custom file names are
honoured, nested configs can disable or override their own tsconfig section, and
the list is refreshed whenever a `dbx.config.*` changes (and after each sync).

The resolved patterns are workspace-relative and non-recursive by default, so
VS Code reuses its workspace watcher instead of installing extra recursive
watchers (which can hold `node_modules` handles during a package-manager link
step on Windows). Setting `deltabox.toolchain.watch` explicitly replaces the
resolved inputs; an empty list disables watching.

Generated outputs are never watched. The scheduler debounces bursts, allows one sync at a time, queues at most one follow-up, and suppresses events briefly after a run.

When a sync finds no workspace tsconfig files while `tsconfig.refs`/`tsconfig.composite` are on (or a `tsconfig.workspaces.json` is present), the extension surfaces the CLI's warning as a notification (once per session) with a **Show output** action.

When removing a section stops managing a file that dbx created, the sync
notification lists the removed relative paths and offers **Restore** (write the
previous content back) or **Close**. A file that existed before dbx first managed
it is **adopted**: it is unmanaged but never deleted.

The **Managed Files** view also shows a **Workflow conflicts** group for
hand-written workflows dbx left untouched (the manifest's `workflowConflicts`).
Each item names the config key to opt out with, and opens the existing file.

## Settings

| Setting                                              | Default         | Description                                                                                                |
| ---------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| `deltabox.toolchain.enabled`                         | `true`          | Auto sync on watched changes.                                                                              |
| `deltabox.toolchain.debounce`                        | `300`           | Debounce (ms) before a sync.                                                                               |
| `deltabox.toolchain.command`                         | `sync`          | The command to run on change.                                                                              |
| `deltabox.toolchain.enableFormatImportGroupDefaults` | `true`          | Add the resolved workspace `sortImports` custom group when syncing; set `false` to manage groups yourself. |
| `deltabox.toolchain.watch`                           | `[]` (resolved) | Inputs that trigger a sync (empty = resolved from the config).                                             |
| `deltabox.toolchain.version`                         | `""` (auto)     | Pin the `@deltabox/toolchain` version this workspace runs.                                                 |
| `deltabox.registrySearchPaths`                       | `[]`            | Template registry search paths (dirs or `http(s)` URLs).                                                   |
| `deltabox.providerRegistrySearchPaths`               | `[]`            | Provider registry search paths (JSON files/dirs/URLs).                                                     |

`deltabox.toolchain.enableFormatImportGroupDefaults` (default `true`) adds the
resolved `workspace` group to Oxfmt's `sortImports.customGroups` when the
extension syncs or generates configs. Set it to `false` in user or workspace
settings to keep full control of the import groups. The extension passes the
effective value to the CLI; direct CLI runs and Vite+ configs also honour the
workspace-scoped `.vscode/settings.json` value.

When a workspace has its own `@deltabox/toolchain` whose version differs from the
extension's bundled CLI, the extension asks which to run and shows both detected
versions. **Select dbx version…** pins a version in the project's
`.vscode/settings.json` (like TypeScript's version picker); it runs that version
via `npx` unless the project already installs it.

## Command palette

Search for `deltabox:` to find:

- **Sync active project**
- **Sync selected projects**
- **Sync all projects**
- **Check sync**
- **Sync tsconfig**
- **Manage tsconfig…**
- **Scaffold project…**
- **Add template…**
- **Remove template…**
- **Add provider...**
- **Refresh providers**
- **Add template...**
- **Remove template source...**
- **Refresh templates**
- **Generate configs…**
- **Migrate tooling…**
- **Run workflow…**
- **Run Vite+ command…**
- **Run command...**
- **Create Vite+ project…**
- **Choose dbx source…**
- **Reset tooling…**
- **Refresh projects**
- **Refresh tracked files**
- **Select dbx version…**
- **New registry…**
- **Remove registry…**
- **Toggle auto-sync**

## Development

Build the extension and the bundled `dbx` CLI:

```sh
yarn build:extension
```

Run the extension with **F5** (`Run deltabox toolchain extension`). The launch
configuration builds first, opens `test-fixtures/workspace`, and uses source
maps so breakpoints work in `src/`.

Run the VS Code integration tests (downloads a stable VS Code build on the first
run):

```sh
yarn test:integration
```

The tests live in `tests/integration` and are compiled to `out/test`. To debug them, install the [Extension Test Runner](https://marketplace.visualstudio.com/items?itemName=ms-vscode.extension-test-runner)
and use **Test: Debug All Tests**.

<div align="center">
  <img src="https://toolchain.deltabox.studio/logo/outline_colored.png" width="150" />
</div>
