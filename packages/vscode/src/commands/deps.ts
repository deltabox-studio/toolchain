import type * as vscode from 'vscode';

import type { CapturedResult } from '../cli.js';
import type { Project } from '../projects.js';

/** Shared dependencies for the extracted extension command handlers. */
export interface CommandDeps {
    output: vscode.OutputChannel;
    runCli: (cwd: string, args: string[]) => Promise<number>;
    captureCli: (cwd: string, args: string[], timeoutMs?: number) => Promise<CapturedResult>;
    workspaceRoots: () => string[];
    refreshGraph: () => Promise<void>;
    refreshViews: () => void;
    runRoots: (args: string[]) => Promise<number[]>;
    runProjects: (projects: Project[], args: string[]) => Promise<number[]>;
    /** The projects currently selected in the Projects view. */
    selectedProjects: () => Project[];
    /** The extension settings section (`deltabox.toolchain`). */
    section: string;
}
