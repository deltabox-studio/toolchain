import { type ChildProcess, spawn, type SpawnOptions } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import * as vscode from 'vscode';

import { isCmdShim, windowsShimCommand } from './win-spawn.js';

const IS_WINDOWS = process.platform === 'win32';

/** The extension's own id (`<publisher>.<name>`). */
const EXTENSION_ID = 'deltabox.toolchain-vscode';

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
 * The self-contained CLI bundle shipped inside the extension
 * (`<extensionPath>/dist/dbx.cjs`), if present. This is preferred over any
 * workspace-local install or the `npx` fallback so a consumer never has to
 * install `@deltabox/toolchain`.
 */
export function bundledCliEntry(): string | undefined {
    const extensionPath = vscode.extensions.getExtension(EXTENSION_ID)?.extensionPath;
    if (!extensionPath) return undefined;
    const entry = path.join(extensionPath, 'dist', 'dbx.cjs');
    return fs.existsSync(entry) ? entry : undefined;
}

/**
 * The `@deltabox/toolchain` spec the `npx` fallback installs. The extension is
 * versioned in lockstep with the toolchain, so it pins its own version rather
 * than resolving `@latest` (which could drift from the workspace's generated
 * files). Falls back to the unpinned name only when the version is unavailable.
 */
export function pinnedToolchainSpec(): string {
    const version = (
        vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON as
            | { version?: unknown }
            | undefined
    )?.version;
    return typeof version === 'string' && version
        ? `@deltabox/toolchain@${version}`
        : '@deltabox/toolchain';
}

/**
 * Resolve the CLI to run, preferring the extension's bundled `dbx.cjs`, then the
 * workspace's local `@deltabox/toolchain` (its built entry, then the `.bin`
 * shim), over a global `npx` fallback.
 *
 * The bundled/local entries are run with `process.execPath`. In the extension
 * host that is the VS Code/Electron binary, but VS Code launches the host with
 * `ELECTRON_RUN_AS_NODE=1`, so it executes as Node and `spawnCli` inherits that
 * variable. The integrated terminal is a separate process without it, so it
 * cannot use `process.execPath` — see {@link cliInvocation}.
 */
export function resolveCliCommand(cwd: string): CliCommand {
    const bundled = bundledCliEntry();
    if (bundled) return { exe: process.execPath, args: [bundled] };
    const entry = localCliEntry(cwd);
    if (entry) return { exe: process.execPath, args: [entry] };
    if (!IS_WINDOWS) {
        for (const dir of [cwd, ...workspaceRoots()]) {
            const bin = path.join(dir, 'node_modules', '.bin', 'dbx');
            if (fs.existsSync(bin)) return { exe: bin, args: [] };
        }
    }
    return { exe: IS_WINDOWS ? 'npx.cmd' : 'npx', args: ['--yes', pinnedToolchainSpec()] };
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
 * terminal. Unlike `spawnCli`, which runs inside the extension host (where VS
 * Code sets `ELECTRON_RUN_AS_NODE=1`, so `process.execPath` executes as Node),
 * the terminal is a separate process without that variable: there
 * `process.execPath` is the VS Code GUI binary and cannot run the CLI. The
 * bundled entry is therefore reached through a real `node`, and the fallbacks
 * through the project's local `dbx` bin (`npx`) or a published
 * `@deltabox/toolchain`.
 */
export function cliInvocation(cwd: string): string {
    const bundled = bundledCliEntry();
    if (bundled) return `node "${bundled}"`;
    if (localCliEntry(cwd)) return 'npx dbx';
    return `${IS_WINDOWS ? 'npx.cmd' : 'npx'} --yes ${pinnedToolchainSpec()}`;
}

export interface CapturedResult {
    code: number;
    stdout: string;
    stderr: string;
}

/** Default deadline for a captured `dbx` command — a stall is killed, not left hanging. */
export const CLI_TIMEOUT_MS = 5 * 60 * 1000;

/** Kill the child and its descendants (a Windows `cmd.exe` wrapper needs `taskkill /t`). */
function killTree(child: ChildProcess): void {
    const pid = child.pid;
    if (pid === undefined) return;
    if (IS_WINDOWS) {
        try {
            spawn('taskkill', ['/pid', String(pid), '/t', '/f'], { stdio: 'ignore' });
            return;
        } catch {
            // fall through to a plain kill
        }
    }
    try {
        child.kill('SIGKILL');
    } catch {
        // already gone
    }
}

/** Run `dbx <args>` in `cwd`, capturing stdout/stderr. Never rejects. */
export function captureCli(
    cwd: string,
    args: string[],
    timeoutMs: number = CLI_TIMEOUT_MS
): Promise<CapturedResult> {
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

        let timer: NodeJS.Timeout | undefined;
        const done = (result: CapturedResult): void => {
            if (timer) clearTimeout(timer);
            resolve(result);
        };

        child.stdout?.on('data', chunk => {
            stdout += chunk.toString();
        });
        child.stderr?.on('data', chunk => {
            stderr += chunk.toString();
        });
        child.on('error', error => {
            done({ code: 1, stdout, stderr: `${stderr}${String(error)}` });
        });
        child.on('exit', code => {
            done({ code: code ?? 0, stdout, stderr });
        });

        if (timeoutMs > 0) {
            timer = setTimeout(() => {
                stderr += `\ndbx timed out after ${timeoutMs}ms`;
                killTree(child);
            }, timeoutMs);
            timer.unref?.();
        }
    });
}
