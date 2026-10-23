import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
    catalogsSyncTask,
    createMonorepoRootFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
    projectSyncTask,
    renderGitignore,
    renderYarnrc,
} from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-proj-'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('project scaffolding', () => {
    it('creates root files', () => {
        const files = createRootProjectFiles({ name: 'acme', scope: '@acme', license: 'MIT' });
        const paths = files.map(f => f.path);
        expect(paths).toContain('package.json');
        expect(paths).toContain('tsconfig.base.json');
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.name).toBe('@acme/acme');
        expect(pkg.license).toBe('MIT');
        // The default manager (yarn) supports catalogs: the catalog file is
        // written and the deps reference `catalog:`.
        expect(paths).toContain('.yarnrc.yml');
        expect(pkg.devDependencies['@deltabox/toolchain']).toBe('catalog:');
    });

    it('pins dependencies (no catalog) for npm', () => {
        const files = createRootProjectFiles({ name: 'acme', packageManager: 'npm' });
        const paths = files.map(f => f.path);
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toMatch(/^\^\d+\.\d+\.\d+/);
        expect(paths).not.toContain('.yarnrc.yml');
        expect(paths).not.toContain('pnpm-workspace.yaml');
    });

    it('creates monorepo root files with references', () => {
        const files = createMonorepoRootFiles({
            name: 'acme',
            scope: '@acme',
            workspaces: [{ alias: 'core', dir: 'packages/core' }],
        });
        const mono = JSON.parse(files.find(f => f.path === 'tsconfig.workspaces.json')!.content);
        expect(mono.compilerOptions.paths['@acme/core']).toEqual(['./packages/core/src/index.ts']);
        expect(mono.references).toEqual([{ path: './packages/core/tsconfig.json' }]);
        // No turbo: no turbo.json, no turbo devDependency, no turbo scripts.
        expect(files.map(f => f.path)).not.toContain('turbo.json');
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies.turbo).toBeUndefined();
        expect(JSON.stringify(pkg.scripts ?? {})).not.toContain('turbo');
    });

    it('creates workspace files', () => {
        const files = createWorkspaceFiles({
            name: 'acme',
            scope: '@acme',
            wsName: 'core',
            wsDir: 'packages/core',
        });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.name).toBe('@acme/core');
    });

    it('pairs the package manager with a version in the generated config', () => {
        const files = createRootProjectFiles({ name: 'x', type: 'project' });
        const config = files.find(f => f.path === 'dbx.config.ts')!.content;
        expect(config).toContain('packageManager: "yarn"');
        expect(config).toContain('packageManagerVersion: "4.17.1"');
        // No explicit manager chosen -> no `packageManager` field yet.
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.packageManager).toBeUndefined();
    });

    it('writes a versioned packageManager when one is chosen', () => {
        const files = createRootProjectFiles({ name: 'x', packageManager: 'pnpm' });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.packageManager).toBe('pnpm@10.11.1');
    });

    it('pins a single Bun project (nowhere to declare the catalog)', () => {
        const files = createRootProjectFiles({ name: 'x', packageManager: 'bun' });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toMatch(/^\^/);
        expect(pkg.workspaces).toBeUndefined();
    });

    it('uses the catalog for a Bun monorepo root', () => {
        const files = createMonorepoRootFiles({ name: 'x', packageManager: 'bun', workspaces: [] });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toBe('catalog:');
        expect((pkg.workspaces as { catalog: Record<string, string> }).catalog).toBeDefined();
    });

    it('renders a gitignore', () => {
        expect(renderGitignore()).toContain('node_modules/');
    });

    it('keeps the scoped package name when the config omits scope', async () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: '@acme/a', version: '0.1.0' })
        );
        const files = (await projectSyncTask().run({
            cwd: dir,
            projectType: 'monorepo-workspace',
            config: { project: { type: 'monorepo-workspace', name: 'a' } },
            tokens: {},
            log: () => {},
            warn: () => {},
        })) as { path: string; content: string }[];
        const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content);
        expect(pkg.name).toBe('@acme/a');
    });

    it('renders catalogs and marks the file as kept (never deleted)', () => {
        expect(renderYarnrc({ packages: { react: '^19.0.0' } })).toContain('catalog:');
        expect(catalogsSyncTask().keep).toContain('.yarnrc.yml');
        expect(catalogsSyncTask().keep).toContain('pnpm-workspace.yaml');
    });
});
