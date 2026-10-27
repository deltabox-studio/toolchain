/** How the CLI selected the config for this run (`--config` / `--no-config`). */
export interface ConfigSelection {
    /** An explicit config file (CLI-only). */
    config?: string;
    /** Do not load any discovered config; use CLI flags/env only. */
    noConfig?: boolean;
}

let selection: ConfigSelection = {};

/** Set the config selection for the process (parsed once in `runCli`). */
export function setConfigSelection(value: ConfigSelection): void {
    selection = { ...value };
}

/** The current config selection. */
export function getConfigSelection(): ConfigSelection {
    return selection;
}

/**
 * Pull `--no-config` / `--config <file>` out of `argv` so they work before or
 * after a subcommand. Everything after `--` is left untouched.
 */
export function extractConfigSelection(argv: string[]): {
    argv: string[];
    selection: ConfigSelection;
} {
    const found: ConfigSelection = {};
    const rest: string[] = [];
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index] as string;
        if (arg === '--') {
            rest.push(...argv.slice(index));
            break;
        }
        if (arg === '--no-config') {
            found.noConfig = true;
        } else if (arg === '--config') {
            const value = argv[++index];
            if (value !== undefined) found.config = value;
        } else if (arg.startsWith('--config=')) {
            found.config = arg.slice('--config='.length);
        } else {
            rest.push(arg);
        }
    }
    return { argv: rest, selection: found };
}
