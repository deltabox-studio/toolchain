import { describe, expect, it } from 'vitest';

import { type DbxConfig, defineConfig, sectionConfig, sectionEnabled } from '../src/index.js';

describe('dbx.config model', () => {
    it('defineConfig is the identity', () => {
        const config: DbxConfig = {
            toolchain: { project: { name: 'acme' }, changelog: true, vite: true },
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
                // CI + commitlint + changelog all live in the `changelog` section.
                changelog: {
                    workflows: {
                        ci: true,
                        changelog: { pushBranches: ['main'] },
                        release: false,
                        issues: true,
                        sync: true,
                    },
                    branches: { main: 'main', dev: 'dev' },
                    types: ['feat', 'fix'],
                    scopes: ['core'],
                    vscode: true,
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
        expect(sectionEnabled(toolchain.changelog)).toBe(true);
        expect(sectionEnabled(toolchain.tsconfig)).toBe(true);
        expect(sectionConfig(toolchain.vite)?.fmt).toEqual({ semi: true });
        expect(sectionConfig(toolchain.watch)?.debounce).toBe(100);
    });
});
