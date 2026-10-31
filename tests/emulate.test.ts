/**
 * Real end-to-end emulations of the `dbx` CLI (the surface the VS Code
 * extension and the command palette drive), run against the **built** toolchain.
 *
 * Every test gets its own throwaway workspace under a temp directory (never
 * inside the toolchain repo); each scratch root carries an empty `.git` so `dbx`
 * treats it as a repository boundary and never inherits the toolchain repo's own
 * `dbx.config.ts`. The workspace is removed when the test finishes (pass or
 * fail) and again on process exit.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'dist', 'cli', 'index.js');

/**
 * The sandbox lives outside the repo, with a `node_modules` junction back to the
 * repo's install so scaffolded `dbx.config.ts` files can still resolve
 * `@deltabox/toolchain`.
 */
const EMULATE_ROOT = (() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-emulate-'));
    try {
        fs.symlinkSync(
            path.join(ROOT, 'node_modules'),
            path.join(dir, 'node_modules'),
            process.platform === 'win32' ? 'junction' : 'dir'
        );
    } catch {
        // Best-effort: tests that need the installed package will fail loudly.
    }
    return dir;
})();
const TIMEOUT = 120_000;

/** Scratch workspaces created this run (removed on completion/failure/exit). */
const created = new Set<string>();

/**
 * The toolchain repo's own managed state, snapshotted so a stray root sync (some
 * `vite-plus`/vitest integrations run one) can never leave the working tree
 * dirty. Restored after every test, and once more on exit.
 */
const REPO_MANIFEST = path.join(ROOT, '.dbx', 'toolchain', 'manifest.json');
const repoStateSnapshot = (() => {
    try {
        const manifest = fs.readFileSync(REPO_MANIFEST, 'utf-8');
        const files = new Map<string, string>();
        for (const relative of (JSON.parse(manifest) as { files?: string[] }).files ?? []) {
            try {
                files.set(relative, fs.readFileSync(path.join(ROOT, relative), 'utf-8'));
            } catch {
                // A manifest entry may already be missing; skip it.
            }
        }
        return { manifest, files };
    } catch {
        return undefined;
    }
})();

function restoreRepoState(): void {
    if (repoStateSnapshot === undefined) return;
    try {
        for (const [relative, content] of repoStateSnapshot.files) {
            const file = path.join(ROOT, relative);
            try {
                if (fs.readFileSync(file, 'utf-8') !== content) {
                    fs.writeFileSync(file, content, 'utf-8');
                }
            } catch {
                fs.mkdirSync(path.dirname(file), { recursive: true });
                fs.writeFileSync(file, content, 'utf-8');
            }
        }
        if (fs.readFileSync(REPO_MANIFEST, 'utf-8') !== repoStateSnapshot.manifest) {
            fs.writeFileSync(REPO_MANIFEST, repoStateSnapshot.manifest, 'utf-8');
        }
    } catch {
        // best-effort
    }
}

/** Create (or reset) a scratch workspace under `<tmp>/dbx-emulate-*` with a `.git` boundary. */
function scratch(id: string): string {
    const dir = path.join(EMULATE_ROOT, id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    // A repository boundary, so `dbx` never walks up into the toolchain repo's
    // own config/manifest.
    fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
    created.add(dir);
    return dir;
}

function removeCreated(): void {
    for (const dir of created) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
        } catch {
            // best-effort
        }
    }
    created.clear();
    restoreRepoState();
}

/** Remove every scratch workspace plus the sandbox root (idempotent). */
function cleanupAll(): void {
    removeCreated();
    try {
        fs.rmSync(EMULATE_ROOT, { recursive: true, force: true });
    } catch {
        // best-effort
    }
}

afterEach(() => removeCreated());
afterAll(() => cleanupAll());
// A hard exit (Ctrl-C / a crashed worker) still cleans up.
process.once('exit', cleanupAll);
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK'] as const) {
    process.once(signal, () => {
        cleanupAll();
        process.exit();
    });
}

interface Result {
    code: number;
    stdout: string;
    stderr: string;
}

/** Run the built `dbx` CLI in `cwd`, capturing stdout/stderr. */
function dbx(cwd: string, args: string[], extraEnv: NodeJS.ProcessEnv = {}): Promise<Result> {
    return new Promise<Result>(resolve => {
        const child = spawn(process.execPath, [CLI, '--no-update-check', ...args], {
            cwd,
            env: { ...process.env, NO_COLOR: '1', ...extraEnv },
        });
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (chunk: Buffer) => (stdout += chunk.toString()));
        child.stderr.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
        child.on('error', error => resolve({ code: 1, stdout, stderr: String(error) }));
        child.on('exit', code => resolve({ code: code ?? 0, stdout, stderr }));
    });
}

/** Run `dbx`, parsing stdout as JSON (throws a useful error on failure). */
async function dbxJson<T>(cwd: string, args: string[]): Promise<T> {
    const result = await dbx(cwd, args);
    if (result.code !== 0) {
        throw new Error(`dbx ${args.join(' ')} failed (${result.code}):\n${result.stderr}`);
    }
    return JSON.parse(result.stdout) as T;
}

function write(file: string, content: string): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf-8');
}

function writeJson(file: string, value: unknown): void {
    write(file, `${JSON.stringify(value, null, 4)}\n`);
}

function readJson<T>(file: string): T {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
}

/** Create a local template directory and register it in `cwd`'s registry. */
async function registerTemplate(
    cwd: string,
    id: string,
    manifest: Record<string, unknown>,
    files: Record<string, string> = {}
): Promise<void> {
    const dir = path.join(cwd, 'templates', id);
    writeJson(path.join(dir, 'template.json'), manifest);
    for (const [relative, content] of Object.entries(files))
        write(path.join(dir, relative), content);
    const result = await dbx(cwd, ['template:add', dir, '--cwd', cwd]);
    expect(result.code, result.stderr).toBe(0);
}

beforeAll(() => {
    if (!fs.existsSync(CLI)) {
        throw new Error(
            `Built CLI missing at ${CLI}. Run \`yarn build\` (or \`yarn test\`) first.`
        );
    }
});

describe('emulate: CLI + templates', () => {
    it(
        'lists the offline builtins with their inputs and actions',
        async () => {
            const ws = scratch('template-list');
            const templates = await dbxJson<
                { id: string; variables?: { name: string }[]; actions?: { id: string }[] }[]
            >(ws, ['template:list', '--json', '--cwd', ws]);
            const ids = templates.map(t => t.id);
            expect(ids).toEqual(
                expect.arrayContaining(['project', 'monorepo', 'vite-plus-application'])
            );
            const project = templates.find(t => t.id === 'project')!;
            expect(project.variables?.map(v => v.name)).toEqual(
                expect.arrayContaining(['name', 'packageManager', 'includeConfig'])
            );
            expect(project.actions?.map(a => a.id)).toContain('install');
        },
        TIMEOUT
    );

    it(
        'keeps working with a broken config but fails sync',
        async () => {
            const ws = scratch('broken-config');
            writeJson(path.join(ws, 'package.json'), { name: 'broken', type: 'module' });
            write(
                path.join(ws, 'dbx.config.ts'),
                "import missing from 'this-module-does-not-exist-xyz';\nexport default { toolchain: { project: { name: 'broken' } } };\n"
            );
            const list = await dbx(ws, ['template:list', '--json']);
            expect(list.code, list.stderr).toBe(0);
            expect(JSON.parse(list.stdout).length).toBeGreaterThanOrEqual(11);
            const sync = await dbx(ws, ['sync']);
            expect(sync.code).toBe(1);
            expect(sync.stderr).toMatch(/failed to load/);
        },
        TIMEOUT
    );

    it(
        'scaffolds a project for each package manager (catalog vs pinned)',
        async () => {
            const ws = scratch('scaffold-pms');
            const cases = ['yarn', 'pnpm', 'npm', 'bun'] as const;
            for (const pm of cases) {
                const out = path.join(ws, pm);
                const result = await dbx(ws, [
                    'create',
                    '--template',
                    'project',
                    '--name',
                    'demo',
                    '--var',
                    `packageManager=${pm}`,
                    '--out',
                    out,
                ]);
                expect(result.code, result.stderr).toBe(0);
                const pkg = readJson<{
                    devDependencies: Record<string, string>;
                    packageManager?: string;
                    workspaces?: unknown;
                }>(path.join(out, 'package.json'));
                // The manager is always paired with a version (corepack-safe).
                expect(pkg.packageManager).toMatch(new RegExp(`^${pm}@\\d`));
                const hasYarnrc = fs.existsSync(path.join(out, '.yarnrc.yml'));
                const hasPnpmWs = fs.existsSync(path.join(out, 'pnpm-workspace.yaml'));
                if (pm === 'yarn' || pm === 'pnpm') {
                    expect(pkg.devDependencies['@deltabox/toolchain']).toBe('catalog:');
                    if (pm === 'yarn') expect(hasYarnrc).toBe(true);
                    if (pm === 'pnpm') expect(hasPnpmWs).toBe(true);
                } else {
                    // npm has no catalogs, and a single Bun project has nowhere to
                    // declare one -> both pin.
                    expect(pkg.devDependencies['@deltabox/toolchain']).toMatch(/^\^\d/);
                    expect(hasYarnrc || hasPnpmWs).toBe(false);
                }
            }
        },
        TIMEOUT
    );

    it(
        'scaffolds a bare monorepo and one with an example (no turbo, minimal config)',
        async () => {
            const ws = scratch('scaffold-monorepo');
            const bare = path.join(ws, 'bare');
            await dbxJson(ws, [
                'create',
                '--template',
                'monorepo',
                '--name',
                'demo',
                '--out',
                bare,
                '--json',
            ]);
            expect(fs.existsSync(path.join(bare, 'packages'))).toBe(false);
            expect(fs.existsSync(path.join(bare, 'turbo.json'))).toBe(false);
            const config = fs.readFileSync(path.join(bare, 'dbx.config.ts'), 'utf-8');
            expect(config).toContain('project:');
            expect(config).not.toContain('changelog:');
            expect(config).not.toContain('biome:');

            const withExample = path.join(ws, 'example');
            await dbxJson(ws, [
                'create',
                '--template',
                'monorepo-example',
                '--name',
                'demo',
                '--out',
                withExample,
                '--json',
            ]);
            expect(fs.existsSync(path.join(withExample, 'packages/core/package.json'))).toBe(true);
            expect(fs.existsSync(path.join(withExample, 'turbo.json'))).toBe(false);
        },
        TIMEOUT
    );

    it(
        'scaffolds runnable Vite+/Oxc projects and wires the monorepo',
        async () => {
            const ws = scratch('scaffold-current');

            // A single project: runnable src/test, Vite+ deps, no Biome.
            const single = path.join(ws, 'single');
            const singleResult = await dbx(ws, [
                'project:init',
                '--name',
                'demo',
                '--scope',
                '@acme',
                '--out',
                single,
            ]);
            expect(singleResult.code, singleResult.stderr).toBe(0);
            expect(fs.existsSync(path.join(single, 'src/index.ts'))).toBe(true);
            expect(fs.existsSync(path.join(single, 'tests/index.test.ts'))).toBe(true);
            expect(fs.existsSync(path.join(single, 'biome.json'))).toBe(false);
            const singlePkg = readJson<{
                scripts: Record<string, string>;
                devDependencies: Record<string, string>;
                packageManager?: string;
            }>(path.join(single, 'package.json'));
            expect(singlePkg.devDependencies['@types/node']).toBe('catalog:');
            expect(singlePkg.devDependencies['vite-plus']).toBe('catalog:');
            expect(singlePkg.devDependencies['@biomejs/biome']).toBeUndefined();
            expect(singlePkg.scripts.format).toBe('dbx fmt');
            expect(singlePkg.scripts.lint).toBe('dbx lint --fix');
            expect(singlePkg.packageManager).toMatch(/^yarn@\d/);
            expect(fs.existsSync(path.join(single, '.oxfmtrc.json'))).toBe(true);
            expect(fs.existsSync(path.join(single, '.oxlintrc.json'))).toBe(true);
            const singleConfig = fs.readFileSync(path.join(single, 'dbx.config.ts'), 'utf-8');
            expect(singleConfig).toContain('fmt:');
            expect(singleConfig).toContain('lint:');
            expect(singleConfig).toContain('oxc:');

            // The Oxc files are managed: `dbx sync` regenerates them from the config.
            fs.rmSync(path.join(single, '.oxfmtrc.json'));
            fs.rmSync(path.join(single, '.oxlintrc.json'));
            const sync = await dbx(single, ['sync']);
            expect(sync.code, sync.stderr).toBe(0);
            expect(fs.existsSync(path.join(single, '.oxfmtrc.json'))).toBe(true);
            expect(fs.existsSync(path.join(single, '.oxlintrc.json'))).toBe(true);
            // `oxc: true` resolves the shared defaults (not a bare `$schema`).
            const oxfmt = readJson<{ useTabs: boolean; ignorePatterns: string[] }>(
                path.join(single, '.oxfmtrc.json')
            );
            expect(oxfmt.useTabs).toBe(false);
            expect(oxfmt.ignorePatterns.length).toBeGreaterThan(0);
            const oxlint = readJson<{ rules: Record<string, string> }>(
                path.join(single, '.oxlintrc.json')
            );
            expect(oxlint.rules.eqeqeq).toBe('warn');

            // A monorepo example: root tsconfig/scripts, workspace named after itself.
            const mono = path.join(ws, 'mono');
            const monoResult = await dbx(ws, [
                'project:init:monorepo',
                '--name',
                'mono',
                '--scope',
                '@mono',
                '--example',
                '--out',
                mono,
            ]);
            expect(monoResult.code, monoResult.stderr).toBe(0);
            expect(fs.existsSync(path.join(mono, 'tsconfig.json'))).toBe(true);
            expect(fs.existsSync(path.join(mono, '.oxfmtrc.json'))).toBe(true);
            expect(fs.existsSync(path.join(mono, '.oxlintrc.json'))).toBe(true);
            const monoPkg = readJson<{ scripts: Record<string, string> }>(
                path.join(mono, 'package.json')
            );
            expect(monoPkg.scripts.build).toContain('dbx run');
            const coreConfig = fs.readFileSync(
                path.join(mono, 'packages/core/dbx.config.ts'),
                'utf-8'
            );
            expect(coreConfig).toContain("name: 'core'");
            const corePkg = readJson<{ exports: Record<string, unknown> }>(
                path.join(mono, 'packages/core/package.json')
            );
            expect(corePkg.exports['.']).toEqual({
                types: './dist/index.d.ts',
                import: './dist/index.js',
            });

            // Adding a workspace updates the root references and uses its catalog.
            const addWorkspace = await dbx(mono, [
                'project:init:workspace',
                '--name',
                'web',
                '--dir',
                'packages/web',
            ]);
            expect(addWorkspace.code, addWorkspace.stderr).toBe(0);
            const workspaces = readJson<{
                compilerOptions: { paths: Record<string, string[]> };
                references: { path: string }[];
            }>(path.join(mono, 'tsconfig.workspaces.json'));
            expect(workspaces.compilerOptions.paths['@mono/web']).toEqual([
                './packages/web/src/index.ts',
            ]);
            expect(workspaces.references).toContainEqual({ path: './packages/web/tsconfig.json' });
            const webPkg = readJson<{ devDependencies: Record<string, string> }>(
                path.join(mono, 'packages/web/package.json')
            );
            expect(webPkg.devDependencies['@deltabox/toolchain']).toBe('catalog:');

            // The application builtin actually produces a Vite app.
            const app = path.join(ws, 'app');
            const appResult = await dbx(ws, [
                'create',
                '--template',
                'application',
                '--name',
                'app',
                '--scope',
                '@acme',
                '--var',
                'packageManager=yarn',
                '--out',
                app,
            ]);
            expect(appResult.code, appResult.stderr).toBe(0);
            expect(fs.existsSync(path.join(app, 'index.html'))).toBe(true);
            expect(fs.existsSync(path.join(app, 'src/main.ts'))).toBe(true);
            const appPkg = readJson<{
                scripts: Record<string, string>;
                devDependencies: Record<string, string>;
            }>(path.join(app, 'package.json'));
            expect(appPkg.scripts.dev).toBe('vite');
            expect(appPkg.scripts.build).toBe('vite build');
            expect(appPkg.devDependencies.tsdown).toBeUndefined();
        },
        TIMEOUT
    );

    it(
        'inherits root Oxc files for nested project scaffolds',
        async () => {
            const ws = scratch('nested-oxc');
            writeJson(path.join(ws, 'package.json'), { name: 'root', private: true });
            write(path.join(ws, '.oxfmtrc.json'), '{}\n');
            write(path.join(ws, '.oxlintrc.json'), '{}\n');
            const out = path.join(ws, 'packages/app');
            const result = await dbx(ws, [
                'project:init',
                '--name',
                'app',
                '--scope',
                '@root',
                '--out',
                out,
            ]);
            expect(result.code, result.stderr).toBe(0);
            expect(fs.existsSync(path.join(out, '.oxfmtrc.json'))).toBe(false);
            expect(fs.existsSync(path.join(out, '.oxlintrc.json'))).toBe(false);
            const config = fs.readFileSync(path.join(out, 'dbx.config.ts'), 'utf-8');
            expect(config).not.toContain('fmt:');
            expect(config).not.toContain('lint:');
        },
        TIMEOUT
    );

    it(
        'requires --force to overwrite template files',
        async () => {
            const ws = scratch('template-force');
            const out = path.join(ws, 'app');
            write(path.join(out, 'README.md'), '# existing\n');
            const refused = await dbx(ws, [
                'create',
                '--template',
                'project',
                '--name',
                'app',
                '--out',
                out,
            ]);
            expect(refused.code).not.toBe(0);
            const forced = await dbx(ws, [
                'create',
                '--template',
                'project',
                '--name',
                'app',
                '--out',
                out,
                '--force',
            ]);
            expect(forced.code, forced.stderr).toBe(0);
            expect(fs.readFileSync(path.join(out, 'README.md'), 'utf-8')).toBe('# app\n');
        },
        TIMEOUT
    );

    it(
        'uses the target --root config for workspace scaffolds',
        async () => {
            const ws = scratch('workspace-root-config');
            const root = path.join(ws, 'root');
            const init = await dbx(ws, [
                'project:init:monorepo',
                '--name',
                'root',
                '--scope',
                '@target',
                '--out',
                root,
            ]);
            expect(init.code, init.stderr).toBe(0);

            // The command runs from `ws`, so the old fallback picked the *cwd*
            // config (none here) instead of the target root's `@target` scope.
            const add = await dbx(ws, [
                'project:init:workspace',
                '--name',
                'web',
                '--root',
                root,
                '--dir',
                'packages/web',
            ]);
            expect(add.code, add.stderr).toBe(0);
            expect(
                readJson<{ name: string }>(path.join(root, 'packages/web/package.json')).name
            ).toBe('@target/web');
            const config = fs.readFileSync(path.join(root, 'packages/web/dbx.config.ts'), 'utf-8');
            expect(config).toContain("scope: '@target'");
        },
        TIMEOUT
    );

    it(
        'honours --no-config when the workspace root differs from cwd',
        async () => {
            const ws = scratch('workspace-root-no-config');
            const root = path.join(ws, 'root');
            const init = await dbx(ws, [
                'project:init:monorepo',
                '--name',
                'root',
                '--scope',
                '@target',
                '--out',
                root,
            ]);
            expect(init.code, init.stderr).toBe(0);

            const add = await dbx(ws, [
                'project:init:workspace',
                '--name',
                'web',
                '--root',
                root,
                '--dir',
                'packages/web',
                '--no-config',
            ]);
            expect(add.code, add.stderr).toBe(0);
            expect(
                readJson<{ name: string }>(path.join(root, 'packages/web/package.json')).name
            ).toBe('@root/web');
            expect(fs.existsSync(path.join(root, 'packages/web/dbx.config.ts'))).toBe(false);
        },
        TIMEOUT
    );

    it(
        'skips the config and Oxc files with project:init --no-config',
        async () => {
            const ws = scratch('scaffold-no-config');
            const out = path.join(ws, 'app');
            const result = await dbx(ws, [
                'project:init',
                '--name',
                'demo',
                '--out',
                out,
                '--no-config',
            ]);
            expect(result.code, result.stderr).toBe(0);
            expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
            expect(fs.existsSync(path.join(out, 'dbx.config.ts'))).toBe(false);
            expect(fs.existsSync(path.join(out, '.oxfmtrc.json'))).toBe(false);
            expect(fs.existsSync(path.join(out, '.oxlintrc.json'))).toBe(false);
        },
        TIMEOUT
    );

    it(
        'inherits package.json metadata and applies non-interactive template defaults',
        async () => {
            const ws = scratch('package-json-defaults');
            writeJson(path.join(ws, 'package.json'), {
                name: '@pkgroot/app',
                packageManager: 'pnpm@10.11.1',
            });

            const init = path.join(ws, 'init');
            const initResult = await dbx(ws, ['project:init', '--name', 'demo', '--out', init]);
            expect(initResult.code, initResult.stderr).toBe(0);
            const initPkg = readJson<{ name: string; packageManager: string }>(
                path.join(init, 'package.json')
            );
            expect(initPkg.name).toBe('@pkgroot/demo');
            expect(initPkg.packageManager).toBe('pnpm@10.11.1');

            const create = path.join(ws, 'create');
            const createResult = await dbx(ws, [
                'create',
                '--template',
                'project',
                '--name',
                'demo',
                '--out',
                create,
            ]);
            expect(createResult.code, createResult.stderr).toBe(0);
            const createPkg = readJson<{ packageManager?: string }>(
                path.join(create, 'package.json')
            );
            expect(createPkg.packageManager).toBe('pnpm@10.11.1');

            // With no package.json/config metadata, the template default applies.
            const empty = scratch('package-json-defaults-empty');
            const defaultResult = await dbx(empty, [
                'create',
                '--template',
                'project',
                '--name',
                'demo',
                '--out',
                path.join(empty, 'app'),
            ]);
            expect(defaultResult.code, defaultResult.stderr).toBe(0);
            const defaultPkg = readJson<{ packageManager?: string }>(
                path.join(empty, 'app/package.json')
            );
            expect(defaultPkg.packageManager).toMatch(/^yarn@\d/);
        },
        TIMEOUT
    );

    it(
        'does not overwrite existing consumer workflows and keeps them after opt-out',
        async () => {
            const ws = scratch('workflow-guard');
            const existing = path.join(ws, '.github/workflows/ci.yml');
            const content = 'name: Existing CI\non: [push]\n';
            write(existing, content);
            writeConfig(ws, {
                project: { name: 'root' },
                ci: { ci: true },
            });

            const sync = await dbx(ws, ['sync']);
            expect(sync.code, sync.stderr).toBe(0);
            expect(fs.readFileSync(existing, 'utf-8')).toBe(content);
            expect(sync.stderr).toContain('leaving it untouched');
            const check = await dbx(ws, ['sync', '--check']);
            expect(check.code, check.stderr).toBe(0);

            // Turning the workflow off must not delete the pre-existing file.
            writeConfig(ws, {
                project: { name: 'root' },
                ci: { ci: false },
            });
            const off = await dbx(ws, ['sync']);
            expect(off.code, off.stderr).toBe(0);
            expect(fs.readFileSync(existing, 'utf-8')).toBe(content);
        },
        TIMEOUT
    );

    it(
        'guards custom workflow paths too',
        async () => {
            const ws = scratch('workflow-guard-custom');
            const existing = path.join(ws, '.github/custom/checks.yaml');
            const content = 'name: Existing checks\non: [push]\n';
            write(existing, content);
            writeConfig(ws, {
                ci: { ci: { filename: 'checks.yaml', dir: '.github/custom' } },
            });
            const sync = await dbx(ws, ['sync']);
            expect(sync.code, sync.stderr).toBe(0);
            expect(fs.readFileSync(existing, 'utf-8')).toBe(content);
        },
        TIMEOUT
    );

    it(
        'generates ci.custom workflows with filename/dir overrides',
        async () => {
            const ws = scratch('custom-workflows');
            writeConfig(ws, {
                project: { name: 'root' },
                ci: {
                    custom: {
                        deploy: {
                            triggers: { workflow_dispatch: {} },
                            filename: 'deploy.yaml',
                            dir: '.github/custom',
                            jobs: {
                                deploy: {
                                    'runs-on': 'ubuntu-latest',
                                    steps: [{ run: 'echo deploy' }],
                                },
                            },
                        },
                    },
                },
            });
            const sync = await dbx(ws, ['sync']);
            expect(sync.code, sync.stderr).toBe(0);
            const file = path.join(ws, '.github/custom/deploy.yaml');
            expect(fs.existsSync(file)).toBe(true);
            expect(fs.readFileSync(file, 'utf-8')).toContain('echo deploy');
            expect(fs.existsSync(path.join(ws, '.github/workflows/deploy.yml'))).toBe(false);
            const check = await dbx(ws, ['sync', '--check']);
            expect(check.code, check.stderr).toBe(0);
        },
        TIMEOUT
    );

    it(
        'resolves a `.` scaffold name to the target directory basename',
        async () => {
            const ws = scratch('dot-name');

            // Via a template (`create`).
            const templated = path.join(ws, 'my-app');
            await dbxJson(ws, [
                'create',
                '--template',
                'project',
                '--name',
                '.',
                '--out',
                templated,
                '--json',
            ]);
            expect(readJson<{ name: string }>(path.join(templated, 'package.json')).name).toBe(
                'my-app'
            );

            // Via the direct scaffold command.
            const direct = path.join(ws, 'cool-lib');
            const init = await dbx(ws, ['project:init', '--name', '.', '--out', direct]);
            expect(init.code, init.stderr).toBe(0);
            expect(readJson<{ name: string }>(path.join(direct, 'package.json')).name).toBe(
                'cool-lib'
            );
        },
        TIMEOUT
    );

    it(
        'runs custom template actions (module + command) and does not copy the module',
        async () => {
            const ws = scratch('template-actions');
            await registerTemplate(
                ws,
                'custom',
                {
                    name: 'Custom',
                    variables: [{ name: 'name', default: 'svc' }],
                    actions: [
                        { id: 'note', module: 'action.mjs' },
                        {
                            id: 'touch',
                            command:
                                "node -e \"require('fs').writeFileSync('from-command.txt','cmd')\"",
                        },
                    ],
                },
                {
                    'README.md': '# {{name}}\n',
                    'action.mjs':
                        'export default async ctx => {\n' +
                        "    const fs = await import('node:fs');\n" +
                        '    fs.writeFileSync(`${ctx.cwd}/from-module.txt`, ctx.packageManager);\n' +
                        '};\n',
                }
            );
            const out = path.join(ws, 'out');
            const result = await dbx(ws, [
                'create',
                '--template',
                'custom',
                '--name',
                'svc',
                '--action',
                'note',
                '--action',
                'touch',
                '--out',
                out,
                '--json',
            ]);
            expect(result.code, result.stderr).toBe(0);
            expect(JSON.parse(result.stdout).ranActions).toEqual(['note', 'touch']);
            expect(fs.existsSync(path.join(out, 'from-module.txt'))).toBe(true);
            expect(fs.existsSync(path.join(out, 'from-command.txt'))).toBe(true);
            // The action module is scaffolding logic, never copied to the output.
            expect(fs.existsSync(path.join(out, 'action.mjs'))).toBe(false);
        },
        TIMEOUT
    );

    it(
        'runs the opt-in install action (off by default)',
        async () => {
            const ws = scratch('install-action');
            await registerTemplate(
                ws,
                'installer',
                { name: 'Installer', actions: [{ id: 'install', builtin: 'install' }] },
                {
                    'package.json':
                        '{\n    "name": "installer-demo",\n    "version": "0.0.0",\n    "private": true\n}\n',
                }
            );

            // Default: no install.
            const off = path.join(ws, 'off');
            const offResult = await dbx(ws, [
                'create',
                '--template',
                'installer',
                '--name',
                'demo',
                '--out',
                off,
            ]);
            expect(offResult.code, offResult.stderr).toBe(0);
            expect(fs.existsSync(path.join(off, 'yarn.lock'))).toBe(false);

            // Enabled: install runs (npm chosen so it never touches the repo's yarn workspace).
            const on = path.join(ws, 'on');
            const onResult = await dbx(
                ws,
                [
                    'create',
                    '--template',
                    'installer',
                    '--name',
                    'demo',
                    '--var',
                    'packageManager=npm',
                    '--action',
                    'install',
                    '--out',
                    on,
                ],
                { npm_config_audit: 'false', npm_config_fund: 'false' }
            );
            expect(onResult.code, onResult.stderr).toBe(0);
            expect(fs.existsSync(path.join(on, 'package-lock.json'))).toBe(true);
        },
        TIMEOUT
    );

    it(
        'writes catalogs and never deletes a hand-edited catalog file',
        async () => {
            const ws = scratch('catalogs');
            writeJson(path.join(ws, 'package.json'), { name: 'cat', type: 'module' });
            writeJson(path.join(ws, 'dbx.config.json'), {
                toolchain: {
                    project: { packageManager: 'yarn' },
                    catalogs: {
                        packages: { react: '^19.0.0' },
                        named: { legacy: { react: '^18.0.0' } },
                    },
                },
            });
            const first = await dbx(ws, ['sync']);
            expect(first.code, first.stderr).toBe(0);
            const yarnrc = fs.readFileSync(path.join(ws, '.yarnrc.yml'), 'utf-8');
            expect(yarnrc).toContain('react: ^19.0.0');
            expect(yarnrc).toContain('legacy:');
            const check = await dbx(ws, ['sync', '--check']);
            expect(check.code, check.stderr).toBe(0);

            // Replace it with a hand-written file (no marker): sync must not delete it.
            fs.writeFileSync(
                path.join(ws, '.yarnrc.yml'),
                'nodeLinker: node-modules\nkeepMe: true\n'
            );
            const second = await dbx(ws, ['sync']);
            expect(second.code, second.stderr).toBe(0);
            expect(fs.existsSync(path.join(ws, '.yarnrc.yml'))).toBe(true);
            expect(fs.readFileSync(path.join(ws, '.yarnrc.yml'), 'utf-8')).toContain(
                'keepMe: true'
            );
        },
        TIMEOUT
    );

    it(
        'preserves a scoped workspace name via nested config inheritance',
        async () => {
            const ws = scratch('nested');
            const root = path.join(ws, 'root');
            writeJson(path.join(root, 'package.json'), {
                name: '@acme/root',
                version: '0.1.0',
                private: true,
                type: 'module',
                workspaces: ['packages/*'],
            });
            writeJson(path.join(root, 'dbx.config.json'), {
                toolchain: {
                    project: {
                        type: 'monorepo-root',
                        name: 'root',
                        scope: '@acme',
                        author: 'Acme',
                    },
                },
            });
            const child = path.join(root, 'packages/a');
            writeJson(path.join(child, 'package.json'), {
                name: '@acme/a',
                version: '0.1.0',
                type: 'module',
            });
            // Sets `name` but not `scope` — it must keep the scoped package name.
            writeJson(path.join(child, 'dbx.config.json'), {
                toolchain: { project: { type: 'monorepo-workspace', name: 'a' } },
            });

            const sync = await dbx(root, ['sync', '--recursive']);
            expect(sync.code, sync.stderr).toBe(0);
            const childPkg = readJson<{ name: string; author?: string }>(
                path.join(child, 'package.json')
            );
            expect(childPkg.name).toBe('@acme/a');
            expect(childPkg.author).toBe('Acme');
            const check = await dbx(root, ['sync', '--recursive', '--check']);
            expect(check.code, check.stderr).toBe(0);
        },
        TIMEOUT
    );

    it(
        'accepts `template:info --json`',
        async () => {
            const ws = scratch('template-info');
            const info = await dbxJson<{ id: string; variables?: unknown[] }>(ws, [
                'template:info',
                'project',
                '--json',
                '--cwd',
                ws,
            ]);
            expect(info.id).toBe('project');
            expect(Array.isArray(info.variables)).toBe(true);
        },
        TIMEOUT
    );

    it(
        'surfaces a custom template + provider through the CLI (the extension flow)',
        async () => {
            const ws = scratch('custom-template-provider');

            // --- A custom local template -----------------------------------
            // `template:add` records the source in `.dbx/toolchain/templates.json`.
            await registerTemplate(
                ws,
                'greeter',
                {
                    name: 'Greeter',
                    description: 'Writes a greeting file.',
                    kind: 'project',
                    variables: [{ name: 'greeting', default: 'hi' }],
                },
                { 'greeting.txt': '{{greeting}} from {{name}}\n' }
            );

            // What the extension's Templates view reads (`template:list --json`).
            const templates = await dbxJson<
                {
                    id: string;
                    name: string;
                    kind?: string;
                    type?: string;
                    online?: boolean;
                    variables?: { name: string }[];
                }[]
            >(ws, ['template:list', '--json', '--cwd', ws]);
            const greeter = templates.find(template => template.id === 'greeter');
            expect(greeter).toMatchObject({
                id: 'greeter',
                name: 'Greeter',
                kind: 'project',
                type: 'local',
                online: false,
            });
            expect(greeter?.variables?.map(variable => variable.name)).toContain('greeting');

            // The extension's per-template detail.
            expect(
                await dbxJson<{ id: string; name: string }>(ws, [
                    'template:info',
                    'greeter',
                    '--json',
                    '--cwd',
                    ws,
                ])
            ).toMatchObject({ id: 'greeter', name: 'Greeter' });

            // It scaffolds like any other template (variables + `name` tokens).
            const out = path.join(ws, 'greeter-out');
            const created = await dbx(ws, [
                'create',
                '--template',
                'greeter',
                '--name',
                'demo',
                '--var',
                'greeting=hello',
                '--out',
                out,
                '--json',
            ]);
            expect(created.code, created.stderr).toBe(0);
            expect(fs.readFileSync(path.join(out, 'greeting.txt'), 'utf-8')).toBe(
                'hello from demo\n'
            );

            // --- A custom provider -----------------------------------------
            // The extension registers one by writing `.dbx/toolchain/providers.json`
            // (its `writeProviderRegistry`); the CLI then lists it and registers a
            // `dbx <command>` passthrough for each of its commands.
            const provider = {
                id: 'demo',
                name: 'Demo provider',
                description: 'A custom provider for the emulation test.',
                // A binary name resolved from PATH (as real providers do, eg. `vp`).
                binary: 'node',
                commands: [
                    { name: 'demo:version', subcommand: '--version', description: 'Node version.' },
                ],
            };
            writeJson(path.join(ws, '.dbx/toolchain/providers.json'), [provider]);

            const providers = await dbxJson<
                { id: string; name: string; commands: { name: string }[] }[]
            >(ws, ['providers', '--json']);
            const listed = providers.find(candidate => candidate.id === 'demo');
            expect(listed).toMatchObject({ id: 'demo', name: 'Demo provider' });
            expect(listed?.commands.map(command => command.name)).toContain('demo:version');

            // The extension marks a provider "custom" by reading the registry file.
            expect(
                readJson<{ id: string }[]>(path.join(ws, '.dbx/toolchain/providers.json')).map(
                    entry => entry.id
                )
            ).toContain('demo');

            // Its command is a real, runnable passthrough.
            const ran = await dbx(ws, ['demo:version']);
            expect(ran.code, ran.stderr).toBe(0);
            expect(ran.stdout.trim()).toMatch(/^v\d+\.\d+\.\d+/);
        },
        TIMEOUT
    );

    it(
        'scaffolds a workspace without root-only files (CI/husky/vscode stay at the root)',
        async () => {
            const ws = scratch('workspace-scaffold');
            const root = path.join(ws, 'root');

            // A real monorepo root, then enable the root-only sections so the
            // root generates them and a workspace must *not* inherit their outputs.
            const init = await dbx(ws, [
                'project:init:monorepo',
                '--name',
                'root',
                '--scope',
                '@acme',
                '--out',
                root,
            ]);
            expect(init.code, init.stderr).toBe(0);
            fs.rmSync(path.join(root, 'dbx.config.ts'), { force: true });
            writeJson(path.join(root, 'dbx.config.json'), {
                toolchain: {
                    project: { type: 'monorepo-root', name: 'root', scope: '@acme' },
                    ci: { changelog: true },
                    biome: true,
                },
            });

            // The root gets the root-only outputs.
            const rootSync = await dbx(root, ['sync']);
            expect(rootSync.code, rootSync.stderr).toBe(0);
            expect(fs.existsSync(path.join(root, 'commitlint.config.mjs'))).toBe(true);
            expect(fs.existsSync(path.join(root, '.husky'))).toBe(true);

            // Scaffold a workspace into it (the extension's workspace flow).
            const scaffold = await dbx(root, [
                'project:init:workspace',
                '--name',
                'my-package',
                '--root',
                root,
                '--dir',
                'packages/my-package',
            ]);
            expect(scaffold.code, scaffold.stderr).toBe(0);

            const pkg = path.join(root, 'packages/my-package');
            // The generated config tags the folder a workspace, not the root's
            // `monorepo-root` (which would generate CI/husky/vscode inside it).
            expect(fs.readFileSync(path.join(pkg, 'dbx.config.ts'), 'utf-8')).toContain(
                "type: 'monorepo-workspace'"
            );

            const sync = await dbx(pkg, ['sync']);
            expect(sync.code, sync.stderr).toBe(0);
            for (const entry of ['.github', '.husky', '.vscode', 'commitlint.config.mjs']) {
                expect(fs.existsSync(path.join(pkg, entry))).toBe(false);
            }
        },
        TIMEOUT
    );

    it(
        'populates the manifest and project graph after scaffolding (the extension flow)',
        async () => {
            const ws = scratch('extension-flow');
            const out = path.join(ws, 'project');
            await dbxJson(ws, [
                'create',
                '--template',
                'monorepo',
                '--name',
                'demo',
                '--out',
                out,
                '--json',
            ]);
            // The extension syncs right after a successful scaffold.
            const sync = await dbx(out, ['sync']);
            expect(sync.code, sync.stderr).toBe(0);
            const manifest = readJson<{ files: string[]; syncedAt?: string }>(
                path.join(out, '.dbx/toolchain/manifest.json')
            );
            // package.json is user-owned: the project task writes it but never
            // tracks it (so `dbx reset` cannot delete it).
            expect(manifest.files).not.toContain('package.json');
            expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
            // The last-sync timestamp is split into its own (gitignored) file.
            expect(manifest.syncedAt).toBeUndefined();
            expect(fs.existsSync(path.join(out, '.dbx/toolchain/timestamps.json'))).toBe(true);

            const graph = await dbxJson<{ projects: unknown[] }>(out, [
                'projects',
                '--json',
                '--cwd',
                out,
            ]);
            expect(graph.projects.length).toBeGreaterThanOrEqual(1);
            expect(fs.existsSync(path.join(out, '.dbx/toolchain/projects.json'))).toBe(true);
        },
        TIMEOUT
    );

    it(
        'applies shorthand formatter/linter defaults and a custom logger end to end',
        async () => {
            const ws = scratch('tooling-defaults');
            writeJson(path.join(ws, 'package.json'), {
                name: 'tooling-defaults',
                version: '1.0.0',
                private: true,
                devDependencies: { 'vite-plus': '^1' },
            });
            write(
                path.join(ws, 'dbx.config.ts'),
                [
                    'const custom = {',
                    "    raw: (m = '') => process.stdout.write(`${m}\\n`),",
                    "    rawError: (m = '') => process.stderr.write(`${m}\\n`),",
                    '    write: () => {},',
                    '    debug: () => {},',
                    "    info: (m = '') => console.log(`CUSTOM:${m}`),",
                    '    success: () => {},',
                    "    warn: (m = '') => console.log(`CUSTOM-WARN:${m}`),",
                    "    error: (m = '') => console.log(`CUSTOM-ERROR:${m}`),",
                    '};',
                    'export default {',
                    '    toolchain: {',
                    '        fmt: { vscode: false },',
                    '        lint: { vscode: false },',
                    '        logger: { logger: custom },',
                    '    },',
                    '};',
                    '',
                ].join('\n')
            );

            const result = await dbx(ws, ['sync', '--cwd', ws]);
            expect(result.code, result.stderr).toBe(0);
            expect(result.stdout).toContain('CUSTOM:');
            const fmt = readJson<Record<string, unknown>>(path.join(ws, '.oxfmtrc.json'));
            expect(fmt.printWidth).toBe(100);
            const lint = readJson<Record<string, unknown>>(path.join(ws, '.oxlintrc.json'));
            expect(lint.rules).toBeTruthy();
        },
        TIMEOUT
    );
});

/** Write a plain-object `dbx.config.ts` (no imports, so it loads in any sandbox). */
function writeConfig(dir: string, toolchain: Record<string, unknown>): void {
    write(
        path.join(dir, 'dbx.config.ts'),
        `export default ${JSON.stringify({ toolchain }, null, 4)};\n`
    );
}

/** A monorepo root with one workspace and every user-owned tsconfig. */
function tsconfigMonorepo(id: string): string {
    const ws = scratch(id);
    writeJson(path.join(ws, 'package.json'), {
        name: id,
        private: true,
        workspaces: ['packages/*'],
    });
    // JSONC input: comments are allowed in user-owned tsconfigs.
    write(
        path.join(ws, 'tsconfig.base.json'),
        '{\n    // shared options\n    "compilerOptions": { "target": "ES2022" }\n}\n'
    );
    writeJson(path.join(ws, 'tsconfig.workspaces.json'), {
        compilerOptions: { composite: false, paths: { '@demo/core': ['./packages/core/src'] } },
    });
    writeJson(path.join(ws, 'packages/core/package.json'), { name: '@demo/core' });
    writeJson(path.join(ws, 'packages/core/tsconfig.default.json'), {
        extends: '../../tsconfig.base.json',
        include: ['src'],
    });
    writeJson(path.join(ws, 'packages/core/tsconfig.build.json'), {
        extends: './tsconfig.default.json',
    });
    return ws;
}

describe('emulate: tsconfig overrides', () => {
    const project = { type: 'monorepo-root', name: 'demo', scope: '@demo' };
    const overrides = {
        base: { compilerOptions: { target: 'ES2020' } },
        root: { compilerOptions: { composite: true, types: ['node'] } },
        default: { compilerOptions: { strict: true } },
        build: { compilerOptions: { declaration: true } },
    };
    const manifestOf = (ws: string) =>
        readJson<{
            files: string[];
            snapshots?: Record<string, any>;
            tsconfigOverrides?: Record<string, { kind: string }>;
        }>(path.join(ws, '.dbx/toolchain/manifest.json'));

    it(
        'applies, checks, reverts, restores and resets overrides through the CLI',
        async () => {
            const ws = tsconfigMonorepo('tsconfig-overrides');
            const base = path.join(ws, 'tsconfig.base.json');
            const root = path.join(ws, 'tsconfig.workspaces.json');
            const defaults = path.join(ws, 'packages/core/tsconfig.default.json');
            const build = path.join(ws, 'packages/core/tsconfig.build.json');

            writeConfig(ws, { project, tsconfig: { overrides } });
            const sync = await dbx(ws, ['sync']);
            expect(sync.code, sync.stderr).toBe(0);
            expect(readJson<any>(base).compilerOptions.target).toBe('ES2020');
            expect(readJson<any>(root).compilerOptions).toMatchObject({
                composite: true,
                types: ['node'],
            });
            expect(readJson<any>(defaults).compilerOptions).toEqual({ strict: true });
            expect(readJson<any>(build).compilerOptions).toEqual({ declaration: true });

            // The manifest tracks only generated files; snapshots mirror the repo
            // with relative paths.
            const manifest = manifestOf(ws);
            expect(manifest.files).toContain('packages/core/tsconfig.json');
            expect(manifest.files).not.toContain('tsconfig.base.json');
            expect(manifest.snapshots?.['tsconfig.base.json']).toEqual({
                compilerOptions: { target: 'ES2022' },
            });
            expect(manifest.snapshots?.packages.core['tsconfig.build.json']).toEqual({
                extends: './tsconfig.default.json',
            });
            expect(Object.keys(manifest.tsconfigOverrides ?? {}).sort()).toEqual([
                'packages/core/tsconfig.build.json',
                'packages/core/tsconfig.default.json',
                'tsconfig.base.json',
                'tsconfig.workspaces.json',
            ]);
            const raw = fs.readFileSync(path.join(ws, '.dbx/toolchain/manifest.json'), 'utf-8');
            expect(raw).not.toContain(ws);
            expect(raw).not.toContain(ws.replace(/\\/g, '/'));

            const check = await dbx(ws, ['sync', '--check']);
            expect(check.code, check.stdout + check.stderr).toBe(0);

            // Drop `composite` (the original defined `false`) and `types` (it did not).
            writeConfig(ws, {
                project,
                tsconfig: { overrides: { ...overrides, root: { compilerOptions: {} } } },
            });
            expect((await dbx(ws, ['sync'])).code).toBe(0);
            expect(readJson<any>(root)).toEqual({
                compilerOptions: {
                    composite: false,
                    paths: { '@demo/core': ['./packages/core/src'] },
                },
            });

            // `--restore <kind>` removes only that kind and warns it is still configured.
            const restore = await dbx(ws, ['tsconfig', '--restore', 'default']);
            expect(restore.code, restore.stderr).toBe(0);
            expect(restore.stdout + restore.stderr).toContain('TSCONFIG_RESTORE_REAPPLY');
            expect(readJson<any>(defaults)).toEqual({
                extends: '../../tsconfig.base.json',
                include: ['src'],
            });
            expect(readJson<any>(base).compilerOptions.target).toBe('ES2020');
            // Still configured, so the generated state is now out of date.
            expect((await dbx(ws, ['sync', '--check'])).code).not.toBe(0);

            // `dbx reset` reverts the remaining overrides before dropping the
            // manifest, and never deletes the user-owned tsconfigs.
            const reset = await dbx(ws, ['reset']);
            expect(reset.code, reset.stderr).toBe(0);
            expect(readJson<any>(base)).toEqual({ compilerOptions: { target: 'ES2022' } });
            expect(readJson<any>(build)).toEqual({ extends: './tsconfig.default.json' });
            expect(fs.existsSync(path.join(ws, 'packages/core/tsconfig.json'))).toBe(false);
            expect(fs.existsSync(path.join(ws, '.dbx/toolchain'))).toBe(false);
        },
        TIMEOUT
    );

    it(
        'honours custom tsconfig file names and warns on a missing target',
        async () => {
            const ws = scratch('tsconfig-overrides-custom');
            writeJson(path.join(ws, 'package.json'), { name: 'custom', private: true });
            writeJson(path.join(ws, 'config/tsconfig.shared.json'), { compilerOptions: {} });
            writeJson(path.join(ws, 'tsconfig.graph.json'), { compilerOptions: {} });
            writeJson(path.join(ws, 'packages/core/tsconfig.src.json'), { compilerOptions: {} });
            // No `tsconfig.dist.json`: the build override has nothing to patch.
            writeConfig(ws, {
                project,
                tsconfig: {
                    baseFile: 'config/tsconfig.shared.json',
                    rootFile: 'tsconfig.graph.json',
                    defaultFile: 'tsconfig.src.json',
                    buildFile: 'tsconfig.dist.json',
                    overrides,
                },
            });

            const sync = await dbx(ws, ['sync']);
            expect(sync.code, sync.stderr).toBe(0);
            expect(sync.stdout + sync.stderr).toContain('TSCONFIG_MISSING_FILE');
            expect(fs.existsSync(path.join(ws, 'packages/core/tsconfig.dist.json'))).toBe(false);
            expect(readJson<any>(path.join(ws, 'config/tsconfig.shared.json'))).toEqual({
                compilerOptions: { target: 'ES2020' },
            });
            expect(readJson<any>(path.join(ws, 'tsconfig.graph.json')).compilerOptions).toEqual({
                composite: true,
                types: ['node'],
            });
            expect(
                readJson<any>(path.join(ws, 'packages/core/tsconfig.src.json')).compilerOptions
            ).toEqual({ strict: true });
            expect(readJson<any>(path.join(ws, 'packages/core/tsconfig.json')).extends).toBe(
                './tsconfig.src.json'
            );
            expect(manifestOf(ws).snapshots?.config['tsconfig.shared.json']).toEqual({
                compilerOptions: {},
            });

            const restore = await dbx(ws, ['tsconfig', '--restore']);
            expect(restore.code, restore.stderr).toBe(0);
            expect(readJson<any>(path.join(ws, 'config/tsconfig.shared.json'))).toEqual({
                compilerOptions: {},
            });
            expect(manifestOf(ws).snapshots).toBeUndefined();
        },
        TIMEOUT
    );

    it(
        'reports the watched inputs (default and custom tsconfig names) for the extension',
        async () => {
            type Inputs = { globs: string[]; tsconfig: Record<string, string> };

            // Defaults: the config file plus the default tsconfig inputs.
            const defaults = tsconfigMonorepo('watch-inputs-default');
            writeConfig(defaults, { project, tsconfig: {} });
            expect(await dbxJson<Inputs>(defaults, ['watch', '--list', '--json'])).toEqual({
                globs: ['**/dbx.config.*', 'tsconfig.workspaces.json', '**/tsconfig.default.json'],
                tsconfig: {
                    baseFile: 'tsconfig.base.json',
                    rootFile: 'tsconfig.workspaces.json',
                    defaultFile: 'tsconfig.default.json',
                    buildFile: 'tsconfig.build.json',
                },
            });

            // Custom names replace the defaults in the watched globs.
            const custom = scratch('watch-inputs-custom');
            writeJson(path.join(custom, 'package.json'), { name: 'custom', private: true });
            const tsconfig = {
                baseFile: 'config/tsconfig.shared.json',
                rootFile: 'tsconfig.graph.json',
                defaultFile: 'tsconfig.src.json',
                buildFile: 'tsconfig.dist.json',
            };
            writeConfig(custom, { project, tsconfig });
            const inputs = await dbxJson<Inputs>(custom, ['watch', '--list', '--json']);
            expect(inputs.globs).toEqual([
                '**/dbx.config.*',
                'tsconfig.graph.json',
                '**/tsconfig.src.json',
            ]);
            expect(inputs.tsconfig).toEqual(tsconfig);

            // Without a tsconfig section only the config file is an input.
            const plain = scratch('watch-inputs-plain');
            writeJson(path.join(plain, 'package.json'), { name: 'plain', private: true });
            writeConfig(plain, { project: { name: 'plain' } });
            expect((await dbxJson<Inputs>(plain, ['watch', '--list', '--json'])).globs).toEqual([
                '**/dbx.config.*',
            ]);
        },
        TIMEOUT
    );
});
