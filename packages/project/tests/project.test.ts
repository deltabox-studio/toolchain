import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { parseTsconfig } from '@deltabox/toolchain-tsconfig';

import {
    catalogsSyncTask,
    createMonorepoRootFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
    generateProjectConfigs,
    hasCatalog,
    projectSyncTask,
    renderGitignore,
    renderYarnrc,
    SCAFFOLD_CATALOG,
    upsertWorkspaceTsconfig,
} from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-proj-'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('project scaffolding', () => {
    it('creates root files', () => {
        const files = createRootProjectFiles({ name: 'acme', scope: '@acme', license: 'MIT' });
        const paths = files.map(f => f.path);
        expect(paths).toContain('package.json');
        expect(paths).toContain('tsconfig.base.json');
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.name).toBe('@acme/acme');
        expect(pkg.license).toBe('MIT');
        // The default manager (yarn) supports catalogs: the catalog file is
        // written and the deps reference `catalog:`.
        expect(paths).toContain('.yarnrc.yml');
        expect(pkg.devDependencies['@deltabox/toolchain']).toBe('catalog:');
        expect(pkg.devDependencies['@types/node']).toBe('catalog:');
        expect(pkg.devDependencies['vite-plus']).toBe('catalog:');
        expect(pkg.devDependencies['@biomejs/biome']).toBeUndefined();
        expect(paths).not.toContain('biome.json');
        expect(pkg.scripts.format).toBe('dbx fmt');
        expect(pkg.scripts.lint).toBe('dbx lint --fix');
        expect(paths).toContain('.oxfmtrc.json');
        expect(paths).toContain('.oxlintrc.json');
        expect(JSON.parse(files.find(f => f.path === '.oxfmtrc.json')!.content)).toMatchObject({
            $schema: './node_modules/oxfmt/configuration_schema.json',
            useTabs: false,
            tabWidth: 4,
        });
        expect(JSON.parse(files.find(f => f.path === '.oxlintrc.json')!.content)).toHaveProperty(
            '$schema',
            './node_modules/oxlint/configuration_schema.json'
        );
        const config = files.find(f => f.path === 'dbx.config.ts')!.content;
        expect(config).toContain('fmt:');
        expect(config).toContain('lint:');
        expect(config).toContain('oxc:');
    });

    it('creates a Vite app entry for the application flavour', () => {
        const files = createRootProjectFiles({ name: 'app', kind: 'application' });
        const paths = files.map(file => file.path);
        expect(paths).toContain('index.html');
        expect(paths).toContain('src/main.ts');
        expect(files.find(file => file.path === 'index.html')!.content).toContain(
            '<div id="app"></div>'
        );
        const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content);
        expect(pkg.scripts.dev).toBe('vite');
        expect(pkg.scripts.build).toBe('vite build');
        expect(pkg.devDependencies.tsdown).toBeUndefined();
        const yarnrc = files.find(file => file.path === '.yarnrc.yml')!.content;
        expect(yarnrc).not.toContain('tsdown:');
        const escaped = createRootProjectFiles({ name: '<app>', kind: 'application' }).find(
            file => file.path === 'index.html'
        )!.content;
        expect(escaped).toContain('<title>&lt;app&gt;</title>');
    });

    it('pins dependencies (no catalog) for npm', () => {
        const files = createRootProjectFiles({ name: 'acme', packageManager: 'npm' });
        const paths = files.map(f => f.path);
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toBe(
            SCAFFOLD_CATALOG['@deltabox/toolchain']
        );
        expect(paths).not.toContain('.yarnrc.yml');
        expect(paths).not.toContain('pnpm-workspace.yaml');
    });

    it('creates monorepo root files with references', () => {
        const files = createMonorepoRootFiles({
            name: 'acme',
            scope: '@acme',
            workspaces: [{ alias: 'core', dir: 'packages/core' }],
        });
        const mono = JSON.parse(files.find(f => f.path === 'tsconfig.workspaces.json')!.content);
        expect(mono.compilerOptions.paths['@acme/core']).toEqual(['./packages/core/src/index.ts']);
        expect(mono.references).toEqual([{ path: './packages/core/tsconfig.json' }]);
        // No turbo: no turbo.json, no turbo devDependency, no turbo scripts.
        expect(files.map(f => f.path)).not.toContain('turbo.json');
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies.turbo).toBeUndefined();
        expect(JSON.stringify(pkg.scripts ?? {})).not.toContain('turbo');
    });

    it('wires a root tsconfig and scripts into a monorepo scaffold', () => {
        const files = createMonorepoRootFiles({ name: 'acme', scope: '@acme', workspaces: [] });
        const paths = files.map(file => file.path);
        expect(paths).toContain('tsconfig.json');
        expect(paths).toContain('tsconfig.workspaces.json');
        expect(paths).toContain('.oxfmtrc.json');
        expect(paths).toContain('.oxlintrc.json');
        const rootTsconfig = JSON.parse(files.find(file => file.path === 'tsconfig.json')!.content);
        expect(rootTsconfig.extends).toBe('./tsconfig.workspaces.json');
        const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content);
        expect(pkg.scripts.build).toContain('dbx run');
        expect(pkg.scripts.typecheck).toContain('dbx run');
    });

    it('adds a workspace to tsconfig.workspaces.json', () => {
        const root = makeTmp();
        fs.writeFileSync(
            path.join(root, 'tsconfig.workspaces.json'),
            JSON.stringify({
                compilerOptions: { composite: true, paths: {} },
                references: [],
            })
        );
        expect(upsertWorkspaceTsconfig(root, { alias: 'web', dir: 'packages/web' }, '@acme')).toBe(
            true
        );
        const config = JSON.parse(
            fs.readFileSync(path.join(root, 'tsconfig.workspaces.json'), 'utf-8')
        );
        expect(config.compilerOptions.paths['@acme/web']).toEqual(['./packages/web/src/index.ts']);
        expect(config.references).toEqual([{ path: './packages/web/tsconfig.json' }]);
    });

    it('honours a custom root tsconfig and removes stale workspace references', () => {
        const root = makeTmp();
        fs.writeFileSync(
            path.join(root, 'tsconfig.graph.json'),
            JSON.stringify({
                compilerOptions: {
                    composite: true,
                    paths: { '@acme/web': ['./packages/old/src/index.ts'] },
                },
                references: [{ path: './packages/old/tsconfig.json' }],
            })
        );
        expect(
            upsertWorkspaceTsconfig(
                root,
                { alias: 'web', dir: 'packages/new' },
                '@acme',
                'tsconfig.graph.json'
            )
        ).toBe(true);
        const config = JSON.parse(fs.readFileSync(path.join(root, 'tsconfig.graph.json'), 'utf-8'));
        expect(config.compilerOptions.paths['@acme/web']).toEqual(['./packages/new/src/index.ts']);
        expect(config.references).toEqual([{ path: './packages/new/tsconfig.json' }]);
    });

    it('rejects an unsafe workspace directory', () => {
        const root = makeTmp();
        fs.writeFileSync(path.join(root, 'tsconfig.workspaces.json'), '{}');
        expect(() =>
            upsertWorkspaceTsconfig(root, { alias: 'web', dir: '../outside' }, '@acme')
        ).toThrow('invalid workspace directory');
    });

    it('preserves JSONC comments when wiring a workspace', () => {
        const root = makeTmp();
        const text = `{
    // Root comment
    "compilerOptions": {
        "composite": true,
        // Keep the existing aliases
        "paths": {
            // Existing core alias
            "@acme/core": ["./packages/core/src/index.ts"]
        }
    },
    "references": [
        // Existing core reference
        { "path": "./packages/core/tsconfig.json" }
    ]
}
`;
        fs.writeFileSync(path.join(root, 'tsconfig.workspaces.json'), text);
        expect(upsertWorkspaceTsconfig(root, { alias: 'web', dir: 'packages/web' }, '@acme')).toBe(
            true
        );
        const updated = fs.readFileSync(path.join(root, 'tsconfig.workspaces.json'), 'utf-8');
        expect(updated).toContain('// Root comment');
        expect(updated).toContain('// Keep the existing aliases');
        expect(updated).toContain('// Existing core alias');
        expect(updated).toContain('// Existing core reference');
        const config = parseTsconfig(updated);
        expect(config.compilerOptions?.paths?.['@acme/web']).toEqual([
            './packages/web/src/index.ts',
        ]);
        expect(config.references).toContainEqual({ path: './packages/web/tsconfig.json' });
    });

    it('creates workspace files', () => {
        const files = createWorkspaceFiles({
            name: 'acme',
            scope: '@acme',
            wsName: 'core',
            wsDir: 'packages/core',
        });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.name).toBe('@acme/core');
        expect(pkg.main).toBe('./dist/index.js');
        expect(pkg.types).toBe('./dist/index.d.ts');
        expect(pkg.exports['.']).toEqual({
            types: './dist/index.d.ts',
            import: './dist/index.js',
        });
        expect(pkg.exports['./package.json']).toBe('./package.json');
        const tsdown = files.find(f => f.path === 'tsdown.config.ts')!.content;
        expect(tsdown).toContain('exports: false');
    });

    it('writes the inherited project metadata into package.json and dbx.config.ts', () => {
        const files = createRootProjectFiles({
            name: 'acme',
            scope: '@acme',
            description: 'The acme app',
            author: 'Acme Inc. <hello@acme.dev>',
            license: 'MIT',
            homepage: 'https://acme.dev',
            repo: 'https://github.com/acme/acme',
            nodeVersion: '24',
        });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.description).toBe('The acme app');
        expect(pkg.author).toBe('Acme Inc. <hello@acme.dev>');
        expect(pkg.license).toBe('MIT');
        expect(pkg.homepage).toBe('https://acme.dev');
        expect(pkg.repository).toEqual({
            type: 'git',
            url: 'git+https://github.com/acme/acme.git',
        });
        expect(pkg.engines.node).toBe('>=24');
        const config = files.find(f => f.path === 'dbx.config.ts')!.content;
        expect(config).toContain("description: 'The acme app'");
        expect(config).toContain("repo: 'https://github.com/acme/acme'");
        expect(config).toContain("nodeVersion: '24'");
    });

    it('escapes control characters in generated config strings', () => {
        const config = createRootProjectFiles({
            name: 'acme',
            description: 'line1\nline2\rline3',
        }).find(file => file.path === 'dbx.config.ts')!.content;
        expect(config).toContain("description: 'line1\\u000aline2\\u000dline3'");
        expect(config).not.toContain('line1\nline2');
    });

    it('does not write Oxc files with --no-config', () => {
        const files = createRootProjectFiles({ name: 'acme', includeConfig: false });
        expect(files.some(file => file.path === '.oxfmtrc.json')).toBe(false);
        expect(files.some(file => file.path === '.oxlintrc.json')).toBe(false);
        const mono = createMonorepoRootFiles({
            name: 'acme',
            includeConfig: false,
            workspaces: [],
        });
        expect(mono.some(file => file.path === '.oxfmtrc.json')).toBe(false);
    });

    it('seeds a generated config from package.json metadata', () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({
                name: '@acme/app',
                version: '1.0.0',
                description: 'An app',
                author: 'Acme <hi@acme.dev>',
                license: 'MIT',
                homepage: 'https://acme.dev',
                repository: 'https://github.com/acme/app',
                engines: { node: '>=24' },
                packageManager: 'pnpm@10.11.1',
            })
        );
        const result = generateProjectConfigs({ root: dir });
        expect(result.created).toContain('.');
        const config = fs.readFileSync(path.join(dir, 'dbx.config.ts'), 'utf-8');
        expect(config).toContain("description: 'An app'");
        expect(config).toContain("author: 'Acme <hi@acme.dev>'");
        expect(config).toContain("license: 'MIT'");
        expect(config).toContain("homepage: 'https://acme.dev'");
        expect(config).toContain("repo: 'https://github.com/acme/app'");
        expect(config).toContain("nodeVersion: '24'");
        expect(config).toContain("packageManager: 'pnpm'");
        expect(config).toContain("packageManagerVersion: '10.11.1'");
    });

    it('names the workspace config after the workspace, not the root', () => {
        const files = createWorkspaceFiles({
            name: 'root',
            scope: '@acme',
            wsName: 'core',
            wsDir: 'packages/core',
        });
        const config = files.find(file => file.path === 'dbx.config.ts')!.content;
        expect(config).toContain("name: 'core'");
        expect(config).not.toContain("name: 'root'");
    });

    it('generates a runnable source entry and smoke test', () => {
        for (const files of [
            createRootProjectFiles({ name: 'acme' }),
            createWorkspaceFiles({
                name: 'acme',
                scope: '@acme',
                wsName: 'core',
                wsDir: 'packages/core',
            }),
        ]) {
            const paths = files.map(file => file.path);
            expect(paths).toContain('src/index.ts');
            expect(paths).toContain('tests/index.test.ts');
            expect(files.find(file => file.path === 'src/index.ts')!.content).toContain(
                'export function greet'
            );
            expect(files.find(file => file.path === 'tests/index.test.ts')!.content).toContain(
                "from '../src/index.js'"
            );
        }
    });

    it('pairs the package manager with a version in the generated config', () => {
        const files = createRootProjectFiles({ name: 'x', type: 'project' });
        const config = files.find(f => f.path === 'dbx.config.ts')!.content;
        expect(config).toContain("packageManager: 'yarn'");
        expect(config).toContain("packageManagerVersion: '4.17.1'");
        // No explicit manager chosen -> no `packageManager` field yet.
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.packageManager).toBeUndefined();
    });

    it('writes a versioned packageManager when one is chosen', () => {
        const files = createRootProjectFiles({ name: 'x', packageManager: 'pnpm' });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.packageManager).toBe('pnpm@10.11.1');
    });

    it('pins a single Bun project (nowhere to declare the catalog)', () => {
        const files = createRootProjectFiles({ name: 'x', packageManager: 'bun' });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toMatch(/^\^/);
        expect(pkg.workspaces).toBeUndefined();
    });

    it('uses the catalog for a Bun monorepo root', () => {
        const files = createMonorepoRootFiles({ name: 'x', packageManager: 'bun', workspaces: [] });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toBe('catalog:');
        expect((pkg.workspaces as { catalog: Record<string, string> }).catalog).toBeDefined();
    });

    it('renders a gitignore', () => {
        const gitignore = renderGitignore();
        expect(gitignore).toContain('node_modules/');
        expect(gitignore).toContain('.vite/');
        expect(gitignore).toContain('.dbx/toolchain/*');
        expect(gitignore).not.toContain('.turbo/');
    });

    it('keeps the scoped package name when the config omits scope', async () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: '@acme/a', version: '0.1.0' })
        );
        const files = (await projectSyncTask().run({
            cwd: dir,
            projectType: 'monorepo-workspace',
            config: { project: { type: 'monorepo-workspace', name: 'a' } },
            tokens: {},
            log: () => {},
            warn: () => {},
        })) as { path: string; content: string }[];
        const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content);
        expect(pkg.name).toBe('@acme/a');
    });

    it('detects a usable root catalog for workspace scaffolds', () => {
        const yarn = makeTmp();
        fs.writeFileSync(path.join(yarn, '.yarnrc.yml'), 'catalog:\n  react: ^19.0.0\n');
        expect(hasCatalog(yarn, 'yarn')).toBe(true);
        expect(hasCatalog(yarn, 'yarn', ['react'])).toBe(true);
        expect(hasCatalog(yarn, 'yarn', ['react', 'lodash'])).toBe(false);

        const pnpm = makeTmp();
        fs.writeFileSync(path.join(pnpm, 'pnpm-workspace.yaml'), 'catalog:\n  react: ^19.0.0\n');
        expect(hasCatalog(pnpm, 'pnpm')).toBe(true);

        const namedOnly = makeTmp();
        fs.writeFileSync(
            path.join(namedOnly, 'pnpm-workspace.yaml'),
            'catalogs:\n  legacy:\n    react: ^18.0.0\n'
        );
        expect(hasCatalog(namedOnly, 'pnpm')).toBe(false);

        const none = makeTmp();
        expect(hasCatalog(none, 'yarn')).toBe(false);
    });

    it('uses the resolved package manager token for catalogs', async () => {
        const dir = makeTmp();
        const files = await catalogsSyncTask().run({
            cwd: dir,
            projectType: 'project',
            config: { catalogs: { packages: { react: '^19.0.0' } } },
            tokens: { packageManager: 'pnpm' },
            log: () => {},
            warn: () => {},
        });
        expect(files?.some(file => file.path === 'pnpm-workspace.yaml')).toBe(true);
        expect(files?.some(file => file.path === '.yarnrc.yml')).toBe(false);
        expect(catalogsSyncTask().projectTypes).toEqual(['monorepo-root', 'project']);
    });

    it('does not use catalog refs for npm workspaces', () => {
        const files = createWorkspaceFiles({
            name: 'acme',
            packageManager: 'npm',
            wsName: 'core',
            wsDir: 'packages/core',
            useCatalog: true,
        });
        const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toBe(
            SCAFFOLD_CATALOG['@deltabox/toolchain']
        );
    });

    it('keeps the scaffold catalog in step with the toolchain versions', () => {
        const yarnrc = fs.readFileSync(new URL('../../../.yarnrc.yml', import.meta.url), 'utf-8');
        const catalog = new Map<string, string>();
        for (const line of yarnrc.split(/\r?\n/)) {
            const match = line.match(/^ {2}"?([^":]+)"?:\s*(\S+)\s*$/);
            if (match?.[1] && match[2]) catalog.set(match[1], match[2]);
        }
        const rootPkg = JSON.parse(
            fs.readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8')
        ) as { version: string; devDependencies?: Record<string, string> };

        expect(SCAFFOLD_CATALOG['@deltabox/toolchain']).toBe(`^${rootPkg.version}`);
        expect(SCAFFOLD_CATALOG).not.toHaveProperty('@biomejs/biome');
        for (const [name, version] of Object.entries(SCAFFOLD_CATALOG)) {
            if (name === '@deltabox/toolchain') continue;
            const fromCatalog = catalog.get(name);
            const fromDev = rootPkg.devDependencies?.[name];
            const expected =
                fromCatalog ?? (fromDev && fromDev !== 'catalog:' ? fromDev : undefined);
            if (expected) expect(version, name).toBe(expected);
        }
    });

    it('renders catalogs and marks the file as kept (never deleted)', () => {
        expect(renderYarnrc({ packages: { react: '^19.0.0' } })).toContain('catalog:');
        expect(catalogsSyncTask().keep).toContain('.yarnrc.yml');
        expect(catalogsSyncTask().keep).toContain('pnpm-workspace.yaml');
    });
});
