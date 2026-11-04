import { describe, expect, it, vi } from 'vitest';

// Simulate a commit whose body is intact (no shell-escape artifacts). A
// `--format-only` run must still keep the hand-corrected changelog text instead
// of re-rendering it from this body.
vi.mock('../src/utils/git.js', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/utils/git.js')>();
    return {
        ...actual,
        readCommit: (hash: string) =>
            hash === 'abc1234'
                ? { subject: 'feat(server): add a thing', body: 'The original body.' }
                : actual.readCommit(hash),
    };
});

import { reformatChangelogContent } from '../src/utils/reformat.js';

describe('reformatChangelogContent hand corrections', () => {
    it('keeps a corrected subject and description when the commit body is intact', () => {
        const content = [
            '# Changelog',
            '',
            '## 1.0.0 (January 2026)',
            '',
            '- **feat(server):** Add a hand-corrected thing ([#abc1234](https://github.com/x/y/commit/abc1234) by [T](https://github.com/T))',
            '  - The hand-corrected description with `backticks` and any, false.',
        ].join('\n');

        const out = reformatChangelogContent(content, 'x/y');

        expect(out).toContain('Add a hand-corrected thing');
        expect(out).toContain('The hand-corrected description with `backticks` and any, false.');
        expect(out).not.toContain('The original body.');
        // The CC prefix is still stripped, and the credit suffix is not duplicated.
        expect(out).not.toContain('**feat(server):**');
        expect(out.match(/\[#abc1234\]/g)).toHaveLength(1);
    });

    it('fills in a description when the existing entry has none', () => {
        const content = [
            '# Changelog',
            '',
            '## 1.0.0 (January 2026)',
            '',
            '- **feat(server):** Add a thing ([#abc1234](https://github.com/x/y/commit/abc1234) by [T](https://github.com/T))',
        ].join('\n');

        const out = reformatChangelogContent(content, 'x/y');

        expect(out).toContain('The original body.');
    });
});
