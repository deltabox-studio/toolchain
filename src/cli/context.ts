import { type LoadedConfig, loadToolingConfig } from '@deltabox/toolchain-core';

/**
 * Load the consumer config once per cwd. All commands invoked in the same
 * process for the same root share the loaded config + tokens.
 */
const configCache = new Map<string, Promise<LoadedConfig>>();

export function loadContext(cwd: string): Promise<LoadedConfig> {
    let cached = configCache.get(cwd);
    if (!cached) {
        cached = loadToolingConfig(cwd);
        configCache.set(cwd, cached);
    }
    return cached;
}
