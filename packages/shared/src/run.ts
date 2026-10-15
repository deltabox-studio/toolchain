import { type ChildProcess, type SpawnOptions, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const IS_WINDOWS = process.platform === 'win32';

// cmd.exe meta characters that must be caret-escaped when building a command
// line. Ported from the cross-spawn escape algorithm
// (https://github.com/moxystudio/node-cross-spawn) so a shell-free spawn stays
// safe without adding a dependency.
const CMD_META_CHARS = /([()\][%!^"`<>&|;, *?])/g;

/** Escape the command (not the args) of a Windows `cmd.exe` command line. */
function escapeCmdCommand(value: string): string {
    return value.replace(CMD_META_CHARS, '^$1');
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

export interface RunOptions extends SpawnOptions {
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
 */
export function spawnCross(cmd: string, args: string[], options: SpawnOptions = {}): ChildProcess {
    if (IS_WINDOWS) {
        const doubleEscape = isCmdShim(cmd);
        const shellCommand = [
            escapeCmdCommand(cmd),
            ...args.map(arg => escapeCmdArgument(arg, doubleEscape)),
        ].join(' ');
        return spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `"${shellCommand}"`], {
            stdio: 'inherit',
            ...options,
            shell: false,
            windowsVerbatimArguments: true,
        });
    }
    return spawn(cmd, args, { stdio: 'inherit', ...options, shell: false });
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
        ...spawnOpts
    } = options ?? {};

    const finalArgs = [...args, ...(argsEndingDashes ? ['--'] : [])];

    if (verbose) console.log(`$ ${cmd} ${finalArgs.join(' ')}`);

    const proc = spawnCross(cmd, finalArgs, spawnOpts);

    if (!exitWithMainProc) return proc;
    proc.on('exit', process.exit);

    return proc;
}
