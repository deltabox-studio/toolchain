import { describe, expect, it, vi } from 'vite-plus/test';

const { runTsconfigCli } = vi.hoisted(() => ({ runTsconfigCli: vi.fn() }));

vi.mock('../src/cli/generate/index.js', () => ({ runTsconfigCli }));

describe('tsconfig bin entry', () => {
    it('runs the standalone tsconfig CLI when the bin module loads', async () => {
        await import('../src/bin.js');
        expect(runTsconfigCli).toHaveBeenCalledTimes(1);
    });
});
