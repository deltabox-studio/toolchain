import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { runGuard, viteCommands, vpAllowsNpx } from '../src/cli/index.js';

describe('run self-reference pruning', () => {
    const cwd = process.cwd();

    afterEach(() => {
        delete process.env.DBX_RUN_GUARD;
    });

    it('only keys `run` commands', () => {
        expect(runGuard(['sync', '--check'], cwd)).toBeUndefined();
        expect(runGuard(['run', '-r', 'typecheck'], cwd)).toBe(`${path.resolve(cwd)}|-r typecheck`);
    });

    it('allows the npx fallback only for bootstrap commands', () => {
        expect(vpAllowsNpx('create')).toBe(true);
        expect(vpAllowsNpx('migrate')).toBe(true);
        expect(vpAllowsNpx('dev')).toBe(false);
        expect(vpAllowsNpx(undefined)).toBe(false);
    });

    it('returns without running when the guard already matches', async () => {
        const args = ['run', '-r', 'typecheck'];
        process.env.DBX_RUN_GUARD = runGuard(args, cwd);
        const generic = viteCommands().find(command => command.name === 'vite');
        await expect(
            generic?.run({ args, cwd }, { cwd, projectType: 'project', config: {}, tokens: {} })
        ).resolves.toBeUndefined();
    });
});
