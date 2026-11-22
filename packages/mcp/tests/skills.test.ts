import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { SyncContext, ToolchainConfig } from '@deltabox/toolchain/shared';

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
        expect(skill).toContain('name: deltabox toolchain');
        expect(skill).toContain('guide/config-generator');
        expect(skill).toContain('dbx <command> --help');
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
    });
});

describe('mcp.skills config', () => {
    it('is opt-in and defaults to every builtin agent in the project scope', () => {
        expect(resolveMcpSkillsConfig({})).toBeUndefined();
        expect(resolveMcpSkillsConfig({ mcp: true })).toBeUndefined();
        expect(resolveMcpSkillsConfig({ mcp: { skills: false } })).toBeUndefined();

        expect(resolveMcpSkillsConfig({ mcp: { skills: {} } })).toEqual({
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
    });

    it('installs missing skills from the sync task and respects check mode', async () => {
        const task = skillsSyncTask();
        expect(task.enabled?.({})).toBe(false);

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

        const checkCwd = makeTmp();
        await task.run({ ...ctx, cwd: checkCwd, check: true } as SyncContext);
        expect(
            fs.existsSync(path.join(checkCwd, '.claude', 'skills', OFFICIAL_SKILL_NAME, 'SKILL.md'))
        ).toBe(false);
    });

    it('is exposed as the dbx skills command', () => {
        expect(mcpCommands().map(command => command.name)).toContain('skills');
    });
});
