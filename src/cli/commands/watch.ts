import { resolveWatchGlobs, runWatch } from '@deltabox/toolchain-core';
import { logger, sectionConfig, type ToolchainCommand } from '@deltabox/toolchain-shared';
import { tsconfigFileNames } from '@deltabox/toolchain-tsconfig';

import { defaultSyncTasks } from '../../sync.js';
import { baseOptions, watchOptions } from './shared.js';

/** `dbx watch` — sync once, then re-sync on input changes. */
export function watchCommand(): ToolchainCommand {
    return {
        name: 'watch',
        description: 'Sync once, then watch key files and re-sync on change.',
        options: [
            ...baseOptions,
            {
                flags: '--force',
                description: 'Run even when no dbx.config.* is present.',
            },
            {
                flags: '--list',
                description:
                    'Print the resolved input globs (+ tsconfig file names) instead of watching.',
            },
            { flags: '--json', description: 'With --list: print the inputs as JSON.' },
        ],
        run: async (opts, context) => {
            if (opts.list) {
                // What `dbx watch` (and the VS Code auto-sync) should watch: the
                // config file plus the active tasks' inputs, with configured
                // file names (eg. a custom `tsconfig.defaultFile`) resolved.
                const inputs = {
                    globs: [
                        '**/dbx.config.*',
                        ...resolveWatchGlobs(
                            defaultSyncTasks(),
                            context.config,
                            context.projectType
                        ),
                    ],
                    tsconfig: tsconfigFileNames(context.config),
                };
                if (opts.json) {
                    logger.raw(JSON.stringify(inputs, null, 4));
                } else {
                    for (const glob of inputs.globs) logger.info(glob);
                }
                return;
            }
            if (!context.configPath && !opts.force && !context.noConfig) {
                logger.warn(
                    'no dbx.config.* found here; nothing to watch (use --force to run anyway).'
                );
                return;
            }
            if (sectionConfig(context.config.watch)?.enabled === false) {
                logger.warn('watch is disabled in the config.');
                return;
            }
            await runWatch({ ...watchOptions(context), quiet: Boolean(opts.quiet) });
        },
    };
}
