import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { DBX_TASKS, dbx, resolveDbx } from '../src/index.js';

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
});

describe('DBX_TASKS', () => {
    it('exposes the sync + check tasks to spread into run.tasks', () => {
        expect(DBX_TASKS['dbx:sync']).toEqual({ command: 'dbx sync' });
        expect(DBX_TASKS['dbx:check']).toEqual({ command: 'dbx sync --check' });
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
