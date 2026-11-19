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
    return (JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')) as { version: string })
        .version;
}

describe('individual changelog versioning end to end', () => {
    const originalCwd = process.cwd();
    const originalNoGh = process.env.DBX_NO_GH;
    let root: string;

    beforeEach(() => {
        process.env.DBX_NO_GH = '1';
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-individual-'));
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
        write(path.join(root, 'packages', 'b', 'package.json'), {
            name: '@acme/b',
            version: '0.1.0',
        });
        write(path.join(root, 'dbx.config.json'), {
            toolchain: { ci: { changelog: { versioning: { target: 'individual' } } } },
        });
        git(root, 'init');
        git(root, 'config', 'user.name', 'Test');
        git(root, 'config', 'user.email', 'test@example.com');
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'chore: init');

        fs.writeFileSync(path.join(root, 'packages', 'a', 'a.txt'), 'a\n');
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'feat(a): add a');

        fs.writeFileSync(path.join(root, 'packages', 'b', 'b.txt'), 'b\n');
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'fix(b): fix b');

        process.chdir(root);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        if (originalNoGh === undefined) delete process.env.DBX_NO_GH;
        else process.env.DBX_NO_GH = originalNoGh;
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('bumps the root overall and each changed workspace on its own', () => {
        const config: ChangelogConfig = { versioning: { target: 'individual' } };

        runChangelog([], config);

        expect(versionOf(path.join(root, 'package.json'))).toBe('1.1.0');
        expect(versionOf(path.join(root, 'packages', 'a', 'package.json'))).toBe('0.2.0');
        expect(versionOf(path.join(root, 'packages', 'b', 'package.json'))).toBe('0.1.1');
        expect(fs.readFileSync(path.join(root, 'packages', 'a', 'CHANGELOG.md'), 'utf8')).toContain(
            '## 0.2.0'
        );
        expect(fs.readFileSync(path.join(root, 'packages', 'b', 'CHANGELOG.md'), 'utf8')).toContain(
            '## 0.1.1'
        );
    });

    it('does not re-count already-released commits or re-bump untouched workspaces', () => {
        const config: ChangelogConfig = { versioning: { target: 'individual' } };
        runChangelog([], config);
        const bChangelog = fs.readFileSync(
            path.join(root, 'packages', 'b', 'CHANGELOG.md'),
            'utf8'
        );

        fs.writeFileSync(path.join(root, 'packages', 'a', 'a.txt'), 'a2\n');
        git(root, 'add', 'packages/a/a.txt');
        git(root, 'commit', '-m', 'fix(a): second');

        runChangelog([], config);

        expect(versionOf(path.join(root, 'package.json'))).toBe('1.1.1');
        // The old `feat(a)` commit is already released: only the new `fix`
        // counts, so this is a patch, not another minor.
        expect(versionOf(path.join(root, 'packages', 'a', 'package.json'))).toBe('0.2.1');
        expect(versionOf(path.join(root, 'packages', 'b', 'package.json'))).toBe('0.1.1');
        expect(fs.readFileSync(path.join(root, 'packages', 'b', 'CHANGELOG.md'), 'utf8')).toBe(
            bChangelog
        );
        expect(fs.readFileSync(path.join(root, 'packages', 'a', 'CHANGELOG.md'), 'utf8')).toContain(
            '## 0.2.1'
        );
    });

    it('reads root and workspace package.json files written with a UTF-8 BOM', () => {
        const config: ChangelogConfig = { versioning: { target: 'individual' } };
        for (const file of [
            path.join(root, 'package.json'),
            path.join(root, 'packages', 'a', 'package.json'),
            path.join(root, 'packages', 'b', 'package.json'),
        ]) {
            fs.writeFileSync(file, `\uFEFF${fs.readFileSync(file, 'utf8')}`);
        }

        runChangelog([], config);

        expect(versionOf(path.join(root, 'package.json'))).toBe('1.1.0');
        expect(versionOf(path.join(root, 'packages', 'a', 'package.json'))).toBe('0.2.0');
        expect(versionOf(path.join(root, 'packages', 'b', 'package.json'))).toBe('0.1.1');
    });

    it('does not duplicate an untouched workspace entry in uniform mode', () => {
        const config: ChangelogConfig = { versioning: { target: 'uniform' } };
        runChangelog([], config);
        const bChangelog = fs.readFileSync(
            path.join(root, 'packages', 'b', 'CHANGELOG.md'),
            'utf8'
        );

        fs.writeFileSync(path.join(root, 'packages', 'a', 'a.txt'), 'a2\n');
        git(root, 'add', 'packages/a/a.txt');
        git(root, 'commit', '-m', 'fix(a): second');

        runChangelog([], config);

        expect(versionOf(path.join(root, 'package.json'))).toBe('1.1.1');
        expect(versionOf(path.join(root, 'packages', 'a', 'package.json'))).toBe('1.1.1');
        expect(versionOf(path.join(root, 'packages', 'b', 'package.json'))).toBe('1.1.1');
        expect(fs.readFileSync(path.join(root, 'packages', 'b', 'CHANGELOG.md'), 'utf8')).toBe(
            bChangelog
        );
    });
});
