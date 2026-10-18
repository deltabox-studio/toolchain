import { readProviderRegistry } from '@deltabox/toolchain-core';
import {
    logger,
    spawnCross,
    type ToolchainCommand,
    type ToolchainProvider,
    type ToolchainProviderCommand,
} from '@deltabox/toolchain-shared';

import { toolchainProviders } from '../../providers.js';

const CWD_OPTION = { flags: '--cwd <dir>', description: 'Project root (default: cwd).' };

/**
 * A passthrough command for a custom provider command: it forwards the operands
 * to the provider's binary (`<binary> <subcommand> ...`), so a registered
 * provider's commands are runnable as `dbx <command.name>`.
 */
function providerPassthrough(
    provider: ToolchainProvider,
    command: ToolchainProviderCommand
): ToolchainCommand {
    return {
        name: command.name,
        description: `${provider.name}: ${command.description}`,
        passthrough: true,
        options: [CWD_OPTION],
        run: async (opts, context) => {
            const raw = (opts.args as string[] | undefined) ?? [];
            const cwd = (opts.cwd as string | undefined) ?? context.cwd;
            if (!provider.binary) {
                logger.error(`provider "${provider.id}" has no binary to run.`);
                process.exitCode = 1;
                return;
            }
            const code = await new Promise<number>(resolve => {
                const child = spawnCross(provider.binary as string, [command.subcommand, ...raw], {
                    cwd,
                    env: process.env,
                    stdio: 'inherit',
                });
                child.on('error', () => resolve(1));
                child.on('exit', value => resolve(value ?? 0));
            });
            if (code !== 0) process.exitCode = code;
        },
    };
}

/** The passthrough commands for every command of the project's custom providers. */
export function providerPassthroughCommands(cwd: string = process.cwd()): ToolchainCommand[] {
    return readProviderRegistry(cwd).flatMap(provider =>
        provider.commands.map(command => providerPassthrough(provider, command))
    );
}

/**
 * `dbx providers` — list the registered providers and the CLI commands
 * they contribute. `--json` is the machine-readable form the VS Code extension
 * consumes to build its menus.
 */
export function providerCommands(): ToolchainCommand[] {
    return [
        {
            name: 'providers',
            description: 'List the tooling providers (Vite+, ...) and their commands.',
            options: [
                { flags: '--json', description: 'Print the providers (with actions) as JSON.' },
            ],
            run: opts => {
                const providers = toolchainProviders();
                if (opts.json) {
                    logger.raw(JSON.stringify(providers, null, 4));
                    return;
                }
                for (const provider of providers) {
                    const binary = provider.binary ? ` (${provider.binary})` : '';
                    logger.info(`${provider.name}${binary} [${provider.id}]`);
                    if (provider.description) logger.info(`  ${provider.description}`);
                    for (const command of provider.commands) {
                        logger.info(`  ${command.name.padEnd(20)} ${command.description}`);
                    }
                }
            },
        },
        ...providerPassthroughCommands(),
    ];
}
