/**
 * The auto-sync watch plan.
 *
 * The inputs a project syncs from depend on its `dbx.config.*` (eg. a custom
 * `tsconfig.defaultFile` / `tsconfig.rootFile`), so the extension asks the CLI
 * (`dbx watch --list --json`) instead of hard-coding the default file names.
 * An explicit `deltabox.toolchain.watch` setting always wins.
 *
 * Kept free of the `vscode` API so it can be unit tested.
 */

/** The tsconfig file names a project's config resolves to. */
export interface TsconfigFileNames {
    baseFile: string;
    rootFile: string;
    defaultFile: string;
    buildFile: string;
}

/** What `dbx watch --list --json` reports for a project root. */
export interface WatchInputs {
    /** Repo-relative input globs (the config file + every active task's inputs). */
    globs: string[];
    /** The resolved tsconfig file names. */
    tsconfig: TsconfigFileNames;
}

/** The tsconfig file names used when a config does not set any. */
export const DEFAULT_TSCONFIG_FILES: TsconfigFileNames = {
    baseFile: 'tsconfig.base.json',
    rootFile: 'tsconfig.workspaces.json',
    defaultFile: 'tsconfig.default.json',
    buildFile: 'tsconfig.build.json',
};

/**
 * The non-recursive fallback watch globs (root only) used when the CLI cannot
 * be asked. The normal path resolves every project's concrete config/tsconfig
 * files via `dbx watch --list --json`.
 */
export const DEFAULT_WATCH_GLOBS = [
    'dbx.config.*',
    DEFAULT_TSCONFIG_FILES.rootFile,
    DEFAULT_TSCONFIG_FILES.defaultFile,
] as const;

/** The fallback inputs when the CLI cannot be asked (mirrors the defaults). */
export function defaultWatchInputs(): WatchInputs {
    return {
        globs: [...DEFAULT_WATCH_GLOBS],
        tsconfig: { ...DEFAULT_TSCONFIG_FILES },
    };
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Parse `dbx watch --list --json` output, or `undefined` when it is not a valid
 * report (eg. an older CLI without `--list`). Missing tsconfig names default.
 */
export function parseWatchInputs(stdout: string): WatchInputs | undefined {
    let parsed: unknown;
    try {
        parsed = JSON.parse(stdout);
    } catch {
        return undefined;
    }
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const { globs, tsconfig } = parsed as { globs?: unknown; tsconfig?: unknown };
    if (!isStringArray(globs)) return undefined;
    const names = { ...DEFAULT_TSCONFIG_FILES };
    if (typeof tsconfig === 'object' && tsconfig !== null) {
        for (const key of Object.keys(names) as (keyof TsconfigFileNames)[]) {
            const value = (tsconfig as Record<string, unknown>)[key];
            if (typeof value === 'string' && value) names[key] = value;
        }
    }
    return { globs, tsconfig: names };
}

/** One file-system watcher to create. */
export interface WatchTarget {
    /** The glob pattern. */
    glob: string;
    /**
     * The folder the glob is relative to; absent for a user-configured glob,
     * which VS Code matches across every workspace folder.
     */
    base?: string;
}

/**
 * The watchers to create: the user's `deltabox.toolchain.watch` globs when they
 * set any, otherwise the CLI-resolved concrete input files. The globs are kept
 * workspace-relative (no `base`) so VS Code reuses its workspace watcher instead
 * of installing an extra recursive watcher per root. Duplicates are dropped.
 */
export function planWatchTargets(
    userGlobs: string[] | undefined,
    roots: { root: string; inputs: WatchInputs }[]
): WatchTarget[] {
    const globs = userGlobs ?? roots.flatMap(({ inputs }) => inputs.globs);
    return [...new Set(globs)].map(glob => ({ glob }));
}
