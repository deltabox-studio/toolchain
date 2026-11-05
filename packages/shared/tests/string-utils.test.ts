import { describe, expect, it } from 'vitest';

import {
    hasEscapeArtifacts,
    sanitizeText,
    stripControlChars,
    stripEscapeArtifacts,
} from '../src/index.js';

describe('sanitizeText', () => {
    it('restores the letter an escaped backtick consumed', () => {
        // PowerShell turns `` `t `` into TAB, `` `n `` into LF, `` `r `` into CR,
        // `` `b `` into backspace, ... and leaves the stray `\` behind.
        expect(sanitizeText('a \\\tb')).toBe('a tb');
        expect(sanitizeText('\\\npx dbx')).toBe('npx dbx');
        expect(sanitizeText('\\\resolveVite')).toBe('resolveVite');
        expect(sanitizeText('\\\bootstrap')).toBe('bootstrap');
        expect(sanitizeText('\\\u000bp run')).toBe('vp run');
    });

    it('restores bare control characters but keeps tab/newline/CR', () => {
        expect(stripControlChars('\u0007ny, \u000calse')).toBe('any, false');
        expect(stripControlChars('a\tb\nc\rd')).toBe('a\tb\nc\rd');
        expect(stripControlChars('a\u0001b')).toBe('ab');
    });

    it('detects shell-escape artifacts', () => {
        expect(hasEscapeArtifacts('\u0007ny')).toBe(true);
        expect(hasEscapeArtifacts('\\\tb')).toBe(true);
        expect(hasEscapeArtifacts('clean text')).toBe(false);
        expect(hasEscapeArtifacts('a\tb\nc')).toBe(false);
    });

    it('leaves ordinary backslashes alone (paths, regex)', () => {
        expect(stripEscapeArtifacts('C:\\Users\\me\\file.txt')).toBe('C:\\Users\\me\\file.txt');
        expect(sanitizeText('match \\d+ or \\w')).toBe('match \\d+ or \\w');
    });

    it('normalizes CRLF and lone CR to LF', () => {
        expect(sanitizeText('a\r\nb\rc')).toBe('a\nb\nc');
    });

    it('is a no-op on clean text', () => {
        expect(sanitizeText('Use `dbx sync` in `package.json`.')).toBe(
            'Use `dbx sync` in `package.json`.'
        );
    });
});
