import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { SyncContext, ToolchainConfig } from '@deltabox/toolchain-shared';

import { projectSyncTask } from '../src/index.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-project-'));
}

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 4));
}

function ctx(cwd: string, config: ToolchainConfig): SyncContext {
    return {
        cwd,
        projectType: 'project',
        config,
        tokens: {},
        log: () => {},
        warn: () => {},
    };
}

describe('projectSyncTask', () => {
    it('is disabled without a project section', () => {
        const task = projectSyncTask();
        expect(task.enabled?.({})).toBe(false);
        expect(task.enabled?.({ project: {} })).toBe(true);
    });

    it('writes the defined fields into package.json, keeping the rest', async () => {
        const cwd = tmp();
        fs.mkdirSync(path.join(cwd, '.git'));
        writeJson(path.join(cwd, 'package.json'), {
            name: 'old',
            version: '1.2.3',
            scripts: { test: 'vitest' },
        });

        const files = await projectSyncTask().run(
            ctx(cwd, {
                project: {
                    name: 'toolchain',
                    scope: '@deltabox',
                    description: 'A toolchain',
                    license: 'MPL-2.0',
                    repo: 'https://github.com/deltabox-studio/toolchain',
                    packageManager: 'yarn',
                    packageManagerVersion: '4.17.1',
                },
            })
        );
        const file = files?.find(f => f.path === 'package.json');
        expect(file).toBeDefined();
        const pkg = JSON.parse(file!.content);
        expect(pkg.name).toBe('@deltabox/toolchain');
        expect(pkg.description).toBe('A toolchain');
        expect(pkg.license).toBe('MPL-2.0');
        expect(pkg.repository).toEqual({
            type: 'git',
            url: 'git+https://github.com/deltabox-studio/toolchain.git',
        });
        expect(pkg.packageManager).toBe('yarn@4.17.1');
        // Preserved.
        expect(pkg.version).toBe('1.2.3');
        expect(pkg.scripts).toEqual({ test: 'vitest' });
    });

    it('resolves repo to the workspace path via repository.directory', async () => {
        const root = tmp();
        fs.mkdirSync(path.join(root, '.git'));
        const ws = path.join(root, 'packages', 'app');
        writeJson(path.join(ws, 'package.json'), { name: '@acme/app' });

        const files = await projectSyncTask().run(
            ctx(ws, { project: { repo: 'https://github.com/acme/app' } })
        );
        const pkg = JSON.parse(files!.find(f => f.path === 'package.json')!.content);
        expect(pkg.repository.directory).toBe('packages/app');
    });

    it('returns nothing when no field is defined', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'package.json'), { name: 'x' });
        expect(await projectSyncTask().run(ctx(cwd, { project: {} }))).toEqual([]);
    });
});
