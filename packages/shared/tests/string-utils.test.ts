import { describe, expect, it } from 'vitest';

import { sanitizeText, stripControlChars, stripEscapeArtifacts } from '../src/index.js';

describe('sanitizeText', () => {
    it('removes a backslash left before a control character (shell escape artifact)', () => {
        // `\` + TAB and `\` + LF, as a shell produces for an escaped backtick.
        expect(sanitizeText('a \\\tb')).toBe('a b');
        expect(sanitizeText('run\\\nDbx')).toBe('runDbx');
    });

    it('strips bare control characters but keeps tab/newline/CR', () => {
        expect(stripControlChars('a\u0008b\u000bc\u000cd')).toBe('abcd');
        expect(stripControlChars('a\tb\nc\rd')).toBe('a\tb\nc\rd');
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
