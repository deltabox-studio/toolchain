import fs from 'node:fs';
import path from 'node:path';

import { Glob } from 'glob';

import {
    isIgnoredPath,
    logger,
    type ProjectType,
    resolveIgnorePatterns,
    type SyncTask,
    type ToolchainConfig,
} from '@deltabox/toolchain-shared';

import { resolveProjectType } from './project-type.js';
import { type RunSyncOptions, runSync } from './sync.js';

export interface RunWatchOptions extends Omit<RunSyncOptions, 'check'> {
    /** The config file to watch (re-runs every task on change). */
    configPath?: string;
    /** Debounce window in ms (default 150). */
    debounce?: number;
    /** Extra glob(s) excluded from watching (on top of the common ignored paths). */
    exclude?: string | string[];
    /** Respect `.gitignore` files (default true). */
    gitignore?: boolean;
}

/**
 * The repo-relative input globs of the tasks that run for `config` (and
 * `projectType`, when given): each task's `watch` globs, with function forms
 * resolved against the config (eg. custom tsconfig file names).
 */
export function resolveWatchGlobs(
    tasks: SyncTask[],
    config: ToolchainConfig,
    projectType?: ProjectType
): string[] {
    const globs = new Set<string>();
    for (const task of tasks) {
        if (projectType && task.projectTypes && !task.projectTypes.includes(projectType)) continue;
        if (task.enabled && !task.enabled(config)) continue;
        const patterns = typeof task.watch === 'function' ? task.watch(config) : (task.watch ?? []);
        for (const glob of patterns) globs.add(glob);
    }
    return [...globs];
}

/**
 * Run one sync, then watch the config file + every task's `watch` globs and
 * re-run on change. Writing generated files must not re-trigger a run, so a
 * short quiet window follows each sync.
 */
export async function runWatch(options: RunWatchOptions): Promise<void> {
    const { cwd, tasks } = options;
    const debounce = options.debounce ?? 150;
    const log = options.quiet ? () => {} : (options.log ?? ((m: string) => logger.info(m)));

    let ignoreUntil = 0;
    let timer: NodeJS.Timeout | undefined;
    let running = false;
    let queued = false;

    const sync = async () => {
        if (running) {
            queued = true;
            return;
        }
        running = true;
        try {
            await runSync(options);
        } finally {
            running = false;
            // Ignore the fs events caused by our own writes.
            ignoreUntil = Date.now() + Math.max(debounce * 3, 300);
            if (queued) {
                queued = false;
                schedule();
            }
        }
    };

    const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(sync, debounce);
    };

    await sync();

    // Resolve the directories to watch from the config path + task globs, then
    // filter out anything the ignore list (defaults + `exclude` + `.gitignore`)
    // excludes.
    const ignore = resolveIgnorePatterns(cwd, {
        ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
        ...(options.gitignore !== undefined ? { gitignore: options.gitignore } : {}),
    });
    const dirs = new Set<string>([cwd]);
    const projectType = options.projectType ?? resolveProjectType(cwd, options.config);
    const globs = new Set(resolveWatchGlobs(tasks, options.config, projectType));
    for (const glob of globs) {
        try {
            const files = new Glob(glob, { cwd, dot: true, ignore }).walkSync();
            for (const file of files) {
                const abs = path.resolve(cwd, file);
                const rel = path.relative(cwd, abs).replace(/\\/g, '/');
                if (isIgnoredPath(rel, ignore)) continue;
                dirs.add(path.dirname(abs));
            }
        } catch {
            // ignore invalid globs
        }
    }

    const watchers: fs.FSWatcher[] = [];
    const onChange = (changedAbs?: string) => {
        if (Date.now() < ignoreUntil) return;
        if (changedAbs) {
            const rel = path.relative(cwd, changedAbs).replace(/\\/g, '/');
            if (isIgnoredPath(rel, ignore)) return;
        }
        void options.config?.hooks?.onChange?.(changedAbs ? { path: changedAbs } : {});
        schedule();
    };

    if (options.configPath) {
        try {
            watchers.push(
                fs.watch(options.configPath, () => {
                    log('config changed; re-syncing');
                    onChange(options.configPath);
                })
            );
        } catch {
            // config file may not be watchable
        }
    }
    for (const dir of dirs) {
        const emit = (filename: string | null): void => onChange(path.join(dir, filename ?? ''));
        try {
            watchers.push(fs.watch(dir, { recursive: true }, (_event, filename) => emit(filename)));
        } catch {
            try {
                watchers.push(fs.watch(dir, (_event, filename) => emit(filename)));
            } catch {
                // directory may not exist
            }
        }
    }

    log('watching for changes (Ctrl+C to stop)');

    await new Promise<void>(resolve => {
        const stop = () => {
            // Drop any pending debounce so a queued re-sync cannot fire while
            // shutting down and the process can exit promptly.
            if (timer) clearTimeout(timer);
            timer = undefined;
            for (const watcher of watchers) watcher.close();
            process.off('SIGINT', stop);
            process.off('SIGTERM', stop);
            resolve();
        };
        process.on('SIGINT', stop);
        process.on('SIGTERM', stop);
    });
}
