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

## Skills

`dbx skills` installs the **official dbx toolchain skill** without the MCP
server. The skill is documentation-only: it tells the agent to read
[`https://toolchain.deltabox.studio/llms.txt`](https://toolchain.deltabox.studio/llms.txt)
and follow the relevant docs page before answering or editing files. It also
tells the agent to inspect the project first:

- `dbx.config.*` / `vite.config.*` (with the `dbx()` plugin) and
  `.vscode/settings.json` (`deltabox.toolchain.enabled`) to see whether the
  toolchain is enabled.
- `.dbx/toolchain/projects.json` for the project graph and config locations, and
  `.dbx/toolchain/manifest.json` for managed files.
- The enabled `toolchain` sections, so conventions such as commitlint/changelog
  commit messages are respected.

```sh
dbx skills                                  # list the install status per agent
dbx skills --official                       # install for every builtin agent
dbx skills --official --provider claude     # one agent
dbx skills --official --provider vscode --scope global
dbx skills --official --provider custom --dir ./tools/agent
dbx skills --official --force               # overwrite an existing skill
```

Installs are idempotent: an existing skill file is left untouched unless
`--force` is passed, so local edits are preserved. `--json` prints the status or
write results.

### Automatic installation

Opt in through `toolchain.mcp.skills`; `dbx sync` (and `dbx watch`) then adds the
skill wherever it is missing:

```ts
export default defineConfig({
    toolchain: {
        mcp: {
            skills: {
                agents: ['claude', 'vscode'],
                scope: 'project',
            },
        },
    },
});
```

| Option    | Meaning                                                         |
| --------- | --------------------------------------------------------------- |
| `agents`  | Agent id or ids (default: every builtin provider).              |
| `scope`   | `project` (default) or `global`.                                |
| `dir`     | Custom directory (with `agents: ['custom']`).                   |
| `force`   | Overwrite existing files (default: `false`).                    |
| `enabled` | Set `false` to keep the section configured but stop installing. |

The skill paths mirror the MCP provider table above, using the
`deltabox-toolchain` stem (for example
`.claude/skills/deltabox-toolchain/SKILL.md`). The VS Code extension adds an
**Install official skill...** prompt action alongside the MCP installer.

### Programmatic API

```ts
import {
    checkSkill,
    installOfficialSkill,
    installSkill,
    resolveMcpSkillsConfig,
} from '@deltabox/toolchain/mcp';

checkSkill({ agent: 'claude', cwd }); // { path, exists }
installOfficialSkill({ agent: 'claude', cwd }); // writes only when missing
installSkill({ agent: 'vscode', scope: 'global', force: true });
resolveMcpSkillsConfig(config); // the configured agents/scope, or undefined
```
