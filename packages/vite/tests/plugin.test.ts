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

    it('falls back to a known source everywhere else', () => {
        const resolved = resolveDbx(makeTmp());
        expect(['global', 'npx']).toContain(resolved.source);
        expect(resolved.exe).toBeTruthy();
        if (resolved.source === 'npx') expect(resolved.args).toContain('@deltabox/toolchain');
    });
});
