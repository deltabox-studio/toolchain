import path from 'node:path';

import {
    buildProjectGraph,
    loadToolingConfig,
    runSync,
    runWatch,
    writeProjectGraph,
} from '@deltabox/toolchain-core';
import { logger, type ToolingCommand } from '@deltabox/toolchain-shared';

import { defaultSyncTasks } from '../../sync.js';
import { baseOptions, watchOptions } from './shared.js';

/** `dbx sync` — regenerate managed files (single, recursive, or watch). */
export function syncCommand(): ToolingCommand {
    return {
        name: 'sync',
        description: 'Regenerate every managed file from dbx.config.*.',
        options: [
            ...baseOptions,
            { flags: '--check', description: 'Do not write; fail if files are out of date.' },
            { flags: '--watch', description: 'Keep running and re-sync on change.' },
            {
                flags: '--recursive',
                description: 'Sync every discovered dbx project in dependency order.',
            },
            {
                flags: '--force',
                description: 'Run even when no dbx.config.* is present.',
            },
        ],
        run: async (opts, context) => {
            const quiet = Boolean(opts.quiet);
            const check = Boolean(opts.check);

            if (opts.recursive) {
                const graph = buildProjectGraph(context.cwd);
                writeProjectGraph(context.cwd, graph);
                for (const relDir of graph.order) {
                    const dir = path.resolve(context.cwd, relDir);
                    const loaded = await loadToolingConfig(dir);
                    const result = await runSync({
                        tasks: defaultSyncTasks(),
                        cwd: dir,
                        projectType: loaded.projectType,
                        config: loaded.config,
                        tokens: loaded.tokens,
                        check,
                        quiet,
                    });
                    if (check && !result.upToDate) process.exitCode = 1;
                }
                return;
            }

            if (!context.configPath && !opts.force) {
                logger.warn(
                    'no dbx.config.* found here; nothing to sync (use --force to run anyway).'
                );
                return;
            }

            if (opts.watch) {
                await runWatch({ ...watchOptions(context), quiet });
                return;
            }

            const result = await runSync({ ...watchOptions(context), check, quiet });
            if (check && !result.upToDate) process.exitCode = 1;

            // Keep the project graph fresh for the IDE/other tools.
            try {
                writeProjectGraph(context.cwd, buildProjectGraph(context.cwd));
            } catch {
                // best-effort
            }
        },
    };
}
