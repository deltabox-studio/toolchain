import os from 'node:os';

/** Options for {@link sanitizePathForDisplay}; useful for deterministic tests. */
export interface SanitizePathOptions {
    /** The home directory. @default os.homedir() */
    home?: string;
    /** The environment to read system directories from. @default process.env */
    env?: NodeJS.ProcessEnv;
    /** The platform whose path rules to use. @default process.platform */
    platform?: NodeJS.Platform;
}

interface PathAlias {
    dir: string;
    label: string;
}

function toPosix(value: string): string {
    return value.replace(/\\/g, '/');
}

function aliasesOf(options: SanitizePathOptions): PathAlias[] {
    const platform = options.platform ?? process.platform;
    const env = options.env ?? process.env;
    const home = options.home ?? os.homedir();
    const aliases: PathAlias[] = [];
    const add = (dir: string | undefined, label: string): void => {
        if (!dir) return;
        const normalized = toPosix(dir).replace(/\/+$/, '');
        if (normalized) aliases.push({ dir: normalized, label });
    };

    if (platform === 'win32') {
        add(env.APPDATA, '~appdata');
        add(env.LOCALAPPDATA, '~localappdata');
        add(env.PROGRAMDATA, '~programdata');
        add(env.PROGRAMFILES, '~programfiles');
        add(env['PROGRAMFILES(X86)'], '~programfilesx86');
        add(env.COMMONPROGRAMFILES, '~commonprogramfiles');
        add(env.ONEDRIVE, '~onedrive');
    } else {
        add(env.XDG_CONFIG_HOME, '~config');
        add(env.XDG_DATA_HOME, '~data');
        add(env.XDG_CACHE_HOME, '~cache');
        add(env.XDG_STATE_HOME, '~state');
    }
    add(env.TEMP, '~temp');
    add(env.TMP, '~temp');
    add(env.TMPDIR, '~temp');
    add(home, '~');

    // Most specific paths first: APPDATA is under home on Windows, so it must
    // win over `~`.
    return aliases.sort((left, right) => right.dir.length - left.dir.length);
}

/**
 * Replace known system directories in a path with stable aliases so display
 * surfaces (tree views, quick picks, notifications) never leak an absolute home
 * or AppData path.
 *
 * Examples: `C:\Users\me\AppData\Roaming\dbx` -> `~appdata/dbx`,
 * `/home/me/projects/app` -> `~/projects/app`.
 */
export function sanitizePathForDisplay(input: string, options: SanitizePathOptions = {}): string {
    if (!input) return input;
    // Remote registries and URLs are already shareable.
    if (/^(?:https?|git|ssh):/i.test(input)) return input;

    const platform = options.platform ?? process.platform;
    const normalized = toPosix(input);
    const comparable = platform === 'win32' ? normalized.toLowerCase() : normalized;

    for (const alias of aliasesOf(options)) {
        const dir = platform === 'win32' ? alias.dir.toLowerCase() : alias.dir;
        if (comparable === dir) return alias.label;
        if (comparable.startsWith(`${dir}/`)) {
            return `${alias.label}${normalized.slice(alias.dir.length)}`;
        }
    }
    return input;
}
