import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { runGuard, viteCommands } from '../src/cli/index.js';

describe('run self-reference pruning', () => {
    const cwd = process.cwd();

    afterEach(() => {
        delete process.env.DBX_RUN_GUARD;
    });

    it('only keys `run` commands', () => {
        expect(runGuard(['sync', '--check'], cwd)).toBeUndefined();
        expect(runGuard(['run', '-r', 'typecheck'], cwd)).toBe(`${path.resolve(cwd)}|-r typecheck`);
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
