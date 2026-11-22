---
title: Environment variables
outline: [2, 3]
---

# Environment variables

The toolchain config is file/CLI backed; a schema leaf opts into an
environment variable with `.meta({ envName: "..." })` (see the
[Config Generator](/guide/config-generator/describe-a-scope)).

| Variable                            | Scope     | Default | Description                                                                                                                                                                                |
| ----------------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DBX_PROJECT_REGENERATE`            | toolchain | —       | Regenerate this section's managed files during `dbx sync`. When false, existing files are left untouched and are neither written nor drift-checked.                                        |
| `DBX_PROJECT_NAME`                  | toolchain | —       | The unscoped project name (written as `&lt;scope&gt;/&lt;name&gt;`).                                                                                                                       |
| `DBX_PROJECT_SCOPE`                 | toolchain | —       | The npm scope, eg. `@org`.                                                                                                                                                                 |
| `DBX_PROJECT_AUTHOR`                | toolchain | —       | Package author (`package.json` `author`).                                                                                                                                                  |
| `DBX_PROJECT_LICENSE`               | toolchain | —       | SPDX license id (`package.json` `license`).                                                                                                                                                |
| `DBX_PROJECT_HOMEPAGE`              | toolchain | —       | Project homepage (`package.json` `homepage`).                                                                                                                                              |
| `DBX_PROJECT_REPO`                  | toolchain | —       | Repository URL (`package.json` `repository`). For a workspace it also resolves to the workspace path (`repository.directory`).                                                             |
| `DBX_PROJECT_NODEVERSION`           | toolchain | —       | Node version for CI/templates, eg. `22` (not `package.json` `engines`).                                                                                                                    |
| `DBX_PROJECT_PACKAGEMANAGER`        | toolchain | `yarn`  | Package manager name, written as `&lt;name&gt;@&lt;version&gt;`.                                                                                                                           |
| `DBX_PROJECT_PACKAGEMANAGERVERSION` | toolchain | —       | Package manager version, eg. `4.17.1`.                                                                                                                                                     |
| `DBX_PROJECT_DESCRIPTION`           | toolchain | —       | One-line description (`package.json` `description`).                                                                                                                                       |
| `DBX_PROJECT_INHERIT`               | toolchain | `true`  | Inherit the parent project metadata. Set false to keep this project metadata independent of the root config (other sections still merge normally).                                         |
| `DBX_PROJECT_MANAGECONFIGLESS`      | toolchain | `false` | Manage projects that have no dbx.config.* of their own by inheriting the nearest ancestor config. Disabled by default so configless projects are never touched unless explicitly opted in. |
| `DBX_CI`                            | toolchain | `{}`    | GitHub Actions workflows to generate (CI, release, issues, changelog, sync).                                                                                                               |
| `DBX_CHANGELOG`                     | toolchain | `{}`    | Manual changelog pipeline options for `dbx changelog`, the VS Code actions and the API. `ci.changelog` inherits these options.                                                             |
| `DBX_FMT`                           | toolchain | `{}`    | Formatter configuration: Oxc/Biome options, editor defaults and tools.                                                                                                                     |
| `DBX_LINT`                          | toolchain | `{}`    | Linter configuration: Oxc/Biome/ESLint options and editor defaults.                                                                                                                        |
| `DBX_BIOME`                         | toolchain | `{}`    | Biome config generation (for consumers that still want a `biome.json`).                                                                                                                    |
| `DBX_TSCONFIG`                      | toolchain | `{}`    | Workspace tsconfig generation (path aliases + project references).                                                                                                                         |
| `DBX_LOADER`                        | toolchain | `{}`    | How `dbx.config.*` files are imported (tsconfig discovery).                                                                                                                                |
| `DBX_TEMPLATES`                     | toolchain | `{}`    | Template sources / scaffolding.                                                                                                                                                            |
| `DBX_REGISTRY`                      | toolchain | `{}`    | Allow/deny host and path globs for template/provider registries.                                                                                                                           |
| `DBX_CATALOGS`                      | toolchain | `{}`    | Package catalogs written to the package manager catalog file (`catalog:`).                                                                                                                 |
| `DBX_VITE`                          | toolchain | `{}`    | The full Vite+ config; `dbx sync` writes the root `vite.config.ts` from it.                                                                                                                |
| `DBX_WATCH`                         | toolchain | `{}`    | Watch behaviour for `dbx watch`.                                                                                                                                                           |
| `DBX_SYNC`                          | toolchain | `{}`    | `dbx sync` behaviour (formatting of the generated managed files).                                                                                                                          |
| `DBX_LOGGER`                        | toolchain | `{}`    | Logging level, colours and prefix for toolchain output.                                                                                                                                    |
| `DBX_PROVIDERS`                     | toolchain | `{}`    | Provider command behaviour (eg. colour for the passthrough commands).                                                                                                                      |
| `DBX_MCP`                           | toolchain | `{}`    | Install the official dbx skill (and MCP helpers) into AI agent harnesses.                                                                                                                  |
