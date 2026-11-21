import {
    sectionConfig,
    type ToolchainCommandContext,
    type ToolchainWatchConfig,
} from '@deltabox/toolchain/shared';

import { defaultSyncTasks } from '../../sync.js';

/** Shared `--cwd` / `--quiet` options for the root sync commands. */
export const baseOptions = [
    { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
    { flags: '-q, --quiet', description: 'Only log errors.' },
    {
        flags: '--configless',
        description: 'Manage projects without their own dbx.config.* (inherit the nearest config).',
    },
] as const;

/**
 * Build the run options for `runSync`/`runWatch` from the command context. A
 * validated `watch` section (from schema-derived flags) overrides the loaded
 * config's section.
 */
export function watchOptions(
    context: ToolchainCommandContext,
    watchOverride?: ToolchainWatchConfig | boolean
) {
    const watch = sectionConfig(watchOverride ?? context.config.watch);
    return {
        tasks: defaultSyncTasks(),
        cwd: context.cwd,
        projectType: context.projectType,
        config: context.config,
        ...(context.ownConfig ? { ownConfig: context.ownConfig } : {}),
        tokens: context.tokens,
        ...(context.plugin ? { plugin: true } : {}),
        ...(context.configPath ? { configPath: context.configPath } : {}),
        ...(watch?.debounce !== undefined ? { debounce: watch.debounce } : {}),
        ...(watch?.exclude !== undefined ? { exclude: watch.exclude } : {}),
        ...(watch?.gitignore !== undefined ? { gitignore: watch.gitignore } : {}),
    };
}
