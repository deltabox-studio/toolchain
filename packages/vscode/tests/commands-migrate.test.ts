import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { Project } from '../src/projects.js';

const mocks = vi.hoisted(() => ({
    projects: [] as Project[],
    quickPick: vi.fn(),
}));

vi.mock('vscode', () => ({
    window: {
        showInformationMessage: vi.fn(),
        showWarningMessage: vi.fn(async () => 'Migrate'),
        showQuickPick: mocks.quickPick,
    },
}));

vi.mock('../src/projects.js', async importOriginal => {
    const actual = await importOriginal<typeof import('../src/projects.js')>();
    return { ...actual, discoverProjects: () => mocks.projects };
});

const { createMigrateCommand } = await import('../src/commands/migrate.js');

function project(dir: string, label: string): Project {
    return {
        kind: 'project',
        dir,
        label,
        relativePath: label,
        type: 'project',
        hasConfig: true,
        plugin: false,
        dependencies: [],
        trackedFiles: 0,
    };
}

describe('createMigrateCommand', () => {
    beforeEach(() => {
        mocks.projects = [project('/repo/packages/a', 'a')];
        mocks.quickPick.mockReset();
    });

    it('asks which project to migrate and runs there', async () => {
        mocks.quickPick
            .mockResolvedValueOnce({ label: 'a', dir: '/repo/packages/a' })
            .mockResolvedValueOnce({ label: 'Biome', value: 'biome', description: '' });
        const runCli = vi.fn(async () => 0);
        const refreshGraph = vi.fn(async () => {});
        const command = createMigrateCommand({
            output: { show: vi.fn() } as never,
            runCli,
            captureCli: vi.fn(),
            workspaceRoots: () => ['/repo'],
            refreshGraph,
            refreshViews: vi.fn(),
            runRoots: vi.fn(),
            runProjects: vi.fn(),
            selectedProjects: () => [],
            section: 'deltabox.toolchain',
        } as never);

        await command();

        expect(mocks.quickPick).toHaveBeenNthCalledWith(
            1,
            expect.arrayContaining([
                expect.objectContaining({ label: 'Repository root', dir: '/repo' }),
                expect.objectContaining({ label: 'a', dir: '/repo/packages/a' }),
            ]),
            expect.objectContaining({ placeHolder: expect.stringContaining('which project') })
        );
        expect(runCli).toHaveBeenCalledWith('/repo/packages/a', [
            'migrate',
            '--cwd',
            '/repo/packages/a',
            '--write',
            '--from',
            'biome',
        ]);
        expect(refreshGraph).toHaveBeenCalled();
    });

    it('skips the picker when a target is passed programmatically', async () => {
        mocks.quickPick.mockResolvedValueOnce({ label: 'Biome', value: 'biome', description: '' });
        const runCli = vi.fn(async () => 0);
        const command = createMigrateCommand({
            output: { show: vi.fn() } as never,
            runCli,
            captureCli: vi.fn(),
            workspaceRoots: () => ['/repo'],
            refreshGraph: vi.fn(async () => {}),
            refreshViews: vi.fn(),
            runRoots: vi.fn(),
            runProjects: vi.fn(),
            selectedProjects: () => [],
            section: 'deltabox.toolchain',
        } as never);

        await command('/repo/packages/a');

        expect(mocks.quickPick).toHaveBeenCalledTimes(1);
        expect(runCli).toHaveBeenCalledWith(
            '/repo/packages/a',
            expect.arrayContaining(['migrate', '--cwd', '/repo/packages/a'])
        );
    });
});
