import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ChangelogConfig } from '@deltabox/toolchain/shared';

import { runChangelog } from '../src/run.js';
import { changesetsCommand } from '../src/utils/provider.js';

const FAKE_CHANGESET = `import fs from 'node:fs';

const marker = process.env.DBX_CHANGESET_MARKER;
if (marker) fs.writeFileSync(marker, JSON.stringify(process.argv.slice(2)));
`;

const ENV_KEYS = ['DBX_NO_GH', 'DBX_CHANGESET_BIN', 'DBX_CHANGESET_MARKER'] as const;

function git(cwd: string, ...args: string[]): void {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function write(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`);
}

describe('changelog versioning providers', () => {
    const originalCwd = process.cwd();
    const saved = new Map<string, string | undefined>();
    let root: string;
    let marker: string;
    let fake: string;

    beforeEach(() => {
        for (const key of ENV_KEYS) saved.set(key, process.env[key]);
        process.env.DBX_NO_GH = '1';

        root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-provider-'));
        marker = path.join(root, 'changeset-args.json');
        fake = path.join(root, 'fake-changeset.mjs');
        fs.writeFileSync(fake, FAKE_CHANGESET);
        process.env.DBX_CHANGESET_BIN = fake;
        process.env.DBX_CHANGESET_MARKER = marker;

        write(path.join(root, 'package.json'), {
            name: 'app',
            version: '1.0.0',
            private: true,
            workspaces: ['packages/*'],
        });
        write(path.join(root, 'packages', 'a', 'package.json'), {
            name: '@org/a',
            version: '0.1.0',
        });
        write(path.join(root, '.changeset', 'config.json'), {});
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
        for (const key of ENV_KEYS) {
            const value = saved.get(key);
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
        fs.rmSync(root, { recursive: true, force: true });
    });

    function args(): string[] | undefined {
        return fs.existsSync(marker)
            ? (JSON.parse(fs.readFileSync(marker, 'utf8')) as string[])
            : undefined;
    }

    it('runs the @changesets/cli package, not the unrelated `changeset` package', () => {
        expect(changesetsCommand({})).toMatchObject({
            command: 'npx',
            args: ['--yes', '@changesets/cli', 'version'],
        });
    });

    it('runs @changesets/cli instead of the built-in pipeline', () => {
        runChangelog([], { versioning: { provider: 'changesets' } });

        expect(args()).toEqual(['version']);
        expect(fs.existsSync(path.join(root, 'CHANGELOG.md'))).toBe(false);
        expect(fs.existsSync(path.join(root, 'packages', 'a', 'CHANGELOG.md'))).toBe(false);
    });

    it('runs changesets once when a versioned target selects it', () => {
        const config: ChangelogConfig = {
            versioning: {
                target: 'individual',
                provider: [{ target: 'packages/a', options: 'changesets' }],
            },
        };

        runChangelog([], config);

        expect(args()).toEqual(['version']);
    });

    it('explains a changesets dry-run without writing anything', () => {
        const writes: string[] = [];
        const spy = vi.spyOn(process.stdout, 'write').mockImplementation(((
            chunk: string | Uint8Array
        ) => {
            writes.push(String(chunk));
            return true;
        }) as typeof process.stdout.write);

        try {
            runChangelog(['--dry-run'], { versioning: { provider: 'changesets' } });
        } finally {
            spy.mockRestore();
        }

        expect(args()).toBeUndefined();
        expect(fs.existsSync(path.join(root, 'CHANGELOG.proposed.md'))).toBe(false);
        expect(writes.join('')).toContain('changesets');
    });

    it('fails with a setup hint when changesets is not initialized', () => {
        fs.rmSync(path.join(root, '.changeset'), { recursive: true, force: true });

        expect(() => runChangelog([], { versioning: { provider: 'changesets' } })).toThrow(
            /\.changeset\/config\.json/
        );
        expect(args()).toBeUndefined();
    });

    it('rejects an unknown provider id instead of falling back silently', () => {
        expect(() => runChangelog([], { versioning: { provider: 'typo-provider' } })).toThrow(
            /Unknown changelog provider "typo-provider"/
        );
        expect(args()).toBeUndefined();
    });

    it('rejects an empty provider id', () => {
        expect(() => runChangelog([], { versioning: { provider: '' } })).toThrow(
            /Unknown changelog provider ""/
        );
    });

    it('rejects a malformed provider object', () => {
        expect(() =>
            runChangelog([], {
                versioning: { provider: { id: 'missing-run' } as never },
            })
        ).toThrow(/run\(ctx\)/);
    });

    it('rejects a plain provider array', () => {
        expect(() =>
            runChangelog([], {
                versioning: { provider: ['default', 'changesets'] as never },
            })
        ).toThrow(/plain array/);
    });

    it('uses a custom provider object for the root entry', () => {
        runChangelog([], {
            versioning: {
                provider: {
                    id: 'custom',
                    run: ctx => `custom body (${ctx.records.length} commits)`,
                },
            },
        });

        const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
        expect(changelog).toContain('custom body (2 commits)');
        expect(args()).toBeUndefined();
    });

    it('uses a custom provider callback for the root entry', () => {
        runChangelog([], {
            versioning: { provider: ctx => `callback body (${ctx.records.length})` },
        });

        const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
        expect(changelog).toContain('callback body (2)');
    });

    it('uses a targeted callback provider for one workspace', () => {
        runChangelog([], {
            versioning: {
                target: 'individual',
                provider: [{ target: 'packages/a', options: () => 'workspace provider body' }],
            },
        });

        const workspace = fs.readFileSync(path.join(root, 'packages', 'a', 'CHANGELOG.md'), 'utf8');
        const rootChangelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
        expect(workspace).toContain('workspace provider body');
        expect(rootChangelog).not.toContain('workspace provider body');
    });
});
