import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vite-plus/test';

import { logger, type ToolchainConfig } from '@deltabox/toolchain/shared';

import { tsconfigCommands } from '../src/cli/index.js';
import { generateWorkspaceTsconfigs, tsconfigSyncTask } from '../src/index.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-auto-'));
}

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 4));
}

function write(file: string, content: string): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

interface RepoOptions {
    workspaces?: string[];
    paths?: Record<string, string[]>;
    references?: Array<{ path: string }>;
}

function makeRepo(options: RepoOptions = {}): string {
    const cwd = tmp();
    writeJson(path.join(cwd, 'package.json'), {
        name: '@org/root',
        private: true,
        workspaces: ['packages/*'],
    });
    writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
        compilerOptions: { paths: options.paths ?? {} },
        ...(options.references ? { references: options.references } : {}),
    });
    for (const name of options.workspaces ?? ['foo', 'bar']) {
        const dir = path.join(cwd, 'packages', name);
        writeJson(path.join(dir, 'package.json'), { name: `@org/${name}` });
        writeJson(path.join(dir, 'tsconfig.default.json'), {});
        write(path.join(dir, 'src/index.ts'), 'export {};\n');
    }
    return cwd;
}

async function run(
    cwd: string,
    tsconfig: ToolchainConfig['tsconfig'],
    previousAuto?: { paths: string[]; references: string[] }
) {
    const config: ToolchainConfig = { tsconfig };
    return generateWorkspaceTsconfigs({
        cwd,
        config,
        write: false,
        ...(previousAuto ? { previousAuto } : {}),
    });
}

function pathsOf(result: Awaited<ReturnType<typeof run>>): Record<string, string[]> {
    return result.autoConfig.compilerOptions?.paths ?? {};
}

describe('tsconfig auto alias rewriting', () => {
    it('writes paths in descending key order', async () => {
        const cwd = makeRepo({ workspaces: ['core', 'web'] });
        const keys = Object.keys(pathsOf(await run(cwd, { auto: true })));
        const sorted = [...keys].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
        expect(keys).toEqual(sorted);
    });

    it('writes paths relative to a nested rootFile', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: true,
            composite: true,
            refs: true,
            rootFile: 'config/tsconfig.workspaces.json',
        });
        const paths = pathsOf(result);

        expect(paths['@org/foo']).toEqual(['../packages/foo/src/index.ts']);
        expect(
            (result.autoConfig.references ?? []).map(reference => reference.path).sort()
        ).toEqual(['../packages/bar/tsconfig.json', '../packages/foo/tsconfig.json']);
    });

    it('rewrites generated keys with string patterns', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: { rewriteAlias: { '^@org/foo$': '@org/pkg-foo' } },
        });
        const paths = pathsOf(result);

        expect(paths['@org/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/foo']).toBeUndefined();
        expect(result.autoState.paths).toContain('@org/pkg-foo');
    });

    it('rewrites generated keys with RegExp capture groups', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: {
                rewriteAlias: [{ pattern: /^@org\/foo(.*)$/, replacement: '@org/pkg-foo$1' }],
            },
        });
        const paths = pathsOf(result);

        expect(paths['@org/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/pkg-foo/*']).toEqual(['./packages/foo/src/*']);
        expect(paths['@org/foo']).toBeUndefined();
    });

    it('supports an array of patterns in one rule', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: {
                rewriteAlias: [
                    {
                        pattern: ['^@org/(foo)(.*)$', '^@org/(bar)(.*)$'],
                        replacement: '@org/pkg-$1$2',
                    },
                ],
            },
        });
        const paths = pathsOf(result);

        expect(paths['@org/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/pkg-foo/*']).toEqual(['./packages/foo/src/*']);
        expect(paths['@org/pkg-bar']).toEqual(['./packages/bar/src/index.ts']);
        expect(paths['@org/pkg-bar/*']).toEqual(['./packages/bar/src/*']);
    });

    it('applies an array of rewrite rules in order (first match wins)', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: {
                rewriteAlias: [
                    { pattern: '^@org/foo$', replacement: '@org/first' },
                    { pattern: '^@org/foo$', replacement: '@org/second' },
                    { pattern: '^@org/bar$', replacement: '@org/from-bar' },
                ],
            },
        });
        const paths = pathsOf(result);

        expect(paths['@org/first']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/second']).toBeUndefined();
        expect(paths['@org/from-bar']).toEqual(['./packages/bar/src/index.ts']);
    });

    it('preserves custom keys (including ones that collide with generated keys)', async () => {
        const cwd = makeRepo({
            paths: {
                '@custom/thing': ['./custom.ts'],
                '@org/foo': ['./hand-written/foo.ts'],
            },
        });
        const result = await run(cwd, {
            auto: { rewriteAlias: { '^@org/foo$': '@org/pkg-foo' } },
        });
        const paths = pathsOf(result);

        expect(paths['@custom/thing']).toEqual(['./custom.ts']);
        expect(paths['@org/foo']).toEqual(['./hand-written/foo.ts']);
        expect(paths['@org/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
    });

    it('removes stale auto keys when the rewrite changes', async () => {
        const cwd = makeRepo();
        const first = await run(cwd, {
            auto: { rewriteAlias: { '^@org/foo$': '@org/old-foo' } },
        });
        expect(pathsOf(first)['@org/old-foo']).toEqual(['./packages/foo/src/index.ts']);
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), first.autoConfig);

        const second = await run(
            cwd,
            { auto: { rewriteAlias: { '^@org/foo$': '@org/new-foo' } } },
            first.autoState
        );
        const paths = pathsOf(second);

        expect(paths['@org/new-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/old-foo']).toBeUndefined();
        expect(second.autoState.paths).toContain('@org/new-foo');
        expect(second.autoState.paths).not.toContain('@org/old-foo');
    });

    it('filters aliases against the rewritten keys (include)', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: { rewriteAlias: { '^@org/(.+)$': '@org/pkg-$1' } },
            aliasAuto: { include: ['@org/pkg-foo*'] },
        });
        const paths = pathsOf(result);

        expect(paths['@org/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/pkg-foo/*']).toEqual(['./packages/foo/src/*']);
        expect(paths['@org/pkg-bar']).toBeUndefined();
        expect(paths['@org/foo']).toBeUndefined();
    });

    it('filters aliases against the rewritten keys (exclude)', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: { rewriteAlias: { '^@org/(.+)$': '@org/pkg-$1' } },
            aliasAuto: { exclude: ['@org/pkg-bar*'] },
        });
        const paths = pathsOf(result);

        expect(paths['@org/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/pkg-bar']).toBeUndefined();
        expect(paths['@org/bar']).toBeUndefined();
    });

    it('filters references against the generated reference path (include)', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: true,
            composite: true,
            refs: true,
            refsAuto: { include: ['./packages/foo/tsconfig.json'] },
        });

        expect(result.autoConfig.references).toEqual([{ path: './packages/foo/tsconfig.json' }]);
    });

    it('filters references against the generated reference path (exclude)', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: true,
            composite: true,
            refs: true,
            refsAuto: { exclude: ['./packages/bar/tsconfig.json'] },
        });
        const references = result.autoConfig.references ?? [];

        expect(references).toContainEqual({ path: './packages/foo/tsconfig.json' });
        expect(references).not.toContainEqual({ path: './packages/bar/tsconfig.json' });
    });

    it('honours nested rewrite configs and aliasAuto: false', async () => {
        const cwd = makeRepo();
        write(
            path.join(cwd, 'packages/foo/dbx.config.ts'),
            'export default { toolchain: { tsconfig: { auto: { rewriteAlias: ' +
                "{ '^@org/foo$': '@org/nested-foo' } } } } };\n"
        );
        write(
            path.join(cwd, 'packages/bar/dbx.config.ts'),
            'export default { toolchain: { tsconfig: { aliasAuto: false } } };\n'
        );

        const result = await run(cwd, { auto: true });
        const paths = pathsOf(result);

        expect(paths['@org/nested-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/foo']).toBeUndefined();
        expect(paths['@org/bar']).toBeUndefined();
        expect(paths['@org/bar/*']).toBeUndefined();
    });

    it('keeps aliasAuto usable when auto is disabled', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, { auto: false, aliasAuto: true });
        const paths = pathsOf(result);

        expect(paths['@org/foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(result.autoState.paths).toContain('@org/foo');
    });

    it('defaults auto off and leaves hand-written paths untouched', async () => {
        const cwd = makeRepo({ paths: { '@org/foo': ['./hand-written/foo.ts'] } });
        const result = await run(cwd, {});
        const paths = pathsOf(result);

        expect(paths).toEqual({ '@org/foo': ['./hand-written/foo.ts'] });
        expect(result.autoState.paths).toEqual([]);
    });

    it('does not adopt pre-existing keys, so disabling auto keeps them', async () => {
        const cwd = makeRepo({ paths: { '@org/foo': ['./hand-written/foo.ts'] } });
        const first = await run(cwd, { auto: true });
        expect(first.autoState.paths).not.toContain('@org/foo');
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), first.autoConfig);

        const second = await run(cwd, { auto: false }, first.autoState);
        expect(pathsOf(second)['@org/foo']).toEqual(['./hand-written/foo.ts']);
    });

    it('leaves hand-written references untouched when auto is off', async () => {
        const cwd = makeRepo({ references: [{ path: './packages/foo/tsconfig.json' }] });
        const result = await run(cwd, {});
        expect(result.autoConfig.references).toEqual([{ path: './packages/foo/tsconfig.json' }]);
        expect(result.autoState.references).toEqual([]);
    });

    it('treats refs auto as composite and keeps workspace references', async () => {
        const cwd = makeRepo({ references: [{ path: './packages/foo/tsconfig.json' }] });
        const result = await run(cwd, { auto: true });
        expect(result.autoConfig.references).toContainEqual({
            path: './packages/foo/tsconfig.json',
        });
        expect(result.autoConfig.references).toContainEqual({
            path: './packages/bar/tsconfig.json',
        });
    });

    it('recognises a reference written without a leading ./', async () => {
        const cwd = makeRepo({
            workspaces: ['foo'],
            references: [{ path: 'packages/foo/tsconfig.json' }],
        });
        const result = await run(cwd, { auto: true });
        const references = result.autoConfig.references ?? [];

        expect(references).toHaveLength(1);
        expect(references[0]?.path.replace(/^\.\//, '')).toBe('packages/foo/tsconfig.json');
    });

    it('does not duplicate an active reference written without a leading ./', async () => {
        const cwd = makeRepo({ references: [{ path: 'packages/foo/tsconfig.json' }] });
        const result = await run(cwd, { auto: true, composite: true, refs: true });
        const references = (result.autoConfig.references ?? []).map(reference =>
            reference.path.replace(/^\.\//, '')
        );

        expect(references.filter(path => path === 'packages/foo/tsconfig.json')).toHaveLength(1);
    });
});

describe('tsconfig alias discovery modes', () => {
    function withExports(cwd: string, name = 'foo'): void {
        const dir = path.join(cwd, 'packages', name);
        writeJson(path.join(dir, 'package.json'), {
            name: `@org/${name}`,
            exports: {
                '.': {
                    types: './dist/index.d.ts',
                    import: './dist/index.js',
                },
                './utils': {
                    types: './dist/utils.d.ts',
                    import: './dist/utils.js',
                },
            },
        });
        writeJson(path.join(dir, 'tsconfig.default.json'), {
            compilerOptions: { rootDir: 'src', outDir: 'dist' },
        });
        write(path.join(dir, 'src/index.ts'), 'export {};\n');
        write(path.join(dir, 'src/utils.ts'), 'export {};\n');
        write(path.join(dir, 'src/components/index.ts'), 'export {};\n');
    }

    it('resolves package exports to source files by default', async () => {
        const cwd = makeRepo();
        withExports(cwd);
        const result = await run(cwd, { auto: { modes: 'exports' } });
        const paths = pathsOf(result);

        expect(paths['@org/foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/foo/utils']).toEqual(['./packages/foo/src/utils.ts']);
        expect(paths['@org/foo/*']).toEqual(['./packages/foo/src/*']);
        expect(JSON.stringify(paths)).not.toContain('dist');
    });

    it('can resolve exports to distributed files when devMode is false', async () => {
        const cwd = makeRepo();
        withExports(cwd);
        const result = await run(cwd, { auto: { modes: 'exports', devMode: false } });
        const paths = pathsOf(result);

        expect(paths['@org/foo']).toEqual(['./packages/foo/dist/index.js']);
        expect(paths['@org/foo/utils']).toEqual(['./packages/foo/dist/utils.js']);
        expect(paths['@org/foo/*']).toEqual(['./packages/foo/dist/*']);
    });

    it('uses a custom dist directory for the source/dist mapping', async () => {
        const cwd = makeRepo();
        const dir = path.join(cwd, 'packages/foo');
        writeJson(path.join(dir, 'package.json'), {
            name: '@org/foo',
            exports: { './utils': './build/utils.js' },
        });
        writeJson(path.join(dir, 'tsconfig.default.json'), {
            compilerOptions: { rootDir: 'src', outDir: 'build' },
        });
        write(path.join(dir, 'src/utils.ts'), 'export {};\n');

        const result = await run(cwd, { auto: { modes: 'exports' } });
        expect(pathsOf(result)['@org/foo/utils']).toEqual(['./packages/foo/src/utils.ts']);
    });

    it('can scan only the project structure', async () => {
        const cwd = makeRepo();
        withExports(cwd);
        const result = await run(cwd, { auto: { modes: 'project-structure' } });
        const paths = pathsOf(result);

        expect(paths['@org/foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/foo/components']).toEqual(['./packages/foo/src/components/index.ts']);
        expect(paths['@org/foo/utils']).toBeUndefined();
    });

    it('maps project-structure aliases to dist when devMode is false', async () => {
        const cwd = makeRepo();
        withExports(cwd);
        const result = await run(cwd, {
            auto: { modes: 'project-structure', devMode: false },
        });
        const paths = pathsOf(result);

        expect(paths['@org/foo']).toEqual(['./packages/foo/dist/index.js']);
        expect(paths['@org/foo/components']).toEqual(['./packages/foo/dist/components/index.js']);
        expect(paths['@org/foo/*']).toEqual(['./packages/foo/dist/*']);
    });

    it('combines exports and project-structure without overriding exports', async () => {
        const cwd = makeRepo();
        withExports(cwd);
        const result = await run(cwd, {
            auto: { modes: ['exports', 'project-structure'] },
        });
        const paths = pathsOf(result);

        expect(paths['@org/foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@org/foo/utils']).toEqual(['./packages/foo/src/utils.ts']);
        expect(paths['@org/foo/components']).toEqual(['./packages/foo/src/components/index.ts']);
    });

    it('uses a custom prefix for generated alias keys', async () => {
        const cwd = makeRepo();
        withExports(cwd);
        const result = await run(cwd, { auto: { modes: 'exports', prefix: '@' } });
        const paths = pathsOf(result);

        expect(paths['@/foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@/foo/utils']).toEqual(['./packages/foo/src/utils.ts']);
        expect(paths['@/foo/*']).toEqual(['./packages/foo/src/*']);
        expect(paths['@org/foo']).toBeUndefined();
    });

    it('rewrites the generated keys (including a custom prefix)', async () => {
        const cwd = makeRepo();
        withExports(cwd);
        const result = await run(cwd, {
            auto: {
                modes: 'exports',
                prefix: '@',
                rewriteAlias: { '^@/foo/utils$': '@/helpers' },
            },
        });
        const paths = pathsOf(result);

        expect(paths['@/helpers']).toEqual(['./packages/foo/src/utils.ts']);
        expect(paths['@/foo/utils']).toBeUndefined();
        expect(result.autoState.paths).toContain('@/helpers');
    });
});

describe('tsconfig section gating', () => {
    it('skips generation when the section is disabled or undefined', async () => {
        const cwd = makeRepo();
        for (const tsconfig of [false, undefined] as const) {
            const result = await run(cwd, tsconfig);
            expect(result.skipped).toBe(true);
            expect(result.results).toEqual([]);
        }
    });

    it('runs the generator in a workspace with its own tsconfig section', async () => {
        const cwd = makeRepo();
        const workspace = path.join(cwd, 'packages/foo');
        const result = await run(workspace, { auto: true });

        expect(result.skipped).toBeUndefined();
        expect(result.results.map(item => item.dirnameRelative)).toEqual(['.']);
        expect(result.results[0]?.newTsconfig.extends).toBe('./tsconfig.default.json');
    });

    it('scopes the sync task to roots and workspaces', () => {
        expect(tsconfigSyncTask().projectTypes).toEqual(['monorepo-root', 'monorepo-workspace']);
    });

    it('lets a nested workspace with its own tsconfig section own its output', async () => {
        const cwd = makeRepo();
        write(
            path.join(cwd, 'packages/foo/dbx.config.ts'),
            'export default { toolchain: { tsconfig: {} } };\n'
        );

        const result = await run(cwd, { auto: true });
        const foo = result.workspaces.find(workspace => workspace.relativeDir === 'packages/foo');

        expect(foo?.ownTsconfig).toBe(true);
        // The root still aliases foo, but only generates the other workspace.
        expect(result.results.map(item => item.dirnameRelative)).toEqual(['packages/bar']);
        expect(pathsOf(result)['@org/foo']).toEqual(['./packages/foo/src/index.ts']);
    });
});

function tsconfigCommand() {
    const command = tsconfigCommands().find(candidate => candidate.name === 'tsconfig');
    if (!command) throw new Error('missing tsconfig command');
    return command;
}

function commandContext(cwd: string, config: ToolchainConfig) {
    return {
        cwd,
        projectType: 'monorepo-root' as const,
        config,
        tokens: {},
        syncTasks: [],
    };
}

describe('tsconfig command overrides', () => {
    it('records and reverts a root override on apply-then-remove', async () => {
        const cwd = makeRepo();
        const rootFile = path.join(cwd, 'tsconfig.workspaces.json');
        const manifestFile = path.join(cwd, '.dbx/toolchain/manifest.json');
        const command = tsconfigCommand();
        const appliedConfig: ToolchainConfig = {
            tsconfig: { overrides: { root: { compilerOptions: { types: ['node'] } } } },
        };

        await command.run({}, commandContext(cwd, appliedConfig));
        expect(JSON.parse(fs.readFileSync(rootFile, 'utf-8')).compilerOptions.types).toEqual([
            'node',
        ]);
        const applied = JSON.parse(fs.readFileSync(manifestFile, 'utf-8')) as {
            snapshots: Record<string, unknown>;
            tsconfigOverrides: Record<string, { kind: string }>;
        };
        expect(applied.snapshots['tsconfig.workspaces.json']).toEqual({
            compilerOptions: {},
        });
        expect(applied.tsconfigOverrides['tsconfig.workspaces.json']?.kind).toBe('root');

        // Removing the override must revert the user-owned root file using the
        // snapshot recorded by the previous run.
        await command.run({}, commandContext(cwd, { tsconfig: {} }));
        expect(JSON.parse(fs.readFileSync(rootFile, 'utf-8'))).toEqual({
            compilerOptions: {},
        });
        const removed = JSON.parse(fs.readFileSync(manifestFile, 'utf-8')) as {
            snapshots?: unknown;
            tsconfigOverrides?: unknown;
        };
        expect(removed.snapshots).toBeUndefined();
        expect(removed.tsconfigOverrides).toBeUndefined();
    });
});

describe('tsconfig command flag handling', () => {
    it('rejects --root/--tsconfig/--no-extends when generating', async () => {
        const cwd = makeRepo();
        const command = tsconfigCommand();
        const context = commandContext(cwd, { tsconfig: {} });

        await expect(command.run({ root: cwd }, context)).rejects.toThrow(
            /`--root`, `--tsconfig` and `--no-extends` require/
        );
        await expect(command.run({ tsconfig: 'tsconfig.json' }, context)).rejects.toThrow(
            /require `--json`/
        );
        await expect(command.run({ extends: false }, context)).rejects.toThrow(/require `--json`/);
    });

    it('rejects an invalid --indent instead of writing minified JSON', async () => {
        const cwd = makeRepo();
        const command = tsconfigCommand();
        const context = commandContext(cwd, { tsconfig: {} });

        await expect(command.run({ indent: 'garbage' }, context)).rejects.toThrow(
            /invalid --indent "garbage"/
        );
        await expect(command.run({ indent: '-2' }, context)).rejects.toThrow(/invalid --indent/);
    });
});

describe('tsconfig --json rootFile', () => {
    it('reads the configured rootFile when there is no root tsconfig.json', async () => {
        const cwd = makeRepo();
        writeJson(path.join(cwd, 'config', 'tsconfig.workspaces.json'), {
            compilerOptions: { paths: { '@org/foo': ['../packages/foo/src/index.ts'] } },
        });
        const command = tsconfigCommands().find(candidate => candidate.name === 'tsconfig');
        if (!command) throw new Error('missing tsconfig command');

        const raw = vi.spyOn(logger, 'raw').mockImplementation(() => {});
        try {
            await command.run(
                { json: true },
                {
                    cwd,
                    projectType: 'project',
                    config: {
                        tsconfig: { auto: true, rootFile: 'config/tsconfig.workspaces.json' },
                    },
                    tokens: {},
                    syncTasks: [],
                }
            );
            const output = JSON.parse(String(raw.mock.calls.at(-1)?.[0])) as {
                paths: Record<string, string[]>;
            };
            expect(output.paths['@org/foo']).toEqual([
                path.resolve(cwd, 'packages/foo/src/index.ts'),
            ]);
        } finally {
            raw.mockRestore();
        }
    });
});
