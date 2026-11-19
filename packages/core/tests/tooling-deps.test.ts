import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
    assertToolingDependency,
    ensureToolingDependencies,
    findToolingDependency,
} from '../src/tooling-deps.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tooling-deps-'));
    fs.mkdirSync(path.join(dir, '.git'));
    dirs.push(dir);
    return dir;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`, 'utf-8');
}

function readJson<T = Record<string, unknown>>(file: string): T {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
}

describe('ensureToolingDependencies', () => {
    it('adds Oxc packages and catalog entries to the root', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), {
            name: 'root',
            packageManager: 'yarn@4.17.1',
        });
        fs.writeFileSync(
            path.join(root, '.yarnrc.yml'),
            'catalog:\n  typescript: ^6.0.3\n',
            'utf-8'
        );

        const result = ensureToolingDependencies({
            cwd: root,
            selection: { fmt: 'oxc', lint: 'oxc' },
        });

        expect(result.scope).toBe('root');
        expect(result.added).toEqual({ oxfmt: 'catalog:', oxlint: 'catalog:' });
        expect(result.catalogAdded).toEqual({ oxfmt: '^0.78.0', oxlint: '^1.93.0' });
        expect(readJson(path.join(root, 'package.json')).devDependencies).toEqual({
            oxfmt: 'catalog:',
            oxlint: 'catalog:',
        });
        const yarnrc = fs.readFileSync(path.join(root, '.yarnrc.yml'), 'utf-8');
        expect(yarnrc).toContain('typescript: ^6.0.3');
        expect(yarnrc).toContain('"oxfmt": ^0.78.0');
        expect(yarnrc).toContain('"oxlint": ^1.93.0');
    });

    it('pins the versions when there is no catalog', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), { name: 'root' });

        const result = ensureToolingDependencies({
            cwd: root,
            selection: { fmt: 'oxc', lint: 'oxc' },
        });

        expect(result.added).toEqual({ oxfmt: '^0.78.0', oxlint: '^1.93.0' });
        expect(result.catalogAdded).toBeUndefined();
        expect(readJson(path.join(root, 'package.json')).devDependencies).toEqual({
            oxfmt: '^0.78.0',
            oxlint: '^1.93.0',
        });
    });

    it('does nothing when vite-plus already provides the tools', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), {
            name: 'root',
            devDependencies: { 'vite-plus': '^1.2.0' },
        });

        const result = ensureToolingDependencies({
            cwd: root,
            selection: { fmt: 'oxc', lint: 'oxc' },
        });

        expect(result.changed).toBe(false);
        expect(result.added).toEqual({});
    });

    it('keeps an existing pin and only adds the missing tool', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), {
            name: 'root',
            devDependencies: { oxfmt: '^0.70.0' },
        });

        const result = ensureToolingDependencies({
            cwd: root,
            selection: { fmt: 'oxc', lint: 'oxc' },
        });

        expect(result.added).toEqual({ oxlint: '^1.93.0' });
        expect(readJson(path.join(root, 'package.json')).devDependencies).toEqual({
            oxfmt: '^0.70.0',
            oxlint: '^1.93.0',
        });
    });

    it('honours version overrides', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), { name: 'root' });

        const result = ensureToolingDependencies({
            cwd: root,
            selection: { fmt: 'oxc' },
            versions: { oxfmt: '^9.0.0' },
        });

        expect(result.added).toEqual({ oxfmt: '^9.0.0' });
    });

    it('adds the packages to the project package.json when the root has none', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), {
            name: 'root',
            workspaces: ['packages/*'],
            devDependencies: { prettier: '^3.9.10' },
        });
        const project = path.join(root, 'packages/app');
        writeJson(path.join(project, 'package.json'), { name: 'app' });

        const result = ensureToolingDependencies({
            cwd: project,
            root,
            selection: { fmt: 'oxc', lint: 'oxc' },
        });

        expect(result.scope).toBe('project');
        expect(readJson(path.join(project, 'package.json')).devDependencies).toEqual({
            oxfmt: '^0.78.0',
            oxlint: '^1.93.0',
        });
        expect(readJson(path.join(root, 'package.json')).devDependencies).toEqual({
            prettier: '^3.9.10',
        });
    });

    it('reports changes without writing on a dry run', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), { name: 'root' });

        const result = ensureToolingDependencies({
            cwd: root,
            selection: { fmt: 'oxc' },
            dryRun: true,
        });

        expect(result.added).toEqual({ oxfmt: '^0.78.0' });
        expect(readJson(path.join(root, 'package.json')).devDependencies).toBeUndefined();
    });
});

describe('tooling dependency detection', () => {
    it('finds a declared formatter in an ancestor package.json', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), {
            name: 'root',
            devDependencies: { prettier: '^3.9.10' },
        });
        const project = path.join(root, 'packages/app');
        writeJson(path.join(project, 'package.json'), { name: 'app' });

        expect(findToolingDependency(project, 'fmt', 'prettier', root)).toMatchObject({
            declared: true,
            dir: root,
        });
    });

    it('throws a clear error when no dependency provides the tool', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), { name: 'root' });

        expect(() => assertToolingDependency(root, 'fmt', 'prettier')).toThrow(
            /No formatter dependency found for fmt \(prettier\).*prettier/
        );
        expect(() => assertToolingDependency(root, 'lint', 'oxc')).toThrow(
            /No linter dependency found for lint \(oxc\).*oxlint/
        );
    });

    it('accepts vite-plus as Oxc for both kinds', () => {
        const root = tmp();
        writeJson(path.join(root, 'package.json'), {
            name: 'root',
            devDependencies: { 'vite-plus': '^1.2.0' },
        });

        expect(() => assertToolingDependency(root, 'fmt', 'oxc')).not.toThrow();
        expect(() => assertToolingDependency(root, 'lint', 'oxc')).not.toThrow();
    });
});
