/**
 * High-level CLI program generator.
 *
 * A command spec declares the command structure, its runtime-only flags and a
 * handler; the config schema supplies every config-backed flag. Running a
 * generated command resolves the loaded scope config, env vars, explicit CLI
 * values and command overrides, then validates the result before calling the
 * handler.
 */

import type { CliCommand, CliCommandContext, CliOption } from '@deltabox/toolchain/shared';
import { deepMerge } from '@deltabox/toolchain/shared';

import { parseConfig } from '../parser.js';
import { isSchemaType, isZodSchema } from '../schema.js';
import type {
    CliOptionDef,
    ConfigCliDiagnostic,
    ConfigProgramCommand,
    ConfigSchema,
    GenerateConfigProgramOptions,
} from '../types/index.js';
import { cliScopeSchemas, keepsCliPath, scopeMetaOf, walkScopeCliOptions } from './cli-schema.js';
import { parseCliValue, toToolchainOptions } from './cli.js';

/** Whether a value is a scoped schema map (as opposed to a single schema). */
function isScopedSchemaMap(schema: ConfigSchema): boolean {
    return (
        schema !== null &&
        typeof schema === 'object' &&
        !Array.isArray(schema) &&
        !isZodSchema(schema) &&
        !isSchemaType(schema)
    );
}

/** The commander key for a long flag (`--no-format` -> `format`). */
function commanderKeyOf(flags: string): string | undefined {
    const long = flags
        .split(/[ ,|]+/)
        .map(token => token.trim())
        .find(token => token.startsWith('--'));
    if (!long) return undefined;
    return long
        .replace(/^--/, '')
        .replace(/^no-/, '')
        .replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}

/** Assign a dotted path into a nested object. */
function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.').filter(Boolean);
    let node = target;
    for (const part of parts.slice(0, -1)) {
        const next = node[part];
        if (typeof next !== 'object' || next === null) node[part] = {};
        node = node[part] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (last !== undefined) node[last] = value;
}

/** Build the config overrides from the explicit CLI values. */
function overridesFromValues(
    values: Record<string, unknown>,
    defs: readonly CliOptionDef[],
    runtime: readonly CliOption[]
): Record<string, unknown> {
    const overrides: Record<string, unknown> = {};
    const byKey = new Map<string, { path: string; parse: (value: unknown) => unknown }>();
    for (const def of defs) {
        if (!def.path) continue;
        const key = commanderKeyOf(def.flag);
        if (!key) continue;
        byKey.set(key, {
            path: def.path,
            parse: (value: unknown) =>
                typeof value === 'string'
                    ? (def.parse?.(value) ?? parseCliValue(value, def.type))
                    : value,
        });
    }
    for (const option of runtime) {
        if (!option.path) continue;
        const key = commanderKeyOf(option.flags);
        if (!key) continue;
        const type = option.type ?? 'string';
        byKey.set(key, {
            path: option.path,
            parse: (value: unknown) =>
                option.parse
                    ? option.parse(String(value))
                    : typeof value === 'string'
                      ? parseCliValue(value, type)
                      : value,
        });
    }
    for (const [key, entry] of byKey) {
        if (!(key in values)) continue;
        setPath(overrides, entry.path, entry.parse(values[key]));
    }
    return overrides;
}

/** The schema scope a command spec reads, if any. */
function scopeForCommand(
    scopes: ReturnType<typeof cliScopeSchemas>,
    spec: { scope?: string; name?: string }
): ReturnType<typeof cliScopeSchemas>[number] | undefined {
    if (spec.scope) return scopes.find(scope => scope.name === spec.scope);
    if (scopes.length === 1) return scopes[0];
    if (spec.name) return scopes.find(scope => scope.name === spec.name);
    return undefined;
}

/** Generate `CliCommand[]` from a config schema and command specs. */
export function generateConfigProgram<
    TSchema extends ConfigSchema,
    TContext extends CliCommandContext = CliCommandContext,
>(
    schema: TSchema,
    options: GenerateConfigProgramOptions<TSchema, TContext> & {
        envPrefix: string;
        envPathOf?: (env: string) => string;
    }
): CliCommand<readonly CliOption[], TContext>[] {
    const scopes = cliScopeSchemas(schema);
    const scoped = isScopedSchemaMap(schema);
    const diagnostics: ConfigCliDiagnostic[] = [];
    const generatedByScope = new Map<string, CliOptionDef[]>();
    for (const scope of scopes) {
        generatedByScope.set(
            scope.name,
            walkScopeCliOptions(
                scope.name,
                scope.schema,
                {
                    ...(options.flags ? { flags: options.flags } : {}),
                    ...(options.descriptions ? { descriptions: options.descriptions } : {}),
                    ...(options.types ? { types: options.types } : {}),
                },
                diagnostics
            ).filter(def => keepsCliPath(def.path ?? '', options))
        );
    }

    const specs = (options.commands ?? []) as unknown as readonly ConfigProgramCommand<
        unknown,
        TContext
    >[];
    const commandSpecs: readonly ConfigProgramCommand<unknown, TContext>[] =
        specs.length > 0 ? specs : scopes.map(scope => ({ scope: scope.name, run: () => {} }));

    const commands: CliCommand<readonly CliOption[], TContext>[] = [];
    for (const spec of commandSpecs) {
        const scope = scopeForCommand(scopes, spec);
        const scopeMeta = scopeMetaOf(scope?.schema);
        if (specs.length === 0) {
            if (scopeMeta?.cliCommand === false) continue;
            if (scopeMeta?.cli === false) continue;
        }
        const meta = typeof scopeMeta?.cliCommand === 'object' ? scopeMeta.cliCommand : undefined;
        const defs = scope ? (generatedByScope.get(scope.name) ?? []) : [];
        const name = spec.name ?? meta?.name ?? scope?.name;
        if (!name) continue;
        const description =
            spec.description ??
            meta?.description ??
            (scope ? `Configure and run \`${scope.name}\`.` : `Run \`${name}\`.`);
        const aliases = spec.aliases ?? meta?.aliases;
        const args = spec.args ?? meta?.args;
        const runtime = spec.options ?? [];
        const run = (values: Record<string, unknown>, context: TContext): void | Promise<void> => {
            const hostConfig = (context as TContext & { config?: Record<string, unknown> }).config;
            if (!scope) {
                // A runtime-only command does not run config validation; it
                // receives the loaded config unchanged.
                return spec.run({
                    config: hostConfig,
                    values,
                    context,
                });
            }
            let config: unknown;
            try {
                const cliOverrides = overridesFromValues(values, defs, runtime);
                const specOverrides =
                    typeof spec.overrides === 'function'
                        ? spec.overrides(values)
                        : (spec.overrides ?? {});
                const merged = deepMerge(cliOverrides, specOverrides) as Record<string, unknown>;
                const overrides = scoped ? { [scope.name]: merged } : merged;
                const base = scoped
                    ? {
                          [scope.name]: hostConfig?.[scope.name] ?? {},
                      }
                    : (hostConfig ?? {});
                const parser = scoped ? { [scope.name]: scope.schema } : scope.schema;
                const parse = parseConfig as unknown as (
                    parser: ConfigSchema,
                    overrides: Record<string, unknown>,
                    options: Record<string, unknown>
                ) => Record<string, unknown>;
                const resolved = parse(parser as ConfigSchema, overrides, {
                    base,
                    source: ['env', 'cli'],
                    envPrefix: options.envPrefix,
                    ...(options.envPathOf ? { envPathOf: options.envPathOf } : {}),
                    validate: true,
                });
                config = scoped ? resolved[scope.name] : resolved;
            } catch (error) {
                // Keep the historical contract that config errors reject the
                // returned promise, even though sync handlers run synchronously.
                return Promise.reject(error);
            }
            return spec.run({ config, values, context });
        };
        commands.push({
            name,
            ...(scope ? { scope: scope.name } : {}),
            description,
            ...(aliases && aliases.length > 0 ? { aliases: [...aliases] } : {}),
            ...(args && args.length > 0 ? { args: [...args] } : {}),
            ...(spec.version ? { version: spec.version } : {}),
            ...(spec.argv ? { argv: [...spec.argv] } : {}),
            ...(spec.bin ? { bin: spec.bin } : {}),
            ...(spec.commands ? { commands: [...spec.commands] } : {}),
            ...(spec.globalOptions ? { globalOptions: [...spec.globalOptions] } : {}),
            ...(spec.inherit !== undefined ? { inherit: spec.inherit } : {}),
            options: [...toToolchainOptions(defs), ...runtime],
            ...((spec.hidden ?? meta?.hidden) ? { hidden: true } : {}),
            ...((spec.passthrough ?? meta?.passthrough) ? { passthrough: true } : {}),
            run: run as CliCommand<readonly CliOption[], TContext>['run'],
        });
    }
    return commands;
}
