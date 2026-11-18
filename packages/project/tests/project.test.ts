import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { parseTsconfig } from '@deltabox/toolchain/tsconfig';

import {
    catalogsSyncTask,
    createMonorepoRootFiles,
    createProjectTemplateFiles,
    createRootProjectFiles,
    createWorkspaceFiles,
    findRootOxcFiles,
    generateProjectConfigs,
    hasCatalog,
    PROJECT_TEMPLATE_IDS,
    projectCommands,
    projectSyncTask,
    renderGitignore,
    renderToolchainConfig,
    renderYarnrc,
    SCAFFOLD_CATALOG,
    upsertWorkspaceTsconfig,
    writeGeneratedFiles,
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
        // Vite+ reads fmt/lint from vite.config; no standalone Oxc files.
        expect(paths).not.toContain('.oxfmtrc.json');
        expect(paths).not.toContain('.oxlintrc.json');
        const config = files.find(f => f.path === 'vite.config.ts')!.content;
        expect(config).toContain('fmt:');
        expect(config).toContain('lint:');
        expect(config).toContain('oxc:');
        expect(config).toContain('catalogs:');
        expect(config).toContain("'@deltabox/toolchain':");
    });

    it('declares every bare import used by the generated Vite config', () => {
        const cases = [
            createRootProjectFiles({ name: 'acme' }),
            createRootProjectFiles({ name: 'acme', kind: 'application' }),
            createMonorepoRootFiles({ name: 'acme', workspaces: [] }),
            createWorkspaceFiles({ name: 'acme', wsName: 'core', wsDir: 'packages/core' }),
            ...PROJECT_TEMPLATE_IDS.map(id => createProjectTemplateFiles(id, { name: 'acme' })),
        ];
        for (const files of cases) {
            const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content) as {
                dependencies?: Record<string, string>;
                devDependencies?: Record<string, string>;
            };
            const config = files.find(file => file.path === 'vite.config.ts')?.content;
            if (!config) continue;
            for (const [, specifier] of config.matchAll(/from '([^']+)'/g)) {
                if (!specifier || specifier.startsWith('.') || specifier.startsWith('node:')) {
                    continue;
                }
                expect(
                    pkg.devDependencies?.[specifier] ?? pkg.dependencies?.[specifier],
                    `${specifier} import in ${config}`
                ).toBeDefined();
            }
        }
    });

    it('does not declare Vite+ tasks that shadow package scripts', () => {
        const cases = [
            createRootProjectFiles({ name: 'acme' }),
            createRootProjectFiles({ name: 'acme', kind: 'application' }),
            createMonorepoRootFiles({ name: 'acme', workspaces: [] }),
            createWorkspaceFiles({ name: 'acme', wsName: 'core', wsDir: 'packages/core' }),
            ...PROJECT_TEMPLATE_IDS.map(id => createProjectTemplateFiles(id, { name: 'acme' })),
        ];
        for (const files of cases) {
            const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content) as {
                scripts?: Record<string, string>;
            };
            const config = files.find(file => file.path === 'vite.config.ts')?.content;
            if (!config) continue;
            expect(config).not.toMatch(/\brun:\s*\{/);
            expect(Object.keys(pkg.scripts ?? {}).length).toBeGreaterThan(0);
        }
    });

    it('inherits root Oxc files for a nested project', () => {
        const files = createRootProjectFiles({
            name: 'app',
            rootOxc: { fmt: true, lint: true },
        });
        const paths = files.map(file => file.path);
        expect(paths).not.toContain('.oxfmtrc.json');
        expect(paths).not.toContain('.oxlintrc.json');
        const config = files.find(f => f.path === 'vite.config.ts')!.content;
        // Opt into the parent's options instead of redefining them locally.
        expect(config).toContain('fmt: true');
        expect(config).toContain('lint: true');
        expect(config).not.toContain('fmt: { oxc: true }');
        expect(config).not.toContain('lint: { oxc: true }');
    });

    it('omits only the Oxc tool a nested root already owns', () => {
        const files = createRootProjectFiles({
            name: 'app',
            rootOxc: { fmt: true, lint: false },
        });
        const paths = files.map(file => file.path);
        expect(paths).not.toContain('.oxfmtrc.json');
        expect(paths).not.toContain('.oxlintrc.json');
        const config = files.find(f => f.path === 'vite.config.ts')!.content;
        expect(config).toContain('fmt: true');
        expect(config).toContain('lint: { oxc: true }');
        expect(config).not.toContain('fmt: { oxc: true }');
    });

    it('finds root Oxc files above a nested scaffold', () => {
        const root = makeTmp();
        fs.writeFileSync(path.join(root, '.oxfmtrc.json'), '{}');
        fs.writeFileSync(path.join(root, '.oxlintrc.json'), '{}');
        const nested = path.join(root, 'packages', 'app');
        fs.mkdirSync(nested, { recursive: true });
        expect(findRootOxcFiles(nested)).toEqual({ fmt: true, lint: true });
        expect(findRootOxcFiles(root)).toEqual({ fmt: false, lint: false });
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
        expect(pkg.scripts.dev).toBe('vp dev');
        expect(pkg.scripts.build).toBe('vp build');
        expect(pkg.devDependencies.tsdown).toBeUndefined();
        expect(pkg.devDependencies.vitest).toBeUndefined();
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
        expect(files.find(f => f.path === 'vite.config.ts')!.content).not.toContain('catalogs:');
    });

    it('creates monorepo root files with references', () => {
        const files = createMonorepoRootFiles({
            name: 'acme',
            scope: '@acme',
            workspaces: [{ alias: 'core', dir: 'packages/core' }],
        });
        const mono = JSON.parse(files.find(f => f.path === 'tsconfig.workspaces.json')!.content);
        expect(mono.compilerOptions.paths['@acme/core']).toEqual(['./packages/core/src/index.ts']);
        expect(mono.compilerOptions).toEqual({
            composite: false,
            paths: {
                '@acme/core': ['./packages/core/src/index.ts'],
                '@acme/core/*': ['./packages/core/src/*'],
            },
        });
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
        expect(paths).not.toContain('.oxfmtrc.json');
        expect(paths).not.toContain('.oxlintrc.json');
        const rootTsconfig = JSON.parse(files.find(file => file.path === 'tsconfig.json')!.content);
        expect(rootTsconfig.extends).toBe('./tsconfig.workspaces.json');
        const pkg = JSON.parse(files.find(file => file.path === 'package.json')!.content);
        expect(pkg.scripts.build).toContain('dbx run');
        expect(pkg.scripts.typecheck).toContain('dbx run');
    });

    it('enables the tsconfig task only for the monorepo root template', () => {
        const root = createMonorepoRootFiles({ name: 'acme', workspaces: [] });
        const rootConfig = root.find(file => file.path === 'vite.config.ts')!.content;
        expect(rootConfig).toContain('tsconfig: true');

        for (const files of [
            createRootProjectFiles({ name: 'app' }),
            createWorkspaceFiles({ name: 'acme', wsName: 'core', wsDir: 'packages/core' }),
        ]) {
            expect(files.find(file => file.path === 'vite.config.ts')!.content).not.toContain(
                'tsconfig: true'
            );
        }

        expect(renderToolchainConfig({ name: 'acme', type: 'monorepo-root' })).toContain(
            'tsconfig: true'
        );
        expect(renderToolchainConfig({ name: 'app', type: 'project' })).not.toContain(
            'tsconfig: true'
        );
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
        expect(pkg.scripts.build).toBe('vp pack');
        expect(pkg.packageManager).toBe('yarn@4.17.1');
        expect(pkg.devDependencies.tsdown).toBeUndefined();
        expect(pkg.devDependencies.vitest).toBeUndefined();
        const vite = files.find(f => f.path === 'vite.config.ts')!.content;
        expect(vite).toContain("from 'vite-plugin-dbx'");
        expect(vite).not.toMatch(/\brun:\s*\{/);
        expect(files.some(f => f.path === 'tsdown.config.ts')).toBe(false);
        expect(JSON.parse(files.find(f => f.path === 'tsconfig.build.json')!.content).extends).toBe(
            './tsconfig.json'
        );
    });

    it('writes the inherited project metadata into package.json and vite.config.ts', () => {
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
        const config = files.find(f => f.path === 'vite.config.ts')!.content;
        expect(config).toContain("description: 'The acme app'");
        expect(config).toContain("repo: 'https://github.com/acme/acme'");
        expect(config).toContain("nodeVersion: '24'");
    });

    it('escapes control characters in generated config strings', () => {
        const config = createRootProjectFiles({
            name: 'acme',
            description: 'line1\nline2\rline3',
        }).find(file => file.path === 'vite.config.ts')!.content;
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

    it('writes the project graph before generating a config', () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'acme' }));

        const result = generateProjectConfigs({ root: dir });
        const graphPath = path.join(dir, '.dbx', 'toolchain', 'projects.json');
        expect(result.graphPath).toBe(graphPath);
        const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
        expect(graph.projects[0]).toMatchObject({
            dir: '.',
            hasConfig: true,
            config: 'dbx.config.ts',
        });
    });

    it('skips a project already configured through the Vite plugin', () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'acme' }));
        fs.writeFileSync(
            path.join(dir, 'vite.config.ts'),
            "import { dbx } from 'vite-plugin-dbx';\n\nexport default { plugins: [dbx({})] };\n"
        );

        const result = generateProjectConfigs({ root: dir });

        expect(result.created).toEqual([]);
        expect(result.skipped).toContain('.');
        expect(fs.existsSync(path.join(dir, 'dbx.config.ts'))).toBe(false);
    });

    it('keeps plugin-mode projects in the graph it rewrites', () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: 'acme', workspaces: ['packages/*'] })
        );
        const plugin = path.join(dir, 'packages', 'a');
        fs.mkdirSync(plugin, { recursive: true });
        fs.writeFileSync(path.join(plugin, 'package.json'), JSON.stringify({ name: '@acme/a' }));
        fs.writeFileSync(
            path.join(plugin, 'vite.config.ts'),
            "import { dbx } from 'vite-plugin-dbx';\n\nexport default { plugins: [dbx({})] };\n"
        );
        const plain = path.join(dir, 'packages', 'b');
        fs.mkdirSync(plain, { recursive: true });
        fs.writeFileSync(path.join(plain, 'package.json'), JSON.stringify({ name: '@acme/b' }));

        const result = generateProjectConfigs({ root: dir });

        expect(result.created).toContain('packages/b');
        const graph = JSON.parse(
            fs.readFileSync(path.join(dir, '.dbx', 'toolchain', 'projects.json'), 'utf-8')
        );
        expect(graph.dbxProjects.map((project: { dir: string }) => project.dir).sort()).toEqual([
            '.',
            'packages/a',
            'packages/b',
        ]);
        expect(graph.order.sort()).toEqual(['.', 'packages/a', 'packages/b']);
    });

    it('writes only the project graph when skipConfig is set', () => {
        const dir = makeTmp();
        fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'acme' }));

        const result = generateProjectConfigs({ root: dir, skipConfig: true });
        expect(result.created).toEqual([]);
        expect(result.skipped).toContain('.');
        expect(fs.existsSync(path.join(dir, 'dbx.config.ts'))).toBe(false);
        expect(fs.existsSync(path.join(dir, '.dbx', 'toolchain', 'projects.json'))).toBe(true);
    });

    it('generates a module-aware JavaScript config', () => {
        const esm = makeTmp();
        fs.writeFileSync(
            path.join(esm, 'package.json'),
            JSON.stringify({ name: 'esm', type: 'module' })
        );
        expect(generateProjectConfigs({ root: esm, language: 'js' }).created).toContain('.');
        expect(fs.existsSync(path.join(esm, 'dbx.config.mjs'))).toBe(true);
        expect(fs.readFileSync(path.join(esm, 'dbx.config.mjs'), 'utf-8')).toContain(
            'export default defineConfig'
        );

        const cjs = makeTmp();
        fs.writeFileSync(
            path.join(cjs, 'package.json'),
            JSON.stringify({ name: 'cjs', type: 'commonjs' })
        );
        expect(generateProjectConfigs({ root: cjs, language: 'js' }).created).toContain('.');
        const content = fs.readFileSync(path.join(cjs, 'dbx.config.cjs'), 'utf-8');
        expect(content).toContain('module.exports');
        expect(content).not.toContain('import { defineConfig }');
    });

    it('honours an explicit config extension', () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: 'acme', type: 'module' })
        );
        generateProjectConfigs({ root: dir, language: 'js', extension: 'js' });
        expect(fs.existsSync(path.join(dir, 'dbx.config.js'))).toBe(true);
        expect(fs.readFileSync(path.join(dir, 'dbx.config.js'), 'utf-8')).toContain(
            'export default defineConfig'
        );
    });

    it('names the workspace config after the workspace, not the root', () => {
        const files = createWorkspaceFiles({
            name: 'root',
            scope: '@acme',
            wsName: 'core',
            wsDir: 'packages/core',
        });
        const config = files.find(file => file.path === 'vite.config.ts')!.content;
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
        const config = files.find(f => f.path === 'vite.config.ts')!.content;
        expect(config).toContain("packageManager: 'yarn'");
        expect(config).toContain("packageManagerVersion: '4.17.1'");
        // The package.json mirrors the config so `sync --check` is clean.
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.packageManager).toBe('yarn@4.17.1');
    });

    it('writes a versioned packageManager when one is chosen', () => {
        const files = createRootProjectFiles({ name: 'x', packageManager: 'pnpm' });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.packageManager).toBe('pnpm@10.11.1');
    });

    it('pins a single Bun project (nowhere to declare the catalog)', () => {
        const files = createRootProjectFiles({ name: 'x', packageManager: 'bun' });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toBe(
            SCAFFOLD_CATALOG['@deltabox/toolchain']
        );
        expect(pkg.workspaces).toBeUndefined();
        expect(files.find(f => f.path === 'vite.config.ts')!.content).not.toContain('catalogs:');
    });

    it('uses the catalog for a Bun monorepo root', () => {
        const files = createMonorepoRootFiles({ name: 'x', packageManager: 'bun', workspaces: [] });
        const pkg = JSON.parse(files.find(f => f.path === 'package.json')!.content);
        expect(pkg.devDependencies['@deltabox/toolchain']).toBe('catalog:');
        expect((pkg.workspaces as { catalog: Record<string, string> }).catalog).toBeDefined();
        // Bun's catalog lives in package.json; `dbx sync` does not manage a
        // separate catalog file, so the config does not opt into one.
        expect(files.find(f => f.path === 'vite.config.ts')!.content).not.toContain('catalogs:');
    });

    it('renders a gitignore', () => {
        const gitignore = renderGitignore();
        expect(gitignore).toContain('node_modules/');
        expect(gitignore).toContain('.vite/');
        expect(gitignore).toContain('.dbx/toolchain/*');
        expect(gitignore).not.toContain('.turbo/');
    });

    it('writes each generated file once and refuses duplicates', () => {
        const dir = makeTmp();
        const written = writeGeneratedFiles(
            [
                { path: 'a.txt', content: 'a' },
                { path: 'b.txt', content: 'b' },
            ],
            dir
        );
        expect(written).toEqual([path.join(dir, 'a.txt'), path.join(dir, 'b.txt')]);
        expect(fs.readFileSync(path.join(dir, 'a.txt'), 'utf-8')).toBe('a');
        expect(fs.readFileSync(path.join(dir, 'b.txt'), 'utf-8')).toBe('b');
        expect(() =>
            writeGeneratedFiles(
                [
                    { path: 'c.txt', content: 'c' },
                    { path: './c.txt', content: 'd' },
                ],
                dir
            )
        ).toThrow(/duplicate/);
    });

    it('refuses to overwrite unless forced', () => {
        const dir = makeTmp();
        writeGeneratedFiles([{ path: 'a.txt', content: 'a' }], dir);
        expect(() => writeGeneratedFiles([{ path: 'a.txt', content: 'b' }], dir)).toThrow(
            /overwrite/
        );
        writeGeneratedFiles([{ path: 'a.txt', content: 'b' }], dir, { force: true });
        expect(fs.readFileSync(path.join(dir, 'a.txt'), 'utf-8')).toBe('b');
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

        const bomYarn = makeTmp();
        fs.writeFileSync(path.join(bomYarn, '.yarnrc.yml'), '\uFEFFcatalog:\n  react: ^19.0.0\n');
        expect(hasCatalog(bomYarn, 'yarn', ['react'])).toBe(true);

        const bun = makeTmp();
        fs.writeFileSync(
            path.join(bun, 'package.json'),
            `\uFEFF${JSON.stringify({
                name: 'bun-root',
                workspaces: { packages: ['packages/*'], catalog: { react: '^19.0.0' } },
            })}`
        );
        expect(hasCatalog(bun, 'bun', ['react'])).toBe(true);

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

        expect(SCAFFOLD_CATALOG['@deltabox/toolchain']).toBe(rootPkg.version);
        expect(SCAFFOLD_CATALOG).not.toHaveProperty('@biomejs/biome');
        for (const [name, version] of Object.entries(SCAFFOLD_CATALOG)) {
            if (name === '@deltabox/toolchain') continue;
            const fromCatalog = catalog.get(name);
            const fromDev = rootPkg.devDependencies?.[name];
            const expected =
                fromCatalog ?? (fromDev && fromDev !== 'catalog:' ? fromDev : undefined);
            if (expected) {
                const core = (value: string) => value.replace(/^[\^~]/, '');
                expect(core(version), name).toBe(core(expected));
            }
        }
    });

    it('renders catalogs and marks the file as kept (never deleted)', () => {
        expect(renderYarnrc({ packages: { react: '^19.0.0' } })).toContain('catalog:');
        expect(catalogsSyncTask().keep).toContain('.yarnrc.yml');
        expect(catalogsSyncTask().keep).toContain('pnpm-workspace.yaml');
    });
});

describe('project:init CLI', () => {
    it('rejects an unsupported package manager', async () => {
        const command = projectCommands().find(candidate => candidate.name === 'project:init');
        if (!command?.run) throw new Error('missing project:init command');
        const out = makeTmp();

        await expect(
            Promise.resolve(
                command.run!(
                    { name: 'bad', out, packageManager: 'pnpmx' },
                    { cwd: out, projectType: 'project', config: {}, tokens: {} }
                )
            )
        ).rejects.toThrow(/invalid package manager/);
        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(false);
    });

    it('does not inherit project identity for an --out elsewhere', () => {
        const command = projectCommands().find(candidate => candidate.name === 'project:init');
        if (!command?.run) throw new Error('missing project:init command');
        const cwd = makeTmp();
        const out = makeTmp();

        command.run!(
            { name: 'demo', out },
            {
                cwd,
                projectType: 'project',
                config: {},
                tokens: {
                    scope: '@acme',
                    description: 'The toolchain',
                    author: 'Acme',
                    repo: 'https://github.com/acme/toolchain',
                    nodeVersion: '22',
                },
            }
        );

        const pkg = JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf-8'));
        expect(pkg.name).toBe('demo');
        expect(pkg.description).toBeUndefined();
        expect(pkg.author).toBeUndefined();
        expect(pkg.repository).toBeUndefined();
        expect(pkg.engines).toEqual({ node: '>=22' });
    });

    it('does not inherit the config project name for an --out elsewhere', () => {
        const command = projectCommands().find(candidate => candidate.name === 'project:init');
        if (!command?.run) throw new Error('missing project:init command');
        const cwd = makeTmp();
        const out = path.join(makeTmp(), 'new-app');
        fs.mkdirSync(out, { recursive: true });

        command.run!(
            { out },
            { cwd, projectType: 'project', config: { project: { name: 'toolchain' } }, tokens: {} }
        );

        const pkg = JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf-8'));
        expect(pkg.name).toBe('new-app');
    });

    it('does not inherit the config name for project:init:monorepo --out elsewhere', () => {
        const command = projectCommands().find(
            candidate => candidate.name === 'project:init:monorepo'
        );
        if (!command?.run) throw new Error('missing project:init:monorepo command');
        const cwd = makeTmp();
        const out = path.join(makeTmp(), 'new-monorepo');
        fs.mkdirSync(out, { recursive: true });

        command.run!(
            { out },
            { cwd, projectType: 'project', config: { project: { name: 'toolchain' } }, tokens: {} }
        );

        const pkg = JSON.parse(fs.readFileSync(path.join(out, 'package.json'), 'utf-8'));
        expect(pkg.name).toBe('new-monorepo');
    });
});
