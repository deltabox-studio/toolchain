import { describe, expect, it } from 'vite-plus/test';

import { changelogRegenerateEnabled } from '../src/cli/index.js';

describe('changelog command gating', () => {
    it('runs when only the manual toolchain.changelog section is enabled', () => {
        expect(changelogRegenerateEnabled({ changelog: true })).toBe(true);
        expect(changelogRegenerateEnabled({ changelog: { groups: ['feat'] } })).toBe(true);
    });

    it('runs when only ci.changelog is enabled', () => {
        expect(changelogRegenerateEnabled({ ci: { changelog: true } })).toBe(true);
        expect(
            changelogRegenerateEnabled({
                ci: { changelog: { versioning: { target: 'individual' } } },
            })
        ).toBe(true);
    });

    it('stays opt-in without a changelog section', () => {
        expect(changelogRegenerateEnabled({})).toBe(false);
        expect(changelogRegenerateEnabled()).toBe(false);
        expect(changelogRegenerateEnabled({ changelog: false })).toBe(false);
        expect(changelogRegenerateEnabled({ ci: { changelog: false } })).toBe(false);
    });

    it('honours regenerate: false on either section', () => {
        expect(changelogRegenerateEnabled({ changelog: { regenerate: false } })).toBe(false);
        expect(changelogRegenerateEnabled({ ci: { changelog: { regenerate: false } } })).toBe(
            false
        );
        // A disabled CI layer does not turn off the manual pipeline.
        expect(
            changelogRegenerateEnabled({
                changelog: true,
                ci: { changelog: false },
            })
        ).toBe(true);
    });
});
