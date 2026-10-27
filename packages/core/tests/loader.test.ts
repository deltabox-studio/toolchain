import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { sectionConfig } from '@deltabox/toolchain-shared';

import {
    findConfigFile,
    findParentConfigFile,
    loadToolchainConfig,
    mergeToolchainConfig,
} from '../src/loader.js';

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-load-'));
    // Mark it as a repo root so config inheritance never walks above the test.
    fs.mkdirSync(path.join(dir, '.git'));
    return dir;
}

function writeJson(file: string, value: unknown): void {
    fs.writeFileSync(file, JSON.stringify(value));
}

describe('loadToolchainConfig', () => {
    it('finds and loads a JSON config + resolves tokens', async () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.json'),
            JSON.stringify({
                toolchain: {
                    project: {
                        name: 'acme',
                        scope: '@acme',
                        repo: 'https://github.com/acme/app',
                    },
                    ci: { changelog: { branches: { main: 'trunk', dev: 'develop' } } },
                },
            })
        );
        expect(findConfigFile(cwd)).toBe(path.join(cwd, 'dbx.config.json'));

        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.config.project?.name).toBe('acme');
        expect(loaded.tokens.name).toBe('acme');
        expect(loaded.tokens.scope).toBe('@acme');
        expect(loaded.tokens.repoSlug).toBe('acme/app');
        expect(loaded.tokens.mainBranch).toBe('trunk');
    });

    it('returns defaults when no config file exists', async () => {
        const loaded = await loadToolchainConfig(tmp());
        expect(loaded.config).toEqual({});
        expect(loaded.path).toBeUndefined();
        expect(loaded.tokens.name).toBe('app');
        expect(loaded.tokens.packageManager).toBe('yarn');
    });

    it('runs the afterLoad hook for a JS config', async () => {
        const cwd = tmp();
        (globalThis as Record<string, unknown>).__dbxHook = undefined;
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.mjs'),
            `export default { toolchain: { hooks: { afterLoad: () => { globalThis.__dbxHook = true; } } } };\n`
        );
        await loadToolchainConfig(cwd);
        expect((globalThis as Record<string, unknown>).__dbxHook).toBe(true);
    });

    it('resolves a config exported as an async callback', async () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.mjs'),
            `export default async () => ({ toolchain: { project: { name: 'callback' } } });\n`
        );
        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.config.project?.name).toBe('callback');
    });

    it('resolves a config exported as a promise', async () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.mjs'),
            `export default Promise.resolve({ toolchain: { project: { name: 'promised' } } });\n`
        );
        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.config.project?.name).toBe('promised');
    });

    it('loads the manual `changelog` section', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'dbx.config.json'), {
            toolchain: {
                changelog: { commitlint: { types: ['feat'] }, versioning: false },
            },
        });
        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.error).toBeUndefined();
        expect(loaded.config.changelog).toEqual({
            commitlint: { types: ['feat'] },
            versioning: false,
        });
    });

    it('ignores discovered configs with `noConfig`', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'dbx.config.json'), {
            toolchain: { project: { name: 'discovered' } },
        });
        const loaded = await loadToolchainConfig(cwd, { noConfig: true });
        expect(loaded.config).toEqual({});
        expect(loaded.path).toBeUndefined();
        expect(loaded.tokens.name).toBe('app');
    });

    it('loads an explicit `config` file', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'dbx.config.test.json'), {
            toolchain: { project: { name: 'explicit' } },
        });
        const loaded = await loadToolchainConfig(cwd, { config: 'dbx.config.test.json' });
        expect(loaded.path).toBe(path.join(cwd, 'dbx.config.test.json'));
        expect(loaded.config.project?.name).toBe('explicit');
    });
});

describe('nested config inheritance', () => {
    it('merges a workspace config over the root config (leaves replace)', () => {
        const merged = mergeToolchainConfig(
            {
                logger: { level: 'debug', color: false },
                vite: { fmt: { printWidth: 100, ignorePatterns: ['**/dist/**'] } },
            },
            {
                logger: { level: 'warn' },
                vite: { fmt: { singleQuote: true } },
            }
        );
        // Objects are combined, arrays/booleans in the child replace.
        expect(sectionConfig(merged.logger)).toEqual({ level: 'warn', color: false });
        expect(sectionConfig(merged.vite)?.fmt).toEqual({
            printWidth: 100,
            ignorePatterns: ['**/dist/**'],
            singleQuote: true,
        });
    });

    it('does not inherit workspace-scoped sections', () => {
        const merged = mergeToolchainConfig(
            {
                project: { name: 'acme', type: 'monorepo-root', author: 'Acme' },
                ci: { changelog: { branches: { main: 'main' } } },
                changelog: { versioning: true },
                tsconfig: { refs: true, aliases: true },
                vite: {
                    fmt: { printWidth: 100 },
                    test: { include: ['packages/**/tests/**'] },
                    run: { tasks: { 'build:root': { command: 'tsdown' } } },
                },
            },
            { vite: { run: { tasks: { build: { command: 'tsdown' } } } } }
        );
        // CI/changelog/tsconfig are repository-level; test/run describe the workspace.
        expect(merged.ci).toBeUndefined();
        expect(merged.changelog).toBeUndefined();
        expect(merged.tsconfig).toBeUndefined();
        expect(sectionConfig(merged.vite)?.fmt).toEqual({ printWidth: 100 });
        expect(sectionConfig(merged.vite)?.test).toBeUndefined();
        expect(sectionConfig(merged.vite)?.run).toEqual({
            tasks: { build: { command: 'tsdown' } },
        });
        expect(merged.project).toEqual({ author: 'Acme' });
        // A nested config may still opt into its own tsconfig generation.
        expect(
            mergeToolchainConfig(
                { tsconfig: { refs: true, aliases: true } },
                { tsconfig: { refs: false } }
            ).tsconfig
        ).toEqual({ refs: false });
    });

    it('inherits shared `project` fields but never the identity ones', () => {
        const merged = mergeToolchainConfig(
            {
                project: {
                    name: 'acme',
                    scope: '@acme',
                    type: 'monorepo-root',
                    author: 'Acme',
                    license: 'MIT',
                },
            },
            { biome: true }
        );
        // `name`/`scope`/`type` are identity; `author`/`license` flow down.
        expect(merged.project).toEqual({ author: 'Acme', license: 'MIT' });

        const explicit = mergeToolchainConfig(
            { project: { name: 'acme', author: 'Acme', license: 'MIT' } },
            { project: { name: 'web' } }
        );
        expect(explicit.project).toEqual({ name: 'web', author: 'Acme', license: 'MIT' });

        // A parent with only identity fields contributes nothing.
        expect(
            mergeToolchainConfig(
                { project: { name: 'acme', type: 'monorepo-root' } },
                { biome: true }
            ).project
        ).toBeUndefined();
    });

    it('keeps `project` independent when `project.inherit` is false', () => {
        const merged = mergeToolchainConfig(
            {
                project: { name: 'acme', scope: '@acme', type: 'monorepo-root' },
                biome: true,
            },
            { project: { inherit: false, name: 'web' } }
        );
        expect(merged.project).toEqual({ inherit: false, name: 'web' });
        // Non-project sections still inherit.
        expect(merged.biome).toBe(true);
    });

    it('does not inherit `hooks` from the parent config', () => {
        const merged = mergeToolchainConfig(
            { hooks: { afterSync: () => undefined } },
            { biome: true }
        );
        expect(merged.hooks).toBeUndefined();
    });

    it('finds the nearest ancestor config and loads it under the child', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: {
                project: { name: 'acme', type: 'monorepo-root' },
                tsconfig: { refs: true, aliases: true },
                logger: { level: 'debug', color: false },
                ci: {
                    changelog: {
                        branches: { main: 'trunk' },
                        commitlint: { scopes: ['core'] },
                    },
                },
                vite: {
                    fmt: { printWidth: 100 },
                    run: { tasks: { 'build:root': { command: 'tsdown' } } },
                },
            },
        });
        writeJson(path.join(child, 'dbx.config.json'), {
            toolchain: {
                logger: { level: 'warn' },
                vite: { run: { tasks: { build: { command: 'tsdown' } } } },
            },
        });

        expect(findParentConfigFile(child)).toBe(path.join(root, 'dbx.config.json'));
        // A repo root (with `.git`) never inherits from above itself.
        expect(findParentConfigFile(root)).toBeUndefined();

        const loaded = await loadToolchainConfig(child);
        expect(loaded.path).toBe(path.join(child, 'dbx.config.json'));
        expect(loaded.parentPath).toBe(path.join(root, 'dbx.config.json'));
        // Shared sections inherit; workspace-scoped ones do not.
        expect(sectionConfig(loaded.config.logger)).toEqual({ level: 'warn', color: false });
        expect(loaded.config.tsconfig).toBeUndefined();
        expect(sectionConfig(loaded.config.vite)?.fmt).toEqual({ printWidth: 100 });
        expect(sectionConfig(loaded.config.vite)?.run).toEqual({
            tasks: { build: { command: 'tsdown' } },
        });
        expect(loaded.config.ci).toBeUndefined();
        // The parent's `project` is identity-only, so nothing is inherited.
        expect(loaded.config.project).toBeUndefined();
        expect(loaded.projectType).toBe('project');
    });

    it('uses the parent tsconfig file names for detection without inheriting the section', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: {
                project: { type: 'monorepo-root' },
                tsconfig: { defaultFile: 'tsconfig.ws.json', refs: true },
            },
        });
        writeJson(path.join(child, 'dbx.config.json'), {
            toolchain: { logger: { level: 'warn' } },
        });
        fs.writeFileSync(path.join(child, 'tsconfig.ws.json'), '{}');

        const loaded = await loadToolchainConfig(child);
        expect(loaded.projectType).toBe('monorepo-workspace');
        // Detection sees the file name, but the generation options stay at the root.
        expect(loaded.config.tsconfig).toBeUndefined();
    });
});
