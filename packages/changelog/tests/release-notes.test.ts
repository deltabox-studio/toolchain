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
        expect(normalizeReleaseVersion('@acme/app@1.2.3')).toBe('1.2.3');
        expect(normalizeReleaseVersion('20261026.1')).toBeUndefined();
    });

    it('parses --release-body and --release-body-wrap', () => {
        expect(parseArgsCli(['--release-body', '2.0.0']).releaseBody).toBe('2.0.0');
        expect(parseArgsCli(['--release-body-wrap']).releaseBodyWrap).toBe(true);
        expect(parseArgsCli(['--release-notes', '2.0.0']).releaseBody).toBe('2.0.0');
        expect(parseArgsCli(['--release']).releaseBodyWrap).toBe(true);
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
