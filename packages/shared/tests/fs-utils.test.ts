import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { mergeJsonAt } from '../src/index.js';

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
