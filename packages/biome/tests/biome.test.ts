import { describe, expect, it } from 'vitest';

import {
    BIOME_RESET,
    biomeConfig,
    biomeSyncTask,
    biomeVscodeSettings,
    removeBiomeEntry,
    renderBiomeConfig,
    renderBiomeJson,
    renderVscodeSettings,
    resolveBiomeArray,
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

    it('drops scope-only import groups when no scope is set', () => {
        const rendered = renderBiomeConfig({ name: 'acme' });
        const groups = (rendered.assist as any).actions.source.organizeImports.options.groups;
        const flat = JSON.stringify(groups);
        expect(flat).not.toContain('{{');
        expect(flat).not.toContain('!/**');
        expect(flat).not.toContain('"/**"');
        expect(flat).toContain('acme');
    });

    it('serializes to JSON', () => {
        const json = renderBiomeJson({ name: 'acme', scope: '@acme' }, {}, 2);
        expect(() => JSON.parse(json)).not.toThrow();
        expect(json).not.toContain('{{');
    });

    it('serializes vscode settings', () => {
        expect(() => JSON.parse(renderVscodeSettings())).not.toThrow();
    });

    it('writes biome.json when the biome section is enabled', async () => {
        const task = biomeSyncTask();
        expect(task.enabled?.({})).toBe(false);
        expect(task.enabled?.({ biome: true })).toBe(true);
        const files = await task.run({
            cwd: '/repo',
            projectType: 'project',
            config: { biome: true },
            tokens: { name: 'acme', scope: '@acme' },
            log: () => {},
            warn: () => {},
        });
        expect(files?.[0]?.path).toBe('biome.json');
        expect(JSON.parse(files?.[0]?.content ?? '{}')).toHaveProperty('$schema');
    });

    it('writes biome.json from fmt.biome / lint.biome too', async () => {
        const task = biomeSyncTask();
        const config = {
            fmt: { biome: { formatter: { indentWidth: 2 } } },
            lint: {
                biome: { linter: { rules: { suspicious: { noDoubleEquals: 'error' as const } } } },
            },
        };
        expect(task.enabled?.(config)).toBe(true);
        const files = await task.run({
            cwd: '/repo',
            projectType: 'project',
            config,
            tokens: { name: 'acme', scope: '@acme' },
            log: () => {},
            warn: () => {},
        });
        const biome = JSON.parse(files?.[0]?.content ?? '{}');
        expect(biome.formatter.indentWidth).toBe(2);
        expect(biome.linter.rules.suspicious.noDoubleEquals).toBe('error');
    });

    it('honours an explicit fmt.biome / lint.biome opt-out', async () => {
        const task = biomeSyncTask();
        expect(task.enabled?.({ fmt: { biome: false } })).toBe(false);
        expect(task.enabled?.({ lint: { biome: false } })).toBe(false);
        expect(
            await task.run({
                cwd: '/repo',
                projectType: 'project',
                config: { fmt: { biome: false }, lint: { biome: false } },
                tokens: { name: 'acme' },
                log: () => {},
                warn: () => {},
            })
        ).toEqual([]);
    });

    it('treats fmt.biome: true as the defaults', async () => {
        const task = biomeSyncTask();
        expect(task.enabled?.({ fmt: { biome: true } })).toBe(true);
        const files = await task.run({
            cwd: '/repo',
            projectType: 'project',
            config: { fmt: { biome: true } },
            tokens: { name: 'acme' },
            log: () => {},
            warn: () => {},
        });
        const biome = JSON.parse(files?.[0]?.content ?? '{}');
        expect(biome).toHaveProperty('$schema');
        expect(biome.formatter).toBeDefined();
    });

    it('ignores a disabled biome section overrides', async () => {
        const task = biomeSyncTask();
        const files = await task.run({
            cwd: '/repo',
            projectType: 'project',
            config: {
                biome: { enabled: false, overrides: { formatter: { indentWidth: 2 } } },
                fmt: { biome: { formatter: { lineWidth: 80 } } },
            },
            tokens: { name: 'acme' },
            log: () => {},
            warn: () => {},
        });
        const biome = JSON.parse(files?.[0]?.content ?? '{}');
        expect(biome.formatter.lineWidth).toBe(80);
        expect(biome.formatter.indentWidth).toBe(4);
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

    it('removes default array entries with the $remove directive', () => {
        const rendered = renderBiomeConfig(
            { name: 'acme', scope: '@acme' },
            { files: { includes: [removeBiomeEntry('!**/.generated'), '!**/gen/**'] } }
        );
        const includes = (rendered.files as any).includes as string[];
        expect(includes).not.toContain('!**/.generated');
        expect(includes).toContain('!**/gen/**');
        // unrelated defaults survive
        expect(includes).toContain('!*.json');
    });

    it('replaces an array with the $reset directive', () => {
        const rendered = renderBiomeConfig(
            { name: 'acme', scope: '@acme' },
            { files: { includes: [BIOME_RESET, 'src/**'] } }
        );
        expect((rendered.files as any).includes).toEqual(['src/**']);
    });

    it('removes nested array entries with the $remove directive', () => {
        const rendered = renderBiomeConfig(
            { name: 'acme', scope: '@acme' },
            {
                assist: {
                    actions: {
                        source: {
                            organizeImports: {
                                options: {
                                    groups: [removeBiomeEntry(['@/lib/**', '@/utils/**'])],
                                },
                            },
                        },
                    },
                },
            }
        );
        const groups = (rendered.assist as any).actions.source.organizeImports.options
            .groups as string[][];
        expect(groups).not.toContainEqual(['@/lib/**', '@/utils/**']);
        expect(groups).toContainEqual(['@/pages/**']);
    });

    it('resolves override sources in order', async () => {
        const task = biomeSyncTask();
        const files = await task.run({
            cwd: '/repo',
            projectType: 'project',
            config: {
                biome: { overrides: { files: { includes: ['!packages/x/**'] } } },
                fmt: {
                    biome: {
                        files: { includes: [removeBiomeEntry('!packages/x/**'), '!packages/y/**'] },
                    },
                },
            },
            tokens: { name: 'acme', scope: '@acme' },
            log: () => {},
            warn: () => {},
        });
        const includes = JSON.parse(files?.[0]?.content ?? '{}').files.includes as string[];
        expect(includes).not.toContain('!packages/x/**');
        expect(includes).toContain('!packages/y/**');
        expect(includes).toContain('!**/.generated');
    });

    it('resolveBiomeArray applies reset, removals and additions', () => {
        expect(resolveBiomeArray(['a', 'b'], [BIOME_RESET, 'c'])).toEqual(['c']);
        expect(resolveBiomeArray(['a', 'b'], [removeBiomeEntry('a'), 'c'])).toEqual(['b', 'c']);
        // raw (non-JSON) removal values also work
        expect(resolveBiomeArray(['a', 'b'], ['$remove:a'])).toEqual(['b']);
    });
});
