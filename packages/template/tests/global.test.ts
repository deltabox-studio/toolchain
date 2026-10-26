import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    addGlobalTemplate,
    defaultGlobalTemplatesDir,
    loadGlobalTemplates,
    readGlobalCliConfig,
    readVscodeSearchPaths,
    resolveTemplateSearchPaths,
    writeGlobalCliConfig,
    writeVscodeSearchPaths,
} from '../src/index.js';

let home: string;

beforeEach(() => {
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-global-'));
    vi.spyOn(os, 'homedir').mockReturnValue(home);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    fs.rmSync(home, { recursive: true, force: true });
});

describe('global template registry', () => {
    it('defaults to ~/.dbx/toolchain/.registry/templates', () => {
        const resolved = resolveTemplateSearchPaths();
        expect(resolved.paths).toEqual([defaultGlobalTemplatesDir()]);
        expect(resolved.source).toBe('default');
        expect(defaultGlobalTemplatesDir()).toBe(
            path.join(home, '.dbx', 'toolchain', '.registry', 'templates')
        );
    });

    it('reads search paths from the CLI config (home-expanded)', () => {
        writeGlobalCliConfig({ templatesSearchPaths: '~/my-templates' });
        expect(readGlobalCliConfig().templatesSearchPaths).toBe('~/my-templates');
        const resolved = resolveTemplateSearchPaths();
        expect(resolved.paths).toEqual([path.join(home, 'my-templates')]);
        expect(resolved.source).toBe('cli');
    });

    it('writes/reads the VS Code setting and preserves other settings/comments', () => {
        const vscodeDir = path.join(home, 'Code', 'User');
        fs.mkdirSync(vscodeDir, { recursive: true });
        const settings = path.join(vscodeDir, 'settings.json');
        fs.writeFileSync(settings, '{\n    // keep me\n    "editor.tabSize": 4\n}\n', 'utf-8');

        expect(
            writeVscodeSearchPaths(vscodeDir, [path.join(home, 'a'), path.join(home, 'b')])
        ).toBe(true);
        expect(readVscodeSearchPaths(vscodeDir)).toEqual([
            path.join(home, 'a'),
            path.join(home, 'b'),
        ]);
        const text = fs.readFileSync(settings, 'utf-8');
        expect(text).toContain('// keep me');
        expect(text).toContain('"editor.tabSize": 4');
    });

    it('copies a registered template into the global dir and loads it', async () => {
        const source = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-template-src-'));
        try {
            fs.writeFileSync(
                path.join(source, 'template.json'),
                JSON.stringify({ name: 'My Template', kind: 'folder' }),
                'utf-8'
            );
            fs.writeFileSync(path.join(source, 'README.md'), '# hi\n', 'utf-8');

            const destination = addGlobalTemplate(source, 'my-template');
            expect(destination).toBe(path.join(defaultGlobalTemplatesDir(), 'my-template'));
            expect(fs.existsSync(path.join(destination, 'template.json'))).toBe(true);

            const global = await loadGlobalTemplates();
            expect(global.templates.map(template => template.id)).toContain('my-template');
        } finally {
            fs.rmSync(source, { recursive: true, force: true });
        }
    });

    it('merges sources from a remote (http) registry', async () => {
        writeGlobalCliConfig({
            templatesSearchPaths: ['https://example.com/templates.json'],
        });
        const fetchMock = vi.fn(async () => ({
            ok: true,
            json: async () => ({ sources: [{ type: 'git', locate: 'https://github.com/x/y' }] }),
        }));
        vi.stubGlobal('fetch', fetchMock);

        const global = await loadGlobalTemplates();
        expect(global.sources).toContainEqual({ type: 'git', locate: 'https://github.com/x/y' });
        expect(fetchMock).toHaveBeenCalledWith('https://example.com/templates.json');
    });
});
