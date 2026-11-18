import fs from 'node:fs';
import path from 'node:path';

import {
    buildProjectGraph,
    loadToolchainConfig,
    type ManagedFormatSetting,
    orderProjects,
    runSync,
    runWatch,
    writeProjectGraph,
} from '@deltabox/toolchain/core';
import { logger, type ToolchainCommand, withSpinner } from '@deltabox/toolchain/shared';

import { defaultSyncTasks } from '../../sync.js';
import { getConfigSelection } from '../config-selection.js';
import { baseOptions, watchOptions } from './shared.js';

/** The CLI `--format*` flags as a `sync.format` override. */
function formatSetting(opts: Record<string, unknown>): ManagedFormatSetting | undefined {
    const setting: Exclude<ManagedFormatSetting, boolean> = {};
    if (opts.format === false) setting.enabled = false;
    if (opts.formatFix === false) setting.fix = false;
    if (typeof opts.formatCommand === 'string' && opts.formatCommand) {
        setting.command = opts.formatCommand;
    }
    if (Array.isArray(opts.formatExclude) && opts.formatExclude.length > 0) {
        setting.exclude = opts.formatExclude as string[];
    }
    return Object.keys(setting).length > 0 ? setting : undefined;
}

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
                description:
                    'Sync every managed project in dependency order (nested workspaces included; configless projects only with --configless).',
            },
            {
                flags: '--force',
                description: 'Run even when no dbx.config.* is present.',
            },
            {
                flags: '--only <tasks>',
                description: 'Only run the named sync task(s), comma-separated (eg. `tsconfig`).',
            },
            {
                flags: '--no-format',
                description: 'Do not format the written managed files.',
            },
            {
                flags: '--no-format-fix',
                description: 'Run the formatter in check mode instead of rewriting the files.',
            },
            {
                flags: '--format-command <command>',
                description:
                    'Override the managed-file formatter command (`{files}` expands to the files).',
            },
            {
                flags: '--format-exclude <glob...>',
                description: 'Managed files to leave unformatted (repeatable globs).',
                multiple: true,
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
            const only =
                typeof opts.only === 'string'
                    ? opts.only
                          .split(',')
                          .map(name => name.trim())
                          .filter(Boolean)
                    : undefined;
            const format = formatSetting(opts);

            if (opts.recursive && opts.watch) {
                throw new Error(
                    '`--recursive` cannot be combined with `--watch` yet; run `dbx watch` in each project instead.'
                );
            }

            if (context.configError) {
                if (json) {
                    logger.raw(
                        JSON.stringify(
                            { results: [], upToDate: false, error: context.configError },
                            null,
                            4
                        )
                    );
                } else {
                    logger.error(context.configError);
                }
                process.exitCode = 1;
                return;
            }

            if (opts.recursive) {
                const graph = buildProjectGraph(context.cwd);
                if (!check) writeProjectGraph(context.cwd, graph);
                const results: { dir: string; result: Awaited<ReturnType<typeof runSync>> }[] = [];
                const selection = getConfigSelection();
                // Order every project (not only the config-bearing ones) so an
                // opted-in configless workspace still syncs after its dependencies.
                // The root runs last: its tsconfig/auto tasks aggregate the
                // workspace metadata, so later workspace writes must not undo it.
                const ordered = orderProjects(graph.projects);
                const rootIndex = ordered.indexOf('.');
                if (rootIndex >= 0) ordered.push(...ordered.splice(rootIndex, 1));
                for (const relDir of ordered) {
                    const dir = path.resolve(context.cwd, relDir);
                    const loaded = await loadToolchainConfig(dir, { tolerant: true, ...selection });
                    if (loaded.error) {
                        logger.error(loaded.error);
                        process.exitCode = 1;
                        continue;
                    }
                    // A configless project is skipped unless it was opted in.
                    if (!loaded.managed) continue;
                    const result = await withSpinner(
                        () =>
                            runSync({
                                tasks: defaultSyncTasks(),
                                only,
                                cwd: dir,
                                projectType: loaded.projectType,
                                config: loaded.config,
                                ownConfig: loaded.ownConfig,
                                tokens: loaded.tokens,
                                ...(loaded.plugin ? { plugin: true } : {}),
                                check,
                                quiet,
                                ...(format ? { format } : {}),
                            }),
                        {
                            start: `Syncing ${relDir === '.' ? 'the root' : relDir}...`,
                            success: `Synced ${relDir === '.' ? 'the root' : relDir}.`,
                            enabled: quiet ? false : undefined,
                        }
                    );
                    results.push({ dir: relDir, result });
                    if (check && !result.upToDate) process.exitCode = 1;
                }
                const unmanaged = check && results.length === 0 && graph.projects.length > 0;
                if (unmanaged) {
                    logger.error('no managed projects found; nothing to sync.');
                    process.exitCode = 1;
                }
                if (json) {
                    logger.raw(
                        JSON.stringify(
                            {
                                results,
                                ...(unmanaged
                                    ? { upToDate: false, error: 'no managed projects found' }
                                    : {}),
                            },
                            null,
                            4
                        )
                    );
                }
                return;
            }

            if (!context.managed && !opts.force && !context.noConfig) {
                const message =
                    'no dbx config or plugin found here; nothing to sync (use --force to run anyway, or --configless to manage configless projects).';
                // A directory that looks like a project must not pass a check
                // silently just because nothing is managed.
                const looksLikeProject = fs.existsSync(path.join(context.cwd, 'package.json'));
                if (check && looksLikeProject) {
                    logger.error(message);
                    process.exitCode = 1;
                } else {
                    logger.warn(message);
                }
                if (json) {
                    logger.raw(
                        JSON.stringify(
                            {
                                results: [],
                                upToDate: !(check && looksLikeProject),
                                ...(check && looksLikeProject ? { error: message } : {}),
                            },
                            null,
                            4
                        )
                    );
                }
                return;
            }

            if (opts.watch) {
                await runWatch({
                    ...watchOptions(context),
                    only,
                    quiet,
                    ...(format ? { format } : {}),
                });
                return;
            }

            const result = await withSpinner(
                () =>
                    runSync({
                        ...watchOptions(context),
                        only,
                        check,
                        quiet,
                        ...(format ? { format } : {}),
                    }),
                { start: 'Syncing...', success: 'Synced.', enabled: quiet ? false : undefined }
            );
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
