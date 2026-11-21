import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { logger } from '@deltabox/toolchain/shared';

import {
    addTemplateSource,
    BUILTIN_TEMPLATES,
    detectNpmRegistry,
    loadLocalTemplates,
    loadTemplates,
    parseSourceSpec,
    readTemplateManifest,
    readTemplateRegistry,
    removeTemplateSource,
    scaffoldTemplate,
    templateCommands,
    writeTemplateManifest,
} from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tpl-'));
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

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('template registry', () => {
    it('lists the builtin templates offline', async () => {
        const templates = await loadTemplates({ cwd: makeTmp() });
        const ids = templates.map(template => template.id);
        expect(ids).toEqual(
            expect.arrayContaining(['project', 'monorepo', 'workspace', 'vite-plus'])
        );
        expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    });

    it('loads a local template source', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'mytpl');
        writeTemplate(tpl, { name: 'My template' }, { 'README.md': '# {{name}}' });

        expect(loadLocalTemplates(root).map(t => t.id)).toContain('mytpl');
        const templates = await loadTemplates({
            cwd: root,
            sources: [{ type: 'local', locate: tpl }],
        });
        const found = templates.find(template => template.name === 'My template');
        expect(found?.kind).toBe('project');
    });

    it('loads a remote source registry recursively', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'remote-tpl');
        writeTemplate(tpl, { name: 'Remote template' }, { 'README.md': '# {{name}}' });
        vi.stubGlobal(
            'fetch',
            vi.fn(
                async () =>
                    new Response(JSON.stringify({ sources: [{ type: 'local', locate: tpl }] }), {
                        status: 200,
                        headers: { 'content-type': 'application/json' },
                    })
            )
        );
        try {
            const templates = await loadTemplates({
                cwd: root,
                online: true,
                sources: [{ type: 'remote', locate: 'https://example.com/registry.json' }],
            });
            expect(templates.find(template => template.id === 'remote-tpl')?.name).toBe(
                'Remote template'
            );
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('round-trips the on-disk source registry', () => {
        const root = makeTmp();
        addTemplateSource(root, { type: 'git', locate: 'https://github.com/myapp/tpl.git' });
        addTemplateSource(root, { type: 'local', locate: './tpl' });
        expect(readTemplateRegistry(root).sources).toHaveLength(2);
        // dedupe on type:locate
        addTemplateSource(root, { type: 'local', locate: './tpl' });
        expect(readTemplateRegistry(root).sources).toHaveLength(2);
    });
});

describe('source parsing', () => {
    it('infers the source type', () => {
        expect(parseSourceSpec('git:https://github.com/myapp/x.git').type).toBe('git');
        expect(parseSourceSpec('@org/create').type).toBe('npm');
        expect(parseSourceSpec('create-myapp').type).toBe('npm');
        expect(parseSourceSpec('myapp-create').type).toBe('npm');
        expect(parseSourceSpec('remote:https://example.com/templates.json').type).toBe('remote');
        expect(parseSourceSpec('https://github.com/myapp/x').type).toBe('git');
        expect(parseSourceSpec('./local-dir').type).toBe('local');
    });

    it('detects the package manager npm registry', () => {
        const root = makeTmp();
        fs.writeFileSync(path.join(root, '.yarnrc.yml'), 'npmRegistryServer: https://yarn.test\n');
        expect(detectNpmRegistry(root)).toBe('https://yarn.test');

        const npmrcRoot = makeTmp();
        fs.writeFileSync(path.join(npmrcRoot, '.npmrc'), 'registry=https://npm.test/\n');
        expect(detectNpmRegistry(npmrcRoot)).toBe('https://npm.test');
    });
});

describe('template authoring', () => {
    it('writes and reads a template.json (any kind)', () => {
        const root = makeTmp();
        const dir = path.join(root, 'tpl');
        const file = writeTemplateManifest(dir, {
            name: 'T',
            kind: 'folder',
            variables: [{ name: 'name' }],
        });
        expect(fs.existsSync(file)).toBe(true);
        expect(readTemplateManifest(dir)?.kind).toBe('folder');
        expect(loadLocalTemplates(root).map(t => t.kind)).toContain('folder');
    });

    it('removes a registry source by id or type:locate', () => {
        const root = makeTmp();
        addTemplateSource(root, { type: 'local', locate: './a', id: 'a' });
        addTemplateSource(root, { type: 'local', locate: './b' });
        expect(removeTemplateSource(root, 'a').removed).toBe(1);
        expect(removeTemplateSource(root, 'local:./b').removed).toBe(1);
        expect(removeTemplateSource(root, 'nope').removed).toBe(0);
        expect(readTemplateRegistry(root).sources).toHaveLength(0);
    });

    it('scaffolds the folder builtin', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'folder');
        if (!template) throw new Error('missing builtin');
        await scaffoldTemplate(template, { cwd: out, tokens: { name: 'myapp' } });
        expect(fs.readFileSync(path.join(out, 'README.md'), 'utf-8')).toBe('# myapp\n');
    });

    it('covers every registry kind in the builtins', () => {
        const kinds = new Set(BUILTIN_TEMPLATES.map(template => template.kind));
        expect(kinds).toEqual(new Set(['project', 'application', 'folder', 'workspace']));
    });
});

describe('create CLI', () => {
    it('rejects an unknown template id without --online', async () => {
        const command = templateCommands().find(candidate => candidate.name === 'create');
        if (!command?.run) throw new Error('missing create command');
        const out = makeTmp();

        await expect(
            command.run(
                { template: 'not-a-template', out, json: true },
                { cwd: out, projectType: 'project', config: {}, tokens: {} }
            )
        ).rejects.toThrow(/not found/);
    });
});

describe('scaffolding', () => {
    it('creates a builtin TypeScript project', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'project');
        if (!template) throw new Error('missing builtin');
        const result = await scaffoldTemplate(template, { cwd: out, tokens: { name: 'myapp' } });
        expect(result.written.length).toBeGreaterThan(0);
        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(out, 'vite.config.ts'))).toBe(true);
    });

    const PROJECT_TEMPLATE_CASES: {
        id: string;
        files: string[];
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        dev: RegExp;
    }[] = [
        {
            id: 'vitepress',
            files: ['docs/index.md', 'docs/.vitepress/config.ts'],
            devDependencies: { vitepress: expect.stringMatching(/^~1\.6\./) },
            dev: /^vitepress dev docs$/,
        },
        {
            id: 'express',
            files: ['src/app.ts', 'src/index.ts'],
            dependencies: { express: expect.stringMatching(/^~5\./) },
            dev: /^tsx watch/,
        },
        {
            id: 'fastify',
            files: ['src/app.ts', 'src/index.ts'],
            dependencies: { fastify: expect.stringMatching(/^~5\./) },
            dev: /^tsx watch/,
        },
        {
            id: 'bun',
            files: ['src/app.ts', 'src/index.ts'],
            devDependencies: { '@types/bun': expect.stringMatching(/^~1\./) },
            dev: /^bun --watch/,
        },
        {
            id: 'orpc',
            files: ['src/router.ts', 'src/index.ts'],
            dependencies: {
                '@orpc/server': expect.stringMatching(/^~1\./),
                zod: expect.stringMatching(/^~4\./),
            },
            dev: /^tsx watch/,
        },
        {
            id: 'file-server',
            files: ['src/server.ts', 'src/index.ts', 'public/index.html'],
            dev: /^tsx watch/,
        },
        {
            id: 'file-server-s3',
            files: ['src/server.ts', 'src/index.ts', '.env.example'],
            dependencies: { '@aws-sdk/client-s3': expect.stringMatching(/^~3\./) },
            dev: /^tsx watch/,
        },
        {
            id: 'file-server-minio',
            files: ['src/server.ts', 'src/index.ts', '.env.example'],
            dependencies: { '@aws-sdk/client-s3': expect.stringMatching(/^~3\./) },
            dev: /^tsx watch/,
        },
        {
            id: 'file-server-bun-s3',
            files: ['src/app.ts', 'src/index.ts', '.env.example'],
            devDependencies: { '@types/bun': expect.stringMatching(/^~1\./) },
            dev: /^bun --watch/,
        },
        {
            id: 'file-server-rclone',
            files: ['src/server.ts', 'src/index.ts'],
            dev: /^tsx watch/,
        },
        {
            id: 'ollama-chat',
            files: ['index.html', 'src/main.ts', 'src/style.css', 'src/ollama.ts'],
            dev: /^vp dev$/,
        },
    ];

    for (const testCase of PROJECT_TEMPLATE_CASES) {
        it(`scaffolds the ${testCase.id} built-in project template`, async () => {
            const out = makeTmp();
            const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === testCase.id);
            if (!template) throw new Error(`missing builtin ${testCase.id}`);

            await scaffoldTemplate(template, {
                cwd: out,
                tokens: { name: 'myapp', packageManager: 'yarn' },
            });

            for (const relative of testCase.files) {
                expect(fs.existsSync(path.join(out, relative)), relative).toBe(true);
            }
            // Every template keeps the plugin-first Vite+ config.
            expect(fs.existsSync(path.join(out, 'vite.config.ts'))).toBe(true);

            const pkg = JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf-8')) as {
                scripts: Record<string, string>;
                dependencies?: Record<string, string>;
                devDependencies: Record<string, string>;
            };
            expect(pkg.scripts.dev, 'dev script').toMatch(testCase.dev);
            expect(pkg.scripts.build).toBeTruthy();
            expect(pkg.scripts.typecheck).toBeTruthy();
            if (testCase.dependencies) {
                expect(pkg.dependencies).toMatchObject(testCase.dependencies);
            }
            if (testCase.devDependencies) {
                expect(pkg.devDependencies).toMatchObject(testCase.devDependencies);
            }
        });
    }

    it('pins template dependencies while keeping the toolchain in the catalog', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'express');
        if (!template) throw new Error('missing builtin');

        await scaffoldTemplate(template, {
            cwd: out,
            tokens: { name: 'myapp' },
            variables: { packageManager: 'pnpm' },
        });

        const pkg = JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf-8')) as {
            dependencies: Record<string, string>;
            devDependencies: Record<string, string>;
        };
        expect(pkg.dependencies.express).toMatch(/^~5\./);
        expect(pkg.devDependencies.typescript).toBe('catalog:');
        expect(pkg.devDependencies['vite-plus']).toBe('catalog:');
        expect(fs.existsSync(path.join(out, 'pnpm-workspace.yaml'))).toBe(true);
    });

    it('copies generated package-manager config before the container install', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'express');
        if (!template) throw new Error('missing builtin');

        await scaffoldTemplate(template, {
            cwd: out,
            tokens: { name: 'myapp', packageManager: 'yarn' },
            containerize: true,
        });

        const dockerfile = fs.readFileSync(path.join(out, 'Dockerfile'), 'utf-8');
        expect(fs.existsSync(path.join(out, '.yarnrc.yml'))).toBe(true);
        expect(dockerfile).toMatch(/COPY --chown=vp:vp [^\n]*\.yarnrc\.yml/);
        expect(dockerfile).toContain('RUN vp run build');
        expect(dockerfile).not.toMatch(/^RUN vp build$/m);
        expect(dockerfile).toContain('ENV HOST=0.0.0.0');
    });

    it('does not reuse the configured version when packageManager is overridden', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'project');
        if (!template) throw new Error('missing builtin');
        await scaffoldTemplate(template, {
            cwd: out,
            tokens: {
                name: 'myapp',
                packageManager: 'yarn',
                packageManagerVersion: '4.17.1',
            },
            variables: { packageManager: 'pnpm' },
        });
        const pkg = JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf-8'));
        expect(pkg.packageManager).toBe('pnpm@10.11.1');
    });

    it('does not copy the root description into a workspace config', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'workspace');
        if (!template) throw new Error('missing builtin');
        await scaffoldTemplate(template, {
            cwd: out,
            tokens: { name: 'web', description: 'The root project' },
        });
        const config = fs.readFileSync(path.join(out, 'packages/web/vite.config.ts'), 'utf-8');
        expect(config).not.toContain('The root project');
    });

    it('copies a local template, resolving tokens in paths and contents', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'tpl');
        writeTemplate(
            tpl,
            { name: 'T', variables: [{ name: 'name', default: 'app' }] },
            { 'src/{{name}}.ts': "export const name = '{{name}}';\n" }
        );
        const out = makeTmp();
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');
        const result = await scaffoldTemplate(template, { cwd: out, tokens: { name: 'myapp' } });

        const rendered = path.join(out, 'src', 'myapp.ts');
        expect(result.written).toContain(rendered);
        expect(fs.readFileSync(rendered, 'utf-8')).toBe("export const name = 'myapp';\n");
        // the manifest is never copied
        expect(fs.existsSync(path.join(out, 'template.json'))).toBe(false);
    });

    it('honours nested paths and globs in a local template ignore list', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'tpl');
        writeTemplate(
            tpl,
            { name: 'T', ignore: ['private/secret.txt', '*.md'] },
            {
                'keep.txt': 'keep',
                'notes.md': 'notes',
                'nested/more.md': 'more',
                'private/secret.txt': 'secret',
            }
        );
        const out = makeTmp();
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');

        await scaffoldTemplate(template, { cwd: out });

        expect(fs.existsSync(path.join(out, 'keep.txt'))).toBe(true);
        expect(fs.existsSync(path.join(out, 'notes.md'))).toBe(false);
        expect(fs.existsSync(path.join(out, 'nested', 'more.md'))).toBe(false);
        expect(fs.existsSync(path.join(out, 'private', 'secret.txt'))).toBe(false);
    });

    it('matches brace alternatives in a local template ignore list', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'tpl');
        writeTemplate(
            tpl,
            { name: 'T', ignore: ['**/*.{md,txt}'] },
            { 'a.md': 'a', 'b.txt': 'b', 'c.ts': 'c' }
        );
        const out = makeTmp();
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');

        await scaffoldTemplate(template, { cwd: out });

        expect(fs.existsSync(path.join(out, 'a.md'))).toBe(false);
        expect(fs.existsSync(path.join(out, 'b.txt'))).toBe(false);
        expect(fs.existsSync(path.join(out, 'c.ts'))).toBe(true);
    });

    it('does not copy a nested action module from a local template', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'tpl');
        writeTemplate(
            tpl,
            { name: 'T', actions: [{ id: 'setup', module: 'actions/setup.mjs' }] },
            {
                'keep.txt': 'keep',
                'actions/setup.mjs': 'export default () => {};\n',
            }
        );
        const out = makeTmp();
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');

        await scaffoldTemplate(template, { cwd: out });

        expect(fs.existsSync(path.join(out, 'keep.txt'))).toBe(true);
        expect(fs.existsSync(path.join(out, 'actions', 'setup.mjs'))).toBe(false);
    });

    it('copies a binary asset byte-for-byte', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'tpl');
        writeTemplate(tpl, { name: 'T' }, { 'README.md': '# {{name}}\n' });
        const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff, 0x10, 0x80]);
        fs.writeFileSync(path.join(tpl, 'logo.png'), bytes);
        const out = makeTmp();
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');

        await scaffoldTemplate(template, { cwd: out, tokens: { name: 'myapp' } });

        expect(fs.readFileSync(path.join(out, 'logo.png')).equals(bytes)).toBe(true);
        expect(fs.readFileSync(path.join(out, 'README.md'), 'utf-8')).toBe('# myapp\n');
    });
});

describe('workspace scaffold path validation', () => {
    it('rejects a workspace name that escapes the root before writing', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'workspace');
        if (!template) throw new Error('missing builtin');
        await expect(
            scaffoldTemplate(template, { cwd: out, tokens: { name: '../..' } })
        ).rejects.toThrow(/relative to the root/);
        expect(fs.readdirSync(out)).toEqual([]);
    });
});

describe('template:list --global', () => {
    function withHome(home: string, fn: () => Promise<void>): Promise<void> {
        const previousProfile = process.env.USERPROFILE;
        const previousHome = process.env.HOME;
        process.env.USERPROFILE = home;
        process.env.HOME = home;
        const restore = (): void => {
            if (previousProfile === undefined) delete process.env.USERPROFILE;
            else process.env.USERPROFILE = previousProfile;
            if (previousHome === undefined) delete process.env.HOME;
            else process.env.HOME = previousHome;
        };
        return fn().finally(restore);
    }

    it('applies the registry policy and the kind filter', async () => {
        const home = makeTmp();
        const tplDir = path.join(home, '.dbx', 'toolchain', '.registry', 'templates', 'foo');
        fs.mkdirSync(tplDir, { recursive: true });
        fs.writeFileSync(
            path.join(tplDir, 'template.json'),
            JSON.stringify({ name: 'Foo', kind: 'folder' })
        );
        const project = makeTmp();
        const raw = vi.spyOn(logger, 'raw').mockImplementation(() => {});

        const list = async (
            options: Record<string, unknown>,
            config: Record<string, unknown>
        ): Promise<Array<{ id: string }>> => {
            const command = templateCommands().find(
                candidate => candidate.name === 'template:list'
            );
            if (!command) throw new Error('missing template:list');
            raw.mockClear();
            await withHome(home, async () => {
                await command.run({ cwd: project, global: true, json: true, ...options }, {
                    cwd: project,
                    projectType: 'project',
                    config,
                    tokens: {},
                } as never);
            });
            return JSON.parse(raw.mock.calls[0]![0] as string) as Array<{ id: string }>;
        };

        try {
            expect((await list({ kind: 'folder' }, {})).map(t => t.id)).toEqual(['foo']);
            expect((await list({ kind: 'project' }, {})).map(t => t.id)).toEqual([]);
            expect(
                (
                    await list(
                        {},
                        {
                            registry: { templates: { deny: [`${home.replace(/\\/g, '/')}/**`] } },
                        }
                    )
                ).map(t => t.id)
            ).toEqual([]);
        } finally {
            raw.mockRestore();
        }
    });
});
