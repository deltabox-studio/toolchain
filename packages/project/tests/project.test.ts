import { describe, expect, it } from 'vitest';

import {
    createMonorepoRootFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
    renderGitignore,
    renderTurboJson,
} from '../src/index.js';

describe('project scaffolding', () => {
    it('creates root files', () => {
        const files = createRootProjectFiles({ name: 'acme', scope: '@acme', license: 'MIT' });
        const paths = files.map(f => f.path);
        expect(paths).toContain('package.json');
        expect(paths).toContain('tsconfig.base.json');
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.name).toBe('@acme/acme');
        expect(pkg.license).toBe('MIT');
    });

    it('creates monorepo root files with references', () => {
        const files = createMonorepoRootFiles({
            name: 'acme',
            scope: '@acme',
            workspaces: [{ alias: 'core', dir: 'packages/core' }],
        });
        const mono = JSON.parse(files.find(f => f.path === 'tsconfig.monorepo.json')!.content);
        expect(mono.compilerOptions.paths['@acme/core']).toEqual(['./packages/core/src/index.ts']);
        expect(mono.references).toEqual([{ path: './packages/core/tsconfig.json' }]);
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

    it('renders turbo + gitignore', () => {
        expect(() => JSON.parse(renderTurboJson())).not.toThrow();
        expect(renderGitignore()).toContain('node_modules/');
    });
});
