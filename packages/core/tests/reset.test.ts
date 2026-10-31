import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { MANIFEST_DIR, writeManifest } from '../src/manifest.js';
import { resetProjects, resetToolchain } from '../src/reset.js';

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-reset-'));
}

describe('resetToolchain', () => {
    it('runs the restore hook before removing the manifest', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'a.txt'), 'a');
        writeManifest(cwd, ['a.txt'], undefined, { 'a.txt': 'created' });
        const seen: boolean[] = [];
        const result = resetToolchain({
            cwd,
            restore: () => {
                // The manifest still exists while the hook runs.
                seen.push(fs.existsSync(path.join(cwd, MANIFEST_DIR)));
                return ['tsconfig.base.json'];
            },
        });
        expect(seen).toEqual([true]);
        expect(result.restored).toEqual(['tsconfig.base.json']);
        expect(result.removed).toEqual(['a.txt', `${MANIFEST_DIR}/`]);
        expect(fs.existsSync(path.join(cwd, MANIFEST_DIR))).toBe(false);
    });

    it('keeps adopted files that predate dbx', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'package.json'), '{"name":"x"}\n');
        fs.writeFileSync(path.join(cwd, 'a.txt'), 'a');
        writeManifest(cwd, ['package.json', 'a.txt'], undefined, {
            'package.json': 'adopted',
            'a.txt': 'created',
        });
        const result = resetToolchain({ cwd });
        expect(result.removed).toEqual(['a.txt', `${MANIFEST_DIR}/`]);
        expect(fs.existsSync(path.join(cwd, 'package.json'))).toBe(true);
        expect(fs.existsSync(path.join(cwd, 'a.txt'))).toBe(false);
    });

    it('skips the restore hook when the manifest is kept', () => {
        const cwd = tmp();
        writeManifest(cwd, []);
        const calls: string[] = [];
        resetToolchain({ cwd, generated: true, restore: dir => (calls.push(dir), []) });
        expect(calls).toEqual([]);
    });

    it('forwards the hook and dry-run flag per project', () => {
        const cwd = tmp();
        writeManifest(cwd, []);
        const calls: boolean[] = [];
        const result = resetProjects({
            root: cwd,
            dryRun: true,
            restore: (_dir, { dryRun }) => (calls.push(dryRun), ['x.json']),
        });
        expect(calls).toEqual([true]);
        expect(result.results[0]?.restored).toEqual(['x.json']);
        expect(fs.existsSync(path.join(cwd, MANIFEST_DIR))).toBe(true);
    });
});
