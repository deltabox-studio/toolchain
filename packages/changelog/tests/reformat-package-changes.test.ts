import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { reformatChangelogContent } from '../src/utils/reformat.js';

const originalCwd = process.cwd();
const dirs: string[] = [];

function write(root: string, relative: string, content: string): void {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

function git(root: string, ...args: string[]): void {
    execFileSync('git', args, { cwd: root, stdio: 'ignore' });
}

const CHANGELOG = [
    '# Changelog',
    '',
    '## 1.1.0 (January 2026)',
    '',
    '<!-- release:start -->',
    '',
    '### Package changes',
    '',
    '#### Added',
    '- `myapp`',
    '  - `left-pad` `1.3.0`',
    '',
    '<!-- release:end -->',
    '',
    '## 1.0.0 (January 2026)',
    '',
    '- Init',
    '',
].join('\n');

function fixture(tagNewest: boolean): void {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-reformat-packages-'));
    dirs.push(root);
    write(
        root,
        'package.json',
        JSON.stringify({
            name: 'myapp',
            version: '1.0.0',
            private: true,
            workspaces: ['packages/*'],
        })
    );
    write(root, 'packages/a/package.json', JSON.stringify({ name: '@org/a', version: '1.0.0' }));
    write(root, 'packages/a/index.ts', 'export {};\n');
    write(root, 'CHANGELOG.md', CHANGELOG);
    git(root, 'init');
    git(root, 'config', 'user.name', 'Test');
    git(root, 'config', 'user.email', 'test@example.com');
    git(root, 'add', '-A');
    git(root, 'commit', '-m', 'chore: init');
    git(root, 'tag', 'v1.0.0');
    if (tagNewest) git(root, 'tag', 'v1.1.0');
    write(
        root,
        'package.json',
        JSON.stringify({
            name: 'myapp',
            version: '1.0.0',
            private: true,
            workspaces: ['packages/*'],
            dependencies: { 'left-pad': '1.3.0' },
        })
    );
    process.chdir(root);
}

afterEach(() => {
    process.chdir(originalCwd);
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('reformat package changes', () => {
    it('regenerates the newest unreleased entry footer from the working tree', () => {
        fixture(false);

        const out = reformatChangelogContent(CHANGELOG, undefined, true, true);

        expect(out).toContain('### Package changes');
        expect(out).toContain('`left-pad` `1.3.0`');
        const newest = out.indexOf('## 1.1.0');
        const footer = out.indexOf('### Package changes');
        const previous = out.indexOf('## 1.0.0');
        expect(newest).toBeGreaterThanOrEqual(0);
        expect(footer).toBeGreaterThan(newest);
        expect(previous).toBeGreaterThan(footer);
    });

    it('does not leak working-tree changes into a released newest entry', () => {
        fixture(true);

        const out = reformatChangelogContent(CHANGELOG, undefined, true, true);

        expect(out).not.toContain('### Package changes');
        expect(out).not.toContain('left-pad');
    });
});
