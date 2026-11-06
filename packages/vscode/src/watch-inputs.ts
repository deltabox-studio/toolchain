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

import path from 'node:path';

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
    /** The glob pattern, relative to {@link base} (or the workspace folders). */
    glob: string;
    /**
     * The folder the glob is relative to; absent for a user-configured glob,
     * which VS Code matches across every workspace folder.
     */
    base?: string;
    /** The workspace root that owns this input (for a per-root sync). */
    root?: string;
}

/**
 * Whether a glob stays inside the directory it is relative to. Absolute paths
 * and `..` segments would make a watcher crawl outside the workspace, so they
 * are never watched.
 */
export function isSafeRelativeGlob(glob: string): boolean {
    const normalized = glob.replace(/\\/g, '/');
    if (!normalized || normalized.startsWith('/') || normalized.startsWith('//')) return false;
    if (/^[a-zA-Z]:/.test(normalized)) return false;
    return normalized.split('/').every(segment => segment !== '..');
}

/** Characters that make a path segment a glob rather than a real directory. */
const GLOB_META = /[*?[\]{}()!+@]/;

/**
 * Scope one resolved input to its root. A concrete nested file is watched from
 * its own directory (`base: <root>/<dir>`, `glob: <file>`) so VS Code installs a
 * cheap non-recursive watcher instead of recursing the whole root (which is what
 * can hold `node_modules` handles during a package-manager link step on Windows).
 * A recursive glob (`**`) has to use the root itself.
 */
function scopedTarget(root: string, glob: string): WatchTarget {
    if (!glob.includes('**')) {
        const slash = glob.lastIndexOf('/');
        if (slash > 0) {
            const dir = glob.slice(0, slash);
            const file = glob.slice(slash + 1);
            if (file && !GLOB_META.test(dir)) {
                return { glob: file, base: path.join(root, dir), root };
            }
        }
    }
    return { glob, base: root, root };
}

/**
 * The watchers to create: the user's `deltabox.toolchain.watch` globs when they
 * set any, otherwise the CLI-resolved concrete input files.
 *
 * Each resolved input is scoped to its own root so a file with the same name in
 * another workspace folder can never trigger this root's auto-sync. User globs
 * stay unscoped (VS Code matches them across every workspace folder), but
 * absolute/ancestor globs are dropped. Duplicates are dropped.
 */
export function planWatchTargets(
    userGlobs: string[] | undefined,
    roots: { root: string; inputs: WatchInputs }[]
): WatchTarget[] {
    if (userGlobs) {
        return [...new Set(userGlobs)].filter(isSafeRelativeGlob).map(glob => ({ glob }));
    }
    const seen = new Set<string>();
    const targets: WatchTarget[] = [];
    for (const { root, inputs } of roots) {
        for (const glob of inputs.globs) {
            if (!isSafeRelativeGlob(glob)) continue;
            const target = scopedTarget(root, glob);
            const key = `${target.root}\0${target.base}\0${target.glob}`;
            if (seen.has(key)) continue;
            seen.add(key);
            targets.push(target);
        }
    }
    return targets;
}
