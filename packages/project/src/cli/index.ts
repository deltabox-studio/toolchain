import { logger, type ProjectType, type ToolingCommand } from '@deltabox/toolchain-shared';

import { generateProjectConfigs } from '../config.js';
import {
    createMonorepoRootFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
    writeGeneratedFiles,
} from '../typescript.js';

const CONFIG_OPTIONS = [
    { flags: '--no-config', description: 'Skip the dbx.config.ts file.' },
    {
        flags: '--type <type>',
        description: 'Project type: project | monorepo-root | monorepo-workspace.',
    },
];

/** Build the project scaffolding commands. */
export function projectCommands(): ToolingCommand[] {
    return [
        {
            name: 'project:init',
            description: 'Scaffold a single-package TypeScript project.',
            options: [
                { flags: '-n, --name <name>', description: 'Project name.' },
                { flags: '-s, --scope <scope>', description: 'npm scope, eg. @acme.' },
                { flags: '-o, --out <dir>', description: 'Output directory (default: cwd).' },
                ...CONFIG_OPTIONS,
            ],
            run: (opts, context) => {
                const name = String(opts.name ?? context.config.project?.name ?? 'app');
                const files = createRootProjectFiles({
                    name,
                    ...(opts.scope ? { scope: opts.scope as string } : {}),
                    type: (opts.type as ProjectType | undefined) ?? 'project',
                    includeConfig: (opts.config as boolean | undefined) ?? true,
                });
                const written = writeGeneratedFiles(files, (opts.out as string) ?? context.cwd);
                for (const file of written) logger.info(`Created ${file}`);
            },
        },
        {
            name: 'project:init:monorepo',
            description: 'Scaffold a monorepo root + one example workspace.',
            options: [
                { flags: '-n, --name <name>', description: 'Project name.' },
                { flags: '-s, --scope <scope>', description: 'npm scope, eg. @acme.' },
                { flags: '-o, --out <dir>', description: 'Output directory (default: cwd).' },
                ...CONFIG_OPTIONS,
            ],
            run: (opts, context) => {
                const name = String(opts.name ?? context.config.project?.name ?? 'monorepo');
                const scope = (opts.scope as string) ?? context.config.project?.scope ?? `@${name}`;
                const out = (opts.out as string) ?? context.cwd;
                const includeConfig = (opts.config as boolean | undefined) ?? true;
                const rootType = (opts.type as ProjectType | undefined) ?? 'monorepo-root';

                const files = createMonorepoRootFiles({
                    name,
                    scope,
                    type: rootType,
                    includeConfig,
                    workspaces: [{ alias: 'core', dir: 'packages/core' }],
                });
                files.push(
                    ...createWorkspaceFiles({
                        name,
                        scope,
                        wsName: 'core',
                        wsDir: 'packages/core',
                        type: 'monorepo-workspace',
                        includeConfig,
                    }).map(f => ({ ...f, path: `packages/core/${f.path}` }))
                );
                const written = writeGeneratedFiles(files, out);
                for (const file of written) logger.info(`Created ${file}`);
            },
        },
        {
            name: 'project:init:workspace',
            description: 'Scaffold a monorepo workspace package into an existing monorepo root.',
            options: [
                { flags: '-n, --name <name>', description: 'Workspace package name (unscoped).' },
                { flags: '-s, --scope <scope>', description: 'npm scope, eg. @acme.' },
                { flags: '-r, --root <dir>', description: 'Monorepo root (default: cwd).' },
                {
                    flags: '-d, --dir <dir>',
                    description: 'Workspace dir relative to the root (default: packages/<name>).',
                },
                ...CONFIG_OPTIONS,
            ],
            run: (opts, context) => {
                const root = (opts.root as string | undefined) ?? context.cwd;
                const name = String(opts.name ?? 'workspace');
                const scope =
                    (opts.scope as string | undefined) ??
                    context.config.project?.scope ??
                    `@${name}`;
                const wsDir = ((opts.dir as string | undefined) ?? `packages/${name}`)
                    .replace(/\\/g, '/')
                    .replace(/\/+$/, '');
                const includeConfig = (opts.config as boolean | undefined) ?? true;
                const type = (opts.type as ProjectType | undefined) ?? 'monorepo-workspace';

                const files = createWorkspaceFiles({
                    name,
                    scope,
                    wsName: name,
                    wsDir,
                    type,
                    includeConfig,
                }).map(file => ({ ...file, path: `${wsDir}/${file.path}` }));

                const written = writeGeneratedFiles(files, root);
                for (const file of written) logger.info(`Created ${file}`);
            },
        },
        {
            name: 'project:config',
            description: 'Generate dbx.config.ts for existing projects that are missing one.',
            options: [
                { flags: '--cwd <dir>', description: 'Root to scan (default: cwd).' },
                {
                    flags: '--include <pattern...>',
                    description: 'Only projects matching these patterns (glob or substring).',
                },
                {
                    flags: '--exclude <pattern...>',
                    description: 'Skip projects matching these patterns (glob or substring).',
                },
                { flags: '--type <type>', description: 'Force a project type for every config.' },
                { flags: '--force', description: 'Overwrite configs that already exist.' },
                {
                    flags: '--dry-run',
                    description: 'Report what would be written without writing.',
                },
                { flags: '--json', description: 'Print the result as JSON.' },
            ],
            run: (opts, context) => {
                const root = (opts.cwd as string | undefined) ?? context.cwd;
                const result = generateProjectConfigs({
                    root,
                    ...(opts.include ? { include: opts.include as string[] } : {}),
                    ...(opts.exclude ? { exclude: opts.exclude as string[] } : {}),
                    ...(opts.type ? { type: opts.type as ProjectType } : {}),
                    force: Boolean(opts.force),
                    dryRun: Boolean(opts.dryRun),
                });

                if (opts.json) {
                    logger.raw(JSON.stringify(result, null, 4));
                    return;
                }
                const verb = result.dryRun ? 'would create' : 'created';
                logger.info(
                    `${verb} ${result.created.length} config(s), skipped ${result.skipped.length}.`
                );
                for (const config of result.configs) {
                    if (!config.created) continue;
                    logger.info(
                        `  + ${config.rel === '.' ? 'dbx.config.ts' : `${config.rel}/dbx.config.ts`}  [${config.type}]`
                    );
                }
            },
        },
    ];
}
