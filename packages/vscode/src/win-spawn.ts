/**
 * Pure helpers for building a Windows `cmd.exe` command line.
 *
 * `spawn('npx.cmd', ...)` throws `EINVAL` synchronously on Windows (Node refuses
 * to run a `.cmd`/`.bat` without a shell), which would reject the promise in
 * `captureCli`/`runCli` and silently abort a command. A shim must instead go
 * through cmd.exe with every argument caret-escaped so a caller-supplied value
 * can never inject a command.
 *
 * Kept free of a `vscode` import so it is unit-testable. Ported from
 * `@deltabox/toolchain-shared` (the extension cannot import it at build time).
 */

// cmd.exe meta characters that must be caret-escaped when building a command
// line. Ported from the cross-spawn escape algorithm
// (https://github.com/moxystudio/node-cross-spawn).
const CMD_META_CHARS = /([()\][%!^"`<>&|;, *?])/g;

/** Escape the command (not the args) of a Windows `cmd.exe` command line. */
export function escapeCmdCommand(value: string): string {
    // `cmd.exe` splits an unquoted command at whitespace, so a command that is
    // itself a path with spaces (e.g. `C:\Program Files\nodejs\node.exe`) must
    // be quoted — otherwise the interpreter looks for `C:\Program`. Quoting also
    // protects metacharacters, so no caret escaping is applied in that case.
    if (!/\s/.test(value)) return value.replace(CMD_META_CHARS, '^$1');
    const quoted = value.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"').replace(/(?=(\\+?)?)\1$/, '$1$1');
    return `"${quoted}"`;
}

/** Escape one argument for a Windows `cmd.exe` command line. */
export function escapeCmdArgument(value: string, doubleEscape = true): string {
    let arg = String(value);
    // Backslashes before a quote (or the end) must be doubled.
    arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
    arg = arg.replace(/(?=(\\+?)?)\1$/, '$1$1');
    arg = `"${arg}"`;
    arg = arg.replace(CMD_META_CHARS, '^$1');
    // A `.cmd`/`.bat` shim re-parses `%*` in a second cmd.exe pass, so its args
    // need the metacharacters escaped twice.
    if (doubleEscape) arg = arg.replace(CMD_META_CHARS, '^$1');
    return arg;
}

/** Whether running `cmd` on Windows goes through a `.cmd`/`.bat` shim. */
export function isCmdShim(cmd: string): boolean {
    return /\.(cmd|bat)$/i.test(cmd);
}

/**
 * The `cmd.exe /d /s /c "<command>"` line for running a Windows shim: the
 * command with every argument escaped (double-escaped for the shim's own
 * second parse pass).
 */
export function windowsShimCommand(exe: string, args: string[]): string {
    return [escapeCmdCommand(exe), ...args.map(arg => escapeCmdArgument(arg, true))].join(' ');
}
