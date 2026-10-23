import { intro, outro } from '@clack/prompts';
import type { Command } from 'commander';

import {
    getLogOverrides,
    logger,
    setLogConfig,
    setLogOverrides,
    type ToolchainCommand,
    type ToolchainCommandContext,
} from '@deltabox/toolchain-shared';

import { defaultSyncTasks } from '../sync.js';
import { loadContext } from './context.js';
import { optionKeys } from './options.js';

/**
 * Whether commander is currently dispatching a provider passthrough command
 * (eg. `vite:*`). The CLI consults this from its `configureOutput` hooks so a
 * passthrough keeps commander's default output (the spawned provider keeps its
 * own colours) instead of being funnelled through the shared logger.
 */
let passthroughCommand = false;

/** Whether the command commander is handling is a provider passthrough. */
export function isPassthroughCommand(): boolean {
    return passthroughCommand;
}

/**
 * Register {@link ToolchainCommand} descriptors on a commander program. Before a
 * command runs, the consumer's `dbx.config.*` is loaded (once per cwd)
 * and passed as context. Only flags the user *explicitly typed* are forwarded,
 * so config-derived defaults win unless overridden on the CLI.
 */
export function registerToolchainCommands(program: Command, commands: ToolchainCommand[]): Command {
    const passthroughNames = new Set(
        commands.filter(command => command.passthrough).map(command => command.name)
    );
    program.hook('preSubcommand', (_parent, subcommand) => {
        passthroughCommand = passthroughNames.has(subcommand.name());
    });
    for (const cmd of commands) {
        const instance = program.command(cmd.name).description(cmd.description);
        if (cmd.passthrough) {
            // Forward unknown flags + excess operands verbatim to the provider.
            instance.allowUnknownOption(true).allowExcessArguments(true);
        }
        const keys = new Set<string>();
        for (const option of cmd.options ?? []) {
            for (const key of optionKeys(option.flags)) keys.add(key);
            if (option.default !== undefined) {
                instance.option(option.flags, option.description, option.default);
            } else {
                instance.option(option.flags, option.description);
            }
        }
        for (const arg of cmd.args ?? []) {
            const open = arg.required === false ? '[' : '<';
            const close = arg.required === false ? ']' : '>';
            instance.argument(
                `${open}${arg.name}${arg.variadic ? '...' : ''}${close}`,
                arg.description
            );
        }
        instance.action(async (...actionArgs: unknown[]) => {
            const command = actionArgs.pop() as Command;
            const options = (actionArgs.pop() ?? {}) as Record<string, unknown>;
            const provided: Record<string, unknown> = {};
            for (const key of keys) {
                if (command.getOptionValueSource(key) === 'cli') provided[key] = options[key];
            }
            if (cmd.passthrough) {
                // Every operand (incl. unknown flags) collected by commander.
                provided.args = command.args.slice();
            } else {
                for (const [index, arg] of (cmd.args ?? []).entries()) {
                    if (actionArgs[index] !== undefined) provided[arg.name] = actionArgs[index];
                }
            }
            const cwd = (provided.cwd as string | undefined) ?? process.cwd();
            // Bracket the run with clack's `intro`/`outro` for a human-facing
            // command (not a provider passthrough, and not machine/quiet output).
            const framed = !cmd.passthrough && provided.json !== true && provided.quiet !== true;
            const label = `${command.parent?.name() ?? ''} ${cmd.name}`.trim();
            if (framed) intro(label);
            try {
                // Load the config for every command (a passthrough reads the
                // `providers` section to decide whether the wrapped binary may
                // colour its output).
                const loaded = await loadContext(cwd);
                setLogConfig(loaded.config.logger);
                if (provided.quiet === true) {
                    setLogOverrides({ ...getLogOverrides(), level: 'error' });
                }
                const context: ToolchainCommandContext = {
                    cwd,
                    projectType: loaded.projectType,
                    config: loaded.config,
                    tokens: loaded.tokens,
                    syncTasks: defaultSyncTasks(),
                    ...(loaded.path ? { configPath: loaded.path } : {}),
                };
                await cmd.run(provided, context);
                if (framed) outro(process.exitCode ? 'Failed' : 'Done');
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                logger.error(message);
                if (framed) outro('Failed');
                process.exitCode = 1;
            }
        });
    }
    return program;
}
