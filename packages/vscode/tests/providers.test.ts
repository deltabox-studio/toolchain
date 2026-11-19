import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

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

import {
    providerRegistryPath,
    ProviderTreeProvider,
    readProviderRegistry,
} from '../src/providers.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-vscode-providers-'));
    dirs.push(dir);
    return dir;
}

function writeRegistry(root: string, providers: unknown): void {
    const file = providerRegistryPath(root);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(providers));
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('readProviderRegistry', () => {
    it('normalizes hand-written descriptors so the Providers view cannot crash', () => {
        const root = tmp();
        writeRegistry(root, [
            // No `commands`: the view iterates it unconditionally.
            { id: 'loose', name: 'Loose' },
            // Junk commands are dropped; a valid one is kept.
            {
                id: 'typed',
                commands: [
                    { description: 'Missing a name' },
                    { name: 'typed:run', subcommand: 'run', description: 'Run it' },
                ],
            },
            // An entry without an id cannot be addressed, so it is dropped.
            { name: 'No id' },
        ]);

        const providers = readProviderRegistry(root);
        expect(providers.map(provider => provider.id)).toEqual(['loose', 'typed']);
        expect(providers[0]).toMatchObject({ id: 'loose', name: 'Loose', commands: [] });
        expect(providers[1]?.commands).toEqual([
            { name: 'typed:run', subcommand: 'run', description: 'Run it' },
        ]);

        const tree = new ProviderTreeProvider(() => root);
        const items = providers.map(provider =>
            tree.getTreeItem({ kind: 'provider', provider, custom: true, root })
        );
        expect(items).toHaveLength(2);
    });
});
