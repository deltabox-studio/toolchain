import { type LoadedConfig, loadToolchainConfig } from '@deltabox/toolchain-core';

/**
 * Load the consumer config once per cwd. All commands invoked in the same
 * process for the same root share the loaded config + tokens.
 */
const configCache = new Map<string, Promise<LoadedConfig>>();

export function loadContext(cwd: string): Promise<LoadedConfig> {
    let cached = configCache.get(cwd);
    if (!cached) {
        // Tolerant: a broken config must not take down unrelated commands (eg.
        // `template:list`/`providers`, and the VS Code views that call them). The
        // error is surfaced as a warning by the CLI registrar.
        cached = loadToolchainConfig(cwd, { tolerant: true });
        configCache.set(cwd, cached);
    }
    return cached;
}
