/**
 * CLI options generator. Produces CLI flag definitions for a scope's env vars
 * (default scope `cli`) and a `node:util` `parseArgs` wrapper, so the same
 * options drive the CLI, its tests and any generated `cli-options.json`.
 */

import fs from 'node:fs';
import { type ParseArgsOptionsConfig, parseArgs } from 'node:util';

import { formatCliFlag } from '@deltabox/toolchain-shared';

import { type CollectEnvVarsOptions, collectEnvVars, DEFAULT_ENV_PREFIX } from '../collect.js';
import type { ConfigScopes } from '../types.js';

/** Flag-shaping options shared by every CLI helper. */
export interface CliFlagOptions {
    /** The env-var prefix (default `APP_`). */
    envPrefix?: string;
    /** Shorthand flags keyed by env var name (eg. `{ APP_TOKEN: 't' }`). */
    shortFlags?: Record<string, string>;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectEnvVarsOptions['envPathOf'];
}

/** A generated CLI option definition for one env var. */
export interface CliOptionDef {
    /** CLI flag, e.g. `--base-url`. */
    flag: string;
    /** Shorthand flag, e.g. `-u`. */
    short?: string;
    /** The env var the flag reads, e.g. `APP_CLI_BASE_URL`. */
    env: string;
    /** The resolved value type (`string`, `number`, `boolean`, ...). */
    type: string;
    /** Human-readable description. */
    description?: string;
    /** Never echo a real value for this option (secrets). */
    secret?: boolean;
    /** The resolved default value, when one is configured. */
    default?: string;
}

/** The long flag name (without dashes) for an env var. */
export function flagOf(env: string, options: CliFlagOptions = {}): string {
    return formatCliFlag(env, options.envPrefix ?? DEFAULT_ENV_PREFIX);
}

/** The long flag (e.g. `--base-url`) for an env var. */
export function cliFlagOf(env: string, options: CliFlagOptions = {}): string {
    return `--${flagOf(env, options)}`;
}

/** The shorthand flag (e.g. `-u`) for an env var, when configured. */
export function cliShortOf(env: string, options: CliFlagOptions = {}): string | undefined {
    const short = options.shortFlags?.[env];
    return short ? `-${short}` : undefined;
}

/** A flag label such as `-u, --base-url`. */
export function cliFlagLabel(env: string, options: CliFlagOptions = {}): string {
    const flag = cliFlagOf(env, options);
    const short = cliShortOf(env, options);
    return short ? `${short}, ${flag}` : flag;
}

export interface GenerateCliOptionsOptions extends CliFlagOptions {
    /** The scope whose env vars become flags (default `cli`). */
    scope?: string;
    /** Output file path to write the options as JSON. */
    output?: string;
}

/** Generate the CLI option definitions for a scope's env vars. */
export function generateCliOptions(
    scopes: ConfigScopes,
    options: GenerateCliOptionsOptions = {}
): CliOptionDef[] {
    const scope = options.scope ?? 'cli';
    const defs: CliOptionDef[] = [];
    for (const def of collectEnvVars(scopes, options.envPrefix, {
        envPathOf: options.envPathOf,
    }).filter(v => v.scope === scope)) {
        const short = cliShortOf(def.name, options);
        defs.push({
            flag: cliFlagOf(def.name, options),
            env: def.name,
            type: def.envType ?? 'string',
            ...(short ? { short } : {}),
            ...(def.description ? { description: def.description } : {}),
            ...(def.secret ? { secret: true } : {}),
            // Never bake a secret default into a tracked file.
            ...(def.default !== undefined && !def.secret ? { default: String(def.default) } : {}),
        });
    }

    if (options.output) {
        fs.writeFileSync(options.output, `${JSON.stringify(defs, null, 4)}\n`, 'utf-8');
    }

    return defs;
}

/** The typed `values` of a parsed CLI args result. */
export type CliArgsValues = Record<string, string | undefined>;

/** A parsed CLI args result (node `parseArgs` output). */
export interface CliArgsResult {
    values: CliArgsValues;
    positionals: string[];
}

/** A generated `node:util` `parseArgs` option entry. */
export interface CliArgsOptionConfig {
    type: 'string';
    short?: string;
    default?: string;
}

/** Build the `options` config for `node:util`'s `parseArgs`. */
export function generateCliArgsOptions(defs: CliOptionDef[]): Record<string, CliArgsOptionConfig> {
    return Object.fromEntries(
        defs.map(def => [
            def.flag.replace(/^--/, ''),
            {
                type: 'string' as const,
                ...(def.short ? { short: def.short.replace(/^-/, '') } : {}),
                ...(def.default ? { default: def.default } : {}),
            },
        ])
    );
}

/** A generated CLI args parser bound to a set of option definitions. */
export interface CliArgsParser {
    options: ParseArgsOptionsConfig;
    parse: (args?: string[]) => CliArgsResult;
    /** Map a parsed result into a `{ [flag]: value }` record of provided flags. */
    toConfig: (result?: CliArgsResult) => CliArgsValues;
}

/**
 * Create a CLI args parser from generated option definitions. The generated
 * `parse` uses `node:util`'s `parseArgs` and returns a typed result.
 */
export function createCliArgsParser(
    defs: CliOptionDef[],
    parseOptions?: { strict?: boolean }
): CliArgsParser {
    const options = generateCliArgsOptions(defs) as ParseArgsOptionsConfig;
    const parse = (args: string[] = process.argv.slice(2)) =>
        parseArgs({ args, options, strict: parseOptions?.strict ?? true }) as CliArgsResult;
    return {
        options,
        parse,
        toConfig: (result?: CliArgsResult) => {
            const values = result?.values ?? {};
            const out: CliArgsValues = {};
            for (const [key, value] of Object.entries(values)) {
                if (value !== undefined) out[key] = value;
            }
            return out;
        },
    };
}
