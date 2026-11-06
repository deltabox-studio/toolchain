import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import type { ToolchainConfig } from '@deltabox/toolchain/shared';

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
        name: '@acme/root',
        private: true,
        workspaces: ['packages/*'],
    });
    writeJson(path.join(cwd, 'tsconfig.workspaces.json'), {
        compilerOptions: { paths: options.paths ?? {} },
        ...(options.references ? { references: options.references } : {}),
    });
    for (const name of options.workspaces ?? ['foo', 'bar']) {
        const dir = path.join(cwd, 'packages', name);
        writeJson(path.join(dir, 'package.json'), { name: `@acme/${name}` });
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
    it('rewrites generated keys with string patterns', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: { rewriteAlias: { '^@acme/foo$': '@acme/pkg-foo' } },
        });
        const paths = pathsOf(result);

        expect(paths['@acme/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@acme/foo']).toBeUndefined();
        expect(result.autoState.paths).toContain('@acme/pkg-foo');
    });

    it('rewrites generated keys with RegExp capture groups', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: {
                rewriteAlias: [{ pattern: /^@acme\/foo(.*)$/, replacement: '@acme/pkg-foo$1' }],
            },
        });
        const paths = pathsOf(result);

        expect(paths['@acme/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@acme/pkg-foo/*']).toEqual(['./packages/foo/src/*']);
        expect(paths['@acme/foo']).toBeUndefined();
    });

    it('supports an array of patterns in one rule', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: {
                rewriteAlias: [
                    {
                        pattern: ['^@acme/(foo)(.*)$', '^@acme/(bar)(.*)$'],
                        replacement: '@acme/pkg-$1$2',
                    },
                ],
            },
        });
        const paths = pathsOf(result);

        expect(paths['@acme/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@acme/pkg-foo/*']).toEqual(['./packages/foo/src/*']);
        expect(paths['@acme/pkg-bar']).toEqual(['./packages/bar/src/index.ts']);
        expect(paths['@acme/pkg-bar/*']).toEqual(['./packages/bar/src/*']);
    });

    it('applies an array of rewrite rules in order (first match wins)', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: {
                rewriteAlias: [
                    { pattern: '^@acme/foo$', replacement: '@acme/first' },
                    { pattern: '^@acme/foo$', replacement: '@acme/second' },
                    { pattern: '^@acme/bar$', replacement: '@acme/from-bar' },
                ],
            },
        });
        const paths = pathsOf(result);

        expect(paths['@acme/first']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@acme/second']).toBeUndefined();
        expect(paths['@acme/from-bar']).toEqual(['./packages/bar/src/index.ts']);
    });

    it('preserves custom keys (including ones that collide with generated keys)', async () => {
        const cwd = makeRepo({
            paths: {
                '@custom/thing': ['./custom.ts'],
                '@acme/foo': ['./hand-written/foo.ts'],
            },
        });
        const result = await run(cwd, {
            auto: { rewriteAlias: { '^@acme/foo$': '@acme/pkg-foo' } },
        });
        const paths = pathsOf(result);

        expect(paths['@custom/thing']).toEqual(['./custom.ts']);
        expect(paths['@acme/foo']).toEqual(['./hand-written/foo.ts']);
        expect(paths['@acme/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
    });

    it('removes stale auto keys when the rewrite changes', async () => {
        const cwd = makeRepo();
        const first = await run(cwd, {
            auto: { rewriteAlias: { '^@acme/foo$': '@acme/old-foo' } },
        });
        expect(pathsOf(first)['@acme/old-foo']).toEqual(['./packages/foo/src/index.ts']);
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), first.autoConfig);

        const second = await run(
            cwd,
            { auto: { rewriteAlias: { '^@acme/foo$': '@acme/new-foo' } } },
            first.autoState
        );
        const paths = pathsOf(second);

        expect(paths['@acme/new-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@acme/old-foo']).toBeUndefined();
        expect(second.autoState.paths).toContain('@acme/new-foo');
        expect(second.autoState.paths).not.toContain('@acme/old-foo');
    });

    it('filters aliases against the rewritten keys (include)', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: { rewriteAlias: { '^@acme/(.+)$': '@acme/pkg-$1' } },
            aliasAuto: { include: ['@acme/pkg-foo*'] },
        });
        const paths = pathsOf(result);

        expect(paths['@acme/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@acme/pkg-foo/*']).toEqual(['./packages/foo/src/*']);
        expect(paths['@acme/pkg-bar']).toBeUndefined();
        expect(paths['@acme/foo']).toBeUndefined();
    });

    it('filters aliases against the rewritten keys (exclude)', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, {
            auto: { rewriteAlias: { '^@acme/(.+)$': '@acme/pkg-$1' } },
            aliasAuto: { exclude: ['@acme/pkg-bar*'] },
        });
        const paths = pathsOf(result);

        expect(paths['@acme/pkg-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@acme/pkg-bar']).toBeUndefined();
        expect(paths['@acme/bar']).toBeUndefined();
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
                "{ '^@acme/foo$': '@acme/nested-foo' } } } } };\n"
        );
        write(
            path.join(cwd, 'packages/bar/dbx.config.ts'),
            'export default { toolchain: { tsconfig: { aliasAuto: false } } };\n'
        );

        const result = await run(cwd, { auto: true });
        const paths = pathsOf(result);

        expect(paths['@acme/nested-foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(paths['@acme/foo']).toBeUndefined();
        expect(paths['@acme/bar']).toBeUndefined();
        expect(paths['@acme/bar/*']).toBeUndefined();
    });

    it('keeps aliasAuto usable when auto is disabled', async () => {
        const cwd = makeRepo();
        const result = await run(cwd, { auto: false, aliasAuto: true });
        const paths = pathsOf(result);

        expect(paths['@acme/foo']).toEqual(['./packages/foo/src/index.ts']);
        expect(result.autoState.paths).toContain('@acme/foo');
    });

    it('defaults auto off and leaves hand-written paths untouched', async () => {
        const cwd = makeRepo({ paths: { '@acme/foo': ['./hand-written/foo.ts'] } });
        const result = await run(cwd, {});
        const paths = pathsOf(result);

        expect(paths).toEqual({ '@acme/foo': ['./hand-written/foo.ts'] });
        expect(result.autoState.paths).toEqual([]);
    });

    it('does not adopt pre-existing keys, so disabling auto keeps them', async () => {
        const cwd = makeRepo({ paths: { '@acme/foo': ['./hand-written/foo.ts'] } });
        const first = await run(cwd, { auto: true });
        expect(first.autoState.paths).not.toContain('@acme/foo');
        writeJson(path.join(cwd, 'tsconfig.workspaces.json'), first.autoConfig);

        const second = await run(cwd, { auto: false }, first.autoState);
        expect(pathsOf(second)['@acme/foo']).toEqual(['./hand-written/foo.ts']);
    });

    it('leaves hand-written references untouched when auto is off', async () => {
        const cwd = makeRepo({ references: [{ path: './packages/foo/tsconfig.json' }] });
        const result = await run(cwd, {});
        expect(result.autoConfig.references).toEqual([{ path: './packages/foo/tsconfig.json' }]);
        expect(result.autoState.references).toEqual([]);
    });

    it('removes references to non-composite workspaces when refs auto is on', async () => {
        const cwd = makeRepo({ references: [{ path: './packages/foo/tsconfig.json' }] });
        const result = await run(cwd, { auto: true });
        expect(result.autoConfig.references ?? []).not.toContainEqual({
            path: './packages/foo/tsconfig.json',
        });
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
        expect(pathsOf(result)['@acme/foo']).toEqual(['./packages/foo/src/index.ts']);
    });
});
