import { describe, expect, it } from 'vitest';

import { escapeCmdArgument, isCmdShim, windowsShimCommand } from '../src/win-spawn.js';

/** True when a cmd metacharacter is left unescaped (not preceded by `^`). */
function hasUnescapedMeta(value: string): boolean {
    return /(^|[^^])[&|%!]/.test(value);
}

describe('win-spawn', () => {
    it('detects .cmd/.bat shims (case-insensitively)', () => {
        expect(isCmdShim('npx.cmd')).toBe(true);
        expect(isCmdShim('C:\\tools\\foo.BAT')).toBe(true);
        expect(isCmdShim('node.exe')).toBe(false);
        expect(isCmdShim('/usr/local/bin/dbx')).toBe(false);
    });

    it('wraps in quotes and caret-escapes cmd metacharacters', () => {
        // The `&` (and the wrapping quotes) are caret-escaped.
        expect(escapeCmdArgument('a&b', false)).toBe('^"a^&b^"');
    });

    it('escapes twice for a .cmd shim (its second cmd.exe parse pass)', () => {
        const single = escapeCmdArgument('a&b', false);
        const double = escapeCmdArgument('a&b', true);
        expect(double).not.toBe(single);
        // `&` is escaped, that caret is escaped again, and so are the quotes.
        expect(double).toBe('^^^"a^^^&b^^^"');
    });

    it('never leaves an unescaped metacharacter (no injectable argv)', () => {
        const values = ['a&b', 'a|b', '100%', 'a!b', 'C:\\Program Files\\x', '@scope/pkg'];
        for (const value of values) {
            expect(hasUnescapedMeta(escapeCmdArgument(value, false))).toBe(false);
            expect(hasUnescapedMeta(escapeCmdArgument(value, true))).toBe(false);
        }
    });

    it('builds the shim line with every argument escaped', () => {
        const line = windowsShimCommand('npx.cmd', ['--yes', '@deltabox/toolchain']);
        expect(line.startsWith('npx.cmd ')).toBe(true);
        expect(line).toContain('^^^"--yes^^^"');
        expect(line).toContain('^^^"@deltabox/toolchain^^^"');
    });
});
