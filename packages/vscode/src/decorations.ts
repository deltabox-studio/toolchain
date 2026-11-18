import * as vscode from 'vscode';

import { ManagedFileIndex } from './managed-files.js';
import { discoverProjects } from './projects.js';

/** The theme color contributed in `package.json` for managed files. */
export const MANAGED_FILE_COLOR_ID = 'deltabox.managedFileForeground';
/** The explorer badge shown on managed files. */
export const MANAGED_FILE_BADGE = 'dbx';
/** The hover text for a managed file. */
export const MANAGED_FILE_TOOLTIP = 'Managed by deltabox toolchain';

export interface ManagedFileDecorationProviderOptions {
    /** The files to decorate (default: every discovered project). */
    sources?: () => Iterable<{ dir: string }>;
    /** Whether decorations are enabled (default: always). */
    enabled?: () => boolean;
}

/**
 * Decorates every file recorded in a `.dbx/toolchain/manifest.json` with a
 * `dbx` badge and the contributed blue label color. VS Code does not allow a
 * contribution point to override a single file's icon, so the badge + color is
 * the supported way to mark managed files in the default File Explorer.
 */
export class ManagedFileDecorationProvider
    implements vscode.FileDecorationProvider, vscode.Disposable
{
    private readonly emitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
    readonly onDidChangeFileDecorations = this.emitter.event;
    private readonly index = new ManagedFileIndex();
    private readonly sources: () => Iterable<{ dir: string }>;
    private readonly enabled: () => boolean;
    private readonly decoration = new vscode.FileDecoration(
        MANAGED_FILE_BADGE,
        MANAGED_FILE_TOOLTIP,
        new vscode.ThemeColor(MANAGED_FILE_COLOR_ID)
    );

    constructor(options: ManagedFileDecorationProviderOptions = {}) {
        this.sources = options.sources ?? (() => discoverProjects());
        this.enabled = options.enabled ?? (() => true);
        this.refresh();
    }

    /** Re-read the manifests and ask VS Code to redraw every decoration. */
    refresh(): void {
        this.index.refresh(this.sources());
        this.emitter.fire(undefined);
    }

    provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
        if (!this.enabled()) return undefined;
        if (uri.scheme !== 'file') return undefined;
        return this.index.has(uri.fsPath) ? this.decoration : undefined;
    }

    dispose(): void {
        this.emitter.dispose();
    }
}
