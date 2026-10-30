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

/** The fallback inputs when the CLI cannot be asked (mirrors the defaults). */
export function defaultWatchInputs(): WatchInputs {
    return {
        globs: [
            '**/dbx.config.*',
            DEFAULT_TSCONFIG_FILES.rootFile,
            `**/${DEFAULT_TSCONFIG_FILES.defaultFile}`,
        ],
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
 * set any, otherwise each root's resolved inputs relative to that root.
 * Duplicates are dropped.
 */
export function planWatchTargets(
    userGlobs: string[] | undefined,
    roots: { root: string; inputs: WatchInputs }[]
): WatchTarget[] {
    if (userGlobs) return [...new Set(userGlobs)].map(glob => ({ glob }));
    const seen = new Set<string>();
    const targets: WatchTarget[] = [];
    for (const { root, inputs } of roots) {
        for (const glob of inputs.globs) {
            const key = `${root}\0${glob}`;
            if (seen.has(key)) continue;
            seen.add(key);
            targets.push({ glob, base: root });
        }
    }
    return targets;
}
