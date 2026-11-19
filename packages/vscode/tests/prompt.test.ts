import { describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
    executeCommand: vi.fn(async () => undefined),
}));

vi.mock('vscode', () => ({
    commands: { executeCommand: mocks.executeCommand },
    window: { showWarningMessage: vi.fn() },
}));

import { groupedActions } from '../src/actions.js';
import {
    executePromptAction,
    pickPaged,
    promptArguments,
    type PromptHost,
    type PromptItem,
} from '../src/prompt.js';

type Pick = PromptItem<unknown> | { label: string; navigation: { type: string; page?: number } };

function host(responses: unknown[]): PromptHost & { picks: Pick[][]; inputs: string[] } {
    const picks: Pick[][] = [];
    const inputs: string[] = [];
    return {
        picks,
        inputs,
        pick: async items => {
            picks.push(items as Pick[]);
            return responses.shift();
        },
        input: async () => {
            const value = responses.shift() as string | undefined;
            if (value !== undefined) inputs.push(value);
            return value;
        },
        confirm: async () => responses.shift() as boolean | undefined,
    };
}

const items = Array.from({ length: 12 }, (_, index) => ({
    label: `Action ${index + 1}`,
    value: index + 1,
}));

describe('paged prompts', () => {
    it('puts navigation items before the page choices', async () => {
        const fake = host([
            { label: 'Next page', navigation: { type: 'next', page: 1 } },
            { label: 'Action 9', value: 9 },
        ]);
        const value = await pickPaged(fake, 'Actions', items, 0, 8);
        expect(value).toBe(9);
        expect(fake.picks[0]!.map(item => item.label)).toEqual([
            'Next page (1/2)',
            'Action 1',
            'Action 2',
            'Action 3',
            'Action 4',
            'Action 5',
            'Action 6',
            'Action 7',
            'Action 8',
        ]);
        expect(fake.picks[1]!.map(item => item.label)).toEqual([
            'Go back',
            'Action 9',
            'Action 10',
            'Action 11',
            'Action 12',
        ]);
    });

    it('goes back to the previous page', async () => {
        const fake = host([
            { label: 'Next page', navigation: { type: 'next', page: 1 } },
            { label: 'Go back', navigation: { type: 'back' } },
            { label: 'Action 2', value: 2 },
        ]);
        expect(await pickPaged(fake, 'Actions', items, 0, 8)).toBe(2);
    });
});

describe('arguments', () => {
    it('prompts string, boolean and choice arguments', async () => {
        const fake = host(['my-app', true, { label: 'B', value: 'b' }]);
        const values = await promptArguments(fake, [
            { name: 'name', description: 'Name', type: 'string', required: true },
            { name: 'install', description: 'Install?', type: 'boolean' },
            {
                name: 'kind',
                description: 'Kind',
                type: 'choice',
                choices: [
                    { label: 'A', value: 'a' },
                    { label: 'B', value: 'b' },
                ],
            },
        ]);
        expect(values).toEqual({ name: 'my-app', install: true, kind: 'b' });
    });
});

describe('executing actions', () => {
    it('invokes a no-argument command with exactly one argument', async () => {
        mocks.executeCommand.mockClear();
        const executed = await executePromptAction(host([]), {
            id: 'tools.refresh',
            label: 'Refresh projects',
            group: 'Tools',
            command: 'deltabox.toolchain.refresh',
        });

        expect(executed).toBe(true);
        expect(mocks.executeCommand).toHaveBeenCalledTimes(1);
        // A bare `{}` would be read by the handler as a project node / cwd.
        expect(mocks.executeCommand.mock.calls[0]).toHaveLength(1);
        expect(mocks.executeCommand).toHaveBeenCalledWith('deltabox.toolchain.refresh');
    });

    it('forwards prompted values when the action declares arguments', async () => {
        mocks.executeCommand.mockClear();
        await executePromptAction(host(['my-app']), {
            id: 'project.init',
            label: 'Initialize project',
            group: 'Project',
            command: 'deltabox.toolchain.projectInit',
            arguments: [{ name: 'name', description: 'Name', type: 'string', required: true }],
        });

        expect(mocks.executeCommand).toHaveBeenCalledWith('deltabox.toolchain.projectInit', {
            name: 'my-app',
        });
    });
});

describe('action groups', () => {
    it('sorts groups and actions ascending', () => {
        const groups = groupedActions();
        const names = groups.map(group => group.group);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        for (const group of groups) {
            const labels = group.actions.map(action => action.label);
            expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
        }
    });
});
