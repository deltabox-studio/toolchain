import { describe, expect, it, vi } from 'vite-plus/test';

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

import { bulletHash } from '../src/utils/git.js';
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
        // The CC prefix is still stripped. The credit appears once on the bullet;
        // the description details summary is the generic "See more...".
        expect(out).not.toContain('**feat(server):**');
        expect(out.match(/#abc1234/g)).toHaveLength(1);
        expect(out).toContain('<summary><strong>See more...</strong></summary>');
    });

    it('keeps the CC group and credit for an unlinked hash', () => {
        const content = [
            '# Changelog',
            '',
            '## 1.0.0 (January 2026)',
            '',
            '- Add a thing (#abc1234 by T)',
        ].join('\n');

        const out = reformatChangelogContent(content, undefined);

        expect(out).toContain('<summary>New features</summary>');
        expect(out).toContain('(#abc1234 by T)');
        expect(out.match(/#abc1234/g)).toHaveLength(1);
        expect(bulletHash('- Add a thing (#abc1234 by T)')).toBe('abc1234');
    });

    it('keeps entries written with * and + bullets', () => {
        const content = [
            '# Changelog',
            '',
            '## 1.0.0 (January 2026)',
            '',
            '* feat: first',
            '+ fix: second',
            '- chore: third',
        ].join('\n');

        const out = reformatChangelogContent(content, 'x/y');

        expect(out).toContain('First');
        expect(out).toContain('Second');
        expect(out).toContain('Third');
        expect(out).not.toContain('No description provided.');
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
