import fs from 'node:fs';
import path from 'node:path';

import {
    logger,
    type ManagedFile,
    type ProjectType,
    type Replacements,
    type SyncContext,
    type SyncTask,
    type ToolchainConfig,
} from '@deltabox/toolchain/shared';

import { ensureDbxGitignore } from './gitignore.js';
import { readManifest, writeManifest } from './manifest.js';
import { resolveManagedPath } from './paths.js';
import { resolveProjectType } from './project-type.js';

export interface RunSyncOptions {
    /** The task list to run. */
    tasks: SyncTask[];
    /** Only run the named task(s); implies `prune: false`. */
    only?: string[];
    /** The project root. */
    cwd: string;
    /** The loaded config. */
    config: ToolchainConfig;
    /** The project's own (unmerged) config, when known. */
    ownConfig?: ToolchainConfig;
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** The project kind (resolved from the config/cwd when omitted). */
    projectType?: ProjectType;
    /** Dry-run: report drift and exit non-zero without writing. */
    check?: boolean;
    /** Remove managed files no longer produced by the active tasks (default true). */
    prune?: boolean;
    /** Suppress logging. */
    quiet?: boolean;
    /** Custom logger (default `logger.info`). */
    log?: (message: string) => void;
}

export interface RemovedFile {
    /** Repo-relative path. */
    path: string;
    /** The content before removal, so an editor can offer "Restore". */
    content: string;
}

export interface SyncResult {
    /** Paths written (empty in check mode). */
    written: string[];
    /** Paths whose generated content differs from disk. */
    changed: string[];
    /** Previously-managed paths removed because they are no longer generated. */
    removed: string[];
    /** The removed files' previous content (for a Restore action). */
    removedFiles: RemovedFile[];
    /** Whether disk already matched the generated output. */
    upToDate: boolean;
}

/** Normalize a path to forward slashes. */
function norm(relative: string): string {
    return relative.replace(/\\/g, '/');
}

/** Select sync tasks by name; throws when a name is unknown. */
export function selectSyncTasks(tasks: SyncTask[], only: string[]): SyncTask[] {
    const byName = new Map(tasks.map(task => [task.name, task]));
    const unknown = only.filter(name => !byName.has(name));
    if (unknown.length > 0) {
        throw new Error(
            `unknown sync task(s): ${unknown.join(', ')} (available: ${tasks
                .map(task => task.name)
                .join(', ')})`
        );
    }
    return only.map(name => byName.get(name)!);
}

/**
 * Run every enabled sync task, writing the managed files and pruning files that
 * are no longer generated. With `check: true` nothing is written: drift is
 * reported instead (for CI).
 */
export async function runSync(options: RunSyncOptions): Promise<SyncResult> {
    const { cwd, config, ownConfig, tokens } = options;
    const only = options.only && options.only.length > 0 ? options.only : undefined;
    const tasks = only ? selectSyncTasks(options.tasks, only) : options.tasks;
    // A task subset must not prune files owned by the tasks it skipped.
    const prune = only ? false : options.prune !== false;
    const log = options.quiet ? () => {} : (options.log ?? ((m: string) => logger.info(m)));
    const warn = options.quiet ? () => {} : (m: string, id?: string) => logger.warn(m, id);
    const projectType = options.projectType ?? resolveProjectType(cwd, config);
    const manifest = readManifest(cwd);
    const ctx: SyncContext = {
        cwd,
        projectType,
        config,
        ownConfig: ownConfig ?? config,
        tokens,
        log,
        warn,
        check: options.check === true,
        managedFiles: manifest.files,
        manifest: {
            ...manifest.extras,
            ...(manifest.tsconfigOverrides
                ? { tsconfigOverrides: manifest.tsconfigOverrides }
                : {}),
            ...(manifest.snapshots ? { snapshots: manifest.snapshots } : {}),
        },
    };
    const hooks = config.hooks ?? {};
    await hooks.beforeSync?.(ctx);

    const active = tasks.filter(
        task =>
            (!task.projectTypes || task.projectTypes.includes(projectType)) &&
            (!task.enabled || task.enabled(config))
    );
    log(`running ${active.length} task(s)${options.check ? ' (check)' : ''} [${projectType}]`);

    const files: ManagedFile[] = [];
    for (const task of active) {
        log(`  - ${task.name}`);
        await hooks.beforeTask?.({ task, ctx });
        const result = await task.run(ctx);
        const produced = Array.isArray(result) ? result : undefined;
        if (produced) files.push(...produced);
        await hooks.afterTask?.({ task, ctx, ...(produced ? { files: produced } : {}) });
    }

    // A task must never write outside the project root (eg. `..` or an absolute
    // path from a custom generator/provider).
    for (const file of files) resolveManagedPath(cwd, file.path);

    const desired = new Map(
        files.map(file => {
            const abs = resolveManagedPath(cwd, file.path);
            return [norm(path.relative(cwd, abs)), file.content] as const;
        })
    );
    // Untracked files are written + drift-checked but stay user-owned: they are
    // kept out of the manifest, so they are never pruned or reset.
    const untracked = new Set(
        files.filter(file => file.track === false).map(file => norm(file.path))
    );

    // Files a task declares as user-owned (`keep`): never deleted, dropped from
    // the manifest, so consumers can edit them (eg. `tsconfig.build.json`).
    // Collect from every task that applies to this project type, even when it is
    // currently disabled: disabling a section must not make its kept files
    // deletable.
    const keep = new Set<string>();
    for (const task of tasks) {
        if (task.projectTypes && !task.projectTypes.includes(projectType)) continue;
        const patterns = typeof task.keep === 'function' ? task.keep(config) : (task.keep ?? []);
        for (const pattern of patterns) keep.add(pattern);
    }
    const isKept = (relative: string): boolean => {
        for (const pattern of keep) {
            if (
                relative === pattern ||
                relative.endsWith(`/${pattern}`) ||
                relative.endsWith(pattern)
            )
                return true;
        }
        return false;
    };

    const changed: string[] = [];
    for (const [relative, content] of desired) {
        const abs = path.resolve(cwd, relative);
        const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : undefined;
        if (current !== content) changed.push(relative);
    }
    const existedBefore = new Map(
        [...desired.keys()].map(relative => [relative, fs.existsSync(path.resolve(cwd, relative))])
    );
    // A file dbx never created (it existed before the first sync) is adopted:
    // stop managing it, but never delete it when its section is removed.
    const originOf = (relative: string): 'created' | 'adopted' => {
        const recorded = manifest.origins?.[relative];
        if (recorded) return recorded;
        if (!manifest.files.includes(relative)) {
            return existedBefore.get(relative) ? 'adopted' : 'created';
        }
        // A legacy manifest (before `origins`) cannot tell us who created an
        // already-managed file. Treat it as adopted so a sync/reset can never
        // delete a pre-existing user file.
        return 'adopted';
    };
    const removed: string[] = [];
    const removedFiles: RemovedFile[] = [];
    for (const relative of manifest.files) {
        if (
            !prune ||
            desired.has(relative) ||
            untracked.has(relative) ||
            isKept(relative) ||
            originOf(relative) !== 'created'
        ) {
            continue;
        }
        let abs: string;
        try {
            abs = resolveManagedPath(cwd, relative);
        } catch (cause) {
            // A tampered/invalid manifest entry must never delete outside the
            // project root.
            warn(
                `sync: ignoring unsafe manifest path "${relative}": ${
                    cause instanceof Error ? cause.message : String(cause)
                }`
            );
            continue;
        }
        if (!fs.existsSync(abs)) continue;
        removed.push(relative);
        removedFiles.push({ path: relative, content: fs.readFileSync(abs, 'utf-8') });
    }
    const upToDate = changed.length === 0 && removed.length === 0;

    if (options.check) {
        if (upToDate) {
            log('generated files are in sync.');
        } else {
            log('generated files are out of date:');
            for (const relative of changed) log(`  M ${relative}`);
            for (const relative of removed) log(`  D ${relative}`);
            log('Run `dbx sync` to regenerate them.');
        }
        const summary = { written: [], changed, removed, removedFiles, upToDate };
        await hooks.afterSync?.({ cwd, config, result: summary });
        return summary;
    }

    const written: string[] = [];
    for (const [relative, content] of desired) {
        const abs = path.resolve(cwd, relative);
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, content, 'utf-8');
        written.push(relative);
    }
    for (const relative of removed) {
        fs.rmSync(path.resolve(cwd, relative), { force: true });
    }
    const tracked = [...new Set([...(prune ? [] : manifest.files), ...desired.keys()])].filter(
        relative => !untracked.has(relative)
    );
    const origins: Record<string, 'created' | 'adopted'> = {};
    for (const relative of tracked) {
        origins[relative] = originOf(relative);
    }
    writeManifest(cwd, tracked, undefined, origins, ctx.manifest);
    if (ensureDbxGitignore(cwd)) log('  I .gitignore (added the .dbx ignore block)');

    log(
        `wrote ${written.length}, removed ${removed.length} file(s)${
            changed.length ? `, updated ${changed.length}` : ''
        }.`
    );
    const summary = { written, changed, removed, removedFiles, upToDate };
    await hooks.afterSync?.({ cwd, config, result: summary });
    return summary;
}
