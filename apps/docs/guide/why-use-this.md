# Why use this?

`@deltabox/toolchain` is a config-driven layer around [Vite+](https://viteplus.dev).
It exists to remove the glue work that appears once a project grows beyond a
single package: the same settings spread across a dozen files, generated files
that drift, and release chores that are easy to get wrong.

You describe the project once, and the toolchain keeps the rest in sync.

The open-source [`dbx` toolchain repository](https://github.com/deltabox-studio/toolchain)
uses the toolchain itself to maintain its development: sync, config generation,
`tsconfig` management, changelog/release automation and the docs site are all
driven by the same setup described here. That dogfooding keeps the workflow
honest.

## The problems it removes

### Configuration sprawl

A typical TypeScript project ends up with separate configs for Vite, Vitest,
TypeScript, formatting, linting, CI, changelog automation, editor settings and
Docker. They overlap, disagree, and are updated at different times.

With dbx, those settings live in one `dbx.config.*` (or inline in the `dbx()`
Vite plugin). Each section is opt-in, so you only own the parts you use.

### Monorepo drift

Hand-maintained `tsconfig` references, path aliases, workspace dependency
ranges, catalogs, scripts and managed files are routine sources of breakage.
One package gets a new alias, another keeps an old `tsconfig`, CI starts
failing.

The project graph, `tsconfig` generation and `dbx sync --check` keep those
artifacts consistent and make drift visible before it lands.

### Local and CI differences

"Works on my machine" usually means a different formatter version, a missing
commit hook, stale generated files or a release step that only runs locally.

The toolchain uses it's commands in generated files and hooks locally
and in CI, with `sync --check` as a single verification gate.
For Vite+ projects it passes through Vite+ commands.

### Release and CI glue

Changelog formatting, version bumps, release notes, issue and PR links,
Dependabot updates and workflow maintenance are recurring work that has little
to do with the product.

dbx generates the workflows and the changelog pipeline from the same config, so
releases stay repeatable and the release notes stay readable.

### Inconsistent scaffolding

Every new package starts from a different copy of "the right setup", and the
copy slowly diverges.

Builtin templates and generators produce a consistent project shape, including
Vite+, Oxc, `tsconfig`, CI, catalogs and Docker when requested.

### Toolchain version skew

Keeping `vite`, `vitest`, `tsdown`, Oxfmt and Oxlint aligned across a repo is
its own maintenance task. Vite+ already bundles them; dbx leans on that single
toolchain instead of installing each tool separately.

## What you get

- **One config, opt-in sections.** `project`, `ci`, `tsconfig`, `templates`,
  `fmt`/`lint`, `vite`, `watch`, `logger`, `providers` and more.
- **Sync with drift detection.** `dbx sync` writes managed files; `dbx sync
  --check` fails when they are stale.
- **A Vite+ integration.** The `dbx()` plugin carries the config inline and
  adds fmt/lint, tasks, hooks and passthrough commands.
- **A config generator.** Turn schemas into env docs, TypeScript types, JSON
  Schema and typed CLI options.
- **Project-aware tooling.** Workspace graph, tsconfig refs/aliases, catalogs
  and per-package releases.
- **Scaffolds and templates.** Consistent projects, workspaces, built-in & custom
  libraries, server templates and Vite apps.
- **Automated maintenance.** CI, changelog, releases, issues and Dependabot
  workflows.
- **Editor and agent integration.** A VS Code extension and an MCP server for
  the same APIs.

## Core features

### VS Code extension

The extension turns the same project model into a UI: browse managed files and
the project graph, run sync and migrations, scaffold projects, open provider
commands and inspect what the toolchain manages. It reads provider and project
data from the CLI, so it stays aligned with the terminal workflow instead of
being a separate configuration surface. See the
[VS Code extension guide](/guide/vscode).

### Config generator and engine

The config engine is a schema-first way to describe configuration once and
derive the surrounding artifacts from it. It generates TypeScript types, env
docs, JSON Schema and typed CLI options/programs, and provides file/env/CLI
loaders with predictable precedence. Teams that ship a config format can reuse
that machinery instead of hand-writing each output. See the
[Config generator guide](/guide/config-generator/).

### Providers

Providers describe the external toolchains a project can use, starting with
Vite+. The CLI and the VS Code extension consume the same provider descriptors,
so commands, availability and metadata do not drift between the terminal and
the editor.

Providers are not limited to JavaScript. A descriptor can wrap any CLI binary,
so the same surface can expose Python (`uv`, `ruff`, `pytest`), C#/.NET
(`dotnet`), Java (Maven or Gradle), Rust (`cargo`), Go and other language
toolchains. A polyglot repo can use `dbx python:*`, `dbx rust:*`, `dbx dotnet:*`
and the rest without teaching the terminal, CI and editor a different command
set for every language. See [Providers](/guide/providers#other-language-toolchains).

### MCP

The MCP server exposes the public toolchain APIs to AI agents and editors. You
can install it for Claude, Codex, VS Code, OpenCode, Pi or a custom directory,
then let an agent inspect projects, configs and generated files through the same
commands and types a developer uses. See [MCP](/guide/mcp).

## Who it is for

It is most useful when at least one of these is true:

- you maintain a monorepo or several related packages;
- you want one place for toolchain, CI and release configuration;
- you use Vite or Vite+ and want a consistent project workflow;
- you define schemas or config formats and want types, docs, JSON Schema and
  typed CLI options generated from them;
- you maintain many environment variables and want documented, typed config
  with file/env/CLI precedence;
- you want one consistent CLI and task surface for scripts, tasks and provider
  toolchains;
- you build a library or internal tool that needs its own typed config and CLI
  without rebuilding loaders, validation and help;
- you work across languages and want Python, .NET, Java, Rust and other tools
  exposed through the same command surface;
- you scaffold projects or packages regularly;
- you work in VS Code or with AI agents and want them to understand the same
  project model;
- you are tired of generated files and release chores drifting.

## When it might not fit

A tiny single-file project rarely needs the full surface. A team with a very
bespoke pipeline may prefer to keep it in-house. Because every section is
opt-in, you can also start with only `project` and `tsconfig`, then add
automation later.

The toolchain is a dev dependency. It does not replace Vite+ at runtime; it
makes the project around Vite+ easier to keep consistent.

## Where to go next

- [Getting started](/guide/) — install the CLI and create a config.
- [Monorepo guide](/guide/monorepo) — project graph, `tsconfig` and tasks.
- [Vite+](/guide/vite) — plugin mode, config mode and local CLI usage.
- [Package scripts](/guide/scripts) — the recommended `fmt`, `check`, `test`
  and `sync` scripts.
