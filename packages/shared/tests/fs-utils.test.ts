import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { mergeJsonAt, readJsoncFile } from '../src/index.js';

describe('mergeJsonAt', () => {
    it('unions recommendations but replaces other arrays', () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-merge-'));
        try {
            fs.mkdirSync(path.join(cwd, '.vscode'));
            fs.writeFileSync(
                path.join(cwd, '.vscode/settings.json'),
                JSON.stringify({ 'editor.rulers': [80], recommendations: ['a'] })
            );
            const merged = JSON.parse(
                mergeJsonAt(cwd, '.vscode/settings.json', {
                    'editor.rulers': [100],
                    recommendations: ['b'],
                })
            ) as Record<string, unknown>;
            expect(merged['editor.rulers']).toEqual([100]);
            expect(merged.recommendations).toEqual(['a', 'b']);
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });
});

describe('mergeJsonAt comments', () => {
    it('preserves comments when adding a top-level key', () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-merge-'));
        try {
            fs.mkdirSync(path.join(cwd, '.vscode'));
            const file = path.join(cwd, '.vscode/settings.json');
            fs.writeFileSync(file, '{\n    // keep this\n    "editor.formatOnSave": true\n}\n');
            const out = mergeJsonAt(cwd, '.vscode/settings.json', {
                'editor.defaultFormatter': 'oxc.oxc-vscode',
            });
            expect(out).toContain('// keep this');
            fs.writeFileSync(file, out);
            const parsed = readJsoncFile<Record<string, unknown>>(file)!;
            expect(parsed['editor.formatOnSave']).toBe(true);
            expect(parsed['editor.defaultFormatter']).toBe('oxc.oxc-vscode');
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });

    it('preserves comments when adding a nested key', () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-merge-'));
        try {
            fs.mkdirSync(path.join(cwd, '.vscode'));
            const file = path.join(cwd, '.vscode/settings.json');
            fs.writeFileSync(
                file,
                '{\n    // keep this\n    "editor.codeActionsOnSave": {\n        "source.fixAll.eslint": "explicit"\n    }\n}\n'
            );
            const out = mergeJsonAt(cwd, '.vscode/settings.json', {
                'editor.codeActionsOnSave': { 'source.fixAll.oxc': 'explicit' },
            });
            expect(out).toContain('// keep this');
            fs.writeFileSync(file, out);
            const parsed = readJsoncFile<Record<string, unknown>>(file)!;
            expect(parsed['editor.codeActionsOnSave']).toEqual({
                'source.fixAll.eslint': 'explicit',
                'source.fixAll.oxc': 'explicit',
            });
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });
});

describe('mergeJsonAt safety', () => {
    it('refuses to overwrite malformed JSONC', () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-merge-'));
        try {
            fs.mkdirSync(path.join(cwd, '.vscode'));
            const file = path.join(cwd, '.vscode/settings.json');
            fs.writeFileSync(file, '{ "a": ');
            expect(() => mergeJsonAt(cwd, '.vscode/settings.json', { b: 1 })).toThrow(
                /valid JSON object/
            );
            expect(fs.readFileSync(file, 'utf8')).toBe('{ "a": ');
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });

    it('preserves the original text when the patch adds nothing', () => {
        const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-merge-'));
        try {
            fs.mkdirSync(path.join(cwd, '.vscode'));
            const file = path.join(cwd, '.vscode/settings.json');
            const text = '{\n    // keep this\n    "a": 1,\n}\n';
            fs.writeFileSync(file, text);
            expect(mergeJsonAt(cwd, '.vscode/settings.json', { a: 1 })).toBe(text);
        } finally {
            fs.rmSync(cwd, { recursive: true, force: true });
        }
    });
});
