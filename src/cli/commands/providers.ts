import type { ToolingCommand } from '@deltabox/toolchain-shared';

import { toolingProviders } from '../../providers.js';

/**
 * `dbx providers` — list the registered providers and the CLI commands
 * they contribute. `--json` is the machine-readable form the VS Code extension
 * consumes to build its menus.
 */
export function providerCommands(): ToolingCommand[] {
    return [
        {
            name: 'providers',
            description: 'List the tooling providers (Vite+, ...) and their commands.',
            options: [
                { flags: '--json', description: 'Print the providers (with actions) as JSON.' },
            ],
            run: opts => {
                const providers = toolingProviders();
                if (opts.json) {
                    console.log(JSON.stringify(providers, null, 4));
                    return;
                }
                for (const provider of providers) {
                    const binary = provider.binary ? ` (${provider.binary})` : '';
                    console.log(`${provider.name}${binary} [${provider.id}]`);
                    if (provider.description) console.log(`  ${provider.description}`);
                    for (const command of provider.commands) {
                        console.log(`  ${command.name.padEnd(20)} ${command.description}`);
                    }
                }
            },
        },
    ];
}
