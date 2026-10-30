import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { SyncContext, ToolchainConfig } from '@deltabox/toolchain-shared';

import { generateTsconfigs, tsconfigSyncTask } from '../src/index.js';

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
                '@acme/core': ['./packages/core/src/index.ts'],
                '@acme/cli': ['./packages/cli/src/index.ts'],
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
            '@acme/cli': ['../cli/src/index.ts'],
        });
        // Own reference is dropped (it is the workspace itself).
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
                    '@acme/core': ['./packages/core/src/index.ts'],
                    '@acme/cli': ['./packages/cli/src/index.ts'],
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
            '@acme/cli': ['../cli/src/index.ts'],
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
            'packages/cli/tsconfig.json',
            'packages/core/tsconfig.json',
        ]);
    });
});
