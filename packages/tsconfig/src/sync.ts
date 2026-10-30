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
    type ToolchainConfig,
    warningMessage,
} from '@deltabox/toolchain-shared';

import { generateTsconfigs } from './cli/generate/index.js';
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

/** The tsconfig file names the task reads and patches (custom names honoured). */
export interface TsconfigFileNames {
    baseFile: string;
    rootFile: string;
    defaultFile: string;
    buildFile: string;
}

/** Resolve the configured tsconfig file names (defaults for the unset ones). */
export function tsconfigFileNames(config: ToolchainConfig): TsconfigFileNames {
    const t = sectionConfig(config.tsconfig) ?? {};
    return {
        baseFile: t.baseFile ?? 'tsconfig.base.json',
        rootFile: t.rootFile ?? 'tsconfig.workspaces.json',
        defaultFile: t.defaultFile ?? 'tsconfig.default.json',
        buildFile: t.buildFile ?? 'tsconfig.build.json',
    };
}

function rel(cwd: string, file: string): string {
    return path.relative(cwd, file).replace(/\\/g, '/');
}

/** One file an override may apply to during this sync. */
interface OverrideTarget {
    file: string;
    kind: TsconfigOverrideKind;
    override: TsConfigJson | undefined;
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

        if (!fs.existsSync(target.file)) {
            ctx.warn(
                warningMessage('tsconfig.missing-file', { file: relative, kind: target.kind }),
                'tsconfig.missing-file'
            );
            // Keep the record (the file may come back), unless nothing targets it anymore.
            if (previous && !orphans.has(relative)) nextState[relative] = previous;
            if (orphans.has(relative)) deleteSnapshot(snapshots, relative);
            continue;
        }

        const text = fs.readFileSync(target.file, 'utf-8');
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
        // Only a monorepo root has a `tsconfig.workspaces.json` to expand.
        projectTypes: ['monorepo-root'],
        enabled: config => sectionEnabled(config.tsconfig),
        watch: config => {
            const names = tsconfigFileNames(config);
            return [names.rootFile, `**/${names.defaultFile}`];
        },
        // Users own their build configs; never delete them on a sync.
        keep: config => [...new Set([tsconfigFileNames(config).buildFile, 'tsconfig.build.json'])],
        run: ctx => {
            const t = sectionConfig(ctx.config.tsconfig) ?? {};
            const { baseFile, rootFile, defaultFile, buildFile } = tsconfigFileNames(ctx.config);
            const workspacesFile = path.resolve(ctx.cwd, rootFile);
            const hasWorkspacesFile = fs.existsSync(workspacesFile);
            const indent = t.indent ?? 4;
            const glob = t.glob ?? `**/${defaultFile}`;
            const overrides: TsconfigOverrides = t.overrides ?? {};
            const results = generateTsconfigs({
                cwd: ctx.cwd,
                aliases: t.aliases ?? true,
                composite: t.composite ?? false,
                refs: t.refs ?? false,
                indent,
                glob,
                ...(t.exclude !== undefined ? { exclude: t.exclude } : {}),
                ...(t.gitignore !== undefined ? { gitignore: t.gitignore } : {}),
                defaultFile,
                buildFile,
                monorepoTsconfigFilename: rootFile,
                log: false,
                write: false,
                overrides,
            });

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

            const targets: OverrideTarget[] = [
                { file: path.resolve(ctx.cwd, baseFile), kind: 'base', override: overrides.base },
                { file: workspacesFile, kind: 'root', override: overrides.root },
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
