import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { loadToolchainConfig } from '../packages/core/src/loader.js';

const root = path.resolve(__dirname, '..');
const workspace = path.join(root, 'packages', 'shared');
// `resolveDbxPlugin` loads the built ESM entry; a clean checkout has no dist yet.
const built = fs.existsSync(path.join(root, 'dist', 'vite.js'));

describe.skipIf(!built)('workspace plugin discovery', () => {
    it('detects the dbx plugin in a workspace Vite config', async () => {
        const loaded = await loadToolchainConfig(workspace, { tolerant: false });

        expect(loaded.plugin).toBe(true);
        expect(loaded.managed).toBe(true);
        expect(loaded.pluginPath).toBe(path.join(workspace, 'vite.config.ts'));
    });

    it('detects it after the root plugin config was loaded first', async () => {
        // Regression: the root config loads the ESM plugin entry first, so a
        // synchronous `require()` of it in a workspace config throws
        // `ERR_REQUIRE_ESM_RACE_CONDITION` and the workspace is not managed.
        await loadToolchainConfig(root, { tolerant: false });

        const loaded = await loadToolchainConfig(workspace, { tolerant: false });

        expect(loaded.plugin).toBe(true);
        expect(loaded.managed).toBe(true);
    });
});
