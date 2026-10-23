import fs from 'node:fs';
import path from 'node:path';

import {
    type ManagedFile,
    type SyncTask,
    sectionConfig,
    sectionEnabled,
} from '@deltabox/toolchain-shared';

import { generateTsconfigs } from './cli/generate/index.js';

function rel(cwd: string, file: string): string {
    return path.relative(cwd, file).replace(/\\/g, '/');
}

/**
 * The tsconfig sync task: regenerates every workspace `tsconfig.json` from the
 * workspace default tsconfig files, applying the monorepo aliases + references.
 * `tsconfig.build.json` is treated as a user-owned input (like the default
 * tsconfig) and is never rewritten. Watches `tsconfig.workspaces.json` and any
 * default tsconfig so a change re-runs it in watch mode.
 */
export function tsconfigSyncTask(): SyncTask {
    return {
        name: 'tsconfig',
        // Only a monorepo root has a `tsconfig.workspaces.json` to expand.
        projectTypes: ['monorepo-root'],
        enabled: config => sectionEnabled(config.tsconfig),
        watch: ['tsconfig.workspaces.json', '**/tsconfig.default.json'],
        // Users own their build configs; never delete them on a sync.
        keep: ['tsconfig.build.json'],
        run: ctx => {
            const t = sectionConfig(ctx.config.tsconfig) ?? {};
            const rootFile = t.rootFile ?? 'tsconfig.workspaces.json';
            const defaultFile = t.defaultFile ?? 'tsconfig.default.json';
            const buildFile = t.buildFile ?? 'tsconfig.build.json';
            const workspacesFile = path.resolve(ctx.cwd, rootFile);
            const hasWorkspacesFile = fs.existsSync(workspacesFile);
            const indent = t.indent ?? 4;
            const glob = t.glob ?? `**/${defaultFile}`;
            const results = generateTsconfigs({
                cwd: ctx.cwd,
                aliases: t.aliases ?? true,
                composite: t.composite ?? false,
                refs: t.refs ?? false,
                indent,
                glob,
                ...(t.exclude !== undefined ? { exclude: t.exclude } : {}),
                ...(t.gitignore !== undefined ? { gitignore: t.gitignore } : {}),
                defaultFile,
                buildFile,
                monorepoTsconfigFilename: rootFile,
                log: false,
                write: false,
            });

            if (results.length === 0) {
                // Nothing to wire: warn only when the config implies workspaces
                // are expected (references/composite enabled, or a workspaces
                // tsconfig exists), otherwise stay quiet.
                if (t.refs || t.composite || hasWorkspacesFile) {
                    const searched = Array.isArray(glob) ? glob.join(', ') : glob;
                    const expects = [
                        t.refs ? 'project references' : '',
                        t.composite ? 'composite' : '',
                        hasWorkspacesFile ? `${rootFile}` : '',
                    ].filter(Boolean);
                    ctx.warn(
                        `no workspace tsconfig files found (looked for ${searched}), but ` +
                            `${expects.join(' + ')} have nothing to wire.`
                    );
                } else {
                    ctx.log(`tsconfig: no workspace tsconfig files found; skipping.`);
                }
                return [];
            }

            const files: ManagedFile[] = [];
            for (const result of results) {
                files.push({
                    path: rel(ctx.cwd, result.targetTsconfigPath),
                    content: `${JSON.stringify(result.newTsconfig, null, indent)}\n`,
                });
            }
            ctx.log(`tsconfig: regenerated ${results.length} workspace tsconfig(s).`);
            return files;
        },
    };
}
