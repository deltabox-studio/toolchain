import { describe, expect, it } from 'vitest';

import { extractConfigSelection } from '../src/cli/config-selection.js';

const passthrough = (name: string): boolean => name === 'vite' || name.startsWith('vite:');

describe('extractConfigSelection', () => {
    it('extracts config flags before and after a normal subcommand', () => {
        expect(extractConfigSelection(['node', 'dbx', '--config', 'a.ts', 'sync'])).toEqual({
            argv: ['node', 'dbx', 'sync'],
            selection: { config: 'a.ts' },
        });
        expect(extractConfigSelection(['node', 'dbx', 'sync', '--no-config'])).toEqual({
            argv: ['node', 'dbx', 'sync'],
            selection: { noConfig: true },
        });
    });

    it('leaves config flags after a provider passthrough untouched', () => {
        expect(
            extractConfigSelection(
                ['node', 'dbx', 'vite', 'build', '--config', 'vite.custom.ts'],
                passthrough
            )
        ).toEqual({
            argv: ['node', 'dbx', 'vite', 'build', '--config', 'vite.custom.ts'],
            selection: {},
        });
        expect(
            extractConfigSelection(
                ['node', 'dbx', '--config', 'dbx.ts', 'vite', '--no-config'],
                passthrough
            )
        ).toEqual({
            argv: ['node', 'dbx', 'vite', '--no-config'],
            selection: { config: 'dbx.ts' },
        });
    });

    it('stops at a literal -- separator', () => {
        expect(extractConfigSelection(['node', 'dbx', 'vite', '--', '--config', 'x'])).toEqual({
            argv: ['node', 'dbx', 'vite', '--', '--config', 'x'],
            selection: {},
        });
    });

    it('works when argv has no node/script prefix', () => {
        expect(extractConfigSelection(['sync', '--no-config'])).toEqual({
            argv: ['sync'],
            selection: { noConfig: true },
        });
        expect(extractConfigSelection(['vite', 'build', '--config', 'x'], passthrough)).toEqual({
            argv: ['vite', 'build', '--config', 'x'],
            selection: {},
        });
    });
});

describe('extractConfigSelection reset flags', () => {
    it('leaves `reset --config` and `--all` for the reset command', () => {
        expect(extractConfigSelection(['node', 'dbx', 'reset', '--config'])).toEqual({
            argv: ['node', 'dbx', 'reset', '--config'],
            selection: {},
        });
        expect(extractConfigSelection(['node', 'dbx', 'reset', '--config', '--all'])).toEqual({
            argv: ['node', 'dbx', 'reset', '--config', '--all'],
            selection: {},
        });
    });

    it('still treats a global --config before reset as a file selector', () => {
        expect(
            extractConfigSelection(['node', 'dbx', '--config', 'dbx.custom.ts', 'reset'])
        ).toEqual({
            argv: ['node', 'dbx', 'reset'],
            selection: { config: 'dbx.custom.ts' },
        });
    });
});
