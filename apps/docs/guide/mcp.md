# MCP (Model Context Protocol)

`@deltabox/toolchain` ships an MCP server that exposes the dbx APIs to AI
harnesses and editors. It is a dependency-free stdio server, so it works with
any MCP client and does not pull the MCP SDK into your project.

```sh
dbx mcp:serve
```

The server exposes one tool per public dbx capability:

| Tool                 | Runs                                                         |
| -------------------- | ------------------------------------------------------------ |
| `dbx_sync`           | `dbx sync` (with `check`, `recursive`, `configless`, `only`) |
| `dbx_projects`       | `dbx projects`                                               |
| `dbx_providers`      | `dbx providers`                                              |
| `dbx_templates`      | `dbx template:list`                                          |
| `dbx_template_info`  | `dbx template:info`                                          |
| `dbx_changelog`      | `dbx changelog`                                              |
| `dbx_migrate`        | `dbx migrate` (preview unless `write`)                       |
| `dbx_project_config` | `dbx project:config`                                         |
| `dbx_tsconfig`       | `dbx tsconfig`                                               |
| `dbx_workflow`       | `dbx workflow`                                               |
| `dbx_run`            | an allowlisted `dbx` command                                 |

Every tool runs the project's own resolved `dbx` binary, so the MCP surface
always matches the CLI version the project pins. Plugin-mode projects work
without a `dbx.config.*` (the server reads the `dbx()` Vite plugin options).

## Install

```sh
dbx mcp:install --provider claude
dbx mcp:install --provider vscode --scope global
dbx mcp:install --provider custom --dir ./tools/mcp
```

`dbx mcp:list` prints the builtin providers and the exact files each one writes:

| Provider   | Project config       | Skill / instructions                            |
| ---------- | -------------------- | ----------------------------------------------- |
| `claude`   | `.mcp.json`          | `.claude/skills/deltabox/SKILL.md`              |
| `codex`    | `.codex/config.toml` | `.codex/skills/deltabox/SKILL.md`               |
| `vscode`   | `.vscode/mcp.json`   | `.github/instructions/deltabox.instructions.md` |
| `opencode` | `opencode.json`      | `.opencode/skills/deltabox/SKILL.md`            |
| `pi`       | `.pi/mcp.json`       | `.pi/skills/deltabox/SKILL.md`                  |
| `custom`   | `<dir>/mcp.json`     | `<dir>/deltabox/SKILL.md`                       |

`--scope global` writes to the provider's user profile instead
(`~/.claude.json`, `~/.codex/config.toml`, `~/.config/opencode/opencode.json`,
...). `--no-skills` writes only the MCP config, and `--json` prints the exact
paths that were written.

The VS Code extension exposes the same flow from **Install MCP server + skill...**
(and the Home view's Quick Actions).
