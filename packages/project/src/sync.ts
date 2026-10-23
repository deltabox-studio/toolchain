import fs from 'node:fs';
import path from 'node:path';

import {
    type ManagedFile,
    type PackageJson,
    projectToPackageJson,
    readJsonAt,
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

            const updates = projectToPackageJson(project, directory ? { directory } : {}) as Record<
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
