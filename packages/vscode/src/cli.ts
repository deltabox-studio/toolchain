import { type ChildProcess, spawn, type SpawnOptions } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import * as vscode from 'vscode';

import { isCmdShim, windowsShimCommand } from './win-spawn.js';

const IS_WINDOWS = process.platform === 'win32';

/** The extension's own id (`<publisher>.<name>`). */
const EXTENSION_ID = 'deltabox.toolchain';

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
 * Which `dbx` the extension should prefer: the project's own
 * `@deltabox/toolchain` (`'project'`) or the extension's bundled `dbx.cjs`
 * (`'extension'`). The default is the extension, so an unresolved or declined
 * setup always falls back to a known-good CLI.
 */
export type DbxSource = 'project' | 'extension';

/** The `workspaceState` key the chosen source is persisted under. */
const DBX_SOURCE_KEY = 'deltabox.dbxSource';

let dbxSource: DbxSource = 'extension';

/** Set the preferred `dbx` source (the extension persists it per workspace). */
export function setDbxSource(source: DbxSource): void {
    dbxSource = source;
}

/** The current `dbx` source preference. */
export function getDbxSource(): DbxSource {
    return dbxSource;
}

/** The workspace-local `dbx`: the built `@deltabox/toolchain` entry or a `.bin` shim. */
export function projectDbx(cwd: string): CliCommand | undefined {
    const entry = localCliEntry(cwd);
    if (entry) return { exe: process.execPath, args: [entry] };
    const names = IS_WINDOWS ? ['dbx.cmd', 'dbx.exe', 'dbx.ps1', 'dbx'] : ['dbx'];
    for (const dir of [cwd, ...workspaceRoots()]) {
        for (const name of names) {
            const bin = path.join(dir, 'node_modules', '.bin', name);
            if (fs.existsSync(bin)) return { exe: bin, args: [] };
        }
    }
    return undefined;
}

/** Show the "project vs extension `dbx`" notification and return the choice. */
export async function promptDbxSource(): Promise<DbxSource | undefined> {
    const useProject = "Use the project's dbx";
    const useExtension = "Use the extension's bundled dbx";
    const choice = await vscode.window.showInformationMessage(
        'deltabox: this workspace has its own @deltabox/toolchain. Which dbx should the extension run?',
        useProject,
        useExtension
    );
    if (choice === useProject) return 'project';
    if (choice === useExtension) return 'extension';
    return undefined;
}

/**
 * Detect the current workspace's own `dbx` and, when the extension also ships a
 * bundled one, ask the user once which to run. The choice is remembered per
 * workspace; dismissing the notification falls back to the extension's CLI.
 */
export async function initDbxSource(context: vscode.ExtensionContext): Promise<void> {
    const bundled = bundledCliEntry();
    const project = projectDbx(workspaceRoots()[0] ?? process.cwd());
    if (!bundled || !project) {
        dbxSource = project ? 'project' : 'extension';
        return;
    }
    const stored = context.workspaceState.get<DbxSource>(DBX_SOURCE_KEY);
    if (stored === 'project' || stored === 'extension') {
        dbxSource = stored;
        return;
    }
    dbxSource = (await promptDbxSource()) ?? 'extension';
    await context.workspaceState.update(DBX_SOURCE_KEY, dbxSource);
}

/** Re-prompt for the `dbx` source (the `deltabox.chooseDbxSource` command). */
export async function chooseDbxSource(
    context: vscode.ExtensionContext
): Promise<DbxSource | undefined> {
    const choice = await promptDbxSource();
    if (!choice) return undefined;
    dbxSource = choice;
    await context.workspaceState.update(DBX_SOURCE_KEY, choice);
    vscode.window.showInformationMessage(
        `deltabox: using the ${choice === 'project' ? "project's" : "extension's"} dbx.`
    );
    return choice;
}

/**
 * Resolve the CLI to run. The project's own (built) entry, or the extension's
 * bundled `dbx.cjs`, is preferred per {@link getDbxSource}; anything unresolved
 * falls back to the extension, then the project, then a pinned `npx`.
 */
export function resolveCliCommand(cwd: string): CliCommand {
    const bundled = bundledCliEntry();
    const project = projectDbx(cwd);
    if (dbxSource === 'project' && project) return project;
    if (bundled) return { exe: process.execPath, args: [bundled] };
    if (project) return project;
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
    const project = projectDbx(cwd);
    if (dbxSource === 'project' && project) {
        return project.args.length ? `node "${project.args[0]}"` : project.exe;
    }
    const bundled = bundledCliEntry();
    if (bundled) return `node "${bundled}"`;
    if (project) return project.args.length ? `node "${project.args[0]}"` : project.exe;
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
