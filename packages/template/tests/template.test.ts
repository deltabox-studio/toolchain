import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
    addTemplateSource,
    BUILTIN_TEMPLATES,
    loadLocalTemplates,
    loadTemplates,
    parseSourceSpec,
    readTemplateManifest,
    readTemplateRegistry,
    removeTemplateSource,
    scaffoldTemplate,
    writeTemplateManifest,
} from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tpl-'));
    tmpDirs.push(dir);
    return dir;
}

function writeTemplate(
    dir: string,
    manifest: Record<string, unknown>,
    files: Record<string, string>
): void {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'template.json'), JSON.stringify(manifest), 'utf-8');
    for (const [relative, content] of Object.entries(files)) {
        const target = path.join(dir, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content, 'utf-8');
    }
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('template registry', () => {
    it('lists the builtin templates offline', async () => {
        const templates = await loadTemplates({ cwd: makeTmp() });
        const ids = templates.map(template => template.id);
        expect(ids).toEqual(
            expect.arrayContaining(['project', 'monorepo', 'workspace', 'vite-plus'])
        );
        expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    });

    it('loads a local template source', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'mytpl');
        writeTemplate(tpl, { name: 'My template' }, { 'README.md': '# {{name}}' });

        expect(loadLocalTemplates(root).map(t => t.id)).toContain('mytpl');
        const templates = await loadTemplates({
            cwd: root,
            sources: [{ type: 'local', locate: tpl }],
        });
        const found = templates.find(template => template.name === 'My template');
        expect(found?.kind).toBe('project');
    });

    it('round-trips the on-disk source registry', () => {
        const root = makeTmp();
        addTemplateSource(root, { type: 'git', locate: 'https://github.com/acme/tpl.git' });
        addTemplateSource(root, { type: 'local', locate: './tpl' });
        expect(readTemplateRegistry(root).sources).toHaveLength(2);
        // dedupe on type:locate
        addTemplateSource(root, { type: 'local', locate: './tpl' });
        expect(readTemplateRegistry(root).sources).toHaveLength(2);
    });
});

describe('source parsing', () => {
    it('infers the source type', () => {
        expect(parseSourceSpec('git:https://github.com/acme/x.git').type).toBe('git');
        expect(parseSourceSpec('@acme/create').type).toBe('npm');
        expect(parseSourceSpec('https://github.com/acme/x').type).toBe('git');
        expect(parseSourceSpec('./local-dir').type).toBe('local');
    });
});

describe('template authoring', () => {
    it('writes and reads a template.json (any kind)', () => {
        const root = makeTmp();
        const dir = path.join(root, 'tpl');
        const file = writeTemplateManifest(dir, {
            name: 'T',
            kind: 'folder',
            variables: [{ name: 'name' }],
        });
        expect(fs.existsSync(file)).toBe(true);
        expect(readTemplateManifest(dir)?.kind).toBe('folder');
        expect(loadLocalTemplates(root).map(t => t.kind)).toContain('folder');
    });

    it('removes a registry source by id or type:locate', () => {
        const root = makeTmp();
        addTemplateSource(root, { type: 'local', locate: './a', id: 'a' });
        addTemplateSource(root, { type: 'local', locate: './b' });
        expect(removeTemplateSource(root, 'a').removed).toBe(1);
        expect(removeTemplateSource(root, 'local:./b').removed).toBe(1);
        expect(removeTemplateSource(root, 'nope').removed).toBe(0);
        expect(readTemplateRegistry(root).sources).toHaveLength(0);
    });

    it('scaffolds the folder builtin', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'folder');
        if (!template) throw new Error('missing builtin');
        await scaffoldTemplate(template, { cwd: out, tokens: { name: 'acme' } });
        expect(fs.readFileSync(path.join(out, 'README.md'), 'utf-8')).toBe('# acme\n');
    });

    it('covers every registry kind in the builtins', () => {
        const kinds = new Set(BUILTIN_TEMPLATES.map(template => template.kind));
        expect(kinds).toEqual(new Set(['project', 'application', 'folder', 'workspace']));
    });
});

describe('scaffolding', () => {
    it('creates a builtin TypeScript project', async () => {
        const out = makeTmp();
        const template = BUILTIN_TEMPLATES.find(candidate => candidate.id === 'project');
        if (!template) throw new Error('missing builtin');
        const result = await scaffoldTemplate(template, { cwd: out, tokens: { name: 'acme' } });
        expect(result.written.length).toBeGreaterThan(0);
        expect(fs.existsSync(path.join(out, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(out, 'dbx.config.ts'))).toBe(true);
    });

    it('copies a local template, resolving tokens in paths and contents', async () => {
        const root = makeTmp();
        const tpl = path.join(root, 'tpl');
        writeTemplate(
            tpl,
            { name: 'T', variables: [{ name: 'name', default: 'app' }] },
            { 'src/{{name}}.ts': "export const name = '{{name}}';\n" }
        );
        const out = makeTmp();
        const [template] = loadLocalTemplates(root);
        if (!template) throw new Error('missing local template');
        const result = await scaffoldTemplate(template, { cwd: out, tokens: { name: 'acme' } });

        const rendered = path.join(out, 'src', 'acme.ts');
        expect(result.written).toContain(rendered);
        expect(fs.readFileSync(rendered, 'utf-8')).toBe("export const name = 'acme';\n");
        // the manifest is never copied
        expect(fs.existsSync(path.join(out, 'template.json'))).toBe(false);
    });
});
