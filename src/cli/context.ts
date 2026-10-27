import { type LoadedConfig, loadToolchainConfig } from '@deltabox/toolchain-core';

import { getConfigSelection } from './config-selection.js';

/**
 * Load the consumer config once per cwd/selection. All commands invoked in the
 * same process for the same root share the loaded config + tokens.
 */
const configCache = new Map<string, Promise<LoadedConfig>>();

export function loadContext(cwd: string): Promise<LoadedConfig> {
    const selection = getConfigSelection();
    const key = `${cwd}\0${selection.config ?? ''}\0${selection.noConfig ? '1' : '0'}`;
    let cached = configCache.get(key);
    if (!cached) {
        // Tolerant: a broken config must not take down unrelated commands (eg.
        // `template:list`/`providers`, and the VS Code views that call them). The
        // error is surfaced as a warning by the CLI registrar.
        cached = loadToolchainConfig(cwd, { tolerant: true, ...selection });
        configCache.set(key, cached);
    }
    return cached;
}
