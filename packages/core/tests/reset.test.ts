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

    it('keeps files listed in a legacy manifest without origins', () => {
        const cwd = tmp();
        fs.writeFileSync(path.join(cwd, 'package.json'), '{"name":"x"}\n');
        // Pre-`origins` manifest: writeManifest with no origin map.
        writeManifest(cwd, ['package.json']);
        const result = resetToolchain({ cwd });
        expect(result.removed).toEqual([`${MANIFEST_DIR}/`]);
        expect(fs.existsSync(path.join(cwd, 'package.json'))).toBe(true);
    });

    it('never removes a manifest entry that escapes the project root', () => {
        const parent = tmp();
        const cwd = path.join(parent, 'project');
        fs.mkdirSync(cwd);
        fs.writeFileSync(path.join(parent, 'outside.txt'), 'keep me');
        writeManifest(cwd, ['../outside.txt'], undefined, { '../outside.txt': 'created' });
        const result = resetToolchain({ cwd });
        expect(result.removed).toEqual([`${MANIFEST_DIR}/`]);
        expect(result.skipped).toEqual(['../outside.txt']);
        expect(fs.readFileSync(path.join(parent, 'outside.txt'), 'utf-8')).toBe('keep me');
    });

    it('preserves project registries while removing generated manifest state', () => {
        const cwd = tmp();
        writeManifest(cwd, []);
        fs.writeFileSync(
            path.join(cwd, MANIFEST_DIR, 'registries.json'),
            '{"providers":["./providers"]}\n'
        );
        fs.mkdirSync(path.join(cwd, MANIFEST_DIR, '.registry/providers'), { recursive: true });
        fs.writeFileSync(
            path.join(cwd, MANIFEST_DIR, '.registry/providers/providers.json'),
            '[]\n'
        );
        const result = resetToolchain({ cwd });
        expect(result.removed).toEqual([
            `${MANIFEST_DIR}/manifest.json`,
            `${MANIFEST_DIR}/timestamps.json`,
        ]);
        expect(fs.existsSync(path.join(cwd, MANIFEST_DIR, 'manifest.json'))).toBe(false);
        expect(fs.existsSync(path.join(cwd, MANIFEST_DIR, 'timestamps.json'))).toBe(false);
        expect(fs.readFileSync(path.join(cwd, MANIFEST_DIR, 'registries.json'), 'utf-8')).toBe(
            '{"providers":["./providers"]}\n'
        );
        expect(
            fs.existsSync(path.join(cwd, MANIFEST_DIR, '.registry/providers/providers.json'))
        ).toBe(true);
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
