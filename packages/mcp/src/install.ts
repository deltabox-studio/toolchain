/**
 * Install the dbx MCP server + skill into the common AI harnesses/editors.
 *
 * The installer is intentionally plain: each provider is a small descriptor
 * (config file path per scope, config format, skill path). It writes an
 * idempotent entry and a `SKILL.md`, and never removes unrelated settings.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readJsoncFile } from '@deltabox/toolchain/shared';

/** A supported install scope. */
export type McpScope = 'project' | 'global';

/** A builtin MCP provider. */
export type McpProviderId = 'claude' | 'codex' | 'vscode' | 'opencode' | 'pi' | 'custom';

/** The config dialect a provider uses. */
export type McpConfigFormat = 'claude' | 'vscode' | 'opencode' | 'codex' | 'generic';

/** A provider descriptor (drives the CLI picker + the VS Code installer). */
export interface McpProvider {
    id: McpProviderId;
    name: string;
    description: string;
    format: McpConfigFormat;
    /** The config file for a scope (custom uses the caller's dir). */
    configPath: (scope: McpScope, cwd: string) => string;
    /** The skill/instructions file for a scope. */
    skillPath: (scope: McpScope, cwd: string) => string;
}

/** The MCP server name written into every config. */
export const MCP_ENTRY_NAME = 'deltabox';

const home = (): string => os.homedir();

function projectOrGlobal(scope: McpScope, cwd: string, rel: string, global: string): string {
    return scope === 'project' ? path.join(cwd, rel) : path.join(home(), global);
}

/** The VS Code user profile directory (platform-aware). */
function vscodeUserDir(): string {
    if (process.platform === 'win32') {
        const appData = process.env.APPDATA ?? path.join(home(), 'AppData', 'Roaming');
        return path.join(appData, 'Code', 'User');
    }
    return path.join(home(), '.config', 'Code', 'User');
}

/** The builtin provider catalog. */
export const MCP_PROVIDERS: McpProvider[] = [
    {
        id: 'claude',
        name: 'Claude Code',
        description: 'Claude Code project `.mcp.json` or `~/.claude.json`, plus a skill.',
        format: 'claude',
        configPath: (scope, cwd) => projectOrGlobal(scope, cwd, '.mcp.json', '.claude.json'),
        skillPath: (scope, cwd) =>
            projectOrGlobal(
                scope,
                cwd,
                '.claude/skills/deltabox/SKILL.md',
                '.claude/skills/deltabox/SKILL.md'
            ),
    },
    {
        id: 'codex',
        name: 'Codex',
        description: 'Codex `config.toml` MCP server + skill.',
        format: 'codex',
        configPath: (scope, cwd) =>
            projectOrGlobal(scope, cwd, '.codex/config.toml', '.codex/config.toml'),
        skillPath: (scope, cwd) =>
            projectOrGlobal(
                scope,
                cwd,
                '.codex/skills/deltabox/SKILL.md',
                '.codex/skills/deltabox/SKILL.md'
            ),
    },
    {
        id: 'vscode',
        name: 'VS Code',
        description: 'Workspace `.vscode/mcp.json` + Copilot instructions.',
        format: 'vscode',
        configPath: (scope, cwd) =>
            scope === 'project'
                ? path.join(cwd, '.vscode', 'mcp.json')
                : path.join(vscodeUserDir(), 'mcp.json'),
        skillPath: (scope, cwd) =>
            scope === 'project'
                ? path.join(cwd, '.github', 'instructions', 'deltabox.instructions.md')
                : path.join(vscodeUserDir(), 'prompts', 'deltabox.instructions.md'),
    },
    {
        id: 'opencode',
        name: 'OpenCode',
        description: 'OpenCode `opencode.json` MCP server + skill.',
        format: 'opencode',
        configPath: (scope, cwd) =>
            projectOrGlobal(scope, cwd, 'opencode.json', '.config/opencode/opencode.json'),
        skillPath: (scope, cwd) =>
            projectOrGlobal(
                scope,
                cwd,
                '.opencode/skills/deltabox/SKILL.md',
                '.config/opencode/skills/deltabox/SKILL.md'
            ),
    },
    {
        id: 'pi',
        name: 'Pi Durable',
        description: 'Pi `mcp.json` MCP server + skill.',
        format: 'generic',
        configPath: (scope, cwd) => projectOrGlobal(scope, cwd, '.pi/mcp.json', '.pi/mcp.json'),
        skillPath: (scope, cwd) =>
            projectOrGlobal(
                scope,
                cwd,
                '.pi/skills/deltabox/SKILL.md',
                '.pi/skills/deltabox/SKILL.md'
            ),
    },
];

/** A custom install directory (writes a generic `mcp.json` + skill there). */
export const CUSTOM_PROVIDER: McpProvider = {
    id: 'custom',
    name: 'Custom directory',
    description: 'Write a generic `mcp.json` + `deltabox/SKILL.md` into a directory you choose.',
    format: 'generic',
    configPath: (_scope, cwd) => path.join(cwd, 'mcp.json'),
    skillPath: (_scope, cwd) => path.join(cwd, 'deltabox', 'SKILL.md'),
};

/** Every provider, including the custom-directory option. */
export function listMcpProviders(): McpProvider[] {
    return [...MCP_PROVIDERS, CUSTOM_PROVIDER];
}

export interface InstallMcpOptions {
    provider: McpProviderId;
    /** Project or global (custom ignores this and uses `dir`). */
    scope?: McpScope;
    /** The project root (default: cwd). */
    cwd?: string;
    /** The custom directory (required for `provider: 'custom'`). */
    dir?: string;
    /** The command clients run (default `dbx`). */
    command?: string;
    /** The server arguments (default `['mcp:serve']`). */
    args?: string[];
    /** Do not write the skill file. */
    skills?: boolean;
    /** Overwrite an existing skill file (default true). */
    force?: boolean;
}

export interface InstallMcpResult {
    provider: McpProviderId;
    configPath: string;
    skillPath?: string;
}

/**
 * Read a JSON/JSONC config file, returning `{}` only for a missing file.
 *
 * VS Code's `mcp.json` is JSONC, so comments and trailing commas are accepted.
 * An existing file that still cannot be parsed (or is not an object) throws:
 * rewriting it from an empty object would delete the user's other settings.
 */
function readJson(file: string): Record<string, unknown> {
    if (!fs.existsSync(file)) return {};
    const parsed = readJsoncFile<unknown>(file);
    if (parsed === undefined) {
        throw new Error(`cannot parse ${file} as JSON/JSONC; refusing to overwrite it.`);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(`${file} does not contain a JSON object; refusing to overwrite it.`);
    }
    return parsed as Record<string, unknown>;
}

function writeFile(file: string, content: string): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf-8');
}

/** The JSON entry for a provider. */
function withEntry(
    current: Record<string, unknown>,
    format: McpConfigFormat,
    command: string,
    args: string[]
): Record<string, unknown> {
    switch (format) {
        case 'vscode':
            return {
                ...current,
                servers: {
                    ...(current.servers as Record<string, unknown> | undefined),
                    [MCP_ENTRY_NAME]: { type: 'stdio', command, args },
                },
            };
        case 'opencode':
            return {
                ...current,
                mcp: {
                    ...(current.mcp as Record<string, unknown> | undefined),
                    [MCP_ENTRY_NAME]: { type: 'local', command: [command, ...args], enabled: true },
                },
            };
        case 'claude':
        case 'generic':
            return {
                ...current,
                mcpServers: {
                    ...(current.mcpServers as Record<string, unknown> | undefined),
                    [MCP_ENTRY_NAME]: { command, args },
                },
            };
        default:
            return current;
    }
}

/** Append the Codex TOML block when absent (idempotent). */
function codexToml(current: string, command: string, args: string[]): string {
    if (/^\[mcp_servers\.deltabox\]/m.test(current)) return current;
    const block = [
        '[mcp_servers.deltabox]',
        `command = ${JSON.stringify(command)}`,
        `args = [${args.map(arg => JSON.stringify(arg)).join(', ')}]`,
        '',
    ].join('\n');
    return current.trim() ? `${current.replace(/\s*$/, '')}\n\n${block}` : block;
}

/** The skill body installed for a provider. */
export function renderSkill(provider: McpProviderId): string {
    return [
        '---',
        'name: deltabox toolchain',
        'description: >',
        '  Manage this project with the deltabox MCP server (dbx_sync, dbx_projects,',
        '  dbx_changelog, dbx_migrate, dbx_tsconfig). Use when the user asks to sync',
        '  generated files, scaffold a project, inspect the project graph, migrate',
        '  formatter/linter/vite config, manage tsconfig paths, or cut a release.',
        '---',
        '',
        '# deltabox toolchain',
        '',
        'Use the `deltabox` MCP server to manage this project. Prefer its tools over',
        'guessing file contents:',
        '',
        '- `dbx_sync` — regenerate managed files; use `{ "check": true }` for drift.',
        '- `dbx_projects` — discover the project graph and dependencies.',
        '- `dbx_providers` — list tooling providers and whether Vite+ is available.',
        '- `dbx_templates` / `dbx_template_info` — scaffold or inspect templates.',
        '- `dbx_changelog` — generate or preview the changelog.',
        '- `dbx_migrate` — migrate formatter/linter/vite config (preview first).',
        '- `dbx_project_config` — add a dbx config to an unconfigured project.',
        '- `dbx_tsconfig` — manage workspace tsconfig paths/references.',
        '',
        'The same operations are available as `dbx <command>` in a terminal. In',
        'plugin mode (a `dbx()` plugin in `vite.config.*`) do not create a',
        '`dbx.config.*`; put toolchain options in the plugin instead.',
        '',
        `Installed for: ${provider}.`,
        '',
    ].join('\n');
}

/** Install the MCP server (and skill) for a provider. */
export function installMcp(options: InstallMcpOptions): InstallMcpResult {
    const provider = listMcpProviders().find(candidate => candidate.id === options.provider);
    if (!provider) throw new Error(`unknown MCP provider "${options.provider}".`);
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const scope: McpScope = options.scope ?? 'project';
    const custom = provider.id === 'custom';
    if (custom && !options.dir) {
        throw new Error('the custom MCP provider requires a `dir`.');
    }
    const targetDir = custom ? path.resolve(options.dir as string) : cwd;
    const configPath = custom
        ? provider.configPath(scope, targetDir)
        : provider.configPath(scope, targetDir);
    const skillPath = provider.skillPath(scope, targetDir);
    const command = options.command ?? 'dbx';
    const args = options.args ?? ['mcp:serve'];

    if (provider.format === 'codex') {
        const current = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : '';
        writeFile(configPath, codexToml(current, command, args));
    } else {
        writeFile(
            configPath,
            `${JSON.stringify(withEntry(readJson(configPath), provider.format, command, args), null, 4)}\n`
        );
    }

    if (options.skills !== false) {
        if (options.force === false && fs.existsSync(skillPath)) {
            // Keep the caller's edited skill.
        } else {
            writeFile(skillPath, renderSkill(provider.id));
        }
    }

    return {
        provider: provider.id,
        configPath,
        ...(options.skills !== false ? { skillPath } : {}),
    };
}
