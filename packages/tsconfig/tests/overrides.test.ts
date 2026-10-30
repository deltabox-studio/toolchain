import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type { SyncContext, ToolchainTsconfigConfig } from '@deltabox/toolchain-shared';

import {
    applyOverride,
    getSnapshot,
    mergeOverride,
    overrideLeaves,
    restoreTsconfigOverrides,
    revertOverride,
    type SnapshotTree,
    type TsconfigOverrides,
    tsconfigSyncTask,
} from '../src/index.js';

const dirs: string[] = [];

function tmp(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dbx-tsconfig-overrides-'));
    dirs.push(dir);
    return dir;
}

function write(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 4)}\n`);
}

function read(file: string): Record<string, any> {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

const MANIFEST = '.dbx/toolchain/manifest.json';

/**
 * Run the tsconfig task the way `runSync` does: feed it the manifest state,
 * write the files it returns and persist its manifest metadata.
 */
async function sync(
    cwd: string,
    tsconfig: ToolchainTsconfigConfig,
    options: { check?: boolean } = {}
) {
    const manifestFile = path.join(cwd, MANIFEST);
    const stored = fs.existsSync(manifestFile) ? read(manifestFile) : {};
    const warnings: string[] = [];
    const ctx: SyncContext = {
        cwd,
        projectType: 'monorepo-root',
        config: { tsconfig },
        tokens: {},
        log: () => {},
        warn: (message, id) => warnings.push(id ?? message),
        manifest: {
            ...(stored.tsconfigOverrides ? { tsconfigOverrides: stored.tsconfigOverrides } : {}),
            ...(stored.snapshots ? { snapshots: stored.snapshots } : {}),
        },
    };
    const files = (await tsconfigSyncTask().run(ctx)) ?? [];
    if (!options.check) {
        for (const file of files) {
            fs.mkdirSync(path.dirname(path.join(cwd, file.path)), { recursive: true });
            fs.writeFileSync(path.join(cwd, file.path), file.content);
        }
        write(manifestFile, {
            ...ctx.manifest,
            files: files.filter(file => file.track !== false).map(file => file.path),
        });
    }
    return { files, warnings, manifest: ctx.manifest ?? {} };
}

/** A monorepo root with one workspace and every user-owned tsconfig. */
function monorepo(): string {
    const cwd = tmp();
    write(path.join(cwd, 'tsconfig.base.json'), { compilerOptions: { target: 'ES2022' } });
    write(path.join(cwd, 'tsconfig.workspaces.json'), {
        compilerOptions: { composite: false },
    });
    write(path.join(cwd, 'packages/core/tsconfig.default.json'), {
        extends: '../../tsconfig.base.json',
        compilerOptions: { target: 'ES2022' },
    });
    write(path.join(cwd, 'packages/core/tsconfig.build.json'), {
        extends: './tsconfig.default.json',
    });
    return cwd;
}

afterEach(() => {
    for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('override helpers', () => {
    it('deep-merges objects and replaces arrays/scalars', () => {
        const base = { compilerOptions: { strict: false, lib: ['ES2020'] }, include: ['src'] };
        const merged = mergeOverride(base, {
            compilerOptions: { strict: true, lib: ['ES2022'], paths: { '@a/*': ['./a/*'] } },
        });
        expect(merged).toEqual({
            compilerOptions: { strict: true, lib: ['ES2022'], paths: { '@a/*': ['./a/*'] } },
            include: ['src'],
        });
        // The input is never mutated.
        expect(base.compilerOptions.strict).toBe(false);
    });

    it('lists the leaves an override sets', () => {
        expect(
            overrideLeaves({ compilerOptions: { strict: true, paths: { a: ['b'] } }, include: [] })
        ).toEqual([
            { path: ['compilerOptions', 'strict'], value: true },
            { path: ['compilerOptions', 'paths', 'a'], value: ['b'] },
            { path: ['include'], value: [] },
        ]);
    });

    it('reverts against the snapshot: restore, remove (pruning) or keep edits', () => {
        const snapshot = { compilerOptions: { strict: false, target: 'ES2022' } };
        const override = {
            compilerOptions: { strict: true, target: 'ES2022', paths: { '@a/*': ['./a/*'] } },
            files: ['x.ts'],
        };
        const target = structuredClone(snapshot) as Record<string, unknown>;
        applyOverride(target, override);
        // A user edit after the override applied it.
        (target.files as string[]).push('y.ts');

        const result = revertOverride(target, overrideLeaves(override), snapshot);
        expect(target).toEqual({
            // `strict` restored from the snapshot; `target` was already the
            // original value; the `paths` object the override created is pruned.
            compilerOptions: { strict: false, target: 'ES2022' },
            // Edited after the override: kept.
            files: ['x.ts', 'y.ts'],
        });
        expect(result.kept).toEqual(['files']);
        expect(result.reverted).toEqual([
            'compilerOptions.strict',
            'compilerOptions.target',
            'compilerOptions.paths.@a/*',
        ]);
    });
});

describe('tsconfig overrides sync', () => {
    it('applies overrides and snapshots the originals with relative paths only', async () => {
        const cwd = monorepo();
        const { files, warnings, manifest } = await sync(cwd, {
            overrides: {
                base: { compilerOptions: { target: 'ES2020' } },
                root: { compilerOptions: { composite: true, types: ['node'] } },
                default: { compilerOptions: { strict: true } },
                build: { compilerOptions: { declaration: true } },
            },
        });
        expect(warnings).toEqual([]);

        expect(read(path.join(cwd, 'tsconfig.base.json')).compilerOptions.target).toBe('ES2020');
        expect(read(path.join(cwd, 'tsconfig.workspaces.json')).compilerOptions).toEqual({
            composite: true,
            types: ['node'],
        });
        expect(read(path.join(cwd, 'packages/core/tsconfig.default.json')).compilerOptions).toEqual(
            {
                target: 'ES2022',
                strict: true,
            }
        );
        expect(read(path.join(cwd, 'packages/core/tsconfig.build.json'))).toEqual({
            extends: './tsconfig.default.json',
            compilerOptions: { declaration: true },
        });

        // Patched user files are written but never tracked as managed files.
        const untracked = files.filter(file => file.track === false).map(file => file.path);
        expect(untracked.sort()).toEqual([
            'packages/core/tsconfig.build.json',
            'packages/core/tsconfig.default.json',
            'tsconfig.base.json',
            'tsconfig.workspaces.json',
        ]);
        const stored = read(path.join(cwd, MANIFEST));
        expect(stored.files).toEqual(['packages/core/tsconfig.json']);

        // The snapshot tree mirrors the repo and holds the original content.
        expect(manifest.snapshots).toEqual({
            'tsconfig.base.json': { compilerOptions: { target: 'ES2022' } },
            'tsconfig.workspaces.json': { compilerOptions: { composite: false } },
            packages: {
                core: {
                    'tsconfig.default.json': {
                        extends: '../../tsconfig.base.json',
                        compilerOptions: { target: 'ES2022' },
                    },
                    'tsconfig.build.json': { extends: './tsconfig.default.json' },
                },
            },
        });
        expect(Object.keys(manifest.tsconfigOverrides as object).sort()).toEqual(untracked.sort());
        // No absolute paths leak into the tracked manifest.
        expect(fs.readFileSync(path.join(cwd, MANIFEST), 'utf-8')).not.toContain(cwd);
        expect(fs.readFileSync(path.join(cwd, MANIFEST), 'utf-8')).not.toContain(
            cwd.replace(/\\/g, '/')
        );
    });

    it('is idempotent: a second sync patches nothing', async () => {
        const cwd = monorepo();
        const tsconfig = { overrides: { default: { compilerOptions: { strict: true } } } };
        await sync(cwd, tsconfig);
        const { files } = await sync(cwd, tsconfig);
        expect(files.filter(file => file.track === false)).toEqual([]);
    });

    it('removes a dropped key only when the original did not define it', async () => {
        const cwd = monorepo();
        await sync(cwd, {
            overrides: {
                root: { compilerOptions: { composite: true, types: ['node'], strict: true } },
            },
        });

        // Drop `composite` (the original had `false`) and `types` (not in the original).
        await sync(cwd, { overrides: { root: { compilerOptions: { strict: true } } } });
        expect(read(path.join(cwd, 'tsconfig.workspaces.json')).compilerOptions).toEqual({
            composite: false,
            strict: true,
        });

        // Dropping the last key reverts the file and clears the manifest state.
        const { manifest } = await sync(cwd, {});
        expect(read(path.join(cwd, 'tsconfig.workspaces.json'))).toEqual({
            compilerOptions: { composite: false },
        });
        expect(manifest.snapshots).toBeUndefined();
        expect(manifest.tsconfigOverrides).toBeUndefined();
    });

    it('keeps the original value when the override matched it', async () => {
        const cwd = monorepo();
        await sync(cwd, { overrides: { base: { compilerOptions: { target: 'ES2022' } } } });
        await sync(cwd, {});
        expect(read(path.join(cwd, 'tsconfig.base.json'))).toEqual({
            compilerOptions: { target: 'ES2022' },
        });
    });

    it('keeps user edits made after the override applied', async () => {
        const cwd = monorepo();
        const file = path.join(cwd, 'packages/core/tsconfig.default.json');
        await sync(cwd, {
            overrides: { default: { compilerOptions: { strict: true, noEmit: true } } },
        });
        const edited = read(file);
        edited.compilerOptions.noEmit = false; // an edit to an overridden key
        edited.include = ['src']; // an unrelated edit
        write(file, edited);

        const { warnings } = await sync(cwd, {});
        expect(warnings).toEqual(['tsconfig.override-edited']);
        expect(read(file)).toEqual({
            extends: '../../tsconfig.base.json',
            compilerOptions: { target: 'ES2022', noEmit: false },
            include: ['src'],
        });
    });

    it('restores a key the user added before it was overridden', async () => {
        const cwd = monorepo();
        const file = path.join(cwd, 'tsconfig.base.json');
        await sync(cwd, { overrides: { base: { compilerOptions: { target: 'ES2020' } } } });
        write(file, { compilerOptions: { ...read(file).compilerOptions, strict: false } });

        // `strict` now joins the override; dropping it must bring back `false`.
        await sync(cwd, {
            overrides: { base: { compilerOptions: { target: 'ES2020', strict: true } } },
        });
        expect(read(file).compilerOptions.strict).toBe(true);
        await sync(cwd, {});
        expect(read(file)).toEqual({ compilerOptions: { target: 'ES2022', strict: false } });
    });

    it('honours custom file names and derives watch/keep from them', async () => {
        const cwd = tmp();
        write(path.join(cwd, 'config/tsconfig.shared.json'), { compilerOptions: {} });
        write(path.join(cwd, 'tsconfig.graph.json'), { compilerOptions: {} });
        write(path.join(cwd, 'packages/core/tsconfig.src.json'), { compilerOptions: {} });
        write(path.join(cwd, 'packages/core/tsconfig.dist.json'), { compilerOptions: {} });
        const tsconfig = {
            baseFile: 'config/tsconfig.shared.json',
            rootFile: 'tsconfig.graph.json',
            defaultFile: 'tsconfig.src.json',
            buildFile: 'tsconfig.dist.json',
            overrides: {
                base: { compilerOptions: { strict: true } },
                root: { compilerOptions: { strict: true } },
                default: { compilerOptions: { strict: true } },
                build: { compilerOptions: { strict: true } },
            },
        };
        const { manifest, warnings } = await sync(cwd, tsconfig);
        expect(warnings).toEqual([]);
        for (const file of [
            'config/tsconfig.shared.json',
            'tsconfig.graph.json',
            'packages/core/tsconfig.src.json',
            'packages/core/tsconfig.dist.json',
        ]) {
            expect(read(path.join(cwd, file)).compilerOptions.strict).toBe(true);
            expect(getSnapshot(manifest.snapshots as SnapshotTree, file)).toEqual({
                compilerOptions: {},
            });
        }

        const task = tsconfigSyncTask();
        const config = { tsconfig };
        expect(typeof task.watch === 'function' && task.watch(config)).toEqual([
            'tsconfig.graph.json',
            '**/tsconfig.src.json',
        ]);
        expect(typeof task.keep === 'function' && task.keep(config)).toEqual([
            'tsconfig.dist.json',
            'tsconfig.build.json',
        ]);
    });

    it('warns and skips a missing target instead of creating it', async () => {
        const cwd = monorepo();
        fs.rmSync(path.join(cwd, 'packages/core/tsconfig.build.json'));
        const { warnings, manifest } = await sync(cwd, {
            overrides: { build: { compilerOptions: { declaration: true } } },
        });
        expect(warnings).toEqual(['tsconfig.missing-file']);
        expect(fs.existsSync(path.join(cwd, 'packages/core/tsconfig.build.json'))).toBe(false);
        expect(manifest.tsconfigOverrides).toBeUndefined();
        expect(manifest.snapshots).toBeUndefined();
    });

    it('warns and skips a target outside the project root', async () => {
        const cwd = monorepo();
        const { warnings, manifest } = await sync(cwd, {
            baseFile: '../tsconfig.outside.json',
            overrides: { base: { compilerOptions: { strict: true } } },
        });
        expect(warnings).toEqual(['tsconfig.outside-root']);
        expect(manifest.snapshots).toBeUndefined();
    });

    it('reverts files a previous sync patched that are no longer targeted', async () => {
        const cwd = monorepo();
        write(path.join(cwd, 'packages/core/tsconfig.src.json'), { compilerOptions: {} });
        await sync(cwd, { overrides: { default: { compilerOptions: { strict: true } } } });

        // Renaming the default file moves the override to the new target.
        const { manifest } = await sync(cwd, {
            defaultFile: 'tsconfig.src.json',
            overrides: { default: { compilerOptions: { strict: true } } },
        });
        expect(read(path.join(cwd, 'packages/core/tsconfig.default.json')).compilerOptions).toEqual(
            { target: 'ES2022' }
        );
        expect(read(path.join(cwd, 'packages/core/tsconfig.src.json')).compilerOptions).toEqual({
            strict: true,
        });
        expect(Object.keys(manifest.tsconfigOverrides as object)).toEqual([
            'packages/core/tsconfig.src.json',
        ]);
    });

    it('reports drift in check mode without writing', async () => {
        const cwd = monorepo();
        const { files } = await sync(
            cwd,
            { overrides: { base: { compilerOptions: { strict: true } } } },
            { check: true }
        );
        expect(files.map(file => file.path)).toContain('tsconfig.base.json');
        expect(read(path.join(cwd, 'tsconfig.base.json'))).toEqual({
            compilerOptions: { target: 'ES2022' },
        });
        expect(fs.existsSync(path.join(cwd, MANIFEST))).toBe(false);
    });
});

describe('restoreTsconfigOverrides', () => {
    const overrides: TsconfigOverrides = {
        base: { compilerOptions: { target: 'ES2020' } },
        default: { compilerOptions: { strict: true } },
        build: { compilerOptions: { declaration: true } },
    };

    it('removes the override content per kind and keeps the files', async () => {
        const cwd = monorepo();
        await sync(cwd, { overrides });

        const defaults = restoreTsconfigOverrides({ cwd, kind: 'default' });
        expect(defaults).toEqual({
            restored: ['packages/core/tsconfig.default.json'],
            missing: [],
            kinds: ['default'],
        });
        expect(read(path.join(cwd, 'packages/core/tsconfig.default.json'))).toEqual({
            extends: '../../tsconfig.base.json',
            compilerOptions: { target: 'ES2022' },
        });
        // The other kinds are untouched.
        expect(read(path.join(cwd, 'tsconfig.base.json')).compilerOptions.target).toBe('ES2020');
        const manifest = read(path.join(cwd, MANIFEST));
        expect(Object.keys(manifest.tsconfigOverrides).sort()).toEqual([
            'packages/core/tsconfig.build.json',
            'tsconfig.base.json',
        ]);
        expect(manifest.snapshots.packages.core['tsconfig.default.json']).toBeUndefined();

        const rest = restoreTsconfigOverrides({ cwd });
        expect(rest.restored.sort()).toEqual([
            'packages/core/tsconfig.build.json',
            'tsconfig.base.json',
        ]);
        // A file is never deleted, only its override content.
        expect(read(path.join(cwd, 'packages/core/tsconfig.build.json'))).toEqual({
            extends: './tsconfig.default.json',
        });
        expect(read(path.join(cwd, 'tsconfig.base.json'))).toEqual({
            compilerOptions: { target: 'ES2022' },
        });
        const cleared = read(path.join(cwd, MANIFEST));
        expect(cleared.snapshots).toBeUndefined();
        expect(cleared.tsconfigOverrides).toBeUndefined();
        expect(cleared.files).toEqual(['packages/core/tsconfig.json']);
    });

    it('writes nothing on a dry run', async () => {
        const cwd = monorepo();
        await sync(cwd, { overrides });
        const before = fs.readFileSync(path.join(cwd, MANIFEST), 'utf-8');
        const result = restoreTsconfigOverrides({ cwd, dryRun: true });
        expect(result.restored).toHaveLength(3);
        expect(read(path.join(cwd, 'tsconfig.base.json')).compilerOptions.target).toBe('ES2020');
        expect(fs.readFileSync(path.join(cwd, MANIFEST), 'utf-8')).toBe(before);
    });

    it('warns and skips a missing file, keeping its manifest entry', async () => {
        const cwd = monorepo();
        await sync(cwd, { overrides });
        fs.rmSync(path.join(cwd, 'packages/core/tsconfig.build.json'));
        const warnings: string[] = [];
        const result = restoreTsconfigOverrides({
            cwd,
            warn: (message, id) => warnings.push(id ?? message),
        });
        expect(warnings).toEqual(['tsconfig.missing-file']);
        expect(result.missing).toEqual(['packages/core/tsconfig.build.json']);
        expect(Object.keys(read(path.join(cwd, MANIFEST)).tsconfigOverrides)).toEqual([
            'packages/core/tsconfig.build.json',
        ]);
    });

    it('is a no-op without a manifest', () => {
        expect(restoreTsconfigOverrides({ cwd: tmp() })).toEqual({
            restored: [],
            missing: [],
            kinds: [],
        });
    });
});
