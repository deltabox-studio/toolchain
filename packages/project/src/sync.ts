import fs from 'node:fs';
import path from 'node:path';

import {
    type ManagedFile,
    type PackageJson,
    projectToPackageJson,
    readJsonAt,
    splitPackageName,
    type SyncTask,
} from '@deltabox/toolchain-shared';

/** The nearest ancestor directory containing a `.git` entry (the repo root). */
function repoRoot(cwd: string): string | undefined {
    let dir = path.resolve(cwd);
    for (;;) {
        if (fs.existsSync(path.join(dir, '.git'))) return dir;
        const parent = path.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
}

/**
 * The `project` sync task: writes the fields a `dbx.config.project` **defines**
 * into the project's `package.json` (name, description, author, license,
 * homepage, repository, packageManager). It never clears a field the config does
 * not mention, and `repo` resolves to the workspace path through
 * `repository.directory`. Runs only when a `project` section is defined.
 */
export function projectSyncTask(): SyncTask {
    return {
        name: 'project',
        enabled: config => config.project !== undefined,
        run: ctx => {
            const project = ctx.config.project;
            if (!project) return [];
            const pkg = readJsonAt<PackageJson>(ctx.cwd, 'package.json');
            if (!pkg) return [];

            const root = repoRoot(ctx.cwd);
            const directory =
                root && path.resolve(root) !== path.resolve(ctx.cwd)
                    ? path.relative(root, ctx.cwd).replace(/\\/g, '/')
                    : undefined;

            // The config wins. When it names the package but omits the scope,
            // fall back to the `package.json` scope so a nested workspace keeps
            // its scoped name (mirrors the token resolution in the config loader).
            const merged: NonNullable<typeof project> = { ...project };
            if (merged.name !== undefined && merged.scope === undefined && pkg.name) {
                const { scope } = splitPackageName(pkg.name);
                if (scope) merged.scope = scope;
            }
            const updates = projectToPackageJson(merged, directory ? { directory } : {}) as Record<
                string,
                unknown
            >;
            if (Object.keys(updates).length === 0) return [];

            const next = { ...pkg, ...updates };
            const files: ManagedFile[] = [
                { path: 'package.json', content: `${JSON.stringify(next, null, 4)}\n` },
            ];
            return files;
        },
    };
}
