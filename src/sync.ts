import { biomeSyncTask, biomeVscodeSettings } from '@deltabox/toolchain-biome';
import {
    changelogSyncTask,
    conventionalCommitsVscodeExtensions,
    conventionalCommitsVscodeSettings,
} from '@deltabox/toolchain-changelog';
import { vscodeSyncTask } from '@deltabox/toolchain-core';
import { projectSyncTask } from '@deltabox/toolchain-project';
import { type SyncTask, sectionConfig, sectionEnabled } from '@deltabox/toolchain-shared';
import { tsconfigSyncTask } from '@deltabox/toolchain-tsconfig';
import { viteSyncTask } from '@deltabox/toolchain-vite';

/**
 * The default sync tasks run by `dbx sync` / `dbx watch`:
 * changelog workflows + commitlint, `biome.json`, the workspace tsconfigs, and
 * the VS Code settings/extensions. Consumers can call a subset directly.
 */
export function defaultSyncTasks(): SyncTask[] {
    return [
        projectSyncTask(),
        changelogSyncTask(),
        biomeSyncTask(),
        tsconfigSyncTask(),
        viteSyncTask(),
        vscodeSyncTask({
            settings: config => [
                ...(sectionEnabled(config.biome) ? [biomeVscodeSettings] : []),
                conventionalCommitsVscodeSettings as Record<string, unknown>,
            ],
            extensions: [...conventionalCommitsVscodeExtensions.recommendations],
            enabled: config =>
                (sectionEnabled(config.changelog) &&
                    sectionConfig(config.changelog)?.vscode !== false) ||
                (sectionEnabled(config.biome) && sectionConfig(config.biome)?.vscode !== false),
        }),
    ];
}
