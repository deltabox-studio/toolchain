import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CommitRecord } from '../src/index.js';
import { discoverVersionPackages, planVersions, resolveVersioning } from '../src/index.js';

describe('resolveVersioning', () => {
    it('defaults to enabled + uniform', () => {
        expect(resolveVersioning(undefined)).toEqual({ enabled: true, target: 'uniform' });
        expect(resolveVersioning({})).toEqual({ enabled: true, target: 'uniform' });
        expect(resolveVersioning({ versioning: true })).toEqual({
            enabled: true,
            target: 'uniform',
        });
    });

    it('disables writing versions with `false` (still uniform headings)', () => {
        expect(resolveVersioning({ versioning: false })).toEqual({
            enabled: false,
            target: 'uniform',
        });
    });

    it('reads the object form, defaulting the target to uniform', () => {
        expect(resolveVersioning({ versioning: { workspaces: ['packages/*'] } })).toEqual({
            enabled: true,
            target: 'uniform',
            workspaces: ['packages/*'],
        });
        expect(resolveVersioning({ versioning: { target: 'individual' } })).toEqual({
            enabled: true,
            target: 'individual',
        });
    });
});

function commit(subject: string): CommitRecord {
    return { hash: subject.slice(0, 7), subject, body: '', author: 'a', authorEmail: 'a@b.c' };
}

describe('versioning plans', () => {
    let root: string;

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'dbx-versioning-'));
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({ name: 'root', version: '1.0.0', workspaces: ['packages/*'] })
        );
        for (const name of ['a', 'b']) {
            mkdirSync(join(root, 'packages', name), { recursive: true });
            writeFileSync(
                join(root, 'packages', name, 'package.json'),
                JSON.stringify({ name, version: '0.1.0' })
            );
        }
    });

    afterEach(() => {
        rmSync(root, { recursive: true, force: true });
    });

    it('uniform bumps the root and every workspace to one version', () => {
        const plan = planVersions({
            versioning: { enabled: true, target: 'uniform' },
            rootVersion: '1.0.0',
            bump: 'minor',
            range: 'HEAD',
            root,
        });
        expect(plan.rootVersion).toBe('1.1.0');
        expect(plan.writes.get(root)).toBe('1.1.0');
        expect(plan.writes.get(join(root, 'packages', 'a'))).toBe('1.1.0');
        expect(plan.writes.get(join(root, 'packages', 'b'))).toBe('1.1.0');
        expect(plan.entries.get(join(root, 'packages', 'a'))).toBe('1.1.0');
    });

    it('root-only bumps just the root and writes no workspace entry', () => {
        const plan = planVersions({
            versioning: { enabled: true, target: 'root-only' },
            rootVersion: '1.0.0',
            bump: 'patch',
            range: 'HEAD',
            root,
        });
        expect(plan.rootVersion).toBe('1.0.1');
        expect([...plan.writes.keys()]).toEqual([root]);
        expect(plan.entries.size).toBe(0);
    });

    it('individual bumps each changed workspace on its own', () => {
        const a = join(root, 'packages', 'a');
        const b = join(root, 'packages', 'b');
        const plan = planVersions({
            versioning: { enabled: true, target: 'individual' },
            rootVersion: '1.0.0',
            bump: 'minor',
            range: 'HEAD',
            root,
            // Only `a` has commits; `b` is untouched.
            commitsFor: dir => (dir === a ? [commit('feat: x')] : []),
        });
        expect(plan.rootVersion).toBe('1.1.0');
        expect(plan.writes.get(root)).toBe('1.1.0');
        expect(plan.writes.get(a)).toBe('0.2.0');
        expect(plan.writes.has(b)).toBe(false);
        expect(plan.entries.get(a)).toBe('0.2.0');
        expect(plan.entries.has(b)).toBe(false);
    });

    it('disabled writes no versions but keeps the changelog headings', () => {
        const plan = planVersions({
            versioning: { enabled: false, target: 'uniform' },
            rootVersion: '1.0.0',
            bump: 'minor',
            range: 'HEAD',
            root,
        });
        expect(plan.writes.size).toBe(0);
        expect(plan.entries.get(join(root, 'packages', 'a'))).toBe('1.1.0');
    });
});

describe('discoverVersionPackages', () => {
    let root: string;

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'dbx-versioning-'));
    });

    afterEach(() => {
        rmSync(root, { recursive: true, force: true });
    });

    it('defaults to the root `workspaces` globs', () => {
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({ name: 'root', workspaces: ['packages/*'] })
        );
        mkdirSync(join(root, 'packages', 'a'), { recursive: true });
        writeFileSync(join(root, 'packages', 'a', 'package.json'), '{}');
        const pkg = discoverVersionPackages(undefined, root);
        expect(pkg.rootHasPackage).toBe(true);
        expect(pkg.workspaces).toEqual([join(root, 'packages', 'a')]);
    });

    it('falls back to the root package.json alone when there are no workspaces', () => {
        writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root' }));
        const pkg = discoverVersionPackages(undefined, root);
        expect(pkg.rootHasPackage).toBe(true);
        expect(pkg.workspaces).toEqual([]);
    });

    it('honours explicit globs over the root field', () => {
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({ name: 'root', workspaces: ['apps/*'] })
        );
        mkdirSync(join(root, 'pkgs', 'x'), { recursive: true });
        writeFileSync(join(root, 'pkgs', 'x', 'package.json'), '{}');
        const pkg = discoverVersionPackages(['pkgs/*'], root);
        expect(pkg.workspaces).toEqual([join(root, 'pkgs', 'x')]);
    });
});
