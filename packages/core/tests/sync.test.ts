import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { SyncTask } from '@deltabox/toolchain-shared';

import { readManifest } from '../src/manifest.js';
import { runSync } from '../src/sync.js';
import { vscodeSyncTask } from '../src/vscode.js';

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

    it('persists task manifest metadata without clobbering the file list', async () => {
        const cwd = tmp();
        await runSync({
            tasks: [
                {
                    name: 'x',
                    run: ctx => {
                        ctx.manifest!.snapshots = { 'a.json': { a: 1 } };
                        ctx.manifest!.files = ['bogus'];
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
    });
});
