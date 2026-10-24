import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
    MANIFEST_FILE,
    readManifest,
    readSyncedAt,
    TIMESTAMPS_FILE,
    writeManifest,
} from '../src/manifest.js';

const DIR = path.join('.dbx', 'toolchain');

function tmp(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-manifest-'));
}

function readDoc(cwd: string, name: string): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(path.join(cwd, DIR, name), 'utf-8')) as Record<
        string,
        unknown
    >;
}

describe('manifest + timestamps split', () => {
    it('keeps the timestamp out of the committed manifest', () => {
        const cwd = tmp();
        writeManifest(cwd, ['b.txt', 'a.txt', 'a.txt'], '2026-01-02T03:04:05.000Z');

        const manifest = readDoc(cwd, MANIFEST_FILE);
        expect(manifest).toEqual({ files: ['a.txt', 'b.txt'] });
        expect(manifest.syncedAt).toBeUndefined();

        expect(readDoc(cwd, TIMESTAMPS_FILE)).toEqual({ syncedAt: '2026-01-02T03:04:05.000Z' });
        expect(readManifest(cwd)).toEqual({
            files: ['a.txt', 'b.txt'],
            syncedAt: '2026-01-02T03:04:05.000Z',
        });
    });

    it('defaults the timestamp to now when omitted', () => {
        const cwd = tmp();
        writeManifest(cwd, ['a.txt']);
        const syncedAt = readSyncedAt(cwd);
        expect(typeof syncedAt).toBe('string');
        expect(Number.isNaN(Date.parse(syncedAt as string))).toBe(false);
    });

    it('migrates a legacy inline syncedAt on the next sync', () => {
        const cwd = tmp();
        fs.mkdirSync(path.join(cwd, DIR), { recursive: true });
        fs.writeFileSync(
            path.join(cwd, DIR, MANIFEST_FILE),
            `${JSON.stringify({ files: ['a.txt'], syncedAt: '2025-01-01T00:00:00.000Z' }, null, 4)}\n`
        );

        // Before migrating, the legacy timestamp is still surfaced (no `timestamps.json`).
        expect(readSyncedAt(cwd)).toBe('2025-01-01T00:00:00.000Z');
        expect(readManifest(cwd).syncedAt).toBe('2025-01-01T00:00:00.000Z');

        writeManifest(cwd, ['a.txt'], '2026-01-02T03:04:05.000Z');

        // After syncing, the property is gone from the manifest and moved out.
        expect(readDoc(cwd, MANIFEST_FILE)).toEqual({ files: ['a.txt'] });
        expect(readDoc(cwd, TIMESTAMPS_FILE)).toEqual({ syncedAt: '2026-01-02T03:04:05.000Z' });
    });
});
