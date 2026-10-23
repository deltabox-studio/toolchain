import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
    collectGitignorePatterns,
    DEFAULT_IGNORE_PATTERNS,
    isIgnoredPath,
    resolveIgnorePatterns,
} from '../src/ignore.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-ignore-'));
}

describe('isIgnoredPath', () => {
    it('matches the default ignored paths', () => {
        expect(isIgnoredPath('node_modules/foo/index.js', DEFAULT_IGNORE_PATTERNS)).toBe(true);
        expect(isIgnoredPath('packages/app/dist/index.js', DEFAULT_IGNORE_PATTERNS)).toBe(true);
        expect(isIgnoredPath('packages/app/dist', DEFAULT_IGNORE_PATTERNS)).toBe(true);
        expect(isIgnoredPath('.dbx/toolchain/manifest.json', DEFAULT_IGNORE_PATTERNS)).toBe(true);
        expect(isIgnoredPath('packages/app/src/index.ts', DEFAULT_IGNORE_PATTERNS)).toBe(false);
    });

    it('matches an explicit exclude glob', () => {
        expect(isIgnoredPath('packages/legacy/index.ts', ['**/legacy/**'])).toBe(true);
        expect(isIgnoredPath('packages/app/index.ts', ['**/legacy/**'])).toBe(false);
    });
});

describe('collectGitignorePatterns', () => {
    it('converts root + nested gitignore patterns, scoped like git', () => {
        const cwd = tmp();
        fs.writeFileSync(
            path.join(cwd, '.gitignore'),
            ['# comment', 'node_modules/', '/generated', '*.log', '!keep.log', ''].join('\n')
        );
        fs.mkdirSync(path.join(cwd, 'packages', 'app'), { recursive: true });
        fs.writeFileSync(path.join(cwd, 'packages', 'app', '.gitignore'), 'dist/\n');

        const patterns = collectGitignorePatterns(cwd);
        // Non-anchored dir → any depth; contents included.
        expect(patterns).toContain('**/node_modules');
        expect(patterns).toContain('**/node_modules/**');
        // Anchored → relative to the gitignore dir.
        expect(patterns).toContain('generated');
        expect(patterns).toContain('generated/**');
        // Nested → scoped to its directory.
        expect(patterns).toContain('packages/app/**/dist');
        // Negations are skipped.
        expect(patterns.some(p => p.includes('keep.log'))).toBe(false);

        expect(isIgnoredPath('packages/app/dist/index.js', patterns)).toBe(true);
        expect(isIgnoredPath('packages/app/src/index.ts', patterns)).toBe(false);
        expect(isIgnoredPath('generated/x.ts', patterns)).toBe(true);
        // `generated` is anchored, so a nested one is not ignored.
        expect(isIgnoredPath('packages/generated/x.ts', patterns)).toBe(false);
    });

    it('does not follow a self-referential symlink (no runaway walk)', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, '.gitignore'), 'dist/\n');
        fs.mkdirSync(path.join(cwd, 'packages'), { recursive: true });
        try {
            fs.symlinkSync(
                cwd,
                path.join(cwd, 'packages', 'self'),
                process.platform === 'win32' ? 'junction' : 'dir'
            );
        } catch {
            return; // symlinks unavailable in this environment
        }

        const patterns = collectGitignorePatterns(cwd);
        expect(patterns).toContain('**/dist/**');
        // The link is not followed, so no pattern is scoped under `self/`.
        expect(patterns.some(p => p.includes('self'))).toBe(false);
    });
});

describe('resolveIgnorePatterns', () => {
    it('combines defaults, exclude and (optionally) gitignore', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, '.gitignore'), 'custom/\n');

        const withGit = resolveIgnorePatterns(cwd, { exclude: '**/skip/**' });
        expect(withGit).toContain('**/node_modules/**');
        expect(withGit).toContain('**/skip/**');
        expect(withGit).toContain('**/custom/**');

        const withoutGit = resolveIgnorePatterns(cwd, { exclude: '**/skip/**', gitignore: false });
        expect(withoutGit).not.toContain('**/custom/**');
    });
});
