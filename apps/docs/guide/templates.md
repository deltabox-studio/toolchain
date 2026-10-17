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

```bash
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

| id            | Kind          | Description                                            |
| ------------- | ------------- | ------------------------------------------------------ |
| `project`     | `project`     | A single-package TypeScript project.                   |
| `application` | `application` | A runnable application package.                        |
| `folder`      | `folder`      | A bare folder (a README).                              |
| `monorepo`    | `project`     | A monorepo root + one example workspace.               |
| `workspace`   | `workspace`   | A workspace package into an existing monorepo.         |
| `vite-plus`   | `project`     | Create through `vp create` (interactive or templated). |

## Local templates

A local template is a directory with a `template.json`. Turn any folder into one
with `template:init` (and register it in one step with `--add`):

```bash
dbx template:init ./templates/acme-service \
  --kind application --name "Acme service" --var name --tag service --add
```

```json
{
    "name": "Acme service",
    "description": "A service package",
    "kind": "application",
    "tags": ["service"],
    "variables": [{ "name": "name", "default": "service" }],
    "ignore": ["fixtures"]
}
```

Files and directory names may contain `{{ token }}` placeholders, resolved while
copying:

```
src/{{name}}.ts   ->   src/acme.ts
```

Register sources so they are picked up automatically:

```bash
dbx template:add ./templates             # local dir (auto-inits if needed)
dbx template:add @acme/create            # npm @scope/create
dbx template:add git:https://github.com/acme/tpl.git
dbx template:remove local:./templates    # drop a source
```

`template:add` records them in `.dbx/toolchain/templates.json`; `template:remove`
takes an id or a `type:locate` key. Sources can also be declared in the config:

```ts
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
then `create`; **Add template…** runs `template:init --add` on a folder you pick;
and **Remove template…** runs `template:list --registry` then `template:remove`.
