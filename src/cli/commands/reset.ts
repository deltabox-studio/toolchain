import { resetProjects } from '@deltabox/toolchain/core';
import { logger, withSpinner } from '@deltabox/toolchain/shared';
import { restoreTsconfigOverrides } from '@deltabox/toolchain/tsconfig';

import { rootCliProgram } from '../engine.js';

/** `dbx reset` — remove a project's generated files, manifest and/or config. */
export function resetCommand() {
    const {
        commands: [command],
    } = rootCliProgram.create(cmd => [
        cmd('reset')
            .description(
                'Remove generated files, the .dbx/toolchain manifest and/or the dbx config from a project.'
            )
            .options([
                { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
                {
                    flags: '--recursive',
                    description: 'Reset every discovered project under the root.',
                },
                '--include <pattern...>',
                '--exclude <pattern...>',
                {
                    flags: '--generated',
                    description: 'Remove only the generated/managed files.',
                },
                {
                    flags: '--manifest',
                    description: 'Remove only the .dbx/toolchain directory.',
                },
                { flags: '--config', description: 'Also remove dbx.config.*.' },
                {
                    flags: '--all',
                    description: 'Remove generated files, the manifest and the config.',
                },
                {
                    flags: '--dry-run',
                    description: 'Report what would be removed without deleting.',
                },
                { flags: '--json', description: 'Print the result as JSON.' },
            ])
            .run(async ({ values: opts, context }) => {
                const root = (opts.cwd as string | undefined) ?? context.cwd;
                const selectors = opts.all
                    ? { generated: true, manifest: true, config: true }
                    : {
                          ...(opts.generated ? { generated: true } : {}),
                          ...(opts.manifest ? { manifest: true } : {}),
                          ...(opts.config ? { config: true } : {}),
                      };

                const dryRun = Boolean(opts.dryRun);
                const result = await withSpinner(
                    async () =>
                        resetProjects({
                            root,
                            recursive: Boolean(opts.recursive),
                            dryRun,
                            // Revert `tsconfig.overrides` while the manifest snapshots still exist.
                            restore: (cwd, { dryRun }) =>
                                restoreTsconfigOverrides({
                                    cwd,
                                    dryRun,
                                    warn: (message, id) => logger.warn(message, id),
                                }).restored,
                            ...selectors,
                            ...(opts.include ? { include: opts.include } : {}),
                            ...(opts.exclude ? { exclude: opts.exclude } : {}),
                        }),
                    {
                        start: dryRun
                            ? 'Checking generated files...'
                            : 'Removing generated files...',
                        success: dryRun ? 'Checked generated files.' : 'Removed generated files.',
                    }
                );

                if (opts.json) {
                    logger.raw(JSON.stringify(result, null, 4));
                    return;
                }

                const verb = result.dryRun ? 'would remove' : 'removed';
                let total = 0;
                for (const entry of result.results) {
                    if (entry.removed.length === 0 && entry.restored.length === 0) continue;
                    total += entry.removed.length;
                    logger.info(`${entry.rel === '.' ? root : entry.rel}`);
                    for (const file of entry.restored)
                        logger.info(`  ~ ${file} (overrides reverted)`);
                    for (const file of entry.removed) logger.info(`  - ${file}`);
                    for (const file of entry.skipped) {
                        logger.warn(`  ! ${file} (outside the project root; skipped)`);
                    }
                }
                logger.info(`${verb} ${total} item(s) across ${result.results.length} project(s).`);
            }),
    ]);
    return command;
}
