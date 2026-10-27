import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveChangelogConfig, sectionConfig } from '@deltabox/toolchain-shared';

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

    it('rejects the deprecated top-level `changelog` section', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'dbx.config.json'), {
            toolchain: { changelog: { branches: { main: 'trunk' } } },
        });
        await expect(loadToolchainConfig(cwd)).rejects.toThrow(/toolchain\.changelog.*deprecated/);

        // Tolerant loading (the CLI) keeps unrelated commands alive but reports it.
        const loaded = await loadToolchainConfig(cwd, { tolerant: true });
        expect(loaded.error).toMatch(/toolchain\.changelog.*deprecated/);
    });
});

describe('nested config inheritance', () => {
    it('merges a workspace config over the root config (leaves replace)', () => {
        const merged = mergeToolchainConfig(
            {
                ci: {
                    changelog: {
                        branches: { main: 'main', dev: 'dev' },
                        commitlint: { scopes: ['core', 'cli'] },
                    },
                },
                tsconfig: { refs: true, aliases: true },
            },
            {
                ci: { changelog: { commitlint: { scopes: ['web'] } } },
                tsconfig: { refs: false },
            }
        );
        // Objects are combined, arrays/booleans in the child replace.
        const changelog = resolveChangelogConfig(merged);
        expect(changelog?.branches).toEqual({ main: 'main', dev: 'dev' });
        expect(changelog?.commitlint).toEqual({ scopes: ['web'] });
        expect(sectionConfig(merged.tsconfig)).toEqual({ refs: false, aliases: true });
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
                ci: {
                    changelog: {
                        branches: { main: 'trunk' },
                        commitlint: { scopes: ['core'] },
                    },
                },
            },
        });
        writeJson(path.join(child, 'dbx.config.json'), {
            toolchain: { ci: { changelog: { commitlint: { scopes: ['web'] } } } },
        });

        expect(findParentConfigFile(child)).toBe(path.join(root, 'dbx.config.json'));
        // A repo root (with `.git`) never inherits from above itself.
        expect(findParentConfigFile(root)).toBeUndefined();

        const loaded = await loadToolchainConfig(child);
        expect(loaded.path).toBe(path.join(child, 'dbx.config.json'));
        expect(loaded.parentPath).toBe(path.join(root, 'dbx.config.json'));
        const childChangelog = resolveChangelogConfig(loaded.config);
        expect(sectionConfig(childChangelog?.commitlint)?.scopes).toEqual(['web']);
        expect(childChangelog?.branches?.main).toBe('trunk');
        // The parent's `project` is identity-only, so nothing is inherited.
        expect(loaded.config.project).toBeUndefined();
        expect(loaded.projectType).toBe('project');
    });
});
