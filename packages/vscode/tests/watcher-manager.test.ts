import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_TSCONFIG_FILES, type WatchInputs } from '../src/watch-inputs.js';
import { WatcherManager } from '../src/watcher-manager.js';

type Handler = (uri: { fsPath: string }) => void;

interface MockWatcher {
    pattern: unknown;
    handlers: Record<string, Handler>;
    dispose: () => void;
    onDidChange: (handler: Handler) => void;
    onDidCreate: (handler: Handler) => void;
    onDidDelete: (handler: Handler) => void;
}

const mocks = vi.hoisted(() => ({ watchers: [] as MockWatcher[] }));

vi.mock('vscode', () => {
    class RelativePattern {
        constructor(
            public base: string,
            public pattern: string
        ) {}
    }
    return {
        RelativePattern,
        workspace: {
            createFileSystemWatcher: (pattern: unknown) => {
                const watcher: MockWatcher = {
                    pattern,
                    handlers: {},
                    dispose: () => {},
                    onDidChange: handler => {
                        watcher.handlers.change = handler;
                    },
                    onDidCreate: handler => {
                        watcher.handlers.create = handler;
                    },
                    onDidDelete: handler => {
                        watcher.handlers.delete = handler;
                    },
                };
                mocks.watchers.push(watcher);
                return watcher;
            },
        },
    };
});

function inputs(globs: string[]): WatchInputs {
    return { globs, tsconfig: { ...DEFAULT_TSCONFIG_FILES } };
}

function createManager(options: {
    roots: string[];
    resolve: (root: string) => WatchInputs;
    userGlobs?: string[];
    onChange?: (root: string | undefined) => void;
}): WatcherManager {
    return new WatcherManager({
        enabled: () => true,
        userGlobs: () => options.userGlobs,
        roots: () => options.roots,
        resolveInputs: async root => options.resolve(root),
        onResolved: () => {},
        onChange: options.onChange ?? (() => {}),
    });
}

describe('WatcherManager', () => {
    beforeEach(() => {
        mocks.watchers.length = 0;
    });

    it('scopes each resolved input to its own root', async () => {
        const watcher = createManager({
            roots: ['/repo/a', '/repo/b'],
            resolve: () => inputs(['tsconfig.base.json']),
        });
        await watcher.rebuild();

        expect(mocks.watchers).toHaveLength(2);
        expect(mocks.watchers.map(item => item.pattern)).toEqual([
            expect.objectContaining({ base: '/repo/a', pattern: 'tsconfig.base.json' }),
            expect.objectContaining({ base: '/repo/b', pattern: 'tsconfig.base.json' }),
        ]);
    });

    it('passes the owning root to onChange', async () => {
        const changed: (string | undefined)[] = [];
        const watcher = createManager({
            roots: ['/repo/a', '/repo/b'],
            resolve: () => inputs(['tsconfig.base.json']),
            onChange: root => changed.push(root),
        });
        await watcher.rebuild();

        mocks.watchers[1]!.handlers.change!({ fsPath: '/repo/b/tsconfig.base.json' });
        expect(changed).toEqual(['/repo/b']);
    });

    it('keeps user globs workspace-wide and unscoped', async () => {
        const changed: (string | undefined)[] = [];
        const watcher = createManager({
            roots: ['/repo/a'],
            resolve: () => inputs([]),
            userGlobs: ['**/dbx.config.*'],
            onChange: root => changed.push(root),
        });
        await watcher.rebuild();

        expect(mocks.watchers).toHaveLength(1);
        expect(mocks.watchers[0]!.pattern).toBe('**/dbx.config.*');
        mocks.watchers[0]!.handlers.change!({ fsPath: '/repo/b/dbx.config.ts' });
        expect(changed).toEqual([undefined]);
    });

    it('never watches globs that escape the root', async () => {
        const watcher = createManager({
            roots: ['/repo/a'],
            resolve: () => inputs(['../outside/**/*', 'C:\\repo\\**\\*']),
        });
        await watcher.rebuild();
        expect(mocks.watchers).toHaveLength(0);

        const user = createManager({
            roots: ['/repo/a'],
            resolve: () => inputs([]),
            userGlobs: ['../outside/**/*'],
        });
        await user.rebuild();
        expect(mocks.watchers).toHaveLength(0);
    });
});
