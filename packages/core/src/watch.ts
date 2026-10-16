import fs from 'node:fs';
import path from 'node:path';

import { Glob } from 'glob';

import { logger } from '@deltabox/toolchain-shared';

import { type RunSyncOptions, runSync } from './sync.js';

export interface RunWatchOptions extends Omit<RunSyncOptions, 'check'> {
    /** The config file to watch (re-runs every task on change). */
    configPath?: string;
    /** Debounce window in ms (default 150). */
    debounce?: number;
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

    // Resolve the directories to watch from the config path + task globs.
    const dirs = new Set<string>([cwd]);
    const globs = new Set<string>();
    for (const task of tasks) for (const glob of task.watch ?? []) globs.add(glob);
    for (const glob of globs) {
        try {
            const files = new Glob(glob, {
                cwd,
                dot: true,
                ignore: ['**/node_modules/**'],
            }).walkSync();
            for (const file of files) dirs.add(path.dirname(path.resolve(cwd, file)));
        } catch {
            // ignore invalid globs
        }
    }

    const watchers: fs.FSWatcher[] = [];
    const onChange = (changed?: string) => {
        if (Date.now() < ignoreUntil) return;
        void options.config?.hooks?.onChange?.(changed ? { path: changed } : {});
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
        try {
            watchers.push(
                fs.watch(dir, { recursive: true }, (_event, filename) =>
                    onChange(filename ?? undefined)
                )
            );
        } catch {
            try {
                watchers.push(fs.watch(dir, (_event, filename) => onChange(filename ?? undefined)));
            } catch {
                // directory may not exist
            }
        }
    }

    log('watching for changes (Ctrl+C to stop)');

    await new Promise<void>(resolve => {
        const stop = () => {
            for (const watcher of watchers) watcher.close();
            process.off('SIGINT', stop);
            process.off('SIGTERM', stop);
            resolve();
        };
        process.on('SIGINT', stop);
        process.on('SIGTERM', stop);
    });
}
