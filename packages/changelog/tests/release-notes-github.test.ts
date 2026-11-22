import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const FAKE_GH = `import fs from 'node:fs';

const args = process.argv.slice(2);
const log = process.env.DBX_GH_LOG;
if (log) fs.appendFileSync(log, \`\${JSON.stringify(args)}\\n\`);

if (args[0] === 'auth' && args[1] === 'status') process.exit(0);
if (args[0] === 'release' && args[1] === 'list') {
    process.stdout.write(process.env.DBX_GH_RELEASES ?? '[]');
    process.exit(0);
}
process.stdout.write('');
`;

const ENV_KEYS = [
    'DBX_GH_BIN',
    'DBX_GH_LOG',
    'DBX_GH_RELEASES',
    'DBX_GH_MAX_RETRIES',
    'DBX_GH_RETRY_DELAY',
    'DBX_NO_GH',
] as const;

function git(cwd: string, ...args: string[]): void {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
}

const CHANGELOG = [
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

type ReleaseNotesUtils = typeof import('../src/utils/release-notes.js');

describe('release-notes published-release discovery', () => {
    const originalCwd = process.cwd();
    const saved = new Map<string, string | undefined>();
    let root: string;
    let logFile: string;
    let utils: ReleaseNotesUtils;

    beforeEach(async () => {
        for (const key of ENV_KEYS) saved.set(key, process.env[key]);
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-release-gh-'));
        const fake = path.join(root, 'fake-gh.mjs');
        fs.writeFileSync(fake, FAKE_GH);
        logFile = path.join(root, 'gh.log');
        process.env.DBX_GH_BIN = fake;
        process.env.DBX_GH_LOG = logFile;
        process.env.DBX_GH_MAX_RETRIES = '0';
        process.env.DBX_GH_RETRY_DELAY = '0';
        delete process.env.DBX_NO_GH;

        git(root, 'init');
        git(root, 'config', 'user.name', 'Test');
        git(root, 'config', 'user.email', 'test@example.com');
        fs.writeFileSync(
            path.join(root, 'package.json'),
            `${JSON.stringify({ name: 'x', version: '3.0.0' }, null, 4)}\n`
        );
        fs.writeFileSync(path.join(root, 'CHANGELOG.md'), CHANGELOG);
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'chore: init');
        git(root, 'tag', 'v3.0.0-beta.1');
        git(root, 'tag', 'v3.0.0-beta.2');
        git(root, 'tag', 'v2.9.0');
        process.chdir(root);

        // A fresh module per test keeps the gh availability probe isolated.
        vi.resetModules();
        utils = await import('../src/utils/release-notes.js');
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

    function calls(): string[][] {
        if (!fs.existsSync(logFile)) return [];
        return fs
            .readFileSync(logFile, 'utf8')
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
            .map(line => JSON.parse(line) as string[]);
    }

    it('asks for published releases without drafts', async () => {
        process.env.DBX_GH_RELEASES = JSON.stringify([{ tagName: 'v2.9.0' }]);
        const { publishedReleaseTags } = await import('../src/utils/git.js');

        expect(publishedReleaseTags()).toEqual(['v2.9.0']);
        const call = calls().find(args => args[0] === 'release' && args[1] === 'list');
        expect(call).toContain('--exclude-drafts');
        expect(call).toContain('tagName');
    });

    it('prefers published releases over newer local tags', () => {
        process.env.DBX_GH_RELEASES = JSON.stringify([{ tagName: 'v2.9.0' }]);

        // `includePrereleases` makes the choice observable: the published stable
        // release bounds the body, while the newer local beta tags would not.
        const notes = utils.releaseNotesFromGit('3.0.0', root, {
            group: true,
            includePrereleases: true,
        });

        expect(notes).toContain('- Stable change');
        expect(notes).toContain('- Beta two');
        expect(notes).toContain('- Beta one');
        expect(notes).not.toContain('- Previous stable');
    });

    it('falls back to local tags when no release is published', () => {
        process.env.DBX_GH_RELEASES = '[]';

        const notes = utils.releaseNotesFromGit('3.0.0', root, {
            group: true,
            includePrereleases: true,
        });

        expect(notes).toContain('- Stable change');
        expect(notes).not.toContain('- Beta two');
        expect(notes).not.toContain('- Previous stable');
    });
});
