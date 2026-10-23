import {
    logger,
    type ProjectType,
    type ToolchainCommand,
    type ToolchainCommandContext,
} from '@deltabox/toolchain-shared';

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

/** The package manager to scaffold for (writes a catalog file when supported). */
const PACKAGE_MANAGER_OPTION = {
    flags: '--package-manager <pm>',
    description: 'Package manager: yarn (default) | pnpm | npm | bun.',
};

/** The valid `project.type` values. */
const PROJECT_TYPES: ProjectType[] = ['project', 'monorepo-root', 'monorepo-workspace'];

/**
 * Resolve the project name for a scaffold. A name is **required**: it comes from
 * `--name` or `project.name` in `dbx.config.*`, otherwise the scaffold fails.
 */
function requireName(
    opts: Record<string, unknown>,
    config: ToolchainCommandContext['config']
): string {
    const name = String(opts.name ?? config.project?.name ?? '').trim();
    if (!name) {
        throw new Error(
            'a project name is required: pass `--name <name>` or set `project.name` in dbx.config.*.'
        );
    }
    return name;
}

/**
 * Resolve + validate the project type for a scaffold. An explicit `--type` (or
 * `project.type` in the config) must be one of {@link PROJECT_TYPES}; otherwise
 * the command's implied default is used.
 */
function resolveType(
    opts: Record<string, unknown>,
    config: ToolchainCommandContext['config'],
    fallback: ProjectType
): ProjectType {
    const type = (opts.type as string | undefined) ?? config.project?.type ?? fallback;
    if (!PROJECT_TYPES.includes(type as ProjectType)) {
        throw new Error(
            `invalid project type "${type}" (expected one of: ${PROJECT_TYPES.join(', ')}).`
        );
    }
    return type as ProjectType;
}

/** Build the project scaffolding commands. */
export function projectCommands(): ToolchainCommand[] {
    return [
        {
            name: 'project:init',
            description: 'Scaffold a single-package TypeScript project.',
            options: [
                { flags: '-n, --name <name>', description: 'Project name.' },
                { flags: '-s, --scope <scope>', description: 'npm scope, eg. @acme.' },
                { flags: '-o, --out <dir>', description: 'Output directory (default: cwd).' },
                PACKAGE_MANAGER_OPTION,
                ...CONFIG_OPTIONS,
            ],
            run: (opts, context) => {
                const name = requireName(opts, context.config);
                const files = createRootProjectFiles({
                    name,
                    ...(opts.scope ? { scope: opts.scope as string } : {}),
                    ...(opts.packageManager
                        ? { packageManager: opts.packageManager as string }
                        : {}),
                    type: resolveType(opts, context.config, 'project'),
                    includeConfig: (opts.config as boolean | undefined) ?? true,
                });
                const written = writeGeneratedFiles(files, (opts.out as string) ?? context.cwd);
                for (const file of written) logger.info(`Created ${file}`);
            },
        },
        {
            name: 'project:init:monorepo',
            description: 'Scaffold a monorepo root (add --example for one example workspace).',
            options: [
                { flags: '-n, --name <name>', description: 'Project name.' },
                { flags: '-s, --scope <scope>', description: 'npm scope, eg. @acme.' },
                { flags: '-o, --out <dir>', description: 'Output directory (default: cwd).' },
                { flags: '--example', description: 'Also scaffold one example workspace package.' },
                PACKAGE_MANAGER_OPTION,
                ...CONFIG_OPTIONS,
            ],
            run: (opts, context) => {
                const name = requireName(opts, context.config);
                const scope = (opts.scope as string) ?? context.config.project?.scope ?? `@${name}`;
                const out = (opts.out as string) ?? context.cwd;
                const includeConfig = (opts.config as boolean | undefined) ?? true;
                const rootType = resolveType(opts, context.config, 'monorepo-root');
                const withExample = Boolean(opts.example);
                const packageManager = opts.packageManager as string | undefined;

                const files = createMonorepoRootFiles({
                    name,
                    scope,
                    type: rootType,
                    includeConfig,
                    ...(packageManager ? { packageManager } : {}),
                    workspaces: withExample ? [{ alias: 'core', dir: 'packages/core' }] : [],
                });
                if (withExample) {
                    files.push(
                        ...createWorkspaceFiles({
                            name,
                            scope,
                            wsName: 'core',
                            wsDir: 'packages/core',
                            type: 'monorepo-workspace',
                            includeConfig,
                            useCatalog: true,
                            ...(packageManager ? { packageManager } : {}),
                        }).map(f => ({ ...f, path: `packages/core/${f.path}` }))
                    );
                }
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
                PACKAGE_MANAGER_OPTION,
                ...CONFIG_OPTIONS,
            ],
            run: (opts, context) => {
                const root = (opts.root as string | undefined) ?? context.cwd;
                const name = requireName(opts, context.config);
                const scope =
                    (opts.scope as string | undefined) ??
                    context.config.project?.scope ??
                    `@${name}`;
                const wsDir = ((opts.dir as string | undefined) ?? `packages/${name}`)
                    .replace(/\\/g, '/')
                    .replace(/\/+$/, '');
                const includeConfig = (opts.config as boolean | undefined) ?? true;
                const type = resolveType(opts, context.config, 'monorepo-workspace');
                const packageManager = opts.packageManager as string | undefined;

                const files = createWorkspaceFiles({
                    name,
                    scope,
                    wsName: name,
                    wsDir,
                    type,
                    includeConfig,
                    ...(packageManager ? { packageManager } : {}),
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
