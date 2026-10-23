/**
 * Real end-to-end emulations of the `dbx` CLI (the surface the VS Code
 * extension and the command palette drive), run against the **built** toolchain.
 *
 * Every test gets its own throwaway workspace under `tests/emulate/<id>` (the
 * directory is gitignored linters + VCS); each scratch root carries an empty
 * `.git` so `dbx` treats it as a repository boundary and never inherits the
 * toolchain repo's own `dbx.config.ts`. The workspace is removed when the test
 * finishes (pass or fail) and again on process exit.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLI = path.join(ROOT, 'dist', 'cli', 'index.js');
const EMULATE_ROOT = path.join(ROOT, 'tests', 'emulate');
const TIMEOUT = 120_000;

/** Scratch workspaces created this run (removed on completion/failure/exit). */
const created = new Set<string>();

/**
 * The toolchain repo's own manifest, snapshotted so a stray root sync (some
 * `vite-plus`/vitest integrations run one) can never leave the working tree
 * dirty. Restored after every test, and once more on exit.
 */
const REPO_MANIFEST = path.join(ROOT, '.dbx', 'toolchain', 'manifest.json');
const repoManifestSnapshot = (() => {
    try {
        return fs.readFileSync(REPO_MANIFEST, 'utf-8');
    } catch {
        return undefined;
    }
})();

function restoreRepoManifest(): void {
    if (repoManifestSnapshot === undefined) return;
    try {
        if (fs.readFileSync(REPO_MANIFEST, 'utf-8') !== repoManifestSnapshot) {
            fs.writeFileSync(REPO_MANIFEST, repoManifestSnapshot, 'utf-8');
        }
    } catch {
        // best-effort
    }
}

/** Create (or reset) a scratch workspace `tests/emulate/<id>` with a `.git` boundary. */
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
    restoreRepoManifest();
}

afterEach(() => removeCreated());
afterAll(() => {
    removeCreated();
    try {
        fs.rmSync(EMULATE_ROOT, { recursive: true, force: true });
    } catch {
        // best-effort
    }
});
// A hard exit (Ctrl-C / a crashed worker) still cleans up.
process.once('exit', removeCreated);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
        removeCreated();
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
            const manifest = readJson<{ files: string[] }>(
                path.join(out, '.dbx/toolchain/manifest.json')
            );
            expect(manifest.files).toContain('package.json');

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
});
