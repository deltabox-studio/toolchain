import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getExtension } = vi.hoisted(() => ({ getExtension: vi.fn() }));

vi.mock('vscode', () => ({ extensions: { getExtension } }));

import { bundledCliEntry } from '../src/cli.js';

describe('bundledCliEntry', () => {
    let dir: string;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-vscode-'));
        getExtension.mockReset();
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('returns the bundle path under the extension dir when present', () => {
        const dist = path.join(dir, 'dist');
        fs.mkdirSync(dist, { recursive: true });
        const entry = path.join(dist, 'dbx.cjs');
        fs.writeFileSync(entry, '');
        getExtension.mockReturnValue({ extensionPath: dir });
        expect(bundledCliEntry()).toBe(entry);
    });

    it('returns undefined when the bundle is missing', () => {
        getExtension.mockReturnValue({ extensionPath: dir });
        expect(bundledCliEntry()).toBeUndefined();
    });

    it('returns undefined when the extension is not installed', () => {
        getExtension.mockReturnValue(undefined);
        expect(bundledCliEntry()).toBeUndefined();
    });
});
