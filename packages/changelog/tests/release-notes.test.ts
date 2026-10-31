import { describe, expect, it } from 'vitest';

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
        expect(notes.startsWith('## 2.0.0')).toBe(true);
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 1.11.4');
        expect(notes).not.toContain('- Old thing');
    });

    it('ignores unrelated tags that are not changelog versions', () => {
        const notes = buildReleaseNotes(CHANGELOG, ['20261026.1', 'v1.11.4'], '2.0.0');
        expect(notes).toContain('## 2.0.0');
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 1.11.4');
    });

    it('falls back to the newest entry for a first release', () => {
        const notes = buildReleaseNotes(CHANGELOG, [], '2.0.0');
        expect(notes.startsWith('## 2.0.0')).toBe(true);
        expect(notes).toContain('- New thing');
        expect(notes).not.toContain('## 1.11.4');
        expect(notes).not.toContain('- Old thing');
    });

    it('excludes the current version tag and still falls back safely', () => {
        const notes = buildReleaseNotes(CHANGELOG, ['v2.0.0'], '2.0.0');
        expect(notes.startsWith('## 2.0.0')).toBe(true);
        expect(notes).not.toContain('## 1.11.4');
    });

    it('accepts a v-prefixed current version', () => {
        const notes = buildReleaseNotes(CHANGELOG, ['v2.0.0'], 'v2.0.0');
        expect(notes.startsWith('## 2.0.0')).toBe(true);
        expect(notes).not.toContain('## 1.11.4');
    });

    it('aggregates entries above the last released version', () => {
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
        expect(notes).toContain('## 2.1.0');
        expect(notes).toContain('- New thing');
        expect(notes).toContain('## 2.0.1');
        expect(notes).toContain('- Fix thing');
        expect(notes).not.toContain('## 2.0.0');
        expect(notes).not.toContain('- Old thing');
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

    it('parses --release-notes', () => {
        expect(parseArgsCli(['--release-notes', '2.0.0']).releaseNotes).toBe('2.0.0');
    });
});
