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

function readVersion(dir: string): string {
    return (
        JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as { version: string }
    ).version;
}

function readChangelog(dir: string): string {
    return fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8');
}

/** Version headings in file order (newest first in a changelog). */
function headings(changelog: string): string[] {
    return [...changelog.matchAll(/^##\s+(\d+\.\d+\.\d+)/gm)].map(match => match[1]!);
}

describe('runChangelog with versioning disabled', () => {
    const originalCwd = process.cwd();
    const originalNoGh = process.env.DBX_NO_GH;
    let dir: string;

    beforeEach(() => {
        process.env.DBX_NO_GH = '1';
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-changelog-no-versioning-'));
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

    it('continues from the newest changelog heading on every run', () => {
        const config: ChangelogConfig = { versioning: false };

        fs.writeFileSync(path.join(dir, 'file.txt'), 'two\n');
        git(dir, 'add', '-A');
        git(dir, 'commit', '-m', 'feat: first feature');
        runChangelog([], config);

        expect(readVersion(dir)).toBe('1.0.0');
        expect(headings(readChangelog(dir))).toEqual(['1.1.0']);
        expect(readChangelog(dir)).toContain('## 1.1.0');

        fs.writeFileSync(path.join(dir, 'file.txt'), 'three\n');
        git(dir, 'add', '-A');
        git(dir, 'commit', '-m', 'fix: second fix');
        runChangelog([], config);

        expect(readVersion(dir)).toBe('1.0.0');
        // Seeded from the existing heading instead of the unchanged
        // package.json version: the headline moves forward and stays newest.
        expect(headings(readChangelog(dir))).toEqual(['1.1.1', '1.1.0']);
        const changelog = readChangelog(dir);
        expect(changelog.indexOf('## 1.1.1')).toBeLessThan(changelog.indexOf('## 1.1.0'));
        expect(changelog.match(/first feature/gi)).toHaveLength(1);
        expect(changelog.match(/second fix/gi)).toHaveLength(1);
    });
});
