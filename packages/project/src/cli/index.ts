import path from 'node:path';

import {
    logger,
    type ProjectType,
    sectionConfig,
    type ToolchainCommand,
    type ToolchainCommandContext,
} from '@deltabox/toolchain-shared';
import type { TsconfigExtendsOptions } from '@deltabox/toolchain-tsconfig';

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
 * Resolve a scaffold name: a name of `.` means "use the directory I am being
 * created in", so it becomes that directory's basename (eg. `--name . --out
 * ./my-app` → `my-app`).
 */
function resolveName(name: string, dir: string): string {
    return name === '.' ? path.basename(path.resolve(dir)) : name;
}

/**
 * Resolve + validate the project type for a scaffold: an explicit `--type` wins,
 * otherwise the command's implied default is used.
 *
 * The loaded config's `project.type` is deliberately **ignored**: a scaffold runs
 * with the config of the directory it is invoked from, which is usually the
 * *parent* (a monorepo root when adding a workspace). Honouring it would tag the
 * new project with the wrong kind — eg. a workspace scaffolded as
 * `monorepo-root`, which then generates root-only CI/husky/vscode files inside
 * the workspace.
 */
function resolveType(opts: Record<string, unknown>, fallback: ProjectType): ProjectType {
    const type = (opts.type as string | undefined) ?? fallback;
    if (!PROJECT_TYPES.includes(type as ProjectType)) {
        throw new Error(
            `invalid project type "${type}" (expected one of: ${PROJECT_TYPES.join(', ')}).`
        );
    }
    return type as ProjectType;
}

/** The `tsconfig.extends` overrides to write into scaffolded tsconfig templates. */
function scaffoldTsconfigExtends(
    config: ToolchainCommandContext['config']
): TsconfigExtendsOptions | undefined {
    const tsconfig = sectionConfig(config.tsconfig) as
        | { extends?: TsconfigExtendsOptions }
        | undefined;
    return tsconfig?.extends;
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
                const out = (opts.out as string) ?? context.cwd;
                const name = resolveName(requireName(opts, context.config), out);
                const tsconfigExtends = scaffoldTsconfigExtends(context.config);
                const files = createRootProjectFiles({
                    name,
                    ...(opts.scope ? { scope: opts.scope as string } : {}),
                    ...(opts.packageManager
                        ? { packageManager: opts.packageManager as string }
                        : {}),
                    type: resolveType(opts, 'project'),
                    includeConfig: (opts.config as boolean | undefined) ?? true,
                    ...(tsconfigExtends ? { tsconfigExtends } : {}),
                });
                const written = writeGeneratedFiles(files, out);
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
                const out = (opts.out as string) ?? context.cwd;
                const name = resolveName(requireName(opts, context.config), out);
                const scope = (opts.scope as string) ?? context.config.project?.scope ?? `@${name}`;
                const includeConfig = (opts.config as boolean | undefined) ?? true;
                const rootType = resolveType(opts, 'monorepo-root');
                const withExample = Boolean(opts.example);
                const packageManager = opts.packageManager as string | undefined;
                const tsconfigExtends = scaffoldTsconfigExtends(context.config);

                const files = createMonorepoRootFiles({
                    name,
                    scope,
                    type: rootType,
                    includeConfig,
                    ...(packageManager ? { packageManager } : {}),
                    ...(tsconfigExtends ? { tsconfigExtends } : {}),
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
                            ...(tsconfigExtends ? { tsconfigExtends } : {}),
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
                const name = resolveName(requireName(opts, context.config), root);
                const scope =
                    (opts.scope as string | undefined) ??
                    context.config.project?.scope ??
                    `@${name}`;
                const wsDir = ((opts.dir as string | undefined) ?? `packages/${name}`)
                    .replace(/\\/g, '/')
                    .replace(/\/+$/, '');
                const includeConfig = (opts.config as boolean | undefined) ?? true;
                const type = resolveType(opts, 'monorepo-workspace');
                const packageManager = opts.packageManager as string | undefined;
                const tsconfigExtends = scaffoldTsconfigExtends(context.config);

                const files = createWorkspaceFiles({
                    name,
                    scope,
                    wsName: name,
                    wsDir,
                    type,
                    includeConfig,
                    ...(packageManager ? { packageManager } : {}),
                    ...(tsconfigExtends ? { tsconfigExtends } : {}),
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
                    if (config.vite) {
                        logger.info(
                            config.vite.folded
                                ? `    vite: folded ${path.basename(config.vite.path)} into toolchain.vite (run \`dbx sync\`)`
                                : `    vite: left ${path.basename(config.vite.path)} alone (${config.vite.error})`
                        );
                    }
                }
            },
        },
    ];
}
