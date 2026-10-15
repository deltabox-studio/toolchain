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
export function renderToolingConfig(ctx: ProjectContext & { type: ProjectType }): string {
    const entries: [string, string][] = [
        ['type', ctx.type],
        ['name', ctx.name],
    ];
    if (ctx.scope) entries.push(['scope', ctx.scope]);
    if (ctx.author) entries.push(['author', ctx.author]);
    if (ctx.license) entries.push(['license', ctx.license]);
    if (ctx.repoUrl) entries.push(['repo', ctx.repoUrl]);
    entries.push(['nodeVersion', ctx.nodeVersion ?? '22']);
    entries.push(['packageManager', ctx.packageManager ?? 'yarn']);
    if (ctx.yarnVersion) entries.push(['packageManagerVersion', ctx.yarnVersion]);

    const project = entries
        .map(([key, value]) => `            ${key}: ${JSON.stringify(value)},`)
        .join('\n');

    // Sections are opt-in by presence; the `true` shorthand enables one with its
    // defaults, so the scaffold spells out the sections that apply here.
    const sections: string[] = [];
    if (ctx.type === 'monorepo-root' || ctx.type === 'project')
        sections.push('        changelog: true,');
    sections.push('        biome: true,');
    if (ctx.type === 'monorepo-root') sections.push('        tsconfig: true,');
    sections.push('        watch: true,');
    const body = sections.join('\n');

    return `import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
        project: {
${project}
        },
${body}
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
            build: 'tsdown --config-loader unrun',
            format: 'biome format --write .',
            lint: 'biome check --fix .',
            test: 'vitest run',
            typecheck: 'tsc -p tsconfig.json --noEmit',
        },
        devDependencies: {
            '@biomejs/biome': 'catalog:',
            tsdown: 'catalog:',
            typescript: 'catalog:',
            vitest: 'catalog:',
        },
        ...(ctx.packageManager ? { packageManager: ctx.packageManager } : {}),
        engines: { node: ctx.nodeVersion ? `>=${ctx.nodeVersion}` : '>=22' },
    };

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'dbx.config.ts',
                      content: renderToolingConfig({ ...ctx, type: ctx.type ?? 'project' }),
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
    ];
}

export interface MonorepoRootContext extends ProjectContext {
    /** The workspaces to wire into the monorepo tsconfig. */
    workspaces: MonorepoWorkspace[];
    /** The workspace globs (default `['packages/*']`). */
    workspaceGlobs?: string[];
}

/** Files for a monorepo root (workspaces + turbo + monorepo tsconfig). */
export function createMonorepoRootFiles(ctx: MonorepoRootContext): GeneratedFile[] {
    const pkg = {
        name: ctx.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        ...(ctx.author ? { author: ctx.author } : {}),
        ...(ctx.license ? { license: ctx.license } : {}),
        scripts: {
            build: 'turbo build',
            format: 'turbo format',
            lint: 'turbo lint',
            test: 'turbo test',
            typecheck: 'turbo typecheck',
        },
        workspaces: ctx.workspaceGlobs ?? ['packages/*'],
        devDependencies: {
            '@biomejs/biome': 'catalog:',
            tsdown: 'catalog:',
            turbo: '^2.11.2',
            typescript: 'catalog:',
            vitest: 'catalog:',
        },
        ...(ctx.packageManager ? { packageManager: ctx.packageManager } : {}),
        engines: { node: ctx.nodeVersion ? `>=${ctx.nodeVersion}` : '>=22' },
    };

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'dbx.config.ts',
                      content: renderToolingConfig({ ...ctx, type: ctx.type ?? 'monorepo-root' }),
                  },
              ]),
        { path: 'package.json', content: json(pkg) },
        { path: 'turbo.json', content: renderTurboJson() },
        { path: 'tsconfig.base.json', content: renderTsconfigBase(tokens(ctx)) },
        {
            path: 'tsconfig.monorepo.json',
            content: renderMonorepoTsconfig({
                scope: ctx.scope ?? ctx.name,
                workspaces: ctx.workspaces,
            }),
        },
        { path: 'biome.json', content: renderBiomeJson(tokens(ctx)) },
        { path: '.gitignore', content: renderGitignore() },
        { path: 'README.md', content: `# ${ctx.name}\n` },
    ];
}

export interface WorkspaceContext extends ProjectContext {
    /** The workspace name (unscoped), eg. `core`. */
    wsName: string;
    /** The workspace directory relative to the root, eg. `packages/core`. */
    wsDir: string;
}

/** Files for a monorepo workspace package. */
export function createWorkspaceFiles(ctx: WorkspaceContext): GeneratedFile[] {
    const pkg = {
        name: ctx.scope ? `${ctx.scope}/${ctx.wsName}` : ctx.wsName,
        version: '0.1.0',
        type: 'module',
        files: ['dist'],
        scripts: {
            build: 'tsdown --config-loader unrun',
            format: 'biome format --write .',
            lint: 'biome check --fix .',
            test: 'vitest run',
            typecheck: 'tsc -p tsconfig.build.json --noEmit',
        },
        publishConfig: { access: 'public', provenance: true },
    };

    const base = ctx.wsDir.split('/').length;

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'dbx.config.ts',
                      content: renderToolingConfig({
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
            content: `import { defineConfig } from 'tsdown';\n\nimport { baseTsdownConfig } from '@deltabox/toolchain-tsdown';\n\nexport default defineConfig({\n    ...baseTsdownConfig,\n    entry: { index: 'src/index.ts' },\n});\n`,
        },
    ];
}

/** The default monorepo turbo pipeline. */
export function renderTurboJson(): string {
    return json({
        $schema: 'https://turborepo.dev/schema.json',
        ui: 'stream-with-experimental-timestamps',
        globalDependencies: [
            'tsconfig.json',
            'tsconfig.base.json',
            'tsdown.config.ts',
            'yarn.lock',
        ],
        globalPassThroughEnv: ['NODE_ENV', 'VITE_*'],
        tasks: {
            build: {
                inputs: ['$TURBO_DEFAULT$', '.env*'],
                outputs: ['dist/**'],
                dependsOn: ['^lint', '^typecheck', '^test', '^build'],
            },
            format: { dependsOn: ['^format'] },
            lint: { dependsOn: ['^lint'] },
            typecheck: { dependsOn: ['^typecheck'] },
            test: { dependsOn: ['^test'] },
        },
    });
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
