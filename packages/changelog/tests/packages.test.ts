import { describe, expect, it } from 'vitest';

import {
    collectDependencies,
    diffDependencies,
    renderPackageChanges,
} from '../src/utils/packages.js';

describe('dependency maps', () => {
    it('scopes dependencies to the package.json name', () => {
        const map = collectDependencies(
            [
                { name: '@acme/app', devDependencies: { vite: '^5.4.14' } },
                { name: '@acme/lib', devDependencies: { vite: 'catalog:' } },
            ],
            new Map([['vite', '^8.3.0']]),
            '@acme/root'
        );
        expect([...map.values()].filter(entry => entry.name === 'vite')).toEqual([
            { scope: '@acme/app', name: 'vite', version: '^5.4.14' },
            { scope: '@acme/lib', name: 'vite', version: 'catalog:' },
            { scope: '@acme/root', name: 'vite', version: '^8.3.0' },
        ]);
    });

    it('reports a workspace-specific pin as a scoped update', () => {
        const prev = collectDependencies(
            [{ name: '@acme/app', devDependencies: { vite: '^5.4.14' } }],
            new Map(),
            '@acme/root'
        );
        const next = collectDependencies(
            [{ name: '@acme/app', devDependencies: { vite: '^5.4.15' } }],
            new Map(),
            '@acme/root'
        );
        expect(renderPackageChanges(diffDependencies(prev, next))).toContain(
            '- `@acme/app` › `vite` `^5.4.14` → `^5.4.15`'
        );
    });

    it('is independent of package iteration order', () => {
        const catalog = new Map([['vite', '^8.3.0']]);
        const app = { name: '@acme/app', devDependencies: { vite: '^5.4.14' } };
        const lib = { name: '@acme/lib', devDependencies: { vite: 'catalog:' } };
        const forward = collectDependencies([app, lib], catalog, '@acme/root');
        const reverse = collectDependencies([lib, app], catalog, '@acme/root');
        expect(diffDependencies(forward, reverse)).toEqual({
            added: [],
            updated: [],
            removed: [],
        });
    });

    it('reports a catalog bump under the root package name only', () => {
        const prev = collectDependencies(
            [{ name: '@acme/lib', devDependencies: { vite: 'catalog:' } }],
            new Map([['vite', '^8.3.0']]),
            '@acme/root'
        );
        const next = collectDependencies(
            [{ name: '@acme/lib', devDependencies: { vite: 'catalog:' } }],
            new Map([['vite', '^8.4.0']]),
            '@acme/root'
        );
        expect(diffDependencies(prev, next).updated).toEqual([
            { scope: '@acme/root', name: 'vite', from: '^8.3.0', to: '^8.4.0' },
        ]);
    });

    it('still tracks packages that are not in the catalog', () => {
        const map = collectDependencies([
            { name: '@acme/app', devDependencies: { prettier: '^3' } },
        ]);
        expect([...map.values()]).toContainEqual({
            scope: '@acme/app',
            name: 'prettier',
            version: '^3',
        });
    });
});
