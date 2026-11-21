# Template and registry structures

These trees are rendered with
[`vitepress-plugin-folder-tree`](https://github.com/s00d/vitepress-plugin-folder-tree).
They show the files each builtin template produces and how the Vite+ provider
templates, custom templates, providers and registries are laid out.

> The package-manager catalog file depends on the chosen manager: `.yarnrc.yml`
> for Yarn, `pnpm-workspace.yaml` for pnpm, and `.npmrc`/`package.json` fields
> for npm or Bun. The trees below show Yarn.

## Offline project templates

### `project`

```tree
- name: acme
  description: project
  children:
    - name: vite.config.ts
      description: Vite+ plugin + Oxc defaults
    - name: package.json
    - name: src
      children:
        - index.ts
    - name: tests
      children:
        - index.test.ts
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
      description: catalog
```

### `application`

```tree
- name: acme
  description: application
  children:
    - name: vite.config.ts
      description: Vite+ plugin + Oxc defaults
    - name: package.json
    - name: index.html
      highlight: true
    - name: src
      children:
        - name: main.ts
          highlight: true
        - name: index.ts
    - name: tests
      children:
        - index.test.ts
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
      description: catalog
```

### `folder`

```tree
- name: scratch
  description: folder
  children:
    - name: README.md
```

### `monorepo`

```tree
- name: acme
  description: monorepo root
  children:
    - name: vite.config.ts
      description: Vite+ plugin + Oxc defaults
    - name: package.json
      description: workspaces + run scripts
    - name: tsconfig.base.json
    - name: tsconfig.workspaces.json
      description: root paths + references
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
      description: catalog
```

### `monorepo-example`

```tree
- name: acme
  description: monorepo + example workspace
  children:
    - name: vite.config.ts
    - name: package.json
    - name: tsconfig.base.json
    - name: tsconfig.workspaces.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: packages
      children:
        - name: core
          highlight: true
          children:
            - vite.config.ts
            - package.json
            - name: src
              children:
                - index.ts
            - name: tests
              children:
                - index.test.ts
            - tsconfig.default.json
            - tsconfig.build.json
            - tsconfig.json
```

### `workspace`

`dbx create --template workspace --name core` writes the workspace package into
the nearest workspace directory (here `packages/core`).

```tree
- name: packages
  children:
    - name: core
      description: workspace package
      children:
        - vite.config.ts
        - package.json
        - name: src
          children:
            - index.ts
        - name: tests
          children:
            - index.test.ts
        - tsconfig.default.json
        - tsconfig.build.json
        - tsconfig.json
```

## Quality-of-life builtins

These templates layer a working app over the `project`/`application` scaffold.
Highlighted files are the template-specific ones.

### `vitepress`

```tree
- name: acme
  description: VitePress docs
  children:
    - name: vite.config.ts
    - name: package.json
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: docs
      children:
        - name: index.md
          highlight: true
        - name: guide
          children:
            - name: getting-started.md
              highlight: true
        - name: .vitepress
          children:
            - name: config.ts
              highlight: true
    - name: tests
      children:
        - name: config.test.ts
          highlight: true
```

### `express`

```tree
- name: acme
  description: Express 5 API
  children:
    - name: vite.config.ts
    - name: package.json
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: app.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: app.test.ts
          highlight: true
```

### `bun`

```tree
- name: acme
  description: Bun HTTP server
  children:
    - name: vite.config.ts
    - name: package.json
    - name: tsconfig.base.json
    - name: tsconfig.default.json
      description: node + bun types
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: app.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: app.test.ts
          highlight: true
```

### `fastify`

```tree
- name: acme
  description: Fastify 5 API
  children:
    - name: vite.config.ts
    - name: package.json
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: app.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: app.test.ts
          highlight: true
```

### `orpc`

```tree
- name: acme
  description: oRPC + Zod API
  children:
    - name: vite.config.ts
    - name: package.json
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: planets.ts
          highlight: true
        - name: router.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: planets.test.ts
          highlight: true
```

### `file-server`

```tree
- name: acme
  description: dependency-free file server
  children:
    - name: vite.config.ts
    - name: package.json
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: public
      children:
        - index.html
          highlight: true
    - name: src
      children:
        - name: server.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: server.test.ts
          highlight: true
```

### `file-server-s3`

```tree
- name: acme
  description: AWS S3 file server
  children:
    - name: vite.config.ts
    - name: package.json
    - name: .env.example
      highlight: true
      description: S3_BUCKET / S3_REGION / credentials
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: server.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: server.test.ts
          highlight: true
```

### `file-server-bun-s3`

```tree
- name: acme
  description: Bun S3 file server
  children:
    - name: vite.config.ts
    - name: package.json
    - name: .env.example
      highlight: true
    - name: tsconfig.base.json
    - name: tsconfig.default.json
      description: node + bun types
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: app.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: app.test.ts
          highlight: true
```

### `file-server-minio`

```tree
- name: acme
  description: MinIO / S3-compatible file server
  children:
    - name: vite.config.ts
    - name: package.json
    - name: .env.example
      highlight: true
      description: local MinIO defaults
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: server.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: server.test.ts
          highlight: true
```

### `file-server-rclone`

```tree
- name: acme
  description: rclone-backed file server
  children:
    - name: vite.config.ts
    - name: package.json
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: server.ts
          highlight: true
        - name: index.ts
          highlight: true
    - name: tests
      children:
        - name: server.test.ts
          highlight: true
```

### `ollama-chat`

```tree
- name: acme
  description: Ollama chat UI
  children:
    - name: vite.config.ts
    - name: package.json
    - name: index.html
      highlight: true
    - name: tsconfig.base.json
    - name: tsconfig.default.json
    - name: tsconfig.build.json
    - name: tsconfig.json
    - name: .gitignore
    - name: README.md
    - name: .yarnrc.yml
    - name: src
      children:
        - name: main.ts
          highlight: true
        - name: ollama.ts
          highlight: true
        - name: style.css
          highlight: true
    - name: tests
      children:
        - name: ollama.test.ts
          highlight: true
```

## Vite+ provider templates

These are delegated to `vp create`; the exact files can change between Vite+
versions. The trees below show the current built-in layouts.

### `vite-plus` (interactive)

`vite-plus` runs `vp create` with no fixed template id, so the tree is whichever
Vite+ template you pick interactively. Use one of the fixed entries below for a
stable shape.

### `vite-plus-monorepo` (`vite:monorepo`)

```tree
- name: acme
  description: Vite+ monorepo
  children:
    - name: package.json
    - name: pnpm-workspace.yaml
    - name: README.md
    - name: tsconfig.json
    - name: vite.config.ts
    - name: .gitignore
    - name: .yarnrc.yml
    - name: packages
      description: created by the workspace template
```

### `vite-plus-application` (`vite:application`)

```tree
- name: acme
  description: Vite+ application
  children:
    - name: .gitignore
    - name: index.html
    - name: package.json
    - name: public
    - name: src
      children:
        - name: main.ts
        - name: style.css
    - name: tsconfig.json
    - name: vite.config.ts
```

### `vite-plus-library` (`vite:library`)

```tree
- name: acme
  description: Vite+ library
  children:
    - name: .gitignore
    - name: README.md
    - name: package.json
    - name: src
      children:
        - name: index.ts
    - name: tsconfig.json
    - name: vite.config.ts
```

### `vite-plus-generator` (`vite:generator`)

Requires a Vite+ monorepo. The generator is placed in `generators/` or `tools/`
when such a parent exists and is registered in the root `create.templates`.

```tree
- name: generators
  children:
    - name: my-generator
      description: Vite+ Bingo generator
      children:
        - name: package.json
        - name: README.md
        - name: tsconfig.json
        - name: bin
          children:
            - name: index.ts
              description: runTemplateCLI entry
        - name: src
          children:
            - name: template.ts
              description: createTemplate + Zod options + produce()
```

## Custom templates

A local template is any directory with a `template.json`. Files and directory
names may use <code v-pre>{{ token }}</code> placeholders; actions can be builtin, a JS module or
a shell command.

```tree
- name: templates
  children:
    - name: acme-service
      description: custom template
      children:
        - name: template.json
          highlight: true
          description: inputs, actions, ignore
        - name: action.mjs
          description: optional module action (not copied)
        - name: README.md
        - name: src
          children:
            - name: "{{name}}.ts"
              highlight: true
              description: resolved while copying
```

Register it project-locally or globally:

```tree
- name: acme
  children:
    - name: .dbx
      children:
        - name: toolchain
          children:
            - name: registries.json
              description: project template/provider paths
    - name: templates
      children:
        - name: acme-service
          description: source registered above
```

## Custom providers

A provider registry is a JSON file (or a directory of `*.json` files, or an
`http(s)` URL). Project paths are searched before global paths.

```tree
- name: acme
  description: project
  children:
    - name: .dbx
      children:
        - name: toolchain
          children:
            - name: registries.json
            - name: .registry
              children:
                - name: providers
                  children:
                    - name: providers.json
                      highlight: true
                      description: provider descriptors
    - name: tools
      children:
        - name: echo-provider
          children:
            - name: index.mjs
              description: binary the provider forwards to
```

Typical `providers.json` content:

```json [.dbx/toolchain/.registry/providers/providers.json]
[
    {
        "id": "echo",
        "name": "Echo",
        "binary": "node",
        "commands": [
            {
                "name": "echo:version",
                "subcommand": "--version",
                "description": "Print the Node version"
            }
        ]
    }
]
```

## Registries

### Project registry

```tree
- name: acme
  children:
    - name: .dbx
      children:
        - name: toolchain
          children:
            - name: registries.json
              description: templates + providers arrays
            - name: .registry
              children:
                - name: templates
                  description: implicit local registry
                - name: providers
                  description: implicit local registry
```

### Global registry

```tree
- name: ~
  description: home
  children:
    - name: .dbx
      children:
        - name: toolchain
          children:
            - name: cli
              children:
                - name: config.json
                  description: registrySearchPaths + providerRegistrySearchPaths
            - name: .registry
              children:
                - name: templates
                - name: providers
```

### Remote registry

A remote registry is a JSON document with a `sources` array (or a bare array).
Each source is resolved by its own type (`local`, `npm`, `git`, `remote`).

```tree
- name: https://example.com
  children:
    - name: dbx-templates.json
      highlight: true
      description: "{ sources: [...] } or [...]"
```

### npm organization registry (Vite+)

Vite+ also accepts an `@org/create` package whose `package.json` declares
`createConfig.templates`:

```tree
- name: "@acme/create"
  children:
    - name: package.json
      highlight: true
      description: createConfig.templates
    - name: README.md
    - name: templates
      children:
        - name: web
          children:
            - package.json
            - src
        - name: library
          children:
            - package.json
            - src
```
