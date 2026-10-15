import { sectionConfig, type ToolingCommandContext } from '@deltabox/toolchain-shared';

import { defaultSyncTasks } from '../../sync.js';

/** Shared `--cwd` / `--quiet` options for the root sync commands. */
export const baseOptions = [
    { flags: '--cwd <dir>', description: 'Project root (default: cwd).' },
    { flags: '-q, --quiet', description: 'Only log errors.' },
];

/** Build the run options for `runSync`/`runWatch` from the command context. */
export function watchOptions(context: ToolingCommandContext) {
    const watch = sectionConfig(context.config.watch);
    return {
        tasks: defaultSyncTasks(),
        cwd: context.cwd,
        projectType: context.projectType,
        config: context.config,
        tokens: context.tokens,
        ...(context.configPath ? { configPath: context.configPath } : {}),
        ...(watch?.debounce !== undefined ? { debounce: watch.debounce } : {}),
    };
}
