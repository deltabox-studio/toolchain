import { logger, type ToolchainCommand } from '@deltabox/toolchain-shared';

import { runWorkflows } from '../run-workflows.js';
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
                    description: 'Workflow ids or file names (default: every enabled workflow).',
                    variadic: true,
                    required: false,
                },
            ],
            options: [
                { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
                { flags: '--ref <ref>', description: 'Git ref to run the workflow on.' },
                { flags: '--gh <cmd>', description: 'The gh executable (default: gh).' },
            ],
            run: async (opts, context) => {
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
                    flags: '--processing-method <method>',
                    description: '`latest` (default), `all`, or a git range.',
                },
                { flags: '--format-only', description: 'Only regroup existing changelogs.' },
                {
                    flags: '--no-package-changes-section',
                    description: 'Skip the package-changes footer.',
                },
            ],
            run: opts => {
                const argv: string[] = [];
                if (opts.range) argv.push('--range', String(opts.range));
                if (opts.dryRun) argv.push('--dry-run');
                if (opts.version) argv.push('--version', String(opts.version));
                if (opts.baseVersion) argv.push('--base-version', String(opts.baseVersion));
                if (opts.processingMethod) {
                    argv.push('--processing-method', String(opts.processingMethod));
                }
                if (opts.formatOnly) argv.push('--format-only');
                if (opts.packageChangesSection === false) {
                    argv.push('--no-package-changes-section');
                }
                runChangelog(argv);
            },
        },
    ];
}
