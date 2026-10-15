import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
    DEFAULT_LINT_IGNORE,
    DEFAULT_TEST_INCLUDE,
    renderViteConfig,
    resolveVp,
    VP_COMMANDS,
    viteCommandName,
    viteConfigObject,
    viteProvider,
} from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-vite-'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('vp command catalog', () => {
    it('namespaces command names', () => {
        expect(viteCommandName('dev')).toBe('vite:dev');
    });

    it('covers the documented vp commands', () => {
        const names = VP_COMMANDS.map(command => command.name);
        for (const expected of [
            'create',
            'migrate',
            'dev',
            'check',
            'test',
            'build',
            'pack',
            'run',
        ]) {
            expect(names).toContain(expected);
        }
    });

    it('keeps the provider commands in sync with the catalog', () => {
        const provider = viteProvider();
        expect(provider.id).toBe('vite-plus');
        expect(provider.binary).toBe('vp');
        expect(provider.commands).toHaveLength(VP_COMMANDS.length);
        expect(provider.commands.map(command => command.name)).toEqual(
            VP_COMMANDS.map(command => viteCommandName(command.name))
        );
    });
});

describe('vp resolution', () => {
    it('prefers a project-local shim', () => {
        const dir = makeTmp();
        const bin = path.join(dir, 'node_modules', '.bin');
        fs.mkdirSync(bin, { recursive: true });
        for (const name of ['vp', 'vp.cmd', 'vp.exe']) {
            fs.writeFileSync(path.join(bin, name), '');
        }
        expect(resolveVp(dir).source).toBe('local');
    });

    it('falls back to a known source everywhere else', () => {
        const resolved = resolveVp(makeTmp());
        expect(['global', 'npx']).toContain(resolved.source);
        expect(resolved.exe).toBeTruthy();
        if (resolved.source === 'npx') expect(resolved.args).toContain('vite-plus');
    });
});

describe('vite.config.ts generation', () => {
    const tokens = { name: 'acme', scope: '@acme' };

    it('renders a vite-plus config with the default sections', () => {
        const source = renderViteConfig(tokens, {});
        expect(source).toContain("import { defineConfig } from 'vite-plus';");
        expect(source).toContain('defineConfig({');
        for (const glob of DEFAULT_TEST_INCLUDE) expect(source).toContain(glob);
        for (const glob of DEFAULT_LINT_IGNORE) expect(source).toContain(glob);
        expect(source).not.toContain('{{');
    });

    it('adds create.defaultTemplate for online templates', () => {
        const config = viteConfigObject(tokens, { defaultTemplate: '@acme' });
        expect((config.create as { defaultTemplate: string }).defaultTemplate).toBe('@acme');
    });

    it('deep-merges overrides over the defaults', () => {
        const config = viteConfigObject(tokens, {
            overrides: { test: { globals: true }, server: { port: 4000 } },
        });
        expect((config.test as Record<string, unknown>).globals).toBe(true);
        // the default include survives the merge
        expect((config.test as Record<string, unknown>).include).toEqual(DEFAULT_TEST_INCLUDE);
        expect((config.server as Record<string, unknown>).port).toBe(4000);
    });

    it('resolves {{ tokens }} inside overrides', () => {
        const source = renderViteConfig(tokens, { overrides: { define: { APP: '{{name}}' } } });
        expect(source).toContain('acme');
        expect(source).not.toContain('{{');
    });
});
