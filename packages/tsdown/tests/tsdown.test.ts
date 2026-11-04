import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { cleanup } from '../src/cleanup.js';
import {
    baseTsdownConfig,
    createPostBanner,
    createTsdownConfig,
    sortPackageExports,
} from '../src/config/node.js';

describe('cleanup', () => {
    it('returns [] when no patterns are given', () => {
        expect(cleanup('build', [])).toEqual([]);
    });

    it('ignores node_modules by default', () => {
        const removed = cleanup('build', ['**/node_modules/**'], { silent: true });
        expect(removed).toEqual([]);
    });
});

describe('tsdown config helpers', () => {
    it('exposes a base config', () => {
        expect(baseTsdownConfig.platform).toBe('node');
        expect(baseTsdownConfig.dts).toEqual({ generator: 'tsgo' });
    });

    it('merges overrides', () => {
        const config = createTsdownConfig({ format: ['cjs'], minify: false });
        expect(config.format).toEqual(['cjs']);
        expect(config.minify).toBe(false);
        expect(config.platform).toBe('node');
    });

    it('builds a branded post banner', () => {
        const banner = createPostBanner({ name: 'Acme', version: '1.2.3', license: 'MIT' });
        const out = banner({ fileName: 'index.js' });
        expect(out).toContain('Acme v1.2.3');
        expect(out).toContain('MIT');
        expect(out).toContain('index.js');
    });

    it('attaches the banner when requested', () => {
        const config = createTsdownConfig({}, { name: 'Acme' });
        expect(typeof (config.outputOptions as any)?.postBanner).toBe('function');
    });

    it('sort hook exists', () => {
        const hooks = baseTsdownConfig.hooks as any;
        expect(typeof hooks['build:done']).toBe('function');
        // ensure the hook does not throw on a minimal ctx
        expect(() => hooks['build:done']({ options: {} })).not.toThrow();
    });

    it('vi is available for future spies', () => {
        expect(vi.isMockFunction(vi.fn())).toBe(true);
    });
});

describe('sortPackageExports', () => {
    it('writes the sorted exports back to package.json', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tsdown-'));
        const file = path.join(dir, 'package.json');
        fs.writeFileSync(
            file,
            JSON.stringify({
                name: 'x',
                exports: {
                    './package.json': './package.json',
                    './z': './dist/z.js',
                    '.': './dist/index.js',
                    './types': './dist/index.d.ts',
                    './a': './dist/a.js',
                },
            })
        );
        try {
            expect(sortPackageExports(file)).toBe(true);
            const pkg = JSON.parse(fs.readFileSync(file, 'utf8')) as {
                exports: Record<string, string>;
            };
            expect(Object.keys(pkg.exports)).toEqual([
                '.',
                './types',
                './a',
                './z',
                './package.json',
            ]);
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
