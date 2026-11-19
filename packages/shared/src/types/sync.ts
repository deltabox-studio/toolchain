import type { ProjectType } from '../config-types.js';
import type { Replacements } from '../template.js';
import type { Awaitable } from './common.js';
import type { ToolchainConfig } from './toolchain.js';

/** A summary of a sync run, handed to {@link ToolchainHooks.afterSync}. */
export interface SyncSummary {
    written: string[];
    changed: string[];
    removed: string[];
    upToDate: boolean;
}

/** A file written by a sync task (its parent directory is created as needed). */
export interface ManagedFile {
    /** Path relative to the project root. */
    path: string;
    /** The file content. */
    content: string;
    /**
     * A comment inserted at the top marking the file as managed (skipped for
     * JSON files, which are tracked via the manifest instead).
     */
    header?: string;
    /**
     * Record the file in the manifest (default true). An untracked file is
     * written and drift-checked like any other, but stays user-owned: it is
     * never pruned by a later sync or removed by `dbx reset` (eg. a user
     * tsconfig a `tsconfig.overrides` entry patches).
     */
    track?: boolean;
    /**
     * Whether the post-write formatter may format this file (default true).
     * Set `false` for files the task already writes in their final form (eg.
     * generated tsconfigs, which may use a custom indent), so `sync --check`
     * compares the generator output directly.
     */
    format?: boolean;
}

/** The context handed to every {@link SyncTask}. */
export interface SyncContext {
    /** The project root. */
    cwd: string;
    /** The detected/configured project kind. */
    projectType: ProjectType;
    /** The loaded config. */
    config: ToolchainConfig;
    /** The project's own (unmerged) config, when loaded. */
    ownConfig?: ToolchainConfig;
    /** The resolved replacement tokens. */
    tokens: Replacements;
    /** Log a line (respects `--quiet`). */
    log: (message: string) => void;
    /** Emit a warning (respects `--quiet` and `logger.suppress`). */
    warn: (message: string, id?: string) => void;
    /** Dry run: report drift without writing files (including snapshots). */
    check?: boolean;
    /** Repo-relative files the previous sync managed (from the manifest). */
    managedFiles?: string[];
    /** Extra manifest metadata tasks can persist between syncs. */
    manifest?: Record<string, unknown>;
    /** Whether the config came from a `dbx()` Vite/Vite+ plugin. */
    plugin?: boolean;
}

/** A unit of sync work exposed by a package. */
export interface SyncTask {
    /** Stable id, used in logs + the manifest. */
    name: string;
    /**
     * Repo-relative globs to watch; a change re-runs this task. The config file
     * itself is always watched, and re-runs every task. A function derives the
     * globs from the config (eg. custom tsconfig file names).
     */
    watch?: string[] | ((config: ToolchainConfig) => string[]);
    /**
     * File names/suffixes the task does **not** own but that may appear in an
     * older manifest. They are never deleted (even though they are no longer
     * generated) and are dropped from the manifest, so a consumer can edit them
     * freely — eg. `tsconfig.build.json`. A function derives them from the config.
     */
    keep?: string[] | ((config: ToolchainConfig) => string[]);
    /** Whether the task runs for the given config (default: always). */
    enabled?: (config: ToolchainConfig) => boolean;
    /**
     * Whether the task should regenerate its managed files (default: true).
     * When it returns false the task is skipped entirely, so `runSync` neither
     * writes nor drift-checks its files, and pruning is disabled to avoid
     * deleting files the task still owns.
     */
    regenerate?: (config: ToolchainConfig) => boolean;
    /**
     * The project kinds the task applies to (default: all). A task is skipped
     * when the resolved project type is not in this list.
     */
    projectTypes?: ProjectType[];
    /**
     * Run the task. Returns the managed files to write, and/or performs side
     * effects directly (eg. the tsconfig task regenerates files itself).
     */
    run: (ctx: SyncContext) => Awaitable<ManagedFile[] | void>;
}
