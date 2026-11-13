import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { DBX_TASKS, dbx, dbxTaskCommand, resolveDbx } from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-plugin-'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('dbx() plugin', () => {
    it('is a named Vite plugin with the expected hooks', () => {
        const plugin = dbx();
        expect(plugin.name).toBe('deltabox-toolchain');
        expect(typeof plugin.buildStart).toBe('function');
        expect(typeof plugin.configResolved).toBe('function');
        expect(typeof plugin.watchChange).toBe('function');
    });

    it('rejects a global-scoped enabled value in the inline toolchain config', () => {
        expect(() => dbx({ toolchain: { enabled: { scope: 'global' } } } as never)).toThrow(
            /workspace/
        );
    });
});

describe('DBX_TASKS', () => {
    it('exposes shell-ready sync + check tasks resolved from the project (not PATH)', () => {
        expect(DBX_TASKS['dbx:sync'].command).toMatch(/\bsync$/);
        expect(DBX_TASKS['dbx:check'].command).toMatch(/\bsync --check$/);
        // The command is a resolved invocation, never the bare `dbx` (which would
        // depend on the shell's PATH / environment).
        expect(DBX_TASKS['dbx:sync'].command).not.toBe('dbx sync');
    });

    it('builds a task command from a resolved binary', () => {
        expect(dbxTaskCommand('sync', makeTmp())).toMatch(/\bsync$/);
    });
});

describe('dbx resolution', () => {
    it('prefers a project-local shim', () => {
        const dir = makeTmp();
        const bin = path.join(dir, 'node_modules', '.bin');
        fs.mkdirSync(bin, { recursive: true });
        for (const name of ['dbx', 'dbx.cmd', 'dbx.exe']) {
            fs.writeFileSync(path.join(bin, name), '');
        }
        expect(resolveDbx(dir).source).toBe('local');
    });

    it('prefers the repo’s own @deltabox/toolchain bin over a global dbx', () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: '@deltabox/toolchain', bin: { dbx: './dist/cli/index.js' } })
        );
        fs.mkdirSync(path.join(dir, 'dist', 'cli'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'dist', 'cli', 'index.js'), '');
        const resolved = resolveDbx(dir);
        expect(resolved.source).toBe('local');
        expect(resolved.args).toEqual([path.join(dir, 'dist', 'cli', 'index.js')]);
    });

    it('falls back to a known source everywhere else', () => {
        const resolved = resolveDbx(makeTmp());
        expect(['global', 'npx']).toContain(resolved.source);
        expect(resolved.exe).toBeTruthy();
        if (resolved.source === 'npx') expect(resolved.args).toContain('@deltabox/toolchain');
    });

    /** Put a fake `dbx` on PATH and run `fn`, restoring PATH afterwards. */
    function withGlobalDbx(fn: (globalBin: string) => void): void {
        const binDir = makeTmp();
        const name = process.platform === 'win32' ? 'dbx.cmd' : 'dbx';
        const globalBin = path.join(binDir, name);
        fs.writeFileSync(globalBin, '');
        if (process.platform !== 'win32') fs.chmodSync(globalBin, 0o755);
        const saved = process.env.PATH;
        process.env.PATH = `${binDir}${path.delimiter}${saved ?? ''}`;
        try {
            fn(globalBin);
        } finally {
            process.env.PATH = saved;
        }
    }

    it('ignores a stale global dbx when the project pins the toolchain', () => {
        withGlobalDbx(() => {
            const project = makeTmp();
            const dep = path.join(project, 'node_modules', '@deltabox', 'toolchain');
            fs.mkdirSync(dep, { recursive: true });
            fs.writeFileSync(
                path.join(dep, 'package.json'),
                JSON.stringify({ name: '@deltabox/toolchain', version: '9.9.9' })
            );
            const resolved = resolveDbx(project);
            expect(resolved.source).toBe('npx');
            expect(resolved.args.join(' ')).toContain('@deltabox/toolchain@9.9.9');
        });
    });

    it('uses a global dbx only when the project pins nothing', () => {
        withGlobalDbx(globalBin => {
            const resolved = resolveDbx(makeTmp());
            expect(resolved.source).toBe('global');
            expect(resolved.exe).toBe(globalBin);
        });
    });
});

describe('dbx() plugin config bridge', () => {
    const MARKER = Symbol.for('@deltabox/toolchain/vite-plugin');

    function withPackage(dir: string, deps: Record<string, unknown>): void {
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: 'fixture', private: true, ...deps })
        );
    }

    type ConfigHook = (config: Record<string, unknown>, env: unknown) => Promise<unknown> | unknown;

    async function runConfig(
        dir: string,
        options: Parameters<typeof dbx>[0],
        userConfig: Record<string, unknown> = {}
    ): Promise<Record<string, unknown>> {
        const plugin = dbx({ cwd: dir, ...options });
        const hook = plugin.config as unknown as ConfigHook;
        return ((await hook(userConfig, { command: 'serve', mode: 'development' })) ??
            {}) as Record<string, unknown>;
    }

    it('marks itself with the inline toolchain options', () => {
        const plugin = dbx({ toolchain: { project: { name: 'inline' } } });
        const descriptor = (plugin as unknown as Record<symbol, { toolchain: unknown }>)[MARKER];
        const toolchain = descriptor?.toolchain;
        expect(toolchain).toMatchObject({ project: { name: 'inline' } });
        expect((toolchain as { vite?: unknown }).vite).toBeUndefined();
    });

    it('maps the dbx logger and watch sections onto Vite options', async () => {
        const dir = makeTmp();
        const result = await runConfig(dir, {
            toolchain: { logger: { level: 'warn' }, watch: { exclude: '**/ignored/**' } },
        });
        expect(result.logLevel).toBe('warn');
        expect(result.server).toMatchObject({ watch: { ignored: '**/ignored/**' } });
        // Pure Vite: no Vite+ only keys.
        expect(result.fmt).toBeUndefined();
        expect(result.lint).toBeUndefined();
    });

    it('adds fmt/lint only when Vite+ is declared', async () => {
        const plain = makeTmp();
        const plainResult = await runConfig(plain, { toolchain: { fmt: true, lint: true } });
        expect(plainResult.fmt).toBeUndefined();

        const vitePlus = makeTmp();
        withPackage(vitePlus, { devDependencies: { 'vite-plus': '^1.0.0' } });
        const result = await runConfig(vitePlus, { toolchain: { fmt: true, lint: true } });
        expect(result.fmt).toBeTruthy();
        expect(result.lint).toBeTruthy();
    });

    it('reads dbx.config when no inline toolchain is given', async () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'dbx.config.json'),
            JSON.stringify({ toolchain: { logger: { level: 'error' } } })
        );
        const result = await runConfig(dir, {});
        expect(result.logLevel).toBe('error');
    });
});
