import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import type { SyncContext, ToolchainConfig } from '@deltabox/toolchain/shared';

import {
    generateTsconfigs,
    generateWorkspaceTsconfigs,
    parseTsconfigIndent,
    runTsconfigCli,
    tsconfigSyncTask,
} from '../src/index.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tsconfig-'));
}

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 4));
}

function writeMonorepo(cwd: string): void {
    writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
        compilerOptions: {
            composite: true,
            types: ['node'],
            paths: {
                '@org/core': ['./packages/core/src/index.ts'],
                '@org/cli': ['./packages/cli/src/index.ts'],
            },
        },
        references: [
            { path: './packages/core/tsconfig.json' },
            { path: './packages/cli/tsconfig.json' },
        ],
    });
    writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {
        compilerOptions: { strict: true },
    });
    writeJson(path.join(cwd, 'packages/core/tsconfig.build.json'), {
        extends: './tsconfig.default.json',
    });
    writeJson(path.join(cwd, 'packages/cli/tsconfig.default.json'), {});
}

describe('generateTsconfigs', () => {
    it('extends each default and wires aliases + references', () => {
        const cwd = tmp();
        writeMonorepo(cwd);

        // Written (not a dry run) so reference pruning can read the generated
        // composite `tsconfig.json` files back.
        const results = generateTsconfigs({ cwd, refs: true, composite: true, log: false }).sort(
            (a, b) => a.dirnameRelative.localeCompare(b.dirnameRelative)
        );

        expect(results.map(r => r.dirnameRelative)).toEqual(['packages/cli', 'packages/core']);

        const core = results.find(r => r.dirnameRelative === 'packages/core')!;
        expect(core.newTsconfig.extends).toBe('./tsconfig.default.json');
        expect(core.newTsconfig.compilerOptions?.composite).toBe(true);
        // Own aliases are dropped; only the other workspace remains.
        expect(core.newTsconfig.compilerOptions?.paths).toEqual({
            '@org/cli': ['../cli/src/index.ts'],
        });
        // Own reference is dropped (it is the workspace itself).
        expect(core.newTsconfig.references).toEqual([{ path: '../cli/tsconfig.json' }]);
    });

    it('handles directory project references and drops self references', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
            compilerOptions: { composite: true },
            references: [{ path: './packages/core' }, { path: './packages/cli' }],
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});
        writeJson(path.join(cwd, 'packages/cli/tsconfig.default.json'), {});

        const results = generateTsconfigs({
            cwd,
            refs: true,
            composite: true,
            log: false,
            write: false,
        });
        const core = results.find(r => r.dirnameRelative === 'packages/core')!;
        expect(core.newTsconfig.references).toEqual([{ path: '../cli' }]);
        expect(core.newTsconfig.references).not.toContainEqual({ path: './' });
    });

    it('wires references on the first dry run (generated targets may not exist yet)', () => {
        const cwd = tmp();
        writeMonorepo(cwd);
        const results = generateTsconfigs({
            cwd,
            refs: true,
            composite: true,
            log: false,
            write: false,
        });
        const core = results.find(r => r.dirnameRelative === 'packages/core')!;
        expect(core.newTsconfig.references).toEqual([{ path: '../cli/tsconfig.json' }]);
    });

    it('generates tsconfig.json even without a workspaces tsconfig', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});

        const results = generateTsconfigs({ cwd, log: false, write: false });
        expect(results).toHaveLength(1);
        expect(results[0]!.newTsconfig.extends).toBe('./tsconfig.default.json');
    });

    it('follows extends when wiring the workspaces tsconfig', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.base.json'), {
            compilerOptions: {
                paths: {
                    '@org/core': ['./packages/core/src/index.ts'],
                    '@org/cli': ['./packages/cli/src/index.ts'],
                },
            },
            references: [{ path: './packages/cli/tsconfig.json' }],
        });
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
            extends: './tsconfig.base.json',
            compilerOptions: { composite: true },
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});
        writeJson(path.join(cwd, 'packages/cli/tsconfig.default.json'), {});

        const results = generateTsconfigs({ cwd, log: false, refs: true, composite: true });
        const core = results.find(result => result.dirnameRelative === 'packages/core')!;

        expect(core.newTsconfig.compilerOptions?.paths).toEqual({
            '@org/cli': ['../cli/src/index.ts'],
        });
        expect(core.newTsconfig.references).toEqual([{ path: '../cli/tsconfig.json' }]);
    });

    it('excludes globs via `exclude` and respects `.gitignore`', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});
        writeJson(path.join(cwd, 'packages/legacy/tsconfig.default.json'), {});
        fs.writeFileSync(path.join(cwd, '.gitignore'), 'packages/legacy/\n');

        // `.gitignore` (default on) hides the legacy workspace.
        const withGit = generateTsconfigs({
            cwd,
            log: false,
            write: false,
        }).sort((a, b) => a.dirnameRelative.localeCompare(b.dirnameRelative));
        expect(withGit.map(r => r.dirnameRelative)).toEqual(['packages/core']);

        // `gitignore: false` keeps both.
        const noGit = generateTsconfigs({
            cwd,
            log: false,
            write: false,
            gitignore: false,
        }).sort((a, b) => a.dirnameRelative.localeCompare(b.dirnameRelative));
        expect(noGit.map(r => r.dirnameRelative)).toEqual(['packages/core', 'packages/legacy']);

        // `exclude` drops the legacy workspace too.
        const excluded = generateTsconfigs({
            cwd,
            log: false,
            write: false,
            gitignore: false,
            exclude: ['**/legacy/**'],
        });
        expect(excluded.map(r => r.dirnameRelative)).toEqual(['packages/core']);
    });

    it('accepts an array of globs', () => {
        const cwd = tmp();
        writeMonorepo(cwd);

        const results = generateTsconfigs({
            cwd,
            glob: ['packages/core/tsconfig.default.json'],
            log: false,
            write: false,
        });
        expect(results.map(r => r.dirnameRelative)).toEqual(['packages/core']);
    });

    it('honours a custom default/build/workspaces file name', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.graph.json'), {});
        writeJson(path.join(cwd, 'packages/core/tsconfig.src.json'), {
            compilerOptions: { strict: true },
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.dist.json'), {});

        const results = generateTsconfigs({
            cwd,
            defaultFile: 'tsconfig.src.json',
            buildFile: 'tsconfig.dist.json',
            monorepoTsconfigFilename: 'tsconfig.graph.json',
            log: false,
            write: false,
        });
        expect(results).toHaveLength(1);
        expect(results[0]!.newTsconfig.extends).toBe('./tsconfig.src.json');
    });
});

describe('standalone tsconfig CLI', () => {
    function inDir<T>(cwd: string, run: () => T): T {
        const previous = process.cwd();
        process.chdir(cwd);
        try {
            return run();
        } finally {
            process.chdir(previous);
        }
    }

    it('derives composite from --refs', () => {
        const cwd = tmp();
        writeMonorepo(cwd);

        inDir(cwd, () => runTsconfigCli(['--refs']));

        const core = JSON.parse(
            fs.readFileSync(path.join(cwd, 'packages/core/tsconfig.json'), 'utf-8')
        );
        expect(core.compilerOptions.composite).toBe(true);
        expect(core.references).toEqual([{ path: '../cli/tsconfig.json' }]);
    });

    it('omits an empty references array', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});

        inDir(cwd, () => runTsconfigCli(['--refs']));

        const core = JSON.parse(
            fs.readFileSync(path.join(cwd, 'packages/core/tsconfig.json'), 'utf-8')
        );
        expect(core.references).toBeUndefined();
        expect(core.compilerOptions.composite).toBe(true);
    });

    it('validates --indent as a non-negative integer', () => {
        expect(parseTsconfigIndent('2')).toBe(2);
        expect(parseTsconfigIndent('0')).toBe(0);
        expect(parseTsconfigIndent(undefined)).toBe(4);
        for (const value of ['nope', '-2', '2.5', '']) {
            expect(() => parseTsconfigIndent(value)).toThrow(/invalid --indent/);
        }
        expect(() => runTsconfigCli(['--indent', 'bad'])).toThrow(/invalid --indent/);
    });
});

describe('generateTsconfigs include/exclude hoisting', () => {
    it('hoists include/exclude inherited from a relative extends', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.base.json'), {
            include: ['src'],
            exclude: ['dist'],
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: '../../tsconfig.base.json',
        });

        const results = generateTsconfigs({ cwd, log: false, write: false });
        const core = results.find(result => result.dirnameRelative === 'packages/core')!;

        // Patterns are rebased from the base config's directory onto the
        // generated config (the workspace), not left resolved against the base.
        expect(core.newTsconfig.include).toEqual(['../../src']);
        expect(core.newTsconfig.exclude).toEqual(['../../dist']);
    });

    it('keeps local include/exclude over inherited arrays', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.base.json'), {
            include: ['base-src'],
            exclude: ['base-dist'],
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: '../../tsconfig.base.json',
            include: ['src', 'tests'],
            exclude: ['dist'],
        });

        const results = generateTsconfigs({ cwd, log: false, write: false });
        const core = results.find(result => result.dirnameRelative === 'packages/core')!;

        expect(core.newTsconfig.include).toEqual(['src', 'tests']);
        expect(core.newTsconfig.exclude).toEqual(['dist']);
    });

    it('hoists include/exclude from a package tsconfig extends', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'node_modules/@org/tsconfig/package.json'), {
            name: '@org/tsconfig',
            version: '1.0.0',
            main: 'tsconfig.json',
        });
        writeJson(path.join(cwd, 'node_modules/@org/tsconfig/tsconfig.json'), {
            include: ['src'],
            exclude: ['dist'],
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: '@org/tsconfig',
        });

        const results = generateTsconfigs({ cwd, log: false, write: false });
        const core = results.find(result => result.dirnameRelative === 'packages/core')!;

        expect(core.newTsconfig.include).toEqual(['../../node_modules/@org/tsconfig/src']);
        expect(core.newTsconfig.exclude).toEqual(['../../node_modules/@org/tsconfig/dist']);
    });

    it('hoists per workspace in a monorepo and leaves the root relative to itself', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.default.json'), {
            include: ['src'],
            exclude: ['dist'],
        });
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
            references: [
                { path: './packages/core/tsconfig.json' },
                { path: './packages/cli/tsconfig.json' },
            ],
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: '../../tsconfig.default.json',
        });
        writeJson(path.join(cwd, 'packages/cli/tsconfig.default.json'), {
            extends: '../../tsconfig.default.json',
        });

        const results = generateTsconfigs({ cwd, log: false, write: false });
        const root = results.find(result => result.dirnameRelative === '.')!;
        const core = results.find(result => result.dirnameRelative === 'packages/core')!;

        expect(root.newTsconfig.include).toEqual(['src']);
        expect(root.newTsconfig.exclude).toEqual(['dist']);
        expect(core.newTsconfig.include).toEqual(['../../src']);
        expect(core.newTsconfig.exclude).toEqual(['../../dist']);
    });

    it('omits include/exclude when the extends chain defines neither', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            compilerOptions: { strict: true },
        });

        const results = generateTsconfigs({ cwd, log: false, write: false });
        expect(results[0]!.newTsconfig.include).toBeUndefined();
        expect(results[0]!.newTsconfig.exclude).toBeUndefined();
    });

    it('respects custom default file names when hoisting include/exclude', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.base.json'), {
            include: ['src'],
            exclude: ['dist'],
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.src.json'), {
            extends: '../../tsconfig.base.json',
        });

        const results = generateTsconfigs({
            cwd,
            defaultFile: 'tsconfig.src.json',
            log: false,
            write: false,
        });
        const core = results.find(result => result.dirnameRelative === 'packages/core')!;

        expect(core.newTsconfig.extends).toBe('./tsconfig.src.json');
        expect(core.newTsconfig.include).toEqual(['../../src']);
        expect(core.newTsconfig.exclude).toEqual(['../../dist']);
    });
});

function syncCtx(cwd: string, config: ToolchainConfig, warnings: string[]): SyncContext {
    return {
        cwd,
        projectType: 'monorepo-root',
        config,
        tokens: {},
        log: () => {},
        warn: (message: string) => warnings.push(message),
    };
}

describe('tsconfigSyncTask', () => {
    it('warns when references are enabled but no workspaces are found', async () => {
        const warnings: string[] = [];
        const files = await tsconfigSyncTask().run(
            syncCtx(tmp(), { tsconfig: { refs: true } }, warnings)
        );
        expect(files).toEqual([]);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(/no workspace tsconfig files found/);
    });

    it('warns when a workspaces tsconfig is present but no workspaces are found', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {});
        const warnings: string[] = [];
        await tsconfigSyncTask().run(syncCtx(cwd, { tsconfig: {} }, warnings));
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(/no workspace tsconfig files found/);
    });

    it('stays quiet when no workspaces are expected', async () => {
        const warnings: string[] = [];
        const files = await tsconfigSyncTask().run(syncCtx(tmp(), { tsconfig: {} }, warnings));
        expect(files).toEqual([]);
        expect(warnings).toEqual([]);
    });

    it('regenerates a tsconfig.json per workspace', async () => {
        const cwd = tmp();
        writeMonorepo(cwd);
        const warnings: string[] = [];
        const files = await tsconfigSyncTask().run(
            syncCtx(cwd, { tsconfig: { refs: true, composite: true } }, warnings)
        );
        expect(warnings).toEqual([]);
        expect(files?.map(f => f.path).sort()).toEqual([
            'packages/cli/tsconfig.build.json',
            'packages/cli/tsconfig.json',
            'packages/core/tsconfig.json',
        ]);
    });
});

describe('scaffolded workspace compiler options', () => {
    function writeMonorepoWorkspace(cwd: string, composite = true): void {
        writeJson(path.join(cwd, 'package.json'), {
            name: '@org/root',
            private: true,
            workspaces: ['packages/*'],
        });
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
            compilerOptions: {
                composite,
                types: ['node'],
                allowJs: true,
                noEmit: false,
                declaration: true,
                emitDeclarationOnly: true,
                strict: true,
                paths: { '@org/core': ['./packages/core/src/index.ts'] },
            },
        });
        writeJson(path.join(cwd, 'packages/core/package.json'), { name: '@org/core' });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});
    }

    it('copies the workspaces compilerOptions and keeps its composite when refs are off', async () => {
        const cwd = tmp();
        writeMonorepoWorkspace(cwd);

        const result = await generateWorkspaceTsconfigs({
            cwd,
            config: { tsconfig: {} },
            write: false,
            writeSidecar: false,
        });
        const core = result.results.find(
            item => item.dirnameRelative === 'packages/core'
        )!.newTsconfig;

        expect(core.compilerOptions).toMatchObject({
            composite: true,
            types: ['node'],
            allowJs: true,
            noEmit: false,
            declaration: true,
            emitDeclarationOnly: true,
            strict: true,
        });
    });

    it('copies a disabled workspaces composite when refs are off', async () => {
        const cwd = tmp();
        writeMonorepoWorkspace(cwd, false);

        const result = await generateWorkspaceTsconfigs({
            cwd,
            config: { tsconfig: {} },
            write: false,
            writeSidecar: false,
        });
        const core = result.results.find(
            item => item.dirnameRelative === 'packages/core'
        )!.newTsconfig;

        expect(core.compilerOptions?.composite).toBe(false);
        expect(core.compilerOptions?.strict).toBe(true);
    });

    it('derives composite from refs instead of the workspaces value', async () => {
        const cwd = tmp();
        writeMonorepoWorkspace(cwd, false);

        const result = await generateWorkspaceTsconfigs({
            cwd,
            config: { tsconfig: { refs: true } },
            write: false,
            writeSidecar: false,
        });
        const core = result.results.find(
            item => item.dirnameRelative === 'packages/core'
        )!.newTsconfig;

        expect(core.compilerOptions?.composite).toBe(true);
    });
});

describe('missing managed tsconfig files', () => {
    it('regenerates a missing workspaces tsconfig from the project graph', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'package.json'), {
            name: '@org/root',
            private: true,
            workspaces: ['packages/*'],
        });
        writeJson(path.join(cwd, 'packages/core/package.json'), { name: '@org/core' });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});
        fs.mkdirSync(path.join(cwd, 'packages/core/src'), { recursive: true });
        fs.writeFileSync(path.join(cwd, 'packages/core/src/index.ts'), 'export {};\n');
        const rootFile = path.join(cwd, 'tsconfig.workspaces.json');

        const result = await generateWorkspaceTsconfigs({
            cwd,
            config: { tsconfig: {} },
            write: true,
            writeSidecar: false,
        });

        expect(result.writeRoot).toBe(true);
        expect(fs.existsSync(rootFile)).toBe(true);
        expect(JSON.parse(fs.readFileSync(rootFile, 'utf-8'))).toEqual({
            compilerOptions: {
                composite: false,
                paths: {
                    '@org/core': ['./packages/core/src/index.ts'],
                    '@org/core/*': ['./packages/core/src/*'],
                },
            },
            references: [{ path: './packages/core/tsconfig.json' }],
        });
        expect(fs.existsSync(path.join(cwd, 'packages/core/tsconfig.json'))).toBe(true);
    });
});

describe('broken tsconfig extends', () => {
    it('fails when a workspace default extends a missing config', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: '../../tsconfig.base.json',
        });

        expect(() => generateTsconfigs({ cwd, log: false, write: false })).toThrow(
            /Cannot resolve tsconfig "extends": "\.\.\/\.\.\/tsconfig\.base\.json"/
        );
    });

    it('fails when a workspace build config extends a missing config', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});
        writeJson(path.join(cwd, 'packages/core/tsconfig.build.json'), {
            extends: './missing.json',
        });

        expect(() => generateTsconfigs({ cwd, log: false, write: false })).toThrow(
            /Cannot resolve tsconfig "extends": "\.\/missing\.json"/
        );
    });

    it('fails when the workspaces config extends a missing config', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
            extends: './tsconfig.base.json',
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});

        expect(() => generateTsconfigs({ cwd, log: false, write: false })).toThrow(
            /Cannot resolve tsconfig "extends": "\.\/tsconfig\.base\.json"/
        );
    });

    it('requires remote extends to be prefetched before generation', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: 'https://example.com/tsconfig.json',
        });

        expect(() => generateTsconfigs({ cwd, log: false, write: false })).toThrow(
            /was not prefetched/
        );
    });
});

describe('generateTsconfigs referenced JSONC', () => {
    it('reads a referenced tsconfig with comments', () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
            compilerOptions: { composite: true },
            references: [{ path: './packages/core/tsconfig.json' }],
        });
        writeJson(path.join(cwd, 'packages/core/tsconfig.default.json'), {});
        fs.mkdirSync(path.join(cwd, 'vendor'), { recursive: true });
        fs.writeFileSync(
            path.join(cwd, 'vendor/tsconfig.json'),
            '{\n    // referenced\n    "compilerOptions": { "composite": true },\n}\n'
        );
        fs.writeFileSync(
            path.join(cwd, 'tsconfig.workspaces.json'),
            JSON.stringify({
                compilerOptions: { composite: true },
                references: [
                    { path: './packages/core/tsconfig.json' },
                    { path: './vendor/tsconfig.json' },
                ],
            })
        );
        expect(() =>
            generateTsconfigs({ cwd, refs: true, composite: true, log: false })
        ).not.toThrow();
    });
});
