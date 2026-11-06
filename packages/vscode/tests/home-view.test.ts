import { describe, expect, it } from 'vitest';

import { parseHomeAction } from '../src/home-view.js';

describe('parseHomeAction', () => {
    it('accepts known payload-free actions', () => {
        expect(parseHomeAction({ type: 'ready' })).toEqual({ type: 'ready' });
        expect(parseHomeAction({ type: 'syncAll' })).toEqual({ type: 'syncAll' });
        expect(parseHomeAction({ type: 'syncTsconfig' })).toEqual({ type: 'syncTsconfig' });
        expect(parseHomeAction({ type: 'migrate' })).toEqual({ type: 'migrate' });
        expect(parseHomeAction({ type: 'runProviderCommand' })).toEqual({
            type: 'runProviderCommand',
        });
        expect(parseHomeAction({ type: 'createVite' })).toEqual({ type: 'createVite' });
        expect(parseHomeAction({ type: 'chooseDbxSource' })).toEqual({
            type: 'chooseDbxSource',
        });
        expect(parseHomeAction({ type: 'refreshFiles' })).toEqual({ type: 'refreshFiles' });
        expect(parseHomeAction({ type: 'refreshProviders' })).toEqual({
            type: 'refreshProviders',
        });
        expect(parseHomeAction({ type: 'refreshTemplates' })).toEqual({
            type: 'refreshTemplates',
        });
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
