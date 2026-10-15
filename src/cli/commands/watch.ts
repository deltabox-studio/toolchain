import { runWatch } from '@deltabox/toolchain-core';
import { sectionConfig, type ToolingCommand } from '@deltabox/toolchain-shared';

import { baseOptions, watchOptions } from './shared.js';

/** `dbx watch` — sync once, then re-sync on input changes. */
export function watchCommand(): ToolingCommand {
    return {
        name: 'watch',
        description: 'Sync once, then watch key files and re-sync on change.',
        options: [
            ...baseOptions,
            {
                flags: '--force',
                description: 'Run even when no dbx.config.* is present.',
            },
        ],
        run: async (opts, context) => {
            if (!context.configPath && !opts.force) {
                console.warn(
                    'dbx: no dbx.config.* found here; nothing to watch (use --force to run anyway).'
                );
                return;
            }
            if (sectionConfig(context.config.watch)?.enabled === false) {
                console.warn('dbx: watch is disabled in the config.');
                return;
            }
            await runWatch({ ...watchOptions(context), quiet: Boolean(opts.quiet) });
        },
    };
}
