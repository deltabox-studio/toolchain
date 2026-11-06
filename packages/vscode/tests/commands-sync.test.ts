import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Project } from '../src/projects.js';

const mocks = vi.hoisted(() => ({ projects: [] as Project[] }));

vi.mock('vscode', () => ({
    window: {
        showInformationMessage: vi.fn(),
        showWarningMessage: vi.fn(),
        showQuickPick: vi.fn(),
    },
    commands: { executeCommand: vi.fn() },
}));

vi.mock('../src/projects.js', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/projects.js')>();
    return { ...actual, discoverProjects: () => mocks.projects };
});

const { createSyncCommands } = await import('../src/commands/sync.js');

function project(dir: string, hasConfig: boolean): Project {
    return {
        kind: 'project',
        dir,
        label: dir,
        relativePath: dir,
        type: 'project',
        hasConfig,
        dependencies: [],
        trackedFiles: 0,
    };
}

function deps(overrides: Record<string, unknown> = {}): Parameters<typeof createSyncCommands>[0] {
    return {
        output: { show: vi.fn() } as never,
        runCli: vi.fn(async () => 0),
        captureCli: vi.fn(async () => ({ code: 0, stdout: '', stderr: '' })),
        workspaceRoots: () => ['/repo'],
        refreshGraph: vi.fn(async () => {}),
        refreshViews: vi.fn(),
        runRoots: vi.fn(async () => [0]),
        runProjects: vi.fn(async () => [0]),
        selectedProjects: () => [],
        section: 'deltabox.toolchain',
        ...overrides,
    } as never;
}

describe('createSyncCommands', () => {
    beforeEach(() => {
        mocks.projects = [];
    });

    it('syncs configless projects after the recursive pass', async () => {
        mocks.projects = [project('/repo/packages/a', false)];
        const runRoots = vi.fn(async () => [0]);
        const runProjects = vi.fn(async () => [0]);
        const commands = createSyncCommands(deps({ runRoots, runProjects }));

        await commands.syncAll();

        expect(runRoots).toHaveBeenCalledWith(['sync', '--recursive']);
        expect(runProjects).toHaveBeenCalledWith(mocks.projects, ['sync']);
    });

    it('does not run the configless pass when every project has a config', async () => {
        mocks.projects = [project('/repo/packages/a', true)];
        const runProjects = vi.fn(async () => [0]);
        const commands = createSyncCommands(deps({ runProjects }));

        await commands.syncAll();

        expect(runProjects).not.toHaveBeenCalled();
    });

    it('warns when syncSelected has no selection', async () => {
        const commands = createSyncCommands(deps());
        await commands.syncSelected();
        const { window } = await import('vscode');
        expect(window.showInformationMessage).toHaveBeenCalledWith(
            'Select one or more projects in the Projects view first.'
        );
    });
});
