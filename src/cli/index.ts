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

import { changelogCommands } from '@deltabox/toolchain/changelog/cli';
import { loadToolchainConfig } from '@deltabox/toolchain/core';
import { mcpCommands } from '@deltabox/toolchain/mcp/cli';
import { migrateCommands } from '@deltabox/toolchain/migrate/cli';
import { cleanupCommands } from '@deltabox/toolchain/pack/cli';
import { projectCommands } from '@deltabox/toolchain/project/cli';
import {
    LOG_LEVELS,
    logger,
    normalizeLogLevel,
    setLogOverrides,
    stripAnsi,
    type LoggerOptions,
    type ToolchainCommand,
    type ToolchainConfig,
} from '@deltabox/toolchain/shared';
import { templateCommands } from '@deltabox/toolchain/template/cli';
import { tsconfigCommands } from '@deltabox/toolchain/tsconfig/cli';
import { resolveVpCommand, viteCommands } from 'vite-plugin-dbx/cli';

import rootPkg from '../../package.json' with { type: 'json' };
import { syncCommands } from './commands/index.js';
import { extractConfigSelection, setConfigSelection } from './config-selection.js';
import { isPassthroughCommand, registerToolchainCommands } from './register.js';
import { withToolingRouting } from './tooling-commands.js';
import { runUpdateCheck } from './update-check.js';

export { extractConfigSelection } from './config-selection.js';
export { registerToolchainCommands } from './register.js';

/** The first-class `dbx fmt` / `dbx lint` commands (delegating to the tooling routes). */
function toolingAliases(commands: ToolchainCommand[]): ToolchainCommand[] {
    const out: ToolchainCommand[] = [];
    for (const name of ['fmt', 'lint'] as const) {
        const command = commands.find(candidate => candidate.name === `vite:${name}`);
        if (!command) continue;
        out.push({
            ...command,
            name,
            description:
                name === 'fmt'
                    ? 'Format with the detected formatter (Vite+ Oxfmt, Prettier, Biome, dprint or Oxc).'
                    : 'Lint with the detected linter (Vite+ Oxlint, ESLint or Biome).',
        });
    }
    return out;
}

/**
 * The commands built into the root CLI.
 *
 * The config generator's `config:*` commands are deliberately **not** registered
 * here: they are bound to a consumer's `ConfigEngine` (its schema and root),
 * which the root CLI cannot construct. `configCommands()` remains a library API
 * for a project that exposes its own config; `dbx` itself generates its
 * artifacts with `yarn config:generate`.
 */
export function builtinCommands(config?: ToolchainConfig): ToolchainCommand[] {
    const vite = withToolingRouting(viteCommands());
    return [
        ...syncCommands(config),
        ...tsconfigCommands(),
        ...cleanupCommands(),
        ...changelogCommands(),
        ...mcpCommands(),
        ...migrateCommands(),
        ...projectCommands(),
        ...templateCommands(),
        ...vite,
        ...toolingAliases(vite),
    ];
}

/** Every built-in command name (a bare Vite+ command never shadows one). */
function builtinCommandNames(commands: ToolchainCommand[] = builtinCommands()): Set<string> {
    return new Set(commands.map(command => command.name));
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
export function extractLogOptions(
    argv: string[],
    isPassthrough?: (name: string) => boolean
): { argv: string[]; options: LoggerOptions } {
    const options: LoggerOptions = {};
    const rest: string[] = [];
    const start = /(?:^|[\\/])(?:node|node\.exe|bun|bun\.exe|deno|deno\.exe)$/i.test(argv[0] ?? '')
        ? 2
        : 0;
    let command: string | undefined;
    let passthrough = false;
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index] as string;
        if (arg === '--') {
            // Everything after `--` is an operand for the subcommand (or the
            // wrapped binary): never treat a logger flag there as our own.
            rest.push(...argv.slice(index));
            break;
        }
        if (index >= start && command === undefined && !arg.startsWith('-')) {
            command = arg;
            passthrough = isPassthrough?.(arg) === true;
        }
        if (command !== undefined && passthrough) {
            rest.push(...argv.slice(index));
            break;
        }
        if (arg === '--no-color') {
            options.color = false;
        } else if (arg === '--color') {
            options.color = true;
        } else if (arg === '--log-level') {
            const value = argv[index + 1];
            if (value !== undefined && value !== '--' && !value.startsWith('-')) {
                options.level = normalizeLogLevel(value);
                index += 1;
            }
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
export function extractUpdateCheck(
    argv: string[],
    isPassthrough?: (name: string) => boolean
): { argv: string[]; updateCheck: boolean } {
    let updateCheck = true;
    const rest: string[] = [];
    const start = /(?:^|[\\/])(?:node|node\.exe|bun|bun\.exe|deno|deno\.exe)$/i.test(argv[0] ?? '')
        ? 2
        : 0;
    let command: string | undefined;
    let passthrough = false;
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index] as string;
        if (arg === '--') {
            rest.push(...argv.slice(index));
            break;
        }
        if (index >= start && command === undefined && !arg.startsWith('-')) {
            command = arg;
            passthrough = isPassthrough?.(arg) === true;
        }
        if (command !== undefined && passthrough) {
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
 * Commands whose stdout must stay machine-readable. The update notice is human
 * output on stdout, so it is suppressed for these (`mcp:serve` is a JSON-RPC
 * stream; `template:info` prints JSON by default).
 */
export const MACHINE_OUTPUT_COMMANDS = new Set(['template:info', 'mcp:serve']);

/**
 * Build the `dbx` commander program.
 *
 * Commander's own help/error output is routed through the shared logger so it
 * honours the same colour settings and sink as everything else. A provider
 * passthrough (`vite:*`) is the exception: it keeps commander's default output
 * so the spawned `vp` process keeps its own coloured logging.
 */
export function createCli(commands: ToolchainCommand[] = builtinCommands()): Command {
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
            'A superset of Vite+ with project synchronization, a config generator, tsconfig management, MCP server, CI/changelog automation, providers, catalogs and a VS Code extension. Use it as a Vite plugin or standalone.'
        )
        // Global options are parsed before the subcommand, so a subcommand can
        // reuse a name like `--version` (the changelog uses it for the target
        // version) without the root version flag swallowing it.
        .enablePositionalOptions()
        .version(rootPkg.version, '-V, --version', 'Output the version number')
        .option('--log-level <level>', `Minimum log level (${LOG_LEVELS.join('|')}).`)
        .option('--no-color', 'Disable coloured output.')
        .option('--no-update-check', 'Do not check for a newer dbx version.')
        .option('--config <file>', 'Use a specific dbx config file.')
        .option('--no-config', 'Ignore discovered config; use CLI flags/env only.')
        .option(
            '--configless',
            'Manage projects without their own dbx.config.* (inherit the nearest config).'
        )
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
    registerToolchainCommands(program, commands);
    return program;
}

/** Parse and run the CLI. */
export async function runCli(argv: string[] = process.argv): Promise<void> {
    // A preliminary command set is enough to classify passthrough operands
    // before the config selection is known; the final set is filtered by the
    // provider registry policy below.
    const baseCommands = builtinCommands();
    const baseCommandNames = builtinCommandNames(baseCommands);
    const basePassthroughNames = new Set(
        baseCommands.filter(command => command.passthrough).map(command => command.name)
    );
    const isPassthrough = (name: string): boolean =>
        basePassthroughNames.has(name) ||
        (!baseCommandNames.has(name) && resolveVpCommand(name) !== undefined);
    const { argv: rest, options } = extractLogOptions(argv, isPassthrough);
    const { argv: rest2, updateCheck } = extractUpdateCheck(rest, isPassthrough);
    const { argv: rest3, selection } = extractConfigSelection(
        rest2,
        // A bare Vite+ command is rewritten to `vite <command>` later, so it is
        // a passthrough too unless a built-in command shadows it.
        isPassthrough
    );
    setConfigSelection(selection);
    setLogOverrides(options);
    if (selection.config !== undefined && selection.noConfig) {
        logger.error('`--config` and `--no-config` cannot be used together.');
        process.exitCode = 1;
        return;
    }
    if (selection.config !== undefined && selection.config.trim() === '') {
        logger.error('`--config` requires a non-empty file path.');
        process.exitCode = 1;
        return;
    }
    // Register only the providers allowed by `toolchain.registry.providers`, so
    // a denied provider cannot appear in help/completion. Hooks are skipped:
    // this is a metadata-only load (the command action loads the real context).
    const registration = await loadToolchainConfig(process.cwd(), {
        tolerant: true,
        skipHooks: true,
        ...selection,
    });
    const commands = builtinCommands(registration.config);
    const commandNames = builtinCommandNames(commands);
    const wantsHelp = argv.some(arg => arg === '--help' || arg === '-h' || arg === '--version');
    // The notice is human output on stdout; never let it corrupt machine output.
    const machineCommands = MACHINE_OUTPUT_COMMANDS;
    const machineFlags = new Set([
        '--json',
        '--alias',
        '--paths',
        '--references',
        '--release-notes',
    ]);
    const wantsJson =
        rest3.some(arg => machineFlags.has(arg)) ||
        (rest3[2] !== undefined && machineCommands.has(rest3[2]));
    if (!wantsHelp && !wantsJson) runUpdateCheck(rootPkg.version, updateCheck);
    await createCli(commands).parseAsync(withDefaultVite(rest3, commandNames));
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
