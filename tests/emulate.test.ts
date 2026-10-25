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
                    changelog: true,
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
                'type: "monorepo-workspace"'
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
            expect(manifest.files).toContain('package.json');
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
});
