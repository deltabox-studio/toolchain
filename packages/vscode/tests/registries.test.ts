import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vite-plus/test';

vi.mock('vscode', () => ({
    EventEmitter: class {
        event = () => () => {};
        fire(): void {}
    },
    TreeItem: class {
        description?: string;
        tooltip?: string;
        iconPath?: unknown;
        contextValue?: string;
        command?: unknown;
        constructor(
            public label: unknown,
            public collapsibleState?: unknown
        ) {}
    },
    ThemeIcon: class {
        constructor(public id: string) {}
    },
    TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
}));

vi.mock('../src/cli.js', () => ({
    captureCli: vi.fn(async () => ({
        code: 0,
        stdout: JSON.stringify({
            templates: [
                {
                    path: path.join(os.homedir(), 'shared-templates'),
                    scope: 'global',
                    remote: false,
                    kind: 'templates',
                },
            ],
            providers: [],
        }),
        stderr: '',
    })),
}));

import { RegistryTreeProvider } from '../src/registries.js';

describe('RegistryTreeProvider', () => {
    it('sanitizes system paths in the Registries view', async () => {
        const provider = new RegistryTreeProvider(() => process.cwd());
        await provider.refresh();
        const templatesRoot = provider.getChildren()[1]!;
        const entry = provider.getChildren(templatesRoot)[0]!;
        const item = provider.getTreeItem(entry);
        expect(item.label).toBe('~/shared-templates');
        expect(String(item.label)).not.toContain(os.homedir());
        expect(item.tooltip).toContain('~/shared-templates');
    });
});
