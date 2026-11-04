import { describe, expect, it } from 'vitest';

import { workspaceDirForTsconfig } from '../src/typescript.js';

describe('workspaceDirForTsconfig', () => {
    it('normalizes a relative workspace directory', () => {
        expect(workspaceDirForTsconfig('packages/app')).toBe('packages/app');
        expect(workspaceDirForTsconfig('./packages/app/')).toBe('packages/app');
        expect(workspaceDirForTsconfig('packages\\app')).toBe('packages/app');
    });

    it('rejects paths that escape or target the root', () => {
        expect(() => workspaceDirForTsconfig('.')).toThrow(/relative to the root/);
        expect(() => workspaceDirForTsconfig('packages/../..')).toThrow(/relative to the root/);
        expect(() => workspaceDirForTsconfig('/tmp/app')).toThrow(/relative to the root/);
        expect(() => workspaceDirForTsconfig('C:\\tmp\\app')).toThrow(/relative to the root/);
    });
});
