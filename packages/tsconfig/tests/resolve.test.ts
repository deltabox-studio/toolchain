import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
    clearRemoteTsconfigCache,
    generateWorkspaceTsconfigs,
    getCachedRemoteTsconfig,
    resolveTsconfig,
    resolveTsconfigAsync,
    serializeResolvedTsconfig,
    serializeTsconfigAlias,
    deserializeTsconfigAlias,
} from '../src/index.js';

const dirs: string[] = [];
const servers: http.Server[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-resolve-tsconfig-'));
    dirs.push(dir);
    return dir;
}

function write(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 4));
}

async function serve(configs: Record<string, unknown>): Promise<string> {
    const server = http.createServer((request, response) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        const body = configs[pathname];
        if (body === undefined) {
            response.statusCode = 404;
            response.end('not found');
            return;
        }
        response.setHeader('content-type', 'application/json');
        response.end(typeof body === 'string' ? body : JSON.stringify(body));
    });
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('server did not bind');
    return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
    clearRemoteTsconfigCache();
    await Promise.all(
        servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve())))
    );
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('resolveTsconfig', () => {
    it('resolves paths, references and Vite-compatible aliases', () => {
        const cwd = tmp();
        write(path.join(cwd, 'packages/core/src/index.ts'), '');
        write(path.join(cwd, 'packages/core/tsconfig.json'), {});
        write(path.join(cwd, 'tsconfig.json'), {
            compilerOptions: {
                paths: {
                    '@acme/core': ['./packages/core/src/index.ts'],
                    '@acme/*': ['./packages/*/src/index.ts'],
                },
            },
            references: [{ path: './packages/core/tsconfig.json' }],
        });

        const resolved = resolveTsconfig({ cwd });
        const core = path.join(cwd, 'packages/core/src/index.ts');

        expect(resolved.paths).toEqual({
            '@acme/core': [core],
            '@acme/*': [path.join(cwd, 'packages/*/src/index.ts')],
        });
        expect(resolved.references).toEqual([
            { path: path.join(cwd, 'packages/core/tsconfig.json') },
        ]);
        // Exact aliases sort before wildcards and are strict by default.
        expect(resolved.alias[0]).toEqual({
            find: /^@acme\/core$/,
            replacement: core.replace(/\\/g, '/'),
        });
        expect(resolved.alias[1]).toEqual({
            find: /^@acme\/(.*)$/,
            replacement: path.join(cwd, 'packages/$1/src/index.ts').replace(/\\/g, '/'),
        });
        expect(resolved.strict).toBe(true);
    });

    it('follows extends per field', () => {
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.base.json'), {
            compilerOptions: {
                paths: { '@acme/core': ['./packages/core/src/index.ts'] },
            },
            references: [{ path: './packages/core/tsconfig.json' }],
        });
        write(path.join(cwd, 'tsconfig.references.json'), {
            references: [{ path: './packages/cli/tsconfig.json' }],
        });
        write(path.join(cwd, 'tsconfig.json'), {
            extends: './tsconfig.base.json',
            compilerOptions: { strict: true },
        });

        const inherited = resolveTsconfig({ cwd });
        expect(inherited.paths['@acme/core']).toEqual([
            path.join(cwd, 'packages/core/src/index.ts'),
        ]);
        expect(inherited.references).toEqual([
            { path: path.join(cwd, 'packages/core/tsconfig.json') },
        ]);

        // A child that defines `references` keeps the parent's `paths`.
        write(path.join(cwd, 'tsconfig.json'), {
            extends: ['./tsconfig.base.json', './tsconfig.references.json'],
            references: [{ path: './packages/shared/tsconfig.json' }],
        });
        const childWins = resolveTsconfig({ cwd });
        expect(childWins.paths['@acme/core']).toEqual([
            path.join(cwd, 'packages/core/src/index.ts'),
        ]);
        expect(childWins.references).toEqual([
            { path: path.join(cwd, 'packages/shared/tsconfig.json') },
        ]);
    });

    it('throws when an extended local config is missing', () => {
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), { extends: './tsconfig.base.json' });

        expect(() => resolveTsconfig({ cwd })).toThrow(
            /Cannot resolve tsconfig "extends": "\.\/tsconfig\.base\.json"/
        );
    });

    it('throws with the file name when an extended config cannot be parsed', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'tsconfig.base.json'), '{ nope');
        write(path.join(cwd, 'tsconfig.json'), { extends: './tsconfig.base.json' });

        expect(() => resolveTsconfig({ cwd })).toThrow(
            /Cannot parse tsconfig ".*tsconfig\.base\.json"/
        );
    });

    it('requires remote extends to be prefetched in sync mode', () => {
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), {
            extends: 'https://example.com/tsconfig.json',
            compilerOptions: { paths: { '@acme/core': ['./packages/core/src/index.ts'] } },
        });

        expect(() => resolveTsconfig({ cwd })).toThrow(/was not prefetched/);
    });

    it('resolves paths against baseUrl and honours --no-extends', () => {
        const cwd = tmp();
        write(path.join(cwd, 'base/tsconfig.json'), {
            compilerOptions: {
                baseUrl: '.',
                paths: { '@acme/*': ['packages/*/src/index.ts'] },
            },
        });
        write(path.join(cwd, 'tsconfig.json'), {
            extends: './base/tsconfig.json',
            compilerOptions: { strict: true },
        });

        expect(resolveTsconfig({ cwd }).paths['@acme/*']).toEqual([
            path.join(cwd, 'base/packages/*/src/index.ts'),
        ]);

        const withoutExtends = resolveTsconfig({ cwd, extends: false });
        expect(withoutExtends.paths).toEqual({});
        expect(withoutExtends.references).toEqual([]);
    });

    it('supports a custom tsconfig file and root', () => {
        const cwd = tmp();
        const root = path.join(cwd, 'repo');
        write(path.join(root, 'config/tsconfig.json'), {
            compilerOptions: { paths: { '@acme/*': ['./src/*'] } },
        });

        const resolved = resolveTsconfig({
            cwd,
            root,
            tsconfig: 'config/tsconfig.json',
        });
        expect(resolved.paths['@acme/*']).toEqual([path.join(root, 'config/src/*')]);
    });

    it('anchors exact aliases by default and escapes the pattern', () => {
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), {
            compilerOptions: {
                paths: {
                    '@acme/core': ['./packages/core/src/index.ts'],
                    '@acme/core-utils': ['./packages/core-utils/src/index.ts'],
                    '@acme/core.lib': ['./packages/core-lib/src/index.ts'],
                },
            },
        });

        const resolved = resolveTsconfig({ cwd });
        const exact = resolved.alias.find(
            alias => alias.find instanceof RegExp && alias.find.source === '^@acme\\/core$'
        );
        expect(exact).toBeDefined();
        const pattern = exact?.find as RegExp;
        expect(pattern.test('@acme/core')).toBe(true);
        expect(pattern.test('@acme/core-utils')).toBe(false);
        // The dot in a plain find must be escaped (not a wildcard).
        expect(
            resolved.alias.some(
                alias => alias.find instanceof RegExp && alias.find.source.includes('core\\.lib')
            )
        ).toBe(true);

        const loose = resolveTsconfig({ cwd, strict: false });
        expect(loose.strict).toBe(false);
        expect(loose.alias.some(alias => alias.find === '@acme/core')).toBe(true);
        expect(loose.alias.some(alias => alias.find === '@acme/core.lib')).toBe(true);
    });

    it('sorts aliases and paths descending so the longest key comes first', () => {
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), {
            compilerOptions: {
                paths: {
                    '@acme/core': ['./packages/core/src/index.ts'],
                    '@acme/*': ['./packages/*/src/index.ts'],
                    '@acme/core-utils/deep': ['./packages/core-utils-deep/src/index.ts'],
                    '@acme/core-utils': ['./packages/core-utils/src/index.ts'],
                },
            },
        });

        const resolved = resolveTsconfig({ cwd, strict: false });
        expect(Object.keys(resolved.paths)).toEqual([
            '@acme/core-utils/deep',
            '@acme/core-utils',
            '@acme/core',
            '@acme/*',
        ]);
        expect(
            resolved.alias.map(alias =>
                typeof alias.find === 'string' ? alias.find : alias.find.source
            )
        ).toEqual(['@acme/core-utils/deep', '@acme/core-utils', '@acme/core', '^@acme\\/(.*)$']);
    });

    it('parses JSONC (comments + trailing commas)', () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, 'tsconfig.json'),
            `{
                // comment
                "compilerOptions": {
                    "paths": { "@acme/core": ["./src/index.ts"], },
                },
                "references": [{ "path": "./tsconfig.base.json" },],
            }`
        );

        expect(resolveTsconfig({ cwd }).paths['@acme/core']).toEqual([
            path.join(cwd, 'src/index.ts'),
        ]);
    });

    it('maps every wildcard to its own capture group', () => {
        const cwd = tmp();
        write(path.join(cwd, 'packages/core/src/features/auth/index.ts'), '');
        write(path.join(cwd, 'tsconfig.json'), {
            compilerOptions: {
                paths: {
                    '@acme/*/feature/*': ['./packages/*/src/features/*/index.ts'],
                },
            },
        });

        const [alias] = resolveTsconfig({ cwd }).alias;
        expect(alias?.find).toBeInstanceOf(RegExp);
        const find = alias?.find as RegExp;
        expect(find.test('@acme/core/feature/auth')).toBe(true);
        expect(find.test('@acme/core/feature')).toBe(false);
        expect('@acme/core/feature/auth'.replace(find, alias?.replacement ?? '')).toBe(
            path.resolve(cwd, 'packages/core/src/features/auth/index.ts').replace(/\\/g, '/')
        );
    });

    it('returns paths relative to the defining config when asked', () => {
        const cwd = tmp();
        write(path.join(cwd, 'base/tsconfig.json'), {
            compilerOptions: {
                baseUrl: '.',
                paths: { '@acme/*': ['packages/*/src/index.ts'] },
            },
            references: [{ path: './packages/core/tsconfig.json' }],
        });
        write(path.join(cwd, 'tsconfig.json'), {
            extends: './base/tsconfig.json',
        });

        const resolved = resolveTsconfig({ cwd, relativePaths: true });
        expect(resolved.relativePaths).toBe(true);
        expect(resolved.paths['@acme/*']).toEqual(['packages/*/src/index.ts']);
        expect(resolved.references).toEqual([{ path: 'packages/core/tsconfig.json' }]);
        expect(resolved.alias[0]).toEqual({
            find: /^@acme\/(.*)$/,
            replacement: 'packages/$1/src/index.ts',
        });
    });
});

describe('remote tsconfig extends', () => {
    it('follows an absolute remote config and resolves its paths against the URL', async () => {
        const base = await serve({
            '/base.json': {
                compilerOptions: {
                    strict: true,
                    paths: { '@acme/core': ['./src/index.ts'] },
                },
            },
        });
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), {
            extends: `${base}/base.json`,
        });

        const resolved = await resolveTsconfigAsync({ cwd });
        expect(resolved.paths['@acme/core']).toEqual([`${base}/src/index.ts`]);
    });

    it('follows nested relative extends against the remote URL', async () => {
        const base = await serve({
            '/configs/one.json': {
                compilerOptions: {
                    paths: { '@acme/one': ['./one.ts'] },
                },
            },
            '/configs/two.json': {
                compilerOptions: {
                    paths: { '@acme/two': ['./two.ts'] },
                },
            },
            '/configs/root.json': {
                extends: ['./one.json', './two.json'],
            },
        });
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), {
            extends: `${base}/configs/root.json`,
        });

        const resolved = await resolveTsconfigAsync({ cwd });
        // The later entry in the extends array wins, like a local config.
        expect(resolved.paths['@acme/two']).toEqual([`${base}/configs/two.ts`]);
        expect(resolved.paths['@acme/one']).toBeUndefined();
    });

    it('reports a remote fetch failure', async () => {
        const base = await serve({});
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), {
            extends: `${base}/missing.json`,
        });

        await expect(resolveTsconfigAsync({ cwd })).rejects.toThrow(
            /Failed to fetch remote tsconfig/
        );
    });

    it('reports a remote parse failure', async () => {
        const base = await serve({ '/bad.json': '{ nope' });
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), {
            extends: `${base}/bad.json`,
        });

        await expect(resolveTsconfigAsync({ cwd })).rejects.toThrow(/Cannot parse remote tsconfig/);
    });

    it('prefetches remote extends during workspace generation without flattening', async () => {
        const base = await serve({
            '/base.json': {
                compilerOptions: { strict: true, types: ['node'] },
            },
        });
        const cwd = tmp();
        write(path.join(cwd, 'package.json'), {
            name: '@acme/root',
            private: true,
            workspaces: ['packages/*'],
        });
        write(path.join(cwd, 'packages/core/package.json'), { name: '@acme/core' });
        write(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: `${base}/base.json`,
        });

        const result = await generateWorkspaceTsconfigs({
            cwd,
            config: { tsconfig: {} },
            write: false,
            writeSidecar: false,
        });
        const core = result.results.find(
            item => item.dirnameRelative === 'packages/core'
        )!.newTsconfig;

        // Flattening is opt-in: the generated config keeps extending the local
        // default and the remote chain is only resolved for inference.
        expect(core.extends).toBe('./tsconfig.default.json');
        expect(core.compilerOptions?.strict).toBeUndefined();
        expect(core.compilerOptions?.types).toBeUndefined();
        expect(getCachedRemoteTsconfig(`${base}/base.json`)).toBeDefined();
    });

    it('flattens a remote chain when the option is enabled', async () => {
        const base = await serve({
            '/base.json': {
                compilerOptions: { strict: true, types: ['node'] },
            },
        });
        const cwd = tmp();
        write(path.join(cwd, 'package.json'), {
            name: '@acme/root',
            private: true,
            workspaces: ['packages/*'],
        });
        write(path.join(cwd, 'packages/core/package.json'), { name: '@acme/core' });
        write(path.join(cwd, 'packages/core/tsconfig.base.json'), {
            compilerOptions: { paths: { '@local/*': ['./src/local/*'] } },
        });
        write(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: ['./tsconfig.base.json', `${base}/base.json`],
        });

        const result = await generateWorkspaceTsconfigs({
            cwd,
            config: { tsconfig: { flattenRemoteExtends: true } },
            write: false,
            writeSidecar: false,
        });
        const core = result.results.find(
            item => item.dirnameRelative === 'packages/core'
        )!.newTsconfig;

        // No remote `extends` survives and the inherited compiler options are
        // written locally.
        expect(core.extends).toBeUndefined();
        expect(core.compilerOptions?.strict).toBe(true);
        expect(core.compilerOptions?.types).toEqual(['node']);
        // A path inherited from the local base is preserved even though the
        // generated config no longer extends it.
        expect(core.compilerOptions?.paths).toEqual({ '@local/*': ['./src/local/*'] });
        expect(getCachedRemoteTsconfig(`${base}/base.json`)).toBeDefined();
    });

    it('never lets a flattened remote chain override generated settings', async () => {
        const base = await serve({
            '/base.json': {
                compilerOptions: {
                    strict: false,
                    target: 'ES2020',
                    outDir: './remote-dist',
                    paths: { '@remote/*': ['./remote/*'] },
                },
            },
        });
        const cwd = tmp();
        write(path.join(cwd, 'package.json'), {
            name: '@acme/root',
            private: true,
            workspaces: ['packages/*'],
        });
        write(path.join(cwd, 'packages/core/package.json'), { name: '@acme/core' });
        write(path.join(cwd, 'packages/core/src/index.ts'), 'export {};\n');
        write(path.join(cwd, 'packages/core/tsconfig.default.json'), {
            extends: `${base}/base.json`,
            compilerOptions: { strict: true },
        });
        write(path.join(cwd, 'packages/app/package.json'), { name: '@acme/app' });
        write(path.join(cwd, 'packages/app/tsconfig.default.json'), {});

        const result = await generateWorkspaceTsconfigs({
            cwd,
            config: {
                tsconfig: {
                    flattenRemoteExtends: true,
                    overrides: {
                        root: { compilerOptions: { target: 'ES2022' } },
                    },
                },
            },
            write: false,
            writeSidecar: false,
        });
        const core = result.results.find(
            item => item.dirnameRelative === 'packages/core'
        )!.newTsconfig;
        const app = result.results.find(
            item => item.dirnameRelative === 'packages/app'
        )!.newTsconfig;

        // The local default and generated/workspaces settings win; only the
        // remote-only `target` fills a gap. Path-valued options from the remote
        // tree are skipped, so the inferred workspace aliases stay in place.
        expect(core.extends).toBeUndefined();
        expect(core.compilerOptions?.strict).toBe(true);
        expect(core.compilerOptions?.target).toBe('ES2022');
        expect(core.compilerOptions?.outDir).toBeUndefined();
        expect(JSON.stringify(core.compilerOptions?.paths)).not.toContain('@remote');
        expect(app.compilerOptions?.paths).toEqual({
            '@acme/core': ['../core/src/index.ts'],
            '@acme/core/*': ['../core/src/*'],
        });
        expect(JSON.stringify(app.compilerOptions?.paths)).not.toContain('@remote');
    });
});

describe('alias serialization', () => {
    it('keeps exact aliases as strings', () => {
        const alias = { find: '@acme/core', replacement: '/repo/packages/core/src/index.ts' };
        expect(serializeTsconfigAlias(alias)).toEqual(alias);
        expect(deserializeTsconfigAlias(serializeTsconfigAlias(alias))).toEqual(alias);
    });

    it('round-trips wildcard aliases through JSON', () => {
        const alias = {
            find: /^@acme\/(.*)$/,
            replacement: '/repo/packages/$1/src/index.ts',
        };
        const serialized = serializeTsconfigAlias(alias);
        expect(serialized).toEqual({
            find: { source: '^@acme\\/(.*)$', flags: '' },
            replacement: '/repo/packages/$1/src/index.ts',
        });

        const json = JSON.stringify({ alias: [serialized] });
        expect(json).not.toContain('"find":{}');
        const parsed = JSON.parse(json) as { alias: (typeof serialized)[] };
        const restored = deserializeTsconfigAlias(parsed.alias[0]!);
        expect(restored.find).toBeInstanceOf(RegExp);
        expect((restored.find as RegExp).source).toBe('^@acme\\/(.*)$');
        expect(restored.replacement).toBe('/repo/packages/$1/src/index.ts');
    });

    it('serializes a whole resolved config', () => {
        const cwd = tmp();
        write(path.join(cwd, 'tsconfig.json'), {
            compilerOptions: { paths: { '@acme/*': ['./packages/*/src/index.ts'] } },
        });

        const serialized = serializeResolvedTsconfig(resolveTsconfig({ cwd }));
        const json = JSON.parse(JSON.stringify(serialized));
        expect(json.alias[0].find).toEqual({ source: '^@acme\\/(.*)$', flags: '' });
        expect(json.paths['@acme/*']).toHaveLength(1);
    });
});
