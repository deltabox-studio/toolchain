import { biomeSyncTask, biomeVscodeSettings } from '@deltabox/toolchain/biome';
import {
    changelogSyncTask,
    conventionalCommitsVscodeExtensions,
    conventionalCommitsVscodeSettings,
} from '@deltabox/toolchain/changelog';
import { editorConfigSyncTask, toolingConfigTask, vscodeSyncTask } from '@deltabox/toolchain/core';
import { skillsSyncTask } from '@deltabox/toolchain/mcp';
import { catalogsSyncTask, projectSyncTask } from '@deltabox/toolchain/project';
import {
    changelogSectionEnabled,
    regenerateEnabled,
    resolveChangelogConfig,
    type SyncTask,
    sectionConfig,
    sectionEnabled,
} from '@deltabox/toolchain/shared';
import { tsconfigSyncTask } from '@deltabox/toolchain/tsconfig';
import { viteSyncTask } from 'vite-plugin-dbx';

import { toolingDefaultsTask } from './tooling.js';

export { selectSyncTasks } from '@deltabox/toolchain/core';

/**
 * The default sync tasks run by `dbx sync` / `dbx watch`:
 * changelog workflows + commitlint, `biome.json`, the workspace tsconfigs, and
 * the VS Code settings/extensions. Consumers can call a subset directly.
 */
export function defaultSyncTasks(): SyncTask[] {
    return [
        toolingDefaultsTask(),
        projectSyncTask(),
        catalogsSyncTask(),
        changelogSyncTask(),
        biomeSyncTask(),
        tsconfigSyncTask(),
        viteSyncTask(),
        toolingConfigTask(),
        editorConfigSyncTask(),
        skillsSyncTask(),
        vscodeSyncTask({
            settings: config => [
                ...(sectionEnabled(config.biome) ? [biomeVscodeSettings] : []),
                conventionalCommitsVscodeSettings as Record<string, unknown>,
            ],
            extensions: [...conventionalCommitsVscodeExtensions.recommendations],
            enabled: config =>
                (changelogSectionEnabled(config) &&
                    resolveChangelogConfig(config)?.vscode !== false) ||
                (sectionEnabled(config.biome) && sectionConfig(config.biome)?.vscode !== false),
            regenerate: config =>
                (changelogSectionEnabled(config) && regenerateEnabled(config.ci)) ||
                (sectionEnabled(config.biome) && regenerateEnabled(config.biome)),
        }),
    ];
}
