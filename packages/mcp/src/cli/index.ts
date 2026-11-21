/** The `dbx mcp:*` commands. */

import path from 'node:path';

import { logger, defineCliCommand, withSpinner } from '@deltabox/toolchain/shared';

import mcpPkg from '../../package.json' with { type: 'json' };
import { installMcp, listMcpProviders, type McpProviderId, type McpScope } from '../install.js';
import { createMcpServer, MCP_SERVER_NAME, serveStdio } from '../protocol.js';
import { defaultMcpTools } from '../tools.js';

/** The MCP server for `dbx mcp:serve`, advertising the running package version. */
export function createServeServer(cwd: string): ReturnType<typeof createMcpServer> {
    // A relative `--cwd` is relative to the process, but tool handlers also
    // spawn with `context.cwd`; an absolute root keeps both consistent.
    return createMcpServer({
        cwd: path.resolve(cwd),
        tools: defaultMcpTools(),
        version: mcpPkg.version,
    });
}

/** `dbx mcp:serve` — run the stdio MCP server for the current project. */
function serveCommand() {
    return defineCliCommand({
        name: 'mcp:serve',
        description: 'Run the dbx MCP server over stdio (for MCP clients).',
        passthrough: true,
        options: [{ flags: '--cwd <dir>', description: 'Project root (default: cwd).' }],
        run: async (opts, context) => {
            const cwd = (opts.cwd as string | undefined) ?? context.cwd;
            await serveStdio(createServeServer(cwd));
        },
    });
}

/** `dbx mcp:install` — write the MCP config + skill for a provider. */
function installCommand() {
    return defineCliCommand({
        name: 'mcp:install',
        description: 'Install the dbx MCP server + skill into an AI harness/editor.',
        options: [
            {
                flags: '--provider <id>',
                description: 'claude, codex, vscode, opencode, pi or custom.',
            },
            { flags: '--scope <scope>', description: 'project (default) or global.' },
            { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
            { flags: '--dir <dir>', description: 'Custom directory (for --provider custom).' },
            { flags: '--command <command>', description: 'Client command (default `dbx`)' },
            { flags: '--no-skills', description: 'Do not write the skill/instructions file.' },
            { flags: '--json', description: 'Print the written paths as JSON.' },
        ],
        run: async (opts, context) => {
            const provider = opts.provider as McpProviderId | undefined;
            if (!provider) {
                const ids = listMcpProviders().map(candidate => candidate.id);
                throw new Error(`--provider is required (one of: ${ids.join(', ')}).`);
            }
            const scope = (opts.scope as McpScope | undefined) ?? 'project';
            if (scope !== 'project' && scope !== 'global') {
                throw new Error('--scope must be `project` or `global`.');
            }
            const result = await withSpinner(
                async () =>
                    installMcp({
                        provider,
                        scope,
                        cwd: (opts.cwd as string | undefined) ?? context.cwd,
                        ...(opts.dir ? { dir: String(opts.dir) } : {}),
                        ...(opts.command ? { command: String(opts.command) } : {}),
                        skills: opts.skills !== false,
                    }),
                {
                    start: `Installing the dbx MCP server for ${provider}...`,
                    success: `Installed the dbx MCP server for ${provider}.`,
                }
            );
            if (opts.json) {
                logger.raw(JSON.stringify(result, null, 4));
                return;
            }
            logger.success(`dbx MCP installed for ${provider}.`);
            logger.info(`  config: ${result.configPath}`);
            if (result.skillPath) logger.info(`  skill:  ${result.skillPath}`);
        },
    });
}

/** `dbx mcp:list` — list the builtin MCP providers and their files. */
function listCommand() {
    return defineCliCommand({
        name: 'mcp:list',
        description: 'List the builtin MCP providers (Claude, Codex, VS Code, OpenCode, Pi).',
        options: [
            { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
            { flags: '--json', description: 'Print the providers as JSON.' },
        ],
        run: async opts => {
            const cwd = (opts.cwd as string | undefined) ?? process.cwd();
            const providers = listMcpProviders().map(provider => ({
                id: provider.id,
                name: provider.name,
                description: provider.description,
                project: {
                    config: provider.configPath('project', cwd),
                    skill: provider.skillPath('project', cwd),
                },
                global: {
                    config: provider.configPath('global', cwd),
                    skill: provider.skillPath('global', cwd),
                },
            }));
            if (opts.json) {
                logger.raw(JSON.stringify(providers, null, 4));
                return;
            }
            logger.info(`${MCP_SERVER_NAME} — install with \`dbx mcp:install --provider <id>\``);
            for (const provider of providers) {
                logger.info(`  ${provider.id.padEnd(10)} ${provider.name}`);
                logger.info(`             ${provider.description}`);
            }
        },
    });
}

/** Every `mcp:*` command. */
export function mcpCommands() {
    return [serveCommand(), installCommand(), listCommand()];
}
