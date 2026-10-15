import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { DBX_TASKS, dbx, defineDbxConfig, resolveDbx } from '../src/index.js';

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

describe('defineDbxConfig()', () => {
    it('prepends the plugin and registers the dbx tasks', () => {
        const config = defineDbxConfig({ server: { port: 4000 } });
        expect(config.server?.port).toBe(4000);
        const plugins = config.plugins as unknown as { name: string }[];
        expect(plugins[0]?.name).toBe('deltabox-toolchain');
        const tasks = (config.run as { tasks: Record<string, unknown> }).tasks;
        expect(tasks['dbx:sync']).toEqual(DBX_TASKS['dbx:sync']);
        expect(tasks['dbx:check']).toEqual(DBX_TASKS['dbx:check']);
    });

    it('keeps existing plugins and tasks', () => {
        const existing = { name: 'existing' };
        const config = defineDbxConfig({
            plugins: [existing],
            run: { tasks: { build: { command: 'vp build' } } },
        });
        const plugins = config.plugins as unknown as { name: string }[];
        expect(plugins.map(plugin => plugin.name)).toEqual(['deltabox-toolchain', 'existing']);
        const tasks = (config.run as { tasks: Record<string, unknown> }).tasks;
        expect(tasks.build).toEqual({ command: 'vp build' });
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
