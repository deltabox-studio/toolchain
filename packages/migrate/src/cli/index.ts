import path from 'node:path';

import type { ToolingCommand } from '@deltabox/toolchain-shared';

import { diffFiles, hasPending } from '../check.js';
import { detectMigrations, listMigrations, migrations } from '../registry.js';
import type { MigrateTarget } from '../types.js';

/**
 * `dbx migrate` — convert a project's tooling config from another
 * tool (Biome / ESLint / Prettier / Dprint) to Ox (Oxfmt / Oxlint). Dry-run by
 * default; pass `--write` to apply, or `--check` for a CI gate.
 */
export function migrateCommands(): ToolingCommand[] {
    return [
        {
            name: 'migrate',
            description:
                'Migrate Biome / ESLint / Prettier / Dprint config to Ox (oxlint + oxfmt).',
            options: [
                {
                    flags: '--from <tool>',
                    description: 'Source tool: biome | eslint | prettier | dprint | all.',
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
                    console.log(
                        from && from !== 'all'
                            ? `dbx: no "${from}" migration is registered.`
                            : 'dbx: nothing to migrate (no Biome/ESLint/Prettier/Dprint config detected).'
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
                        console.log(JSON.stringify(results, null, 4));
                    } else if (pending.length) {
                        for (const diff of pending)
                            console.log(
                                `dbx: ${diff.status}  ${path.relative(cwd, diff.path) || diff.path}`
                            );
                        console.log(
                            `dbx: ${pending.length} file(s) out of date — run \`migrate --write\` to apply.`
                        );
                    } else {
                        console.log('dbx: up to date.');
                    }
                    if (hasPending(diffs)) process.exitCode = 1;
                    return;
                }

                if (opts.json) {
                    console.log(JSON.stringify(results, null, 4));
                    return;
                }
                for (const result of results) {
                    console.log(
                        `dbx: ${result.from} -> ${result.to} ${write ? 'wrote' : 'would write'}`
                    );
                    for (const file of result.written)
                        console.log(`  ${write ? '+' : '?'} ${file}`);
                    for (const note of result.notes ?? []) console.log(`  ${note}`);
                    if (result.unmapped?.length) {
                        console.log(`  unmapped (${result.unmapped.length}):`);
                        for (const item of result.unmapped.slice(0, 25))
                            console.log(`    - ${item.source}: ${item.reason}`);
                    }
                }
                if (!write) console.log('dbx: dry-run — re-run with --write to apply.');
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
                    console.log(JSON.stringify(infos, null, 4));
                    return;
                }
                for (const info of infos) {
                    console.log(
                        `  ${info.id.padEnd(16)} ${info.from} -> ${info.to}  [${info.detected ? 'detected' : 'not found'}]`
                    );
                    console.log(`    ${info.description}`);
                }
            },
        },
    ];
}
