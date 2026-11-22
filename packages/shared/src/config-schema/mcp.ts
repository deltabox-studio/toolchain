import { z } from 'zod';

import { section, withEnabled } from './meta.js';

/** The agent harnesses the MCP skills installer understands. */
export const MCP_SKILL_AGENTS = ['claude', 'codex', 'vscode', 'opencode', 'pi', 'custom'] as const;

export const mcpSkillAgentSchema = z.enum(MCP_SKILL_AGENTS);

/**
 * `toolchain.mcp.skills` — install the official dbx docs skill into one or more
 * agents. Presence opts in; automatic installation is off otherwise.
 */
export const mcpSkillsConfigSchema = withEnabled(
    z.object({
        agents: z
            .union([mcpSkillAgentSchema, z.array(mcpSkillAgentSchema)])
            .describe(
                'Agent harness(es) to install into (default: every builtin provider). ' +
                    '`custom` requires `dir`.'
            )
            .optional(),
        scope: z
            .enum(['project', 'global'])
            .describe('Write the skill into the project (default) or the user profile.')
            .default('project')
            .optional(),
        dir: z
            .string()
            .describe("Custom directory to write the skill into (with `agents: ['custom']`).")
            .optional(),
        force: z
            .boolean()
            .describe('Overwrite an existing skill file (default: keep it).')
            .default(false)
            .optional(),
    })
)
    .describe('Install the official dbx docs skill into AI agent harnesses.')
    .meta({ id: 'ToolchainMcpSkillsConfig' });

/** MCP/skill integration for AI harnesses and editors. */
export const mcpConfigSchema = withEnabled(
    z.object({
        skills: section(mcpSkillsConfigSchema)
            .describe(
                'Install the official dbx skill into agent harnesses during `dbx sync`. ' +
                    'Opt in by defining this section.'
            )
            .optional(),
    })
)
    .describe('MCP server and skill installation for AI harnesses.')
    .meta({ id: 'ToolchainMcpConfig' });
