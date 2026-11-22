import { describe, expect, it } from 'vite-plus/test';

import { matchesTarget, resolveScopedOption } from '../src/utils/target.js';

const root = '/repo';
const ui = '/repo/packages/ui';
const app = '/repo/apps/web';

describe('resolveScopedOption', () => {
    it('returns a plain value when the setting is not scoped', () => {
        expect(resolveScopedOption('beta', ui, root)).toBe('beta');
        expect(resolveScopedOption(undefined, ui, root)).toBeUndefined();
    });

    it('uses the narrowest matching scoped entry', () => {
        const value = [
            { target: 'packages/*', options: 'glob' },
            { target: 'packages/ui', options: 'exact' },
            { include: 'apps/*', options: 'include' },
        ];

        expect(resolveScopedOption(value, ui, root)).toBe('exact');
        expect(resolveScopedOption(value, app, root)).toBe('include');
    });

    it('falls back to the plain entries in a mixed array', () => {
        const value = ['beta', { target: 'packages/ui', options: 'rc' }];

        expect(resolveScopedOption(value, ui, root)).toBe('rc');
        expect(resolveScopedOption(value, app, root)).toBe('beta');
        expect(resolveScopedOption(value, root, root)).toBe('beta');
    });

    it('returns the explicit fallback when only scoped entries are present', () => {
        const value = [{ target: 'packages/ui', options: 'rc' }];

        expect(resolveScopedOption(value, app, root)).toBeUndefined();
        expect(resolveScopedOption(value, app, root, 'beta')).toBe('beta');
    });

    it('keeps a base array when no entry is scoped', () => {
        const value = ['feat', 'fix'];
        expect(resolveScopedOption(value, ui, root)).toEqual(['feat', 'fix']);
    });
});

describe('matchesTarget', () => {
    it('matches target globs and include/exclude lists', () => {
        expect(matchesTarget({ target: 'packages/*' }, ui, root)).toBe(true);
        expect(matchesTarget({ target: 'packages/*' }, app, root)).toBe(false);
        expect(matchesTarget({ include: 'apps/*' }, app, root)).toBe(true);
        expect(matchesTarget({ exclude: 'packages/*' }, ui, root)).toBe(false);
        expect(matchesTarget({ target: '.' }, root, root)).toBe(true);
    });
});
