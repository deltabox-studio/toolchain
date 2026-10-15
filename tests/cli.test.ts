import { describe, expect, it } from 'vitest';

import { builtinCommands, createCli } from '../src/cli/index.js';
import {
    applyReplacementsDeep,
    camelCase,
    deepMerge,
    kebabCase,
    pascalCase,
    sort,
} from '../src/index.js';

describe('root API re-exports', () => {
    it('exposes shared helpers from the root', () => {
        expect(camelCase('foo bar')).toBe('fooBar');
        expect(kebabCase('fooBar')).toBe('foo-bar');
        expect(pascalCase('foo bar')).toBe('FooBar');
        expect(sort({ b: 1, a: 2 })).toEqual({ a: 2, b: 1 });
        expect(deepMerge({ a: { b: 1 } } as any, { a: { c: 2 } })).toEqual({ a: { b: 1, c: 2 } });
        expect(applyReplacementsDeep('{{x}}', { x: 'y' })).toBe('y');
    });
});

describe('dbx CLI', () => {
    it('registers the built-in commands', () => {
        const names = builtinCommands().map(c => c.name);
        expect(names).toContain('projects');
        expect(names).toContain('sync');
        expect(names).toContain('watch');
        expect(names).toContain('tsconfig');
        expect(names).toContain('cleanup');
        expect(names).toContain('cleanup:turbo');
        expect(names).toContain('changelog');
        expect(names).toContain('project:init');
    });

    it('builds a program with the expected subcommands', () => {
        const program = createCli();
        const registered = program.commands.map(c => c.name());
        expect(registered).toEqual(
            expect.arrayContaining([
                'projects',
                'sync',
                'watch',
                'tsconfig',
                'cleanup',
                'cleanup:turbo',
                'changelog',
            ])
        );
        expect(program.name()).toBe('dbx');
    });
});
