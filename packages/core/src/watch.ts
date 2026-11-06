import fs from 'node:fs';
import path from 'node:path';

import { globSync } from 'glob';

import {
    deepMerge,
    isIgnoredPath,
    logger,
    type ProjectType,
    resolveIgnorePatterns,
    sectionConfig,
    sectionEnabled,
    type SyncTask,
    type ToolchainConfig,
    type TsconfigFileNameSet,
    tsconfigFileNames,
} from '@deltabox/toolchain/shared';

import { buildProjectGraph, type ProjectGraph } from './graph.js';
import { findConfigFile, loadToolchainConfig } from './loader.js';
import { resolveProjectType } from './project-type.js';
import { type RunSyncOptions, runSync, selectSyncTasks } from './sync.js';

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
 * The legacy/default watch globs. The extension resolves these to concrete,
 * non-recursive repo-relative files via {@link resolveWatchInputFiles}; this
 * const is exported for consumers that still want the wide patterns.
 */
export const DEFAULT_WATCH_GLOBS = [
    '**/dbx.config.*',
    'tsconfig.workspaces.json',
    '**/tsconfig.default.json',
] as const;

export interface ResolveWatchInputFilesOptions {
    /** Repo root. */
    cwd: string;
    /** The merged root config. */
    config: ToolchainConfig;
    /** The detected/config project type. */
    projectType?: ProjectType;
    /** The sync tasks to derive task-level inputs from. */
    tasks?: SyncTask[];
    /** A prebuilt project graph (default: built from `cwd`). */
    graph?: ProjectGraph;
    /** Explicit user globs; when set they replace the resolved inputs. */
    userGlobs?: string[];
    /** Extra glob(s) to exclude. */
    exclude?: string | string[];
    /** Respect `.gitignore` files (default true). */
    gitignore?: boolean;
}

export interface ResolvedWatchInputFiles {
    /** Concrete, repo-relative (posix), non-recursive paths to watch. */
    globs: string[];
    /** Every `dbx.config.*` path. */
    configs: string[];
    /** The root tsconfig file names (drives project detection). */
    tsconfig: TsconfigFileNameSet;
}

function relPosix(cwd: string, file: string): string {
    return path.relative(cwd, file).replace(/\\/g, '/');
}

/**
 * Resolve the exact files the auto-sync watcher should watch. Unlike the legacy
 * recursive globs, this uses the project graph (plus each project's own config)
 * so only the necessary config/tsconfig files are watched, and custom file names
 * are honoured.
 */
export async function resolveWatchInputFiles(
    options: ResolveWatchInputFilesOptions
): Promise<ResolvedWatchInputFiles> {
    const cwd = path.resolve(options.cwd);
    const names = tsconfigFileNames(options.config);
    const userGlobs = options.userGlobs;
    if (userGlobs) {
        return { globs: [...new Set(userGlobs)], configs: [], tsconfig: names };
    }

    const graph = options.graph ?? buildProjectGraph(cwd);
    const ignore = resolveIgnorePatterns(cwd, {
        ...(options.exclude !== undefined ? { exclude: options.exclude } : {}),
        ...(options.gitignore !== undefined ? { gitignore: options.gitignore } : {}),
    });
    const globs = new Set<string>();
    const configs = new Set<string>();
    const add = (file: string): void => {
        if (!file || file === '.' || path.isAbsolute(file)) return;
        const normalized = file.replace(/\\/g, '/').replace(/^\.\//, '');
        if (normalized.startsWith('../') || normalized === '..') return;
        if (isIgnoredPath(normalized, ignore)) return;
        globs.add(normalized);
    };
    const addIfExists = (file: string): void => {
        if (fs.existsSync(path.resolve(cwd, file))) add(file);
    };

    for (const project of graph.projects) {
        const config = project.config;
        if (project.hasConfig && config) {
            add(config);
            configs.add(config);
        }
    }
    const rootConfig = findConfigFile(cwd);
    if (rootConfig) {
        const relative = relPosix(cwd, rootConfig);
        add(relative);
        configs.add(relative);
    }

    const rootEnabled = sectionEnabled(options.config.tsconfig);
    const rootOptions = (sectionConfig(options.config.tsconfig) ?? {}) as Record<string, unknown>;
    for (const project of graph.projects) {
        const dir = path.resolve(cwd, project.dir);
        let ownSection: unknown;
        if (project.dir !== '.' && project.hasConfig) {
            try {
                const loaded = await loadToolchainConfig(dir, { tolerant: true, skipHooks: true });
                ownSection = loaded.ownConfig?.tsconfig;
            } catch {
                ownSection = undefined;
            }
        }
        const enabled =
            rootEnabled && (ownSection === undefined ? true : sectionEnabled(ownSection as never));
        if (!enabled) continue;
        const override =
            ownSection !== undefined && typeof ownSection === 'object'
                ? (sectionConfig(ownSection as never) ?? {})
                : {};
        const merged = deepMerge(rootOptions, override as Record<string, unknown>);
        const fileNames = tsconfigFileNames({
            ...options.config,
            tsconfig: merged as ToolchainConfig['tsconfig'],
        });
        const prefix = project.dir === '.' ? '' : `${project.dir}/`;
        addIfExists(`${prefix}${fileNames.defaultFile}`);
        addIfExists(`${prefix}${fileNames.baseFile}`);
        if (project.dir === '.') addIfExists(fileNames.rootFile);
    }

    // Directories with a default tsconfig but no package/config are not in the
    // graph (test fixtures, package-less workspaces); include their file too.
    for (const file of globSync(`**/${names.defaultFile}`, { cwd, nodir: true, ignore })) {
        add(file);
    }
    // Keep task-level inputs for tasks other than tsconfig (and forward-compat).
    for (const task of options.tasks ?? []) {
        if (task.enabled && !task.enabled(options.config)) continue;
        const patterns =
            typeof task.watch === 'function' ? task.watch(options.config) : (task.watch ?? []);
        for (const pattern of patterns) {
            if (!pattern.includes('**')) {
                addIfExists(pattern);
                continue;
            }
            const suffix = pattern.replace(/^\*\*\//, '');
            for (const project of graph.projects) {
                const prefix = project.dir === '.' ? '' : `${project.dir}/`;
                addIfExists(`${prefix}${suffix}`);
            }
        }
    }

    return {
        globs: [...globs].sort(),
        configs: [...configs].sort(),
        tsconfig: names,
    };
}
/**
 * Run one sync, then watch the config file + every task's `watch` globs and
 * re-run on change. Writing generated files must not re-trigger a run, so a
 * short quiet window follows each sync.
 */
export async function runWatch(options: RunWatchOptions): Promise<void> {
    const { cwd } = options;
    const tasks =
        options.only && options.only.length > 0
            ? selectSyncTasks(options.tasks, options.only)
            : options.tasks;
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
            const loaded = await loadToolchainConfig(cwd, { config: file, fresh: true });
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
        } catch (error) {
            logger.error(`sync failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            running = false;
            // Ignore the fs events caused by our own writes.
            ignoreUntil = Date.now() + Math.max(debounceMs() * 3, 300);
            if (replan) {
                replan = false;
                await rebuildWatchers();
            }
            if (queued) {
                queued = false;
                schedule();
            }
        }
    };

    const schedule = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            void sync();
        }, debounceMs());
    };

    const onChange = (changedAbs?: string) => {
        let isConfig = false;
        if (changedAbs) {
            const rel = path.relative(cwd, changedAbs).replace(/\\/g, '/');
            if (isIgnoredPath(rel, ignore)) return;
            isConfig = path.basename(changedAbs).startsWith('dbx.config.');
            if (isConfig) configDirty = true;
        }
        // A config edit inside the post-sync quiet window must still re-sync;
        // only generated-file events are suppressed.
        if (Date.now() < ignoreUntil && !isConfig) return;
        void current.config?.hooks?.onChange?.(changedAbs ? { path: changedAbs } : {});
        schedule();
    };

    /** Track a watcher and never let its async `error` crash the process. */
    const addWatcher = (watcher: fs.FSWatcher): void => {
        watcher.on('error', error => {
            logger.error(`watch error: ${error instanceof Error ? error.message : String(error)}`);
        });
        watchers.push(watcher);
    };

    /** Recompute the exact input files/watchers from the current config. */
    async function rebuildWatchers(): Promise<void> {
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
        const projectType = current.projectType ?? resolveProjectType(cwd, current.config);
        const inputs = await resolveWatchInputFiles({
            cwd,
            config: current.config,
            projectType,
            tasks,
            ...((watch?.exclude ?? options.exclude)
                ? { exclude: watch?.exclude ?? options.exclude }
                : {}),
            ...((watch?.gitignore ?? options.gitignore)
                ? { gitignore: watch?.gitignore ?? options.gitignore }
                : {}),
        });

        if (configFile) {
            try {
                addWatcher(
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
        for (const file of inputs.globs) {
            const absolute = path.resolve(cwd, file);
            try {
                addWatcher(fs.watch(absolute, () => onChange(absolute)));
            } catch {
                // a missing/unwatchable file is re-planned after the next sync
            }
        }
    }

    await sync();
    await rebuildWatchers();
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
