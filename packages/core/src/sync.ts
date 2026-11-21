import fs from 'node:fs';
import path from 'node:path';

import {
    logger,
    type ManagedFile,
    type ProjectType,
    type Replacements,
    resolveToolchainEnabled,
    type SyncContext,
    type SyncTask,
    type ToolchainConfig,
} from '@deltabox/toolchain/shared';

import {
    formatManagedFiles,
    type ManagedFormatSetting,
    resolveManagedFormatting,
} from './format-managed.js';
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
    /** Remove managed files no longer produced by the active tasks. @default `true` */
    prune?: boolean;
    /** Suppress logging. */
    quiet?: boolean;
    /** Custom logger. @default `logger.info` */
    log?: (message: string) => void;
    /** Whether the config came from a `dbx()` Vite/Vite+ plugin. */
    plugin?: boolean;
    /** Format the written managed files (overrides `sync.format`). */
    format?: ManagedFormatSetting;
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
    const pruneRequested = only ? false : options.prune !== false;
    const log = options.quiet ? () => {} : (options.log ?? ((m: string) => logger.info(m)));
    const warn = options.quiet ? () => {} : (m: string, id?: string) => logger.warn(m, id);
    const projectType = options.projectType ?? resolveProjectType(cwd, config);
    const manifest = readManifest(cwd);
    if (!resolveToolchainEnabled(config).enabled) {
        log('toolchain disabled; skipping sync.');
        return {
            written: [],
            changed: [],
            removed: [],
            removedFiles: [],
            upToDate: true,
        };
    }
    const ctx: SyncContext = {
        cwd,
        projectType,
        config,
        ownConfig: ownConfig ?? config,
        tokens,
        log,
        warn,
        check: options.check === true,
        ...(options.plugin ? { plugin: true } : {}),
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

    const applicable = tasks.filter(
        task =>
            (!task.projectTypes || task.projectTypes.includes(projectType)) &&
            (!task.enabled || task.enabled(config))
    );
    // A task can opt out of regenerating its managed files (`<section>.regenerate
    // = false`). Skipping it means its files are neither written nor drift-checked.
    const frozen = applicable.filter(task => task.regenerate && !task.regenerate(config));
    const active = applicable.filter(task => !frozen.includes(task));
    // Never prune while a task is frozen: its previously-managed files still
    // belong to it and must not be deleted just because they are not desired now.
    const prune = pruneRequested && frozen.length === 0;
    for (const task of frozen) {
        log(`  - ${task.name} (regeneration disabled)`);
    }
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

    // Canonicalize every task output once: `./a.ts`, `a/../a.ts`, an absolute
    // path and `a.ts` all name the same managed file, and the manifest must use
    // one key for all of them.
    const resolved = files.map(file => {
        const key = norm(path.relative(cwd, resolveManagedPath(cwd, file.path)));
        const header =
            file.header && !/\.json$/i.test(file.path) && !file.content.startsWith(file.header)
                ? `${file.header}\n`
                : '';
        return { ...file, key, content: `${header}${file.content}` };
    });
    const desired = new Map(resolved.map(file => [file.key, file.content] as const));
    // Untracked files are written + drift-checked but stay user-owned: they are
    // kept out of the manifest, so they are never pruned or reset.
    const untracked = new Set(resolved.filter(file => file.track === false).map(file => file.key));
    // Files a task already writes in their final form (eg. generated
    // tsconfigs): never run the post-write formatter on them, so `--check`
    // compares the generator output directly.
    const unformatted = new Set(
        resolved.filter(file => file.format === false).map(file => file.key)
    );

    // Files a task declares as user-owned (`keep`): never deleted, dropped from
    // the manifest, so consumers can edit them (eg. `tsconfig.build.json`).
    // Collect from every task that applies to this project type, even when it is
    // currently disabled: disabling a section must not make its kept files
    // deletable.
    const keep = new Set<string>();
    for (const task of options.tasks) {
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

    // Snapshot the original contents so the final `changed` list reflects the
    // formatted output (not the raw generator output).
    const originalContent = new Map<string, string | undefined>();
    for (const relative of desired.keys()) {
        const abs = path.resolve(cwd, relative);
        originalContent.set(
            relative,
            fs.existsSync(abs) ? fs.readFileSync(abs, 'utf-8') : undefined
        );
    }
    const existedBefore = new Map(
        [...desired.keys()].map(relative => [relative, originalContent.get(relative) !== undefined])
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
        const stat = fs.statSync(abs);
        if (!stat.isFile()) {
            // A stale manifest entry that now names a directory must not make
            // every sync fail (or be deleted).
            warn(`sync: ignoring "${relative}": it is not a file.`);
            continue;
        }
        removed.push(relative);
        removedFiles.push({ path: relative, content: fs.readFileSync(abs, 'utf-8') });
    }

    // Write (and, by default, format) the generated files before comparing, so
    // the comparison uses the same content the user will get. In check mode the
    // original files are restored afterwards; nothing is left behind.
    let preWritten = false;
    const formatting = resolveManagedFormatting({ setting: options.format, config });
    if (formatting.enabled && desired.size > 0) {
        try {
            for (const [relative, content] of desired) {
                const abs = path.resolve(cwd, relative);
                if (fs.existsSync(abs) && fs.readFileSync(abs, 'utf-8') === content) continue;
                fs.mkdirSync(path.dirname(abs), { recursive: true });
                fs.writeFileSync(abs, content, 'utf-8');
            }
            const formatTargets = [...desired.keys()].filter(
                relative => !unformatted.has(relative)
            );
            // Check mode writes the generated content temporarily and formats it
            // in fix mode, then restores the originals in `finally`. Forcing the
            // formatter's own `--check` would leave formatting-only drift
            // invisible (the unformatted output would compare equal to itself).
            const formatted = await formatManagedFiles(cwd, formatTargets, {
                setting: options.format,
                config,
                check: false,
            });
            if (formatted.ran && formatted.code !== 0) {
                log(`  ! formatter exited ${formatted.code}; managed files may be unformatted.`);
            }
            for (const relative of desired.keys()) {
                const abs = path.resolve(cwd, relative);
                if (fs.existsSync(abs)) desired.set(relative, fs.readFileSync(abs, 'utf-8'));
            }
            preWritten = !options.check;
        } finally {
            if (options.check) {
                for (const [relative, content] of originalContent) {
                    const abs = path.resolve(cwd, relative);
                    if (content === undefined) {
                        fs.rmSync(abs, { force: true });
                    } else {
                        fs.mkdirSync(path.dirname(abs), { recursive: true });
                        fs.writeFileSync(abs, content, 'utf-8');
                    }
                }
            }
        }
    }
    const changed = [...desired]
        .filter(([relative, content]) => originalContent.get(relative) !== content)
        .map(([relative]) => relative);
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
    if (preWritten) {
        written.push(...desired.keys());
    } else {
        for (const [relative, content] of desired) {
            const abs = path.resolve(cwd, relative);
            fs.mkdirSync(path.dirname(abs), { recursive: true });
            fs.writeFileSync(abs, content, 'utf-8');
            written.push(relative);
        }
    }
    for (const relative of removed) {
        fs.rmSync(path.resolve(cwd, relative), { force: true });
    }
    const tracked = [...new Set([...(prune ? [] : manifest.files), ...desired.keys()])].filter(
        relative => !untracked.has(relative) && !isKept(relative)
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
