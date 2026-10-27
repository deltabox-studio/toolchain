import path from 'node:path';

import {
    buildProjectGraph,
    loadToolchainConfig,
    runSync,
    runWatch,
    writeProjectGraph,
} from '@deltabox/toolchain-core';
import { logger, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { defaultSyncTasks } from '../../sync.js';
import { getConfigSelection } from '../config-selection.js';
import { baseOptions, watchOptions } from './shared.js';

/** `dbx sync` — regenerate managed files (single, recursive, or watch). */
export function syncCommand(): ToolchainCommand {
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
            {
                flags: '--json',
                description: 'Print the sync result (including removed files) as JSON.',
            },
        ],
        run: async (opts, context) => {
            const json = Boolean(opts.json);
            const quiet = Boolean(opts.quiet) || json;
            const check = Boolean(opts.check);

            if (context.configError) {
                logger.error(context.configError);
                process.exitCode = 1;
                return;
            }

            if (opts.recursive) {
                const graph = buildProjectGraph(context.cwd);
                if (!check) writeProjectGraph(context.cwd, graph);
                const results: { dir: string; result: Awaited<ReturnType<typeof runSync>> }[] = [];
                const selection = getConfigSelection();
                for (const relDir of graph.order) {
                    const dir = path.resolve(context.cwd, relDir);
                    const loaded = await loadToolchainConfig(dir, { tolerant: true, ...selection });
                    if (loaded.error) {
                        logger.error(loaded.error);
                        process.exitCode = 1;
                        continue;
                    }
                    const result = await runSync({
                        tasks: defaultSyncTasks(),
                        cwd: dir,
                        projectType: loaded.projectType,
                        config: loaded.config,
                        ownConfig: loaded.ownConfig,
                        tokens: loaded.tokens,
                        check,
                        quiet,
                    });
                    results.push({ dir: relDir, result });
                    if (check && !result.upToDate) process.exitCode = 1;
                }
                if (json) logger.raw(JSON.stringify({ results }, null, 4));
                return;
            }

            if (!context.configPath && !opts.force && !context.noConfig) {
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

            // Keep the project graph fresh for the IDE/other tools (`--check`
            // must not write anything).
            if (!check) {
                try {
                    writeProjectGraph(context.cwd, buildProjectGraph(context.cwd));
                } catch {
                    // best-effort
                }
            }
            if (json) logger.raw(JSON.stringify(result, null, 4));
        },
    };
}
