import { describe, expect, it } from 'vitest';

import { buildSummary, type CommitRecord, deriveBump, isBreakingCommit } from '../src/index.js';

function record(subject: string, body = ''): CommitRecord {
    return {
        hash: 'a'.repeat(40),
        subject,
        body,
        author: 'A',
        authorEmail: 'a@example.com',
    };
}

describe('isBreakingCommit', () => {
    it('uses Conventional Commits by default', () => {
        expect(isBreakingCommit({ subject: 'feat!: drop', body: '' })).toBe(true);
        expect(isBreakingCommit({ subject: 'feat(api)!: drop', body: '' })).toBe(true);
        expect(
            isBreakingCommit({ subject: 'fix: change', body: 'BREAKING CHANGE: api changed' })
        ).toBe(true);
        expect(
            isBreakingCommit({ subject: 'fix: change', body: 'BREAKING-CHANGE: api changed' })
        ).toBe(true);
        expect(
            isBreakingCommit({
                subject: 'docs: document breaking changes group order',
                body: 'Note the default Breaking Changes -> feat -> fix order.',
            })
        ).toBe(false);
        expect(
            isBreakingCommit({
                subject: 'fix: change',
                body: 'This mentions BREAKING CHANGE in prose.',
            })
        ).toBe(false);
    });

    it('supports custom detection', () => {
        const commit = { subject: 'docs: note', body: 'Breaking Changes' };
        expect(isBreakingCommit(commit, 'any')).toBe(true);
        expect(isBreakingCommit(commit, false)).toBe(false);
        expect(isBreakingCommit(commit, { pattern: 'Breaking Changes' })).toBe(true);
        expect(isBreakingCommit(commit, { match: 'Breaking Changes' })).toBe(true);
        expect(
            isBreakingCommit({ subject: 'feat: add', body: '' }, ({ subject }) =>
                subject.startsWith('feat')
            )
        ).toBe(true);
    });
});

describe('breaking-change bumps', () => {
    it('does not treat prose as breaking by default', () => {
        expect(
            deriveBump([
                record(
                    'docs: document breaking changes group order',
                    'Note the default Breaking Changes -> feat -> fix order.'
                ),
            ])
        ).toBe('patch');
        expect(
            deriveBump([
                record('fix: mention footer', 'Detect subject and BREAKING CHANGE footer breaks'),
            ])
        ).toBe('patch');
    });

    it('bumps major for a real footer and honours overrides', () => {
        expect(deriveBump([record('fix: change', 'BREAKING CHANGE: api')])).toBe('major');
        expect(deriveBump([record('docs: note', 'Breaking Changes')], 'any')).toBe('major');
        expect(deriveBump([record('docs: note', 'Breaking Changes')], false)).toBe('patch');
    });
});

describe('breaking-change grouping', () => {
    it('groups only real breaking changes by default', () => {
        const summary = buildSummary([
            record(
                'docs: document breaking changes group order',
                'Note the default Breaking Changes -> feat -> fix order.'
            ),
            record('feat: add'),
        ]);
        expect(summary).not.toContain('### Breaking Changes');
        expect(summary).toContain('### New features');
    });

    it('honours the breaking override', () => {
        const summary = buildSummary([record('docs: note', 'Breaking Changes')], {
            breaking: 'any',
        });
        expect(summary).toContain('### Breaking Changes');
    });
});
