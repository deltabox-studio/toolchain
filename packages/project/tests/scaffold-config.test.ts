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
        expect(config?.content).toContain('type: "project"');
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
        expect(config?.content).toContain('type: "monorepo-root"');
    });

    it('uses monorepo-workspace for workspace files', () => {
        const files = createWorkspaceFiles({
            name: 'acme',
            wsName: 'core',
            wsDir: 'packages/core',
        });
        const config = files.find(f => f.path === 'dbx.config.ts');
        expect(config?.content).toContain('type: "monorepo-workspace"');
    });
});
