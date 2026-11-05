import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { discoverWorkspaceDirs } from '../src/utils/repo.js';

describe('discoverWorkspaceDirs', () => {
    it('supports Bun object-form workspaces', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-bun-ws-'));
        try {
            fs.writeFileSync(
                path.join(root, 'package.json'),
                JSON.stringify({ workspaces: { packages: ['packages/*'] } })
            );
            fs.mkdirSync(path.join(root, 'packages/a'), { recursive: true });
            fs.writeFileSync(path.join(root, 'packages/a/package.json'), '{"name":"a"}');
            const dirs = discoverWorkspaceDirs(root);
            expect(dirs).toEqual(expect.arrayContaining([root, path.join(root, 'packages/a')]));
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});
