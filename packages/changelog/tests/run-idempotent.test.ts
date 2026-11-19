import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import { runChangelog, runChangelogAsync } from '../src/run.js';

function git(cwd: string, ...args: string[]): string {
    return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function readVersion(dir: string): string {
    return (
        JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as { version: string }
    ).version;
}

function readChangelog(dir: string): string {
    return fs.readFileSync(path.join(dir, 'CHANGELOG.md'), 'utf8');
}

describe('runChangelog idempotency', () => {
    const originalCwd = process.cwd();
    const originalNoGh = process.env.DBX_NO_GH;
    let dir: string;

    beforeEach(() => {
        process.env.DBX_NO_GH = '1';
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-changelog-idempotent-'));
        git(dir, 'init');
        git(dir, 'config', 'user.name', 'Test');
        git(dir, 'config', 'user.email', 'test@example.com');
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            `${JSON.stringify({ name: 'x', version: '0.1.0' }, null, 4)}\n`
        );
        fs.writeFileSync(path.join(dir, 'file.txt'), 'one\n');
        git(dir, 'add', '-A');
        git(dir, 'commit', '-m', 'feat: first feature');
        process.chdir(dir);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        if (originalNoGh === undefined) delete process.env.DBX_NO_GH;
        else process.env.DBX_NO_GH = originalNoGh;
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('reports a friendly error outside a git repository', () => {
        const other = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-changelog-nogit-'));
        process.chdir(other);
        try {
            expect(() => runChangelog(['--dry-run'])).toThrow(/not a git repository/);
        } finally {
            process.chdir(originalCwd);
            fs.rmSync(other, { recursive: true, force: true });
        }
    });

    it('runs through the async (yielding) runner', async () => {
        let ticks = 0;
        const timer = setInterval(() => {
            ticks += 1;
        }, 10);
        try {
            await runChangelogAsync([]);
        } finally {
            clearInterval(timer);
        }

        // The pipeline yielded to the event loop, so a spinner can animate.
        expect(ticks).toBeGreaterThan(0);
        expect(readVersion(dir)).toBe('0.2.0');
        expect(readChangelog(dir).toLowerCase()).toContain('first feature');
    });

    it('runs the beforeVersion hook before writing the versions', () => {
        const seen: { version: string; previousVersion: string; atHook: string }[] = [];
        runChangelog([], undefined, {
            hooks: {
                beforeVersion: info => {
                    seen.push({
                        version: info.version,
                        previousVersion: info.previousVersion,
                        atHook: readVersion(dir),
                    });
                },
            },
        });

        expect(seen).toEqual([{ version: '0.2.0', previousVersion: '0.1.0', atHook: '0.1.0' }]);
        expect(readVersion(dir)).toBe('0.2.0');
    });

    it('aborts before writing when beforeVersion throws', () => {
        expect(() =>
            runChangelog([], undefined, {
                hooks: {
                    beforeVersion: () => {
                        throw new Error('stop the release');
                    },
                },
            })
        ).toThrow('stop the release');

        expect(readVersion(dir)).toBe('0.1.0');
    });

    it('rejects an async hook through the sync runner', () => {
        expect(() =>
            runChangelog([], undefined, {
                hooks: {
                    beforeVersion: async () => undefined,
                },
            })
        ).toThrow(/runChangelogAsync/);
    });

    it('awaits an async beforeVersion hook through the async runner', async () => {
        let resolved = false;
        await runChangelogAsync([], undefined, {
            hooks: {
                beforeVersion: async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    resolved = true;
                },
            },
        });

        expect(resolved).toBe(true);
        expect(readVersion(dir)).toBe('0.2.0');
    });

    it('runs the afterVersion hook after writing the versions', () => {
        const versions: string[] = [];
        runChangelog([], undefined, {
            hooks: {
                afterVersion: info => {
                    versions.push(info.version);
                    fs.writeFileSync(path.join(dir, 'after-version.txt'), info.version, 'utf8');
                },
            },
        });

        expect(versions).toEqual(['0.2.0']);
        expect(fs.readFileSync(path.join(dir, 'after-version.txt'), 'utf8')).toBe('0.2.0');
        expect(readVersion(dir)).toBe('0.2.0');
    });

    it('awaits an async afterVersion hook through the async runner', async () => {
        let resolved = false;
        await runChangelogAsync([], undefined, {
            hooks: {
                afterVersion: async () => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    resolved = true;
                },
            },
        });

        expect(resolved).toBe(true);
        expect(readVersion(dir)).toBe('0.2.0');
    });

    it('treats a second run with no new commits as a no-op', () => {
        runChangelog([]);
        expect(readVersion(dir)).toBe('0.2.0');
        const first = readChangelog(dir);
        expect(first.match(/first feature/gi)).toHaveLength(1);

        runChangelog([]);

        expect(readVersion(dir)).toBe('0.2.0');
        const second = readChangelog(dir);
        expect(second.match(/first feature/gi)).toHaveLength(1);
        expect(second).toBe(first);
    });

    it('reformats without a new entry when `all` has an empty range', () => {
        fs.writeFileSync(
            path.join(dir, 'CHANGELOG.md'),
            '# Changelog\n\n## 0.2.0 (November 2026)\n\n### Features\n\n- First feature\n'
        );
        runChangelog(['--processing-method', 'all', '--range', 'HEAD..HEAD']);

        expect(readVersion(dir)).toBe('0.1.0');
        const changelog = readChangelog(dir);
        expect(changelog.match(/^## /gm)).toHaveLength(1);
        expect(changelog).toContain('## 0.2.0 (November 2026)');
        // The current details formatting is applied to the existing entry.
        expect(changelog).toContain('<details>');
        expect(changelog).toContain('<summary>');
    });

    it('only scans commits after the last version commit', () => {
        runChangelog([]);
        git(dir, 'add', '-A');
        git(dir, 'commit', '-m', 'chore: version packages (0.2.0)');

        fs.writeFileSync(path.join(dir, 'file.txt'), 'two\n');
        git(dir, 'add', '-A');
        git(dir, 'commit', '-m', 'fix: second fix');

        runChangelog([]);

        expect(readVersion(dir)).toBe('0.2.1');
        const changelog = readChangelog(dir);
        expect(changelog.match(/first feature/gi)).toHaveLength(1);
        expect(changelog.match(/second fix/gi)).toHaveLength(1);
    });
});
