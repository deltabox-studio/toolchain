import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
    collectDependencies,
    diffDependencies,
    packageChangesForCurrent,
    readCurrentDependencies,
    renderPackageChanges,
} from '../src/utils/packages.js';

/** A default-catalog map entry (`name` + version range). */
function catalog(...entries: [string, string][]): Map<string, { name: string; version: string }> {
    return new Map(entries.map(([name, version]) => [name, { name, version }]));
}

describe('dependency maps', () => {
    it('scopes dependencies to the package.json name', () => {
        const map = collectDependencies(
            [
                { name: '@org/app', devDependencies: { vite: '^5.4.14' } },
                { name: '@org/lib', devDependencies: { vite: 'catalog:' } },
            ],
            catalog(['vite', '^8.3.0']),
            '@org/root'
        );
        expect([...map.values()].filter(entry => entry.name === 'vite')).toEqual([
            { scope: '@org/app', name: 'vite', version: '^5.4.14' },
            { scope: '@org/lib', name: 'vite', version: 'catalog:' },
            { scope: '@org/root', name: 'vite', version: '^8.3.0' },
        ]);
    });

    it('reports a workspace-specific pin as a scoped update', () => {
        const prev = collectDependencies(
            [{ name: '@org/app', devDependencies: { vite: '^5.4.14' } }],
            new Map(),
            '@org/root'
        );
        const next = collectDependencies(
            [{ name: '@org/app', devDependencies: { vite: '^5.4.15' } }],
            new Map(),
            '@org/root'
        );
        expect(renderPackageChanges(diffDependencies(prev, next))).toContain(
            '- `@org/app`\n  - `vite` `^5.4.14` → `^5.4.15`'
        );
    });

    it('groups multiple dependency changes under one list item', () => {
        const prev = collectDependencies(
            [{ name: '@org/app', dependencies: { vite: '^5', react: '^18' } }],
            new Map(),
            '@org/root'
        );
        const next = collectDependencies(
            [{ name: '@org/app', dependencies: { vite: '^6', react: '^19' } }],
            new Map(),
            '@org/root'
        );
        const out = renderPackageChanges(diffDependencies(prev, next));
        expect(out).toContain('- `@org/app`\n  - `react` `^18` → `^19`\n  - `vite` `^5` → `^6`');
        expect(out.match(/^- `@org\/app`$/gm)).toHaveLength(1);
    });

    it('is independent of package iteration order', () => {
        const catalogMap = catalog(['vite', '^8.3.0']);
        const app = { name: '@org/app', devDependencies: { vite: '^5.4.14' } };
        const lib = { name: '@org/lib', devDependencies: { vite: 'catalog:' } };
        const forward = collectDependencies([app, lib], catalogMap, '@org/root');
        const reverse = collectDependencies([lib, app], catalogMap, '@org/root');
        expect(diffDependencies(forward, reverse)).toEqual({
            added: [],
            updated: [],
            removed: [],
        });
    });

    it('reports a catalog bump under the root package name only', () => {
        const prev = collectDependencies(
            [{ name: '@org/lib', devDependencies: { vite: 'catalog:' } }],
            catalog(['vite', '^8.3.0']),
            '@org/root'
        );
        const next = collectDependencies(
            [{ name: '@org/lib', devDependencies: { vite: 'catalog:' } }],
            catalog(['vite', '^8.4.0']),
            '@org/root'
        );
        expect(diffDependencies(prev, next).updated).toEqual([
            { scope: '@org/root', name: 'vite', from: '^8.3.0', to: '^8.4.0' },
        ]);
    });

    it('still tracks packages that are not in the catalog', () => {
        const map = collectDependencies([
            { name: '@org/app', devDependencies: { prettier: '^3' } },
        ]);
        expect([...map.values()]).toContainEqual({
            scope: '@org/app',
            name: 'prettier',
            version: '^3',
        });
    });
});

describe('catalog sources', () => {
    const originalCwd = process.cwd();
    const dirs: string[] = [];

    function fixture(pkg: Record<string, unknown>): string {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-catalogs-'));
        dirs.push(root);
        fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(pkg, null, 4));
        fs.mkdirSync(path.join(root, 'packages', 'app'), { recursive: true });
        fs.writeFileSync(
            path.join(root, 'packages', 'app', 'package.json'),
            JSON.stringify({ name: '@org/app', dependencies: { react: 'catalog:' } }, null, 4)
        );
        return root;
    }

    function git(root: string, ...args: string[]): void {
        execFileSync('git', args, { cwd: root, stdio: 'ignore' });
    }

    function commitAndTag(root: string): void {
        git(root, 'init');
        git(root, 'config', 'user.name', 'Test');
        git(root, 'config', 'user.email', 'test@example.com');
        git(root, 'add', '-A');
        git(root, 'commit', '-m', 'chore: init');
        git(root, 'tag', 'v1.0.0');
        process.chdir(root);
    }

    afterEach(() => {
        process.chdir(originalCwd);
        for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
    });

    it('reads pnpm catalogs and reports their range change', () => {
        const root = fixture({ name: 'myapp', version: '1.0.0', workspaces: ['packages/*'] });
        fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'catalog:\n  react: ^19.0.0\n');
        commitAndTag(root);

        expect([...readCurrentDependencies().values()]).toContainEqual({
            scope: 'myapp',
            name: 'react',
            version: '^19.0.0',
        });

        fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'catalog:\n  react: ^19.1.0\n');
        expect(packageChangesForCurrent('1.0.0')).toContain(
            '- `myapp`\n  - `react` `^19.0.0` → `^19.1.0`'
        );
    });

    it('reads Bun catalogs and named catalogs and reports their range change', () => {
        const root = fixture({
            name: 'myapp',
            version: '1.0.0',
            workspaces: {
                packages: ['packages/*'],
                catalog: { react: '^19.0.0' },
                catalogs: { legacy: { react: '^17.0.0' } },
            },
        });
        commitAndTag(root);

        const entries = [...readCurrentDependencies().values()];
        expect(entries).toContainEqual({ scope: 'myapp', name: 'react', version: '^19.0.0' });
        expect(entries).toContainEqual({
            scope: 'myapp',
            name: 'legacy:react',
            version: '^17.0.0',
        });

        fs.writeFileSync(
            path.join(root, 'package.json'),
            JSON.stringify(
                {
                    name: 'myapp',
                    version: '1.0.0',
                    workspaces: {
                        packages: ['packages/*'],
                        catalog: { react: '^19.2.0' },
                        catalogs: { legacy: { react: '^17.0.0' } },
                    },
                },
                null,
                4
            )
        );
        expect(packageChangesForCurrent('1.0.0')).toContain(
            '- `myapp`\n  - `react` `^19.0.0` → `^19.2.0`'
        );
    });
});
