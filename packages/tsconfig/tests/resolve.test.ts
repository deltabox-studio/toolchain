import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
    resolveTsconfig,
    serializeResolvedTsconfig,
    serializeTsconfigAlias,
    deserializeTsconfigAlias,
} from '../src/index.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-resolve-tsconfig-'));
    dirs.push(dir);
    return dir;
}

function write(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value, null, 4));
}

afterEach(() => {
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
        // Exact aliases sort before wildcards.
        expect(resolved.alias[0]).toEqual({
            find: '@acme/core',
            replacement: core.replace(/\\/g, '/'),
        });
        expect(resolved.alias[1]).toEqual({
            find: /^@acme\/(.*)$/,
            replacement: path.join(cwd, 'packages/$1/src/index.ts').replace(/\\/g, '/'),
        });
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
