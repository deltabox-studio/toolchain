import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { applyFmtCustomGroups, DEFAULT_FMT_RULES } from '@deltabox/toolchain/shared';

import { FORMAT_IMPORT_GROUP_DEFAULTS_ENV, resolveFmtCustomGroups } from '../src/fmt-groups.js';

afterEach(() => {
    delete process.env[FORMAT_IMPORT_GROUP_DEFAULTS_ENV];
});

const OXFMT = fileURLToPath(new URL('../../../node_modules/oxfmt/bin/oxfmt', import.meta.url));

const SOURCE = `import { z } from 'zod';
import path from 'node:path';
import { app } from '@org/app';
import helper from './helper.js';
import { core } from '@org/core';
import { config } from '@/config.js';
import './style.css';

export const items = [path, z, app, core, config, helper];
`;

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
    writeJson(path.join(root, 'package.json'), { name: '@org/root' });
    writeJson(path.join(root, 'dbx.config.json'), { toolchain: {} });
    const app = path.join(root, 'packages', 'app');
    writeJson(path.join(app, 'package.json'), { name: '@org/app' });
    writeJson(path.join(app, 'dbx.config.json'), { toolchain: {} });
    // Discovery only includes projects that actually have a dbx config.
    writeJson(path.join(root, 'packages', 'ignored', 'package.json'), {
        name: '@org/ignored',
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
                elementNamePattern: ['@org/**', 'app', 'app/**', 'root', 'root/**'],
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

describe('formatter output', () => {
    function formatFixture(root: string, fmt: unknown): string {
        const config = path.join(root, '.oxfmtrc.json');
        fs.writeFileSync(config, JSON.stringify(fmt, null, 4));
        const source = path.join(root, 'source.ts');
        fs.writeFileSync(source, SOURCE);
        const result = spawnSync(process.execPath, [OXFMT, '--config', config, '--write', source], {
            encoding: 'utf8',
        });
        expect(result.status, result.stderr).toBe(0);
        return fs.readFileSync(source, 'utf8');
    }

    it('sorts workspace imports into their own group', async () => {
        const root = fixture();
        const fmt = applyFmtCustomGroups(
            DEFAULT_FMT_RULES,
            await resolveFmtCustomGroups({ cwd: root })
        );
        const output = formatFixture(root, fmt);
        expect(output).toBe(`import path from 'node:path';

import { z } from 'zod';

import { app } from '@org/app';
import { core } from '@org/core';

import { config } from '@/config.js';

import helper from './helper.js';

import './style.css';

export const items = [path, z, app, core, config, helper];
`);
    });

    it('sorts workspace imports with external packages when the group is disabled', async () => {
        const root = fixture();
        process.env[FORMAT_IMPORT_GROUP_DEFAULTS_ENV] = '0';
        const fmt = applyFmtCustomGroups(
            DEFAULT_FMT_RULES,
            await resolveFmtCustomGroups({ cwd: root })
        );
        const output = formatFixture(root, fmt);
        expect(output).toBe(`import path from 'node:path';

import { app } from '@org/app';
import { core } from '@org/core';
import { z } from 'zod';

import { config } from '@/config.js';

import helper from './helper.js';

import './style.css';

export const items = [path, z, app, core, config, helper];
`);
    });
});
