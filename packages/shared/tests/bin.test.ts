import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { findOwnCliEntry, localToolchainVersion } from '../src/index.js';

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

describe('localToolchainVersion', () => {
    it('reads the version of an installed @deltabox/toolchain dependency', () => {
        const dir = makeTmp();
        const dep = path.join(dir, 'node_modules', '@deltabox', 'toolchain');
        fs.mkdirSync(dep, { recursive: true });
        fs.writeFileSync(
            path.join(dep, 'package.json'),
            JSON.stringify({ name: '@deltabox/toolchain', version: '9.9.9' })
        );
        const nested = path.join(dir, 'packages', 'app');
        fs.mkdirSync(nested, { recursive: true });
        expect(localToolchainVersion(nested)).toBe('9.9.9');
    });

    it('falls back to the enclosing toolchain package version (the repo itself)', () => {
        const dir = makeTmp();
        fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify({ name: '@deltabox/toolchain', version: '1.2.3' })
        );
        expect(localToolchainVersion(dir)).toBe('1.2.3');
    });

    it('returns undefined when the project pins nothing', () => {
        expect(localToolchainVersion(makeTmp())).toBeUndefined();
    });
});
