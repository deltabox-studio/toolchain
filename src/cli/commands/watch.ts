import { resolveWatchInputFiles, runWatch } from '@deltabox/toolchain/core';
import { logger, sectionConfig, type ToolchainWatchConfig } from '@deltabox/toolchain/shared';

import { defaultSyncTasks } from '../../sync.js';
import { rootCliProgram } from '../engine.js';
import { baseOptions, watchOptions } from './shared.js';

/** `dbx watch` — sync once, then re-sync on input changes. */
export function watchCommand() {
    const {
        commands: [command],
    } = rootCliProgram.create(cmd => [
        cmd('watch')
            .description('Sync once, then watch key files and re-sync on change.')
            .globalOptions(baseOptions)
            .option({
                flags: '--force',
                description: 'Run even when no dbx.config.* is present.',
            })
            .option({
                flags: '--list',
                description:
                    'Print the resolved input globs (+ tsconfig file names) instead of watching.',
            })
            .option({ flags: '--json', description: 'With --list: print the inputs as JSON.' })
            .run(async ({ config, values: opts, context }) => {
                const watch = sectionConfig<ToolchainWatchConfig>(config);
                if (opts.list) {
                    // What `dbx watch` (and the VS Code auto-sync) should watch: the
                    // config file plus the active tasks' inputs, with configured
                    // file names (eg. a custom `tsconfig.defaultFile`) resolved.
                    const inputs = await resolveWatchInputFiles({
                        cwd: context.cwd,
                        config: context.config,
                        projectType: context.projectType,
                        tasks: defaultSyncTasks(),
                        ...(watch?.exclude !== undefined ? { exclude: watch.exclude } : {}),
                        ...(watch?.gitignore !== undefined ? { gitignore: watch.gitignore } : {}),
                    });
                    if (opts.json) {
                        logger.raw(JSON.stringify(inputs, null, 4));
                    } else {
                        for (const glob of inputs.globs) logger.info(glob);
                    }
                    return;
                }
                if (!context.managed && !opts.force && !context.noConfig) {
                    logger.warn(
                        'no dbx.config.* found here; nothing to watch (use --force to run anyway, or --configless to manage configless projects).'
                    );
                    return;
                }
                if (config === false || watch?.enabled === false) {
                    logger.warn('watch is disabled in the config.');
                    return;
                }
                await runWatch({
                    ...watchOptions(context, config),
                    quiet: Boolean(opts.quiet),
                });
            }),
    ]);
    return command;
}
