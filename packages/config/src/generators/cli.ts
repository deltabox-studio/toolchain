/**
 * CLI options generator. Produces CLI flag definitions for a scope's env vars
 * (default scope `cli`) and a `node:util` `parseArgs` wrapper, so the same
 * options drive the CLI, its tests and any generated `cli-options.json`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { type ParseArgsOptionsConfig, parseArgs } from 'node:util';

import {
    formatCliFlag,
    type ToolchainCommand,
    type ToolchainOption,
} from '@deltabox/toolchain/shared';

import { collectDefinitions, DEFAULT_ENV_PREFIX } from '../collect.js';
import { parseConfig } from '../parser.js';
import { metaOf, normalizeConfigSchema } from '../schema.js';
import type {
    CliArgsOptionConfig,
    CliArgsParser,
    CliArgsResult,
    CliArgsValues,
    CliCommandDef,
    CliFlagOptions,
    CliOptionDef,
    ConfigCliCommandOptions,
    ConfigCliOptionsResult,
    ConfigSchema,
    GenerateCliOptionsOptions,
    GenerateConfigCliOptions,
} from '../types/index.js';
import { isEnvVariable } from './env-file.js';

/** Coerce one raw CLI value to the config definition's type. */
export function parseCliValue(value: string, type: string | undefined): unknown {
    switch (type) {
        case 'boolean': {
            const normalized = value.trim().toLowerCase();
            if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
            if (['false', '0', 'no', 'off'].includes(normalized)) return false;
            return value;
        }
        case 'number': {
            const number = Number(value);
            return Number.isFinite(number) ? number : value;
        }
        case 'array':
            return value
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
        default:
            return value;
    }
}

/** Convert generated option definitions into framework-agnostic command options. */
export function toToolchainOptions(defs: readonly CliOptionDef[]): ToolchainOption[] {
    return defs.map(def => {
        const value =
            def.type === 'boolean' ? '' : def.type === 'array' ? ' <value...>' : ' <value>';
        const flags = `${def.short ? `${def.short}, ` : ''}${def.flag}${value}`;
        return {
            flags,
            description: def.description ?? `Set \`${def.path ?? def.flag}\`.`,
            ...(def.default !== undefined ? { default: def.default } : {}),
            // Arrays use the variadic `<value...>` form; other options opt into
            // repeated occurrences explicitly.
            ...(def.multiple && def.type !== 'array' ? { multiple: true } : {}),
        };
    });
}

/** The kebab-case flag derived from a dotted config path (`auto.aliases` -> `--auto-aliases`). */
export function configFlagOf(path: string): string {
    return `--${path
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[._]+/g, '-')
        .toLowerCase()}`;
}

/** Build one option definition from a collected config definition. */
function optionOf(
    def: ReturnType<typeof collectDefinitions>[number],
    flags: GenerateConfigCliOptions
): CliOptionDef {
    const type = flags.types?.[def.path] ?? def.type ?? 'string';
    const flag = flags.flags?.[def.path] ?? def.meta?.cliFlag ?? configFlagOf(def.path);
    const short = def.meta?.cliFlagShort
        ? `-${def.meta.cliFlagShort.replace(/^-/, '')}`
        : undefined;
    return {
        flag,
        ...(short ? { short } : {}),
        ...(def.name ? { env: def.name } : {}),
        type,
        ...(def.description ? { description: def.description } : {}),
        ...(def.secret ? { secret: true } : {}),
        ...(def.default !== undefined && !def.secret ? { default: String(def.default) } : {}),
        ...(def.required ? { required: true } : {}),
        ...(type === 'array' ? { multiple: true } : {}),
        ...(def.scope ? { scope: def.scope } : {}),
        path: def.path,
        parse: value => parseCliValue(value, type),
    };
}

/**
 * Generate CLI definitions from config fields (not just env-backed `cli` scope
 * values). Each schema scope becomes a command; its fields become options.
 *
 * The flat `options`/`optionsEntries` mirrors every scoped option for callers
 * that only expose one command.
 */
export function generateConfigCliOptions(
    schema: ConfigSchema,
    options: GenerateConfigCliOptions = {}
): ConfigCliOptionsResult {
    const scopes = normalizeConfigSchema(schema);
    const byScope = new Map<string, CliOptionDef[]>();
    for (const def of collectDefinitions(schema, {
        envPrefix: options.envPrefix,
        envPathOf: options.envPathOf,
    })) {
        if (!def.path) continue;
        if (options.pathPrefix && !def.path.startsWith(options.pathPrefix)) continue;
        const scope = def.scope || 'config';
        const list = byScope.get(scope) ?? [];
        list.push(optionOf(def, options));
        byScope.set(scope, list);
    }

    const command: Record<string, CliCommandDef> = {};
    for (const [scopeName, scopeSchema] of Object.entries(scopes)) {
        const raw = scopeSchema as Record<string, unknown>;
        const meta = metaOf(scopeSchema);
        const type = typeof raw.type === 'string' ? raw.type : 'object';
        const scopeOptions = byScope.get(scopeName) ?? [];
        command[scopeName] = {
            name: scopeName,
            type,
            ...(meta?.required ? { required: true } : {}),
            ...(meta?.description ? { description: meta.description } : {}),
            ...(raw.default !== undefined ? { default: raw.default } : {}),
            path: scopeName,
            scope: scopeName,
            ...(meta ? { meta } : {}),
            ...(type !== 'object' && type !== 'array'
                ? { parse: (value: unknown) => parseCliValue(String(value), type) }
                : {}),
            options: scopeOptions,
            optionsEntries: scopeOptions.map(def => [def.flag, def]),
        };
    }

    const allOptions = Object.values(command).flatMap(entry => entry.options);
    const optionsEntries: Array<[string, CliOptionDef]> = [];
    const seen = new Set<string>();
    for (const def of allOptions) {
        let key = def.flag;
        if (seen.has(key)) key = `${def.scope ?? 'config'}:${def.flag}`;
        seen.add(key);
        optionsEntries.push([key, def]);
    }

    return {
        command,
        commandEntries: Object.entries(command),
        options: allOptions,
        optionsEntries,
    };
}

/** Build a `ToolchainCommand` from a config schema + generated options. */
export function configCliCommand<TSchema extends ConfigSchema>(
    options: ConfigCliCommandOptions<TSchema>
): ToolchainCommand {
    const generated = generateConfigCliOptions(options.schema, {
        ...(options.envPrefix ? { envPrefix: options.envPrefix } : {}),
        ...(options.pathPrefix ? { pathPrefix: options.pathPrefix } : {}),
        ...(options.flags ? { flags: options.flags } : {}),
        ...(options.types ? { types: options.types } : {}),
    });
    const commandDef = options.commandName ? generated.command[options.commandName] : undefined;
    const commandOptions = commandDef?.options ?? generated.options;
    const byKey = new Map<string, CliOptionDef>();
    for (const def of commandOptions) {
        const key = def.flag
            .replace(/^--/, '')
            .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
        byKey.set(key, def);
    }
    const parse = (values: Record<string, unknown>): unknown => {
        if (options.parse) return options.parse(values, options);
        const overrides: Record<string, unknown> = {};
        for (const [key, def] of byKey) {
            if (!(key in values) || def.path === undefined) continue;
            const value = values[key];
            const parts = def.path.split('.');
            let node = overrides;
            for (const part of parts.slice(0, -1)) {
                const next = node[part];
                if (typeof next !== 'object' || next === null) node[part] = {};
                node = node[part] as Record<string, unknown>;
            }
            const last = parts[parts.length - 1]!;
            node[last] = value;
        }
        const input = options.commandName ? { [options.commandName]: overrides } : overrides;
        return parseConfig(options.schema, input, {
            ...options.parseOptions,
            source: 'file',
        });
    };
    return {
        name: options.name,
        description: options.description,
        ...(options.args ? { args: options.args } : {}),
        options: [...toToolchainOptions(commandOptions), ...(options.options ?? [])],
        ...(options.hidden ? { hidden: true } : {}),
        ...(options.passthrough ? { passthrough: true } : {}),
        run: (values, context) => options.run(values, parse(values), context),
    };
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

/** Generate the CLI option definitions for a scope's env vars. */
export function generateCliOptions(
    schema: ConfigSchema,
    options: GenerateCliOptionsOptions = {}
): CliOptionDef[] {
    const scope = options.scope ?? 'cli';
    const defs: CliOptionDef[] = [];
    for (const def of collectDefinitions(schema, {
        envPrefix: options.envPrefix,
        envPathOf: options.envPathOf,
    }).filter(v => v.scope === scope && (v.name || v.cliFlag) && isEnvVariable(v))) {
        const short = def.meta?.cliFlagShort
            ? `-${def.meta.cliFlagShort.replace(/^-/, '')}`
            : cliShortOf(def.name ?? '', options);
        const type = def.type ?? 'string';
        defs.push({
            flag: def.cliFlag ?? cliFlagOf(def.name ?? '', options),
            env: def.name ?? '',
            type,
            ...(short ? { short } : {}),
            ...(def.description ? { description: def.description } : {}),
            ...(def.secret ? { secret: true } : {}),
            // Never bake a secret default into a tracked file.
            ...(def.default !== undefined && !def.secret ? { default: String(def.default) } : {}),
            ...(def.required ? { required: true } : {}),
            ...(type === 'array' ? { multiple: true } : {}),
            ...(def.scope ? { scope: def.scope } : {}),
            path: def.path,
            parse: value => parseCliValue(value, type),
        });
    }

    if (typeof options.output === 'string') {
        fs.mkdirSync(path.dirname(options.output), { recursive: true });
        fs.writeFileSync(options.output, `${JSON.stringify(defs, null, 4)}\n`, 'utf-8');
    }

    return defs;
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
