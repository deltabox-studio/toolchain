import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import type { ChangelogConfig } from '@deltabox/toolchain/shared';

import { runChangelog } from '../src/run.js';

function git(cwd: string, ...args: string[]): void {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function write(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`);
}

function versionOf(file: string): string {
    return (JSON.parse(fs.readFileSync(file, 'utf8')) as { version: string }).version;
}

describe('prerelease changelog versioning end to end', () => {
    const originalCwd = process.cwd();
    const originalNoGh = process.env.DBX_NO_GH;
    const config: ChangelogConfig = { versioning: { target: 'individual', prerelease: 'beta' } };
    let root: string;

    beforeEach(() => {
        process.env.DBX_NO_GH = '1';
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-prerelease-'));
        write(path.join(root, 'package.json'), {
            name: 'acme',
            version: '1.0.0',
            private: true,
            workspaces: ['packages/*'],
        });
        write(path.join(root, 'packages', 'a', 'package.json'), {
            name: '@acme/a',
            version: '0.1.0',
        });
        git(root, 'init');
        git(root, 'config', 'user.name', 'Test');
        git(root, 'config', 'user.email', 'test@example.com');
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'chore: init');

        fs.writeFileSync(path.join(root, 'packages', 'a', 'a.txt'), 'a\n');
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'feat(a): add a');
        process.chdir(root);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        if (originalNoGh === undefined) delete process.env.DBX_NO_GH;
        else process.env.DBX_NO_GH = originalNoGh;
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('adds the tag once and continues the counter on the next run', () => {
        runChangelog([], config);
        expect(versionOf(path.join(root, 'package.json'))).toBe('1.1.0-beta.0');
        expect(versionOf(path.join(root, 'packages', 'a', 'package.json'))).toBe('0.2.0-beta.0');

        fs.writeFileSync(path.join(root, 'packages', 'a', 'a.txt'), 'a2\n');
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'fix(a): follow up');

        runChangelog([], config);

        expect(versionOf(path.join(root, 'package.json'))).toBe('1.1.0-beta.1');
        expect(versionOf(path.join(root, 'packages', 'a', 'package.json'))).toBe('0.2.0-beta.1');
        const rootChangelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
        const aChangelog = fs.readFileSync(
            path.join(root, 'packages', 'a', 'CHANGELOG.md'),
            'utf8'
        );
        expect(rootChangelog).not.toContain('-beta-beta');
        expect(rootChangelog).toContain('## 1.1.0-beta.1');
        expect(aChangelog).toContain('## 0.2.0-beta.1');
    });
});
