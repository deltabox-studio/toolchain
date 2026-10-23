import { describe, expect, it } from 'vitest';

import { projectFromPackageJson, projectToPackageJson } from '../src/project.js';

describe('projectFromPackageJson', () => {
    it('derives name/scope and metadata from a package.json', () => {
        const project = projectFromPackageJson({
            name: '@acme/app',
            description: 'An app',
            author: { name: 'Acme', email: 'dev@acme.dev' },
            license: 'MIT',
            homepage: 'https://acme.dev',
            repository: { type: 'git', url: 'git+https://github.com/acme/app.git' },
            engines: { node: '>=22.5.0' },
            packageManager: 'yarn@4.17.1',
        });
        expect(project).toEqual({
            name: 'app',
            scope: '@acme',
            description: 'An app',
            author: 'Acme <dev@acme.dev>',
            license: 'MIT',
            homepage: 'https://acme.dev',
            repo: 'https://github.com/acme/app',
            nodeVersion: '22.5.0',
            packageManager: 'yarn',
            packageManagerVersion: '4.17.1',
        });
    });

    it('handles an unscoped name and a string repository', () => {
        const project = projectFromPackageJson({
            name: 'tool',
            repository: 'https://github.com/acme/tool',
            packageManager: 'pnpm',
        });
        expect(project.name).toBe('tool');
        expect(project.scope).toBeUndefined();
        expect(project.repo).toBe('https://github.com/acme/tool');
        expect(project.packageManager).toBe('pnpm');
        expect(project.packageManagerVersion).toBeUndefined();
    });
});

describe('projectToPackageJson', () => {
    it('maps only the defined fields', () => {
        const pkg = projectToPackageJson({ name: 'app', scope: '@acme', description: 'Hi' });
        expect(pkg).toEqual({ name: '@acme/app', description: 'Hi' });
    });

    it('writes the repository with the workspace directory', () => {
        const pkg = projectToPackageJson(
            { repo: 'https://github.com/acme/app' },
            { directory: 'packages/app' }
        );
        expect(pkg.repository).toEqual({
            type: 'git',
            url: 'git+https://github.com/acme/app.git',
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
});
