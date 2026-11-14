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

describe('changelog intro/outro', () => {
    const originalCwd = process.cwd();
    const originalNoGh = process.env.DBX_NO_GH;
    let root: string;

    beforeEach(() => {
        process.env.DBX_NO_GH = '1';
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-intro-outro-'));
        write(path.join(root, 'package.json'), {
            name: 'acme',
            version: '2.0.0',
            private: true,
            workspaces: ['packages/*'],
        });
        write(path.join(root, 'packages', 'a', 'package.json'), {
            name: '@acme/a',
            version: '1.0.0',
        });
        write(path.join(root, 'packages', 'b', 'package.json'), {
            name: '@acme/b',
            version: '1.0.0',
        });
        git(root, 'init');
        git(root, 'config', 'user.name', 'Test');
        git(root, 'config', 'user.email', 'test@example.com');
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'chore: init');

        for (const dir of ['packages/a', 'packages/b']) {
            fs.writeFileSync(path.join(root, dir, 'file.txt'), 'x\n');
        }
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

    it('adds target-scoped content/file text before and after the entry', () => {
        fs.writeFileSync(path.join(root, 'a-outro.md'), 'A OUTRO\n');
        const config: ChangelogConfig = {
            versioning: { target: 'individual' },
            intro: [
                { target: '.', content: 'ROOT INTRO' },
                { target: 'packages/a', content: 'A INTRO' },
            ],
            outro: [{ target: 'packages/a', file: 'a-outro.md' }],
        };
        runChangelog([], config);

        const rootChangelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
        const aChangelog = fs.readFileSync(path.join(root, 'packages/a/CHANGELOG.md'), 'utf8');
        expect(rootChangelog).toContain('ROOT INTRO');
        expect(rootChangelog).not.toContain('A INTRO');
        expect(rootChangelog).not.toContain('A OUTRO');
        expect(aChangelog).toContain('A INTRO');
        expect(aChangelog).toContain('A OUTRO');
        expect(aChangelog.indexOf('A INTRO')).toBeLessThan(aChangelog.indexOf('### New features'));
        expect(aChangelog.indexOf('A OUTRO')).toBeGreaterThan(
            aChangelog.indexOf('### New features')
        );
    });

    it('honours include/exclude and the versioning workspace scope', () => {
        const config: ChangelogConfig = {
            versioning: { target: 'individual', workspaces: ['packages/a'] },
            intro: [
                { include: 'packages/*', content: 'PACKAGES INTRO' },
                { exclude: 'packages/a', content: 'NOT A' },
            ],
        };
        runChangelog([], config);

        const aChangelog = fs.readFileSync(path.join(root, 'packages/a/CHANGELOG.md'), 'utf8');
        expect(aChangelog).toContain('PACKAGES INTRO');
        expect(aChangelog).not.toContain('NOT A');
        // `packages/b` is outside the versioning workspaces list: no changelog.
        expect(fs.existsSync(path.join(root, 'packages/b/CHANGELOG.md'))).toBe(false);
    });

    it('applies targeted prerelease and bump options', () => {
        const config: ChangelogConfig = {
            versioning: {
                target: 'individual',
                prerelease: [{ target: 'packages/a', options: 'beta' }],
                bump: { minor: [{ target: 'packages/a', options: true }] },
            },
        };
        runChangelog([], config);

        expect(versionOf(path.join(root, 'package.json'))).toBe('2.1.0');
        expect(versionOf(path.join(root, 'packages/a/package.json'))).toBe('1.1.0-beta.0');
    });

    it('accepts --intro and --outro-file from the CLI', () => {
        fs.writeFileSync(path.join(root, 'outro.md'), 'CLI OUTRO\n');
        runChangelog(['--intro', 'CLI INTRO', '--outro-file', 'outro.md']);
        const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
        expect(changelog).toContain('CLI INTRO');
        expect(changelog).toContain('CLI OUTRO');
        expect(changelog.indexOf('CLI INTRO')).toBeLessThan(changelog.indexOf('### New features'));
    });
});
