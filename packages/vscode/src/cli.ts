import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import * as vscode from 'vscode';

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

/**
 * Resolve the CLI to run, preferring the workspace's local `@deltabox/toolchain`
 * (its built entry, then the `.bin` shim) over a global `npx` fallback.
 */
export function resolveCliCommand(cwd: string): CliCommand {
    const roots = [cwd, ...workspaceRoots()];
    for (const dir of roots) {
        const entry = path.join(
            dir,
            'node_modules',
            '@deltabox',
            'toolchain',
            'dist',
            'cli',
            'index.js'
        );
        if (fs.existsSync(entry)) return { exe: process.execPath, args: [entry] };
    }
    if (process.platform !== 'win32') {
        for (const dir of roots) {
            const bin = path.join(dir, 'node_modules', '.bin', 'dbx');
            if (fs.existsSync(bin)) return { exe: bin, args: [] };
        }
    }
    return {
        exe: process.platform === 'win32' ? 'npx.cmd' : 'npx',
        args: ['--yes', '@deltabox/toolchain'],
    };
}

/** Quote an argument for a shell command line (for the integrated terminal). */
function quote(value: string): string {
    return /[\s"]/g.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

/** The shell command string that runs the resolved CLI in `cwd`. */
export function cliInvocation(cwd: string): string {
    const resolved = resolveCliCommand(cwd);
    return [resolved.exe, ...resolved.args].map(quote).join(' ');
}

export interface CapturedResult {
    code: number;
    stdout: string;
    stderr: string;
}

/** Run `dbx <args>` in `cwd`, capturing stdout/stderr. */
export function captureCli(cwd: string, args: string[]): Promise<CapturedResult> {
    const resolved = resolveCliCommand(cwd);
    return new Promise<CapturedResult>(resolve => {
        let stdout = '';
        let stderr = '';
        const child = spawn(resolved.exe, [...resolved.args, ...args], { cwd });
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
