/**
 * Config collection: walks any supported config schema (Zod or untyped) and
 * collects every leaf plus its `.meta()` env/cli/type metadata. This drives the
 * `.env` file, types, docs, JSON metadata and CLI option generators.
 *
 * `collect` resolves the collected definitions against the configured sources
 * (env + CLI by default) into a validated, correlated config object;
 * `collectDefinitions` keeps the raw definition list for the generators.
 */

import type { Schema } from 'untyped';
import type { ZodType } from 'zod';

import { deepMerge, getLogger } from '@deltabox/toolchain-shared';

import { parseEnvTree, readEnvPath } from './env.js';
import { ConfigParseError } from './errors.js';
import { isSchemaType, isZodSchema, metaOf, normalizeConfigSchema } from './schema.js';
import type {
    CollectErrorOptions,
    CollectFilter,
    CollectFilterOptions,
    CollectNarrowOptions,
    CollectOptions,
    CollectPathFilter,
    CollectValueKind,
    ConfigDef,
    ConfigSchema,
    ConfigSource,
    ConfigValueKind,
    ConfigValueType,
    DefaultMessage,
    ErrorTrigger,
    ErrorTriggerPosition,
    ResolvedConfig,
    RewriteMessage,
    RewriteMessageContext,
} from './types/index.js';

export type * from './types/collect.js';

/** The default env-var prefix used when none is configured. */
export const DEFAULT_ENV_PREFIX = 'APP_';

const KIND_PLURAL: Record<string, string> = {
    boolean: 'booleans',
    number: 'numbers',
    string: 'strings',
    array: 'arrays',
    object: 'objects',
    enum: 'enums',
    union: 'unions',
    tuple: 'tuples',
    record: 'records',
    map: 'maps',
    set: 'sets',
    date: 'dates',
    bigint: 'bigints',
    symbol: 'symbols',
    null: 'nulls',
    undefined: 'undefineds',
    void: 'voids',
    never: 'nevers',
    any: 'anys',
    unknown: 'unknowns',
    literal: 'literals',
    promise: 'promises',
    function: 'functions',
    file: 'files',
    custom: 'customs',
};

function normalizeJsonType(type: unknown): ConfigValueType | undefined {
    const candidates = Array.isArray(type) ? type : [type];
    if (candidates.includes('array')) return 'array';
    if (candidates.includes('object')) return 'object';
    if (candidates.includes('boolean')) return 'boolean';
    if (candidates.includes('number') || candidates.includes('integer')) return 'number';
    if (candidates.includes('string')) return 'string';
    return undefined;
}

function schemaChildren(schema: ZodType | Schema): Record<string, ZodType | Schema> | undefined {
    if (isZodSchema(schema)) {
        return (schema as ZodType & { shape?: Record<string, ZodType> }).shape;
    }
    return (schema as Schema).properties as Record<string, Schema> | undefined;
}

function schemaType(schema: ZodType | Schema): ConfigValueType | undefined {
    if (isZodSchema(schema)) {
        try {
            const json = schema.toJSONSchema() as { type?: unknown };
            return normalizeJsonType(json.type);
        } catch {
            return undefined;
        }
    }
    return normalizeJsonType((schema as Schema).type);
}

function schemaDefault(schema: ZodType | Schema): unknown {
    if (isZodSchema(schema)) {
        try {
            return (schema.toJSONSchema() as { default?: unknown }).default;
        } catch {
            return undefined;
        }
    }
    return (schema as Schema).default;
}

function defaultFromChildren(children: Record<string, ZodType | Schema>): unknown {
    const entries = Object.entries(children)
        .map(([key, child]) => [key, schemaDefault(child)] as const)
        .filter(([, value]) => value !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function zodKind(schema: ZodType, seen = new Set<unknown>()): ConfigValueKind | undefined {
    if (seen.has(schema)) return undefined;
    seen.add(schema);
    const def = (schema as unknown as { _zod?: { def?: Record<string, unknown> } })._zod?.def;
    const type = typeof def?.type === 'string' ? def.type : undefined;
    if (!type) return undefined;
    if (type in KIND_PLURAL || type === 'undefined' || type === 'null') {
        return type as ConfigValueKind;
    }
    if (type === 'nan') return 'number';
    if (type === 'template_literal') return 'string';
    const inner = def?.innerType ?? def?.in ?? def?.out;
    return inner && isZodSchema(inner) ? zodKind(inner, seen) : (type as ConfigValueKind);
}

function schemaKind(schema: ZodType | Schema): ConfigValueKind | undefined {
    if (isZodSchema(schema)) return zodKind(schema);
    const kind = (schema as Schema & { configKind?: unknown }).configKind;
    if (typeof kind === 'string') return kind as ConfigValueKind;
    const type = (schema as Schema).type;
    if (typeof type === 'string') return type as ConfigValueKind;
    if (Array.isArray(type))
        return (type as unknown[]).find(item => item !== 'null') as ConfigValueKind;
    return normalizeJsonType(type) as ConfigValueKind | undefined;
}

/**
 * Convert a dotted-path glob to a regular expression. `*` matches one segment,
 * `**` any number of segments, `?` one non-dot character, and `[...]`/`{a,b}`
 * are supported without nesting.
 */
export function globToRegExp(pattern: string): RegExp {
    const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let source = '';
    let index = 0;
    while (index < pattern.length) {
        const char = pattern[index]!;
        if (char === '*') {
            if (pattern[index + 1] === '*') {
                source += '.*';
                index += 2;
            } else {
                source += '[^.]*';
                index += 1;
            }
        } else if (char === '?') {
            source += '[^.]';
            index += 1;
        } else if (char === '[') {
            const end = pattern.indexOf(']', index + 1);
            if (end === -1) {
                source += '\\[';
                index += 1;
            } else {
                const body = pattern.slice(index + 1, end);
                const translated = body.startsWith('!') ? `^${body.slice(1)}` : body;
                source += `(?:(?!\\.)[${translated}])`;
                index = end + 1;
            }
        } else if (char === '{') {
            const end = pattern.indexOf('}', index + 1);
            if (end === -1) {
                source += '\\{';
                index += 1;
            } else {
                const alternatives = pattern
                    .slice(index + 1, end)
                    .split(',')
                    .map(alternative => escape(alternative));
                source += `(?:${alternatives.join('|')})`;
                index = end + 1;
            }
        } else {
            source += escape(char);
            index += 1;
        }
    }
    return new RegExp(`^${source}$`);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPathFilter(filter: CollectFilter | undefined): filter is CollectPathFilter {
    if (filter === undefined) return false;
    if (typeof filter === 'function' || typeof filter === 'string') return true;
    if (Array.isArray(filter)) return filter.every(item => typeof item === 'string');
    return false;
}

function isKindFilter(filter: CollectFilter | undefined): filter is CollectFilterOptions {
    return isPlainRecord(filter) && !Array.isArray(filter);
}

function matchesPathFilter(def: ConfigDef, filter: CollectPathFilter | undefined): boolean {
    if (filter === undefined) return true;
    if (typeof filter === 'function') return filter(def);
    const patterns = Array.isArray(filter) ? filter : [filter];
    return patterns.some(pattern => globToRegExp(pattern).test(pathOf(def)));
}

function walkSchema(
    schema: ZodType | Schema,
    out: ConfigDef[],
    scope: string,
    envPrefix: string,
    options: CollectOptions,
    pathParts: string[] = [],
    inheritedDefault?: unknown
): void {
    const depth = pathParts.length;
    if (options.maxDepth !== undefined && depth > options.maxDepth) return;
    const meta = metaOf(schema);
    const children = schemaChildren(schema);
    const envName = meta?.envName ?? meta?.env;
    const path =
        meta?.envPath ??
        meta?.path ??
        (envName ? options.envPathOf?.(envName) : undefined) ??
        pathParts.join('.');
    const cliFlag =
        meta?.cliFlag ??
        (envName
            ? `--${envName
                  .slice(envName.startsWith(envPrefix) ? envPrefix.length : 0)
                  .toLowerCase()
                  .replace(/_/g, '-')}`
            : undefined);
    const fallbackDefault = children ? defaultFromChildren(children) : undefined;
    const ownDefault = schemaDefault(schema);
    const effectiveDefault = ownDefault !== undefined ? ownDefault : inheritedDefault;
    const fallbackType = children ? 'object' : schemaType(schema);
    const kind = schemaKind(schema);

    if (!children || envName || meta?.cliFlag) {
        const defaultValue =
            ownDefault !== undefined
                ? ownDefault
                : inheritedDefault !== undefined
                  ? inheritedDefault
                  : fallbackDefault;
        const def: ConfigDef = {
            path: path || (meta?.id ?? 'config'),
            ...(envName ? { name: envName } : {}),
            ...(cliFlag ? { cliFlag } : {}),
            ...(meta?.description ? { description: meta.description } : {}),
            ...(defaultValue !== undefined ? { default: defaultValue } : {}),
            ...(meta?.required ? { required: true } : {}),
            ...(meta?.secret ? { secret: true } : {}),
            ...(meta?.public ? { public: true } : {}),
            ...(meta?.scope ? { scope: meta.scope } : { scope }),
            ...(fallbackType ? { type: fallbackType } : {}),
            ...(kind ? { kind } : {}),
            ...(meta ? { meta } : {}),
        };
        out.push(def);
    }
    if (!children) return;
    for (const [key, child] of Object.entries(children)) {
        const childDefault =
            effectiveDefault !== undefined && isPlainRecord(effectiveDefault)
                ? (effectiveDefault as Record<string, unknown>)[key]
                : undefined;
        walkSchema(child, out, scope, envPrefix, options, [...pathParts, key], childDefault);
    }
}

/**
 * Collect every config leaf from scoped schemas. This is the generator-facing
 * definition list; use {@link collect} to resolve values.
 */
export function collectDefinitions(schema: ConfigSchema, options?: CollectOptions): ConfigDef[];
export function collectDefinitions<T extends ConfigDef>(
    schema: ConfigSchema,
    options: CollectNarrowOptions<T>
): T[];
export function collectDefinitions(
    schema: ConfigSchema,
    options: CollectOptions = {}
): ConfigDef[] {
    const envPrefix = options.envPrefix === null ? '' : (options.envPrefix ?? DEFAULT_ENV_PREFIX);
    const include = isPathFilter(options.include) ? options.include : undefined;
    const exclude = isPathFilter(options.exclude) ? options.exclude : undefined;
    const scopes = normalizeConfigSchema(schema);
    const out: ConfigDef[] = [];
    for (const [scopeName, scopeSchema] of Object.entries(scopes)) {
        const before = out.length;
        walkSchema(scopeSchema, out, scopeName, envPrefix, options);
        // Two leaves in the same schema scope may declare the same env name;
        // keep the first. Different scopes keep sharing the env var name even
        // when their `meta.scope` label is identical.
        const additions = out.splice(before);
        const seen = new Set<string>();
        for (const def of additions) {
            if (def.name) {
                if (seen.has(def.name)) continue;
                seen.add(def.name);
            }
            if (!matchesPathFilter(def, include)) continue;
            if (exclude !== undefined && matchesPathFilter(def, exclude)) continue;
            out.push(def);
        }
        for (let i = before; i < out.length; i++) {
            if (!out[i]!.scope || out[i]!.scope === 'default') out[i]!.scope = scopeName;
        }
    }
    const filtered = options.filter === undefined ? out : out.filter(options.filter);
    return filtered;
}

/** Collect the config paths marked `required` for a scope. */
export function collectRequired(
    schema: ConfigSchema,
    scope?: string,
    options: CollectOptions = {}
): ConfigDef[] {
    return collectDefinitions(schema, options).filter(
        def => def.required && (scope === undefined || def.scope === scope)
    );
}

/** Normalize a config path for the collected definitions. */
export function pathOf(def: ConfigDef): string {
    return def.meta?.envPath ?? def.meta?.path ?? def.path;
}

/** A collected definition plus the schema scope it came from. */
interface ScopedDef {
    def: ConfigDef;
    scope?: string;
}

function isScopedSchema(schema: ConfigSchema): boolean {
    return !Array.isArray(schema) && !isZodSchema(schema) && !isSchemaType(schema);
}

function scopeFilter(
    filter: CollectPathFilter | undefined,
    scope: string,
    scopes: string[]
): CollectPathFilter | undefined {
    if (filter === undefined) return undefined;
    if (typeof filter === 'function') {
        return def => filter({ ...def, path: `${scope}.${pathOf(def)}` });
    }
    const patterns = Array.isArray(filter) ? filter : [filter];
    const kept: string[] = [];
    for (const pattern of patterns) {
        if (scopes.some(other => other !== scope && pattern.startsWith(`${other}.`))) continue;
        kept.push(pattern.startsWith(`${scope}.`) ? pattern.slice(scope.length + 1) : pattern);
    }
    return kept;
}

function collectScoped(schema: ConfigSchema, options: CollectOptions): ScopedDef[] {
    const include = isPathFilter(options.include) ? options.include : undefined;
    const exclude = isPathFilter(options.exclude) ? options.exclude : undefined;
    if (!isScopedSchema(schema)) {
        return collectDefinitions(schema, { ...options, include, exclude }).map(def => ({ def }));
    }
    const entries = Object.entries(schema as Record<string, ConfigSchema>);
    const scopes = entries.map(([scope]) => scope);
    return entries.flatMap(([scope, value]) =>
        collectDefinitions(value, {
            ...options,
            include: scopeFilter(include, scope, scopes),
            exclude: scopeFilter(exclude, scope, scopes),
        }).map(def => ({ def, scope }))
    );
}

/** Coerce an env/CLI string into the definition's declared type. */
function coerce(value: string, def: ConfigDef): unknown {
    switch (def.type) {
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

function getPath(target: unknown, path: string): unknown {
    let node = target;
    for (const segment of path.split('.').filter(Boolean)) {
        if (typeof node !== 'object' || node === null) return undefined;
        node = (node as Record<string, unknown>)[segment];
    }
    return node;
}

function setPathInScope(target: Record<string, unknown>, entry: ScopedDef, value: unknown): void {
    const path = pathOf(entry.def);
    if (!entry.scope) {
        setPath(target, path, value);
        return;
    }
    const current = target[entry.scope];
    if (typeof current !== 'object' || current === null) target[entry.scope] = {};
    setPath(target[entry.scope] as Record<string, unknown>, path, value);
}

function valueKindKeys(def: ConfigDef, value: unknown): CollectValueKind[] {
    const keys: CollectValueKind[] = [];
    if (def.required) keys.push('required');
    keys.push(value === undefined ? 'undefined' : value === null ? 'null' : 'defined');
    return keys;
}

function valueFilterAllows(rule: unknown, def: ConfigDef): boolean {
    if (typeof rule === 'boolean') return rule;
    const items = Array.isArray(rule) ? rule : [rule];
    for (const item of items) {
        if (!isPlainRecord(item)) continue;
        if (item.type !== undefined && item.type !== def.type) continue;
        if (item.exclude === true || item.include === false) continue;
        return true;
    }
    return false;
}

function valueFilterExcludes(rule: unknown, def: ConfigDef): boolean {
    if (typeof rule === 'boolean') return rule;
    const items = Array.isArray(rule) ? rule : [rule];
    for (const item of items) {
        if (!isPlainRecord(item)) continue;
        if (item.type !== undefined && item.type !== def.type) continue;
        if (item.exclude === true || item.include === false) return true;
    }
    return false;
}

function includedByKind(def: ConfigDef, value: unknown, filter: CollectFilterOptions): boolean {
    const keys = valueKindKeys(def, value);
    const entries = Object.entries(filter) as Array<[CollectValueKind, unknown]>;
    if (entries.length === 0) return true;
    for (const [key, rule] of entries) {
        if (rule === undefined || !keys.includes(key)) continue;
        if (valueFilterAllows(rule, def)) return true;
    }
    return false;
}

function excludedByKind(def: ConfigDef, value: unknown, filter: CollectFilterOptions): boolean {
    const keys = valueKindKeys(def, value);
    for (const [key, rule] of Object.entries(filter) as Array<[CollectValueKind, unknown]>) {
        if (rule === undefined || !keys.includes(key)) continue;
        if (valueFilterExcludes(rule, def)) return true;
    }
    return false;
}

function passesValueFilters(def: ConfigDef, value: unknown, options: CollectOptions): boolean {
    if (isKindFilter(options.include) && !includedByKind(def, value, options.include)) return false;
    if (isKindFilter(options.exclude) && excludedByKind(def, value, options.exclude)) return false;
    return true;
}

/** Read a CLI flag value for every definition sharing it. */
function collectCliValues(entries: ScopedDef[], argv: string[]): Map<ScopedDef, string[]> {
    const candidates = entries.filter(entry => entry.def.name || entry.def.cliFlag);
    const byFlag = new Map<string, ScopedDef[]>();
    const addFlag = (flag: string, entry: ScopedDef): void => {
        const current = byFlag.get(flag);
        if (current) current.push(entry);
        else byFlag.set(flag, [entry]);
    };
    for (const entry of candidates) {
        const def = entry.def;
        const long =
            def.cliFlag ?? (def.name ? `--${def.name.toLowerCase().replace(/_/g, '-')}` : '');
        if (long) addFlag(long, entry);
        const short = def.meta?.cliFlagShort;
        if (short) addFlag(short.startsWith('-') ? short : `-${short}`, entry);
    }
    const values = new Map<ScopedDef, string[]>();
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index]!;
        if (token === '--') break;
        if (!token.startsWith('-')) continue;
        const equals = token.indexOf('=');
        const flag = equals === -1 ? token : token.slice(0, equals);
        const inline = equals === -1 ? undefined : token.slice(equals + 1);
        const entriesForFlag = flag ? byFlag.get(flag) : undefined;
        if (!entriesForFlag || entriesForFlag.length === 0) continue;
        const def = entriesForFlag[0]!.def;
        let value = inline;
        if (value === undefined) {
            const next = argv[index + 1];
            const booleanLiteral =
                next !== undefined && /^(?:true|false|1|0|yes|no|on|off)$/i.test(next);
            // Booleans only consume a recognised literal. Numbers may be
            // negative (including `-.5`). Other values consume a token unless
            // it is another option, in which case the value is missing.
            const numeric = next !== undefined && /^-\.?\d/.test(next);
            const takesNext =
                next !== undefined &&
                (def.type === 'boolean' ? booleanLiteral : !next.startsWith('-') || numeric);
            if (def.type === 'boolean') value = takesNext ? next : 'true';
            else if (takesNext) value = next;
            else value = '';
            if (takesNext) index += 1;
        }
        for (const entry of entriesForFlag) {
            values.set(entry, [...(values.get(entry) ?? []), value]);
        }
    }
    return values;
}

function defaultEnvSource(): Record<string, string | undefined> {
    const globalProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } })
        .process;
    if (globalProcess?.env) return globalProcess.env;
    const meta = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
    return meta ?? {};
}

function defaultArgv(): string[] {
    const globalProcess = (globalThis as { process?: { argv?: string[] } }).process;
    return globalProcess?.argv ? globalProcess.argv.slice(2) : [];
}

/** Build a config object from env/CLI definitions (nesting scoped schemas). */
function buildFromSources(
    entries: ScopedDef[],
    options: CollectOptions,
    sources: ConfigSource[],
    envSource: Record<string, string | undefined>,
    argv: string[]
): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    const prefix = options.envPrefix === null ? '' : (options.envPrefix ?? DEFAULT_ENV_PREFIX);
    const envTree = sources.includes('env') ? parseEnvTree(envSource, prefix) : {};
    const cliValues = sources.includes('cli')
        ? collectCliValues(entries, argv)
        : new Map<ScopedDef, string[]>();

    for (const entry of entries) {
        const { def } = entry;
        let raw: string | undefined;
        if (cliValues.has(entry)) {
            const list = (cliValues.get(entry) ?? []).filter(item => item.trim() !== '');
            if (list.length > 0) {
                raw = def.type === 'array' && list.length > 1 ? list.join(',') : list.at(-1);
            }
        }
        if (raw === undefined && sources.includes('env')) {
            const named = def.name ? envSource[def.name] : undefined;
            const path = def.meta?.envPath ?? def.meta?.path ?? def.path;
            const value =
                named !== undefined ? named : (readEnvPath(envTree, path) as string | undefined);
            raw = typeof value === 'string' && value.trim() !== '' ? value : undefined;
        }
        if (raw !== undefined && raw.trim() !== '') {
            const value = coerce(raw, def);
            if (passesValueFilters(def, value, options)) setPathInScope(config, entry, value);
            continue;
        }
        if (def.default !== undefined && !def.secret) {
            if (passesValueFilters(def, def.default, options)) {
                setPathInScope(config, entry, def.default);
            }
        }
    }
    return config;
}

interface ValidationIssue {
    path: string;
    message: string;
    kind?: ConfigValueKind;
}

function issuesFromResult(
    result: { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } },
    prefix: string
): ValidationIssue[] {
    return result.error.issues.map(issue => ({
        path: [...(prefix ? [prefix] : []), ...issue.path.map(String)].join('.'),
        message: issue.message,
    }));
}

/** Validate a resolved config through `schema.safeParse()`. */
function validateSchema(
    schema: ConfigSchema,
    config: Record<string, unknown>,
    options?: CollectOptions
): { data: Record<string, unknown>; issues: ValidationIssue[] } {
    if (isZodSchema(schema)) {
        const result = schema.safeParse(config);
        if (result.success) {
            return { data: result.data as Record<string, unknown>, issues: [] };
        }
        return { data: config, issues: issuesFromResult(result, '') };
    }
    if (!isScopedSchema(schema)) return { data: config, issues: [] };
    const data: Record<string, unknown> = { ...config };
    const issues: ValidationIssue[] = [];
    const filtered = isPathFilter(options?.include) || isPathFilter(options?.exclude);
    for (const [scope, value] of Object.entries(schema as Record<string, ConfigSchema>)) {
        if (config[scope] === undefined && filtered) continue;
        const parsed = Array.isArray(value) ? value.find(isZodSchema) : value;
        if (!isZodSchema(parsed)) continue;
        const result = parsed.safeParse(config[scope] ?? {});
        if (result.success) data[scope] = result.data;
        else issues.push(...issuesFromResult(result, scope));
    }
    return { data, issues };
}

function findDefForPath(entries: ScopedDef[], path: string): ScopedDef | undefined {
    const normalized = pathOf({ path } as ConfigDef);
    return entries.find(({ def, scope }) => {
        const defPath = scope ? `${scope}.${pathOf(def)}` : pathOf(def);
        return (
            defPath === path ||
            defPath === normalized ||
            path.endsWith(`.${defPath}`) ||
            defPath.endsWith(`.${path}`)
        );
    });
}

function applyRewrite(
    message: string,
    context: RewriteMessageContext,
    rewrite: RewriteMessage
): string {
    if (typeof rewrite === 'function') {
        const value = rewrite({ ...context, originalMessage: message });
        if (typeof value === 'string') return value;
        if (value && typeof (value as Promise<string>).then === 'function') {
            // Synchronous collection cannot await a promise; keep the message.
            return message;
        }
        return message;
    }
    const pairs = Array.isArray(rewrite) ? rewrite : [rewrite];
    let result = message;
    for (const pair of pairs) {
        result = result.replace(pair.find, pair.replacement);
    }
    return result;
}

function defaultMessageFor(
    message: string,
    kind: ConfigValueKind | undefined,
    fallback: DefaultMessage | undefined
): string {
    if (fallback === undefined) return message;
    if (typeof fallback === 'string') return fallback;
    const key = kind ? KIND_PLURAL[kind] : undefined;
    return (key ? fallback[key] : undefined) ?? fallback.message ?? message;
}

function triggerPosition(
    trigger: ErrorTrigger | undefined,
    issue: ValidationIssue
): ErrorTriggerPosition {
    if (trigger === undefined) return 'collect-all';
    if (typeof trigger === 'string') return trigger;
    if ('position' in trigger) {
        return trigger.type === undefined || trigger.type === issue.kind
            ? trigger.position
            : 'collect-all';
    }
    return (issue.kind ? trigger[issue.kind] : undefined) ?? 'collect-all';
}

function selectIssues(
    issues: ValidationIssue[],
    trigger: ErrorTrigger | undefined
): ValidationIssue[] {
    if (issues.length <= 1) return issues;
    const positions = new Set(issues.map(issue => triggerPosition(trigger, issue)));
    if (positions.has('collect-all')) return issues;
    const selected: ValidationIssue[] = [];
    if (positions.has('initial')) {
        const first = issues.find(issue => triggerPosition(trigger, issue) === 'initial');
        if (first) selected.push(first);
    }
    if (positions.has('last')) {
        const last = [...issues]
            .reverse()
            .find(issue => triggerPosition(trigger, issue) === 'last');
        if (last) selected.push(last);
    }
    return selected;
}

function formatIssues(issues: Array<{ path: string; message: string }>): string {
    if (issues.length === 1) return issues[0]!.message;
    return `Invalid config:\n${issues.map(issue => `  - ${issue.path}: ${issue.message}`).join('\n')}`;
}

function reportIssues(
    issues: ValidationIssue[],
    entries: ScopedDef[],
    config: Record<string, unknown>,
    options: CollectOptions,
    source: ConfigSource
): void {
    const errors: CollectErrorOptions = options.errorOptions ?? {};
    const level =
        errors.errorLevel === undefined
            ? 'throw'
            : errors.errorLevel === true
              ? 'throw'
              : errors.errorLevel === false
                ? 'warn'
                : errors.errorLevel;
    if (level === 'silent') return;

    const selected = selectIssues(issues, errors.trigger);
    const messages = selected.map(issue => {
        const entry = findDefForPath(entries, issue.path);
        const def = entry?.def;
        const kind = def?.kind ?? issue.kind;
        const context: RewriteMessageContext = {
            scope: def?.scope ?? entry?.scope ?? 'default',
            name: def?.name ?? issue.path,
            sourceName: def?.name ?? issue.path,
            source,
            ...(def?.type ? { sourceType: def.type } : {}),
            ...(def?.cliFlag ? { flag: def.cliFlag } : {}),
            path: issue.path,
            value: getPath(config, issue.path),
            originalMessage: issue.message,
        };
        const rewritten = errors.rewriteMessage
            ? applyRewrite(issue.message, context, errors.rewriteMessage)
            : defaultMessageFor(issue.message, kind, errors.defaultMessage);
        return { path: issue.path, message: rewritten };
    });

    const message = formatIssues(messages);
    if (level === 'throw') {
        throw new ConfigParseError(message, messages);
    }
    const logger = errors.logger ?? getLogger();
    logger.warn(message);
}

/** Options used by the internal source-aware resolver. */
export interface ResolveConfigOptions extends CollectOptions {
    /** Which sources to read (defaults to env + CLI). */
    sources?: ConfigSource[];
    /** The primary source, used for error context. */
    source?: ConfigSource;
}

/**
 * Resolve a config from its enabled sources, merge overrides and validate it.
 * Internal entry point shared by {@link collect} and the parser wrappers.
 */
export function resolveConfig<
    P extends ConfigSchema,
    O extends Record<string, any> | null | undefined,
    const Options extends ResolveConfigOptions,
>(schema: P, options: Options, overrides?: O): ResolvedConfig<P, O, Options> {
    const sources =
        options.sources ?? (options.source === 'file' ? [] : (['env', 'cli'] as ConfigSource[]));
    const envSource = options.envSource ?? defaultEnvSource();
    const argv = options.argv ?? defaultArgv();
    const entries = collectScoped(schema, options);
    let config = buildFromSources(entries, options, sources, envSource, argv);
    if (overrides !== undefined && overrides !== null) {
        if (isPlainRecord(overrides)) {
            config = deepMerge(config, overrides);
        }
    }
    if (options.validate === true) {
        const validated = validateSchema(schema, config, options);
        if (validated.issues.length > 0) {
            reportIssues(validated.issues, entries, config, options, sources[0] ?? 'file');
        } else {
            config = validated.data;
        }
    }
    return config as ResolvedConfig<P, O, Options>;
}

/**
 * Resolve a config from env vars and CLI flags (both enabled by default) and
 * return the correlated typed config object. Definition collection for the
 * generators lives in {@link collectDefinitions}.
 */
export function collect<P extends ConfigSchema, const Options extends ResolveConfigOptions = {}>(
    schema: P,
    options?: Options
): ResolvedConfig<P, {}, Options> {
    return resolveConfig<P, {}, Options>(schema, (options ?? {}) as Options);
}
