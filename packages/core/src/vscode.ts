import {
    deepMerge,
    type ManagedFile,
    mergeJsonAt,
    type ProjectType,
    type SyncTask,
    type ToolchainConfig,
} from '@deltabox/toolchain-shared';

export interface VscodeSyncOptions {
    /**
     * Settings patches, deep-merged in order (then merged into the consumer's).
     * A function lets the patches depend on the config (eg. only inject Biome
     * settings when the `biome` section is enabled).
     */
    settings?: Record<string, unknown>[] | ((config: ToolchainConfig) => Record<string, unknown>[]);
    /** Recommended extensions (unioned with the consumer's existing list). */
    extensions?: string[];
    /** Whether the task runs (default: always). */
    enabled?: (config: ToolchainConfig) => boolean;
    /** The project kinds the task applies to (default root + single project). */
    projectTypes?: ProjectType[];
}

/**
 * The VS Code sync task: merges the given settings/extensions into the
 * consumer's `.vscode/settings.json` / `.vscode/extensions.json`, preserving
 * whatever they already have.
 */
export function vscodeSyncTask(options: VscodeSyncOptions = {}): SyncTask {
    return {
        name: 'vscode',
        projectTypes: options.projectTypes ?? ['monorepo-root', 'project'],
        ...(options.enabled ? { enabled: options.enabled } : {}),
        run: ctx => {
            const files: ManagedFile[] = [];
            const settings =
                typeof options.settings === 'function'
                    ? options.settings(ctx.config)
                    : (options.settings ?? []);
            const patch = settings.reduce<Record<string, unknown>>(
                (acc, settings) => deepMerge(acc, settings),
                {}
            );
            if (Object.keys(patch).length > 0) {
                files.push({
                    path: '.vscode/settings.json',
                    content: mergeJsonAt(ctx.cwd, '.vscode/settings.json', patch),
                });
            }
            if (options.extensions?.length) {
                files.push({
                    path: '.vscode/extensions.json',
                    content: mergeJsonAt(ctx.cwd, '.vscode/extensions.json', {
                        recommendations: options.extensions,
                    }),
                });
            }
            return files;
        },
    };
}
