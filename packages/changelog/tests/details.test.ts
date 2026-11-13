import { describe, expect, it } from 'vite-plus/test';

import { wrapCustomDetails, resolveDetails } from '../src/utils/details.js';
import { buildSummary } from '../src/utils/summary.js';
import { renderChangelogEntry } from '../src/utils/version.js';

const records = [
    {
        hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        subject: 'feat(core): add a thing',
        body: 'A longer explanation of the thing.\n\nBREAKING CHANGE: old API removed',
        author: 'Test',
        authorEmail: 'test@example.com',
    },
];

describe('changelog details', () => {
    it('is enabled by default and wraps release notes, descriptions and breaking changes', () => {
        const summary = buildSummary(records);
        expect(summary).toContain('<details>');
        expect(summary).toContain('<summary>**Release Notes**</summary>');
        expect(summary).toContain('<summary>**BREAKING CHANGES**</summary>');
        expect(summary).toContain('<summary>Add a thing');
        expect(summary).toContain('A longer explanation of the thing.');
    });

    it('can be disabled with details: false', () => {
        const summary = buildSummary(records, { commit: { details: false } });
        expect(summary).not.toContain('<details>');
        expect(summary).toContain('A longer explanation of the thing.');
    });

    it('supports custom titles and expanded state', () => {
        const summary = buildSummary(records, {
            commit: {
                details: {
                    releaseNotes: { title: 'Notes', expanded: true },
                    breaking: false,
                    descriptions: { title: 'More' },
                },
            },
        });
        expect(summary).toContain('<details open>');
        expect(summary).toContain('<summary>Notes</summary>');
        expect(summary).toContain('<summary>More</summary>');
        expect(summary).not.toContain('BREAKING CHANGES');
    });

    it('wraps custom markers with the start match as the summary', () => {
        const details = resolveDetails({
            releaseNotes: false,
            breaking: false,
            descriptions: false,
            custom: { start: 'START', end: 'END' },
        });
        const wrapped = wrapCustomDetails('before START middle END after', details);
        expect(wrapped).toContain('<summary>START</summary>');
        expect(wrapped).toContain('START middle END');
        expect(wrapped).toContain('before');
        expect(wrapped).toContain('after');
    });

    it('wraps intro/outro/footer text through renderChangelogEntry', () => {
        const entry = renderChangelogEntry(
            '1.0.0',
            'Body',
            undefined,
            false,
            'Footer text',
            'Intro text',
            'Outro text',
            {
                intro: true,
                outro: true,
                footer: true,
                releaseNotes: false,
                breaking: false,
                descriptions: false,
            }
        );
        expect(entry).toContain('<summary>**Intro**</summary>');
        expect(entry).toContain('<summary>**Outro**</summary>');
        expect(entry).toContain('<summary>**Footer**</summary>');
    });
});
