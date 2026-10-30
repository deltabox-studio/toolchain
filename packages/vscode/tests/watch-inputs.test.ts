import { describe, expect, it } from 'vitest';

import {
    DEFAULT_TSCONFIG_FILES,
    defaultWatchInputs,
    parseWatchInputs,
    planWatchTargets,
} from '../src/watch-inputs.js';

describe('watch inputs', () => {
    it('falls back to the default inputs and tsconfig names', () => {
        expect(defaultWatchInputs()).toEqual({
            globs: ['**/dbx.config.*', 'tsconfig.workspaces.json', '**/tsconfig.default.json'],
            tsconfig: DEFAULT_TSCONFIG_FILES,
        });
    });

    it('parses the CLI report with custom names', () => {
        const inputs = parseWatchInputs(
            JSON.stringify({
                globs: ['**/dbx.config.*', 'tsconfig.graph.json', '**/tsconfig.src.json'],
                tsconfig: { rootFile: 'tsconfig.graph.json', defaultFile: 'tsconfig.src.json' },
            })
        );
        expect(inputs).toEqual({
            globs: ['**/dbx.config.*', 'tsconfig.graph.json', '**/tsconfig.src.json'],
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

    it('watches each root relative to itself unless the user set globs', () => {
        const custom = parseWatchInputs(
            JSON.stringify({ globs: ['**/dbx.config.*', '**/tsconfig.src.json'] })
        )!;
        const roots = [
            { root: '/repo/a', inputs: defaultWatchInputs() },
            { root: '/repo/b', inputs: custom },
        ];
        expect(planWatchTargets(undefined, roots)).toEqual([
            { glob: '**/dbx.config.*', base: '/repo/a' },
            { glob: 'tsconfig.workspaces.json', base: '/repo/a' },
            { glob: '**/tsconfig.default.json', base: '/repo/a' },
            { glob: '**/dbx.config.*', base: '/repo/b' },
            { glob: '**/tsconfig.src.json', base: '/repo/b' },
        ]);
        // An explicit setting (even an empty one) replaces the resolved inputs.
        expect(planWatchTargets(['**/x.json', '**/x.json'], roots)).toEqual([
            { glob: '**/x.json' },
        ]);
        expect(planWatchTargets([], roots)).toEqual([]);
    });
});
