import { type ChildProcess, type SpawnOptions, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { logger } from './logger.js';

const IS_WINDOWS = process.platform === 'win32';

/** Whether the missing-`ComSpec` warning has already been emitted. */
let warnedMissingComSpec = false;

// cmd.exe meta characters that must be caret-escaped when building a command
// line. Ported from the cross-spawn escape algorithm
// (https://github.com/moxystudio/node-cross-spawn) so a shell-free spawn stays
// safe without adding a dependency.
const CMD_META_CHARS = /([()\][%!^"`<>&|;, *?])/g;

/** Escape the command (not the args) of a Windows `cmd.exe` command line. */
function escapeCmdCommand(value: string): string {
    // `cmd.exe` splits an unquoted command at whitespace, so a command that is
    // itself a path with spaces (e.g. `C:\Program Files\nodejs\node.exe`) must
    // be quoted — otherwise the interpreter looks for `C:\Program`. Quoting also
    // protects metacharacters, so no caret escaping is applied in that case.
    if (!/\s/.test(value)) return value.replace(CMD_META_CHARS, '^$1');
    const quoted = value.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"').replace(/(?=(\\+?)?)\1$/, '$1$1');
    return `"${quoted}"`;
}

/** Escape one argument for a Windows `cmd.exe` command line. */
function escapeCmdArgument(value: string, doubleEscapeMetaChars: boolean): string {
    let arg = String(value);
    // Backslashes before a quote (or the end) must be doubled.
    arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
    arg = arg.replace(/(?=(\\+?)?)\1$/, '$1$1');
    arg = `"${arg}"`;
    arg = arg.replace(CMD_META_CHARS, '^$1');
    // A `.cmd`/`.bat` shim re-parses `%*` in a second cmd.exe pass, so its args
    // need the metacharacters escaped twice.
    if (doubleEscapeMetaChars) arg = arg.replace(CMD_META_CHARS, '^$1');
    return arg;
}

/** The first `cmd` + PATHEXT candidate that exists on PATH (Windows only). */
function resolveWindowsCommand(cmd: string): string | undefined {
    if (path.extname(cmd)) return fs.existsSync(cmd) ? cmd : undefined;
    const exts = (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';');
    const dirs = (process.env.PATH ?? '').split(path.delimiter);
    for (const ext of exts) {
        for (const dir of dirs) {
            const candidate = path.join(dir, `${cmd}${ext.toLowerCase()}`);
            if (fs.existsSync(candidate)) return candidate;
        }
    }
    return undefined;
}

/** Whether running `cmd` on Windows goes through a `.cmd`/`.bat` shim. */
function isCmdShim(cmd: string): boolean {
    const resolved = resolveWindowsCommand(cmd) ?? cmd;
    return /\.(cmd|bat)$/i.test(resolved);
}

/**
 * Kill a child process **and its descendants**. On Windows the child is a
 * `cmd.exe` wrapper, so a plain `child.kill()` would orphan the real command;
 * `taskkill /t` tears down the whole tree. On POSIX the child is killed directly.
 */
export function killProcessTree(child: ChildProcess, signal: NodeJS.Signals = 'SIGKILL'): void {
    const pid = child.pid;
    if (pid === undefined) return;
    if (IS_WINDOWS) {
        try {
            spawnSync('taskkill', ['/pid', String(pid), '/t', '/f'], { stdio: 'ignore' });
            return;
        } catch {
            // fall through to a plain kill
        }
    }
    try {
        child.kill(signal);
    } catch {
        // already gone
    }
}

/** {@link spawnCross} options: {@link SpawnOptions} plus an optional deadline. */
export interface SpawnCrossOptions extends SpawnOptions {
    /**
     * Kill the child (and its tree) after this many ms. Use it for one-shot
     * commands so a hung child can never be left running; omit it for
     * long-running processes (dev servers, watchers).
     */
    timeoutMs?: number;
    /** Called instead of the default warning when the deadline is hit. */
    onTimeout?: (cmd: string, timeoutMs: number) => void;
}

export interface RunOptions extends SpawnCrossOptions {
    /** Exit the main process with the child's exit code (default true). */
    exitWithMainProc?: boolean;
    /** Append a trailing `--` to the args (default true). */
    argsEndingDashes?: boolean;
    /** Log the command before spawning (default true). */
    verbose?: boolean;
}

/**
 * Spawn a command without a shell in a cross-platform safe way, returning the
 * child process. On Windows the command and every argument are escaped for
 * `cmd.exe` (and a `.cmd`/`.bat` shim is re-escaped) so a caller-supplied argv
 * value can never inject a command. `options.stdio` defaults to `inherit`.
 *
 * When `timeoutMs` is set the child's whole process tree is killed once the
 * deadline passes (with a warning), so a stalled command can't hang forever.
 */
export function spawnCross(
    cmd: string,
    args: string[],
    options: SpawnCrossOptions = {}
): ChildProcess {
    const { timeoutMs, onTimeout, ...spawnOpts } = options;

    let child: ChildProcess;
    if (IS_WINDOWS) {
        const doubleEscape = isCmdShim(cmd);
        const shellCommand = [
            escapeCmdCommand(cmd),
            ...args.map(arg => escapeCmdArgument(arg, doubleEscape)),
        ].join(' ');
        // `ComSpec` is the documented location of the command interpreter; fall
        // back to `cmd.exe` (and warn once) when the environment omits it.
        const comSpec = process.env.ComSpec;
        if (!comSpec && !warnedMissingComSpec) {
            warnedMissingComSpec = true;
            logger.warn('ComSpec is not set — falling back to cmd.exe.');
        }
        child = spawn(comSpec ?? 'cmd.exe', ['/d', '/s', '/c', `"${shellCommand}"`], {
            stdio: 'inherit',
            ...spawnOpts,
            shell: false,
            windowsVerbatimArguments: true,
        });
    } else {
        child = spawn(cmd, args, { stdio: 'inherit', ...spawnOpts, shell: false });
    }

    if (timeoutMs !== undefined && timeoutMs > 0) {
        const timer = setTimeout(() => {
            if (onTimeout) onTimeout(cmd, timeoutMs);
            else logger.warn(`\`${cmd}\` exceeded ${timeoutMs}ms — terminating it.`);
            killProcessTree(child);
        }, timeoutMs);
        timer.unref?.();
        child.once('exit', () => clearTimeout(timer));
    }

    return child;
}

/**
 * Spawn a command without a shell in a cross-platform safe way. On Windows the
 * command and every argument are escaped for `cmd.exe` so a caller-supplied
 * argv value can never inject a command.
 */
export function run(cmd: string, args: string[], options?: RunOptions): ChildProcess {
    const {
        exitWithMainProc = true,
        argsEndingDashes = true,
        verbose = true,
        timeoutMs,
        ...spawnOpts
    } = options ?? {};

    const finalArgs = [...args, ...(argsEndingDashes ? ['--'] : [])];

    if (verbose) logger.info(`$ ${cmd} ${finalArgs.join(' ')}`);

    const proc = spawnCross(cmd, finalArgs, {
        ...spawnOpts,
        ...(timeoutMs !== undefined ? { timeoutMs } : {}),
    });

    if (!exitWithMainProc) return proc;
    proc.on('exit', process.exit);

    return proc;
}
