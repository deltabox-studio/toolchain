import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
    collectManagedFiles,
    deepestProjectDir,
    isInsideDir,
    ManagedFileIndex,
} from '../src/managed-files.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-vscode-managed-'));
    dirs.push(dir);
    return dir;
}

function writeManifest(dir: string, files: string[]): void {
    const manifest = path.join(dir, '.dbx', 'toolchain', 'manifest.json');
    fs.mkdirSync(path.dirname(manifest), { recursive: true });
    fs.writeFileSync(manifest, JSON.stringify({ files }));
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('managed files', () => {
    it('collects absolute, deduplicated paths from every project manifest', () => {
        const root = tmp();
        const core = path.join(root, 'packages/core');
        writeManifest(root, ['tsconfig.workspaces.json', 'packages/core/tsconfig.json']);
        writeManifest(core, ['tsconfig.json', 'README.md']);

        const files = collectManagedFiles([{ dir: root }, { dir: core }]);

        expect(files.sort()).toEqual(
            [
                path.join(root, 'tsconfig.workspaces.json'),
                path.join(core, 'tsconfig.json'),
                path.join(core, 'README.md'),
            ].sort()
        );
    });

    it('refreshes the index and matches absolute paths', () => {
        const root = tmp();
        writeManifest(root, ['biome.json']);

        const index = new ManagedFileIndex();
        index.refresh([{ dir: root }]);
        expect(index.size).toBe(1);
        expect(index.has(path.join(root, 'biome.json'))).toBe(true);
        expect(index.has(path.join(root, 'missing.json'))).toBe(false);

        writeManifest(root, ['biome.json', 'tsconfig.json']);
        index.refresh([{ dir: root }]);
        expect(index.size).toBe(2);
        expect(index.has(path.join(root, 'tsconfig.json'))).toBe(true);
    });

    it('ignores projects without a manifest', () => {
        const root = tmp();
        writeManifest(root, ['tsconfig.json']);
        expect(collectManagedFiles([{ dir: root }, { dir: path.join(root, 'empty') }])).toEqual([
            path.join(root, 'tsconfig.json'),
        ]);
    });
});

describe('deepestProjectDir', () => {
    it('picks the most specific project for a file', () => {
        const root = tmp();
        const core = path.join(root, 'packages/core');
        const file = path.join(core, 'src/index.ts');
        expect(deepestProjectDir(file, [{ dir: root }, { dir: core }])).toBe(core);
        expect(deepestProjectDir(file, [{ dir: root }])).toBe(root);
    });

    it('returns undefined for a file outside every project', () => {
        const root = tmp();
        expect(deepestProjectDir(path.join(root, '..', 'elsewhere.ts'), [{ dir: root }])).toBe(
            undefined
        );
    });

    it('treats the project directory itself as inside', () => {
        const root = tmp();
        expect(isInsideDir(root, root)).toBe(true);
        expect(deepestProjectDir(root, [{ dir: root }])).toBe(root);
    });
});
