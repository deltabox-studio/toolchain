import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import type { TsConfigJson } from 'type-fest';

import {
    type ManagedFile,
    type SyncContext,
    type SyncTask,
    sectionConfig,
    sectionEnabled,
    warningMessage,
} from '@deltabox/toolchain/shared';

import { generateWorkspaceTsconfigs } from './cli/generate/index.js';
import { tsconfigFileNames } from './files.js';
import {
    addedOverrideLeaves,
    type AppliedOverride,
    applyOverride,
    hasOverrideKeys,
    isAppliedOverride,
    mergeOverride,
    type OverridesState,
    recordOverrideSnapshot,
    removedOverrideLeaves,
    revertOverride,
    type TsconfigOverrideKind,
    type TsconfigOverrides,
} from './overrides.js';
import { parseTsconfig } from './resolve.js';
import {
    deleteSnapshot,
    detectIndent,
    getSnapshot,
    setSnapshot,
    type SnapshotTree,
    stringifyTsconfig,
    toRepoRelative,
} from './snapshots.js';

export type { TsconfigFileNames } from './files.js';
export { tsconfigFileNames } from './files.js';

function rel(cwd: string, file: string): string {
    return path.relative(cwd, file).replace(/\\/g, '/');
}

/** One file an override may apply to during this sync. */
interface OverrideTarget {
    file: string;
    kind: TsconfigOverrideKind;
    override: TsConfigJson | undefined;
    /** In-memory base content (eg. the auto-wired root workspaces tsconfig). */
    content?: string;
}

/**
 * Apply/revert `tsconfig.overrides` on the user-owned base/root/default/build
 * files. The manifest keeps the applied override per file plus the original
 * snapshot, so dropping an override key removes exactly what it added. The
 * patched files are returned untracked: they stay user-owned (never pruned or
 * reset), but are still written and drift-checked.
 */
function syncOverrides(ctx: SyncContext, targets: OverrideTarget[], indent: number): ManagedFile[] {
    const previousState = (ctx.manifest?.tsconfigOverrides ?? {}) as OverridesState;
    const snapshots = structuredClone((ctx.manifest?.snapshots ?? {}) as SnapshotTree);
    const nextState: OverridesState = {};
    const files: ManagedFile[] = [];

    // Every configured target, plus any file a previous sync patched that the
    // config no longer targets (eg. a renamed `defaultFile`): it gets reverted.
    const byFile = new Map<string, OverrideTarget>();
    for (const target of targets) {
        const relative = toRepoRelative(ctx.cwd, target.file);
        if (!relative) {
            if (hasOverrideKeys(target.override)) {
                ctx.warn(
                    warningMessage('tsconfig.outside-root', { file: target.file }),
                    'tsconfig.outside-root'
                );
            }
            continue;
        }
        const existing = byFile.get(relative);
        byFile.set(
            relative,
            existing
                ? { ...existing, override: mergeOverride(existing.override ?? {}, target.override) }
                : target
        );
    }
    const orphans = new Set<string>();
    for (const [relative, applied] of Object.entries(previousState)) {
        if (byFile.has(relative) || !isAppliedOverride(applied)) continue;
        if (!toRepoRelative(ctx.cwd, relative)) continue;
        orphans.add(relative);
        byFile.set(relative, {
            file: path.resolve(ctx.cwd, relative),
            kind: applied.kind,
            override: undefined,
        });
    }

    for (const [relative, target] of byFile) {
        const previous: AppliedOverride | undefined = isAppliedOverride(previousState[relative])
            ? previousState[relative]
            : undefined;
        const next = hasOverrideKeys(target.override) ? target.override : undefined;
        if (!previous && !next) continue;

        if (!fs.existsSync(target.file) && target.content === undefined) {
            ctx.warn(
                warningMessage('tsconfig.missing-file', { file: relative, kind: target.kind }),
                'tsconfig.missing-file'
            );
            // Keep the record (the file may come back), unless nothing targets it anymore.
            if (previous && !orphans.has(relative)) nextState[relative] = previous;
            if (orphans.has(relative)) deleteSnapshot(snapshots, relative);
            continue;
        }

        const text = target.content ?? fs.readFileSync(target.file, 'utf-8');
        const before = parseTsconfig(text) as Record<string, unknown>;
        const data = structuredClone(before);
        const existing = getSnapshot(snapshots, relative);
        const snapshot = (existing !== undefined ? existing : structuredClone(before)) as Record<
            string,
            unknown
        >;

        // Drop what the previous override set that the new one no longer does.
        const { kept } = revertOverride(
            data,
            removedOverrideLeaves(previous?.override, next),
            snapshot
        );
        for (const key of kept) {
            ctx.warn(
                warningMessage('tsconfig.override-edited', { file: relative, key }),
                'tsconfig.override-edited'
            );
        }

        if (next) {
            recordOverrideSnapshot(snapshot, data, addedOverrideLeaves(previous?.override, next));
            setSnapshot(snapshots, relative, snapshot);
            nextState[relative] = { kind: target.kind, override: structuredClone(next) };
            applyOverride(data, next);
        } else {
            deleteSnapshot(snapshots, relative);
        }

        if (!isDeepStrictEqual(before, data)) {
            files.push({
                path: relative,
                content: stringifyTsconfig(data, detectIndent(text, indent)),
                track: false,
            });
        }
    }

    if (ctx.manifest) {
        if (Object.keys(nextState).length > 0) ctx.manifest.tsconfigOverrides = nextState;
        else delete ctx.manifest.tsconfigOverrides;
        if (Object.keys(snapshots).length > 0) ctx.manifest.snapshots = snapshots;
        else delete ctx.manifest.snapshots;
    }
    return files;
}

/**
 * The tsconfig sync task: regenerates every workspace `tsconfig.json` from the
 * workspace default tsconfig files, applying the monorepo aliases + references,
 * then applies `tsconfig.overrides` to the user-owned base/root/default/build
 * files. Custom file names (`baseFile`, `rootFile`, `defaultFile`, `buildFile`)
 * are honoured everywhere, including the watched inputs.
 */
export function tsconfigSyncTask(): SyncTask {
    return {
        name: 'tsconfig',
        // Roots expand their workspaces; a workspace with its own `tsconfig`
        // section manages its own (nested) tree. Parent `tsconfig` is not
        // inherited, so a plain workspace still has no section and is skipped.
        projectTypes: ['monorepo-root', 'monorepo-workspace'],
        enabled: config => sectionEnabled(config.tsconfig),
        watch: config => {
            const names = tsconfigFileNames(config);
            return [names.rootFile, `**/${names.defaultFile}`];
        },
        // Users own their build configs; never delete them on a sync.
        keep: config => [...new Set([tsconfigFileNames(config).buildFile, 'tsconfig.build.json'])],
        run: async ctx => {
            const t = sectionConfig(ctx.config.tsconfig) ?? {};
            const { baseFile, rootFile, defaultFile } = tsconfigFileNames(ctx.config);
            const workspacesFile = path.resolve(ctx.cwd, rootFile);
            const hasWorkspacesFile = fs.existsSync(workspacesFile);
            const indent = t.indent ?? 4;
            const glob = t.glob ?? `**/${defaultFile}`;
            const overrides: TsconfigOverrides = t.overrides ?? {};
            const generated = await generateWorkspaceTsconfigs({
                cwd: ctx.cwd,
                config: ctx.config,
                write: false,
                writeSidecar: false,
                previousAuto: ctx.manifest?.tsconfigAuto as
                    | { paths: string[]; references: string[] }
                    | undefined,
            });
            const results = generated.results;

            if (results.length === 0) {
                // Nothing to wire: warn only when the config implies workspaces
                // are expected (references/composite enabled, or a workspaces
                // tsconfig exists), otherwise stay quiet.
                if (t.refs || t.composite || hasWorkspacesFile) {
                    const searched = Array.isArray(glob) ? glob.join(', ') : glob;
                    const expects = [
                        t.refs ? 'project references' : '',
                        t.composite ? 'composite' : '',
                        hasWorkspacesFile ? `${rootFile}` : '',
                    ].filter(Boolean);
                    ctx.warn(
                        `no workspace tsconfig files found (looked for ${searched}), but ` +
                            `${expects.join(' + ')} have nothing to wire.`
                    );
                } else {
                    ctx.log(`tsconfig: no workspace tsconfig files found; skipping.`);
                }
            }

            const files: ManagedFile[] = results.map(result => ({
                path: rel(ctx.cwd, result.targetTsconfigPath),
                content: `${JSON.stringify(result.newTsconfig, null, indent)}\n`,
            }));

            // A nested workspace with its own `tsconfig` section owns its
            // generated file. Keep it untracked so a root sync neither rewrites
            // nor prunes it (the workspace's own sync regenerates it).
            for (const workspace of generated.workspaces) {
                if (workspace.isRoot || !workspace.ownTsconfig || !workspace.enabled) continue;
                if (!fs.existsSync(workspace.targetTsconfigPath)) continue;
                files.push({
                    path: rel(ctx.cwd, workspace.targetTsconfigPath),
                    content: fs.readFileSync(workspace.targetTsconfigPath, 'utf-8'),
                    track: false,
                });
            }

            const rootOverride = overrides.root;
            if (generated.writeRoot && !hasOverrideKeys(rootOverride)) {
                files.push({
                    path: rel(ctx.cwd, generated.rootTsconfigPath),
                    content: generated.rootContent,
                    // The root workspaces tsconfig is user-owned: auto wiring only
                    // adds/removes the entries it manages.
                    track: false,
                });
            }
            if (ctx.manifest) {
                if (
                    generated.autoState.paths.length > 0 ||
                    generated.autoState.references.length > 0
                ) {
                    ctx.manifest.tsconfigAuto = generated.autoState;
                } else {
                    delete ctx.manifest.tsconfigAuto;
                }
            }

            const targets: OverrideTarget[] = [
                { file: path.resolve(ctx.cwd, baseFile), kind: 'base', override: overrides.base },
                {
                    file: workspacesFile,
                    kind: 'root',
                    override: overrides.root,
                    content: generated.baseRootContent,
                },
            ];
            for (const result of results) {
                targets.push({
                    file: result.tsconfigPath,
                    kind: 'default',
                    override: overrides.default,
                });
                targets.push({
                    file: result.targetTsconfigBuildPath,
                    kind: 'build',
                    override: overrides.build,
                });
            }
            files.push(...syncOverrides(ctx, targets, indent));

            if (results.length > 0) {
                ctx.log(`tsconfig: regenerated ${results.length} workspace tsconfig(s).`);
            }
            return files;
        },
    };
}
