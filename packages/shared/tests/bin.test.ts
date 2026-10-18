import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { findOwnCliEntry } from '../src/index.js';

const tmpDirs: string[] = [];

function makeTmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-bin-'));
    tmpDirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of tmpDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('findOwnCliEntry', () => {
    it('finds the nearest enclosing @deltabox/toolchain bin', () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: '@deltabox/toolchain', bin: { dbx: './dist/cli/index.js' } })
        );
        fs.mkdirSync(path.join(dir, 'dist', 'cli'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'dist', 'cli', 'index.js'), '');
        const nested = path.join(dir, 'packages', 'app');
        fs.mkdirSync(nested, { recursive: true });
        expect(findOwnCliEntry(nested)).toBe(path.join(dir, 'dist', 'cli', 'index.js'));
    });

    it('returns undefined when there is no toolchain package above', () => {
        expect(findOwnCliEntry(makeTmp())).toBeUndefined();
    });

    it('ignores a toolchain package whose bin is missing on disk', () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: '@deltabox/toolchain', bin: { dbx: './dist/cli/index.js' } })
        );
        expect(findOwnCliEntry(dir)).toBeUndefined();
    });
});
