import { describe, expect, it } from 'vite-plus/test';

import { applyDetailsToEntry, resolveDetails, wrapCustomDetails } from '../src/utils/details.js';
import { reformatChangelogContent } from '../src/utils/reformat.js';
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
        const summary = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', buildSummary(records)),
            resolveDetails(true)
        );
        expect(summary).toContain('<details>');
        expect(summary).toContain('<summary>**Release Notes**</summary>');
        expect(summary).toContain('<summary>**BREAKING CHANGES**</summary>');
        expect(summary).toContain('<summary>Add a thing');
        expect(summary).toContain('A longer explanation of the thing.');
    });

    it('can be disabled with details: false', () => {
        const summary = applyDetailsToEntry(
            buildSummary(records, { commit: { details: false } }),
            resolveDetails(false)
        );
        expect(summary).not.toContain('<details>');
        expect(summary).toContain('A longer explanation of the thing.');
    });

    it('supports custom titles and expanded state', () => {
        const summary = applyDetailsToEntry(
            renderChangelogEntry(
                '1.0.0',
                buildSummary(records, {
                    commit: {
                        details: {
                            releaseNotes: { title: 'Notes', expanded: true },
                            breaking: false,
                            descriptions: { title: 'More' },
                        },
                    },
                })
            ),
            resolveDetails({
                releaseNotes: { title: 'Notes', expanded: true },
                breaking: false,
                descriptions: { title: 'More' },
            })
        );
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

    it('wraps the whole version body with details.body', () => {
        const entry = applyDetailsToEntry(
            renderChangelogEntry('1.2.3', 'Body', undefined, false),
            resolveDetails({
                body: true,
                releaseNotes: false,
                breaking: false,
                descriptions: false,
            })
        );
        expect(entry).toContain('<summary>1.2.3</summary>');
        expect(entry).toContain('Body');
    });

    it('can apply details before formatting with lifecycle: before', () => {
        const summary = buildSummary(records, {
            commit: {
                details: {
                    lifecycle: 'before',
                    releaseNotes: true,
                    breaking: true,
                    descriptions: true,
                },
            },
        });
        expect(summary).toContain('<details>');
        expect(summary).toContain('<summary>**Release Notes**</summary>');
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

describe('details after formatting', () => {
    it('applies details to --format-only output', () => {
        const content = [
            '# Changelog',
            '',
            '## 1.0.0 (January 2026)',
            '',
            '- add a thing',
            '',
            '  - a description',
        ].join('\n');
        const formatted = reformatChangelogContent(
            content,
            undefined,
            false,
            false,
            undefined,
            undefined,
            { body: true, releaseNotes: false, breaking: false, descriptions: true }
        );
        expect(formatted).toContain('<summary>1.0.0</summary>');
        expect(formatted).toContain('<summary>Add a thing</summary>');
    });

    it('matches custom regex against the formatted text', () => {
        const content = ['# Changelog', '', '## 1.0.0', '', '- **important** change'].join('\n');
        const formatted = reformatChangelogContent(
            content,
            undefined,
            false,
            false,
            undefined,
            undefined,
            {
                releaseNotes: false,
                breaking: false,
                descriptions: false,
                custom: /Important change/,
            }
        );
        expect(formatted).toContain('<summary>Important change</summary>');
    });
});
