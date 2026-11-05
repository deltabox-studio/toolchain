import { describe, expect, it } from 'vitest';

import { parseHomeAction } from '../src/home-view.js';

describe('parseHomeAction', () => {
    it('accepts known payload-free actions', () => {
        expect(parseHomeAction({ type: 'ready' })).toEqual({ type: 'ready' });
        expect(parseHomeAction({ type: 'syncAll' })).toEqual({ type: 'syncAll' });
    });

    it('accepts dir actions only with a non-empty string dir', () => {
        expect(parseHomeAction({ type: 'syncProject', dir: '/repo/app' })).toEqual({
            type: 'syncProject',
            dir: '/repo/app',
        });
        expect(parseHomeAction({ type: 'syncProject' })).toBeUndefined();
        expect(parseHomeAction({ type: 'syncProject', dir: 1 })).toBeUndefined();
        expect(parseHomeAction({ type: 'syncProject', dir: '' })).toBeUndefined();
    });

    it('rejects unknown or malformed messages', () => {
        expect(parseHomeAction(undefined)).toBeUndefined();
        expect(parseHomeAction(null)).toBeUndefined();
        expect(parseHomeAction('syncAll')).toBeUndefined();
        expect(parseHomeAction({})).toBeUndefined();
        expect(parseHomeAction({ type: 'evil' })).toBeUndefined();
    });
});
