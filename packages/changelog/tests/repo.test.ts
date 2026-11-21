import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { repoSlug } from '../src/utils/git.js';
import { discoverWorkspaceDirs, globWorkspaces } from '../src/utils/repo.js';

describe('discoverWorkspaceDirs', () => {
    it('supports Bun object-form workspaces', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-bun-ws-'));
        try {
            fs.writeFileSync(
                path.join(root, 'package.json'),
                JSON.stringify({ workspaces: { packages: ['packages/*'] } })
            );
            fs.mkdirSync(path.join(root, 'packages/a'), { recursive: true });
            fs.writeFileSync(path.join(root, 'packages/a/package.json'), '{"name":"a"}');
            const dirs = discoverWorkspaceDirs(root);
            expect(dirs).toEqual(expect.arrayContaining([root, path.join(root, 'packages/a')]));
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('excludes negated workspace globs', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-negated-ws-'));
        try {
            fs.writeFileSync(
                path.join(root, 'package.json'),
                JSON.stringify({ workspaces: ['packages/*', '!packages/private-*'] })
            );
            for (const name of ['public', 'private-x']) {
                fs.mkdirSync(path.join(root, 'packages', name), { recursive: true });
                fs.writeFileSync(path.join(root, 'packages', name, 'package.json'), '{}');
            }
            const dirs = discoverWorkspaceDirs(root);
            expect(dirs).toEqual(
                expect.arrayContaining([root, path.join(root, 'packages', 'public')])
            );
            expect(dirs).not.toContain(path.join(root, 'packages', 'private-x'));
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('globWorkspaces', () => {
    it('removes excluded matches from the included set', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-glob-ws-'));
        try {
            for (const name of ['a', 'b', 'private-c']) {
                fs.mkdirSync(path.join(root, 'packages', name), { recursive: true });
            }
            expect(globWorkspaces(['packages/*', '!packages/private-*'], root).sort()).toEqual([
                path.join(root, 'packages', 'a'),
                path.join(root, 'packages', 'b'),
            ]);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

describe('repoSlug', () => {
    const originalCwd = process.cwd();

    afterEach(() => {
        process.chdir(originalCwd);
    });

    it('falls back to the repository root package.json from a nested workspace', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-repo-slug-'));
        try {
            fs.writeFileSync(
                path.join(root, 'package.json'),
                JSON.stringify({
                    name: 'myapp',
                    repository: { url: 'https://github.com/myapp/toolchain.git' },
                })
            );
            const nested = path.join(root, 'packages', 'app');
            fs.mkdirSync(nested, { recursive: true });
            fs.writeFileSync(
                path.join(nested, 'package.json'),
                JSON.stringify({ name: '@org/app' })
            );
            execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' });
            process.chdir(nested);

            expect(repoSlug()).toBe('myapp/toolchain');
        } finally {
            process.chdir(originalCwd);
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    it('keeps dots in the repository name', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-repo-slug-dot-'));
        try {
            fs.writeFileSync(
                path.join(root, 'package.json'),
                JSON.stringify({
                    name: 'next',
                    repository: { url: 'https://github.com/vercel/next.js.git' },
                })
            );
            process.chdir(root);

            expect(repoSlug()).toBe('vercel/next.js');
        } finally {
            process.chdir(originalCwd);
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});
