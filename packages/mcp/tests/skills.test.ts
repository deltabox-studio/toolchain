import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { logger, type SyncContext, type ToolchainConfig } from '@deltabox/toolchain/shared';

import { mcpCommands } from '../src/cli/index.js';
import { MCP_PROVIDERS } from '../src/install.js';
import {
    checkSkill,
    installOfficialSkill,
    installSkill,
    OFFICIAL_SKILL_DOCS_URL,
    OFFICIAL_SKILL_NAME,
    renderOfficialSkill,
    resolveMcpSkillsConfig,
} from '../src/skills.js';
import { skillsSyncTask } from '../src/sync.js';

const dirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-skills-'));
    dirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('official skill', () => {
    it('points agents at the published llms.txt bundle', () => {
        const skill = renderOfficialSkill();
        expect(skill.startsWith('---\n')).toBe(true);
        expect(skill).toContain(`<${OFFICIAL_SKILL_DOCS_URL}>`);
        expect(skill).toContain('name: deltabox-toolchain');
        expect(skill).toContain('guide/config-generator');
        expect(skill).toContain('dbx <command> --help');
    });

    it('tells agents to inspect the project config and graph first', () => {
        const skill = renderOfficialSkill();
        expect(skill).toContain('dbx.config.*');
        expect(skill).toContain('vite.config.*');
        expect(skill).toContain('toolchain.enabled');
        expect(skill).toContain('.vscode/settings.json');
        expect(skill).toContain('deltabox.toolchain.enabled');
        expect(skill).toContain('.dbx/toolchain/projects.json');
        expect(skill).toContain('.dbx/toolchain/manifest.json');
        expect(skill).toContain('commitlint.config.mjs');
        expect(skill).toContain('Conventional Commits');
        expect(skill).toContain('dbx sync --check');
    });

    it('checks and adds the skill only when missing', () => {
        const cwd = makeTmp();
        const target = { agent: 'claude' as const, cwd };

        expect(checkSkill(target)).toMatchObject({
            path: path.join(cwd, '.claude', 'skills', OFFICIAL_SKILL_NAME, 'SKILL.md'),
            exists: false,
        });

        const first = installOfficialSkill(target);
        expect(first).toMatchObject({ installed: true, exists: true });
        expect(fs.readFileSync(first.path, 'utf-8')).toContain(OFFICIAL_SKILL_DOCS_URL);

        fs.writeFileSync(first.path, 'edited by the user', 'utf-8');
        const second = installOfficialSkill(target);
        expect(second.installed).toBe(false);
        expect(fs.readFileSync(first.path, 'utf-8')).toBe('edited by the user');

        const forced = installSkill({ ...target, force: true });
        expect(forced.installed).toBe(true);
        expect(fs.readFileSync(first.path, 'utf-8')).toContain(OFFICIAL_SKILL_DOCS_URL);
    });

    it('writes provider-specific paths, including VS Code instructions', () => {
        const cwd = makeTmp();
        const vscode = installOfficialSkill({ agent: 'vscode', cwd });
        expect(vscode.path).toBe(
            path.join(cwd, '.github', 'instructions', `${OFFICIAL_SKILL_NAME}.instructions.md`)
        );

        const custom = installOfficialSkill({ agent: 'custom', cwd, dir: path.join(cwd, 'agent') });
        expect(custom.path).toBe(path.join(cwd, 'agent', OFFICIAL_SKILL_NAME, 'SKILL.md'));
        expect(() => installOfficialSkill({ agent: 'custom', cwd })).toThrow(/requires a `dir`/);
        expect(() => checkSkill({ agent: 'nope' as never, cwd })).toThrow(/unknown skill agent/);
    });

    it('can install the MCP skill flavor at the deltabox stem', () => {
        const cwd = makeTmp();
        const result = installSkill({ agent: 'claude', cwd, kind: 'mcp' });
        expect(result.path).toBe(path.join(cwd, '.claude', 'skills', 'deltabox', 'SKILL.md'));
        expect(fs.readFileSync(result.path, 'utf-8')).toContain('dbx_sync');
    });
});

describe('mcp.skills config', () => {
    it('is opt-in and defaults to every builtin agent in the project scope', () => {
        expect(resolveMcpSkillsConfig({})).toBeUndefined();
        expect(resolveMcpSkillsConfig({ mcp: true })).toBeUndefined();
        expect(resolveMcpSkillsConfig({ mcp: { skills: false } })).toBeUndefined();
        expect(resolveMcpSkillsConfig({ mcp: { skills: { enabled: false } } })).toBeUndefined();

        expect(resolveMcpSkillsConfig({ mcp: { skills: {} } })).toEqual({
            agents: MCP_PROVIDERS.map(provider => provider.id),
            scope: 'project',
            force: false,
        });
        expect(resolveMcpSkillsConfig({ mcp: { skills: true } })).toEqual({
            agents: MCP_PROVIDERS.map(provider => provider.id),
            scope: 'project',
            force: false,
        });
        expect(
            resolveMcpSkillsConfig({
                mcp: {
                    skills: {
                        enabled: true,
                        agents: ['claude', 'vscode'],
                        scope: 'global',
                        dir: './agent',
                        force: true,
                    },
                },
            })
        ).toEqual({
            agents: ['claude', 'vscode'],
            scope: 'global',
            dir: './agent',
            force: true,
        });

        // A single agent string is accepted and an empty dir is ignored.
        expect(resolveMcpSkillsConfig({ mcp: { skills: { agents: 'claude', dir: '' } } })).toEqual({
            agents: ['claude'],
            scope: 'project',
            force: false,
        });
    });

    it('installs missing skills from the sync task and respects check mode', async () => {
        const task = skillsSyncTask();
        expect(task.enabled?.({})).toBe(false);
        expect(task.enabled?.({ mcp: { skills: false } })).toBe(false);
        expect(task.enabled?.({ mcp: { skills: { enabled: false } } })).toBe(false);

        const config = {
            mcp: { skills: { agents: ['claude'] } },
        } satisfies ToolchainConfig;
        expect(task.enabled?.(config)).toBe(true);

        const cwd = makeTmp();
        const ctx = {
            cwd,
            projectType: 'project',
            config,
            tokens: {},
            log: () => {},
            warn: () => {},
        } as unknown as SyncContext;
        await task.run(ctx);
        const skillPath = path.join(cwd, '.claude', 'skills', OFFICIAL_SKILL_NAME, 'SKILL.md');
        expect(fs.existsSync(skillPath)).toBe(true);

        // Existing files are preserved unless the config forces an overwrite.
        fs.writeFileSync(skillPath, 'edited by the user', 'utf-8');
        await task.run(ctx);
        expect(fs.readFileSync(skillPath, 'utf-8')).toBe('edited by the user');
        await task.run({
            ...ctx,
            config: { mcp: { skills: { agents: ['claude'], force: true } } },
        } as SyncContext);
        expect(fs.readFileSync(skillPath, 'utf-8')).toContain(OFFICIAL_SKILL_DOCS_URL);

        const checkCwd = makeTmp();
        await task.run({ ...ctx, cwd: checkCwd, check: true } as SyncContext);
        expect(
            fs.existsSync(path.join(checkCwd, '.claude', 'skills', OFFICIAL_SKILL_NAME, 'SKILL.md'))
        ).toBe(false);

        // Check mode never writes, even when the config forces an overwrite.
        fs.writeFileSync(skillPath, 'kept in check mode', 'utf-8');
        await task.run({
            ...ctx,
            config: { mcp: { skills: { agents: ['claude'], force: true } } },
            check: true,
        } as SyncContext);
        expect(fs.readFileSync(skillPath, 'utf-8')).toBe('kept in check mode');
    });

    it('installs custom-agent skills and rejects a missing custom dir', async () => {
        const task = skillsSyncTask();
        const cwd = makeTmp();
        const dir = path.join(cwd, 'agent');
        await task.run({
            cwd,
            projectType: 'project',
            config: { mcp: { skills: { agents: ['custom'], dir } } },
            tokens: {},
            log: () => {},
            warn: () => {},
        } as unknown as SyncContext);
        expect(fs.existsSync(path.join(dir, OFFICIAL_SKILL_NAME, 'SKILL.md'))).toBe(true);

        expect(() =>
            task.run({
                cwd,
                projectType: 'project',
                config: { mcp: { skills: { agents: ['custom'] } } },
                tokens: {},
                log: () => {},
                warn: () => {},
            } as unknown as SyncContext)
        ).toThrow(/requires a `dir`/);
    });

    it('is exposed as the dbx skills command', async () => {
        expect(mcpCommands().map(command => command.name)).toContain('skills');

        const command = mcpCommands().find(candidate => candidate.name === 'skills')!;
        const cwd = makeTmp();
        await command.run?.({ official: true, cwd }, {
            cwd,
            config: { mcp: { skills: { agents: 'claude' } } },
        } as never);
        expect(
            fs.existsSync(path.join(cwd, '.claude', 'skills', OFFICIAL_SKILL_NAME, 'SKILL.md'))
        ).toBe(true);
        expect(fs.existsSync(path.join(cwd, '.codex'))).toBe(false);
    });

    it('installs a custom-agent skill through the command', async () => {
        const command = mcpCommands().find(candidate => candidate.name === 'skills')!;
        const cwd = makeTmp();
        const dir = path.join(cwd, 'agent');
        await command.run?.({ official: true, provider: 'custom', dir, cwd }, {
            cwd,
            config: {},
        } as never);
        expect(fs.existsSync(path.join(dir, OFFICIAL_SKILL_NAME, 'SKILL.md'))).toBe(true);
    });

    it('reports skill status through the command when --official is omitted', async () => {
        const command = mcpCommands().find(candidate => candidate.name === 'skills')!;
        const cwd = makeTmp();
        const raw = vi.spyOn(logger, 'raw').mockImplementation(() => {});
        try {
            await command.run?.({ json: true, provider: 'claude', cwd }, {
                cwd,
                config: {},
            } as never);
            const statuses = JSON.parse(raw.mock.calls[0]![0] as string) as {
                agent: string;
                kind: string;
                exists: boolean;
                path: string;
            }[];
            expect(statuses).toEqual([
                {
                    agent: 'claude',
                    kind: 'official',
                    path: path.join(cwd, '.claude', 'skills', OFFICIAL_SKILL_NAME, 'SKILL.md'),
                    exists: false,
                },
            ]);
        } finally {
            raw.mockRestore();
        }
    });

    it('validates the command provider and scope', async () => {
        const command = mcpCommands().find(candidate => candidate.name === 'skills')!;
        const cwd = makeTmp();
        await expect(
            Promise.resolve(
                command.run?.({ official: true, provider: 'nope', cwd }, {
                    cwd,
                    config: {},
                } as never)
            )
        ).rejects.toThrow(/unknown provider/);
        await expect(
            Promise.resolve(
                command.run?.({ official: true, provider: 'claude', scope: 'workspace', cwd }, {
                    cwd,
                    config: {},
                } as never)
            )
        ).rejects.toThrow(/--scope must be/);
    });
});
