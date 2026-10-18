import { describe, expect, it } from 'vitest';

import { spawnCross } from '../src/index.js';

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
