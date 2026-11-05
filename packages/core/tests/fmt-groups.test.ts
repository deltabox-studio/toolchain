import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { FORMAT_IMPORT_GROUP_DEFAULTS_ENV, resolveFmtCustomGroups } from '../src/fmt-groups.js';

afterEach(() => {
    delete process.env[FORMAT_IMPORT_GROUP_DEFAULTS_ENV];
});

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-fmt-groups-'));
    fs.mkdirSync(path.join(dir, '.git'));
    return dir;
}

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value));
}

/** Root + one workspace, both with a dbx config. */
function fixture(): string {
    const root = tmp();
    writeJson(path.join(root, 'package.json'), { name: '@acme/root' });
    writeJson(path.join(root, 'dbx.config.json'), { toolchain: {} });
    const app = path.join(root, 'packages', 'app');
    writeJson(path.join(app, 'package.json'), { name: '@acme/app' });
    writeJson(path.join(app, 'dbx.config.json'), { toolchain: {} });
    // Discovery only includes projects that actually have a dbx config.
    writeJson(path.join(root, 'packages', 'ignored', 'package.json'), {
        name: '@acme/ignored',
    });
    // Test fixtures are dbx projects too, but are not importable packages.
    const fixture = path.join(root, 'packages', 'vscode', 'test-fixtures', 'workspace');
    writeJson(path.join(fixture, 'package.json'), { name: 'fixture-package' });
    writeJson(path.join(fixture, 'dbx.config.json'), { toolchain: {} });
    return root;
}

describe('resolveFmtCustomGroups', () => {
    it('collects the scope and name of every dbx project', async () => {
        const root = fixture();
        expect(await resolveFmtCustomGroups({ cwd: root })).toEqual([
            {
                groupName: 'workspace',
                elementNamePattern: ['@acme/**', 'app', 'app/**', 'root', 'root/**'],
            },
        ]);
    });

    it('adds the project from a custom dbx config file', async () => {
        const root = fixture();
        const config = path.join(root, 'custom', 'dbx.config.json');
        writeJson(config, { toolchain: { project: { scope: '@custom', name: 'tool' } } });

        const groups = await resolveFmtCustomGroups({ cwd: root, config });
        expect(groups[0]?.elementNamePattern).toEqual(
            expect.arrayContaining(['@custom/**', 'tool', 'tool/**'])
        );
    });

    it('adds an inline project', async () => {
        const root = fixture();
        const groups = await resolveFmtCustomGroups({
            cwd: root,
            project: { scope: '@inline', name: 'widget' },
        });
        expect(groups[0]?.elementNamePattern).toEqual(
            expect.arrayContaining(['@inline/**', 'widget', 'widget/**'])
        );
    });

    it('returns no group when nothing is discoverable', async () => {
        expect(await resolveFmtCustomGroups({ cwd: tmp() })).toEqual([]);
    });

    it('accepts a null input', async () => {
        expect(Array.isArray(await resolveFmtCustomGroups(null))).toBe(true);
    });

    it('honours the VS Code workspace setting', async () => {
        const root = fixture();
        writeJson(path.join(root, '.vscode', 'settings.json'), {
            'deltabox.toolchain.enableFormatImportGroupDefaults': false,
        });
        expect(await resolveFmtCustomGroups({ cwd: root })).toEqual([]);
    });

    it('disables the groups from the environment', async () => {
        const root = fixture();
        process.env[FORMAT_IMPORT_GROUP_DEFAULTS_ENV] = '0';
        expect(await resolveFmtCustomGroups({ cwd: root })).toEqual([]);
    });

    it('lets the environment override a workspace setting', async () => {
        const root = fixture();
        writeJson(path.join(root, '.vscode', 'settings.json'), {
            'deltabox.toolchain.enableFormatImportGroupDefaults': false,
        });
        process.env[FORMAT_IMPORT_GROUP_DEFAULTS_ENV] = '1';
        expect(await resolveFmtCustomGroups({ cwd: root })).not.toEqual([]);
    });
});
