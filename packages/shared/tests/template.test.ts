import { describe, expect, it } from 'vitest';

import {
    applyReplacements,
    applyReplacementsDeep,
    createReplacer,
    extractTokens,
    hasUnresolvedTokens,
} from '../src/template.js';

describe('applyReplacements', () => {
    it('replaces tokens with values', () => {
        expect(applyReplacements('Hello {{name}}!', { name: 'World' })).toBe('Hello World!');
    });

    it('supports inline defaults', () => {
        expect(applyReplacements('{{name:my-app}}', {})).toBe('my-app');
        expect(applyReplacements('{{name:my-app}}', { name: 'dbx' })).toBe('dbx');
    });

    it('keeps unresolved tokens by default and erases them when asked', () => {
        expect(applyReplacements('{{missing}}', {})).toBe('{{missing}}');
        expect(applyReplacements('{{missing}}', {}, { keepUnresolved: false })).toBe('');
    });

    it('throws in strict mode', () => {
        expect(() => applyReplacements('{{missing}}', {}, { strict: true })).toThrow();
    });

    it('supports custom delimiters and transforms', () => {
        expect(applyReplacements('<<name>>', { name: 'x' }, { open: '<<', close: '>>' })).toBe('x');
        expect(
            applyReplacements('{{name}}', { name: 'x' }, { transform: v => v.toUpperCase() })
        ).toBe('X');
    });
});

describe('createReplacer / deep / tokens', () => {
    it('creates a reusable replacer', () => {
        const replace = createReplacer({ scope: '@acme' });
        expect(replace('{{scope}}/core')).toBe('@acme/core');
    });

    it('applies deep replacements through objects and arrays', () => {
        const input = { a: '{{x}}', b: ['{{x}}', 1], c: { d: '{{x}}!' } };
        expect(applyReplacementsDeep(input, { x: 'X' })).toEqual({
            a: 'X',
            b: ['X', 1],
            c: { d: 'X!' },
        });
    });

    it('extracts tokens and detects leftovers', () => {
        expect(extractTokens('{{a}} {{b:c}} {{a}}').sort()).toEqual(['a', 'b']);
        expect(hasUnresolvedTokens('{{a}}')).toBe(true);
        expect(hasUnresolvedTokens('plain')).toBe(false);
    });
});

describe('applyReplacementsDeep non-plain values', () => {
    it('preserves RegExp/Date/URL instances', () => {
        const regex = /^@\//;
        const date = new Date('2026-01-01T00:00:00Z');
        const url = new URL('https://example.com/{{name}}');
        const out = applyReplacementsDeep(
            { alias: [{ find: regex, replacement: 'src/' }], date, url },
            { name: 'app' }
        ) as { alias: { find: RegExp }[]; date: Date; url: URL };
        expect(out.alias[0]?.find).toBe(regex);
        expect(out.date).toBe(date);
        expect(out.url).toBe(url);
    });
});
