import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
    DEFAULT_TSCONFIG_FILES,
    defaultWatchInputs,
    isSafeRelativeGlob,
    parseWatchInputs,
    planWatchTargets,
} from '../src/watch-inputs.js';

describe('watch inputs', () => {
    it('falls back to the default inputs and tsconfig names', () => {
        expect(defaultWatchInputs()).toEqual({
            globs: ['dbx.config.*', 'tsconfig.workspaces.json', 'tsconfig.default.json'],
            tsconfig: DEFAULT_TSCONFIG_FILES,
        });
    });

    it('parses the CLI report with custom names', () => {
        const inputs = parseWatchInputs(
            JSON.stringify({
                globs: ['dbx.config.*', 'tsconfig.graph.json', 'tsconfig.src.json'],
                tsconfig: { rootFile: 'tsconfig.graph.json', defaultFile: 'tsconfig.src.json' },
            })
        );
        expect(inputs).toEqual({
            globs: ['dbx.config.*', 'tsconfig.graph.json', 'tsconfig.src.json'],
            tsconfig: {
                ...DEFAULT_TSCONFIG_FILES,
                rootFile: 'tsconfig.graph.json',
                defaultFile: 'tsconfig.src.json',
            },
        });
    });

    it('rejects output that is not a watch report', () => {
        expect(parseWatchInputs('error: unknown option --list')).toBeUndefined();
        expect(parseWatchInputs('[]')).toBeUndefined();
        expect(parseWatchInputs(JSON.stringify({ globs: [1] }))).toBeUndefined();
    });

    it('scopes each resolved root input to its own root', () => {
        const custom = parseWatchInputs(
            JSON.stringify({ globs: ['dbx.config.*', 'tsconfig.src.json'] })
        )!;
        const roots = [
            { root: '/repo/a', inputs: defaultWatchInputs() },
            { root: '/repo/b', inputs: custom },
        ];
        expect(planWatchTargets(undefined, roots)).toEqual([
            { glob: 'dbx.config.*', base: '/repo/a', root: '/repo/a' },
            { glob: 'tsconfig.workspaces.json', base: '/repo/a', root: '/repo/a' },
            { glob: 'tsconfig.default.json', base: '/repo/a', root: '/repo/a' },
            { glob: 'dbx.config.*', base: '/repo/b', root: '/repo/b' },
            { glob: 'tsconfig.src.json', base: '/repo/b', root: '/repo/b' },
        ]);
        // An explicit setting (even an empty one) replaces the resolved inputs.
        expect(planWatchTargets(['**/x.json', '**/x.json'], roots)).toEqual([
            { glob: '**/x.json' },
        ]);
        expect(planWatchTargets([], roots)).toEqual([]);
    });

    it('watches a concrete nested file from its own directory (non-recursive)', () => {
        const roots = [
            {
                root: '/repo/a',
                inputs: {
                    globs: ['apps/web/dbx.config.ts', 'packages/ui/tsconfig.default.json'],
                    tsconfig: DEFAULT_TSCONFIG_FILES,
                },
            },
        ];
        expect(planWatchTargets(undefined, roots)).toEqual([
            {
                glob: 'dbx.config.ts',
                base: path.join('/repo/a', 'apps/web'),
                root: '/repo/a',
            },
            {
                glob: 'tsconfig.default.json',
                base: path.join('/repo/a', 'packages/ui'),
                root: '/repo/a',
            },
        ]);
    });

    it('drops absolute and ancestor globs so watchers stay inside the workspace', () => {
        expect(isSafeRelativeGlob('dbx.config.*')).toBe(true);
        expect(isSafeRelativeGlob('**/tsconfig.default.json')).toBe(true);
        expect(isSafeRelativeGlob('../repo/**/*')).toBe(false);
        expect(isSafeRelativeGlob('apps/../../repo/**/*')).toBe(false);
        expect(isSafeRelativeGlob('/abs/**/*')).toBe(false);
        expect(isSafeRelativeGlob('C:\\repo\\**\\*')).toBe(false);
        expect(isSafeRelativeGlob('\\\\server\\share\\**')).toBe(false);

        const roots = [
            {
                root: '/repo/a',
                inputs: {
                    globs: ['dbx.config.*', '../repo/**/*', 'C:\\repo\\**'],
                    tsconfig: DEFAULT_TSCONFIG_FILES,
                },
            },
        ];
        expect(planWatchTargets(undefined, roots)).toEqual([
            { glob: 'dbx.config.*', base: '/repo/a', root: '/repo/a' },
        ]);
        expect(planWatchTargets(['../repo/**/*', 'dbx.config.*'], roots)).toEqual([
            { glob: 'dbx.config.*' },
        ]);
    });
});
