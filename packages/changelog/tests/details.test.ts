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

const manyRecords = [
    records[0]!,
    ...Array.from({ length: 9 }, (_, index) => ({
        hash: String(index + 1).padStart(40, '0'),
        subject: `fix(core): fix ${index}`,
        body: '',
        author: 'Test',
        authorEmail: 'test@example.com',
    })),
];

describe('changelog details', () => {
    it('enables the body details only at 10 commits by default', () => {
        const one = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', buildSummary(records)),
            resolveDetails(true)
        );
        expect(one).toContain('## 1.0.0');
        expect(one).not.toContain('<summary><strong>Release Notes</strong></summary>');
        expect(one).toContain('<summary><strong>BREAKING CHANGES</strong></summary>');
        expect(one).toContain('<summary><strong>See more...</strong></summary>');
        expect(one).toContain('A longer explanation of the thing.');

        const ten = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', buildSummary(manyRecords)),
            resolveDetails(true)
        );
        expect(ten).toContain('<summary><strong>Release Notes</strong></summary>');
        expect(ten).not.toMatch(/<summary><h[1-6]>/);
    });

    it('uses Release Notes in both release and non-release modes', () => {
        const release = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', buildSummary(records, { release: true })),
            resolveDetails(true, true)
        );
        expect(release).toContain('## 1.0.0');
        expect(release).toContain('<summary><strong>Release Notes</strong></summary>');
        expect(release).not.toContain('<summary>1.0.0</summary>');
        expect(release).not.toMatch(/<summary><h[1-6]>/);

        const normal = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', buildSummary(records)),
            resolveDetails(true)
        );
        expect(normal).toContain('## 1.0.0');
        expect(normal).not.toContain('<summary><strong>Release Notes</strong></summary>');
        expect(normal).not.toContain('<summary>1.0.0</summary>');
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
            resolveDetails(
                {
                    releaseNotes: { title: 'Notes', expanded: true },
                    breaking: false,
                    descriptions: { title: 'More' },
                },
                true
            )
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
                body: { minCommits: 0 },
                releaseNotes: false,
                breaking: false,
                descriptions: false,
            })
        );
        expect(entry).toContain('## 1.2.3');
        expect(entry).toContain('<summary><strong>Release Notes</strong></summary>');
        expect(entry).toContain('Body');
    });

    it('drops the section heading inside a wrapped type section', () => {
        const entry = [
            '## 1.0.0',
            '',
            '### New features',
            '- one',
            '',
            '### Bug fixes',
            '- two',
        ].join('\n');
        const wrapped = applyDetailsToEntry(
            entry,
            resolveDetails({
                types: true,
                body: false,
                releaseNotes: false,
                breaking: false,
                descriptions: false,
            })
        );
        expect(wrapped).toContain('<summary>New features</summary>');
        expect(wrapped).toContain('<summary>Bug fixes</summary>');
        expect(wrapped).not.toContain('### New features');
        expect(wrapped).not.toContain('### Bug fixes');
    });

    it('can apply details before formatting with lifecycle: before', () => {
        const summary = buildSummary(records, {
            release: true,
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
        expect(summary).toContain('<summary><strong>Release Notes</strong></summary>');
        expect(summary).toContain('<summary><strong>BREAKING CHANGES</strong></summary>');
        expect(summary).not.toContain('### Breaking Changes');
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
        expect(entry).toContain('<summary><strong>Intro</strong></summary>');
        expect(entry).toContain('<summary><strong>Outro</strong></summary>');
        expect(entry).toContain('<summary><strong>Footer</strong></summary>');
    });

    it('renders inline Markdown in summaries as HTML', () => {
        const entry = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', 'Body'),
            resolveDetails({
                body: {
                    title: '**feat**: [link](https://example.com) and `code`',
                    minCommits: 0,
                },
                releaseNotes: false,
                breaking: false,
                descriptions: false,
            })
        );
        expect(entry).toContain(
            '<summary><strong>feat</strong>: <a href="https://example.com">link</a> and <code>code</code></summary>'
        );
    });

    it('escapes raw HTML in summaries', () => {
        const entry = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', 'Body'),
            resolveDetails({
                body: { title: '<script>alert(1)</script>*em* ~~gone~~', minCommits: 0 },
                releaseNotes: false,
                breaking: false,
                descriptions: false,
            })
        );
        expect(entry).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<em>em</em> <del>gone</del>');
        expect(entry).not.toContain('<script>');
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
            { body: { minCommits: 0 }, releaseNotes: false, breaking: false, descriptions: true }
        );
        expect(formatted).toContain('## 1.0.0');
        expect(formatted).toContain('<summary><strong>Release Notes</strong></summary>');
        expect(formatted).toContain('<summary><strong>See more...</strong></summary>');
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

describe('changelog section spacing', () => {
    it('puts a blank line before scope and type headings', () => {
        const summary = buildSummary([
            {
                hash: 'a'.repeat(40),
                subject: 'feat(api): add api',
                body: '',
                author: 'A',
                authorEmail: '',
            },
            {
                hash: 'b'.repeat(40),
                subject: 'feat(core): add core',
                body: '',
                author: 'A',
                authorEmail: '',
            },
            {
                hash: 'c'.repeat(40),
                subject: 'fix(cli): fix cli',
                body: '',
                author: 'A',
                authorEmail: '',
            },
        ]);
        expect(summary).toContain(')\n\n#### Core');
        expect(summary).toContain(')\n\n### Bug fixes');
    });

    it('puts a blank line between fallback bump groups', () => {
        const summary = buildSummary(
            [
                {
                    hash: 'a'.repeat(40),
                    subject: 'feat: add',
                    body: '',
                    author: 'A',
                    authorEmail: '',
                },
                {
                    hash: 'b'.repeat(40),
                    subject: 'fix: fix',
                    body: '',
                    author: 'A',
                    authorEmail: '',
                },
            ],
            { commitlint: false }
        );
        expect(summary).toContain(')\n\n### Patch changes');
    });
});

describe('details minCommits', () => {
    it('defaults the body to 10 and applies the top-level default to sections', () => {
        expect(resolveDetails(true).body.minCommits).toBe(10);
        expect(resolveDetails({}).body.minCommits).toBe(10);
        expect(resolveDetails({ minCommits: 3 }).body.minCommits).toBe(3);

        const defaults = resolveDetails({
            minCommits: 5,
            breaking: true,
            descriptions: true,
            types: true,
        });
        expect(defaults.breaking.minCommits).toBe(5);
        expect(defaults.types.minCommits).toBe(5);
        expect(defaults.descriptions.minCommits).toBe(5);

        const overrides = resolveDetails({
            minCommits: 5,
            breaking: { minCommits: 1 },
            body: { minCommits: 0 },
            types: { minCommits: 2 },
        });
        expect(overrides.breaking.minCommits).toBe(1);
        expect(overrides.body.minCommits).toBe(0);
        expect(overrides.types.minCommits).toBe(2);
    });

    it('gates a type section by its own entry count', () => {
        const entry = [
            '## 1.0.0',
            '',
            '### New features',
            '- one',
            '',
            '### Bug fixes',
            '- two',
            '- three',
        ].join('\n');
        const wrapped = applyDetailsToEntry(
            entry,
            resolveDetails({
                types: { minCommits: 2 },
                body: false,
                releaseNotes: false,
                breaking: false,
                descriptions: false,
            })
        );
        expect(wrapped).toContain('### New features');
        expect(wrapped).not.toContain('<summary>New features</summary>');
        expect(wrapped).toContain('<summary>Bug fixes</summary>');
    });

    it('gates breaking and descriptions by their entry counts', () => {
        const entry = [
            '## 1.0.0',
            '',
            '### Breaking Changes',
            '- break',
            '',
            '### New features',
            '- Add a thing',
            '  - one',
            '  - two',
        ].join('\n');
        const wrapped = applyDetailsToEntry(
            entry,
            resolveDetails({
                breaking: { minCommits: 2 },
                descriptions: { minCommits: 3 },
                body: false,
                releaseNotes: false,
                types: false,
            })
        );
        expect(wrapped).toContain('### Breaking Changes');
        expect(wrapped).not.toContain('<summary><strong>BREAKING CHANGES</strong></summary>');
        expect(wrapped).not.toContain('<summary><strong>See more...</strong></summary>');
        expect(wrapped).toContain('  - one');
    });

    it('gates release notes by the commit count', () => {
        const one = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', '- one'),
            resolveDetails({ releaseNotes: { minCommits: 2 } }, true)
        );
        expect(one).not.toContain('<summary><strong>Release Notes</strong></summary>');

        const two = applyDetailsToEntry(
            renderChangelogEntry('1.0.0', '- one\n- two'),
            resolveDetails({ releaseNotes: { minCommits: 2 } }, true)
        );
        expect(two).toContain('<summary><strong>Release Notes</strong></summary>');
    });
});
