import fs from 'node:fs';
import path from 'node:path';

import { Glob } from 'glob';

import {
    isIgnoredPath,
    logger,
    type ProjectType,
    resolveIgnorePatterns,
    sectionConfig,
    type SyncTask,
    type ToolchainConfig,
} from '@deltabox/toolchain-shared';

import { findConfigFile, loadToolchainConfig } from './loader.js';
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
    let configFile = options.configPath ? path.resolve(cwd, options.configPath) : undefined;
    const log = options.quiet ? () => {} : (options.log ?? ((m: string) => logger.info(m)));

    // The loaded config/tokens are refreshed when the config file changes, so a
    // long-running watch applies new sections, tokens and input globs.
    let current: RunWatchOptions = { ...options };
    let ignore: string[] = [];
    let watchers: fs.FSWatcher[] = [];
    let ignoreUntil = 0;
    let timer: NodeJS.Timeout | undefined;
    let running = false;
    let queued = false;
    let configDirty = false;
    let replan = false;

    const debounceMs = (): number =>
        sectionConfig(current.config.watch)?.debounce ?? options.debounce ?? 150;

    const closeWatchers = (): void => {
        for (const watcher of watchers) watcher.close();
        watchers = [];
    };

    const reloadConfig = async (): Promise<boolean> => {
        // The file may have been renamed/created; fall back to discovery only
        // when the watch started from a config (never override `--no-config`).
        const fallback = options.configPath ? findConfigFile(cwd) : undefined;
        const file = configFile && fs.existsSync(configFile) ? configFile : fallback;
        if (!file) return false;
        configFile = file;
        try {
            const loaded = await loadToolchainConfig(cwd, { config: file });
            current = {
                ...current,
                config: loaded.config,
                ownConfig: loaded.ownConfig,
                tokens: loaded.tokens,
                projectType: loaded.projectType,
            };
            return true;
        } catch (error) {
            logger.error(
                `failed to reload ${configFile}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            return false;
        }
    };

    const sync = async () => {
        if (running) {
            queued = true;
            return;
        }
        running = true;
        try {
            if (configDirty) {
                configDirty = false;
                if (await reloadConfig()) replan = true;
            }
            await runSync(current);
        } finally {
            running = false;
            // Ignore the fs events caused by our own writes.
            ignoreUntil = Date.now() + Math.max(debounceMs() * 3, 300);
            if (replan) {
                replan = false;
                rebuildWatchers();
            }
            if (queued) {
                queued = false;
                schedule();
            }
        }
    };

    const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(sync, debounceMs());
    };

    const onChange = (changedAbs?: string) => {
        if (Date.now() < ignoreUntil) return;
        if (changedAbs) {
            const rel = path.relative(cwd, changedAbs).replace(/\\/g, '/');
            if (isIgnoredPath(rel, ignore)) return;
            if (path.basename(changedAbs).startsWith('dbx.config.')) configDirty = true;
        }
        void current.config?.hooks?.onChange?.(changedAbs ? { path: changedAbs } : {});
        schedule();
    };

    /** Recompute the input directories/watchers from the current config. */
    function rebuildWatchers(): void {
        closeWatchers();
        const watch = sectionConfig(current.config.watch);
        ignore = resolveIgnorePatterns(cwd, {
            ...((watch?.exclude ?? options.exclude) !== undefined
                ? { exclude: watch?.exclude ?? options.exclude }
                : {}),
            ...((watch?.gitignore ?? options.gitignore) !== undefined
                ? { gitignore: watch?.gitignore ?? options.gitignore }
                : {}),
        });
        const dirs = new Set<string>([cwd]);
        const projectType = current.projectType ?? resolveProjectType(cwd, current.config);
        for (const glob of resolveWatchGlobs(tasks, current.config, projectType)) {
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

        if (configFile) {
            try {
                watchers.push(
                    fs.watch(configFile, () => {
                        log('config changed; re-syncing');
                        configDirty = true;
                        onChange(configFile);
                    })
                );
            } catch {
                // config file may not be watchable
            }
        }
        for (const dir of dirs) {
            const emit = (filename: string | null): void =>
                onChange(path.join(dir, filename ?? ''));
            try {
                watchers.push(
                    fs.watch(dir, { recursive: true }, (_event, filename) => emit(filename))
                );
            } catch {
                try {
                    watchers.push(fs.watch(dir, (_event, filename) => emit(filename)));
                } catch {
                    // directory may not exist
                }
            }
        }
    }

    await sync();
    rebuildWatchers();
    log('watching for changes (Ctrl+C to stop)');

    await new Promise<void>(resolve => {
        const stop = () => {
            // Drop any pending debounce so a queued re-sync cannot fire while
            // shutting down and the process can exit promptly.
            if (timer) clearTimeout(timer);
            timer = undefined;
            closeWatchers();
            process.off('SIGINT', stop);
            process.off('SIGTERM', stop);
            resolve();
        };
        process.on('SIGINT', stop);
        process.on('SIGTERM', stop);
    });
}
