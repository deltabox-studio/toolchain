#!/usr/bin/env node
/**
 * The `dbx` CLI entry point.
 *
 * Packages export framework-agnostic {@link ToolingCommand} descriptors; the
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
    normalizeLogLevel,
    setLogOverrides,
    type LoggerOptions,
    type ToolingCommand,
} from '@deltabox/toolchain-shared';
import { templateCommands } from '@deltabox/toolchain-template/cli';
import { tsconfigCommands } from '@deltabox/toolchain-tsconfig/cli';
import { cleanupCommands } from '@deltabox/toolchain-tsdown/cli';
import { resolveVpCommand, viteCommands } from '@deltabox/toolchain-vite/cli';

import rootPkg from '../../package.json' with { type: 'json' };
import { syncCommands } from './commands/index.js';
import { registerToolingCommands } from './register.js';

export { registerToolingCommands } from './register.js';

/** The commands built into the root CLI (config commands need a consumer engine). */
export function builtinCommands(): ToolingCommand[] {
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

/** Build the `dbx` commander program. */
export function createCli(): Command {
    const program = new Command();
    program
        .name('dbx')
        .description('All-in-one project toolchain: configs, tsconfigs, changelogs, scaffolding.')
        .version(rootPkg.version, '-V, --version', 'Output the version number')
        .option('--log-level <level>', `Minimum log level (${LOG_LEVELS.join('|')}).`)
        .option('--no-color', 'Disable coloured output.')
        .showHelpAfterError();
    registerToolingCommands(program, builtinCommands());
    return program;
}

/** Parse and run the CLI. */
export async function runCli(argv: string[] = process.argv): Promise<void> {
    const { argv: rest, options } = extractLogOptions(argv);
    setLogOverrides(options);
    await createCli().parseAsync(withDefaultVite(rest));
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
