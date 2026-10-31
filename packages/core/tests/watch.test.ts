import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { SyncTask } from '@deltabox/toolchain-shared';

import { loadToolchainConfig } from '../src/loader.js';
import { runWatch } from '../src/watch.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-watch-'));
    fs.mkdirSync(path.join(dir, '.git'));
    dirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(predicate: () => boolean, timeout = 5000): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeout) throw new Error('timed out waiting for watch');
        await sleep(25);
    }
}

describe('runWatch', () => {
    it('reloads an edited code config before re-syncing', async () => {
        const cwd = tmp();
        const file = path.join(cwd, 'dbx.config.mjs');
        fs.writeFileSync(
            file,
            `export default { toolchain: { project: { name: 'one' }, watch: { debounce: 20 } } };\n`
        );
        const loaded = await loadToolchainConfig(cwd);
        const names: string[] = [];
        const task: SyncTask = {
            name: 'record-config',
            run: ctx => {
                names.push(ctx.config.project?.name ?? '');
                return [];
            },
        };

        const watching = runWatch({
            cwd,
            tasks: [task],
            config: loaded.config,
            tokens: loaded.tokens,
            projectType: loaded.projectType,
            configPath: file,
            quiet: true,
        });

        try {
            await waitFor(() => names.includes('one'));
            // Stay outside the post-sync quiet window so the edit is not ignored.
            await sleep(400);
            fs.writeFileSync(
                file,
                `export default { toolchain: { project: { name: 'two' }, watch: { debounce: 20 } } };\n`
            );
            await waitFor(() => names.includes('two'));
            expect(names).toContain('one');
        } finally {
            process.emit('SIGINT');
            await watching;
        }
    });
});
