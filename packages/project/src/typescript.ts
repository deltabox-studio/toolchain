import fs from 'node:fs';
import path from 'node:path';

import { applyEdits, type FormattingOptions, modify } from 'jsonc-parser';

import {
    DEFAULT_PACKAGE_MANAGER_VERSIONS,
    defaultPackageManagerVersion,
    type GeneratedFile,
    projectToPackageJson,
    type ProjectType,
    type Replacements,
} from '@deltabox/toolchain/shared';
import {
    type MonorepoWorkspace,
    parseTsconfig,
    renderMonorepoTsconfig,
    renderTsconfigBase,
    renderTsconfigBuild,
    renderTsconfigDefault,
} from '@deltabox/toolchain/tsconfig';

import rootPkg from '../../../package.json' with { type: 'json' };
import { renderPnpmWorkspace, renderYarnrc, supportsCatalogs } from './catalogs.js';
import type {
    ConfigExtension,
    ConfigLanguage,
    MonorepoRootContext,
    PluginViteConfigOptions,
    ProjectContext,
    RootOxcFiles,
    WorkspaceContext,
    WriteGeneratedFilesOptions,
} from './types/index.js';

/**
 * The dev dependencies every scaffolded package gets, pinned to the toolchain's
 * own current versions. When the chosen package manager supports catalogs
 * (yarn/pnpm/bun) the generated root also writes the catalog file and the
 * dependencies reference `catalog:`; otherwise they are pinned inline (so a
 * fresh consumer never sees a dangling `catalog:`).
 */
const CATALOG: Record<string, string> = {
    '@deltabox/toolchain': rootPkg.version,
    '@types/node': '~22.10.2',
    typescript: '~6.0.3',
    'vite-plus': '1.2.0',
};

/** The catalog a scaffolded root writes into its package-manager file. */
export const SCAFFOLD_CATALOG = CATALOG;

export { DEFAULT_PACKAGE_MANAGER_VERSIONS };

/** The `<pm>@<version>` string for a scaffold (uses the default when unknown). */
function packageManagerField(
    packageManager: string | undefined,
    version: string | undefined
): string | undefined {
    if (!packageManager) return undefined;
    const resolved = version ?? defaultPackageManagerVersion(packageManager);
    return resolved ? `${packageManager}@${resolved}` : packageManager;
}

/**
 * The `packageManager` field a scaffold writes. Mirrors the inline config, which
 * always defaults to Yarn, so `dbx sync --check` is clean immediately.
 */
function scaffoldPackageManager(ctx: ProjectContext): string | undefined {
    return packageManagerField(
        ctx.packageManager ?? 'yarn',
        ctx.packageManagerVersion ?? ctx.yarnVersion
    );
}

/** The dev-dependency map for a package manager (catalog refs or pinned). */
function devDependencies(
    packageManager: string | undefined,
    catalogDefined: boolean,
    exclude: string[] = []
): Record<string, string> {
    const entries = Object.entries(CATALOG).filter(([name]) => !exclude.includes(name));
    if (!catalogDefined) return Object.fromEntries(entries);
    return Object.fromEntries(entries.map(([name]) => [name, 'catalog:']));
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

/**
 * The catalog a scaffold writes for a package manager. `undefined` when the
 * manager has no catalog file: npm has no catalog support, and Bun's lives in
 * `package.json` `workspaces.catalog` (handled by {@link workspacesField}).
 */
export function scaffoldCatalog(
    packageManager: string | undefined,
    exclude: string[] = []
): Record<string, string> | undefined {
    const pm = packageManager ?? 'yarn';
    if (pm !== 'yarn' && pm !== 'pnpm') return undefined;
    return Object.fromEntries(Object.entries(CATALOG).filter(([name]) => !exclude.includes(name)));
}

/** The package-manager catalog file(s) a scaffolded root should write. */
function catalogFiles(
    packageManager: string | undefined,
    isMonorepo: boolean,
    exclude: string[] = [],
    workspaceGlobs: string[] = ['packages/*']
): GeneratedFile[] {
    const catalog = scaffoldCatalog(packageManager, exclude);
    if (!catalog) return [];
    switch (packageManager ?? 'yarn') {
        case 'yarn':
            return [{ path: '.yarnrc.yml', content: renderYarnrc({ packages: catalog }) }];
        case 'pnpm':
            return [
                {
                    path: 'pnpm-workspace.yaml',
                    content: renderPnpmWorkspace(
                        { packages: catalog },
                        isMonorepo ? workspaceGlobs : undefined
                    ),
                },
            ];
        default:
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

/** Every supported generated config extension. */
export const CONFIG_EXTENSIONS = [
    'ts',
    'mts',
    'js',
    'mjs',
    'cjs',
] as const satisfies readonly ConfigExtension[];

/** The default generated config extension. */
export const DEFAULT_CONFIG_EXTENSION = 'ts' as const;

/** Whether a string is a supported generated config extension. */
export function isConfigExtension(value: string): value is ConfigExtension {
    return (CONFIG_EXTENSIONS as readonly string[]).includes(value);
}

/** The generated config file name for an extension. */
export function configFileName(extension: ConfigExtension = DEFAULT_CONFIG_EXTENSION): string {
    return `dbx.config.${extension}`;
}

/** The language a config extension belongs to. */
export function configLanguage(extension: ConfigExtension): ConfigLanguage {
    return extension === 'ts' || extension === 'mts' ? 'ts' : 'js';
}

/**
 * Pick the extension for a language. TypeScript defaults to `.ts`; JavaScript
 * follows the package's module kind (`.mjs` for ESM, `.cjs` for CJS, `.js` when
 * `type` is unset).
 */
export function resolveConfigExtension(
    language: ConfigLanguage,
    packageType?: string,
    explicit?: ConfigExtension
): ConfigExtension {
    if (explicit) return explicit;
    if (language === 'ts') return 'ts';
    if (packageType === 'module') return 'mjs';
    if (packageType === 'commonjs') return 'cjs';
    return 'js';
}

/** Whether a generated config uses ESM syntax (import/export vs `module.exports`). */
export function configUsesEsm(extension: ConfigExtension, packageType?: string): boolean {
    if (extension === 'cjs') return false;
    if (extension === 'mjs' || extension === 'mts') return true;
    if (extension === 'js') return packageType === 'module';
    return true;
}

/**
 * Find the nearest ancestor that owns Oxc config files. The walk stops at the
 * repository boundary (`.git`) so a nested project cannot inherit files from an
 * unrelated checkout above it.
 *
 * A v3 project declares `fmt`/`lint` in its toolchain config instead of
 * standalone files, so an ancestor `dbx.config.*` (or a `vite.config.*` that
 * uses the `dbx()` plugin) also counts as an owner when it declares either
 * section.
 */
export function findRootOxcFiles(start: string): RootOxcFiles {
    const root = path.resolve(start);
    // The output itself is a repository root: it owns its own Oxc setup.
    if (fs.existsSync(path.join(root, '.git'))) return { fmt: false, lint: false };
    let dir = path.dirname(root);
    for (;;) {
        const config = configOxcOwner(dir);
        const fmt = fs.existsSync(path.join(dir, '.oxfmtrc.json')) || config?.fmt === true;
        const lint = fs.existsSync(path.join(dir, '.oxlintrc.json')) || config?.lint === true;
        if (fmt || lint) return { fmt, lint };
        if (fs.existsSync(path.join(dir, '.git'))) break;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return { fmt: false, lint: false };
}

/** The toolchain config files a project can use to declare `fmt`/`lint`. */
const DBX_CONFIG_FILE_NAMES = [
    'dbx.config.ts',
    'dbx.config.mts',
    'dbx.config.cts',
    'dbx.config.js',
    'dbx.config.mjs',
    'dbx.config.cjs',
    'dbx.config.json',
] as const;

const VITE_CONFIG_FILE_NAMES = [
    'vite.config.ts',
    'vite.config.mts',
    'vite.config.cts',
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.cjs',
] as const;

/** A Vite config that uses the `dbx()` plugin. */
const DBX_PLUGIN_SOURCE = /vite-plugin-dbx['"]|@deltabox\/toolchain(?:\/vite)?['"]|\bdbx\s*\(/;

/** The `fmt`/`lint` sections a directory's toolchain config declares. */
function configOxcOwner(dir: string): RootOxcFiles | undefined {
    for (const name of DBX_CONFIG_FILE_NAMES) {
        const file = path.join(dir, name);
        if (!fs.existsSync(file)) continue;
        const declared = declaredOxc(fs.readFileSync(file, 'utf-8'));
        if (declared) return declared;
    }
    for (const name of VITE_CONFIG_FILE_NAMES) {
        const file = path.join(dir, name);
        if (!fs.existsSync(file)) continue;
        const source = fs.readFileSync(file, 'utf-8');
        if (!DBX_PLUGIN_SOURCE.test(source)) continue;
        const declared = declaredOxc(source);
        if (declared) return declared;
    }
    return undefined;
}

/** Whether a config source declares a `fmt`/`lint` section. */
function declaredOxc(source: string): RootOxcFiles | undefined {
    const fmt = /\bfmt\s*:/.test(source);
    const lint = /\blint\s*:/.test(source);
    return fmt || lint ? { fmt, lint } : undefined;
}

/** The token replacements derived from a {@link ProjectContext}. */
function tokens(ctx: ProjectContext): Replacements {
    const {
        tsconfigExtends: _tsconfigExtends,
        rootOxc: _rootOxc,
        dependencies: _dependencies,
        extraDevDependencies: _extraDevDependencies,
        scripts: _scripts,
        ...tokens
    } = ctx;
    return tokens;
}

/** The package.json metadata fields a scaffold inherits from the project config. */
function packageMetadata(ctx: ProjectContext): Record<string, unknown> {
    const repo = ctx.repo ?? ctx.repoUrl;
    return projectToPackageJson({
        ...(ctx.description ? { description: ctx.description } : {}),
        ...(ctx.author ? { author: ctx.author } : {}),
        ...(ctx.license ? { license: ctx.license } : {}),
        ...(ctx.homepage ? { homepage: ctx.homepage } : {}),
        ...(repo ? { repo } : {}),
    }) as Record<string, unknown>;
}

const json = (value: unknown, indent = 4): string => `${JSON.stringify(value, null, indent)}\n`;

/** Render a TypeScript string literal in the repo's single-quote style. */
export function quote(value: string): string {
    return `'${value
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(
            /[\u0000-\u001f\u007f\u2028\u2029]/g,
            char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
        )}'`;
}

/** Escape text for the generated application HTML title. */
export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** The Oxfmt/Oxlint config files the Oxc VS Code extension reads. */

/** A minimal source entry so `tsdown` has an input and the scaffold builds. */
export function renderSourceEntry(): string {
    return [
        "export function greet(who = 'world'): string {",
        '    return `Hello, ${who}!`;',
        '}',
        '',
    ].join('\n');
}

/** The Vite entry point for an application scaffold. */
export function renderApplicationEntry(): string {
    return [
        "import { greet } from './index.js';",
        '',
        "const app = document.querySelector<HTMLDivElement>('#app');",
        "if (app) app.textContent = greet('world');",
        '',
    ].join('\n');
}

/** The `index.html` for an application scaffold. */
export function renderApplicationHtml(name: string): string {
    return [
        '<!doctype html>',
        '<html lang="en">',
        '    <head>',
        '        <meta charset="UTF-8" />',
        '        <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        `        <title>${escapeHtml(name)}</title>`,
        '    </head>',
        '    <body>',
        '        <div id="app"></div>',
        '        <script type="module" src="/src/main.ts"></script>',
        '    </body>',
        '</html>',
        '',
    ].join('\n');
}

/** A smoke test paired with {@link renderSourceEntry}. */
export function renderSourceTest(): string {
    return [
        "import { describe, expect, it } from 'vite-plus/test';",
        '',
        "import { greet } from '../src/index.js';",
        '',
        "describe('greet', () => {",
        "    it('greets the world by default', () => {",
        "        expect(greet()).toBe('Hello, world!');",
        '    });',
        '});',
        '',
    ].join('\n');
}

/**
 * Render a `dbx.config.ts` scaffold (toolchain settings under `toolchain`). The
 * `project.type` lets the sync know whether the folder is a monorepo root, a
 * workspace, or a single project.
 */
export function renderToolchainConfig(
    ctx: ProjectContext & {
        type: ProjectType;
        fmtOxc?: boolean;
        lintOxc?: boolean;
        /** The catalog the scaffold writes (`toolchain.catalogs.packages`). */
        catalogs?: Record<string, string>;
        /** The generated file extension. @default `ts` */
        configExtension?: ConfigExtension;
        /** The package's `type` (`module`/`commonjs`), used for `.js` syntax. */
        packageType?: string;
    }
): string {
    const entries: [string, string][] = [
        ['type', ctx.type],
        ['name', ctx.name],
    ];
    if (ctx.scope) entries.push(['scope', ctx.scope]);
    if (ctx.description) entries.push(['description', ctx.description]);
    if (ctx.author) entries.push(['author', ctx.author]);
    if (ctx.license) entries.push(['license', ctx.license]);
    if (ctx.homepage) entries.push(['homepage', ctx.homepage]);
    const repo = ctx.repo ?? ctx.repoUrl;
    if (repo) entries.push(['repo', repo]);
    entries.push(['nodeVersion', ctx.nodeVersion ?? '22']);
    const packageManager = ctx.packageManager ?? 'yarn';
    entries.push(['packageManager', packageManager]);
    // Always pair the manager with a version: a bare `packageManager` breaks
    // corepack, and `project` sync mirrors this into package.json.
    const pmVersion =
        ctx.packageManagerVersion ??
        ctx.yarnVersion ??
        defaultPackageManagerVersion(packageManager);
    if (pmVersion) entries.push(['packageManagerVersion', pmVersion]);

    const project = entries
        .map(([key, value]) => `            ${key}: ${quote(value)},`)
        .join('\n');

    // Sections are opt-in by presence. Every scaffold declares its `project`
    // identity; the Oxc `fmt`/`lint` defaults live in the root `vite.config.*`
    // (Vite+ recommended) rather than in standalone `.oxfmtrc.json` files.
    const fmtOxc = ctx.fmtOxc ?? ctx.oxc === true;
    const lintOxc = ctx.lintOxc ?? ctx.oxc === true;
    // Opt the scaffold into the catalog it writes, so `dbx sync` owns the
    // managed catalog file instead of leaving it orphaned.
    const catalogs = ctx.catalogs
        ? `        catalogs: {\n            packages: {\n${Object.entries(ctx.catalogs)
              .map(([name, range]) => `                ${quote(name)}: ${quote(range)},`)
              .join('\n')}\n            },\n        },`
        : undefined;
    const sections = [
        `        project: {\n${project}\n        },`,
        ...(ctx.type === 'monorepo-root' ? ['        tsconfig: true,'] : []),
        ...(catalogs ? [catalogs] : []),
        ...(fmtOxc ? ['        fmt: { oxc: true },'] : []),
        ...(lintOxc ? ['        lint: { oxc: true },'] : []),
    ];
    const extension = ctx.configExtension ?? DEFAULT_CONFIG_EXTENSION;
    if (configUsesEsm(extension, ctx.packageType)) {
        return `import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
${sections.join('\n')}
    },
});
`;
    }
    // CommonJS: no import, so the config loads without requiring the ESM
    // toolchain package. The JSDoc keeps editor type-checking + autocomplete.
    return `/** @type {import('@deltabox/toolchain').DbxConfig} */
module.exports = {
    toolchain: {
${sections.join('\n')}
    },
};
`;
}

/**
 * Render the scaffold's `vite.config.*`: Vite+ loads it, and `dbx()` carries the
 * toolchain config inline so the project does not need a `dbx.config.*`.
 * Vitest (`test`) also lives here. Tasks are intentionally not declared: every
 * command is a `package.json` script, and Vite+ rejects a task that shadows one.
 */
export function renderPluginViteConfig(options: PluginViteConfigOptions): string {
    const { ctx, type } = options;
    const flavor = options.flavor ?? 'library';
    const entries: [string, string][] = [
        ['type', type],
        ['name', ctx.name],
    ];
    if (ctx.scope) entries.push(['scope', ctx.scope]);
    if (ctx.description) entries.push(['description', ctx.description]);
    if (ctx.author) entries.push(['author', ctx.author]);
    if (ctx.license) entries.push(['license', ctx.license]);
    if (ctx.homepage) entries.push(['homepage', ctx.homepage]);
    const repo = ctx.repo ?? ctx.repoUrl;
    if (repo) entries.push(['repo', repo]);
    entries.push(['nodeVersion', ctx.nodeVersion ?? '22']);
    const packageManager = ctx.packageManager ?? 'yarn';
    entries.push(['packageManager', packageManager]);
    const pmVersion =
        ctx.packageManagerVersion ??
        ctx.yarnVersion ??
        defaultPackageManagerVersion(packageManager);
    if (pmVersion) entries.push(['packageManagerVersion', pmVersion]);

    const project = entries
        .map(([key, value]) => `                    ${key}: ${quote(value)},`)
        .join('\n');
    const catalogs = options.catalogs
        ? [
              '                catalogs: {',
              '                    packages: {',
              ...Object.entries(options.catalogs).map(
                  ([name, range]) => `                        ${quote(name)}: ${quote(range)},`
              ),
              '                    },',
              '                },',
          ].join('\n')
        : undefined;
    const oxc = (value: 'defaults' | 'inherit' | false | undefined): string | undefined => {
        if (value === 'defaults') return '{ oxc: true }';
        // `inherit`/`false` leave the section out. Emitting `fmt: true` /
        // `lint: true` would select the shared defaults instead of inheriting
        // the root's options, so a nested workspace must not declare it.
        return undefined;
    };
    const fmt = oxc(options.fmt);
    const lint = oxc(options.lint);
    // Only a monorepo root owns the shared workspaces tsconfig; single-project
    // and workspace scaffolds keep the task opt-in.
    const tsconfig = flavor === 'monorepo-root' ? '                tsconfig: true,' : undefined;

    const testInclude =
        flavor === 'monorepo-root'
            ? "['packages/**/tests/**/*.test.ts']"
            : "['tests/**/*.test.ts']";

    return `import { defineConfig } from 'vite-plus';

import { dbx } from '@deltabox/toolchain/vite';

export default defineConfig({
    plugins: [
        dbx({
            toolchain: {
                project: {
${project}
                },
${[
    catalogs,
    tsconfig,
    fmt ? `                fmt: ${fmt},` : undefined,
    lint ? `                lint: ${lint},` : undefined,
]
    .filter(Boolean)
    .join('\n')}
            },
        }),
    ],
    test: {
        include: ${testInclude},
        environment: 'node',
    },
});
`;
}

/** A minimal tsconfig.json that extends the default template. */
export function renderWorkspaceTsconfig(
    composite = false,
    extendsValue: string | string[] | false = './tsconfig.default.json'
): string {
    return json({
        ...(extendsValue === false ? {} : { extends: extendsValue }),
        compilerOptions: { composite },
    });
}

/** Files for a single-package TypeScript project (tsconfig + tooling). */
export function createRootProjectFiles(ctx: ProjectContext): GeneratedFile[] {
    const application = ctx.kind === 'application';
    // A skipped project config means nothing manages the Oxc files, so don't
    // create them.
    // A nested project inside a root that already owns the matching Oxc file
    // inherits the root config instead of shadowing it.
    const allowOxc = ctx.oxc !== false && ctx.includeConfig !== false;
    const withFmt = allowOxc && ctx.rootOxc?.fmt !== true;
    const withLint = allowOxc && ctx.rootOxc?.lint !== true;
    const catalog = scaffoldCatalog(ctx.packageManager, application ? ['tsdown'] : []);
    const pmField = scaffoldPackageManager(ctx);
    const pkg = {
        name: ctx.scope ? `${ctx.scope}/${ctx.name}` : ctx.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        ...packageMetadata(ctx),
        scripts: {
            ...(application
                ? { dev: 'vp dev', build: 'vp build', preview: 'vp preview' }
                : { build: 'vp pack' }),
            fmt: 'dbx fmt',
            lint: 'dbx lint --fix',
            test: 'vp test',
            typecheck: 'tsc -p tsconfig.json --noEmit',
            ...ctx.scripts,
        },
        ...(ctx.dependencies ? { dependencies: ctx.dependencies } : {}),
        devDependencies: {
            ...devDependencies(ctx.packageManager, catalogDefined(ctx.packageManager, false)),
            ...ctx.extraDevDependencies,
        },
        ...(pmField ? { packageManager: pmField } : {}),
        engines: { node: ctx.nodeVersion ? `>=${ctx.nodeVersion}` : '>=22' },
    };

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'vite.config.ts',
                      content: renderPluginViteConfig({
                          ctx,
                          type: ctx.type ?? 'project',
                          fmt: withFmt ? 'defaults' : ctx.rootOxc?.fmt ? 'inherit' : false,
                          lint: withLint ? 'defaults' : ctx.rootOxc?.lint ? 'inherit' : false,
                          ...(catalog ? { catalogs: catalog } : {}),
                          flavor: application ? 'application' : 'library',
                      }),
                  },
              ]),
        { path: 'package.json', content: json(pkg) },
        ...(application
            ? [
                  { path: 'index.html', content: renderApplicationHtml(ctx.name) },
                  { path: 'src/main.ts', content: renderApplicationEntry() },
              ]
            : []),
        { path: 'src/index.ts', content: renderSourceEntry() },
        { path: 'tests/index.test.ts', content: renderSourceTest() },
        {
            path: 'tsconfig.base.json',
            content: renderTsconfigBase(tokens(ctx), ctx.tsconfigExtends?.base),
        },
        {
            path: 'tsconfig.default.json',
            content: renderTsconfigDefault(tokens(ctx), ctx.tsconfigExtends?.default),
        },
        {
            path: 'tsconfig.build.json',
            content: renderTsconfigBuild(tokens(ctx), ctx.tsconfigExtends?.build),
        },
        { path: 'tsconfig.json', content: renderWorkspaceTsconfig() },
        { path: '.gitignore', content: renderGitignore() },
        { path: 'README.md', content: `# ${ctx.name}\n` },
        ...catalogFiles(ctx.packageManager, false),
    ];
}

/** Files for a monorepo root (workspaces + monorepo tsconfig). */
export function createMonorepoRootFiles(ctx: MonorepoRootContext): GeneratedFile[] {
    const withOxc = ctx.oxc !== false && ctx.includeConfig !== false;
    const workspaceGlobs = ctx.workspaceGlobs ?? ['packages/*'];
    const filters = workspaceGlobs
        .map(glob => `--filter "./${glob.replace(/^\.?\//, '')}"`)
        .join(' ');
    const catalog = scaffoldCatalog(ctx.packageManager);
    const pmField = scaffoldPackageManager(ctx);
    const pkg = {
        name: ctx.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        ...packageMetadata(ctx),
        scripts: {
            build: `dbx run ${filters} build`,
            test: `dbx run ${filters} test`,
            typecheck: `dbx run ${filters} typecheck`,
            fmt: 'dbx fmt',
            lint: 'dbx lint --fix',
        },
        workspaces: workspacesField(ctx.packageManager, workspaceGlobs),
        devDependencies: devDependencies(
            ctx.packageManager,
            catalogDefined(ctx.packageManager, true)
        ),
        ...(pmField ? { packageManager: pmField } : {}),
        engines: { node: ctx.nodeVersion ? `>=${ctx.nodeVersion}` : '>=22' },
    };

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'vite.config.ts',
                      content: renderPluginViteConfig({
                          ctx,
                          type: ctx.type ?? 'monorepo-root',
                          fmt: withOxc ? 'defaults' : false,
                          lint: withOxc ? 'defaults' : false,
                          ...(catalog ? { catalogs: catalog } : {}),
                          flavor: 'monorepo-root',
                      }),
                  },
              ]),
        { path: 'package.json', content: json(pkg) },
        {
            path: 'tsconfig.base.json',
            content: renderTsconfigBase(tokens(ctx), ctx.tsconfigExtends?.base),
        },
        {
            path: 'tsconfig.workspaces.json',
            content: renderMonorepoTsconfig({
                scope: ctx.scope ?? ctx.name,
                workspaces: ctx.workspaces,
            }),
        },
        {
            path: 'tsconfig.json',
            content: json({
                extends: './tsconfig.workspaces.json',
                compilerOptions: { composite: false },
                files: [],
            }),
        },
        { path: '.gitignore', content: renderGitignore() },
        { path: 'README.md', content: `# ${ctx.name}\n` },
        ...catalogFiles(ctx.packageManager, true, [], workspaceGlobs),
    ];
}

/** Normalize + validate a workspace directory (relative, inside the root). */
export function workspaceDirForTsconfig(dir: string): string {
    const normalized = dir
        .replace(/\\/g, '/')
        .replace(/^\.?\//, '')
        .replace(/\/+$/, '');
    if (
        !normalized ||
        normalized === '.' ||
        path.isAbsolute(dir) ||
        /^[a-zA-Z]:/.test(dir) ||
        normalized.split('/').includes('..')
    ) {
        throw new Error(`invalid workspace directory "${dir}" (must be relative to the root).`);
    }
    return normalized;
}

/** Match the file's indentation so JSONC edits keep the existing style. */
function jsoncFormattingOptions(text: string): FormattingOptions {
    const indent = text.match(/^([ \t]+)\S/m)?.[1] ?? '    ';
    const insertSpaces = !indent.includes('\t');
    return { insertSpaces, tabSize: insertSpaces ? indent.length : 1 };
}

/**
 * Add (or refresh) a workspace in a monorepo root's workspaces tsconfig.
 * Keeps the existing file (including comments and formatting) and just upserts
 * the aliases and project reference. Returns `false` when the configured file
 * is absent.
 */
export function upsertWorkspaceTsconfig(
    root: string,
    workspace: MonorepoWorkspace,
    scope: string | undefined,
    rootFile: string = 'tsconfig.workspaces.json'
): boolean {
    const dir = workspaceDirForTsconfig(workspace.dir);
    const file = path.resolve(root, rootFile);
    if (!fs.existsSync(file)) return false;

    const text = fs.readFileSync(file, 'utf-8');
    let config: Record<string, unknown>;
    try {
        config = parseTsconfig(text) as Record<string, unknown>;
    } catch {
        return false;
    }
    const originalReferences = Array.isArray(config.references)
        ? (config.references as { path?: unknown }[])
        : undefined;

    const compilerOptions =
        config.compilerOptions && typeof config.compilerOptions === 'object'
            ? (config.compilerOptions as Record<string, unknown>)
            : {};
    const previousDirs = new Set<string>();
    const pathValues = new Map<string, string[]>();
    if (scope) {
        const paths =
            compilerOptions.paths && typeof compilerOptions.paths === 'object'
                ? (compilerOptions.paths as Record<string, string[]>)
                : {};
        for (const key of [`${scope}/${workspace.alias}`, `${scope}/${workspace.alias}/*`]) {
            const current = paths[key];
            const first = Array.isArray(current) ? current[0] : undefined;
            const match =
                typeof first === 'string'
                    ? first.match(/^\.\/(.+)\/src\/(?:index\.ts|\*)$/)
                    : undefined;
            if (match?.[1]) previousDirs.add(match[1]);
            const value = [key.endsWith('/*') ? `./${dir}/src/*` : `./${dir}/src/index.ts`];
            paths[key] = value;
            pathValues.set(key, value);
        }
        compilerOptions.paths = paths;
    }
    config.compilerOptions = compilerOptions;

    const reference = `./${dir}/tsconfig.json`;
    const staleReferences = new Set(
        [...previousDirs]
            .filter(previous => previous !== dir)
            .map(previous => `./${previous}/tsconfig.json`)
    );
    const references = (
        Array.isArray(config.references) ? (config.references as { path: string }[]) : []
    ).filter(entry => !staleReferences.has(entry.path));
    if (!references.some(entry => entry.path === reference)) {
        references.push({ path: reference });
    }
    config.references = references;

    try {
        const formattingOptions = jsoncFormattingOptions(text);
        let next = text;
        for (const [key, value] of pathValues) {
            next = applyEdits(
                next,
                modify(next, ['compilerOptions', 'paths', key], value, { formattingOptions })
            );
        }

        const rawReferences = originalReferences ?? [];
        const existing = rawReferences.findIndex(entry => entry.path === reference);
        const stale = rawReferences
            .map((entry, index) =>
                typeof entry.path === 'string' && staleReferences.has(entry.path) ? index : -1
            )
            .filter(index => index >= 0);

        if (stale.length > 0) {
            if (existing === -1) {
                next = applyEdits(
                    next,
                    modify(next, ['references', stale[0]!, 'path'], reference, {
                        formattingOptions,
                    })
                );
            }
            for (const index of stale
                .filter((_, position) => existing !== -1 || position > 0)
                .sort((a, b) => b - a)) {
                next = applyEdits(
                    next,
                    modify(next, ['references', index], undefined, { formattingOptions })
                );
            }
        } else if (existing === -1) {
            next =
                originalReferences !== undefined
                    ? applyEdits(
                          next,
                          modify(
                              next,
                              ['references', rawReferences.length],
                              { path: reference },
                              {
                                  formattingOptions,
                              }
                          )
                      )
                    : applyEdits(
                          next,
                          modify(next, ['references'], [{ path: reference }], { formattingOptions })
                      );
        }

        fs.writeFileSync(file, next, 'utf-8');
    } catch {
        // Extremely malformed JSONC: fall back to a normalized rewrite.
        fs.writeFileSync(file, `${JSON.stringify(config, null, 4)}\n`, 'utf-8');
    }
    return true;
}

/** Files for a monorepo workspace package. */
export function createWorkspaceFiles(ctx: WorkspaceContext): GeneratedFile[] {
    // Only reference `catalog:` when the workspace's package manager actually
    // writes a catalog (npm has none; Bun's lives in the monorepo package.json).
    const useCatalog = ctx.useCatalog === true && catalogDefined(ctx.packageManager, true);
    const dev = useCatalog ? devDependencies(ctx.packageManager, true) : { ...CATALOG };
    const pmField = scaffoldPackageManager(ctx);
    const pkg = {
        name: ctx.scope ? `${ctx.scope}/${ctx.wsName}` : ctx.wsName,
        version: '0.1.0',
        type: 'module',
        ...packageMetadata(ctx),
        main: './dist/index.js',
        module: './dist/index.js',
        types: './dist/index.d.ts',
        exports: {
            '.': {
                types: './dist/index.d.ts',
                import: './dist/index.js',
            },
            './package.json': './package.json',
        },
        sideEffects: false,
        files: ['dist'],
        scripts: {
            build: 'vp pack',
            fmt: 'dbx fmt',
            lint: 'dbx lint --fix',
            test: 'vp test',
            typecheck: 'tsc -p tsconfig.build.json --noEmit',
        },
        devDependencies: dev,
        ...(pmField ? { packageManager: pmField } : {}),
        ...(ctx.nodeVersion ? { engines: { node: `>=${ctx.nodeVersion}` } } : {}),
        publishConfig: { access: 'public', provenance: true },
    };

    const base = ctx.wsDir.split('/').length;

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'vite.config.ts',
                      content: renderPluginViteConfig({
                          // A workspace config describes the workspace, not the root it
                          // was scaffolded from.
                          ctx: { ...ctx, name: ctx.wsName },
                          type: ctx.type ?? 'monorepo-workspace',
                          fmt: 'inherit',
                          lint: 'inherit',
                          flavor: 'workspace',
                      }),
                  },
              ]),
        { path: 'package.json', content: json(pkg) },
        { path: 'src/index.ts', content: renderSourceEntry() },
        { path: 'tests/index.test.ts', content: renderSourceTest() },
        {
            path: 'tsconfig.default.json',
            content: json({
                ...(ctx.tsconfigExtends?.default === false
                    ? {}
                    : {
                          extends:
                              ctx.tsconfigExtends?.default ??
                              `${'../'.repeat(base)}tsconfig.base.json`,
                      }),
                compilerOptions: {
                    module: 'NodeNext',
                    moduleResolution: 'NodeNext',
                    types: ['node'],
                },
                include: ['src', 'tests', 'vite.config.ts'],
            }),
        },
        {
            path: 'tsconfig.build.json',
            content: renderWorkspaceTsconfig(
                false,
                ctx.tsconfigExtends?.build ?? './tsconfig.json'
            ),
        },
        { path: 'tsconfig.json', content: renderWorkspaceTsconfig() },
    ];
}

/** A generic `.gitignore`. */
export function renderGitignore(): string {
    return [
        'node_modules/',
        'dist/',
        'coverage/',
        '.vite/',
        '*.tsbuildinfo',
        '',
        '.env',
        '.env.*',
        '!.env.example',
        '!.env.example.*',
        '',
        '.DS_Store',
        '',
        '# Toolchain state; only the manifest is committed',
        '.dbx/toolchain/*',
        '!.dbx/toolchain/manifest.json',
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

/** Whether a value is a valid unscoped npm package name. */
export function isValidPackageName(name: string): boolean {
    return /^[a-z0-9][a-z0-9._-]*$/.test(name) && name !== '.' && name !== '..';
}

/** A filesystem path with symlinks resolved, or `undefined` when it cannot be. */
function realPath(value: string): string | undefined {
    try {
        return fs.realpathSync.native(value);
    } catch {
        try {
            return fs.realpathSync(value);
        } catch {
            return undefined;
        }
    }
}

/** Whether a path exists, without following a final symlink. */
function entryExists(value: string): boolean {
    try {
        fs.lstatSync(value);
        return true;
    } catch {
        return false;
    }
}

function isInside(root: string, target: string): boolean {
    const normalizedRoot = process.platform === 'win32' ? root.toLowerCase() : root;
    const normalizedTarget = process.platform === 'win32' ? target.toLowerCase() : target;
    return (
        normalizedTarget === normalizedRoot ||
        normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`)
    );
}

/**
 * Reject a target that escapes `root`, following symlinks/junctions. The lexical
 * check catches `..` paths; the real-path check catches a link under the output
 * directory that points elsewhere (which would otherwise let a scaffold write
 * outside the root).
 */
export function assertPathInside(root: string, target: string): void {
    const resolvedRoot = path.resolve(root);
    const resolvedTarget = path.resolve(target);
    if (!isInside(resolvedRoot, resolvedTarget)) {
        throw new Error(`refusing to write outside ${resolvedRoot}: ${resolvedTarget}`);
    }

    // Resolve the nearest existing ancestor, then re-append the missing tail.
    // `lstat` (not `existsSync`) also sees a broken symlink, which must be
    // rejected: writing through it would create a file outside the root.
    let probe = resolvedTarget;
    const tail: string[] = [];
    while (!entryExists(probe)) {
        const parent = path.dirname(probe);
        if (parent === probe) break;
        tail.unshift(path.basename(probe));
        probe = parent;
    }
    const realRoot = realPath(resolvedRoot) ?? resolvedRoot;
    const realProbe = realPath(probe);
    if (!realProbe) {
        throw new Error(`refusing to write through an unresolvable link: ${probe}`);
    }
    const realTarget = path.resolve(realProbe, ...tail);
    if (!isInside(realRoot, realTarget)) {
        throw new Error(`refusing to write outside ${resolvedRoot}: ${resolvedTarget}`);
    }
}

/**
 * Write generated files under `cwd`, creating directories as needed. A target
 * outside `cwd` (including through a symlink/junction) is rejected, and an
 * existing file is never overwritten unless `force` is set, so a scaffold cannot
 * escape its output directory or silently clobber a user's files.
 */
export function writeGeneratedFiles(
    files: GeneratedFile[],
    cwd = process.cwd(),
    options: WriteGeneratedFilesOptions = {}
): string[] {
    const root = path.resolve(cwd);
    const targets = files.map(file => path.resolve(root, file.path));
    const seen = new Map<string, string>();
    for (const target of targets) {
        assertPathInside(root, target);
        const key = process.platform === 'win32' ? target.toLowerCase() : target;
        const previous = seen.get(key);
        if (previous !== undefined) {
            throw new Error(
                `refusing to write duplicate file(s): ${previous} and ${path.relative(root, target)}`
            );
        }
        seen.set(key, path.relative(root, target));
    }
    if (options.force !== true) {
        const existing = targets.filter(target => fs.existsSync(target));
        if (existing.length > 0) {
            throw new Error(
                `refusing to overwrite existing file(s): ${existing
                    .map(target => path.relative(root, target))
                    .join(', ')} (use --force to overwrite).`
            );
        }
    }
    if (options.dryRun === true) return targets;

    const written: string[] = [];
    for (const [index, target] of targets.entries()) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, files[index]!.content, 'utf-8');
        written.push(target);
    }
    return written;
}
