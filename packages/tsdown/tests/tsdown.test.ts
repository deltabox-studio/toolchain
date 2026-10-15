import { describe, expect, it, vi } from 'vitest';

import { cleanup } from '../src/cleanup.js';
import { baseTsdownConfig, createPostBanner, createTsdownConfig } from '../src/config/node.js';

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
