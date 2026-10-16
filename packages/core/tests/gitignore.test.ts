import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { DBX_GITIGNORE_BLOCK, ensureDbxGitignore } from '../src/index.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-gitignore-'));
    dirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('ensureDbxGitignore', () => {
    it('appends the block when it is missing', () => {
        const dir = tmp();
        fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules\n');
        expect(ensureDbxGitignore(dir)).toBe(true);
        const content = fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8');
        expect(content.startsWith('node_modules\n')).toBe(true);
        expect(content).toContain(DBX_GITIGNORE_BLOCK);
    });

    it('is a no-op when .dbx is already mentioned', () => {
        const dir = tmp();
        fs.writeFileSync(path.join(dir, '.gitignore'), '.dbx/\n');
        expect(ensureDbxGitignore(dir)).toBe(false);
    });

    it('does nothing when there is no .gitignore', () => {
        expect(ensureDbxGitignore(tmp())).toBe(false);
    });
});
