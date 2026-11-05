import { describe, expect, it, vi } from 'vitest';

const { runChangelog } = vi.hoisted(() => ({ runChangelog: vi.fn() }));

vi.mock('../src/run.js', () => ({ runChangelog }));

describe('changelog bin entry', () => {
    it('runs the pipeline when the bin module loads', async () => {
        await import('../src/bin.js');
        expect(runChangelog).toHaveBeenCalledTimes(1);
    });
});
