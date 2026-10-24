#!/usr/bin/env node
/**
 * The `dbx` CLI entry point.
 *
 * Packages export framework-agnostic {@link ToolchainCommand} descriptors; the
 * root wires them together and hands each command the loaded
 * `dbx.config.*` context (see `./register.ts`). The config-driven
 * `projects`/`sync`/`watch` commands live in `./commands`.
 */

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Command } from 'commander';

import { changelogCommands } from '@deltabox/toolchain-changelog/cli';
import { migrateCommands } from '@deltabox/toolchain-migrate/cli';
import { projectCommands } from '@deltabox/toolchain-project/cli';
import {
    LOG_LEVELS,
    logger,
    normalizeLogLevel,
    setLogOverrides,
    stripAnsi,
    type LoggerOptions,
    type ToolchainCommand,
} from '@deltabox/toolchain-shared';
import { templateCommands } from '@deltabox/toolchain-template/cli';
import { tsconfigCommands } from '@deltabox/toolchain-tsconfig/cli';
import { cleanupCommands } from '@deltabox/toolchain-tsdown/cli';
import { resolveVpCommand, viteCommands } from '@deltabox/toolchain-vite/cli';

import rootPkg from '../../package.json' with { type: 'json' };
import { syncCommands } from './commands/index.js';
import { isPassthroughCommand, registerToolchainCommands } from './register.js';
import { runUpdateCheck } from './update-check.js';

export { registerToolchainCommands } from './register.js';

/** The commands built into the root CLI (config commands need a consumer engine). */
export function builtinCommands(): ToolchainCommand[] {
    return [
        ...syncCommands(),
        ...tsconfigCommands(),
        ...cleanupCommands(),
        ...changelogCommands(),
        ...migrateCommands(),
        ...projectCommands(),
        ...templateCommands(),
        ...viteCommands(),
    ];
}

/** Every built-in command name (a bare Vite+ command never shadows one). */
function builtinCommandNames(): Set<string> {
    return new Set(builtinCommands().map(command => command.name));
}

/**
 * Default a bare Vite+ command to the `vite` passthrough: when the first
 * operand is not a built-in `dbx` command but names a Vite+ subcommand (or one
 * of its aliases), insert `vite` so `dbx fmt` / `dbx run` / `dbx dev` work
 * without the explicit namespace. Built-in commands always win (`dbx migrate`
 * stays the toolchain's migration; use `dbx vite migrate` for Vite+'s).
 */
export function withDefaultVite(
    argv: string[],
    commandNames: ReadonlySet<string> = builtinCommandNames()
): string[] {
    const first = argv[2];
    if (!first || first.startsWith('-')) return argv;
    if (commandNames.has(first) || !resolveVpCommand(first)) return argv;
    return [...argv.slice(0, 2), 'vite', ...argv.slice(2)];
}

/**
 * Pull the global logger flags out of `argv` (so they work before *or* after a
 * subcommand) and turn them into logger overrides.
 */
export function extractLogOptions(argv: string[]): { argv: string[]; options: LoggerOptions } {
    const options: LoggerOptions = {};
    const rest: string[] = [];
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index] as string;
        if (arg === '--') {
            // Everything after `--` is an operand for the subcommand (or the
            // wrapped binary): never treat a logger flag there as our own.
            rest.push(...argv.slice(index));
            break;
        }
        if (arg === '--no-color') {
            options.color = false;
        } else if (arg === '--color') {
            options.color = true;
        } else if (arg === '--log-level') {
            const value = argv[++index];
            if (value !== undefined) options.level = normalizeLogLevel(value);
        } else if (arg.startsWith('--log-level=')) {
            options.level = normalizeLogLevel(arg.slice('--log-level='.length));
        } else {
            rest.push(arg);
        }
    }
    return { argv: rest, options };
}

/**
 * Pull the update-check flags out of `argv` (so `--no-update-check` works before
 * or after a subcommand) and report whether the check is enabled.
 */
export function extractUpdateCheck(argv: string[]): { argv: string[]; updateCheck: boolean } {
    let updateCheck = true;
    const rest: string[] = [];
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index] as string;
        if (arg === '--') {
            rest.push(...argv.slice(index));
            break;
        }
        if (arg === '--no-update-check') updateCheck = false;
        else if (arg === '--update-check') updateCheck = true;
        else rest.push(arg);
    }
    return { argv: rest, updateCheck };
}

/**
 * Build the `dbx` commander program.
 *
 * Commander's own help/error output is routed through the shared logger so it
 * honours the same colour settings and sink as everything else. A provider
 * passthrough (`vite:*`) is the exception: it keeps commander's default output
 * so the spawned `vp` process keeps its own coloured logging.
 */
export function createCli(): Command {
    const program = new Command();
    // Capture commander's defaults before overriding them (used for passthrough).
    const defaults = program.configureOutput();
    program.configureOutput({
        writeOut: text =>
            isPassthroughCommand() ? defaults.writeOut?.(text) : logger.write('out', text),
        writeErr: text =>
            isPassthroughCommand() ? defaults.writeErr?.(text) : logger.write('err', text),
        getOutHasColors: () =>
            isPassthroughCommand()
                ? (defaults.getOutHasColors?.() ?? false)
                : logger.colors.isColorSupported,
        getErrHasColors: () =>
            isPassthroughCommand()
                ? (defaults.getErrHasColors?.() ?? false)
                : logger.colors.isColorSupported,
        stripColor: text =>
            isPassthroughCommand() ? (defaults.stripColor?.(text) ?? text) : stripAnsi(text),
    });
    program
        .name('dbx')
        .description(
            'All-in-one project toolchain: configs, tsconfigs, changelogs, CI, templates, scaffolding, migrations.'
        )
        .version(rootPkg.version, '-V, --version', 'Output the version number')
        .option('--log-level <level>', `Minimum log level (${LOG_LEVELS.join('|')}).`)
        .option('--no-color', 'Disable coloured output.')
        .option('--no-update-check', 'Do not check for a newer dbx version.')
        .showHelpAfterError();
    // Commander's built-in Help does not colourise; wire its style hooks to the
    // logger's colour set (identity when colours are off, so `--no-color` is plain).
    program.configureHelp({
        styleTitle: str => logger.colors.bold(str),
        styleCommandText: str => logger.colors.cyan(str),
        styleOptionText: str => logger.colors.yellow(str),
        styleOptionTerm: str => logger.colors.yellow(str),
        styleSubcommandText: str => logger.colors.cyan(str),
        styleSubcommandTerm: str => logger.colors.cyan(str),
        styleArgumentText: str => logger.colors.yellow(str),
        styleArgumentTerm: str => logger.colors.yellow(str),
    });
    registerToolchainCommands(program, builtinCommands());
    return program;
}

/** Parse and run the CLI. */
export async function runCli(argv: string[] = process.argv): Promise<void> {
    const { argv: rest, options } = extractLogOptions(argv);
    const { argv: rest2, updateCheck } = extractUpdateCheck(rest);
    setLogOverrides(options);
    const wantsHelp = argv.some(arg => arg === '--help' || arg === '-h' || arg === '--version');
    // The notice is human output on stdout; never let it corrupt `--json`.
    const wantsJson = rest2.some(arg => arg === '--json');
    if (!wantsHelp && !wantsJson) runUpdateCheck(rootPkg.version, updateCheck);
    await createCli().parseAsync(withDefaultVite(rest2));
}

/** Whether this module is the process entry point (symlink-safe). */
function isDirectRun(): boolean {
    const arg = process.argv[1];
    if (!arg) return false;
    try {
        return realpathSync(arg) === fileURLToPath(import.meta.url);
    } catch {
        return false;
    }
}

// Run only when executed directly (not when imported).
if (isDirectRun()) {
    runCli();
}
