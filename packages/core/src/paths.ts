import path from 'node:path';

/** Whether `target` is the same as, or inside, `root`. */
export function isInsideRoot(root: string, target: string): boolean {
    const relative = path.relative(path.resolve(root), path.resolve(target));
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

/**
 * Resolve a managed (repo-relative) path and reject anything that escapes the
 * project root. Managed files must be relative: an absolute path or `..` is a
 * task/manifest bug, not a supported layout.
 */
export function resolveManagedPath(cwd: string, relative: string): string {
    if (!relative.trim() || relative.trim() === '.') {
        throw new Error('managed path must name a file, not the project root.');
    }
    const absolute = path.isAbsolute(relative) || /^[a-zA-Z]:/.test(relative);
    const target = absolute ? path.resolve(relative) : path.resolve(cwd, relative);
    if (!isInsideRoot(cwd, target)) {
        throw new Error(`managed path "${relative}" resolves outside the project root.`);
    }
    return target;
}
