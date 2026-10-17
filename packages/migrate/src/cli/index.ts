import path from 'node:path';

import { logger, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { diffFiles, hasPending } from '../check.js';
import { detectMigrations, listMigrations, migrations } from '../registry.js';
import type { MigrateTarget } from '../types.js';

/**
 * `dbx migrate` — convert a project's tooling config from another
 * tool (Biome / ESLint / Prettier / Dprint) to Ox (Oxfmt / Oxlint), or fold a
 * hand-written `vite.config.*` into `dbx.config.*`. Dry-run by default; pass
 * `--write` to apply, or `--check` for a CI gate.
 */
export function migrateCommands(): ToolchainCommand[] {
    return [
        {
            name: 'migrate',
            description:
                'Migrate Biome / ESLint / Prettier / Dprint config to Ox, or fold vite.config.* into dbx.config.',
            options: [
                {
                    flags: '--from <tool>',
                    description: 'Source tool: biome | eslint | prettier | dprint | vite | all.',
                },
                { flags: '--to <tool>', description: 'Target tool (default: ox).', default: 'ox' },
                { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
                { flags: '--write', description: 'Write the files (default: dry-run).' },
                { flags: '--dry-run', description: 'Do not write anything (default).' },
                { flags: '--check', description: 'CI: exit non-zero when the ox config is stale.' },
                { flags: '--target <target>', description: 'files (default) | vite.' },
                { flags: '--online', description: 'Allow network (e.g. @oxlint/migrate).' },
                { flags: '--json', description: 'Print the result as JSON.' },
            ],
            run: async (opts, context) => {
                const cwd = (opts.cwd as string | undefined) ?? context.cwd;
                const check = Boolean(opts.check);
                const write = Boolean(opts.write) && !opts.dryRun && !check;
                const online = Boolean(opts.online);
                const from = opts.from as string | undefined;
                const target = (opts.target as MigrateTarget | undefined) ?? 'files';
                const selected =
                    !from || from === 'all'
                        ? detectMigrations(cwd)
                        : migrations().filter(migration => migration.from === from);

                if (selected.length === 0) {
                    logger.info(
                        from && from !== 'all'
                            ? `no "${from}" migration is registered.`
                            : 'nothing to migrate (no Biome/ESLint/Prettier/Dprint/vite config detected).'
                    );
                    return;
                }

                const results = [];
                for (const migration of selected)
                    results.push(await migration.run({ cwd, write, online, target }));

                if (check) {
                    const diffs = results.flatMap(result => diffFiles(result.files ?? []));
                    const pending = diffs.filter(diff => diff.status !== 'same');
                    if (opts.json) {
                        logger.raw(JSON.stringify(results, null, 4));
                    } else if (pending.length) {
                        for (const diff of pending)
                            logger.info(
                                `${diff.status}  ${path.relative(cwd, diff.path) || diff.path}`
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

                if (opts.json) {
                    logger.raw(JSON.stringify(results, null, 4));
                    return;
                }
                for (const result of results) {
                    logger.info(
                        `${result.from} -> ${result.to} ${write ? 'wrote' : 'would write'}`
                    );
                    for (const file of result.written)
                        logger.info(`  ${write ? '+' : '?'} ${file}`);
                    for (const note of result.notes ?? []) logger.info(`  ${note}`);
                    if (result.unmapped?.length) {
                        logger.info(`  unmapped (${result.unmapped.length}):`);
                        for (const item of result.unmapped.slice(0, 25))
                            logger.info(`    - ${item.source}: ${item.reason}`);
                    }
                }
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
