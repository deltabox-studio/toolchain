# Templates

Templates scaffold projects, workspaces, applications, folders, tooling or
pipelines. They can be **offline** (builtin, or a local `template.json`
directory) or **online** (npm `@scope/create` manifests, git repos, and Vite+
templates).

## Kinds

Every template declares a `kind`, used by `template:list --kind` and
`create --kind`:

| Kind          | Produces                               |
| ------------- | -------------------------------------- |
| `project`     | A single-package project.              |
| `workspace`   | A package inside an existing monorepo. |
| `application` | A runnable application package.        |
| `folder`      | A bare folder of files.                |
| `tooling`     | Toolchain config/pipeline files.       |
| `pipeline`    | A CI/pipeline template.                |

## List + create

```sh
dbx template:list
dbx template:list --kind application   # filter by kind
dbx template:list --online             # also resolve npm/git sources
dbx template:list --registry           # only the .dbx/toolchain sources
dbx template:list --json               # machine-readable (used by the editor)

dbx create --template project --name my-app --out ./my-app
dbx create --kind folder --name scratch --out ./scratch
dbx create --template mytpl --name acme --var port=4000
```

With no `--template`, `create --kind <kind>` picks the first matching template.
An unlisted `--template` id is treated as a Vite+ template (`vp create <id>`).
On an interactive terminal, a bare `dbx create` (no `--template`/`--kind`/`--name`)
prompts for the template, name and scope instead (Ctrl-C cancels).

## Builtin templates

| id                      | Kind          | Description                                    |
| ----------------------- | ------------- | ---------------------------------------------- |
| `project`               | `project`     | A single-package TypeScript project.           |
| `application`           | `application` | A runnable application package.                |
| `folder`                | `folder`      | A bare folder (a README).                      |
| `monorepo`              | `project`     | A monorepo root (no example workspace).        |
| `monorepo-example`      | `project`     | A monorepo root + one example workspace.       |
| `workspace`             | `workspace`   | A workspace package into an existing monorepo. |
| `vite-plus`             | `project`     | `vp create` (interactive or templated).        |
| `vite-plus-monorepo`    | `project`     | `vp create vite:monorepo`.                     |
| `vite-plus-application` | `application` | `vp create vite:application`.                  |
| `vite-plus-library`     | `project`     | `vp create vite:library`.                      |
| `vite-plus-generator`   | `project`     | `vp create vite:generator` (monorepo only).    |

The offline builtins (`project`, `application`, `folder`, `monorepo`,
`monorepo-example`, `workspace`) scaffold a generic, current project: a
`dbx.config.ts` with only `project` metadata, a `package.json` that depends on
`@deltabox/toolchain`, and no Turbo (Vite Task replaces it). They ask for a
**package manager** (default `yarn`) and write that manager's catalog file (see
[Catalogs](/guide/project#package-manager-and-catalogs)). The `vite-plus*` builtins
delegate to `vp create` and need network access.

## Inputs (variables)

A template can declare **inputs** — values prompted for (and substituted) when it
is scaffolded. Declare them in `template.json`:

```json [template.json]
{
    "variables": [
        { "name": "name", "prompt": "Project name", "default": "app", "required": true },
        { "name": "port", "prompt": "Dev port", "default": "4000" },
        { "name": "includeDocker", "prompt": "Include a Dockerfile?", "options": ["yes", "no"] }
    ]
}
```

- `name` — the token name (also `{{ name }}` in files).
- `prompt` — the prompt text (defaults to the name).
- `default` — the value used when nothing is entered.
- `options` — a fixed list of choices: the value is picked from a select.
- `required` — whether a value must be provided.

Files and directory names may contain `{{ token }}` placeholders, resolved while
copying:

```
src/{{name}}.ts   ->   src/acme.ts
```

The **same input pipeline** runs everywhere:

- **CLI** — `dbx create` prompts for each input on an interactive terminal (the
  standard `name`/`scope` first, then the template's own inputs). Pass
  `--var key=value` (repeatable) to skip a prompt.
- **Programmatic API** — `scaffoldTemplate(template, { cwd, tokens, variables })`.
- **VS Code** — **Create from template…** prompts for each input (a quick pick
  when `options` is set).

The builtin templates use the same pipeline (they declare `name`, `scope`,
`packageManager` and `includeConfig` inputs).

## Actions

After the files are written, a template can run **actions** — extra steps such as
installing dependencies. Declare them in `template.json`:

```json [template.json]
{
    "actions": [
        { "id": "install", "prompt": "Install dependencies?", "builtin": "install" },
        { "id": "setup", "prompt": "Run the setup script?", "module": "action.mjs" },
        { "id": "post", "command": "node scripts/post-scaffold.mjs" }
    ]
}
```

- `id` — the action id (also the `--action <id>` key).
- `prompt` — the prompt text (defaults to `Run <id>?`).
- `default` — whether it runs by default (**default false** — opt-in).
- `builtin` — a built-in action. `install` runs `<packageManager> install` in the
  output directory.
- `module` — a JS module (relative to the template directory) whose default
  export is `async (ctx) => void`. The module is **not** copied to the output.
  The context is `{ cwd, templateDir, tokens, variables, packageManager, log }`.
- `command` — a shell command run in the output directory.

Actions run through the same pipeline everywhere: the CLI prompts (or takes
`--action <id>`, repeatable), the extension prompts, and the programmatic API
passes `actions: string[]` to `scaffoldTemplate`. The builtin templates declare
an opt-in **Install dependencies?** action (`builtin: 'install'`, off by
default).

## Local templates

A local template is a directory with a `template.json`. Turn any folder into one
with `template:init` (and register it in one step with `--add`):

```sh
dbx template:init ./templates/acme-service \
  --kind application --name "Acme service" --var name --tag service --add
```

```json [template.json]
{
    "name": "Acme service",
    "description": "A service package",
    "kind": "application",
    "tags": ["service"],
    "variables": [{ "name": "name", "default": "service" }],
    "ignore": ["fixtures"]
}
```

Register sources so they are picked up automatically:

```sh
dbx template:add ./templates             # local dir (auto-inits if needed)
dbx template:add @acme/create            # npm @scope/create
dbx template:add git:https://github.com/acme/tpl.git
dbx template:remove local:./templates    # drop a source
```

`template:add` records them in `.dbx/toolchain/templates.json`; `template:remove`
takes an id or a `type:locate` key. Sources can also be declared in the config:

```ts [dbx.config.ts]
export default defineConfig({
    toolchain: {
        templates: {
            sources: [
                { type: 'local', locate: './templates', kind: 'application' },
                { type: 'npm', locate: '@acme/create', online: true },
            ],
        },
    },
});
```

## Global templates

A template registered with `template:init --add` or `template:add` is **also**
stored in the global registry at `~/.dbx/toolchain/.registry/templates`, so it is
available in every project (and in the VS Code extension). Pass `--no-global` to
keep it project-only:

```sh
dbx template:init ./templates/acme --kind application --name "Acme" --add  # local + global
dbx template:add ./templates --no-global                                  # project only
```

Global templates are merged with the project's own; a project template wins on an
id clash. The global search paths default to
`~/.dbx/toolchain/.registry/templates`, and each path may be a directory or an
`http(s)` **remote registry** (a JSON `{ "sources": [...] }` or an array of
sources):

```sh
dbx template:registry                         # list the resolved paths
dbx template:registry --add ~/shared/templates --add https://acme.dev/templates.json
dbx template:registry --set ~/shared/templates
dbx template:registry --remove ~/shared/templates
dbx template:registry --clear                 # reset to the default
```

The paths live in the CLI config `~/.dbx/toolchain/cli/config.json`
(`templatesSearchPaths`, a string or array) and are kept in sync with the VS Code
setting `deltabox.templatesSearchPaths`: the extension records the VS Code user
dir in that config and mirrors setting changes into it, and the CLI writes the
setting back when you change the paths. `vscodeDir` in the CLI config points at
the VS Code user directory (the one containing `settings.json`).

## Online templates

- **npm** — a published `@scope/create` package whose `package.json` has a
  `createConfig.templates` (or `dbx.templates`) manifest. Individual templates
  are listed and created through `vp create`.
- **git** — a repository (optionally with a `subdir`) listed as a template and
  created through `vp create`.
- **Vite+** — set `create.defaultTemplate` in the `vite` section (the full Vite+
  config) to make a scope the default for `vp create`.

## VS Code

The extension drives the same CLI: **From template…** runs `template:list --json`
then `create`; **Add template…** runs `template:init --add` on a folder you pick
and asks whether to add it to the **global** registry (yes by default);
**Remove template…** runs `template:list --registry` then `template:remove`. The
`deltabox.templatesSearchPaths` setting controls the global search paths (see
[Global templates](#global-templates)).
