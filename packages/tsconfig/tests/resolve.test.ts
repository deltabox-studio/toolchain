import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { resolveTsconfig } from '../src/index.js';

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
        expect(resolved.alias[0]).toEqual({ find: '@acme/core', replacement: core });
        expect(resolved.alias[1]).toEqual({
            find: /^@acme\/(.*)$/,
            replacement: path.join(cwd, 'packages/$1/src/index.ts'),
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
});
