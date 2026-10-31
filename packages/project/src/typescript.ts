import fs from 'node:fs';
import path from 'node:path';

import { applyEdits, type FormattingOptions, modify } from 'jsonc-parser';

import {
    DEFAULT_FMT_RULES,
    DEFAULT_LINT_RULES,
    DEFAULT_PACKAGE_MANAGER_VERSIONS,
    type GeneratedFile,
    projectToPackageJson,
    type ProjectType,
    type Replacements,
} from '@deltabox/toolchain-shared';
import {
    type MonorepoWorkspace,
    parseTsconfig,
    renderMonorepoTsconfig,
    renderTsconfigBase,
    renderTsconfigBuild,
    renderTsconfigDefault,
    type TsconfigExtendsOptions,
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
    '@deltabox/toolchain': `^${rootPkg.version}`,
    '@types/node': '^22.10.2',
    tsdown: '^0.23.0',
    typescript: '^6.0.3',
    vite: '^8.3.0',
    'vite-plus': '^1.2.0',
    vitest: '^5.0.0',
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
    const resolved = version ?? DEFAULT_PACKAGE_MANAGER_VERSIONS[packageManager];
    return resolved ? `${packageManager}@${resolved}` : packageManager;
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

/** The package-manager catalog file(s) a scaffolded root should write. */
function catalogFiles(
    packageManager: string | undefined,
    isMonorepo: boolean,
    exclude: string[] = []
): GeneratedFile[] {
    const catalog = Object.fromEntries(
        Object.entries(CATALOG).filter(([name]) => !exclude.includes(name))
    );
    switch (packageManager ?? 'yarn') {
        case 'yarn':
            return [{ path: '.yarnrc.yml', content: renderYarnrc({ packages: catalog }) }];
        case 'pnpm':
            return [
                {
                    path: 'pnpm-workspace.yaml',
                    content: renderPnpmWorkspace(
                        { packages: catalog },
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
    /** Package description. */
    description?: string;
    /** Package author. */
    author?: string;
    /** SPDX license id. */
    license?: string;
    /** Project homepage. */
    homepage?: string;
    /** Repository URL. */
    repo?: string;
    /** Repository URL (legacy alias for {@link repo}). */
    repoUrl?: string;
    /** Node engine range. */
    nodeVersion?: string;
    /** Package manager version. */
    packageManagerVersion?: string;
    /** Yarn version (legacy alias for {@link packageManagerVersion}). */
    yarnVersion?: string;
    /** Package manager name. */
    packageManager?: string;
    /** The project kind written into the scaffolded `dbx.config.ts`. */
    type?: ProjectType;
    /** The scaffold flavour (an application gets Vite entry files/scripts). */
    kind?: 'project' | 'application';
    /** Write `fmt.oxc` / `lint.oxc` defaults (and the Oxc config files). */
    oxc?: boolean;
    /**
     * Oxc config files already present above the scaffold root. The matching
     * local file + `dbx.config.ts` opt-in are omitted so the root owns them.
     */
    rootOxc?: RootOxcFiles;
    /** Write a `dbx.config.ts` (default true). */
    includeConfig?: boolean;
    /** Per-file `extends` overrides for the scaffolded tsconfig templates. */
    tsconfigExtends?: TsconfigExtendsOptions;
}

/** Oxc config files found in an ancestor of a scaffold output directory. */
export interface RootOxcFiles {
    fmt: boolean;
    lint: boolean;
}

/**
 * Find the nearest ancestor that owns Oxc config files. The walk stops at the
 * repository boundary (`.git`) so a nested project cannot inherit files from an
 * unrelated checkout above it.
 */
export function findRootOxcFiles(start: string): RootOxcFiles {
    const root = path.resolve(start);
    // The output itself is a repository root: it owns its own Oxc setup.
    if (fs.existsSync(path.join(root, '.git'))) return { fmt: false, lint: false };
    let dir = path.dirname(root);
    for (;;) {
        const fmt = fs.existsSync(path.join(dir, '.oxfmtrc.json'));
        const lint = fs.existsSync(path.join(dir, '.oxlintrc.json'));
        if (fmt || lint) return { fmt, lint };
        if (fs.existsSync(path.join(dir, '.git'))) break;
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return { fmt: false, lint: false };
}

/** The token replacements derived from a {@link ProjectContext}. */
function tokens(ctx: ProjectContext): Replacements {
    const { tsconfigExtends: _tsconfigExtends, rootOxc: _rootOxc, ...tokens } = ctx;
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
function quote(value: string): string {
    return `'${value
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(
            /[\u0000-\u001f\u007f\u2028\u2029]/g,
            char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
        )}'`;
}

/** Escape text for the generated application HTML title. */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** The Oxfmt/Oxlint config files the Oxc VS Code extension reads. */
const OXC_FMT_SCHEMA = './node_modules/oxfmt/configuration_schema.json';
const OXC_LINT_SCHEMA = './node_modules/oxlint/configuration_schema.json';

function renderOxcConfig(schema: string, config: unknown): string {
    return `${JSON.stringify({ $schema: schema, ...(config as object) }, null, 4)}\n`;
}

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
        "import { describe, expect, it } from 'vitest';",
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
    ctx: ProjectContext & { type: ProjectType; fmtOxc?: boolean; lintOxc?: boolean }
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
        DEFAULT_PACKAGE_MANAGER_VERSIONS[packageManager];
    if (pmVersion) entries.push(['packageManagerVersion', pmVersion]);

    const project = entries
        .map(([key, value]) => `            ${key}: ${quote(value)},`)
        .join('\n');

    // Sections are opt-in by presence. Every scaffold declares its `project`
    // identity; the Oxc defaults are opt-out and drive the managed `.oxfmtrc.json`
    // / `.oxlintrc.json` files on `dbx sync`.
    const fmtOxc = ctx.fmtOxc ?? ctx.oxc === true;
    const lintOxc = ctx.lintOxc ?? ctx.oxc === true;
    const sections = [
        `        project: {\n${project}\n        },`,
        ...(fmtOxc ? ['        fmt: { oxc: true },'] : []),
        ...(lintOxc ? ['        lint: { oxc: true },'] : []),
    ];
    return `import { defineConfig } from '@deltabox/toolchain';

export default defineConfig({
    toolchain: {
${sections.join('\n')}
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
    // `--no-config` means nothing manages the Oxc files, so don't create them.
    // A nested project inside a root that already owns the matching Oxc file
    // inherits the root config instead of shadowing it.
    const allowOxc = ctx.oxc !== false && ctx.includeConfig !== false;
    const withFmt = allowOxc && ctx.rootOxc?.fmt !== true;
    const withLint = allowOxc && ctx.rootOxc?.lint !== true;
    const pkg = {
        name: ctx.scope ? `${ctx.scope}/${ctx.name}` : ctx.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        ...packageMetadata(ctx),
        scripts: application
            ? {
                  dev: 'vite',
                  build: 'vite build',
                  preview: 'vite preview',
                  format: 'dbx fmt',
                  lint: 'dbx lint --fix',
                  test: 'vitest run',
                  typecheck: 'tsc -p tsconfig.json --noEmit',
              }
            : {
                  build: 'tsdown',
                  format: 'dbx fmt',
                  lint: 'dbx lint --fix',
                  test: 'vitest run',
                  typecheck: 'tsc -p tsconfig.json --noEmit',
              },
        devDependencies: devDependencies(
            ctx.packageManager,
            catalogDefined(ctx.packageManager, false),
            application ? ['tsdown'] : []
        ),
        ...(packageManagerField(ctx.packageManager, ctx.packageManagerVersion ?? ctx.yarnVersion)
            ? {
                  packageManager: packageManagerField(
                      ctx.packageManager,
                      ctx.packageManagerVersion ?? ctx.yarnVersion
                  ),
              }
            : {}),
        engines: { node: ctx.nodeVersion ? `>=${ctx.nodeVersion}` : '>=22' },
    };

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'dbx.config.ts',
                      content: renderToolchainConfig({
                          ...ctx,
                          type: ctx.type ?? 'project',
                          fmtOxc: withFmt,
                          lintOxc: withLint,
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
        ...(withFmt
            ? [
                  {
                      path: '.oxfmtrc.json',
                      content: renderOxcConfig(OXC_FMT_SCHEMA, DEFAULT_FMT_RULES),
                  },
              ]
            : []),
        ...(withLint
            ? [
                  {
                      path: '.oxlintrc.json',
                      content: renderOxcConfig(OXC_LINT_SCHEMA, DEFAULT_LINT_RULES),
                  },
              ]
            : []),
        { path: '.gitignore', content: renderGitignore() },
        { path: 'README.md', content: `# ${ctx.name}\n` },
        ...catalogFiles(ctx.packageManager, false, application ? ['tsdown'] : []),
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
    const withOxc = ctx.oxc !== false && ctx.includeConfig !== false;
    const pkg = {
        name: ctx.name,
        version: '0.1.0',
        private: true,
        type: 'module',
        ...packageMetadata(ctx),
        scripts: {
            build: 'dbx run --filter "./packages/*" build',
            test: 'dbx run --filter "./packages/*" test',
            typecheck: 'dbx run --filter "./packages/*" typecheck',
            format: 'dbx fmt',
            lint: 'dbx lint --fix',
        },
        workspaces: workspacesField(ctx.packageManager, ctx.workspaceGlobs ?? ['packages/*']),
        devDependencies: devDependencies(
            ctx.packageManager,
            catalogDefined(ctx.packageManager, true)
        ),
        ...(packageManagerField(ctx.packageManager, ctx.packageManagerVersion ?? ctx.yarnVersion)
            ? {
                  packageManager: packageManagerField(
                      ctx.packageManager,
                      ctx.packageManagerVersion ?? ctx.yarnVersion
                  ),
              }
            : {}),
        engines: { node: ctx.nodeVersion ? `>=${ctx.nodeVersion}` : '>=22' },
    };

    return [
        ...(ctx.includeConfig === false
            ? []
            : [
                  {
                      path: 'dbx.config.ts',
                      content: renderToolchainConfig({
                          ...ctx,
                          type: ctx.type ?? 'monorepo-root',
                          oxc: withOxc,
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
        ...(withOxc
            ? [
                  {
                      path: '.oxfmtrc.json',
                      content: renderOxcConfig(OXC_FMT_SCHEMA, DEFAULT_FMT_RULES),
                  },
                  {
                      path: '.oxlintrc.json',
                      content: renderOxcConfig(OXC_LINT_SCHEMA, DEFAULT_LINT_RULES),
                  },
              ]
            : []),
        { path: '.gitignore', content: renderGitignore() },
        { path: 'README.md', content: `# ${ctx.name}\n` },
        ...catalogFiles(ctx.packageManager, true),
    ];
}

/** Normalize + validate a workspace directory (relative, inside the root). */
function workspaceDirForTsconfig(dir: string): string {
    const normalized = dir
        .replace(/\\/g, '/')
        .replace(/^\.?\//, '')
        .replace(/\/+$/, '');
    if (
        !normalized ||
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
    // Only reference `catalog:` when the workspace's package manager actually
    // writes a catalog (npm has none; Bun's lives in the monorepo package.json).
    const useCatalog = ctx.useCatalog === true && catalogDefined(ctx.packageManager, true);
    const dev = useCatalog ? devDependencies(ctx.packageManager, true) : { ...CATALOG };
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
            build: 'tsdown',
            format: 'dbx fmt',
            lint: 'dbx lint --fix',
            test: 'vitest run',
            typecheck: 'tsc -p tsconfig.build.json --noEmit',
        },
        devDependencies: dev,
        ...(ctx.nodeVersion ? { engines: { node: `>=${ctx.nodeVersion}` } } : {}),
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
                          // A workspace config describes the workspace, not the root it
                          // was scaffolded from.
                          name: ctx.wsName,
                          type: ctx.type ?? 'monorepo-workspace',
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
                include: ['src', 'tests', 'tsdown.config.ts', 'vitest.config.ts'],
            }),
        },
        {
            path: 'tsconfig.build.json',
            content: renderWorkspaceTsconfig(false, ctx.tsconfigExtends?.build),
        },
        { path: 'tsconfig.json', content: renderWorkspaceTsconfig() },
        {
            path: 'tsdown.config.ts',
            content: `import { defineConfig } from 'tsdown';\n\nimport { baseTsdownConfig } from '@deltabox/toolchain/tsdown';\n\nexport default defineConfig({\n    ...baseTsdownConfig,\n    entry: { index: 'src/index.ts' },\n    // Keep the explicit package.json exports (types + import conditions).\n    exports: false,\n});\n`,
        },
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

export interface WriteGeneratedFilesOptions {
    /** Overwrite files that already exist (default false). */
    force?: boolean;
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
 * Write generated files under `cwd`, creating directories as needed. A target
 * outside `cwd` is rejected, and an existing file is never overwritten unless
 * `force` is set, so a scaffold cannot escape its output directory or silently
 * clobber a user's files.
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
        if (!isInside(root, target)) {
            throw new Error(`refusing to write outside ${root}: ${target}`);
        }
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

    const written: string[] = [];
    for (const [index, target] of targets.entries()) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, files[index]!.content, 'utf-8');
        written.push(target);
    }
    return written;
}
