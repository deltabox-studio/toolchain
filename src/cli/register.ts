import { intro, outro } from '@clack/prompts';

import {
    getLogOverrides,
    logger,
    setLogConfig,
    setLogOverrides,
    setSpinnerEnabled,
    type CliCommand,
    type ToolchainCommandContext,
} from '@deltabox/toolchain/shared';

import { defaultSyncTasks } from '../sync.js';
import { getConfigSelection } from './config-selection.js';
import { loadContext } from './context.js';

/**
 * Whether the engine is currently dispatching a provider passthrough command
 * (eg. `vite:*`). The CLI consults this so a passthrough keeps the spawned
 * provider's own output/colours instead of routing it through the logger.
 */
let passthroughCommand = false;

/** Mark the command currently being dispatched as a passthrough. */
export function setPassthroughCommand(value: boolean): void {
    passthroughCommand = value;
}

/** Whether the command currently being dispatched is a provider passthrough. */
export function isPassthroughCommand(): boolean {
    return passthroughCommand;
}

/**
 * Wrap framework-agnostic commands with the dbx host context: load the
 * consumer's `dbx.config.*` once per cwd, configure the logger/spinner and run
 * clack's intro/outro framing. This is the only dbx-specific layer the generic
 * config program needs.
 */
export function withCliContext(
    commands: readonly CliCommand[],
    parent = '',
    inheritedOnError?: (error: unknown, context: ToolchainCommandContext) => void | Promise<void>
): CliCommand[] {
    return commands.map(command => {
        const label = `${parent} ${command.name}`.trim();
        const onError = command.onError ?? inheritedOnError;
        const wrapped: CliCommand = {
            ...command,
            run: async (provided, _context) => {
                const values = provided as Record<string, unknown>;
                const cwd = (values.cwd as string | undefined) ?? process.cwd();
                const machine =
                    command.name === 'template:info' ||
                    values.json === true ||
                    values.alias === true ||
                    values.paths === true ||
                    values.references === true ||
                    values.releaseBody !== undefined;
                const framed = !command.passthrough && !machine && values.quiet !== true;
                setSpinnerEnabled(framed ? undefined : false);
                if (framed) intro(label);
                let context: ToolchainCommandContext | undefined;
                try {
                    const loaded = await loadContext(cwd);
                    const selection = getConfigSelection();
                    if (loaded.error) logger.warn(loaded.error);
                    setLogConfig(loaded.config.logger);
                    if (values.quiet === true) {
                        setLogOverrides({ ...getLogOverrides(), level: 'error' });
                    }
                    context = {
                        cwd,
                        projectType: loaded.projectType,
                        config: loaded.config,
                        ownConfig: loaded.ownConfig,
                        tokens: loaded.tokens,
                        syncTasks: defaultSyncTasks(),
                        ...(loaded.path ? { configPath: loaded.path } : {}),
                        ...(loaded.parentPath ? { parentPath: loaded.parentPath } : {}),
                        ...(selection.noConfig ? { noConfig: true } : {}),
                        ...(loaded.configless ? { configless: true } : {}),
                        managed: loaded.managed,
                        ...(loaded.plugin ? { plugin: true } : {}),
                        ...(loaded.pluginPath ? { pluginPath: loaded.pluginPath } : {}),
                        ...(loaded.error ? { configError: loaded.error } : {}),
                    };
                    await command.run(provided, context);
                    if (framed) outro(process.exitCode ? 'Failed' : 'Done');
                } catch (error) {
                    if (onError && context) await onError(error, context);
                    else {
                        const message = error instanceof Error ? error.message : String(error);
                        logger.error(message);
                    }
                    if (framed) outro('Failed');
                    process.exitCode = 1;
                } finally {
                    setSpinnerEnabled(undefined);
                }
            },
            ...(command.commands
                ? { commands: withCliContext([...command.commands], label, onError) }
                : {}),
        };
        return wrapped;
    });
}
