import { describe, expect, it } from 'vite-plus/test';

import { projectFromPackageJson, projectToPackageJson } from '../src/project.js';

describe('projectFromPackageJson', () => {
    it('derives name/scope and metadata from a package.json', () => {
        const project = projectFromPackageJson({
            name: '@org/app',
            description: 'An app',
            author: { name: 'Myapp', email: 'dev@myapp.dev' },
            license: 'MIT',
            homepage: 'https://myapp.dev',
            repository: { type: 'git', url: 'git+https://github.com/myapp/app.git' },
            engines: { node: '>=22.5.0' },
            packageManager: 'yarn@4.17.1',
        });
        expect(project).toEqual({
            name: 'app',
            scope: '@org',
            description: 'An app',
            author: 'Myapp <dev@myapp.dev>',
            license: 'MIT',
            homepage: 'https://myapp.dev',
            repo: 'https://github.com/myapp/app',
            nodeVersion: '22.5.0',
            packageManager: 'yarn',
            packageManagerVersion: '4.17.1',
        });
    });

    it('handles an unscoped name and a string repository', () => {
        const project = projectFromPackageJson({
            name: 'tool',
            repository: 'https://github.com/myapp/tool',
            packageManager: 'pnpm',
        });
        expect(project.name).toBe('tool');
        expect(project.scope).toBeUndefined();
        expect(project.repo).toBe('https://github.com/myapp/tool');
        expect(project.packageManager).toBe('pnpm');
        expect(project.packageManagerVersion).toBeUndefined();
    });
});

describe('projectToPackageJson', () => {
    it('maps only the defined fields', () => {
        const pkg = projectToPackageJson({ name: 'app', scope: '@org', description: 'Hi' });
        expect(pkg).toEqual({ name: '@org/app', description: 'Hi' });
    });

    it('writes the repository with the workspace directory', () => {
        const pkg = projectToPackageJson(
            { repo: 'https://github.com/myapp/app' },
            { directory: 'packages/app' }
        );
        expect(pkg.repository).toEqual({
            type: 'git',
            url: 'git+https://github.com/myapp/app.git',
            directory: 'packages/app',
        });
    });

    it('writes the packageManager with its version', () => {
        const pkg = projectToPackageJson({
            packageManager: 'yarn',
            packageManagerVersion: '4.17.1',
        });
        expect(pkg.packageManager).toBe('yarn@4.17.1');
    });

    it('skips a packageManager without a version (corepack rejects a bare name)', () => {
        const pkg = projectToPackageJson({ packageManager: 'pnpm' });
        expect(pkg.packageManager).toBeUndefined();
    });
});
