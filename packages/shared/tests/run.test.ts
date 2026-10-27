import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { spawnCross } from '../src/index.js';

describe('spawnCross command path with spaces', () => {
    // The bug is Windows-only: `spawnCross` goes through `cmd.exe`, which splits
    // an unquoted command at whitespace.
    it.runIf(process.platform === 'win32')(
        'runs an absolute command whose path contains a space',
        async () => {
            const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx space '));
            const exe = path.join(dir, path.basename(process.execPath));
            // Hardlink (instant, no 100MB copy); fall back to a copy otherwise.
            try {
                fs.linkSync(process.execPath, exe);
            } catch {
                fs.copyFileSync(process.execPath, exe);
            }
            try {
                const child = spawnCross(exe, ['-p', '1+1'], {
                    stdio: ['ignore', 'pipe', 'pipe'],
                });
                let stdout = '';
                child.stdout?.on('data', chunk => (stdout += chunk));
                const code = await new Promise<number | null>(resolve => child.on('exit', resolve));
                // Strip ANSI escapes: some test runners force colour on the child.
                expect(stdout.replace(/\u001b\[[0-9;]*m/g, '').trim()).toBe('2');
                expect(code).toBe(0);
            } finally {
                fs.rmSync(dir, { recursive: true, force: true });
            }
        },
        20_000
    );
});

describe('spawnCross timeout', () => {
    it('kills a child that exceeds timeoutMs rather than leaving it hanging', async () => {
        const start = Date.now();
        const child = spawnCross(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], {
            stdio: 'ignore',
            timeoutMs: 250,
        });
        const { code, signal } = await new Promise<{
            code: number | null;
            signal: NodeJS.Signals | null;
        }>(resolve => {
            child.on('exit', (exitCode, exitSignal) =>
                resolve({ code: exitCode, signal: exitSignal })
            );
        });
        // Killed well before the child's own 60s timer.
        expect(Date.now() - start).toBeLessThan(10_000);
        expect(signal === 'SIGKILL' || (code ?? 1) !== 0).toBe(true);
    }, 15_000);
});
