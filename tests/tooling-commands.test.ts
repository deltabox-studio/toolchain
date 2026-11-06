import { describe, expect, it } from 'vitest';

import { buildToolArgs } from '../src/cli/tooling-commands.js';

describe('buildToolArgs', () => {
    it('maps fmt modes and paths for Prettier', () => {
        expect(buildToolArgs('fmt', 'prettier', [])).toEqual(['--write', '.']);
        expect(buildToolArgs('fmt', 'prettier', ['--check'])).toEqual(['--check', '.']);
        expect(buildToolArgs('fmt', 'prettier', ['--check', 'src'])).toEqual(['--check', 'src']);
        expect(buildToolArgs('fmt', 'prettier', ['--write', 'a.ts'])).toEqual(['--write', 'a.ts']);
    });

    it('maps fmt modes for Biome and Dprint', () => {
        expect(buildToolArgs('fmt', 'biome', [])).toEqual(['format', '--write', '.']);
        expect(buildToolArgs('fmt', 'biome', ['--check', 'src'])).toEqual(['format', 'src']);
        expect(buildToolArgs('fmt', 'dprint', [])).toEqual(['fmt', '.']);
        expect(buildToolArgs('fmt', 'dprint', ['--check'])).toEqual(['check', '.']);
    });

    it('maps lint modes for ESLint and Biome', () => {
        expect(buildToolArgs('lint', 'eslint', [])).toEqual(['.']);
        expect(buildToolArgs('lint', 'eslint', ['--fix', 'src'])).toEqual(['--fix', 'src']);
        expect(buildToolArgs('lint', 'biome', [])).toEqual(['lint', '.']);
        expect(buildToolArgs('lint', 'biome', ['--fix', 'src'])).toEqual([
            'lint',
            '--write',
            'src',
        ]);
    });

    it('leaves Oxc operands untouched', () => {
        expect(buildToolArgs('fmt', 'oxc', ['--check', 'src'])).toEqual(['--check', 'src']);
        expect(buildToolArgs('lint', 'oxc', ['--fix', 'src'])).toEqual(['--fix', 'src']);
    });

    it('does not mistake a flag value for a path', () => {
        expect(buildToolArgs('fmt', 'prettier', ['--ignore-path', '.gitignore'])).toEqual([
            '--write',
            '--ignore-path',
            '.gitignore',
            '.',
        ]);
    });
});
