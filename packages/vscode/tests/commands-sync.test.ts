import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

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
        plugin: false,
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

    it('syncs every managed project through the recursive pass', async () => {
        mocks.projects = [project('/repo/packages/a', true), project('/repo/packages/b', false)];
        const runRoots = vi.fn(async () => [0]);
        const runProjects = vi.fn(async () => [0]);
        const commands = createSyncCommands(deps({ runRoots, runProjects }));

        await commands.syncAll();

        expect(runRoots).toHaveBeenCalledWith(['sync', '--recursive']);
        // Configless projects are handled by the CLI (only when opted in), not
        // by a separate extension-side pass.
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
