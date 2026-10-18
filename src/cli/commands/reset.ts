import { resetProjects } from '@deltabox/toolchain-core';
import { logger, type ToolchainCommand } from '@deltabox/toolchain-shared';

/** `dbx reset` — remove a project's generated files, manifest and/or config. */
export function resetCommand(): ToolchainCommand {
    return {
        name: 'reset',
        description:
            'Remove generated files, the .dbx/toolchain manifest and/or the dbx config from a project.',
        options: [
            { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
            { flags: '--recursive', description: 'Reset every discovered project under the root.' },
            {
                flags: '--include <pattern...>',
                description: 'Only projects matching these patterns (glob or substring).',
            },
            {
                flags: '--exclude <pattern...>',
                description: 'Skip projects matching these patterns (glob or substring).',
            },
            { flags: '--generated', description: 'Remove only the generated/managed files.' },
            { flags: '--manifest', description: 'Remove only the .dbx/toolchain directory.' },
            { flags: '--config', description: 'Also remove dbx.config.*.' },
            { flags: '--all', description: 'Remove generated files, the manifest and the config.' },
            { flags: '--dry-run', description: 'Report what would be removed without deleting.' },
            { flags: '--json', description: 'Print the result as JSON.' },
        ],
        run: (opts, context) => {
            const root = (opts.cwd as string | undefined) ?? context.cwd;
            const selectors = opts.all
                ? { generated: true, manifest: true, config: true }
                : {
                      ...(opts.generated ? { generated: true } : {}),
                      ...(opts.manifest ? { manifest: true } : {}),
                      ...(opts.config ? { config: true } : {}),
                  };

            const result = resetProjects({
                root,
                recursive: Boolean(opts.recursive),
                dryRun: Boolean(opts.dryRun),
                ...selectors,
                ...(opts.include ? { include: opts.include as string[] } : {}),
                ...(opts.exclude ? { exclude: opts.exclude as string[] } : {}),
            });

            if (opts.json) {
                logger.raw(JSON.stringify(result, null, 4));
                return;
            }

            const verb = result.dryRun ? 'would remove' : 'removed';
            let total = 0;
            for (const entry of result.results) {
                if (entry.removed.length === 0) continue;
                total += entry.removed.length;
                logger.info(`${entry.rel === '.' ? root : entry.rel}`);
                for (const file of entry.removed) logger.info(`  - ${file}`);
            }
            logger.info(`${verb} ${total} item(s) across ${result.results.length} project(s).`);
        },
    };
}
