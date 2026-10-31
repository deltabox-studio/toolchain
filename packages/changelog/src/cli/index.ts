import { logger, resolveChangelogConfig, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { runWorkflows, workflowTargets } from '../run-workflows.js';
import { runChangelog } from '../run.js';

/** Build the changelog commands (`changelog`, `workflow`). */
export function changelogCommands(): ToolchainCommand[] {
    return [
        {
            name: 'workflow',
            description: 'Trigger one or more generated GitHub workflows (via `gh workflow run`).',
            args: [
                {
                    name: 'workflows',
                    description:
                        'Workflow ids, custom ids, or file names (default: every enabled workflow).',
                    variadic: true,
                    required: false,
                },
            ],
            options: [
                { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
                { flags: '--ref <ref>', description: 'Git ref to run the workflow on.' },
                { flags: '--gh <cmd>', description: 'The gh executable (default: gh).' },
                {
                    flags: '--list',
                    description: 'List the enabled workflows (and where they are written).',
                },
                { flags: '--json', description: 'With --list: print the workflows as JSON.' },
            ],
            run: async (opts, context) => {
                if (opts.list) {
                    const targets = workflowTargets(context.config);
                    if (opts.json) {
                        logger.raw(JSON.stringify(targets, null, 4));
                        return;
                    }
                    if (targets.length === 0) {
                        logger.info('no workflows are enabled.');
                        return;
                    }
                    for (const target of targets) {
                        logger.info(`  ${target.id.padEnd(20)} ${target.path}`);
                    }
                    return;
                }
                const raw = opts.workflows;
                const workflows = Array.isArray(raw)
                    ? (raw as string[])
                    : raw
                      ? [String(raw)]
                      : undefined;
                const result = await runWorkflows({
                    cwd: (opts.cwd as string | undefined) ?? context.cwd,
                    config: context.config,
                    ...(workflows ? { workflows } : {}),
                    ...(opts.ref ? { ref: opts.ref as string } : {}),
                    ...(opts.gh ? { gh: opts.gh as string } : {}),
                });
                let failed = false;
                for (const workflow of result.ran) {
                    if (workflow.code === 0) {
                        logger.info(`triggered ${workflow.file}`);
                    } else {
                        failed = true;
                        logger.error(`${workflow.file} exited ${workflow.code}`);
                    }
                }
                if (failed) process.exitCode = 1;
            },
        },
        {
            name: 'changelog',
            description:
                'Scan commits, derive the semver bump and update the CHANGELOG.md files + versions.',
            options: [
                { flags: '--range <range>', description: 'Git revision range to scan.' },
                { flags: '--dry-run', description: 'Print the proposed entry without writing.' },
                { flags: '--version <semver>', description: 'Override the version.' },
                {
                    flags: '--base-version <semver>',
                    description: 'Bump from this version instead.',
                },
                {
                    flags: '--release-notes <semver>',
                    description: 'Print the release body for this version and exit.',
                },
                {
                    flags: '--processing-method <method>',
                    description: '`latest` (default), `all`, or a git range.',
                },
                { flags: '--format-only', description: 'Only regroup existing changelogs.' },
                {
                    flags: '--no-package-changes-section',
                    description: 'Skip the package-changes footer.',
                },
            ],
            run: (opts, context) => {
                const argv: string[] = [];
                if (opts.range) argv.push('--range', String(opts.range));
                if (opts.dryRun) argv.push('--dry-run');
                if (opts.version) argv.push('--version', String(opts.version));
                if (opts.baseVersion) argv.push('--base-version', String(opts.baseVersion));
                if (opts.releaseNotes) {
                    argv.push('--release-notes', String(opts.releaseNotes));
                }
                if (opts.processingMethod) {
                    argv.push('--processing-method', String(opts.processingMethod));
                }
                if (opts.formatOnly) argv.push('--format-only');
                if (opts.packageChangesSection === false) {
                    argv.push('--no-package-changes-section');
                }
                runChangelog(argv, resolveChangelogConfig(context.config));
            },
        },
    ];
}
