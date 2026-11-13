import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { runSync } from '@deltabox/toolchain/core';
import type { ToolchainConfig } from '@deltabox/toolchain/shared';

import { tsconfigSyncTask } from '../src/sync.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tsconfig-regenerate-'));
}

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`);
}

function readJson(file: string): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
}

function scaffold(cwd: string): void {
    writeJson(path.join(cwd, 'package.json'), {
        name: 'acme',
        private: true,
        workspaces: ['packages/*'],
    });
    writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
        compilerOptions: { composite: true },
    });
    writeJson(path.join(cwd, 'packages/a/package.json'), { name: '@acme/a' });
    writeJson(path.join(cwd, 'packages/a/tsconfig.default.json'), {
        compilerOptions: { strict: true },
    });
}

function sync(cwd: string, config: ToolchainConfig): Promise<unknown> {
    return runSync({
        tasks: [tsconfigSyncTask()],
        cwd,
        config,
        tokens: {},
        projectType: 'monorepo-root',
        quiet: true,
    });
}

describe('tsconfig regeneration', () => {
    it('regenerates a deleted workspace tsconfig', async () => {
        const cwd = tmp();
        scaffold(cwd);
        const config: ToolchainConfig = { tsconfig: { refs: true, composite: true } };
        await sync(cwd, config);

        const target = path.join(cwd, 'packages/a/tsconfig.json');
        expect(fs.existsSync(target)).toBe(true);
        fs.rmSync(target);

        await sync(cwd, config);
        expect(fs.existsSync(target)).toBe(true);
        expect(readJson(target).extends).toBe('./tsconfig.default.json');
    });

    it('regenerates a deleted root workspaces tsconfig when auto is enabled', async () => {
        const cwd = tmp();
        scaffold(cwd);
        const config: ToolchainConfig = {
            tsconfig: {
                auto: true,
                refs: true,
                composite: true,
                aliases: true,
            },
        };
        await sync(cwd, config);

        const rootFile = path.join(cwd, 'tsconfig.workspaces.json');
        fs.rmSync(rootFile);
        await sync(cwd, config);
        expect(fs.existsSync(rootFile)).toBe(true);
        expect(readJson(rootFile).references).toEqual([{ path: './packages/a/tsconfig.json' }]);
    });

    it('honours custom root/build/default file names', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'package.json'), {
            name: 'acme',
            private: true,
            workspaces: ['packages/*'],
        });
        writeJson(path.join(cwd, 'tsconfig.graph.json'), {});
        writeJson(path.join(cwd, 'packages/a/package.json'), { name: '@acme/a' });
        writeJson(path.join(cwd, 'packages/a/tsconfig.src.json'), {});
        const config: ToolchainConfig = {
            tsconfig: {
                defaultFile: 'tsconfig.src.json',
                buildFile: 'tsconfig.dist.json',
                rootFile: 'tsconfig.graph.json',
                auto: true,
            },
        };
        await sync(cwd, config);

        expect(fs.existsSync(path.join(cwd, 'packages/a/tsconfig.json'))).toBe(true);
        expect(fs.existsSync(path.join(cwd, 'packages/a/tsconfig.dist.json'))).toBe(true);
        // The seeded build config extends the custom default file.
        expect(readJson(path.join(cwd, 'packages/a/tsconfig.dist.json')).extends).toBe(
            './tsconfig.src.json'
        );
    });

    it('never overwrites an existing build tsconfig', async () => {
        const cwd = tmp();
        scaffold(cwd);
        const buildFile = path.join(cwd, 'packages/a/tsconfig.build.json');
        writeJson(buildFile, {
            extends: './tsconfig.default.json',
            compilerOptions: { keep: true },
        });

        await sync(cwd, { tsconfig: { refs: true, composite: true } });
        expect(readJson(buildFile).compilerOptions).toEqual({ keep: true });
    });

    it('leaves an existing root workspaces tsconfig alone when auto is off', async () => {
        const cwd = tmp();
        scaffold(cwd);
        const rootFile = path.join(cwd, 'tsconfig.workspaces.json');
        writeJson(rootFile, {
            compilerOptions: { composite: false },
            custom: { handWritten: true },
        });

        await sync(cwd, { tsconfig: { refs: true, composite: true } });
        expect(readJson(rootFile).custom).toEqual({ handWritten: true });
    });
});
