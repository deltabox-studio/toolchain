import type * as vscode from 'vscode';

import type { CapturedResult } from '../cli.js';

/** Shared dependencies for the extracted extension command handlers. */
export interface CommandDeps {
    output: vscode.OutputChannel;
    runCli: (cwd: string, args: string[]) => Promise<number>;
    captureCli: (cwd: string, args: string[], timeoutMs?: number) => Promise<CapturedResult>;
    workspaceRoots: () => string[];
    refreshGraph: () => Promise<void>;
}
