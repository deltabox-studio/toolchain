import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { readJsoncFile, type SyncTask } from '@deltabox/toolchain/shared';

import { readManifest, writeManifest } from '../src/manifest.js';
import { runSync } from '../src/sync.js';
import { vscodeSyncTask } from '../src/vscode.js';
import { resolveWatchGlobs } from '../src/watch.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-sync-'));
}

describe('runSync', () => {
    it('writes managed files and records a manifest', async () => {
        const cwd = tmp();
        const task: SyncTask = { name: 'x', run: () => [{ path: 'a.txt', content: 'hi\n' }] };
        const result = await runSync({ tasks: [task], cwd, config: {}, tokens: {}, quiet: true });
        expect(result.written).toEqual(['a.txt']);
        expect(fs.readFileSync(path.join(cwd, 'a.txt'), 'utf-8')).toBe('hi\n');
        expect(readManifest(cwd).files).toEqual(['a.txt']);
    });

    it('prunes files that are no longer generated', async () => {
        const cwd = tmp();
        await runSync({
            tasks: [{ name: 'x', run: () => [{ path: 'a.txt', content: 'a' }] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        const result = await runSync({
            tasks: [{ name: 'x', run: () => [] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(result.removed).toEqual(['a.txt']);
        expect(fs.existsSync(path.join(cwd, 'a.txt'))).toBe(false);
    });

    it('skips a task disabled by the config', async () => {
        const cwd = tmp();
        const result = await runSync({
            tasks: [
                {
                    name: 'x',
                    enabled: config => config.tsconfig !== false,
                    run: () => [{ path: 'x.txt', content: 'x' }],
                },
            ],
            cwd,
            config: { tsconfig: false },
            tokens: {},
            quiet: true,
        });

        expect(result.written).toEqual([]);
        expect(fs.existsSync(path.join(cwd, 'x.txt'))).toBe(false);
    });

    it('runs only the named tasks and rejects unknown names', async () => {
        const cwd = tmp();
        const tasks: SyncTask[] = [
            { name: 'a', run: () => [{ path: 'a.txt', content: 'a' }] },
            { name: 'b', run: () => [{ path: 'b.txt', content: 'b' }] },
        ];
        const result = await runSync({
            tasks,
            only: ['b'],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });

        expect(result.written).toEqual(['b.txt']);
        expect(fs.existsSync(path.join(cwd, 'a.txt'))).toBe(false);
        expect(fs.existsSync(path.join(cwd, 'b.txt'))).toBe(true);

        await expect(
            runSync({ tasks, only: ['nope'], cwd, config: {}, tokens: {}, quiet: true })
        ).rejects.toThrow(/unknown sync task/);
    });

    it('does not prune files owned by skipped tasks when prune is false', async () => {
        const cwd = tmp();
        await runSync({
            tasks: [{ name: 'a', run: () => [{ path: 'a.txt', content: 'a' }] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        const result = await runSync({
            tasks: [{ name: 'b', run: () => [{ path: 'b.txt', content: 'b' }] }],
            cwd,
            config: {},
            tokens: {},
            prune: false,
            quiet: true,
        });

        expect(result.removed).toEqual([]);
        expect(fs.existsSync(path.join(cwd, 'a.txt'))).toBe(true);
        expect(fs.existsSync(path.join(cwd, 'b.txt'))).toBe(true);
        expect(readManifest(cwd).files.sort()).toEqual(['a.txt', 'b.txt']);
    });

    it('never deletes a pre-existing (adopted) file', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'a.txt'), 'hand-written');
        await runSync({
            tasks: [{ name: 'x', run: () => [{ path: 'a.txt', content: 'managed' }] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        const result = await runSync({
            tasks: [{ name: 'x', run: () => [] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(result.removed).toEqual([]);
        expect(fs.existsSync(path.join(cwd, 'a.txt'))).toBe(true);
        expect(fs.readFileSync(path.join(cwd, 'a.txt'), 'utf-8')).toBe('managed');
        expect(readManifest(cwd).files).toEqual([]);
    });

    it('reports drift in check mode without writing', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'a.txt'), 'old');
        const result = await runSync({
            tasks: [{ name: 'x', run: () => [{ path: 'a.txt', content: 'new' }] }],
            cwd,
            config: {},
            tokens: {},
            check: true,
            quiet: true,
        });
        expect(result.upToDate).toBe(false);
        expect(result.changed).toEqual(['a.txt']);
        expect(fs.readFileSync(path.join(cwd, 'a.txt'), 'utf-8')).toBe('old');
    });

    it('runs the lifecycle hooks in order', async () => {
        const cwd = tmp();
        const calls: string[] = [];
        const task: SyncTask = {
            name: 'x',
            run: () => {
                calls.push('run');
                return [];
            },
        };
        const config = {
            hooks: {
                beforeSync: () => {
                    calls.push('beforeSync');
                },
                beforeTask: () => {
                    calls.push('beforeTask');
                },
                afterTask: () => {
                    calls.push('afterTask');
                },
                afterSync: () => {
                    calls.push('afterSync');
                },
            },
        };
        await runSync({ tasks: [task], cwd, config, tokens: {}, quiet: true });
        expect(calls).toEqual(['beforeSync', 'beforeTask', 'run', 'afterTask', 'afterSync']);
    });

    it('skips disabled tasks', async () => {
        const cwd = tmp();
        let ran = false;
        await runSync({
            tasks: [
                {
                    name: 'x',
                    enabled: () => false,
                    run: () => {
                        ran = true;
                        return [];
                    },
                },
            ],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(ran).toBe(false);
    });

    it('skips tasks whose projectTypes exclude the project type', async () => {
        const cwd = tmp();
        let ran = false;
        await runSync({
            tasks: [
                {
                    name: 'mono-only',
                    projectTypes: ['monorepo-root'],
                    run: () => {
                        ran = true;
                        return [];
                    },
                },
            ],
            cwd,
            config: {},
            tokens: {},
            projectType: 'project',
            quiet: true,
        });
        expect(ran).toBe(false);
    });

    it('resolves vscodeSyncTask settings from the config', async () => {
        const cwd = tmp();
        const task = vscodeSyncTask({
            settings: config =>
                config.biome ? [{ 'biome.lsp.watcher.kind': 'none' }] : [{ 'x.y': true }],
        });
        await runSync({
            tasks: [task],
            cwd,
            config: {},
            tokens: {},
            projectType: 'monorepo-root',
            quiet: true,
        });
        const settings = JSON.parse(
            fs.readFileSync(path.join(cwd, '.vscode/settings.json'), 'utf-8')
        ) as Record<string, unknown>;
        expect(settings['x.y']).toBe(true);
        expect(settings['biome.lsp.watcher.kind']).toBeUndefined();
    });

    it('rejects a task output path that escapes the project root', async () => {
        const parent = tmp();
        const cwd = path.join(parent, 'project');
        fs.mkdirSync(cwd);
        await expect(
            runSync({
                tasks: [{ name: 'x', run: () => [{ path: '../outside.txt', content: 'bad' }] }],
                cwd,
                config: {},
                tokens: {},
                quiet: true,
            })
        ).rejects.toThrow(/outside the project root/);
        expect(fs.existsSync(path.join(parent, 'outside.txt'))).toBe(false);
    });

    it('allows an absolute managed path inside the project root', async () => {
        const cwd = tmp();
        const absolute = path.join(cwd, 'absolute.txt');
        const result = await runSync({
            tasks: [{ name: 'x', run: () => [{ path: absolute, content: 'ok' }] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(result.written).toEqual(['absolute.txt']);
        expect(fs.readFileSync(absolute, 'utf-8')).toBe('ok');
        expect(readManifest(cwd).files).toEqual(['absolute.txt']);
    });

    it('never deletes a manifest entry that escapes the project root', async () => {
        const parent = tmp();
        const cwd = path.join(parent, 'project');
        fs.mkdirSync(cwd);
        fs.writeFileSync(path.join(parent, 'outside.txt'), 'keep me');
        writeManifest(cwd, ['../outside.txt'], undefined, { '../outside.txt': 'created' });
        const result = await runSync({
            tasks: [],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(result.removed).toEqual([]);
        expect(fs.readFileSync(path.join(parent, 'outside.txt'), 'utf-8')).toBe('keep me');
    });

    it('normalizes backslash paths in a legacy manifest', async () => {
        const cwd = tmp();
        fs.mkdirSync(path.join(cwd, 'a'));
        fs.writeFileSync(path.join(cwd, 'a/b.txt'), 'b');
        writeManifest(cwd, ['a/b.txt'], undefined, { 'a/b.txt': 'created' });
        // Simulate an older Windows manifest.
        fs.writeFileSync(
            path.join(cwd, '.dbx/toolchain/manifest.json'),
            JSON.stringify({ files: ['a\\b.txt'], origins: { 'a\\b.txt': 'created' } })
        );
        const result = await runSync({
            tasks: [],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(result.removed).toEqual(['a/b.txt']);
        expect(fs.existsSync(path.join(cwd, 'a/b.txt'))).toBe(false);
    });

    it('treats files in a legacy manifest without origins as adopted', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'package.json'), '{"name":"x"}\n');
        // Pre-`origins` manifest: writeManifest with no origin map.
        writeManifest(cwd, ['package.json']);
        const result = await runSync({
            tasks: [],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(result.removed).toEqual([]);
        expect(fs.existsSync(path.join(cwd, 'package.json'))).toBe(true);
        expect(readManifest(cwd).files).toEqual([]);
    });

    it('merges settings into an existing JSONC file', async () => {
        const cwd = tmp();
        fs.mkdirSync(path.join(cwd, '.vscode'));
        fs.writeFileSync(
            path.join(cwd, '.vscode/settings.json'),
            '{\n    // keep this\n    "editor.formatOnSave": true,\n}\n'
        );
        await runSync({
            tasks: [vscodeSyncTask({ settings: [{ 'x.y': true }] })],
            cwd,
            config: {},
            tokens: {},
            projectType: 'monorepo-root',
            quiet: true,
        });
        const written = fs.readFileSync(path.join(cwd, '.vscode/settings.json'), 'utf-8');
        expect(written).toContain('// keep this');
        const settings = readJsoncFile<Record<string, unknown>>(
            path.join(cwd, '.vscode/settings.json')
        )!;
        expect(settings['editor.formatOnSave']).toBe(true);
        expect(settings['x.y']).toBe(true);
    });
});

describe('runSync untracked files and task metadata', () => {
    it('writes untracked files without recording or pruning them', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'user.json'), '{}\n');
        const result = await runSync({
            tasks: [
                {
                    name: 'x',
                    run: () => [
                        { path: 'a.txt', content: 'a' },
                        { path: 'user.json', content: '{ "patched": true }\n', track: false },
                    ],
                },
            ],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(result.written.sort()).toEqual(['a.txt', 'user.json']);
        expect(readManifest(cwd).files).toEqual(['a.txt']);
        expect(readManifest(cwd).origins).toEqual({ 'a.txt': 'created' });

        // A later sync that no longer patches it leaves the user file alone.
        const next = await runSync({
            tasks: [{ name: 'x', run: () => [] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(next.removed).toEqual(['a.txt']);
        expect(fs.readFileSync(path.join(cwd, 'user.json'), 'utf-8')).toBe('{ "patched": true }\n');
    });

    it('drift-checks untracked files', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'user.json'), '{}\n');
        const result = await runSync({
            tasks: [
                { name: 'x', run: () => [{ path: 'user.json', content: '[]\n', track: false }] },
            ],
            cwd,
            config: {},
            tokens: {},
            check: true,
            quiet: true,
        });
        expect(result.changed).toEqual(['user.json']);
        expect(result.upToDate).toBe(false);
    });

    it('derives `keep` from the config', async () => {
        const cwd = tmp();
        await runSync({
            tasks: [{ name: 'x', run: () => [{ path: 'custom.build.json', content: '{}' }] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        const result = await runSync({
            tasks: [
                {
                    name: 'x',
                    keep: config => [String((config as { keepName?: string }).keepName)],
                    run: () => [],
                },
            ],
            cwd,
            config: { keepName: 'custom.build.json' } as never,
            tokens: {},
            quiet: true,
        });
        expect(result.removed).toEqual([]);
        expect(fs.existsSync(path.join(cwd, 'custom.build.json'))).toBe(true);
    });

    it("keeps a disabled task's `keep` files", async () => {
        const cwd = tmp();
        await runSync({
            tasks: [{ name: 'x', run: () => [{ path: 'catalog.yml', content: 'x' }] }],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        const result = await runSync({
            tasks: [
                {
                    name: 'catalogs',
                    enabled: () => false,
                    keep: ['catalog.yml'],
                    run: () => [],
                },
            ],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(result.removed).toEqual([]);
        expect(fs.existsSync(path.join(cwd, 'catalog.yml'))).toBe(true);
    });

    it('persists task manifest metadata without clobbering the file list', async () => {
        const cwd = tmp();
        await runSync({
            tasks: [
                {
                    name: 'x',
                    run: ctx => {
                        ctx.manifest!.snapshots = { 'a.json': { a: 1 } };
                        ctx.manifest!.files = ['bogus'];
                        ctx.manifest!.customState = { cursor: 7 };
                        return [{ path: 'a.txt', content: 'a' }];
                    },
                },
            ],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        const manifest = readManifest(cwd);
        expect(manifest.files).toEqual(['a.txt']);
        expect(manifest.snapshots).toEqual({ 'a.json': { a: 1 } });
        expect(manifest.extras).toEqual({ customState: { cursor: 7 } });

        // The extra survives into the next run's SyncContext.
        let carried: unknown;
        await runSync({
            tasks: [
                {
                    name: 'y',
                    run: ctx => {
                        carried = ctx.manifest!.customState;
                        return [];
                    },
                },
            ],
            cwd,
            config: {},
            tokens: {},
            quiet: true,
        });
        expect(carried).toEqual({ cursor: 7 });
    });
});

describe('resolveWatchGlobs', () => {
    it('resolves the active tasks globs, including config-derived ones', () => {
        const tasks: SyncTask[] = [
            { name: 'static', watch: ['a.json'], run: () => [] },
            {
                name: 'derived',
                watch: config => [`**/${(config as { file?: string }).file ?? 'default.json'}`],
                run: () => [],
            },
            { name: 'off', watch: ['off.json'], enabled: () => false, run: () => [] },
            {
                name: 'root-only',
                watch: ['root.json'],
                projectTypes: ['monorepo-root'],
                run: () => [],
            },
        ];
        expect(resolveWatchGlobs(tasks, {}, 'project')).toEqual(['a.json', '**/default.json']);
        expect(resolveWatchGlobs(tasks, { file: 'custom.json' } as never, 'monorepo-root')).toEqual(
            ['a.json', '**/custom.json', 'root.json']
        );
    });
});

describe('vscodeSyncTask ownership', () => {
    it('does not track the merged VS Code files in the manifest', async () => {
        const cwd = tmp();
        await runSync({
            tasks: [vscodeSyncTask({ settings: [{ 'x.y': true }] })],
            cwd,
            config: {},
            tokens: {},
            projectType: 'monorepo-root',
            quiet: true,
        });
        expect(readManifest(cwd).files).toEqual([]);
        expect(fs.existsSync(path.join(cwd, '.vscode/settings.json'))).toBe(true);
    });
});
