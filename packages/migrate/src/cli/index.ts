import path from 'node:path';

import { cancel, isCancel, multiselect } from '@clack/prompts';

import { loadToolchainConfig, runSync, selectProjects } from '@deltabox/toolchain-core';
import { logger, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { diffFiles, hasPending } from '../check.js';
import { listMigrations, migrations } from '../registry.js';
import type { MigrationResult, MigrateTarget } from '../types.js';

/** Whether we may prompt (an interactive terminal, not `--json`). */
function canPrompt(opts: Record<string, unknown>): boolean {
    return Boolean(process.stdin.isTTY && process.stdout.isTTY) && opts.json !== true;
}

/** Print a clack cancel line and mark the run as failed. */
function abortPrompt(): void {
    cancel('Cancelled.');
    process.exitCode = 1;
}

/**
 * `dbx migrate` — convert a project's tooling config from another
 * tool (Biome / ESLint / Prettier / Dprint) to Oxc (Oxfmt / Oxlint), or fold a
 * hand-written `vite.config.*` into `dbx.config.*`. Dry-run by default; pass
 * `--write` to apply, or `--check` for a CI gate.
 *
 * `--recursive` migrates the discovered projects under the root (not just the
 * root); on an interactive terminal it prompts for which projects (multi-select,
 * with an "All projects" option).
 */
export function migrateCommands(): ToolchainCommand[] {
    return [
        {
            name: 'migrate',
            description:
                'Migrate Biome / ESLint / Prettier / Dprint / Oxc config, or fold vite.config.* into dbx.config.',
            options: [
                {
                    flags: '--from <tool>',
                    description:
                        'Source tool (repeatable): biome | eslint | prettier | dprint | oxc | vite | all.',
                    multiple: true,
                },
                {
                    flags: '--to <tool>',
                    description: 'Target tool (default: oxc).',
                    default: 'oxc',
                },
                { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
                {
                    flags: '--recursive',
                    description:
                        'Also migrate the discovered projects under the root (default: root only).',
                },
                { flags: '--write', description: 'Write the files (default: dry-run).' },
                { flags: '--dry-run', description: 'Do not write anything (default).' },
                {
                    flags: '--check',
                    description: 'CI: exit non-zero when the oxc config is stale.',
                },
                { flags: '--target <target>', description: 'files (default) | vite.' },
                { flags: '--online', description: 'Allow network (e.g. @oxlint/migrate).' },
                {
                    flags: '--ignore-vite-config-file',
                    description: 'Do not remove the folded `vite.config.*`.',
                },
                {
                    flags: '--ignore-managed-files',
                    description:
                        'Skip the post-migration sync (leave the toolchain-managed files as-is).',
                },
                {
                    flags: '--ignore-changelog',
                    description: 'Skip the changelog task in the post-migration sync.',
                },
                { flags: '--json', description: 'Print the result as JSON.' },
            ],
            run: async (opts, context) => {
                const root = (opts.cwd as string | undefined) ?? context.cwd;
                const check = Boolean(opts.check);
                const write = Boolean(opts.write) && !opts.dryRun && !check;
                const online = Boolean(opts.online);
                const fromRaw = opts.from as string | string[] | undefined;
                const fromList = Array.isArray(fromRaw) ? fromRaw : fromRaw ? [fromRaw] : [];
                const fromAll = fromList.includes('all');
                const selectedFrom = fromList.filter(value => value !== 'all');
                const matchesFrom = (migration: { from: string }): boolean =>
                    fromList.length === 0 || fromAll || selectedFrom.includes(migration.from);
                const target = (opts.target as MigrateTarget | undefined) ?? 'files';
                const recursive = Boolean(opts.recursive);

                // The migrations that both match `--from` (or every migration for
                // `all`/none) **and** are detected in `dir`.
                const pickFor = (dir: string) =>
                    migrations().filter(
                        migration => matchesFrom(migration) && migration.detect(dir)
                    );

                // The project dirs to migrate. Without `--recursive` that is the
                // root only; with it, every discovered project that has a
                // detected source (optionally narrowed by an interactive prompt).
                let dirs = [root];
                if (recursive) {
                    const candidates = selectProjects({ root }).filter(
                        project => pickFor(project.dir).length > 0
                    );
                    if (candidates.length === 0) {
                        logger.info(`nothing to migrate under ${root}.`);
                        return;
                    }
                    let chosen = candidates;
                    if (canPrompt(opts)) {
                        const picked = await multiselect({
                            message: 'Which projects should I migrate?',
                            required: true,
                            options: [
                                { value: '__all__', label: 'All projects' },
                                ...candidates.map(project => ({
                                    value: project.dir,
                                    label: project.rel === '.' ? path.basename(root) : project.rel,
                                    ...(project.name ? { hint: project.name } : {}),
                                })),
                            ],
                        });
                        if (isCancel(picked)) {
                            abortPrompt();
                            return;
                        }
                        const values = picked as string[];
                        chosen = values.includes('__all__')
                            ? candidates
                            : candidates.filter(project => values.includes(project.dir));
                    }
                    dirs = chosen.map(project => project.dir);
                }

                const results: { dir: string; result: MigrationResult }[] = [];
                for (const dir of dirs) {
                    for (const migration of pickFor(dir))
                        results.push({
                            dir,
                            result: await migration.run({
                                cwd: dir,
                                write,
                                online,
                                target,
                                ignoreViteConfigFile: Boolean(opts.ignoreViteConfigFile),
                                ignoreManagedFiles: Boolean(opts.ignoreManagedFiles),
                                ignoreChangelog: Boolean(opts.ignoreChangelog),
                            }),
                        });
                }

                if (results.length === 0) {
                    // Distinguish "no such migration" from "the migration is
                    // registered but the source config was not found" (eg. an
                    // already-managed `vite.config.ts` shim).
                    const registered = migrations().some(migration => matchesFrom(migration));
                    logger.info(
                        selectedFrom.length > 0 && !fromAll && !registered
                            ? `no migration registered for: ${selectedFrom.join(', ')}.`
                            : 'nothing to migrate (no Biome/ESLint/Prettier/Dprint/Oxc/vite config detected).'
                    );
                    return;
                }

                const prefix = (dir: string): string =>
                    recursive ? `${path.relative(root, dir) || '.'}: ` : '';

                // The projects whose config a migration actually changed — the
                // only ones the post-migration sync needs to refresh.
                const changedDirs = [
                    ...new Set(
                        results
                            .filter(
                                ({ result }) =>
                                    result.written.length > 0 || (result.removed?.length ?? 0) > 0
                            )
                            .map(({ dir }) => dir)
                    ),
                ];

                if (check) {
                    const diffs = results.flatMap(({ result }) => diffFiles(result.files ?? []));
                    const pending = diffs.filter(diff => diff.status !== 'same');
                    if (opts.json) {
                        logger.raw(
                            JSON.stringify(
                                results.map(r => r.result),
                                null,
                                4
                            )
                        );
                    } else if (pending.length) {
                        for (const diff of pending)
                            logger.info(
                                `${diff.status}  ${path.relative(root, diff.path) || diff.path}`
                            );
                        logger.info(
                            `${pending.length} file(s) out of date — run \`migrate --write\` to apply.`
                        );
                    } else {
                        logger.info('up to date.');
                    }
                    if (hasPending(diffs)) process.exitCode = 1;
                    return;
                }

                // `--write` also regenerates the toolchain-managed files (the
                // post-migration sync), so a migrated project is immediately
                // consistent — eg. the `vite.config.ts` shim after folding a
                // hand-written config. `--ignore-managed-files` skips the whole
                // sync; `--ignore-changelog` drops the `changelog` task from it.
                const postSync = async (): Promise<void> => {
                    if (
                        !write ||
                        changedDirs.length === 0 ||
                        opts.ignoreManagedFiles ||
                        !context.syncTasks?.length
                    ) {
                        return;
                    }
                    const tasks = opts.ignoreChangelog
                        ? context.syncTasks.filter(task => task.name !== 'changelog')
                        : context.syncTasks;
                    for (const dir of changedDirs) {
                        const loaded = await loadToolchainConfig(dir);
                        if (!opts.json) logger.info(`${prefix(dir)}regenerating managed files.`);
                        await runSync({
                            tasks,
                            cwd: dir,
                            projectType: loaded.projectType,
                            config: loaded.config,
                            ownConfig: loaded.ownConfig,
                            tokens: loaded.tokens,
                            quiet: opts.json === true,
                        });
                    }
                };

                if (opts.json) {
                    await postSync();
                    logger.raw(
                        JSON.stringify(
                            results.map(r => r.result),
                            null,
                            4
                        )
                    );
                    return;
                }
                for (const { dir, result } of results) {
                    logger.info(
                        `${prefix(dir)}${result.from} -> ${result.to} ${write ? 'wrote' : 'would write'}`
                    );
                    for (const file of result.written)
                        logger.info(`  ${write ? '+' : '?'} ${file}`);
                    for (const file of result.removed ?? [])
                        logger.info(`  ${write ? '-' : '?'} ${file}`);
                    for (const note of result.notes ?? []) logger.info(`  ${note}`);
                    if (result.unmapped?.length) {
                        logger.info(`  unmapped (${result.unmapped.length}):`);
                        for (const item of result.unmapped.slice(0, 25))
                            logger.info(`    - ${item.source}: ${item.reason}`);
                    }
                }
                if (!write && changedDirs.length > 0 && !opts.ignoreManagedFiles) {
                    logger.info(
                        'managed files are regenerated after --write; pass --ignore-managed-files to skip.'
                    );
                }
                await postSync();
                if (!write) logger.info('dry-run — re-run with --write to apply.');
            },
        },
        {
            name: 'migrate:list',
            description: 'List the registered migrations and whether each is detected.',
            options: [
                { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
                { flags: '--json', description: 'Print as JSON.' },
            ],
            run: (opts, context) => {
                const cwd = (opts.cwd as string | undefined) ?? context.cwd;
                const infos = listMigrations(cwd);
                if (opts.json) {
                    logger.raw(JSON.stringify(infos, null, 4));
                    return;
                }
                for (const info of infos) {
                    logger.info(
                        `  ${info.id.padEnd(16)} ${info.from} -> ${info.to}  [${info.detected ? 'detected' : 'not found'}]`
                    );
                    logger.info(`    ${info.description}`);
                }
            },
        },
    ];
}
