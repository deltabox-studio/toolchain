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
 * `tsconfig.default.json` files, applying the monorepo aliases + references.
 * `tsconfig.build.json` is treated as a user-owned input (like
 * `tsconfig.default.json`) and is never rewritten. Watches
 * `tsconfig.monorepo.json` and any `tsconfig.default.json` so a change re-runs
 * it in watch mode.
 */
export function tsconfigSyncTask(): SyncTask {
    return {
        name: 'tsconfig',
        // Only a monorepo root has a `tsconfig.monorepo.json` to expand.
        projectTypes: ['monorepo-root'],
        enabled: config => sectionEnabled(config.tsconfig),
        watch: ['tsconfig.monorepo.json', '**/tsconfig.default.json'],
        // Users own their build configs; never delete them on a sync.
        keep: ['tsconfig.build.json'],
        run: ctx => {
            const t = sectionConfig(ctx.config.tsconfig) ?? {};
            const rootFile = t.rootFile ?? 'tsconfig.monorepo.json';
            if (!fs.existsSync(path.resolve(ctx.cwd, rootFile))) {
                ctx.log(`tsconfig: no ${rootFile} at the root; skipping.`);
                return [];
            }
            const indent = t.indent ?? 4;
            const results = generateTsconfigs({
                cwd: ctx.cwd,
                aliases: t.aliases ?? true,
                composite: t.composite ?? false,
                refs: t.refs ?? false,
                indent,
                glob: t.glob ?? '**/tsconfig.default.json',
                appGlob: t.appGlob ?? 'apps/**/tsconfig.default.json',
                monorepoTsconfigFilename: rootFile,
                log: false,
                write: false,
            });

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
