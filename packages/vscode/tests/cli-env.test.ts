import { describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ enabled: true }));

vi.mock('vscode', () => ({
    workspace: {
        getConfiguration: () => ({
            get: (key: string, fallback: unknown) =>
                key === 'enableFormatImportGroupDefaults' ? state.enabled : fallback,
        }),
    },
}));

import { formatImportGroupDefaultsEnv } from '../src/cli.js';

describe('formatImportGroupDefaultsEnv', () => {
    it('enables the CLI env var when the setting is on', () => {
        state.enabled = true;
        expect(formatImportGroupDefaultsEnv()).toEqual({
            DBX_ENABLE_FORMAT_IMPORT_GROUP_DEFAULTS: '1',
        });
    });

    it('disables the CLI env var when the setting is off', () => {
        state.enabled = false;
        expect(formatImportGroupDefaultsEnv()).toEqual({
            DBX_ENABLE_FORMAT_IMPORT_GROUP_DEFAULTS: '0',
        });
    });
});
