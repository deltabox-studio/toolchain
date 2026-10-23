import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('vscode', () => ({}));

import type * as vscode from 'vscode';

import { bundledCliEntry, pinnedToolchainSpec, setExtensionInfo } from '../src/cli.js';

/** A minimal fake extension (only the fields `setExtensionInfo` reads). */
function fakeExtension(extensionPath: string, version?: string): vscode.Extension<unknown> {
    return {
        extensionPath,
        packageJSON: version ? { version } : {},
    } as unknown as vscode.Extension<unknown>;
}

describe('bundledCliEntry', () => {
    let dir: string;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-vscode-'));
        setExtensionInfo(undefined);
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('returns the bundle path under the extension dir when present', () => {
        const dist = path.join(dir, 'dist');
        fs.mkdirSync(dist, { recursive: true });
        const entry = path.join(dist, 'dbx.cjs');
        fs.writeFileSync(entry, '');
        setExtensionInfo(fakeExtension(dir));
        expect(bundledCliEntry()).toBe(entry);
    });

    it('returns undefined when the bundle is missing', () => {
        setExtensionInfo(fakeExtension(dir));
        expect(bundledCliEntry()).toBeUndefined();
    });

    it('returns undefined when the extension is not installed', () => {
        expect(bundledCliEntry()).toBeUndefined();
    });
});

describe('pinnedToolchainSpec', () => {
    afterEach(() => setExtensionInfo(undefined));

    it('pins the running extension version', () => {
        setExtensionInfo(fakeExtension('/ext', '1.2.3'));
        expect(pinnedToolchainSpec()).toBe('@deltabox/toolchain@1.2.3');
    });

    it('falls back to the unpinned name without a version', () => {
        setExtensionInfo(fakeExtension('/ext'));
        expect(pinnedToolchainSpec()).toBe('@deltabox/toolchain');
    });
});
