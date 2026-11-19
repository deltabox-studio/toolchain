import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { runChangelog } from '../src/run.js';

function git(cwd: string, ...args: string[]): void {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
}

describe('runChangelog --release-notes', () => {
    const originalCwd = process.cwd();
    const originalNoGh = process.env.DBX_NO_GH;
    let dir: string;

    beforeEach(() => {
        process.env.DBX_NO_GH = '1';
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-release-notes-'));
        git(dir, 'init');
        git(dir, 'config', 'user.name', 'Test');
        git(dir, 'config', 'user.email', 'test@example.com');
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            `${JSON.stringify({ name: 'x', version: '1.0.0' }, null, 4)}\n`
        );
        fs.writeFileSync(path.join(dir, 'file.txt'), 'one\n');
        git(dir, 'add', '-A');
        git(dir, 'commit', '-m', 'chore: init');
        process.chdir(dir);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        if (originalNoGh === undefined) delete process.env.DBX_NO_GH;
        else process.env.DBX_NO_GH = originalNoGh;
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('emits only the release body to stdout when the toolchain is disabled', () => {
        const writes: string[] = [];
        const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((
            chunk: string | Uint8Array
        ) => {
            writes.push(String(chunk));
            return true;
        }) as typeof process.stdout.write);

        try {
            runChangelog(['--release-notes', '1.0.0'], undefined, { enabled: false });
        } finally {
            spy.mockRestore();
        }

        const output = writes.join('');
        expect(output).toContain('Release 1.0.0');
        expect(output).not.toContain('toolchain disabled; skipping changelog.');
        expect(output).not.toContain('dbx:');
    });
});
