import { describe, expect, it } from 'vitest';

import {
    createMonorepoRootFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
} from '../src/index.js';

describe('scaffolded dbx.config.ts', () => {
    it('is included by default with the project type', () => {
        const files = createRootProjectFiles({ name: 'acme', scope: '@acme' });
        const config = files.find(f => f.path === 'dbx.config.ts');
        expect(config?.content).toContain('defineConfig');
        expect(config?.content).toContain("type: 'project'");
    });

    it('is skipped when includeConfig is false', () => {
        const files = createRootProjectFiles({ name: 'acme', includeConfig: false });
        expect(files.some(f => f.path === 'dbx.config.ts')).toBe(false);
    });

    it('uses monorepo-root for the monorepo scaffold', () => {
        const files = createMonorepoRootFiles({
            name: 'acme',
            workspaces: [{ alias: 'core', dir: 'packages/core' }],
        });
        const config = files.find(f => f.path === 'dbx.config.ts');
        expect(config?.content).toContain("type: 'monorepo-root'");
    });

    it('opts into the catalog the scaffold writes', () => {
        const files = createRootProjectFiles({ name: 'acme' });
        const config = files.find(f => f.path === 'dbx.config.ts')?.content ?? '';
        expect(config).toContain('catalogs:');
        expect(config).toContain('packages:');
        expect(config).toContain("'@deltabox/toolchain':");
    });

    it('opts into the catalog for a yarn/pnpm monorepo root', () => {
        for (const packageManager of ['yarn', 'pnpm'] as const) {
            const files = createMonorepoRootFiles({
                name: 'acme',
                packageManager,
                workspaces: [],
            });
            const config = files.find(f => f.path === 'dbx.config.ts')?.content ?? '';
            expect(config).toContain('catalogs:');
            expect(config).toContain('packages:');
        }
    });

    it('does not opt into catalogs when no catalog file is written', () => {
        const npm = createRootProjectFiles({ name: 'acme', packageManager: 'npm' });
        expect(npm.find(f => f.path === 'dbx.config.ts')?.content).not.toContain('catalogs:');
        // A single Bun project pins (nowhere to declare a catalog).
        const bun = createRootProjectFiles({ name: 'acme', packageManager: 'bun' });
        expect(bun.find(f => f.path === 'dbx.config.ts')?.content).not.toContain('catalogs:');
    });

    it('uses monorepo-workspace for workspace files', () => {
        const files = createWorkspaceFiles({
            name: 'acme',
            wsName: 'core',
            wsDir: 'packages/core',
        });
        const config = files.find(f => f.path === 'dbx.config.ts');
        expect(config?.content).toContain("type: 'monorepo-workspace'");
    });
});
