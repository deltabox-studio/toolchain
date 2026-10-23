import fs from 'node:fs';
import path from 'node:path';

import { renderBiomeJson } from '@deltabox/toolchain-biome';
import type { GeneratedFile, ProjectType, Replacements } from '@deltabox/toolchain-shared';
import {
    type MonorepoWorkspace,
    renderMonorepoTsconfig,
    renderTsconfigBase,
    renderTsconfigBuild,
    renderTsconfigDefault,
} from '@deltabox/toolchain-tsconfig';

import rootPkg from '../../../package.json' with { type: 'json' };
import { renderPnpmWorkspace, renderYarnrc, supportsCatalogs } from './catalogs.js';

/**
 * The dev dependencies every scaffolded package gets, pinned to the toolchain's
 * own current versions. When the chosen package manager supports catalogs
 * (yarn/pnpm/bun) the generated root also writes the catalog file and the
 * dependencies reference `catalog:`; otherwise they are pinned inline (so a
 * fresh consumer never sees a dangling `catalog:`).
 */
const CATALOG: Record<string, string> = {
    '@biomejs/biome': '^2.5.13',
    '@deltabox/toolchain': `^${rootPkg.version}`,
    tsdown: '^0.23.0',
    typescript: '^6.0.3',
    vitest: '^5.0.0',
};

/** The catalog a scaffolded root writes into its package-manager file. */
export const SCAFFOLD_CATALOG = CATALOG;

/**
 * Default package-manager versions used when a scaffold does not specify one.
 * A `packageManager` field must carry a version (corepack rejects a bare name),
 * so the scaffold always writes `<pm>@<version>`.
 */
export const DEFAULT_PACKAGE_MANAGER_VERSIONS: Record<string, string> = {
    yarn: '4.17.1',
    pnpm: '10.11.1',
    npm: '11.19.0',
    bun: '1.3.0',
};

/** The `<pm>@<version>` string for a scaffold (uses the default when unknown). */
function packageManagerField(
    packageManager: string | undefined,
    version: string | undefined
): string | undefined {
    if (!packageManager) return undefined;
    const resolved = version ?? DEFAULT_PACKAGE_MANAGER_VERSIONS[packageManager];
    return resolved ? `${packageManager}@${resolved}` : packageManager;
}

/** The dev-dependency map for a package manager (catalog refs or pinned). */
function devDependencies(
    packageManager: string | undefined,
    catalogDefined: boolean
): Record<string, string> {
    if (!catalogDefined) return { ...CATALOG };
    return Object.fromEntries(Object.keys(CATALOG).map(name => [name, 'catalog:']));
}

/**
 * Whether the scaffold writes a catalog the dependencies can reference. Bun's
 * catalog lives in `package.json` `workspaces.catalog`, which only a monorepo
 * root writes — a single Bun project has nowhere to declare it, so it pins.
 */
function catalogDefined(packageManager: string | undefined, isMonorepo: boolean): boolean {
    const pm = packageManager ?? 'yarn';
    if (!supportsCatalogs(pm)) return false;
    if (pm === 'bun') return isMonorepo;
    return true;
}

/** The package-manager catalog file(s) a scaffolded root should write. */
function catalogFiles(packageManager: string | undefined, isMonorepo: boolean): GeneratedFile[] {
    switch (packageManager ?? 'yarn') {
        case 'yarn':
            return [{ path: '.yarnrc.yml', content: renderYarnrc({ packages: CATALOG }) }];
        case 'pnpm':
            return [
                {
                    path: 'pnpm-workspace.yaml',
                    content: renderPnpmWorkspace(
                        { packages: CATALOG },
                        isMonorepo ? ['packages/*'] : undefined
                    ),
                },
            ];
        default:
            // npm has no catalogs; Bun's live in `package.json` (below).
            return [];
    }
}

/** The `workspaces` field for Bun (an object carrying the catalog), else array. */
function workspacesField(
    packageManager: string | undefined,
    globs: string[]
): string[] | Record<string, unknown> {
    if ((packageManager ?? 'yarn') === 'bun') {
        return { packages: globs, catalog: CATALOG };
    }
    return globs;
}

/** The replacement values a project scaffold understands. */
export interface ProjectContext {
    /** The project/package name (unscoped). */
    name: string;
    /** The npm scope, eg. `@acme`. */
    scope?: string;
    /** Package author. */
    author?: string;
    /** SPDX license id. */
    license?: string;
    /** Repository URL. */
    repoUrl?: string;
    /** Node engine range. */
    nodeVersion?: string;
    /** Yarn version. */
    yarnVersion?: string;
    /** Package manager name. */
    packageManager?: string;
    /** The project kind written into the scaffolded `dbx.config.ts`. */
    type?: ProjectType;
    /** Write a `dbx.config.ts` (default true). */
    includeConfig?: boolean;
}

/** The token replacements derived from a {@link ProjectContext}. */
function tokens(ctx: ProjectContext): Replacements {
    return { ...ctx };
}

const json = (value: unknown, indent = 4): string => `${JSON.stringify(value, null, indent)}\n`;

/**
 * Render a `dbx.config.ts` scaffold (toolchain settings under `toolchain`). The
 * `project.type` lets the sync know whether the folder is a monorepo root, a
 * workspace, or a single project.
 */
export function renderToolchainConfig(ctx: ProjectContext & { type: ProjectType }): string {
    const entries: [string, string][] = [
        ['type', ctx.type],
        ['name', ctx.name],
    ];
    if (ctx.scope) entries.push(['scope', ctx.scope]);
    if (ctx.author) entries.push(['author', ctx.author]);
    if (ctx.license) entries.push(['license', ctx.license]);
    if (ctx.repoUrl) entries.push(['repo', ctx.repoUrl]);
    entries.push(['nodeVersion', ctx.nodeVersion ?? '22']);
    const packageManager = ctx.packageManager ?? 'yarn';
    entries.push(['packageManager', packageManager]);
    // Always pair the manager with a version: a bare `packageManager` breaks
    // corepack, and `project` sync mirrors this into package.json.
    const pmVersion = ctx.yarnVersion ?? DEFAULT_PACKAGE_MANAGER_VERSIONS[packageManager];
    if (pmVersion) entries.push(['packageManagerVersion', pmVersion]);

    const project = entries
        .map(([key, value]) => `            ${key}: ${JSON.stringify(value)},`)
        .join('\n');

    // Sections are opt-in by presence, so the scaffold only declares `project`
    // (its own identity). A consumer enables `changelog`, `biome`, `tsconfig`,
    // `watch`, ... themselves — the generated config stays generic.
    return `import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: {
${project}
        },
    },
});
`;
}

/** A minimal tsconfig.json that extends the default template. */
export function renderWorkspaceTsconfig(composite = false): string {
    return json({ extends: './tsconfig.default.json', compilerOptions: { composite } });
}

/** Files for a single-package TypeScript project (tsconfig + tooling). */
export function createRootProjectFiles(ctx: ProjectContext): GeneratedFile[] {
    const pkg = {
        name: ctx.scope ? `${ctx.scope}/${ctx.name}` : ctx.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        description: '',
        ...(ctx.author ? { author: ctx.author } : {}),
        ...(ctx.license ? { license: ctx.license } : {}),
        scripts: {
            build: 'tsdown',
            format: 'biome format --write .',
            lint: 'biome check --fix .',
            test: 'vitest run',
            typecheck: 'tsc -p tsconfig.json --noEmit',
        },
        devDependencies: devDependencies(
            ctx.packageManager,
            catalogDefined(ctx.packageManager, false)
        ),
        ...(packageManagerField(ctx.packageManager, ctx.yarnVersion)
            ? { packageManager: packageManagerField(ctx.packageManager, ctx.yarnVersion) }
            : {}),
        engines: { node: ctx.nodeVersion ? `>=${ctx.nodeVersion}` : '>=22' },
    };

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'dbx.config.ts',
                      content: renderToolchainConfig({ ...ctx, type: ctx.type ?? 'project' }),
                  },
              ]),
        { path: 'package.json', content: json(pkg) },
        { path: 'tsconfig.base.json', content: renderTsconfigBase(tokens(ctx)) },
        { path: 'tsconfig.default.json', content: renderTsconfigDefault(tokens(ctx)) },
        { path: 'tsconfig.build.json', content: renderTsconfigBuild(tokens(ctx)) },
        { path: 'tsconfig.json', content: renderWorkspaceTsconfig() },
        { path: 'biome.json', content: renderBiomeJson(tokens(ctx)) },
        { path: '.gitignore', content: renderGitignore() },
        { path: 'README.md', content: `# ${ctx.name}\n` },
        ...catalogFiles(ctx.packageManager, false),
    ];
}

export interface MonorepoRootContext extends ProjectContext {
    /** The workspaces to wire into the monorepo tsconfig. */
    workspaces: MonorepoWorkspace[];
    /** The workspace globs (default `['packages/*']`). */
    workspaceGlobs?: string[];
}

/** Files for a monorepo root (workspaces + monorepo tsconfig). */
export function createMonorepoRootFiles(ctx: MonorepoRootContext): GeneratedFile[] {
    const pkg = {
        name: ctx.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        ...(ctx.author ? { author: ctx.author } : {}),
        ...(ctx.license ? { license: ctx.license } : {}),
        workspaces: workspacesField(ctx.packageManager, ctx.workspaceGlobs ?? ['packages/*']),
        devDependencies: devDependencies(
            ctx.packageManager,
            catalogDefined(ctx.packageManager, true)
        ),
        ...(packageManagerField(ctx.packageManager, ctx.yarnVersion)
            ? { packageManager: packageManagerField(ctx.packageManager, ctx.yarnVersion) }
            : {}),
        engines: { node: ctx.nodeVersion ? `>=${ctx.nodeVersion}` : '>=22' },
    };

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'dbx.config.ts',
                      content: renderToolchainConfig({ ...ctx, type: ctx.type ?? 'monorepo-root' }),
                  },
              ]),
        { path: 'package.json', content: json(pkg) },
        { path: 'tsconfig.base.json', content: renderTsconfigBase(tokens(ctx)) },
        {
            path: 'tsconfig.workspaces.json',
            content: renderMonorepoTsconfig({
                scope: ctx.scope ?? ctx.name,
                workspaces: ctx.workspaces,
            }),
        },
        { path: 'biome.json', content: renderBiomeJson(tokens(ctx)) },
        { path: '.gitignore', content: renderGitignore() },
        { path: 'README.md', content: `# ${ctx.name}\n` },
        ...catalogFiles(ctx.packageManager, true),
    ];
}

export interface WorkspaceContext extends ProjectContext {
    /** The workspace name (unscoped), eg. `core`. */
    wsName: string;
    /** The workspace directory relative to the root, eg. `packages/core`. */
    wsDir: string;
    /** Reference the root catalog for dev deps (`catalog:`) instead of pinning. */
    useCatalog?: boolean;
}

/** Files for a monorepo workspace package. */
export function createWorkspaceFiles(ctx: WorkspaceContext): GeneratedFile[] {
    const dev = ctx.useCatalog ? devDependencies(ctx.packageManager, true) : { ...CATALOG };
    const pkg = {
        name: ctx.scope ? `${ctx.scope}/${ctx.wsName}` : ctx.wsName,
        version: '0.1.0',
        type: 'module',
        files: ['dist'],
        scripts: {
            build: 'tsdown',
            format: 'biome format --write .',
            lint: 'biome check --fix .',
            test: 'vitest run',
            typecheck: 'tsc -p tsconfig.build.json --noEmit',
        },
        devDependencies: dev,
        publishConfig: { access: 'public', provenance: true },
    };

    const base = ctx.wsDir.split('/').length;

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'dbx.config.ts',
                      content: renderToolchainConfig({
                          ...ctx,
                          type: ctx.type ?? 'monorepo-workspace',
                      }),
                  },
              ]),
        { path: 'package.json', content: json(pkg) },
        {
            path: 'tsconfig.default.json',
            content: json({
                extends: `${'../'.repeat(base)}tsconfig.base.json`,
                compilerOptions: {
                    module: 'NodeNext',
                    moduleResolution: 'NodeNext',
                    types: ['node'],
                },
                include: ['src', 'tests', 'tsdown.config.ts', 'vitest.config.ts'],
            }),
        },
        { path: 'tsconfig.build.json', content: renderWorkspaceTsconfig() },
        { path: 'tsconfig.json', content: renderWorkspaceTsconfig() },
        {
            path: 'tsdown.config.ts',
            content: `import { defineConfig } from 'tsdown';\n\nimport { baseTsdownConfig } from '@deltabox/toolchain/tsdown';\n\nexport default defineConfig({\n    ...baseTsdownConfig,\n    entry: { index: 'src/index.ts' },\n});\n`,
        },
    ];
}

/** A generic `.gitignore`. */
export function renderGitignore(): string {
    return [
        'node_modules/',
        'dist/',
        'coverage/',
        '.turbo/',
        '*.tsbuildinfo',
        '',
        '.env',
        '.env.*',
        '!.env.example',
        '!.env.example.*',
        '',
        '.DS_Store',
        '',
        '# Yarn 4',
        '.pnp.*',
        '.yarn/*',
        '!.yarn/patches',
        '!.yarn/plugins',
        '!.yarn/releases',
        '!.yarn/sdks',
        '!.yarn/versions',
        '',
    ].join('\n');
}

/** Write generated files under `cwd`, creating directories as needed. */
export function writeGeneratedFiles(files: GeneratedFile[], cwd = process.cwd()): string[] {
    const written: string[] = [];
    for (const file of files) {
        const target = path.resolve(cwd, file.path);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, file.content, 'utf-8');
        written.push(target);
    }
    return written;
}
