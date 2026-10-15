import { describe, expect, it } from 'vitest';

import {
    biomeConfig,
    biomeVscodeSettings,
    renderBiomeConfig,
    renderBiomeJson,
    renderVscodeSettings,
} from '../src/index.js';

describe('biome templates', () => {
    it('exposes the raw config', () => {
        expect(biomeConfig.$schema).toContain('biomejs.dev');
        expect(biomeVscodeSettings['biome.lsp.watcher.kind']).toBe('none');
    });

    it('resolves replacement tokens', () => {
        const rendered = renderBiomeConfig({ name: 'acme', scope: '@acme' });
        const groups = (rendered.assist as any).actions.source.organizeImports.options.groups;
        const flat = JSON.stringify(groups);
        expect(flat).toContain('@acme/**');
        expect(flat).toContain('acme');
        expect(flat).not.toContain('{{');
    });

    it('serializes to JSON', () => {
        const json = renderBiomeJson({ name: 'acme', scope: '@acme' }, {}, 2);
        expect(() => JSON.parse(json)).not.toThrow();
        expect(json).not.toContain('{{');
    });

    it('serializes vscode settings', () => {
        expect(() => JSON.parse(renderVscodeSettings())).not.toThrow();
    });

    it('merges overrides (arrays union, objects deep-merge)', () => {
        const rendered = renderBiomeConfig(
            { name: 'acme', scope: '@acme' },
            {
                files: { includes: ['!packages/x/gen.ts'] },
                linter: { rules: { suspicious: { noExplicitAny: 'error' } } },
            }
        );
        const includes = (rendered.files as any).includes as string[];
        expect(includes).toContain('!packages/x/gen.ts');
        // default includes are preserved (union, not replace)
        expect(includes).toContain('!**/.generated');
        expect((rendered.linter as any).rules.suspicious.noExplicitAny).toBe('error');
        // untouched default rule survives the deep merge
        expect((rendered.linter as any).rules.suspicious.noDoubleEquals).toBe('warn');
    });
});
