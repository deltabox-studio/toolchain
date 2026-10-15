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
import type { ToolingCommand } from '@deltabox/toolchain-shared';
import { templateCommands } from '@deltabox/toolchain-template/cli';
import { tsconfigCommands } from '@deltabox/toolchain-tsconfig/cli';
import { cleanupCommands } from '@deltabox/toolchain-tsdown/cli';
import { viteCommands } from '@deltabox/toolchain-vite/cli';

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

/** Build the `dbx` commander program. */
export function createCli(): Command {
    const program = new Command();
    program
        .name('dbx')
        .description('All-in-one project toolchain: configs, tsconfigs, changelogs, scaffolding.')
        .version(rootPkg.version, '-V, --version', 'Output the version number')
        .showHelpAfterError();
    registerToolingCommands(program, builtinCommands());
    return program;
}

/** Parse and run the CLI. */
export async function runCli(argv: string[] = process.argv): Promise<void> {
    await createCli().parseAsync(argv);
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
