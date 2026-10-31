import path from 'node:path';

import { loadToolchainConfig } from '@deltabox/toolchain-core';
import {
    logger,
    type ProjectType,
    type Replacements,
    sectionConfig,
    type ToolchainCommand,
    type ToolchainCommandContext,
} from '@deltabox/toolchain-shared';
import { tsconfigFileNames, type TsconfigExtendsOptions } from '@deltabox/toolchain-tsconfig';

import { hasCatalog } from '../catalogs.js';
import { generateProjectConfigs } from '../config.js';
import {
    createMonorepoRootFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
    findRootOxcFiles,
    SCAFFOLD_CATALOG,
    upsertWorkspaceTsconfig,
    writeGeneratedFiles,
} from '../typescript.js';

const CONFIG_OPTIONS = [
    { flags: '--no-config', description: 'Skip the dbx.config.ts file.' },
    {
        flags: '--type <type>',
        description: 'Project type: project | monorepo-root | monorepo-workspace.',
    },
    { flags: '--force', description: 'Overwrite existing files in the output directory.' },
];

/** The package manager to scaffold for (writes a catalog file when supported). */
const PACKAGE_MANAGER_OPTION = {
    flags: '--package-manager <pm>',
    description: 'Package manager: yarn (default) | pnpm | npm | bun.',
};

/** The valid `project.type` values. */
const PROJECT_TYPES: ProjectType[] = ['project', 'monorepo-root', 'monorepo-workspace'];

/** Read a token as a non-empty string. */
function tokenText(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
}

/** The project metadata a scaffold inherits from the resolved tokens. */
function projectDefaults(
    tokens: Replacements,
    options: { description?: boolean } = {}
): Record<string, string> {
    const description = tokenText(tokens.description);
    return {
        ...(options.description !== false && description ? { description } : {}),
        ...(tokenText(tokens.author) ? { author: tokenText(tokens.author)! } : {}),
        ...(tokenText(tokens.license) ? { license: tokenText(tokens.license)! } : {}),
        ...(tokenText(tokens.homepage) ? { homepage: tokenText(tokens.homepage)! } : {}),
        ...(tokenText(tokens.repo) ? { repo: tokenText(tokens.repo)! } : {}),
        ...(tokenText(tokens.nodeVersion) ? { nodeVersion: tokenText(tokens.nodeVersion)! } : {}),
    };
}

/** Resolve the scaffold's package manager (+ its matching version). */
function scaffoldPackageManager(
    opts: Record<string, unknown>,
    tokens: Replacements
): Record<string, string> {
    const configured = tokenText(tokens.packageManager);
    const packageManager = (opts.packageManager as string | undefined) ?? configured ?? 'yarn';
    const version =
        packageManager === configured
            ? (tokenText(tokens.packageManagerVersion) ?? tokenText(tokens.yarnVersion))
            : undefined;
    return {
        packageManager,
        ...(version ? { packageManagerVersion: version } : {}),
    };
}

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
                const scope = (opts.scope as string | undefined) ?? tokenText(context.tokens.scope);
                const files = createRootProjectFiles({
                    ...projectDefaults(context.tokens),
                    name,
                    ...(scope ? { scope } : {}),
                    ...scaffoldPackageManager(opts, context.tokens),
                    type: resolveType(opts, 'project'),
                    includeConfig: context.noConfig
                        ? false
                        : ((opts.config as boolean | undefined) ?? true),
                    rootOxc: findRootOxcFiles(out),
                    ...(tsconfigExtends ? { tsconfigExtends } : {}),
                });
                const written = writeGeneratedFiles(files, out, { force: Boolean(opts.force) });
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
                const scope =
                    (opts.scope as string | undefined) ??
                    tokenText(context.tokens.scope) ??
                    `@${name}`;
                const includeConfig = context.noConfig
                    ? false
                    : ((opts.config as boolean | undefined) ?? true);
                const rootType = resolveType(opts, 'monorepo-root');
                const withExample = Boolean(opts.example);
                const packageManager = scaffoldPackageManager(opts, context.tokens);
                const tsconfigExtends = scaffoldTsconfigExtends(context.config);

                const files = createMonorepoRootFiles({
                    ...projectDefaults(context.tokens),
                    name,
                    scope,
                    type: rootType,
                    includeConfig,
                    ...packageManager,
                    ...(tsconfigExtends ? { tsconfigExtends } : {}),
                    workspaces: withExample ? [{ alias: 'core', dir: 'packages/core' }] : [],
                });
                if (withExample) {
                    files.push(
                        ...createWorkspaceFiles({
                            ...projectDefaults(context.tokens, { description: false }),
                            name,
                            scope,
                            wsName: 'core',
                            wsDir: 'packages/core',
                            type: 'monorepo-workspace',
                            includeConfig,
                            useCatalog: true,
                            ...packageManager,
                            ...(tsconfigExtends ? { tsconfigExtends } : {}),
                        }).map(f => ({ ...f, path: `packages/core/${f.path}` }))
                    );
                }
                const written = writeGeneratedFiles(files, out, { force: Boolean(opts.force) });
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
            run: async (opts, context) => {
                const root = (opts.root as string | undefined) ?? context.cwd;
                // `--root` may point at a different monorepo than the cwd; use that
                // root's config/tokens (scope, package manager, author, ...), not the cwd's.
                const loaded =
                    path.resolve(root) === path.resolve(context.cwd)
                        ? { config: context.config, tokens: context.tokens }
                        : await loadToolchainConfig(root, {
                              tolerant: true,
                              skipHooks: true,
                              ...(context.noConfig ? { noConfig: true } : {}),
                          });
                const { config, tokens: rootTokens } = loaded;
                const workspaceName = String(opts.name ?? '').trim();
                if (!workspaceName) {
                    throw new Error(
                        'a workspace name is required: pass `--name <name>` (the root project name is not the workspace name).'
                    );
                }
                const name = resolveName(workspaceName, root);
                const rootName = tokenText(rootTokens.name) ?? path.basename(path.resolve(root));
                const scope =
                    (opts.scope as string | undefined) ??
                    tokenText(rootTokens.scope) ??
                    `@${rootName}`;
                const wsDir = ((opts.dir as string | undefined) ?? `packages/${name}`)
                    .replace(/\\/g, '/')
                    .replace(/\/+$/, '');
                const includeConfig = context.noConfig
                    ? false
                    : ((opts.config as boolean | undefined) ?? true);
                const type = resolveType(opts, 'monorepo-workspace');
                const packageManager = scaffoldPackageManager(opts, rootTokens);
                const tsconfigExtends = scaffoldTsconfigExtends(config);

                const files = createWorkspaceFiles({
                    ...projectDefaults(rootTokens, { description: false }),
                    name,
                    scope,
                    wsName: name,
                    wsDir,
                    type,
                    includeConfig,
                    useCatalog: hasCatalog(
                        root,
                        packageManager.packageManager,
                        Object.keys(SCAFFOLD_CATALOG)
                    ),
                    ...packageManager,
                    ...(tsconfigExtends ? { tsconfigExtends } : {}),
                }).map(file => ({ ...file, path: `${wsDir}/${file.path}` }));

                const written = writeGeneratedFiles(files, root, { force: Boolean(opts.force) });
                upsertWorkspaceTsconfig(
                    root,
                    { alias: name, dir: wsDir },
                    scope,
                    tsconfigFileNames(config).rootFile
                );
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
