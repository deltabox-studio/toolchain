import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ChangelogConfig } from '@deltabox/toolchain/shared';

import { runChangelog } from '../src/run.js';

function git(cwd: string, ...args: string[]): void {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function capture(run: () => void): string {
    const writes: string[] = [];
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((
        chunk: string | Uint8Array
    ) => {
        writes.push(String(chunk));
        return true;
    }) as typeof process.stdout.write);
    try {
        run();
    } finally {
        spy.mockRestore();
    }
    return writes.join('');
}

const GROUPED_CHANGELOG = [
    '# Changelog',
    '',
    '## 3.0.0 (November 2026)',
    '',
    '- Stable change',
    '',
    '## 3.0.0-beta.2 (November 2026)',
    '',
    '- Beta two',
    '',
    '## 3.0.0-beta.1 (November 2026)',
    '',
    '- Beta one',
    '',
    '## 2.9.0 (October 2026)',
    '',
    '- Previous stable',
    '',
].join('\n');

describe('runChangelog --release-body', () => {
    const originalCwd = process.cwd();
    const originalNoGh = process.env.DBX_NO_GH;
    let dir: string;

    function releaseBody(config: ChangelogConfig | undefined, argv: string[]): string {
        return capture(() => {
            runChangelog(['--release-body', '3.0.0', ...argv], config, { enabled: false });
        });
    }

    beforeEach(() => {
        process.env.DBX_NO_GH = '1';
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-release-notes-'));
        git(dir, 'init');
        git(dir, 'config', 'user.name', 'Test');
        git(dir, 'config', 'user.email', 'test@example.com');
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            `${JSON.stringify({ name: 'x', version: '3.0.0' }, null, 4)}\n`
        );
        fs.writeFileSync(path.join(dir, 'file.txt'), 'one\n');
        fs.writeFileSync(path.join(dir, 'CHANGELOG.md'), GROUPED_CHANGELOG);
        git(dir, 'add', '-A');
        git(dir, 'commit', '-m', 'chore: init');
        git(dir, 'tag', 'v3.0.0-beta.1');
        git(dir, 'tag', 'v3.0.0-beta.2');
        git(dir, 'tag', 'v2.9.0');
        process.chdir(dir);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        if (originalNoGh === undefined) delete process.env.DBX_NO_GH;
        else process.env.DBX_NO_GH = originalNoGh;
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('emits only the release body to stdout when the toolchain is disabled', () => {
        fs.rmSync(path.join(dir, 'CHANGELOG.md'));
        const output = capture(() => {
            runChangelog(['--release-body', '1.0.0'], undefined, { enabled: false });
        });

        expect(output).toContain('Release 1.0.0');
        expect(output).not.toContain('toolchain disabled; skipping changelog.');
        expect(output).not.toContain('dbx:');
    });

    it('uses the configured grouping', () => {
        const output = releaseBody({ release: { group: true } }, []);

        expect(output).toContain('- Stable change');
        expect(output).toContain('- Beta two');
        expect(output).toContain('- Beta one');
        expect(output).not.toContain('- Previous stable');
    });

    it('keeps the default boundary without grouping', () => {
        const output = releaseBody({}, []);

        expect(output).toContain('- Stable change');
        expect(output).not.toContain('- Beta two');
        expect(output).not.toContain('- Previous stable');
    });

    it('lets --release-group enable grouping for one run', () => {
        const output = releaseBody({}, ['--release-group']);

        expect(output).toContain('- Beta two');
        expect(output).toContain('- Beta one');
    });

    it('lets --no-release-group disable configured grouping', () => {
        const output = releaseBody({ release: { group: true } }, ['--no-release-group']);

        expect(output).toContain('- Stable change');
        expect(output).not.toContain('- Beta two');
    });

    it('lets --release-include-prereleases bound the grouped body', () => {
        const output = releaseBody({ release: { group: true } }, ['--release-include-prereleases']);

        expect(output).toContain('- Stable change');
        expect(output).not.toContain('- Beta two');
    });

    it('honours a configured since boundary', () => {
        const output = releaseBody({ release: { group: true, since: 'v3.0.0-beta.1' } }, []);

        expect(output).toContain('- Stable change');
        expect(output).toContain('- Beta two');
        expect(output).not.toContain('- Beta one');
    });

    it('lets --release-since override the boundary', () => {
        const output = releaseBody({ release: { group: true } }, [
            '--release-since',
            'v3.0.0-beta.1',
        ]);

        expect(output).toContain('- Stable change');
        expect(output).toContain('- Beta two');
        expect(output).not.toContain('- Beta one');
    });

    it('groups everything on a first release with no tags', () => {
        for (const tag of ['v3.0.0-beta.1', 'v3.0.0-beta.2', 'v2.9.0']) {
            git(dir, 'tag', '-d', tag);
        }

        const output = releaseBody({ release: { group: true } }, []);

        expect(output).toContain('- Stable change');
        expect(output).toContain('- Beta two');
        expect(output).toContain('- Beta one');
        expect(output).toContain('- Previous stable');
    });

    it('reads the root changelog with individual package changelogs', () => {
        const workspace = path.join(dir, 'packages', 'a');
        fs.mkdirSync(workspace, { recursive: true });
        fs.writeFileSync(
            path.join(workspace, 'package.json'),
            `${JSON.stringify({ name: '@org/a', version: '3.0.0' }, null, 4)}\n`
        );
        fs.writeFileSync(
            path.join(workspace, 'CHANGELOG.md'),
            '# Changelog\n\n## 3.0.0 (November 2026)\n\n- Package-only change\n'
        );

        const output = releaseBody(
            { versioning: { target: 'individual' }, release: { group: true } },
            []
        );

        expect(output).toContain('- Stable change');
        expect(output).toContain('- Beta two');
        expect(output).not.toContain('- Package-only change');
    });

    it('is idempotent across reruns', () => {
        const config: ChangelogConfig = { release: { group: true } };
        const first = releaseBody(config, []);
        const second = releaseBody(config, []);

        expect(second).toBe(first);
    });
});
