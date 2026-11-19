import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { selectProjects } from '../src/select.js';

const dirs: string[] = [];

function makeRepo(): string {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-select-'));
    dirs.push(root);
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify({ name: 'root', workspaces: ['packages/*'] })
    );
    for (const name of ['a', 'b', 'c']) {
        const dir = path.join(root, 'packages', name);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: `@acme/${name}` }));
    }
    return root;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('selectProjects glob filters', () => {
    it('supports brace alternatives', () => {
        const root = makeRepo();
        const selected = selectProjects({ root, include: ['{packages/a,packages/b}'] });
        expect(selected.map(project => project.rel)).toEqual(['packages/a', 'packages/b']);
    });

    it('supports character classes and ?', () => {
        const root = makeRepo();
        expect(selectProjects({ root, include: ['packages/[ab]'] }).map(p => p.rel)).toEqual([
            'packages/a',
            'packages/b',
        ]);
        expect(selectProjects({ root, include: ['packages/?'] }).map(p => p.rel)).toEqual([
            'packages/a',
            'packages/b',
            'packages/c',
        ]);
    });

    it('treats an unmatched [ as a literal instead of throwing', () => {
        const root = makeRepo();
        expect(() => selectProjects({ root, include: ['packages/[a'] })).not.toThrow();
        expect(selectProjects({ root, include: ['packages/[a'] })).toEqual([]);
    });

    it('falls back to a substring match for an invalid class', () => {
        const root = makeRepo();
        expect(() => selectProjects({ root, include: ['packages/[z-a]'] })).not.toThrow();
        expect(selectProjects({ root, include: ['packages/[z-a]'] })).toEqual([]);
    });
});
