import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
    createMonorepoRootFiles,
    createProjectTemplateFiles,
    projectCommands,
    writeGeneratedFiles,
} from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-regress-'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

/** Create a directory symlink/junction; returns false when the OS forbids it. */
function linkDirectory(target: string, link: string): boolean {
    try {
        fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
        return true;
    } catch {
        return false;
    }
}

describe('generated file containment', () => {
    it('rejects a target that escapes through a symlink/junction', () => {
        const root = makeTmp();
        const outside = makeTmp();
        if (!linkDirectory(outside, path.join(root, 'link'))) return;

        expect(() =>
            writeGeneratedFiles([{ path: 'link/escaped.txt', content: 'nope' }], root)
        ).toThrow(/outside/);
        expect(fs.existsSync(path.join(outside, 'escaped.txt'))).toBe(false);
    });

    it('can preflight a write without touching the filesystem', () => {
        const root = makeTmp();
        const written = writeGeneratedFiles([{ path: 'a.txt', content: 'a' }], root, {
            dryRun: true,
        });
        expect(written).toEqual([path.join(root, 'a.txt')]);
        expect(fs.existsSync(path.join(root, 'a.txt'))).toBe(false);
    });
});

describe('monorepo workspace globs', () => {
    it('threads workspaceGlobs into package.json, scripts and pnpm-workspace.yaml', () => {
        const files = createMonorepoRootFiles({
            name: 'acme',
            packageManager: 'pnpm',
            workspaces: [],
            workspaceGlobs: ['apps/*', 'packages/*'],
        });
        const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content) as {
            workspaces: string[];
            scripts: Record<string, string>;
        };
        expect(pkg.workspaces).toEqual(['apps/*', 'packages/*']);
        expect(pkg.scripts.build).toContain('--filter "./apps/*"');
        expect(pkg.scripts.build).toContain('--filter "./packages/*"');
        expect(pkg.scripts.test).toContain('--filter "./apps/*"');

        const pnpm = files.find(file => file.path === 'pnpm-workspace.yaml')!.content;
        expect(pnpm).toContain('apps/*');
        expect(pnpm).toContain('packages/*');
    });
});

describe('template interpolation escaping', () => {
    const name = 'o\'brien"<x>';

    it('escapes the project name in generated TypeScript', () => {
        const bun = createProjectTemplateFiles('bun', { name });
        const app = bun.find(file => file.path === 'src/app.ts')!.content;
        expect(app).toContain("options.name ?? 'o\\'brien\"<x>'");

        for (const id of ['express', 'fastify'] as const) {
            const files = createProjectTemplateFiles(id, { name });
            const source = files.find(file => file.path === 'src/app.ts')!.content;
            expect(source).toContain("name: 'o\\'brien\"<x>'");
        }

        const docs = createProjectTemplateFiles('vitepress', { name });
        const config = docs.find(file => file.path === 'docs/.vitepress/config.ts')!.content;
        expect(config).toContain("title: 'o\\'brien\"<x>'");
        const index = docs.find(file => file.path === 'docs/index.md')!.content;
        expect(index).toContain('name: "o\'brien\\"<x>"');
    });

    it('escapes HTML in the Ollama UI title', () => {
        const files = createProjectTemplateFiles('ollama-chat', {
            name: '<script>alert(1)</script>',
        });
        const html = files.find(file => file.path === 'index.html')!.content;
        expect(html).toContain('<title>&lt;script&gt;alert(1)&lt;/script&gt;</title>');
        expect(html).not.toContain('<title><script>');
    });

    it('asserts the full health payload in the Bun test', () => {
        const files = createProjectTemplateFiles('bun', { name: 'acme' });
        const test = files.find(file => file.path === 'tests/app.test.ts')!.content;
        expect(test).toContain("toEqual({ name: 'acme', status: 'ok' })");
        expect(test).not.toContain("toEqual({ status: 'ok' })");
    });
});

describe('file-server regression', () => {
    it('serves only files, guards decodeURIComponent and handles stream errors', () => {
        const files = createProjectTemplateFiles('file-server', { name: 'acme' });
        const server = files.find(file => file.path === 'src/server.ts')!.content;

        expect(server).toContain('if (!info.isFile())');
        expect(server).toContain('try {');
        expect(server).toContain('decoded = decodeURIComponent');
        expect(server).toContain('stream.on("error"');
        expect(server).not.toContain('createReadStream(file).pipe(response)');

        const test = files.find(file => file.path === 'tests/server.test.ts')!.content;
        expect(test).toContain('const directory = await fetch');
        expect(test).toContain('%E0%A4%A');
    });
});

describe('project:init --no-project-config', () => {
    it('registers the local flag instead of the global --no-config', () => {
        for (const name of ['project:init', 'project:init:monorepo', 'project:init:workspace']) {
            const command = projectCommands().find(candidate => candidate.name === name);
            if (!command) throw new Error(`missing ${name}`);
            const flags = (command.options ?? []).map(option => option.flags);
            expect(flags, name).toContain('--no-project-config');
            expect(flags, name).not.toContain('--no-config');
        }
    });

    it('does not emit a server image for the library scaffold', async () => {
        const command = projectCommands().find(candidate => candidate.name === 'project:init');
        if (!command?.run) throw new Error('missing project:init command');
        const out = makeTmp();

        await command.run(
            { name: 'demo', out, containerize: true },
            { cwd: out, projectType: 'project', config: {}, tokens: { packageManager: 'yarn' } }
        );

        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(out, 'Dockerfile'))).toBe(false);
        expect(fs.existsSync(path.join(out, 'docker-compose.yaml'))).toBe(false);
    });

    it('skips vite.config.ts but still writes the project files', async () => {
        const command = projectCommands().find(candidate => candidate.name === 'project:init');
        if (!command?.run) throw new Error('missing project:init command');
        const out = makeTmp();

        await command.run(
            { name: 'demo', out, projectConfig: false },
            { cwd: out, projectType: 'project', config: {}, tokens: { packageManager: 'yarn' } }
        );

        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(out, 'vite.config.ts'))).toBe(false);
    });
});
