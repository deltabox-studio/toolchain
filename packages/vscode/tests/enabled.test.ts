import { describe, expect, it } from 'vite-plus/test';

import { resolveEnabledState, toggleLabel } from '../src/enabled.js';
import { parseHomeAction } from '../src/home-view.js';

describe('resolveEnabledState', () => {
    it('falls back to the workspace VS Code setting', () => {
        expect(resolveEnabledState(undefined, { workspaceValue: false })).toEqual({
            enabled: false,
            globalEnabled: true,
            workspaceEnabled: false,
            source: 'setting',
        });
    });

    it('reads global and workspace values independently', () => {
        const state = resolveEnabledState(undefined, {
            globalValue: false,
            workspaceValue: true,
        });
        expect(state.globalEnabled).toBe(false);
        expect(state.workspaceEnabled).toBe(true);
        expect(toggleLabel('global', state.globalEnabled)).toBe('Enable (global)');
        expect(toggleLabel('workspace', state.workspaceEnabled)).toBe('Disable (workspace)');
    });

    it('prefers the resolved toolchain config over the VS Code setting', () => {
        expect(
            resolveEnabledState(
                { enabled: { scope: 'workspace', disabled: true } },
                {
                    workspaceValue: true,
                }
            )
        ).toMatchObject({ enabled: false, source: 'config', workspaceEnabled: true });
    });

    it('supports the boolean shorthand and global config scope', () => {
        expect(resolveEnabledState({ enabled: false }, undefined)).toMatchObject({
            enabled: false,
            source: 'config',
        });
        expect(
            resolveEnabledState(
                { enabled: { scope: 'global', disabled: false } },
                {
                    globalValue: false,
                }
            )
        ).toMatchObject({ enabled: true, source: 'config', globalEnabled: false });
    });

    it('uses the workspace folder value over workspace/global', () => {
        expect(
            resolveEnabledState(undefined, {
                globalValue: true,
                workspaceValue: true,
                workspaceFolderValue: false,
            })
        ).toMatchObject({ enabled: false, workspaceEnabled: false });
    });
});

describe('home enabled actions', () => {
    it('accepts the scope-aware toggle actions', () => {
        expect(parseHomeAction({ type: 'toggleGlobal' })).toEqual({ type: 'toggleGlobal' });
        expect(parseHomeAction({ type: 'toggleWorkspace' })).toEqual({
            type: 'toggleWorkspace',
        });
    });
});
