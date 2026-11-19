import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mock = vi.hoisted(() => ({
    folders: [] as { uri: { fsPath: string } }[],
    info: vi.fn(),
    stored: undefined as 'project' | 'extension' | undefined,
}));

vi.mock('vscode', () => ({
    workspace: {
        get workspaceFolders() {
            return mock.folders;
        },
        getConfiguration: () => ({ get: () => undefined }),
    },
    window: {
        showInformationMessage: mock.info,
        showQuickPick: vi.fn(),
        showInputBox: vi.fn(),
    },
    ConfigurationTarget: { Workspace: 2 },
}));

import type * as vscode from 'vscode';

import {
    bundledCliEntry,
    cliInvocation,
    getDbxSource,
    initDbxSource,
    projectDbx,
    projectToolchainVersion,
    resolveCliCommand,
    setDbxSource,
    setExtensionInfo,
} from '../src/cli.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-vscode-source-'));
    dirs.push(dir);
    return dir;
}

function write(file: string, content = ''): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}

function projectWithDbx(version: string): string {
    const dir = tmp();
    write(
        path.join(dir, 'node_modules', '@deltabox', 'toolchain', 'package.json'),
        JSON.stringify({ name: '@deltabox/toolchain', version })
    );
    write(path.join(dir, 'node_modules', '@deltabox', 'toolchain', 'dist', 'cli', 'index.js'));
    return dir;
}

function extensionWithBundle(version: string): string {
    const dir = tmp();
    write(path.join(dir, 'dist', 'dbx.cjs'));
    setExtensionInfo({
        extensionPath: dir,
        packageJSON: { version },
    } as unknown as vscode.Extension<unknown>);
    return dir;
}

function context(): vscode.ExtensionContext {
    return {
        workspaceState: {
            get: () => mock.stored,
            update: async (_key: string, value: 'project' | 'extension' | undefined) => {
                mock.stored = value;
            },
        },
    } as unknown as vscode.ExtensionContext;
}

beforeEach(() => {
    mock.folders = [];
    mock.info.mockReset();
    mock.stored = undefined;
    setDbxSource('project');
    setExtensionInfo(undefined);
});

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('dbx source selection', () => {
    it("defaults to the project's dbx when versions match", async () => {
        const project = projectWithDbx('1.2.3');
        extensionWithBundle('1.2.3');
        mock.folders = [{ uri: { fsPath: project } }];

        await initDbxSource(context());

        expect(getDbxSource()).toBe('project');
        expect(mock.info).not.toHaveBeenCalled();
        expect(resolveCliCommand(project).args[0]).toBe(
            path.join(project, 'node_modules', '@deltabox', 'toolchain', 'dist', 'cli', 'index.js')
        );
    });

    it('asks on a version mismatch and keeps the project dbx when dismissed', async () => {
        const project = projectWithDbx('1.2.3');
        extensionWithBundle('2.0.0');
        mock.folders = [{ uri: { fsPath: project } }];
        mock.info.mockResolvedValue(undefined);

        await initDbxSource(context());

        expect(mock.info).toHaveBeenCalledTimes(1);
        expect(getDbxSource()).toBe('project');
    });

    it('remembers an explicit extension choice', async () => {
        const project = projectWithDbx('1.2.3');
        extensionWithBundle('2.0.0');
        mock.folders = [{ uri: { fsPath: project } }];
        mock.info.mockResolvedValue("Use the extension's dbx (2.0.0)");

        await initDbxSource(context());

        expect(getDbxSource()).toBe('extension');
        expect(mock.stored).toBe('extension');
        expect(resolveCliCommand(project).args[0]).toBe(bundledCliEntry());
    });

    it('uses the bundled dbx when the project has no local install', async () => {
        const root = tmp();
        extensionWithBundle('2.0.0');
        mock.folders = [{ uri: { fsPath: root } }];

        await initDbxSource(context());

        expect(getDbxSource()).toBe('extension');
        expect(resolveCliCommand(root).args[0]).toBe(bundledCliEntry());
    });

    it('finds a hoisted toolchain from a nested workspace (and reads a BOM)', () => {
        const root = projectWithDbx('1.2.3');
        fs.writeFileSync(
            path.join(root, 'node_modules', '@deltabox', 'toolchain', 'package.json'),
            `\uFEFF${JSON.stringify({ name: '@deltabox/toolchain', version: '1.2.3' })}`
        );
        const nested = path.join(root, 'packages', 'app');
        fs.mkdirSync(nested, { recursive: true });
        mock.folders = [{ uri: { fsPath: nested } }];

        expect(projectToolchainVersion(nested)).toBe('1.2.3');
        expect(projectDbx(nested)?.args[0]).toBe(
            path.join(root, 'node_modules', '@deltabox', 'toolchain', 'dist', 'cli', 'index.js')
        );
    });

    it('checks every workspace root in a multi-root workspace', () => {
        const first = tmp();
        const second = projectWithDbx('1.2.3');
        mock.folders = [{ uri: { fsPath: first } }, { uri: { fsPath: second } }];

        expect(projectToolchainVersion(first)).toBe('1.2.3');
        expect(projectDbx(first)?.args[0]).toBe(
            path.join(second, 'node_modules', '@deltabox', 'toolchain', 'dist', 'cli', 'index.js')
        );
    });

    it('prefers a nearer .bin shim over a hoisted built entry', () => {
        const root = projectWithDbx('1.2.3');
        const nested = path.join(root, 'packages', 'app');
        fs.mkdirSync(nested, { recursive: true });
        const shim = path.join(
            nested,
            'node_modules',
            '.bin',
            process.platform === 'win32' ? 'dbx.cmd' : 'dbx'
        );
        write(shim);
        mock.folders = [{ uri: { fsPath: nested } }];

        expect(projectDbx(nested)).toEqual({ exe: shim, args: [] });
    });

    it('quotes a project shim path with spaces in the terminal command', () => {
        const root = path.join(tmp(), 'with space');
        fs.mkdirSync(root, { recursive: true });
        const shim = path.join(
            root,
            'node_modules',
            '.bin',
            process.platform === 'win32' ? 'dbx.cmd' : 'dbx'
        );
        write(shim);
        mock.folders = [{ uri: { fsPath: root } }];

        expect(projectDbx(root)).toEqual({ exe: shim, args: [] });
        expect(cliInvocation(root)).toBe(`"${shim}"`);
    });
});
