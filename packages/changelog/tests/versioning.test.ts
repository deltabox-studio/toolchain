import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import type { CommitRecord } from '../src/index.js';
import { discoverVersionPackages, planVersions, resolveVersioning } from '../src/index.js';
import { bumpVersion, isPrereleaseVersion, stableVersionOf } from '../src/utils/version.js';

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
        expect(resolveVersioning({ versioning: { prerelease: 'beta' } })).toEqual({
            enabled: true,
            target: 'uniform',
            prerelease: 'beta',
        });
    });
});

describe('prerelease versions', () => {
    it('starts a channel from a stable version', () => {
        expect(bumpVersion('1.0.0', 'minor', 'beta')).toBe('1.1.0-beta.0');
        expect(bumpVersion('1.0.0', 'major', 'rc')).toBe('2.0.0-rc.0');
        expect(bumpVersion('1.0.0', 'patch', 'beta')).toBe('1.0.1-beta.0');
    });

    it('continues the counter without appending the tag twice', () => {
        expect(bumpVersion('1.1.0-beta.0', 'minor', 'beta')).toBe('1.1.0-beta.1');
        expect(bumpVersion('1.1.0-beta.2', 'patch', 'beta')).toBe('1.1.0-beta.3');
        expect(bumpVersion('1.1.0-beta', 'patch', 'beta')).toBe('1.1.0-beta.0');
    });

    it('switches tags on the same core', () => {
        expect(bumpVersion('1.1.0-alpha.2', 'minor', 'beta')).toBe('1.1.0-beta.0');
    });

    it('still bumps the core when no prerelease is configured', () => {
        expect(bumpVersion('1.1.0-beta.2', 'minor')).toBe('1.2.0');
        expect(bumpVersion('1.1.0', 'patch')).toBe('1.1.1');
    });

    it('rejects a tag that already contains a counter', () => {
        expect(() => bumpVersion('1.0.0', 'minor', 'beta.1')).toThrow(/Invalid prerelease/);
    });

    it('detects a prerelease and derives its stable core', () => {
        expect(isPrereleaseVersion('3.0.0-beta.315')).toBe(true);
        expect(isPrereleaseVersion('3.0.0-rc.0+build.5')).toBe(true);
        expect(isPrereleaseVersion('3.0.0')).toBe(false);
        expect(stableVersionOf('3.0.0-beta.315')).toBe('3.0.0');
        expect(stableVersionOf('0.2.0-rc.1+build')).toBe('0.2.0');
    });

    it('finishes an unfinished cycle at its stable core', () => {
        expect(bumpVersion('3.0.0-beta.315', 'patch', undefined, { stableExists: false })).toBe(
            '3.0.0'
        );
        expect(bumpVersion('3.0.0-beta.315', 'minor', undefined, { stableExists: false })).toBe(
            '3.0.0'
        );
        // A stable version has nothing to roll over.
        expect(bumpVersion('3.0.0', 'patch', undefined, { stableExists: false })).toBe('3.0.1');
        // An explicit prerelease tag keeps the counter going.
        expect(bumpVersion('3.0.0-beta.315', 'patch', 'beta', { stableExists: false })).toBe(
            '3.0.0-beta.316'
        );
        // Omitted `stableExists` keeps the plain bump.
        expect(bumpVersion('3.0.0-beta.315', 'patch')).toBe('3.0.1');
        expect(bumpVersion('3.0.0-beta.315', 'patch', undefined, { stableExists: true })).toBe(
            '3.0.1'
        );
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

    it('reads Bun object-form workspaces', () => {
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({
                name: 'root',
                version: '1.0.0',
                workspaces: { packages: ['packages/*'], catalog: { react: '^19.0.0' } },
            })
        );
        const packages = discoverVersionPackages(undefined, root);
        expect(packages.workspaces.sort()).toEqual([
            join(root, 'packages', 'a'),
            join(root, 'packages', 'b'),
        ]);
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

    it('applies the prerelease tag to root and individual workspaces', () => {
        const a = join(root, 'packages', 'a');
        const b = join(root, 'packages', 'b');
        writeFileSync(
            join(a, 'package.json'),
            JSON.stringify({ name: 'a', version: '0.2.0-beta.1' })
        );
        const plan = planVersions({
            versioning: { enabled: true, target: 'individual', prerelease: 'beta' },
            rootVersion: '1.0.0',
            bump: 'minor',
            range: 'HEAD',
            root,
            commitsFor: dir => (dir === a ? [commit('fix: x')] : []),
        });
        expect(plan.rootVersion).toBe('1.1.0-beta.0');
        expect(plan.writes.get(root)).toBe('1.1.0-beta.0');
        expect(plan.writes.get(a)).toBe('0.2.0-beta.2');
        expect(plan.entries.get(a)).toBe('0.2.0-beta.2');
        expect(plan.writes.has(b)).toBe(false);
    });

    it('rolls a prerelease root over to its stable core when it is missing', () => {
        const plan = planVersions({
            versioning: { enabled: true, target: 'uniform' },
            rootVersion: '3.0.0-beta.315',
            bump: 'patch',
            range: 'HEAD',
            root,
            stableExists: () => false,
        });
        expect(plan.rootVersion).toBe('3.0.0');
        expect(plan.writes.get(root)).toBe('3.0.0');
        expect(plan.entries.get(join(root, 'packages', 'a'))).toBe('3.0.0');
    });

    it('bumps normally when the stable core has already shipped', () => {
        const plan = planVersions({
            versioning: { enabled: true, target: 'uniform' },
            rootVersion: '3.0.0-beta.315',
            bump: 'patch',
            range: 'HEAD',
            root,
            stableExists: () => true,
        });
        expect(plan.rootVersion).toBe('3.0.1');
    });

    it('keeps the prerelease counter while a tag is configured', () => {
        const plan = planVersions({
            versioning: { enabled: true, target: 'uniform', prerelease: 'beta' },
            rootVersion: '3.0.0-beta.315',
            bump: 'patch',
            range: 'HEAD',
            root,
            stableExists: () => false,
        });
        expect(plan.rootVersion).toBe('3.0.0-beta.316');
    });

    it('rolls each changed individual workspace over independently', () => {
        const a = join(root, 'packages', 'a');
        writeFileSync(
            join(a, 'package.json'),
            JSON.stringify({ name: 'a', version: '0.2.0-beta.1' })
        );
        const options = {
            versioning: { enabled: true, target: 'individual' as const },
            rootVersion: '3.0.0-beta.315',
            bump: 'patch' as const,
            range: 'HEAD',
            root,
            commitsFor: (dir: string) => (dir === a ? [commit('fix: x')] : []),
        };
        const missing = planVersions({ ...options, stableExists: () => false });
        expect(missing.rootVersion).toBe('3.0.0');
        expect(missing.writes.get(a)).toBe('0.2.0');
        expect(missing.entries.get(a)).toBe('0.2.0');

        const existing = planVersions({ ...options, stableExists: () => true });
        expect(existing.rootVersion).toBe('3.0.1');
        expect(existing.writes.get(a)).toBe('0.2.1');
    });

    it('rolls the heading over with versioning disabled', () => {
        const plan = planVersions({
            versioning: { enabled: false, target: 'uniform' },
            rootVersion: '3.0.0-beta.315',
            bump: 'patch',
            range: 'HEAD',
            root,
            stableExists: () => false,
        });
        expect(plan.rootVersion).toBe('3.0.0');
        expect(plan.writes.size).toBe(0);
        expect(plan.entries.get(join(root, 'packages', 'a'))).toBe('3.0.0');
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

    it('excludes negated workspace globs', () => {
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({ name: 'root', workspaces: ['packages/*', '!packages/private-*'] })
        );
        for (const name of ['public', 'private-x']) {
            mkdirSync(join(root, 'packages', name), { recursive: true });
            writeFileSync(join(root, 'packages', name, 'package.json'), '{}');
        }
        const pkg = discoverVersionPackages(undefined, root);
        expect(pkg.workspaces).toEqual([join(root, 'packages', 'public')]);
    });
});
