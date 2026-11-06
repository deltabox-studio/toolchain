import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

// Keep the hash-link tests independent of the checkout's git history (a
// shallow clone would not contain these commits).
const gitState = vi.hoisted(() => ({ complete: true }));

vi.mock('../src/utils/git.js', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/utils/git.js')>();
    const known: Record<string, { subject: string; body: string }> = {
        '4033009': { subject: 'fix: numeric hash', body: '' },
    };
    return {
        ...actual,
        readCommit: (hash: string) => known[hash] ?? actual.readCommit(hash),
        hasCompleteGitHistory: () => gitState.complete,
    };
});

import {
    buildSummary,
    formatBody,
    formatLine,
    groupItems,
    parseCcSubject,
    parseExistingChangelog,
    readCommits,
    reformatChangelogContent,
    renderChangelogEntry,
    renderCommitRef,
    renderGroups,
    ruleTitle,
    splitInlineDescription,
} from '../src/index.js';
import { formatChangelogFile } from '../src/utils/format.js';

const REPO_RANGE = 'HEAD~5..HEAD';

/** Whether the tests run inside a git work tree (needed for real-history tests). */
function hasGit(): boolean {
    try {
        execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

const GIT = hasGit();

function safeRange(): string {
    try {
        readCommits(REPO_RANGE);
        return REPO_RANGE;
    } catch {
        return 'HEAD';
    }
}

describe('changelog formatting', () => {
    it('parses Conventional-Commits subjects into type + scope', () => {
        expect(parseCcSubject('feat(server): add things')).toEqual({
            type: 'feat',
            scope: 'server',
            breaking: false,
            rest: 'add things',
        });
        expect(parseCcSubject('fix!: drop support')).toEqual({
            type: 'fix',
            scope: undefined,
            breaking: true,
            rest: 'drop support',
        });
        expect(parseCcSubject('chore: tidy')).toEqual({
            type: 'chore',
            scope: undefined,
            breaking: false,
            rest: 'tidy',
        });
    });

    it('maps CC rules to readable group titles', () => {
        expect(ruleTitle('feat')).toBe('New features');
        expect(ruleTitle('fix')).toBe('Bug fixes');
        expect(ruleTitle('chore')).toBe('Chores');
        expect(ruleTitle('unknown')).toBe('Other changes');
    });

    it('groups items by rule, then by scope', () => {
        const item = (text: string) => {
            const parsed = parseCcSubject(text);
            return { parsed, text, bodyParagraphs: [] as string[][] };
        };
        const groups = groupItems([
            item('feat(server): a'),
            item('feat(frontend): b'),
            item('fix(server): c'),
            item('chore: d'),
        ]);
        expect(groups.map(g => g.title)).toEqual(['New features', 'Bug fixes', 'Chores']);
        const rendered = renderGroups(groups);
        expect(rendered).toContain('### New features');
        expect(rendered).toContain('#### Server');
        expect(rendered).toContain('#### Frontend');
        expect(rendered).toContain('### Bug fixes');
        expect(rendered).toContain('### Chores');
    });

    it('groups breaking commits first by default', () => {
        const item = (text: string) => {
            const parsed = parseCcSubject(text);
            return { parsed, text, bodyParagraphs: [] as string[][] };
        };
        expect(
            groupItems([item('feat!: break'), item('feat: add'), item('fix: patch')]).map(
                group => group.title
            )
        ).toEqual(['Breaking Changes', 'New features', 'Bug fixes']);
    });

    it('keeps breaking grouping with a custom commit formatter', () => {
        const records = [
            {
                hash: 'a'.repeat(40),
                subject: 'feat!: break',
                body: '',
                author: 'A',
                authorEmail: '',
            },
            { hash: 'b'.repeat(40), subject: 'feat: add', body: '', author: 'A', authorEmail: '' },
        ];
        const summary = buildSummary(records, {
            commit: { format: ctx => `CUSTOM ${ctx.commit.subject}` },
        });
        expect(summary.indexOf('### Breaking Changes')).toBeLessThan(
            summary.indexOf('### New features')
        );
        expect(summary).toContain('- CUSTOM feat!: break');
    });

    it('detects a BREAKING CHANGE footer in the body', () => {
        const records = [
            {
                hash: 'a'.repeat(40),
                subject: 'feat: add',
                body: 'BREAKING CHANGE: the API changed',
                author: 'A',
                authorEmail: '',
            },
        ];
        expect(buildSummary(records)).toContain('### Breaking Changes');
    });

    it('orders and renames CC groups', () => {
        const item = (text: string) => {
            const parsed = parseCcSubject(text);
            return { parsed, text, bodyParagraphs: [] as string[][] };
        };
        const items = [item('feat: a'), item('fix: b'), item('chore: c')];
        expect(groupItems(items, ['fix', 'feat']).map(group => group.title)).toEqual([
            'Bug fixes',
            'New features',
            'Chores',
        ]);
        expect(
            groupItems(items, {
                fix: 'Bug Fixes',
                feat: { title: 'New Features' },
            }).map(group => group.title)
        ).toEqual(['Bug Fixes', 'New Features', 'Chores']);
    });

    it('supports group callbacks and hides empty groups', () => {
        const item = (text: string) => {
            const parsed = parseCcSubject(text);
            return { parsed, text, bodyParagraphs: [] as string[][] };
        };
        const contextTypesSeen: string[] = [];
        const groups = groupItems([item('feat: a'), item('feat: b'), item('fix: c')], context => {
            contextTypesSeen.push(...context.types);
            return [
                {
                    type: 'feat',
                    title: group => `Features (${group.groupItems.length})`,
                    order: group => (group.type === 'feat' ? 0 : 1),
                },
                {
                    type: 'fix',
                    hidden: group => group.groupItems.length === 0,
                },
            ];
        });
        expect(groups.map(group => group.title)).toEqual(['Features (2)', 'Bug fixes']);
        expect(contextTypesSeen).toEqual(['feat', 'fix']);
    });

    it('hides a group with a false record entry', () => {
        const item = (text: string) => {
            const parsed = parseCcSubject(text);
            return { parsed, text, bodyParagraphs: [] as string[][] };
        };
        expect(
            groupItems([item('feat: a'), item('fix: b')], { feat: false, fix: 'Fixes' }).map(
                group => group.title
            )
        ).toEqual(['Fixes']);
    });

    it('falls back to major/minor/patch buckets when commitlint is disabled', () => {
        const records = [
            {
                hash: 'a'.repeat(40),
                subject: 'feat!: break',
                body: '',
                author: 'A',
                authorEmail: '',
            },
            { hash: 'b'.repeat(40), subject: 'feat: add', body: '', author: 'A', authorEmail: '' },
            {
                hash: 'c'.repeat(40),
                subject: 'fix: patch it',
                body: '',
                author: 'A',
                authorEmail: '',
            },
            {
                hash: 'd'.repeat(40),
                subject: 'random change',
                body: '',
                author: 'A',
                authorEmail: '',
            },
        ];
        const summary = buildSummary(records, { commitlint: false });
        expect(summary).toContain('### Major changes');
        expect(summary).toContain('### Minor changes');
        expect(summary).toContain('### Patch changes');
        expect(summary).not.toContain('### New features');
        expect(summary).toContain('- Add');
        expect(summary).toContain('- Random change');
    });

    it('customizes commit credits and supports a custom formatter', () => {
        const records = [
            {
                hash: 'a'.repeat(40),
                subject: 'feat: add',
                body: '',
                author: 'A',
                authorEmail: 'a@example.com',
            },
        ];
        const plain = buildSummary(records, {
            commit: { author: false, commitSha: false, issues: false },
        });
        expect(plain).toContain('- Add');
        expect(plain).not.toContain(' by ');
        expect(plain).not.toContain('#aaaaaaa');

        const custom = buildSummary(records, {
            commit: { format: ctx => `CUSTOM ${ctx.commit.subject}` },
        });
        expect(custom).toContain('- CUSTOM feat: add');
    });

    it('uses the configured group order in the summary', () => {
        const records = [
            { hash: 'a'.repeat(40), subject: 'feat: add', body: '', author: 'A', authorEmail: '' },
            { hash: 'b'.repeat(40), subject: 'fix: fix', body: '', author: 'A', authorEmail: '' },
        ];
        const summary = buildSummary(records, {
            groups: [
                { type: 'fix', title: 'Bug Fixes' },
                { type: 'feat', title: 'New Features' },
            ],
        });
        expect(summary.indexOf('### Bug Fixes')).toBeLessThan(summary.indexOf('### New Features'));
    });

    it('adds a New contributors footer with their nested commit messages', () => {
        const records = [
            {
                hash: 'a'.repeat(40),
                subject: 'feat: first change',
                body: '',
                author: 'Ada',
                authorEmail: 'ada@example.com',
            },
            {
                hash: 'b'.repeat(40),
                subject: 'fix: second change',
                body: '',
                author: 'Ada',
                authorEmail: 'ada@example.com',
            },
            {
                hash: 'c'.repeat(40),
                subject: 'chore: old change',
                body: '',
                author: 'Old',
                authorEmail: 'old@example.com',
            },
        ];
        for (const commitlint of [true, false]) {
            const summary = buildSummary(records, {
                commitlint,
                priorAuthors: ['old@example.com'],
            });
            const [before, contributors = ''] = summary.split('### New contributors');
            expect(before).toMatch(/old change/i);
            expect(contributors).toContain('- Ada');
            expect(contributors).toContain('  - First change (');
            expect(contributors).toContain('  - Second change (');
            expect(contributors).not.toContain('- Old');
            expect(
                contributors
                    .split('\n')
                    .filter(line => line.startsWith('  - '))
                    .every(line => !line.includes(' by '))
            ).toBe(true);
        }
    });

    it('renders descriptions as nested bullets under the commit', () => {
        const item = {
            parsed: parseCcSubject('feat(server): add things'),
            text: '- Add things ([#abcdef1](https://github.com/x/y/commit/abcdef1) by T0chi)',
            bodyParagraphs: [
                ['New workspace package that generates.', 'wrapped continuation'],
                ['**BREAKING CHANGE:** the API shape changed'],
            ],
        };
        const rendered = renderGroups(groupItems([item]));
        expect(rendered).toContain('  - New workspace package that generates.');
        expect(rendered).toContain('    wrapped continuation');
        expect(rendered).toContain('  - **BREAKING CHANGE:** the API shape changed');
        // the commit line stays a top-level bullet
        expect(rendered).toContain('- Add things ([#abcdef1]');
    });

    it('extracts conventional footers, keeps list items and skips issue-only lines', () => {
        const body = [
            'Real description line.',
            'wrapped continuation',
            '',
            'BREAKING CHANGE: the API shape changed',
            '- a bullet to keep',
            'fixes #12',
            'Reviewed-by: Someone',
        ].join('\n');
        expect(formatBody(body)).toEqual([
            ['Real description line. wrapped continuation'],
            ['**BREAKING CHANGE:** the API shape changed'],
            ['a bullet to keep'],
            ['**Reviewed-by:** Someone'],
        ]);
    });

    it('keeps a multi-line conventional footer together', () => {
        const body = [
            '- a list item',
            '',
            'BREAKING CHANGE: ConfigScopes and CONFIG_SECTION_SCHEMAS,',
            'CONFIG_TYPE_SCHEMAS and CONFIG_SECTION_DESCRIPTIONS are removed.',
            'Consumers should use ConfigSchema instead.',
            'Reviewed-by: Someone',
        ].join('\n');
        expect(formatBody(body)).toEqual([
            ['a list item'],
            [
                '**BREAKING CHANGE:** ConfigScopes and CONFIG_SECTION_SCHEMAS, CONFIG_TYPE_SCHEMAS and CONFIG_SECTION_DESCRIPTIONS are removed. Consumers should use ConfigSchema instead.',
            ],
            ['**Reviewed-by:** Someone'],
        ]);
    });

    it('unwraps hard-wrapped lines into sentences', () => {
        expect(
            formatBody(
                'Revamp the js SDK around modular clients: ProxifiedClient now returns a proxy\nthat exposes the SDK resource members.'
            )
        ).toEqual([
            [
                'Revamp the js SDK around modular clients: ProxifiedClient now returns a proxy that exposes the SDK resource members.',
            ],
        ]);
    });

    it('keeps every list item, including wrapped continuations', () => {
        const body = [
            '- Load providers from project/global search paths (JSON files, dirs or',
            '  http(s) URLs), keeping the legacy provider files for compatibility.',
            '- Add provider search-path management to `dbx registry` (`--kind',
            '  providers`, `--set`, `--clear`).',
            '',
            '* a star bullet',
            '1. a numbered item',
        ].join('\n');
        expect(formatBody(body)).toEqual([
            [
                'Load providers from project/global search paths (JSON files, dirs or http(s) URLs), keeping the legacy provider files for compatibility.',
            ],
            [
                'Add provider search-path management to `dbx registry` (`--kind providers`, `--set`, `--clear`).',
            ],
            ['a star bullet'],
            ['a numbered item'],
        ]);
    });

    it('preserves fenced code blocks verbatim', () => {
        const body = [
            'Before.',
            '',
            '```ts',
            'const a = 1;',
            'const b = 2;',
            '```',
            '',
            'After.',
        ].join('\n');
        expect(formatBody(body)).toEqual([
            ['Before.'],
            ['```ts', 'const a = 1;', 'const b = 2;', '```'],
            ['After.'],
        ]);
    });

    it('splits inline descriptions after the commit credit suffix', () => {
        const rest =
            'add @proxified/graphql-js client generator ([#4e2dc35](https://github.com/x/y/commit/4e2dc35) by T0chi) New workspace package';
        expect(splitInlineDescription(rest)).toEqual({
            main: 'add @proxified/graphql-js client generator ([#4e2dc35](https://github.com/x/y/commit/4e2dc35) by T0chi)',
            inline: 'New workspace package',
        });
        // linked author + fixes block
        const linked =
            'add thing ([#abcdef1](https://github.com/x/y/commit/abcdef1) by [T](https://github.com/T))(fixes [#1](https://github.com/x/y/issues/1)) Trailing note';
        expect(splitInlineDescription(linked)).toEqual({
            main: 'add thing ([#abcdef1](https://github.com/x/y/commit/abcdef1) by [T](https://github.com/T))(fixes [#1](https://github.com/x/y/issues/1))',
            inline: 'Trailing note',
        });
        // no inline content -> unchanged
        const plain = 'add thing ([#abcdef1](https://github.com/x/y/commit/abcdef1) by T0chi)';
        expect(splitInlineDescription(plain)).toEqual({ main: plain, inline: '' });
    });

    it('renders a version heading with the month + year suffix', () => {
        const entry = renderChangelogEntry(
            '0.15.0',
            '### New features\n\n- item',
            new Date('2026-09-01')
        );
        expect(entry).toContain('## 0.15.0 (September 2026)');
        expect(entry).toContain('<!-- release:start -->');
        expect(entry).toContain('<!-- release:end -->');
    });

    it('parses existing changelog entries for backward reformatting', () => {
        const content = [
            '# Changelog',
            '',
            '## 0.15.0 (September 2026)',
            '',
            '<!-- release:start -->',
            '',
            '- **chore(scripts):** tidy ([#abcdef1](https://github.com/x/y/commit/abcdef1) by [T](https://github.com/T))',
            '  A nested description line.',
            '',
            '<!-- release:end -->',
            '',
            '### Package changes',
            '#### Added',
            '- `some-dep` `^1.0.0`',
            '',
            '## 0.14.0',
            '',
            '- **feat(server):** add thing ([#1234567](https://github.com/x/y/commit/1234567) by [T](https://github.com/T))',
        ].join('\n');
        const entries = parseExistingChangelog(content);
        expect(entries.map(e => e.version)).toEqual(['0.15.0', '0.14.0']);
        // only commit bullet lines are collected; markers, descriptions and the
        // package-changes footer are skipped
        expect(entries[0]!.bullets).toHaveLength(1);
        expect(entries[0]!.bullets[0]).toContain('- **chore(scripts):** tidy');
        expect(entries[0]!.bullets.join('\n')).not.toContain('release:');
        expect(entries[0]!.bullets.join('\n')).not.toContain('A nested description line.');
        expect(entries[0]!.bullets.join('\n')).not.toContain('some-dep');
    });
});

describe('formatLine', () => {
    it('keeps a numeric-only short hash as a commit link', () => {
        expect(
            formatLine('- A change ([#4033009](https://github.com/o/r/commit/4033009) by T)', 'o/r')
        ).toBe('- A change ([#4033009](https://github.com/o/r/commit/4033009) by T)');
    });

    it('repairs a numeric-only hash that was linked as an issue', () => {
        expect(formatLine('[#4033009](https://github.com/o/r/issues/4033009) by T', 'o/r')).toBe(
            '[#4033009](https://github.com/o/r/commit/4033009) by T'
        );
    });

    it('still links a real issue number', () => {
        expect(formatLine('fixes #12', 'o/r')).toBe(
            'fixes [#12](https://github.com/o/r/issues/12)'
        );
    });

    it('leaves a numeric link that is not a commit as an issue', () => {
        expect(formatLine('[#999999](https://github.com/o/r/issues/999999)', 'o/r')).toBe(
            '[#999999](https://github.com/o/r/issues/999999)'
        );
    });

    it('links letter-containing hashes when git history is incomplete', () => {
        gitState.complete = false;
        try {
            expect(formatLine('See #deadbee', 'o/r')).toBe(
                'See [#deadbee](https://github.com/o/r/commit/deadbee)'
            );
            // Numeric-only refs stay ambiguous without complete history.
            expect(formatLine('fixes #1234567', 'o/r')).toBe(
                'fixes [#1234567](https://github.com/o/r/issues/1234567)'
            );
        } finally {
            gitState.complete = true;
        }
    });

    it('bolds a bare BREAKING CHANGE marker', () => {
        expect(formatLine('BREAKING CHANGE: the API changed', 'o/r')).toBe(
            '**BREAKING CHANGE:** the API changed'
        );
        expect(formatLine('BREAKING-CHANGE: the API changed', undefined)).toBe(
            '**BREAKING-CHANGE:** the API changed'
        );
    });

    it('does not double-wrap an already bold BREAKING CHANGE marker', () => {
        expect(formatLine('**BREAKING CHANGE:** the API changed', 'o/r')).toBe(
            '**BREAKING CHANGE:** the API changed'
        );
    });
});

describe('renderCommitRef', () => {
    it('links the short hash when a repo slug is known', () => {
        expect(renderCommitRef('o/r', 'abcdef1234567890')).toBe(
            '[#abcdef1](https://github.com/o/r/commit/abcdef1234567890)'
        );
    });

    it('renders a plain short hash when the slug cannot be resolved', () => {
        expect(renderCommitRef(undefined, 'abcdef1234567890')).toBe('#abcdef1');
    });
});

describe('reformatChangelogContent (--format-only)', () => {
    it('regroups existing entries, strips CC prefixes and adds no markers', () => {
        const content = [
            '# Changelog',
            '',
            '## 0.14.0 (September 2026)',
            '',
            '- **feat(server):** add a thing ([#abcdef1](https://github.com/x/y/commit/abcdef1) by [T](https://github.com/T))',
            '- **fix(frontend):** fix another ([#1234567](https://github.com/x/y/commit/1234567) by [T](https://github.com/T))',
        ].join('\n');
        const out = reformatChangelogContent(content, 'x/y');
        expect(out).toContain('## 0.14.0');
        expect(out).toContain('### New features');
        expect(out).toContain('#### Server');
        expect(out).toContain('### Bug fixes');
        expect(out).toContain('#### Frontend');
        // CC prefix stripped + sentence capitalized
        expect(out).toContain('- Add a thing ([#abcdef1]');
        expect(out).not.toContain('**feat(server):**');
        // reformatted entries carry no release markers
        expect(out).not.toContain('<!-- release:');
    });

    it('uses the configured group order and titles when reformatting', () => {
        const content = [
            '# Changelog',
            '',
            '## 0.14.0',
            '',
            '- **feat(server):** add a thing ([#abcdef1](https://github.com/x/y/commit/abcdef1) by [T](https://github.com/T))',
            '- **fix(frontend):** fix another ([#1234567](https://github.com/x/y/commit/1234567) by [T](https://github.com/T))',
        ].join('\n');
        const out = reformatChangelogContent(content, 'x/y', false, false, [
            { type: 'fix', title: 'Bug Fixes' },
            { type: 'feat', title: 'New Features' },
        ]);
        expect(out.indexOf('### Bug Fixes')).toBeLessThan(out.indexOf('### New Features'));
        expect(out).toContain('#### Frontend');
        expect(out).toContain('#### Server');
    });

    it('keeps an existing description when the commit body has escape artifacts', () => {
        // `f80634f`'s body has BEL/FF where `a`/`f` were (`` `a `` / `` `f ``),
        // so a re-format must not overwrite the corrected changelog text.
        const content = [
            '# Changelog',
            '',
            '## 2.1.0 (October 2026)',
            '',
            '- Configure breaking-change detection ([#f80634f](https://github.com/x/y/commit/f80634f) by [T](https://github.com/T))',
            '  - The corrected description with any, false.',
        ].join('\n');
        const out = reformatChangelogContent(content, 'x/y');
        expect(out).toContain('The corrected description with any, false.');
        expect(out).not.toContain('ny, alse');
    });
});

describe.skipIf(!GIT)('changelog dry run (real git history)', () => {
    it('builds a summary from pushed commits without errors', () => {
        const records = readCommits(safeRange());
        expect(records.length).toBeGreaterThan(0);
        const summary = buildSummary(records);
        expect(summary.length).toBeGreaterThan(0);
        // The summary is grouped into `### <Rule>` sections.
        expect(summary).toMatch(/^### /m);
    });

    it('renders the full proposed entry without throwing', () => {
        const records = readCommits(safeRange());
        const summary = buildSummary(records);
        const entry = renderChangelogEntry('0.16.0', summary, new Date());
        expect(entry).toMatch(/^## 0\.16\.0 \([A-Za-z]+ \d{4}\)$/m);
        // Commit lines are capitalized bullets WITHOUT the CC `rule(scope):` prefix.
        expect(entry).toMatch(/^- [A-Z]/m);
        expect(entry).not.toMatch(/^- \*\*/m);
    });
});

describe('reformatChangelogContent heading and legacy bodies', () => {
    it('keeps legacy two-space description lines', () => {
        const content = [
            '# Changelog',
            '',
            '## 1.0.0 (January 2026)',
            '',
            '- **feat(server):** Add a thing ([#abc1234](https://github.com/x/y/commit/abc1234) by [T](https://github.com/T))',
            '  A legacy two-space description.',
        ].join('\n');
        const out = reformatChangelogContent(content, 'x/y');
        expect(out).toContain('A legacy two-space description.');
    });

    it('recognizes bracketed and v-prefixed version headings', () => {
        const content = [
            '# Changelog',
            '',
            '## [1.2.0] - 2026-01-01',
            '',
            '- **feat(server):** add two ([#abcdef1](https://github.com/x/y/commit/abcdef1) by [T](https://github.com/T))',
            '',
            '## v1.1.0',
            '',
            '- **fix(server):** fix one ([#1234567](https://github.com/x/y/commit/1234567) by [T](https://github.com/T))',
        ].join('\n');
        const out = reformatChangelogContent(content, 'x/y');
        expect(out).toContain('## 1.2.0');
        expect(out).toContain('## 1.1.0');
        expect(out).toContain('Add two');
        expect(out).toContain('Fix one');
        // The second version's bullet must not be merged into the first.
        expect(out.indexOf('Fix one')).toBeGreaterThan(out.indexOf('## 1.1.0'));
    });

    it('leaves a changelog with an unsupported heading untouched', () => {
        const content = [
            '# Changelog',
            '',
            '## Unreleased',
            '',
            '- Work in progress.',
            '',
            '## 1.0.0',
            '',
            '- **feat:** shipped.',
        ].join('\n');
        expect(reformatChangelogContent(content, 'x/y')).toBe(content);
    });
});

describe('cross-repo links and code fences', () => {
    it('leaves links to another repository alone', () => {
        expect(
            formatLine('See [#abcdef1](https://github.com/other/repo/commit/abcdef1)', 'x/y')
        ).toBe('See [#abcdef1](https://github.com/other/repo/commit/abcdef1)');
        expect(formatLine('See [#42](https://github.com/other/repo/pull/42)', 'x/y')).toBe(
            'See [#42](https://github.com/other/repo/pull/42)'
        );
    });

    it('does not link URL fragments', () => {
        expect(formatLine('See https://example.com/#123', 'x/y')).toBe(
            'See https://example.com/#123'
        );
    });

    it('does not rewrite fenced code blocks', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-fence-'));
        const file = path.join(dir, 'CHANGELOG.md');
        fs.writeFileSync(file, '# Changelog\n\n```sh\n#123\n```\n\nfixes #123\n');
        try {
            formatChangelogFile(file, 'x/y');
            const out = fs.readFileSync(file, 'utf8');
            expect(out).toContain('```sh\n#123\n```');
            expect(out).toContain('[#123](https://github.com/x/y/issues/123)');
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
