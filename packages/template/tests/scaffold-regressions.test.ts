import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const runVpMock = vi.hoisted(() => vi.fn());

vi.mock('vite-plugin-dbx', () => ({ runVp: runVpMock }));

import {
    BUILTIN_TEMPLATES,
    loadLocalTemplates,
    resolveTemplateSources,
    scaffoldTemplate,
    templateCommands,
} from '../src/index.js';
import type { Template } from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tpl-regress-'));
    tmpDirs.push(dir);
    return dir;
}

function writeTemplate(
    dir: string,
    manifest: Record<string, unknown>,
    files: Record<string, string>
): void {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'template.json'), JSON.stringify(manifest), 'utf-8');
    for (const [relative, content] of Object.entries(files)) {
        const target = path.join(dir, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content, 'utf-8');
    }
}

function builtin(id: string): Template {
    const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === id);
    if (!template) throw new Error(`missing builtin ${id}`);
    return template;
}

beforeEach(() => {
    runVpMock.mockReset();
    runVpMock.mockResolvedValue({
        code: 0,
        stdout: '',
        stderr: '',
        resolved: { exe: 'vp', args: [], source: 'global' },
    });
});

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('Vite+ scaffolding prerequisites', () => {
    it('allows the npx fallback when creating into an empty directory', async () => {
        const out = makeTmp();
        await scaffoldTemplate(builtin('vite-plus-library'), {
            cwd: out,
            tokens: { name: 'app' },
        });

        expect(runVpMock).toHaveBeenCalledWith(
            ['create', 'vite:library', 'app'],
            expect.objectContaining({ allowNpx: true })
        );
    });

    it('forwards a git source ref and a custom npm registry', async () => {
        const out = makeTmp();
        await scaffoldTemplate(
            {
                id: 'git-tpl',
                name: 'Git template',
                kind: 'project',
                source: {
                    type: 'git',
                    locate: 'https://github.com/myapp/tpl',
                    ref: 'v1.2.0',
                },
            },
            { cwd: out, tokens: { name: 'app' } }
        );
        expect(runVpMock).toHaveBeenLastCalledWith(
            ['create', 'https://github.com/myapp/tpl#v1.2.0', 'app'],
            expect.any(Object)
        );

        await scaffoldTemplate(
            {
                id: 'npm-tpl',
                name: 'Npm template',
                kind: 'project',
                source: {
                    type: 'npm',
                    locate: '@org/create',
                    registry: 'https://npm.example.com',
                },
            },
            { cwd: out, tokens: { name: 'app' } }
        );
        expect(runVpMock).toHaveBeenLastCalledWith(
            ['create', '@org/create', 'app'],
            expect.objectContaining({
                env: { npm_config_registry: 'https://npm.example.com' },
            })
        );
    });

    it('emits no server image for an online library but keeps a static image', async () => {
        const library = makeTmp();
        runVpMock.mockImplementation(async () => {
            fs.writeFileSync(
                path.join(library, 'package.json'),
                JSON.stringify({ name: 'lib', scripts: { build: 'vp pack' } })
            );
            return { code: 0, stdout: '', stderr: '', resolved: { exe: 'vp', args: [] } };
        });
        const template: Template = {
            id: 'online-lib',
            name: 'Online library',
            kind: 'project',
            source: { type: 'git', locate: 'https://github.com/myapp/library' },
        };
        await scaffoldTemplate(template, { cwd: library, containerize: true });
        expect(fs.existsSync(path.join(library, 'Dockerfile'))).toBe(false);

        const site = makeTmp();
        runVpMock.mockImplementation(async () => {
            fs.writeFileSync(
                path.join(site, 'package.json'),
                JSON.stringify({ name: 'site', scripts: { build: 'vite build' } })
            );
            return { code: 0, stdout: '', stderr: '', resolved: { exe: 'vp', args: [] } };
        });
        await scaffoldTemplate(template, { cwd: site, containerize: true });
        expect(fs.readFileSync(path.join(site, 'Dockerfile'), 'utf-8')).toContain(
            '/usr/share/nginx/html'
        );
    });

    it('propagates the caller force flag to online Docker artifacts', async () => {
        const out = makeTmp();
        runVpMock.mockImplementation(async () => {
            fs.writeFileSync(
                path.join(out, 'package.json'),
                JSON.stringify({ name: 'app', scripts: { start: 'node dist/index.js' } })
            );
            return { code: 0, stdout: '', stderr: '', resolved: { exe: 'vp', args: [] } };
        });
        const template: Template = {
            id: 'online',
            name: 'Online',
            kind: 'project',
            source: { type: 'git', locate: 'https://github.com/myapp/tpl' },
        };

        fs.writeFileSync(path.join(out, 'Dockerfile'), 'mine\n', 'utf-8');
        const result = await scaffoldTemplate(template, { cwd: out, containerize: true });
        expect(fs.readFileSync(path.join(out, 'Dockerfile'), 'utf-8')).toBe('mine\n');
        expect(result.written).not.toContain(path.join(out, 'Dockerfile'));

        await scaffoldTemplate(template, { cwd: out, containerize: true, force: true });
        expect(fs.readFileSync(path.join(out, 'Dockerfile'), 'utf-8')).toContain(
            'Generated by @deltabox/toolchain'
        );
    });
});

describe('template-aware containerization', () => {
    it('does not emit a Dockerfile for a library template', async () => {
        const out = makeTmp();
        await scaffoldTemplate(builtin('project'), {
            cwd: out,
            tokens: { name: 'myapp' },
            containerize: true,
        });
        expect(fs.existsSync(path.join(out, 'Dockerfile'))).toBe(false);
        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
    });

    it('copies file-server assets and uses a file health path', async () => {
        const out = makeTmp();
        await scaffoldTemplate(builtin('file-server'), {
            cwd: out,
            tokens: { name: 'files' },
            containerize: true,
        });
        const dockerfile = fs.readFileSync(path.join(out, 'Dockerfile'), 'utf-8');
        expect(dockerfile).toContain('COPY --from=build /app/public ./public');
        expect(dockerfile).toContain('http://127.0.0.1:3000/index.html');
    });

    it('installs rclone for the rclone template and skips the oRPC healthcheck', async () => {
        const rclone = makeTmp();
        await scaffoldTemplate(builtin('file-server-rclone'), {
            cwd: rclone,
            tokens: { name: 'rclone' },
            containerize: true,
        });
        expect(fs.readFileSync(path.join(rclone, 'Dockerfile'), 'utf-8')).toContain(
            'apt-get install -y --no-install-recommends rclone'
        );

        const orpc = makeTmp();
        await scaffoldTemplate(builtin('orpc'), {
            cwd: orpc,
            tokens: { name: 'rpc' },
            containerize: true,
        });
        expect(fs.readFileSync(path.join(orpc, 'Dockerfile'), 'utf-8')).not.toContain(
            'HEALTHCHECK'
        );
    });

    it('preflights Docker artifacts before writing project files', async () => {
        const out = makeTmp();
        fs.writeFileSync(path.join(out, 'Dockerfile'), 'mine\n', 'utf-8');

        await expect(
            scaffoldTemplate(builtin('express'), {
                cwd: out,
                tokens: { name: 'api' },
                containerize: true,
            })
        ).rejects.toThrow(/overwrite/);
        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(false);

        await scaffoldTemplate(builtin('express'), {
            cwd: out,
            tokens: { name: 'api' },
            containerize: true,
            force: true,
        });
        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
        expect(fs.readFileSync(path.join(out, 'Dockerfile'), 'utf-8')).toContain(
            'Generated by @deltabox/toolchain'
        );
    });
});

describe('template input validation', () => {
    it('requires declared required variables before writing', async () => {
        const root = makeTmp();
        const tplDir = path.join(root, 'tpl');
        writeTemplate(
            tplDir,
            { name: 'T', variables: [{ name: 'owner', required: true }] },
            { '{{owner}}.txt': '{{owner}}' }
        );
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');
        const out = makeTmp();

        await expect(scaffoldTemplate(template, { cwd: out })).rejects.toThrow(
            /requires variable "owner"/
        );
        expect(fs.readdirSync(out)).toEqual([]);

        await scaffoldTemplate(template, { cwd: out, variables: { owner: 'myapp' } });
        expect(fs.existsSync(path.join(out, 'myapp.txt'))).toBe(true);
    });

    it('rejects a value outside a declared option list', async () => {
        const root = makeTmp();
        const tplDir = path.join(root, 'tpl');
        writeTemplate(
            tplDir,
            { name: 'T', variables: [{ name: 'flavour', options: ['a', 'b'] }] },
            { 'out.txt': '{{flavour}}' }
        );
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');

        await expect(
            scaffoldTemplate(template, { cwd: makeTmp(), variables: { flavour: 'c' } })
        ).rejects.toThrow(/invalid value "c"/);
    });

    it('validates the package manager before writing a builtin', async () => {
        const out = makeTmp();
        await expect(
            scaffoldTemplate(builtin('project'), {
                cwd: out,
                tokens: { name: 'myapp' },
                variables: { packageManager: 'deno' },
            })
        ).rejects.toThrow(/invalid (?:value "deno"|package manager)/);
        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(false);
    });

    it('rejects an invalid package name before writing', async () => {
        const out = makeTmp();
        await expect(
            scaffoldTemplate(builtin('project'), { cwd: out, tokens: { name: 'Bad Name' } })
        ).rejects.toThrow(/invalid project name/);
        expect(fs.readdirSync(out)).toEqual([]);
    });
});

describe('local template containment and source kind', () => {
    it('rejects a target that escapes through a link under the output', async () => {
        const root = makeTmp();
        const tplDir = path.join(root, 'tpl');
        writeTemplate(tplDir, { name: 'T' }, { 'link/evil.txt': 'evil' });
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');

        const out = makeTmp();
        const outside = makeTmp();
        try {
            fs.symlinkSync(
                outside,
                path.join(out, 'link'),
                process.platform === 'win32' ? 'junction' : 'dir'
            );
        } catch {
            // The OS forbids symlinks in this environment; the lexical guard is
            // still covered by the project writer's test.
            return;
        }

        await expect(scaffoldTemplate(template, { cwd: out })).rejects.toThrow(/outside/);
        expect(fs.existsSync(path.join(outside, 'evil.txt'))).toBe(false);
    });

    it('forwards a local source kind to the resolved template', async () => {
        const root = makeTmp();
        const tplDir = path.join(root, 'tpl');
        writeTemplate(tplDir, { name: 'T' }, { 'README.md': '# hi' });
        const [template] = await resolveTemplateSources(
            [{ type: 'local', locate: './tpl', kind: 'application' }],
            { cwd: root }
        );
        expect(template?.kind).toBe('application');
    });
});

describe('registry CLI validation', () => {
    it('rejects an unknown --scope or --kind before writing', () => {
        const command = templateCommands().find(candidate => candidate.name === 'registry');
        if (!command?.run) throw new Error('missing registry command');
        const cwd = makeTmp();

        expect(() =>
            command.run({ cwd, scope: 'bogus', add: './registry' } as never, {
                cwd,
                projectType: 'project',
                config: {},
                tokens: {},
            })
        ).toThrow(/invalid --scope "bogus"/);
        expect(() =>
            command.run({ cwd, kind: 'bogus', add: './registry' } as never, {
                cwd,
                projectType: 'project',
                config: {},
                tokens: {},
            })
        ).toThrow(/invalid --kind "bogus"/);
        expect(fs.existsSync(path.join(cwd, '.dbx'))).toBe(false);
    });
});
