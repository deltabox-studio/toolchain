import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { findConfigFile, loadToolchainConfig } from '../src/loader.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-load-'));
}

describe('loadToolchainConfig', () => {
    it('finds and loads a JSON config + resolves tokens', async () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.json'),
            JSON.stringify({
                toolchain: {
                    project: {
                        name: 'acme',
                        scope: '@acme',
                        repo: 'https://github.com/acme/app',
                    },
                    changelog: { branches: { main: 'trunk', dev: 'develop' } },
                },
            })
        );
        expect(findConfigFile(cwd)).toBe(path.join(cwd, 'dbx.config.json'));

        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.config.project?.name).toBe('acme');
        expect(loaded.tokens.name).toBe('acme');
        expect(loaded.tokens.scope).toBe('@acme');
        expect(loaded.tokens.repoSlug).toBe('acme/app');
        expect(loaded.tokens.mainBranch).toBe('trunk');
    });

    it('returns defaults when no config file exists', async () => {
        const loaded = await loadToolchainConfig(tmp());
        expect(loaded.config).toEqual({});
        expect(loaded.path).toBeUndefined();
        expect(loaded.tokens.name).toBe('app');
        expect(loaded.tokens.packageManager).toBe('yarn');
    });

    it('runs the afterLoad hook for a JS config', async () => {
        const cwd = tmp();
        (globalThis as Record<string, unknown>).__dbxHook = undefined;
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.mjs'),
            `export default { toolchain: { hooks: { afterLoad: () => { globalThis.__dbxHook = true; } } } };\n`
        );
        await loadToolchainConfig(cwd);
        expect((globalThis as Record<string, unknown>).__dbxHook).toBe(true);
    });
});
