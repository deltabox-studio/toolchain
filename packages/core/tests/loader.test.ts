import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { sectionConfig } from '@deltabox/toolchain/shared';

import {
    findConfigFile,
    findParentConfigFile,
    isDbxPluginConfig,
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

    it('does not inherit an ancestor config when --config is explicit', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'app');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: { project: { license: 'MIT', author: 'Root Author' } },
        });
        writeJson(path.join(child, 'alt.config.json'), {
            toolchain: { project: { name: 'alt-name' } },
        });

        const loaded = await loadToolchainConfig(child, { config: 'alt.config.json' });

        expect(loaded.path).toBe(path.join(child, 'alt.config.json'));
        expect(loaded.parentPath).toBeUndefined();
        expect(loaded.config.project).toEqual({ name: 'alt-name' });
    });

    it('accepts a workspace-scoped enabled value', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'dbx.config.json'), {
            toolchain: { enabled: { scope: 'workspace', disabled: true } },
        });
        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.config.enabled).toEqual({ scope: 'workspace', disabled: true });
    });

    it('rejects a global-scoped enabled value in a config file', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'dbx.config.json'), {
            toolchain: { enabled: { scope: 'global' } },
        });
        await expect(loadToolchainConfig(cwd)).rejects.toThrow(/workspace/);
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

    it('can skip the afterLoad hook for metadata-only loads', async () => {
        const cwd = tmp();
        (globalThis as Record<string, unknown>).__dbxHook = undefined;
        fs.writeFileSync(
            path.join(cwd, 'dbx.config.mjs'),
            `export default { toolchain: { hooks: { afterLoad: () => { globalThis.__dbxHook = true; } } } };\n`
        );
        await loadToolchainConfig(cwd, { skipHooks: true });
        expect((globalThis as Record<string, unknown>).__dbxHook).toBeUndefined();
    });

    it('re-evaluates an edited code config with `fresh`', async () => {
        const cwd = tmp();
        const file = path.join(cwd, 'dbx.config.mjs');
        fs.writeFileSync(file, `export default { toolchain: { project: { name: 'one' } } };\n`);
        const first = await loadToolchainConfig(cwd);
        fs.writeFileSync(file, `export default { toolchain: { project: { name: 'two' } } };\n`);
        const second = await loadToolchainConfig(cwd, { fresh: true });
        expect(first.config.project?.name).toBe('one');
        expect(second.config.project?.name).toBe('two');
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
        // The child did not opt into `fmt`, so the parent's `vite.fmt` is not
        // hoisted and no `fmt` section is added.
        expect(merged.fmt).toBeUndefined();
        expect(sectionConfig(merged.vite)?.fmt).toEqual({ singleQuote: true });
    });

    it('does not inherit workspace-scoped sections', () => {
        const merged = mergeToolchainConfig(
            {
                project: { name: 'acme', type: 'monorepo-root', author: 'Acme' },
                ci: { changelog: { branches: { main: 'main' } } },
                changelog: { versioning: true },
                catalogs: { packages: { react: '^19' } },
                tsconfig: { refs: true, aliases: true },
                loader: { tsconfig: 'tsconfig.root.json' },
                vite: {
                    fmt: { printWidth: 100 },
                    test: { include: ['packages/**/tests/**'] },
                    run: { tasks: { 'build:root': { command: 'tsdown' } } },
                },
            },
            { vite: { run: { tasks: { build: { command: 'tsdown' } } } } }
        );
        // Sections the child did not opt into stay absent, even when the parent
        // defines them. `vite` is never inherited.
        expect(merged.ci).toBeUndefined();
        expect(merged.changelog).toBeUndefined();
        expect(merged.catalogs).toBeUndefined();
        expect(merged.fmt).toBeUndefined();
        expect(merged.tsconfig).toBeUndefined();
        expect(merged.loader).toBeUndefined();
        expect(merged.vite).toEqual({ run: { tasks: { build: { command: 'tsdown' } } } });
        expect(merged.project).toEqual({ author: 'Acme' });
        // A nested config may still opt into its own tsconfig generation.
        expect(
            mergeToolchainConfig(
                { tsconfig: { refs: true, aliases: true } },
                { tsconfig: { refs: false } }
            ).tsconfig
        ).toEqual({ refs: false });
    });

    it('locks down the top-level inheritance matrix', () => {
        const parent = {
            project: {
                name: 'acme',
                scope: '@acme',
                description: 'root',
                type: 'monorepo-root' as const,
                author: 'Acme',
                license: 'MIT',
            },
            ci: { ci: true },
            changelog: { versioning: true },
            catalogs: { packages: { react: '^19' } },
            tsconfig: { refs: true },
            loader: { tsconfig: 'tsconfig.root.json' },
            vite: {
                shim: 'static' as const,
                resolve: { tsconfigPaths: true },
                fmt: { printWidth: 80 },
                test: { include: ['root/**'] },
                run: { tasks: { 'build:root': { command: 'tsdown' } } },
            },
            fmt: { oxc: { semi: false } },
            lint: { oxc: { rules: { eqeqeq: 'error' as const } } },
            biome: { enabled: true },
            templates: { sources: [] },
            registry: { templates: { allow: ['example.com'] } },
            watch: { debounce: 100 },
            logger: { level: 'debug' as const },
            providers: { color: false },
            hooks: { afterLoad: () => undefined },
        };

        const merged = mergeToolchainConfig(parent, {});

        // A nested config opts into nothing here: every section stays absent.
        expect(merged.ci).toBeUndefined();
        expect(merged.tsconfig).toBeUndefined();
        expect(merged.loader).toBeUndefined();
        expect(merged.templates).toBeUndefined();
        expect(merged.registry).toBeUndefined();
        expect(merged.watch).toBeUndefined();
        expect(merged.providers).toBeUndefined();
        expect(merged.hooks).toBeUndefined();
        expect(merged.vite).toBeUndefined();
        expect(merged.changelog).toBeUndefined();
        expect(merged.catalogs).toBeUndefined();
        expect(merged.fmt).toBeUndefined();
        expect(merged.lint).toBeUndefined();
        expect(merged.biome).toBeUndefined();
        expect(merged.logger).toBeUndefined();
        // Project metadata is inherited minus its identity fields.
        expect(merged.project).toEqual({ author: 'Acme', license: 'MIT' });

        // When the child opts in, the parent's section fills in the details.
        const optedIn = mergeToolchainConfig(parent, {
            fmt: true,
            lint: true,
            biome: true,
            changelog: true,
            catalogs: true,
            logger: true,
        });
        expect(optedIn.changelog).toEqual({ versioning: true });
        expect(optedIn.catalogs).toEqual({ packages: { react: '^19' } });
        expect(sectionConfig(optedIn.fmt)).toEqual({ oxc: { semi: false, printWidth: 80 } });
        expect(sectionConfig(optedIn.lint)).toEqual({
            oxc: { rules: { eqeqeq: 'error' } },
        });
        expect(sectionConfig(optedIn.biome)).toEqual({ enabled: true });
        expect(sectionConfig(optedIn.logger)).toEqual({ level: 'debug' });

        // A child's own `vite` section stays local; its `fmt` opt-in gets the
        // parent's `vite.fmt` hoisted into `fmt.oxc`.
        const withVite = mergeToolchainConfig(parent, {
            fmt: true,
            vite: { run: { tasks: {} } },
        });
        expect(sectionConfig(withVite.vite)).toEqual({ run: { tasks: {} } });
        expect(sectionConfig(withVite.fmt)?.oxc).toEqual({
            semi: false,
            printWidth: 80,
        });
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
            { project: { inherit: false, name: 'web' }, biome: true }
        );
        expect(merged.project).toEqual({ inherit: false, name: 'web' });
        // An opted-in non-project section still inherits the parent's value.
        expect(merged.biome).toBe(true);
    });

    it('does not inherit `hooks` from the parent config', () => {
        const merged = mergeToolchainConfig(
            { hooks: { afterSync: () => undefined } },
            { biome: true }
        );
        expect(merged.hooks).toBeUndefined();
    });

    it('does not run parent hooks for a nested project without its own config', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        fs.writeFileSync(
            path.join(root, 'dbx.config.mjs'),
            [
                'export default {',
                '    toolchain: {',
                "        project: { name: 'acme' },",
                '        hooks: { afterLoad: () => { globalThis.__dbxParentHook = true; } },',
                '    },',
                '};',
                '',
            ].join('\n')
        );
        delete (globalThis as { __dbxParentHook?: boolean }).__dbxParentHook;

        const loaded = await loadToolchainConfig(child);

        // The parent's identity is not inherited, and neither are its hooks.
        expect(loaded.config.project).toBeUndefined();
        expect(loaded.config.hooks).toBeUndefined();
        expect((globalThis as { __dbxParentHook?: boolean }).__dbxParentHook).toBeUndefined();
    });

    it('does not inherit project identity for a configless workspace', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: {
                project: {
                    name: 'acme',
                    scope: '@acme',
                    description: 'The root app',
                    type: 'monorepo-root',
                    author: 'Acme',
                    license: 'MIT',
                    repo: 'https://github.com/acme/app',
                },
            },
        });
        writeJson(path.join(child, 'package.json'), {
            name: '@acme/web',
            description: 'The web package',
        });
        fs.writeFileSync(path.join(child, 'tsconfig.default.json'), '{}');

        const loaded = await loadToolchainConfig(child, { manageConfigless: true });

        // Shared metadata flows down; identity comes from this project instead.
        expect(loaded.config.project).toEqual({
            author: 'Acme',
            license: 'MIT',
            repo: 'https://github.com/acme/app',
        });
        expect(loaded.tokens.name).toBe('web');
        expect(loaded.tokens.scope).toBe('@acme');
        expect(loaded.tokens.description).toBe('The web package');
        // The root `type: 'monorepo-root'` must not leak into detection.
        expect(loaded.projectType).toBe('monorepo-workspace');
        expect(loaded.configless).toBe(true);
        expect(loaded.managed).toBe(true);
    });

    it('does not manage or inherit configless projects by default', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: {
                project: { name: 'acme', author: 'Acme' },
                fmt: { oxc: { semi: false } },
                logger: { level: 'debug' },
                vite: { fmt: { printWidth: 100 } },
            },
        });
        writeJson(path.join(child, 'package.json'), { name: '@acme/web' });
        fs.writeFileSync(path.join(child, 'tsconfig.default.json'), '{}');

        const loaded = await loadToolchainConfig(child);

        expect(loaded.config).toEqual({});
        expect(loaded.ownConfig).toEqual({});
        expect(loaded.configless).toBe(true);
        expect(loaded.managed).toBe(false);
        // Detection still uses the parent's tsconfig file names.
        expect(loaded.projectType).toBe('monorepo-workspace');
        // Tokens come from this project's own package.json, not the parent.
        expect(loaded.tokens.name).toBe('web');
        expect(loaded.tokens.scope).toBe('@acme');
    });

    it('manages configless projects when the parent opts in', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: {
                project: { name: 'acme', author: 'Acme', manageConfigless: true },
                fmt: { oxc: { semi: false } },
            },
        });
        writeJson(path.join(child, 'package.json'), { name: '@acme/web' });
        fs.writeFileSync(path.join(child, 'tsconfig.default.json'), '{}');

        const loaded = await loadToolchainConfig(child);

        expect(loaded.configless).toBe(true);
        expect(loaded.managed).toBe(true);
        expect(loaded.config.project).toEqual({ author: 'Acme', manageConfigless: true });
        expect(sectionConfig(loaded.config.fmt)).toEqual({ oxc: { semi: false } });
    });

    it('does not inherit workspace-scoped sections for a configless project', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: {
                project: { name: 'acme', author: 'Acme' },
                ci: { ci: true },
                changelog: { versioning: true },
                catalogs: { packages: { react: '^19' } },
                tsconfig: { refs: true },
                vite: {
                    fmt: { printWidth: 100 },
                    test: { include: ['tests/**'] },
                    run: { tasks: { build: { command: 'tsdown' } } },
                },
                loader: { tsconfig: 'tsconfig.root.json' },
                logger: { level: 'debug' },
            },
        });
        writeJson(path.join(child, 'package.json'), { name: 'web' });

        const loaded = await loadToolchainConfig(child, { manageConfigless: true });

        // Shared sections flow down; repository/workspace-scoped ones do not.
        expect(loaded.config.project).toEqual({ author: 'Acme' });
        expect(sectionConfig(loaded.config.logger)).toEqual({ level: 'debug' });
        // `vite` is never inherited; its fmt/lint are hoisted into fmt/lint.
        expect(loaded.config.vite).toBeUndefined();
        expect(sectionConfig(loaded.config.fmt)?.oxc).toEqual({ printWidth: 100 });
        // `changelog` / `catalogs` are inherited.
        expect(loaded.config.changelog).toEqual({ versioning: true });
        expect(loaded.config.catalogs).toEqual({ packages: { react: '^19' } });
        expect(loaded.config.ci).toBeUndefined();
        expect(loaded.config.tsconfig).toBeUndefined();
        expect(loaded.config.loader).toBeUndefined();
        expect(loaded.managed).toBe(true);
    });

    it('detects a configless standalone project without inheriting the root type', async () => {
        const root = tmp();
        const child = path.join(root, 'apps', 'web');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: { project: { name: 'acme', type: 'monorepo-root' } },
        });
        writeJson(path.join(child, 'package.json'), { name: 'web' });

        const loaded = await loadToolchainConfig(child);

        expect(loaded.config.project).toBeUndefined();
        expect(loaded.tokens.name).toBe('web');
        expect(loaded.projectType).toBe('project');
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
        // The child has only its own `vite` section (its tasks) and did not opt
        // into `fmt`, so the parent's `vite.fmt` is not hoisted.
        expect(loaded.config.vite).toEqual({ run: { tasks: { build: { command: 'tsdown' } } } });
        expect(loaded.config.fmt).toBeUndefined();
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

    it('hoists `vite.fmt`/`vite.lint` without inheriting the `vite` section', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        writeJson(path.join(root, 'dbx.config.json'), {
            toolchain: {
                vite: {
                    shim: 'static',
                    resolve: { tsconfigPaths: true },
                    fmt: { printWidth: 100 },
                    lint: { rules: { eqeqeq: 'error' } },
                    test: { include: ['root/**'] },
                    run: { tasks: { 'build:root': { command: 'tsdown' } } },
                },
            },
        });
        writeJson(path.join(child, 'dbx.config.json'), {
            toolchain: {
                fmt: true,
                lint: true,
                vite: { run: { tasks: { build: { command: 'tsdown' } } } },
            },
        });

        const loaded = await loadToolchainConfig(child);
        // The `vite` section itself is not inherited.
        expect(sectionConfig(loaded.config.vite)).toEqual({
            run: { tasks: { build: { command: 'tsdown' } } },
        });
        // Because the child opted into fmt/lint, the parent's vite.fmt/lint are
        // hoisted into the top-level sections.
        expect(sectionConfig(loaded.config.fmt)?.oxc).toEqual({ printWidth: 100 });
        expect(sectionConfig(loaded.config.lint)?.oxc).toEqual({
            rules: { eqeqeq: 'error' },
        });
    });

    it('uses the parent `loader.tsconfig` for a nested config', async () => {
        const root = tmp();
        const child = path.join(root, 'packages', 'web');
        fs.mkdirSync(child, { recursive: true });
        fs.writeFileSync(
            path.join(root, 'dbx.config.mjs'),
            [
                'export default {',
                '    toolchain: { loader: { tsconfig: "tsconfig.loader.json" } },',
                '};',
                '',
            ].join('\n')
        );
        fs.writeFileSync(
            path.join(child, 'dbx.config.ts'),
            "import { answer } from '@lib/answer.js';\nexport default { toolchain: { project: { description: String(answer) } } };\n"
        );
        fs.mkdirSync(path.join(child, 'src'), { recursive: true });
        fs.writeFileSync(path.join(child, 'src', 'answer.ts'), 'export const answer = 42;\n');
        // The child's own `tsconfig.json` does not know `@lib/*`; only the
        // parent-selected loader tsconfig does.
        fs.writeFileSync(
            path.join(child, 'tsconfig.json'),
            JSON.stringify({ compilerOptions: {} })
        );
        fs.writeFileSync(
            path.join(child, 'tsconfig.loader.json'),
            JSON.stringify({
                compilerOptions: {
                    module: 'nodenext',
                    moduleResolution: 'nodenext',
                    baseUrl: '.',
                    paths: { '@lib/*': ['src/*'] },
                },
            })
        );

        const loaded = await loadToolchainConfig(child);
        expect(loaded.error).toBeUndefined();
        expect(loaded.config.project?.description).toBe('42');
        // The loader section is not inherited into the merged config.
        expect(loaded.config.loader).toBeUndefined();
    });
});

describe('config loader tsconfig', () => {
    function writeConfig(cwd: string, source: string): void {
        fs.writeFileSync(path.join(cwd, 'dbx.config.ts'), source);
    }

    function writeTsconfig(cwd: string, name: string, paths: Record<string, string[]>): void {
        fs.writeFileSync(
            path.join(cwd, name),
            JSON.stringify({
                compilerOptions: {
                    module: 'nodenext',
                    moduleResolution: 'nodenext',
                    baseUrl: '.',
                    paths,
                },
            })
        );
    }

    it('uses the nearest tsconfig for path aliases and `.js` -> `.ts` imports', async () => {
        const cwd = tmp();
        fs.mkdirSync(path.join(cwd, 'src'));
        fs.writeFileSync(path.join(cwd, 'src', 'answer.ts'), 'export const answer = 42;\n');
        writeTsconfig(cwd, 'tsconfig.json', { '@lib/*': ['src/*'] });
        writeConfig(
            cwd,
            "import { answer } from '@lib/answer.js';\nexport default { toolchain: { project: { name: String(answer) } } };\n"
        );

        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.error).toBeUndefined();
        expect(loaded.config.project?.name).toBe('42');
    });

    it('resolves `.js`/`.mjs`/`.cjs` specifiers to their TypeScript sources', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'a.ts'), "export const a = 'ts';\n");
        fs.writeFileSync(path.join(cwd, 'b.mts'), "export const b = 'mts';\n");
        fs.writeFileSync(path.join(cwd, 'c.cts'), "export const c = 'cts';\n");
        fs.writeFileSync(path.join(cwd, 'd.js'), "exports.d = 'js';\n");
        fs.writeFileSync(path.join(cwd, 'e.tsx'), "export const e = 'tsx';\n");
        fs.writeFileSync(
            path.join(cwd, 'tsconfig.json'),
            JSON.stringify({ compilerOptions: { allowJs: true } })
        );
        writeConfig(
            cwd,
            [
                "import { a } from './a.js';",
                "import { b } from './b.mjs';",
                "import { c } from './c.cjs';",
                "import d from './d.js';",
                "import { e } from './e.js';",
                'export default {',
                '    toolchain: { project: { name: [a, b, c, d.d, e].join(",") } },',
                '};',
                '',
            ].join('\n')
        );

        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.error).toBeUndefined();
        expect(loaded.config.project?.name).toBe('ts,mts,cts,js,tsx');
    });

    it('honours an explicit `loaderTsconfig` option', async () => {
        const cwd = tmp();
        fs.mkdirSync(path.join(cwd, 'src'));
        fs.writeFileSync(path.join(cwd, 'src', 'answer.ts'), 'export const answer = 7;\n');
        // The nearest tsconfig knows nothing about the alias.
        fs.writeFileSync(path.join(cwd, 'tsconfig.json'), JSON.stringify({ compilerOptions: {} }));
        writeTsconfig(cwd, 'tsconfig.loader.json', { '@custom/*': ['src/*'] });
        writeConfig(
            cwd,
            "import { answer } from '@custom/answer.js';\nexport default { toolchain: { project: { name: String(answer) } } };\n"
        );

        await expect(loadToolchainConfig(cwd)).rejects.toThrow();
        const loaded = await loadToolchainConfig(cwd, {
            loaderTsconfig: 'tsconfig.loader.json',
        });
        expect(loaded.error).toBeUndefined();
        expect(loaded.config.project?.name).toBe('7');
    });

    it('accepts `loader.tsconfig: false` and still loads relative imports', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'answer.ts'), 'export const answer = 1;\n');
        // Even with tsconfig resolution disabled, `.js` -> `.ts` rewriting works.
        writeConfig(
            cwd,
            [
                "import { answer } from './answer.js';",
                'export default {',
                '    toolchain: {',
                '        loader: { tsconfig: false },',
                '        project: { name: String(answer) },',
                '    },',
                '};',
                '',
            ].join('\n')
        );

        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.error).toBeUndefined();
        expect(loaded.config.project?.name).toBe('1');
    });

    it('falls back to a resolution error when the tsconfig cannot resolve an import', async () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'tsconfig.json'), JSON.stringify({}));
        writeConfig(
            cwd,
            "import { nope } from './missing.js';\nexport default { toolchain: { project: { name: String(nope) } } };\n"
        );

        await expect(loadToolchainConfig(cwd)).rejects.toThrow();
    });
});

describe('loadToolchainConfig conflicting flags', () => {
    it('rejects --config together with --no-config', async () => {
        await expect(
            loadToolchainConfig(tmp(), { config: 'dbx.config.json', noConfig: true })
        ).rejects.toThrow(/cannot be used together/);
    });
});

describe('dbx() plugin config', () => {
    function writePluginConfig(
        cwd: string,
        toolchain: Record<string, unknown>,
        form: 'object' | 'function' = 'object'
    ): void {
        const body = [
            'const marker = Symbol.for("@deltabox/toolchain/vite-plugin");',
            'const plugin = { name: "deltabox-toolchain" };',
            `plugin[marker] = { toolchain: ${JSON.stringify(toolchain)} };`,
            form === 'function'
                ? 'export default () => ({ plugins: [plugin] });'
                : 'export default { plugins: [plugin] };',
            '',
        ].join('\n');
        fs.writeFileSync(path.join(cwd, 'vite.config.mjs'), body);
    }

    it('loads the inline config without a dbx.config', async () => {
        const cwd = tmp();
        writePluginConfig(cwd, {
            project: { name: 'plugin-app', scope: '@acme' },
            fmt: { oxc: { printWidth: 90 } },
        });

        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.plugin).toBe(true);
        expect(loaded.pluginPath).toBe(path.join(cwd, 'vite.config.mjs'));
        expect(loaded.managed).toBe(true);
        expect(loaded.configless).toBe(false);
        expect(loaded.config.project?.name).toBe('plugin-app');
        expect(loaded.tokens.scope).toBe('@acme');
        expect(sectionConfig(loaded.config.fmt)?.oxc).toEqual({ printWidth: 90 });
    });

    it('evaluates a config function so inline plugin options survive', async () => {
        const cwd = tmp();
        writePluginConfig(cwd, { project: { name: 'from-function' } }, 'function');
        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.plugin).toBe(true);
        expect(loaded.config.project?.name).toBe('from-function');
    });

    it('detects the published vite-plugin-dbx import through an alias', async () => {
        const cwd = tmp();
        const stub = path.join(cwd, 'node_modules', 'vite-plugin-dbx');
        fs.mkdirSync(stub, { recursive: true });
        fs.writeFileSync(
            path.join(stub, 'package.json'),
            JSON.stringify({ name: 'vite-plugin-dbx', type: 'module', exports: './index.js' })
        );
        fs.writeFileSync(path.join(stub, 'index.js'), 'export const dbx = options => options;\n');
        const body = [
            "import { dbx as pluginFactory } from 'vite-plugin-dbx';",
            'const marker = Symbol.for("@deltabox/toolchain/vite-plugin");',
            'const plugin = { name: "plugin" };',
            'plugin[marker] = { toolchain: { project: { name: "alias-app" } } };',
            'pluginFactory({ toolchain: {} });',
            'export default { plugins: [plugin] };',
            '',
        ].join('\n');
        fs.writeFileSync(path.join(cwd, 'vite.config.mjs'), body);

        expect(isDbxPluginConfig(path.join(cwd, 'vite.config.mjs'))).toBe(true);
        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.plugin).toBe(true);
        expect(loaded.config.project?.name).toBe('alias-app');
    });

    it('passes a synthetic serve env to a config function', async () => {
        const cwd = tmp();
        const body = [
            'const marker = Symbol.for("@deltabox/toolchain/vite-plugin");',
            'const plugin = { name: "deltabox-toolchain" };',
            'export default env => {',
            '    if (env.mode !== "development") throw new Error("missing mode");',
            '    plugin[marker] = { toolchain: { project: { name: env.command } } };',
            '    return { plugins: [plugin] };',
            '};',
            '',
        ].join('\n');
        fs.writeFileSync(path.join(cwd, 'vite.config.mjs'), body);

        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.plugin).toBe(true);
        expect(loaded.config.project?.name).toBe('serve');
    });

    it('merges a dbx.config under the plugin config', async () => {
        const cwd = tmp();
        writeJson(path.join(cwd, 'dbx.config.json'), {
            toolchain: {
                fmt: { oxc: { printWidth: 120 } },
                project: { name: 'from-dbx', author: 'Acme' },
            },
        });
        writePluginConfig(cwd, { project: { name: 'from-plugin' } });

        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.plugin).toBe(true);
        expect(loaded.managed).toBe(true);
        expect(loaded.config.project?.name).toBe('from-plugin');
        expect(loaded.config.project?.author).toBe('Acme');
        expect(sectionConfig(loaded.config.fmt)?.oxc).toEqual({ printWidth: 120 });
    });

    it('never re-imports a generated resolveVite shim', async () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, 'vite.config.ts'),
            [
                "import { defineConfig } from 'vite';",
                "import { resolveVite } from 'vite-plugin-dbx';",
                'export default defineConfig(resolveVite({ cwd: import.meta.dirname }));',
                '',
            ].join('\n')
        );
        const loaded = await loadToolchainConfig(cwd);
        expect(loaded.plugin).toBe(false);
        expect(loaded.managed).toBe(false);
    });

    it('skips the plugin probe when asked', async () => {
        const cwd = tmp();
        writePluginConfig(cwd, { project: { name: 'plugin-app' } });
        const loaded = await loadToolchainConfig(cwd, { skipPluginProbe: true });
        expect(loaded.plugin).toBe(false);
        expect(loaded.config).toEqual({});
    });

    it('inherits a parent plugin config when the workspace only has its own plugin', async () => {
        const root = tmp();
        const child = path.join(root, 'packages/app');
        fs.mkdirSync(child, { recursive: true });
        writePluginConfig(root, {
            project: { author: 'Acme', license: 'MIT' },
            fmt: { oxc: { tabWidth: 4 } },
            lint: true,
        });
        writePluginConfig(child, { fmt: true, lint: true });

        const loaded = await loadToolchainConfig(child, { skipHooks: true });
        expect(loaded.plugin).toBe(true);
        expect(loaded.managed).toBe(true);
        expect(sectionConfig(loaded.config.fmt)?.oxc).toEqual({ tabWidth: 4 });
        expect(loaded.config.project?.author).toBe('Acme');
    });
});
