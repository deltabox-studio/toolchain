import { describe, expect, it } from 'vite-plus/test';

import { buildReleaseNotes, normalizeReleaseVersion, parseArgsCli } from '../src/index.js';

const CHANGELOG = [
    '# Changelog',
    '',
    '## 2.0.0 (October 2026)',
    '',
    '<!-- release:start -->',
    '',
    '### New features',
    '- New thing',
    '',
    '<!-- release:end -->',
    '',
    '## 1.11.4 (September 2026)',
    '',
    '### Bug fixes',
    '- Old thing',
    '',
    '## 1.11.3 (August 2026)',
    '',
    '- Older thing',
    '',
].join('\n');

describe('release notes', () => {
    it('stops at the last released version found in the changelog', () => {
        const notes = buildReleaseNotes(CHANGELOG, ['20261026.1', 'v2.0.0', 'v1.11.4'], '2.0.0');
        expect(notes.startsWith('### New features')).toBe(true);
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 2.0.0');
        expect(notes).not.toContain('## 1.11.4');
        expect(notes).not.toContain('- Old thing');
    });

    it('ignores unrelated tags that are not changelog versions', () => {
        const notes = buildReleaseNotes(CHANGELOG, ['20261026.1', 'v1.11.4'], '2.0.0');
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 2.0.0');
        expect(notes).not.toContain('## 1.11.4');
    });

    it('falls back to the newest entry for a first release', () => {
        const notes = buildReleaseNotes(CHANGELOG, [], '2.0.0');
        expect(notes.startsWith('### New features')).toBe(true);
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 2.0.0');
        expect(notes).not.toContain('## 1.11.4');
        expect(notes).not.toContain('- Old thing');
    });

    it('excludes the current version tag and still falls back safely', () => {
        const notes = buildReleaseNotes(CHANGELOG, ['v2.0.0'], '2.0.0');
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 2.0.0');
        expect(notes).not.toContain('## 1.11.4');
    });

    it('accepts a v-prefixed current version', () => {
        const notes = buildReleaseNotes(CHANGELOG, ['v2.0.0'], 'v2.0.0');
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 2.0.0');
        expect(notes).not.toContain('## 1.11.4');
    });

    it('aggregates entries above the last released version without headings', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 2.1.0 (October 2026)',
            '',
            '- New thing',
            '',
            '## 2.0.1 (October 2026)',
            '',
            '- Fix thing',
            '',
            '## 2.0.0 (October 2026)',
            '',
            '- Old thing',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v2.0.0'], '2.1.0');
        expect(notes).toContain('- New thing');
        expect(notes).toContain('- Fix thing');
        expect(notes).not.toContain('## 2.1.0');
        expect(notes).not.toContain('## 2.0.1');
        expect(notes).not.toContain('## 2.0.0');
        expect(notes).not.toContain('- Old thing');
    });

    it('merges equal details groups from several versions', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 2.1.0 (October 2026)',
            '',
            '<details>',
            '<summary>Documentation</summary>',
            '',
            '- New docs',
            '',
            '</details>',
            '',
            '<details>',
            '<summary>Chores</summary>',
            '',
            '- New chore',
            '',
            '</details>',
            '',
            '## 2.0.1 (October 2026)',
            '',
            '<details>',
            '<summary>Documentation</summary>',
            '',
            '- Fix docs',
            '',
            '</details>',
            '',
            '<details>',
            '<summary>Chores</summary>',
            '',
            '- Fix chore',
            '',
            '</details>',
            '',
            '## 2.0.0 (October 2026)',
            '',
            '- Old thing',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v2.0.0'], '2.1.0');
        expect(notes.match(/<summary>Documentation<\/summary>/g)).toHaveLength(1);
        expect(notes.match(/<summary>Chores<\/summary>/g)).toHaveLength(1);
        expect(notes).toContain('- New docs');
        expect(notes).toContain('- Fix docs');
        expect(notes).toContain('- New chore');
        expect(notes).toContain('- Fix chore');
        expect(notes).not.toContain('## 2.1.0');
        expect(notes).not.toContain('## 2.0.1');
        expect(notes).not.toContain('- Old thing');
    });

    it('uses only the marker body when markers are present', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 2.0.0 (October 2026)',
            '',
            'Outside the markers.',
            '',
            '<!-- release:start -->',
            '',
            '- New thing',
            '',
            '<!-- release:end -->',
            '',
            'Also outside.',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, [], '2.0.0');
        expect(notes).toBe('- New thing');
        expect(notes).not.toContain('Outside');
    });

    it('returns an empty body when there are no version headings', () => {
        expect(buildReleaseNotes('# Changelog\n\nNo releases yet.\n', ['v1.0.0'], '1.0.0')).toBe(
            ''
        );
    });

    it('normalizes v-prefixed and scoped tags', () => {
        expect(normalizeReleaseVersion('v1.2.3')).toBe('1.2.3');
        expect(normalizeReleaseVersion('@org/app@1.2.3')).toBe('1.2.3');
        expect(normalizeReleaseVersion('20261026.1')).toBeUndefined();
    });

    it('parses --release-body and --release-body-wrap', () => {
        expect(parseArgsCli(['--release-body', '2.0.0']).releaseBody).toBe('2.0.0');
        expect(parseArgsCli(['--release-body-wrap']).releaseBodyWrap).toBe(true);
        expect(parseArgsCli(['--release-notes', '2.0.0']).releaseBody).toBe('2.0.0');
        expect(parseArgsCli(['--release']).releaseBodyWrap).toBe(true);
    });

    it('parses the release-group flags', () => {
        expect(parseArgsCli(['--release-group']).releaseGroup).toBe(true);
        expect(parseArgsCli(['--no-release-group']).releaseGroup).toBe(false);
        expect(parseArgsCli(['--release-since', 'v1.2.0']).releaseSince).toBe('v1.2.0');
        expect(parseArgsCli(['--release-include-prereleases']).releaseIncludePrereleases).toBe(
            true
        );
        expect(parseArgsCli(['--release-body', '2.0.0']).releaseGroup).toBeUndefined();
    });
});

const GROUPED_CHANGELOG = [
    '# Changelog',
    '',
    '## 3.0.0 (November 2026)',
    '',
    '- Stable change',
    '',
    '## 3.0.0-beta.2 (November 2026)',
    '',
    '- Beta two',
    '',
    '## 3.0.0-beta.1 (November 2026)',
    '',
    '- Beta one',
    '',
    '## 2.9.0 (October 2026)',
    '',
    '- Previous stable',
    '',
].join('\n');

const GROUPED_TAGS = ['v3.0.0-beta.2', 'v3.0.0-beta.1', 'v2.9.0'];

describe('grouped release notes', () => {
    it('groups every prerelease since the last stable release', () => {
        const notes = buildReleaseNotes(GROUPED_CHANGELOG, GROUPED_TAGS, '3.0.0', {
            group: true,
        });

        expect(notes).toContain('- Stable change');
        expect(notes).toContain('- Beta two');
        expect(notes).toContain('- Beta one');
        expect(notes).not.toContain('- Previous stable');
        expect(notes).not.toContain('## 3.0.0');
        expect(notes).not.toContain('## 3.0.0-beta.2');
        expect(notes).not.toContain('## 2.9.0');
    });

    it('stops at the latest prerelease with includePrereleases', () => {
        const notes = buildReleaseNotes(GROUPED_CHANGELOG, GROUPED_TAGS, '3.0.0', {
            group: true,
            includePrereleases: true,
        });

        expect(notes).toContain('- Stable change');
        expect(notes).not.toContain('- Beta two');
        expect(notes).not.toContain('- Beta one');
        expect(notes).not.toContain('- Previous stable');
    });

    it('keeps prerelease boundaries for a prerelease release', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 3.0.0-beta.2 (November 2026)',
            '',
            '- Beta two',
            '',
            '## 3.0.0-beta.1 (November 2026)',
            '',
            '- Beta one',
            '',
            '## 2.9.0 (October 2026)',
            '',
            '- Previous stable',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, GROUPED_TAGS, '3.0.0-beta.2', {
            group: true,
        });

        expect(notes).toContain('- Beta two');
        expect(notes).not.toContain('- Beta one');
        expect(notes).not.toContain('- Previous stable');
    });

    it('groups the whole changelog on a first release', () => {
        const notes = buildReleaseNotes(GROUPED_CHANGELOG, [], '3.0.0', { group: true });

        expect(notes).toContain('- Stable change');
        expect(notes).toContain('- Beta two');
        expect(notes).toContain('- Beta one');
        expect(notes).toContain('- Previous stable');
    });

    it('keeps the newest-entry fallback for a first release without grouping', () => {
        const notes = buildReleaseNotes(GROUPED_CHANGELOG, [], '3.0.0');

        expect(notes).toContain('- Stable change');
        expect(notes).not.toContain('- Beta two');
        expect(notes).not.toContain('- Previous stable');
    });

    it('groups across missing tags', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 3.1.0 (November 2026)',
            '',
            '- Newest',
            '',
            '## 3.0.0 (November 2026)',
            '',
            '- Untagged',
            '',
            '## 2.9.0 (October 2026)',
            '',
            '- Released',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v2.9.0'], '3.1.0', { group: true });

        expect(notes).toContain('- Newest');
        expect(notes).toContain('- Untagged');
        expect(notes).not.toContain('- Released');
    });

    it('groups everything when no tag matches a changelog version', () => {
        const notes = buildReleaseNotes(GROUPED_CHANGELOG, ['v9.9.9'], '3.0.0', {
            group: true,
        });

        expect(notes).toContain('- Stable change');
        expect(notes).toContain('- Beta two');
        expect(notes).toContain('- Beta one');
        expect(notes).toContain('- Previous stable');
    });

    it('honours an explicit since boundary', () => {
        const notes = buildReleaseNotes(GROUPED_CHANGELOG, GROUPED_TAGS, '3.0.0', {
            group: true,
            since: 'v3.0.0-beta.1',
        });

        expect(notes).toContain('- Stable change');
        expect(notes).toContain('- Beta two');
        expect(notes).not.toContain('- Beta one');
        expect(notes).not.toContain('- Previous stable');
    });

    it('falls back to automatic discovery when since is missing', () => {
        const notes = buildReleaseNotes(GROUPED_CHANGELOG, GROUPED_TAGS, '3.0.0', {
            group: true,
            since: 'v9.9.9',
        });

        expect(notes).toContain('- Stable change');
        expect(notes).toContain('- Beta two');
        expect(notes).toContain('- Beta one');
        expect(notes).not.toContain('- Previous stable');
    });

    it('ignores non-version ## headings', () => {
        const changelog = [
            '# Changelog',
            '',
            '## Unreleased',
            '',
            'Notes that are not a version.',
            '',
            '## 3.0.0 (November 2026)',
            '',
            '- Stable change',
            '',
            '## 2.9.0 (October 2026)',
            '',
            '- Previous stable',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v2.9.0'], '3.0.0', { group: true });

        expect(notes).toContain('- Stable change');
        expect(notes).not.toContain('- Previous stable');
        expect(notes).not.toContain('## Unreleased');
    });

    it('keeps only the newest Package changes footer', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 3.1.0 (November 2026)',
            '',
            '### New features',
            '- Newest',
            '',
            '### Package changes',
            '- [myapp](https://example.test/myapp)',
            '  - dependency: 1.0.0 -> 2.0.0',
            '',
            '## 3.0.0 (November 2026)',
            '',
            '### New features',
            '- Older',
            '',
            '### Package changes',
            '- [myapp](https://example.test/myapp)',
            '  - dependency: 0.9.0 -> 1.0.0',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v3.0.0'], '3.1.0', { group: true });

        expect(notes.match(/### Package changes/g)).toHaveLength(1);
        expect(notes).toContain('1.0.0 -> 2.0.0');
        expect(notes).not.toContain('0.9.0 -> 1.0.0');
    });

    it('keeps one Package changes footer inside a wrapped footer block', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 3.2.0 (November 2026)',
            '',
            '### New features',
            '- Newest',
            '',
            '<details>',
            '<summary>Footer</summary>',
            '',
            '### Package changes',
            '- dependency: 1.0.0 -> 2.0.0',
            '',
            '</details>',
            '',
            '## 3.1.0 (November 2026)',
            '',
            '### New features',
            '- Older',
            '',
            '<details>',
            '<summary>Footer</summary>',
            '',
            '### Package changes',
            '- dependency: 0.9.0 -> 1.0.0',
            '',
            '</details>',
            '',
            '## 3.0.0 (November 2026)',
            '',
            '- Released',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v3.0.0'], '3.2.0', { group: true });

        expect(notes.match(/### Package changes/g)).toHaveLength(1);
        expect(notes).toContain('1.0.0 -> 2.0.0');
        expect(notes).not.toContain('0.9.0 -> 1.0.0');
        expect(notes.match(/<summary>Footer<\/summary>/g)).toHaveLength(1);
    });

    it('merges wrapped release-note bodies', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 3.2.0 (November 2026)',
            '',
            '<details>',
            '<summary>**Release notes**</summary>',
            '',
            '- Newest',
            '',
            '</details>',
            '',
            '## 3.1.0 (November 2026)',
            '',
            '<details>',
            '<summary>**Release notes**</summary>',
            '',
            '- Older',
            '',
            '</details>',
            '',
            '## 3.0.0 (November 2026)',
            '',
            '- Released',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v3.0.0'], '3.2.0', { group: true });

        expect(notes.match(/<summary>\*\*Release notes\*\*<\/summary>/g)).toHaveLength(1);
        expect(notes).toContain('- Newest');
        expect(notes).toContain('- Older');
        expect(notes).not.toContain('- Released');
    });

    it('merges minCommits details groups and keeps plain sections', () => {
        const changelog = [
            '# Changelog',
            '',
            '## 3.2.0 (November 2026)',
            '',
            '<details>',
            '<summary>New features</summary>',
            '',
            '- A',
            '',
            '</details>',
            '',
            '### Documentation',
            '- Doc A',
            '',
            '## 3.1.0 (November 2026)',
            '',
            '<details>',
            '<summary>New features</summary>',
            '',
            '- B',
            '',
            '</details>',
            '',
            '### Documentation',
            '- Doc B',
            '',
            '## 3.0.0 (November 2026)',
            '',
            '- Released',
            '',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v3.0.0'], '3.2.0', { group: true });

        expect(notes.match(/<summary>New features<\/summary>/g)).toHaveLength(1);
        expect(notes).toContain('- A');
        expect(notes).toContain('- B');
        expect(notes).toContain('### Documentation');
        expect(notes).toContain('- Doc A');
        expect(notes).toContain('- Doc B');
        expect(notes).not.toContain('- Released');
    });

    it('is idempotent across repeated calls', () => {
        const first = buildReleaseNotes(GROUPED_CHANGELOG, GROUPED_TAGS, '3.0.0', {
            group: true,
        });
        const second = buildReleaseNotes(GROUPED_CHANGELOG, GROUPED_TAGS, '3.0.0', {
            group: true,
        });

        expect(second).toBe(first);
    });
});

describe('release notes for a version without a heading', () => {
    it('uses the newest entry instead of returning an empty body', () => {
        const notes = buildReleaseNotes(CHANGELOG, ['v2.0.0'], '2.1.0');
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 2.0.0');
        expect(notes).not.toContain('## 1.11.4');
    });
});

describe('release notes with details-body summaries', () => {
    it('reads the summary heading as the version boundary without leaking it', () => {
        const changelog = [
            '# Changelog',
            '',
            '<details>',
            '<summary><h2>2.0.0 (October 2026)</h2></summary>',
            '',
            '<!-- release:start -->',
            '',
            '- New thing',
            '',
            '<!-- release:end -->',
            '',
            '</details>',
            '',
            '## 1.11.4 (September 2026)',
            '',
            '- Old thing',
        ].join('\n');
        const notes = buildReleaseNotes(changelog, ['v2.0.0', 'v1.11.4'], '2.0.0');
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('<summary><h2>2.0.0');
        expect(notes).not.toContain('## 1.11.4');
        expect(notes).not.toContain('- Old thing');
    });
});
