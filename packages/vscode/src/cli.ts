import { type ChildProcess, spawn, type SpawnOptions } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import * as vscode from 'vscode';

import { isCmdShim, windowsShimCommand } from './win-spawn.js';

const IS_WINDOWS = process.platform === 'win32';

/** A resolved `dbx` invocation. */
export interface CliCommand {
    exe: string;
    /** Leading args (eg. the resolved CLI entry) prepended to the user args. */
    args: string[];
}

/** The open workspace folders' filesystem paths. */
export function workspaceRoots(): string[] {
    return (vscode.workspace.workspaceFolders ?? []).map(folder => folder.uri.fsPath);
}

/** The built entry of a workspace-local `@deltabox/toolchain`, if installed. */
function localCliEntry(cwd: string): string | undefined {
    for (const dir of [cwd, ...workspaceRoots()]) {
        const entry = path.join(
            dir,
            'node_modules',
            '@deltabox',
            'toolchain',
            'dist',
            'cli',
            'index.js'
        );
        if (fs.existsSync(entry)) return entry;
    }
    return undefined;
}

/**
 * Resolve the CLI to run, preferring the workspace's local `@deltabox/toolchain`
 * (its built entry, then the `.bin` shim) over a global `npx` fallback.
 */
export function resolveCliCommand(cwd: string): CliCommand {
    const entry = localCliEntry(cwd);
    if (entry) return { exe: process.execPath, args: [entry] };
    if (!IS_WINDOWS) {
        for (const dir of [cwd, ...workspaceRoots()]) {
            const bin = path.join(dir, 'node_modules', '.bin', 'dbx');
            if (fs.existsSync(bin)) return { exe: bin, args: [] };
        }
    }
    return { exe: IS_WINDOWS ? 'npx.cmd' : 'npx', args: ['--yes', '@deltabox/toolchain'] };
}

/**
 * Spawn the resolved `dbx` CLI in `cwd`, cross-platform safe. On Windows a
 * `.cmd`/`.bat` shim is run through cmd.exe (avoiding the `EINVAL` throw).
 * Returns the child process; the caller owns the stdio wiring.
 */
export function spawnCli(cwd: string, args: string[], options: SpawnOptions = {}): ChildProcess {
    const resolved = resolveCliCommand(cwd);
    const fullArgs = [...resolved.args, ...args];
    if (IS_WINDOWS && isCmdShim(resolved.exe)) {
        const command = windowsShimCommand(resolved.exe, fullArgs);
        return spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `"${command}"`], {
            cwd,
            ...options,
            shell: false,
            windowsVerbatimArguments: true,
        });
    }
    return spawn(resolved.exe, fullArgs, { cwd, ...options, shell: false });
}

/**
 * The shell command that runs the resolved CLI in `cwd`, for an integrated
 * terminal. `process.execPath` is the VS Code binary in the extension host, so
 * the terminal must reach the CLI through `npx` (which resolves the project's
 * local `dbx` bin) rather than spawn `process.execPath` directly.
 */
export function cliInvocation(cwd: string): string {
    if (localCliEntry(cwd)) return 'npx dbx';
    return IS_WINDOWS ? 'npx.cmd --yes @deltabox/toolchain' : 'npx --yes @deltabox/toolchain';
}

export interface CapturedResult {
    code: number;
    stdout: string;
    stderr: string;
}

/** Run `dbx <args>` in `cwd`, capturing stdout/stderr. Never rejects. */
export function captureCli(cwd: string, args: string[]): Promise<CapturedResult> {
    return new Promise<CapturedResult>(resolve => {
        let stdout = '';
        let stderr = '';
        let child: ChildProcess;
        try {
            child = spawnCli(cwd, args);
        } catch (error) {
            resolve({ code: 1, stdout, stderr: String(error) });
            return;
        }
        child.stdout?.on('data', chunk => {
            stdout += chunk.toString();
        });
        child.stderr?.on('data', chunk => {
            stderr += chunk.toString();
        });
        child.on('error', error => {
            resolve({ code: 1, stdout, stderr: `${stderr}${String(error)}` });
        });
        child.on('exit', code => {
            resolve({ code: code ?? 0, stdout, stderr });
        });
    });
}
