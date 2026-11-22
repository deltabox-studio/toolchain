/**
 * `dbx sync` support for the `toolchain.mcp.skills` section.
 *
 * The task is opt-in by presence: it runs only when `mcp.skills` is defined and
 * enabled. Missing skills are added; existing files are never overwritten
 * unless the config sets `force: true`.
 */

import type { SyncTask } from '@deltabox/toolchain/shared';

import { checkSkill, installSkill, resolveMcpSkillsConfig } from './skills.js';

/** A sync task that installs the official dbx skill into the configured agents. */
export function skillsSyncTask(): SyncTask {
    return {
        name: 'skills',
        enabled: config => resolveMcpSkillsConfig(config) !== undefined,
        run: ctx => {
            const settings = resolveMcpSkillsConfig(ctx.config);
            if (!settings) return;
            for (const agent of settings.agents) {
                const target = {
                    agent,
                    scope: settings.scope,
                    cwd: ctx.cwd,
                    ...(settings.dir ? { dir: settings.dir } : {}),
                };
                const status = checkSkill(target);
                if (ctx.check) {
                    if (!status.exists) {
                        ctx.warn(`skill missing for ${agent}: ${status.path}`, 'skills.missing');
                    }
                    continue;
                }
                if (status.exists && !settings.force) continue;
                const result = installSkill({ ...target, force: settings.force });
                if (result.installed) {
                    ctx.log(`Installed the dbx skill for ${agent}: ${result.path}`);
                }
            }
        },
    };
}
