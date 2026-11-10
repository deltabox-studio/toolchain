/**
 * `.github/dependabot.yml` generation.
 *
 * Dependabot keeps the project's dependencies and the pinned GitHub Actions
 * (`voidzero-dev/setup-vp`, `actions/checkout`, ...) up to date. The config is
 * opt-in like every other CI artifact and is written by the changelog sync task.
 */

import { toYaml, type ToolchainDependabotConfig, type YamlValue } from '@deltabox/toolchain/shared';

/** The default Dependabot config path. */
export const DEPENDABOT_FILE = '.github/dependabot.yml';

/** The default package ecosystems (actions + the project's npm packages). */
export const DEPENDABOT_ECOSYSTEMS = ['github-actions', 'npm'] as const;

/** Resolve the config file path (honours `dir`/`filename`). */
export function dependabotFilePath(setting: ToolchainDependabotConfig = {}): string {
    const dir = (setting.dir ?? '.github')
        .replace(/\\/g, '/')
        .replace(/^\.?\//, '')
        .replace(/\/+$/, '');
    const filename = (setting.filename ?? 'dependabot.yml').trim();
    if (
        !filename ||
        /[\\/]/.test(filename) ||
        filename === '.' ||
        filename === '..' ||
        /^[a-zA-Z]:/.test(dir) ||
        dir.split('/').includes('..')
    ) {
        throw new Error('invalid Dependabot config path (it must stay inside the project).');
    }
    return dir ? `${dir}/${filename}` : filename;
}

/** Render the Dependabot config. */
export function renderDependabot(setting: ToolchainDependabotConfig = {}): string {
    const schedule = setting.schedule ?? 'weekly';
    const directories =
        setting.directories && setting.directories.length > 0 ? setting.directories : ['/'];
    const ecosystems =
        setting.ecosystems && setting.ecosystems.length > 0
            ? [...new Set(setting.ecosystems)]
            : [...DEPENDABOT_ECOSYSTEMS];

    const updates = directories.flatMap(directory =>
        ecosystems.map(ecosystem => ({
            'package-ecosystem': ecosystem,
            directory,
            schedule: { interval: schedule },
            ...(setting.labels && setting.labels.length > 0 ? { labels: setting.labels } : {}),
            ...(setting.openPullRequestsLimit
                ? { 'open-pull-requests-limit': setting.openPullRequestsLimit }
                : {}),
            ...(setting.groups && Object.keys(setting.groups).length > 0
                ? { groups: setting.groups }
                : {}),
        }))
    );

    return toYaml({ version: 2, updates } as unknown as Record<string, YamlValue>);
}
