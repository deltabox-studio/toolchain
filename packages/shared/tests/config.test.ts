import { describe, expect, it } from 'vitest';

import {
    type DbxConfig,
    defineConfig,
    resolveChangelogConfig,
    resolveFmtTool,
    resolveFmtTools,
    resolveLintTool,
    resolveLintTools,
    resolveOxcFmtConfig,
    resolveOxcLintConfig,
    sectionConfig,
    sectionEnabled,
} from '../src/index.js';

describe('dbx.config model', () => {
    it('defineConfig is the identity', () => {
        const config: DbxConfig = {
            toolchain: { project: { name: 'acme' }, ci: true, vite: true },
        };
        expect(defineConfig(config)).toBe(config);
    });

    it('sections are opt-in by presence', () => {
        expect(sectionEnabled(undefined)).toBe(false);
        expect(sectionEnabled(true)).toBe(true);
        expect(sectionEnabled(false)).toBe(false);
        expect(sectionEnabled({ enabled: false })).toBe(false);
        expect(sectionEnabled({})).toBe(true);
        expect(sectionConfig<{ enabled?: boolean; refs: boolean }>({ refs: true })).toEqual({
            refs: true,
        });
        expect(sectionConfig(true)).toBeUndefined();
    });

    it('every configurable area is expressible', () => {
        const config = defineConfig({
            toolchain: {
                project: {
                    type: 'monorepo-root',
                    name: 'acme',
                    scope: '@acme',
                    author: 'Acme',
                    license: 'MIT',
                    homepage: 'https://acme.dev',
                    repo: 'https://github.com/acme/app',
                    nodeVersion: '22',
                    packageManager: 'yarn',
                    packageManagerVersion: '4.17.1',
                    description: 'Acme app',
                },
                // CI workflows + the changelog pipeline live in the `ci` section.
                ci: {
                    ci: true,
                    changelog: {
                        pushBranches: ['main'],
                        branches: { main: 'main', dev: 'dev' },
                        commitlint: { types: ['feat', 'fix'], scopes: ['core'] },
                        versioning: { target: 'individual' },
                        vscode: true,
                    },
                    release: false,
                    issues: true,
                    sync: true,
                },
                biome: { vscode: true, overrides: { formatter: {} } },
                tsconfig: {
                    refs: true,
                    aliases: true,
                    indent: 2,
                    glob: ['**/tsconfig.default.json', '**/tsconfig.custom.json'],
                    rootFile: 'tsconfig.workspaces.json',
                    defaultFile: 'tsconfig.default.json',
                    buildFile: 'tsconfig.build.json',
                },
                templates: { sources: [{ type: 'local', locate: './templates' }] },
                vite: { fmt: { semi: true }, test: { include: ['src/**/*.test.ts'] } },
                watch: { debounce: 100 },
                hooks: { afterSync: () => undefined },
            },
        });

        const toolchain = config.toolchain!;
        expect(sectionEnabled(toolchain.ci)).toBe(true);
        expect(sectionConfig(toolchain.ci)?.changelog).toBeDefined();
        expect(sectionEnabled(toolchain.tsconfig)).toBe(true);
        expect(sectionConfig(toolchain.vite)?.fmt).toEqual({ semi: true });
        expect(sectionConfig(toolchain.watch)?.debounce).toBe(100);
    });
});

describe('resolveChangelogConfig', () => {
    const legacy = {
        commitlint: { types: ['feat'], scopes: ['api'] },
        versioning: { target: 'individual' as const },
        vscode: true,
    };

    it('uses the manual `toolchain.changelog` options without CI', () => {
        expect(resolveChangelogConfig({ changelog: legacy })).toEqual(legacy);
    });

    it('inherits the manual options when `ci.changelog` is merely enabled', () => {
        expect(resolveChangelogConfig({ changelog: legacy, ci: { changelog: true } })).toEqual(
            legacy
        );
    });

    it('inherits the manual options under CI workflow-only overrides', () => {
        const resolved = resolveChangelogConfig({
            changelog: legacy,
            ci: { changelog: { pushBranches: ['dev'] } },
        });
        expect(resolved).toMatchObject({ ...legacy, pushBranches: ['dev'] });
    });

    it('lets explicit `ci.changelog` pipeline options win', () => {
        const resolved = resolveChangelogConfig({
            changelog: legacy,
            ci: {
                changelog: {
                    branches: { main: 'main' },
                    commitlint: { scopes: ['web'] },
                },
            },
        });
        expect(resolved?.commitlint).toEqual({ types: ['feat'], scopes: ['web'] });
        expect(resolved?.versioning).toEqual({ target: 'individual' });
        expect(resolved?.branches).toEqual({ main: 'main' });
    });
});

describe('formatter/linter precedence', () => {
    const config = {
        fmt: {
            oxc: { semi: false, singleQuote: true },
            biome: {},
            prettier: {},
            dprint: {},
        },
        lint: {
            oxc: { rules: {} },
            biome: {},
            eslint: {},
        },
        vite: {
            fmt: { singleQuote: false },
            lint: { rules: { eqeqeq: 'error' as const } },
        },
    };

    it('orders tools by precedence and picks the winner', () => {
        expect(resolveFmtTools(config)).toEqual(['oxc', 'biome', 'prettier', 'dprint']);
        expect(resolveLintTools(config)).toEqual(['oxc', 'biome', 'eslint']);
        expect(resolveFmtTool(config)).toBe('oxc');
        expect(resolveLintTool(config)).toBe('oxc');
    });

    it('lets vite.fmt/lint override fmt/lint.oxc (deep merge)', () => {
        expect(resolveOxcFmtConfig(config)).toEqual({ semi: false, singleQuote: false });
        expect(resolveOxcLintConfig(config)).toEqual({ rules: { eqeqeq: 'error' } });
    });

    it('uses oxc when only vite.fmt/lint is set', () => {
        expect(resolveFmtTools({ vite: { fmt: true } })).toEqual(['oxc']);
        expect(resolveLintTools({ vite: { lint: true } })).toEqual(['oxc']);
    });
});
