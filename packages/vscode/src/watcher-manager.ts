import path from 'node:path';

import * as vscode from 'vscode';

import { planWatchTargets, type WatchInputs } from './watch-inputs.js';

export interface WatcherManagerOptions {
    /** Whether auto-sync is enabled (re-read on every rebuild). */
    enabled: () => boolean;
    /** The user's explicit `deltabox.toolchain.watch` globs, if any. */
    userGlobs: () => string[] | undefined;
    /** The workspace roots to resolve inputs for. */
    roots: () => string[];
    /** Resolve one root's inputs via `dbx watch --list --json`. */
    resolveInputs: (root: string) => Promise<WatchInputs>;
    /** Called with each resolved root (tsconfig names/project detection). */
    onResolved: (root: string, inputs: WatchInputs) => void;
    /** Called when an input file changed (debounced by the caller's scheduler). */
    onChange: () => void;
    /** Called after a `dbx.config.*` change so the caller can re-resolve inputs. */
    onConfigChange?: () => void;
    /** Optional log sink. */
    log?: (message: string) => void;
}

/**
 * Owns the auto-sync file watchers.
 *
 * The CLI resolves the exact config/tsconfig files from the project graph (and
 * each project's nested config), so the extension can use workspace-relative
 * string patterns. VS Code then reuses its workspace watcher instead of
 * installing additional recursive watchers — the latter is what can hold
 * `node_modules` handles during a package-manager link step on Windows.
 */
export class WatcherManager {
    private watchers: vscode.FileSystemWatcher[] = [];
    private generation = 0;
    private timer?: NodeJS.Timeout;
    private disposed = false;

    constructor(private readonly options: WatcherManagerOptions) {}

    /** Stop all watchers and ignore any in-flight rebuild. */
    dispose(): void {
        this.disposed = true;
        clearTimeout(this.timer);
        this.disposeWatchers();
    }

    private disposeWatchers(): void {
        for (const watcher of this.watchers) watcher.dispose();
        this.watchers = [];
    }

    /** Recompute the watcher set from the current config/project graph. */
    async rebuild(): Promise<void> {
        if (this.disposed) return;
        const generation = ++this.generation;
        this.disposeWatchers();
        if (!this.options.enabled()) return;

        const userGlobs = this.options.userGlobs();
        const roots = this.options.roots();
        const resolved = await Promise.all(
            roots.map(async root => ({ root, inputs: await this.options.resolveInputs(root) }))
        );
        if (this.disposed || generation !== this.generation) return;
        for (const { root, inputs } of resolved) this.options.onResolved(root, inputs);

        for (const target of planWatchTargets(userGlobs, resolved)) {
            const watcher = vscode.workspace.createFileSystemWatcher(target.glob);
            const onEvent = (uri: vscode.Uri): void => {
                this.options.onChange();
                if (path.basename(uri.fsPath).startsWith('dbx.config.')) {
                    this.options.onConfigChange?.();
                    clearTimeout(this.timer);
                    this.timer = setTimeout(() => void this.rebuild(), 500);
                }
            };
            watcher.onDidChange(onEvent);
            watcher.onDidCreate(onEvent);
            watcher.onDidDelete(onEvent);
            this.watchers.push(watcher);
        }
        this.options.log?.(`dbx: watching ${this.watchers.length} input pattern(s).`);
    }
}
