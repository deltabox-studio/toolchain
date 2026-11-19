import { describe, expect, it, vi } from 'vite-plus/test';

// `--format-only` re-parses the rendered entry and looks the original commit up
// to rebuild the CC grouping. Provide deterministic subjects so the test does
// not depend on the checkout's git history.
const knownCommits: Record<string, { subject: string; body: string }> = {
    aaaaaaa: {
        subject: 'feat(core): add a thing',
        body: 'A longer explanation of the thing.',
    },
    bbbbbbb: {
        subject: 'fix(cli): fix another thing',
        body: 'Another explanation.',
    },
};

vi.mock('../src/utils/git.js', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/utils/git.js')>();
    const readCommit = (hash: string) =>
        knownCommits[hash] ?? knownCommits[hash.slice(0, 7)] ?? actual.readCommit(hash);
    return { ...actual, readCommit };
});

import { applyDetailsToEntry, resolveDetails } from '../src/utils/details.js';
import { reformatChangelogContent } from '../src/utils/reformat.js';
import { buildSummary } from '../src/utils/summary.js';
import { renderChangelogEntry } from '../src/utils/version.js';

const records = [
    {
        hash: 'a'.repeat(40),
        subject: 'feat(core): add a thing',
        body: 'A longer explanation of the thing.',
        author: 'Test',
        authorEmail: 'test@example.com',
    },
    {
        hash: 'b'.repeat(40),
        subject: 'fix(cli): fix another thing',
        body: 'Another explanation.',
        author: 'Test',
        authorEmail: 'test@example.com',
    },
];

/** A changelog entry as the pipeline writes it, with details applied. */
function generatedEntry(details: unknown): string {
    const summary = buildSummary(records, { commit: { details } });
    const raw = renderChangelogEntry('1.0.0', summary);
    const resolved = resolveDetails(details);
    const entry = resolved.lifecycle === 'after' ? applyDetailsToEntry(raw, resolved) : raw;
    return `# Changelog\n\n${entry}\n`;
}

describe('--format-only details idempotency', () => {
    it('does not nest a second details wrapper around descriptions', () => {
        const generated = generatedEntry(true);
        const first = reformatChangelogContent(
            generated,
            'x/y',
            true,
            false,
            undefined,
            undefined,
            true
        );
        const second = reformatChangelogContent(
            first,
            'x/y',
            true,
            false,
            undefined,
            undefined,
            true
        );

        expect(second).toBe(first);
        // The grouping survives re-parsing the details-wrapped entry.
        expect(first).toContain('<summary>New features</summary>');
        expect(first).toContain('<summary>Bug fixes</summary>');
        expect(first).not.toContain('<summary>Chores</summary>');
        // Exactly one description collapsible per commit, not one per run.
        expect(first.match(/<summary><strong>See more\.\.\.<\/strong><\/summary>/g)).toHaveLength(
            records.length
        );
        expect(first.match(/^- /gm)).toHaveLength(records.length);
    });
});

describe('--format-only intro and outro preservation', () => {
    it('keeps a custom intro and outro paragraph across reformats', () => {
        const content = [
            '# Changelog',
            '',
            '## 1.0.0 (January 2026)',
            '',
            'Custom intro paragraph.',
            '',
            '<!-- release:start -->',
            '',
            '### New features',
            '- Add a thing',
            '',
            '<!-- release:end -->',
            '',
            'Custom outro paragraph.',
            '',
        ].join('\n');
        const details = {
            types: false,
            body: false,
            releaseNotes: false,
            breaking: false,
            descriptions: false,
        };
        const out = reformatChangelogContent(
            content,
            undefined,
            true,
            false,
            undefined,
            undefined,
            details
        );

        expect(out).toContain('Custom intro paragraph.');
        expect(out).toContain('Custom outro paragraph.');
        const entryStart = out.indexOf('## 1.0.0');
        const intro = out.indexOf('Custom intro paragraph.');
        const start = out.indexOf('<!-- release:start -->');
        const body = out.indexOf('- Add a thing');
        const outro = out.indexOf('Custom outro paragraph.');
        const end = out.indexOf('<!-- release:end -->');
        expect(entryStart).toBeLessThan(intro);
        expect(intro).toBeLessThan(start);
        expect(start).toBeLessThan(body);
        expect(body).toBeLessThan(outro);
        expect(outro).toBeLessThan(end);

        // Re-formatting the result is stable.
        expect(
            reformatChangelogContent(out, undefined, true, false, undefined, undefined, details)
        ).toBe(out);
    });
});
