/**
 * Schema-aware CLI option walker.
 *
 * `collectDefinitions` flattens every supported schema into leaves, but that
 * loses union branches (a `boolean | { ... }` section becomes one opaque leaf).
 * The CLI generator needs the branch structure so `sync.format` can resolve to
 * its object fields. This walker reads Zod schemas directly, falls back to the
 * collected definitions for untyped/plain schemas and prunes `cli: false`
 * subtrees without affecting the env/types/docs generators.
 */

import type { ZodType } from 'zod';

import { collectDefinitions } from '../collect.js';
import { isSchemaType, isZodSchema, metaOf, normalizeConfigSchema } from '../schema.js';
import type {
    CliOptionDef,
    ConfigCliDiagnostic,
    ConfigCliOptionMeta,
    ConfigMeta,
    ConfigSchema,
    ConfigValueType,
} from '../types/index.js';
import { configFlagOf, parseCliValue } from './cli.js';

/** A resolved walk target: one schema scope and its original schema value. */
export interface CliScopeSchema {
    name: string;
    schema: ConfigSchema;
}

interface CliWalkOptions {
    scope: string;
    flags?: Record<string, string>;
    descriptions?: Record<string, string>;
    types?: Record<string, ConfigValueType | 'boolean'>;
    diagnostics: ConfigCliDiagnostic[];
}

/** Zod internals used for branch introspection (Zod 4 has no public API). */
interface ZodDef extends Record<string, unknown> {
    type?: string;
    innerType?: ZodType;
    options?: ZodType[];
    element?: ZodType;
    in?: ZodType;
    out?: ZodType;
    left?: ZodType;
    right?: ZodType;
    getter?: () => ZodType;
    defaultValue?: unknown;
}

interface ZodLike {
    _zod?: { def?: ZodDef };
    shape?: Record<string, ZodType>;
    toJSONSchema?: () => Record<string, unknown>;
}

function zodDef(schema: ZodType): ZodDef | undefined {
    return (schema as unknown as ZodLike)._zod?.def;
}

/** Unwrap optional/nullable/default/effects wrappers, preserving the branch. */
function unwrapZod(schema: ZodType): ZodType {
    let current = schema;
    for (let depth = 0; depth < 32; depth += 1) {
        const def = zodDef(current);
        if (!def) return current;
        if (
            [
                'optional',
                'nullable',
                'default',
                'prefault',
                'readonly',
                'catch',
                'nonoptional',
            ].includes(def.type ?? '') &&
            def.innerType
        ) {
            current = def.innerType;
            continue;
        }
        if ((def.type === 'pipe' || def.type === 'effects') && (def.out ?? def.in)) {
            current = (def.out ?? def.in) as ZodType;
            continue;
        }
        if (def.type === 'lazy' && def.getter) {
            current = def.getter();
            continue;
        }
        return current;
    }
    return current;
}

function jsonOf(schema: ZodType): Record<string, unknown> | undefined {
    try {
        return schema.toJSONSchema?.() as Record<string, unknown> | undefined;
    } catch {
        return undefined;
    }
}

function normalizeJsonType(type: unknown): ConfigValueType | undefined {
    const candidates = Array.isArray(type) ? type : [type];
    if (candidates.includes('array')) return 'array';
    if (candidates.includes('object')) return 'object';
    if (candidates.includes('boolean')) return 'boolean';
    if (candidates.includes('number') || candidates.includes('integer')) return 'number';
    if (candidates.includes('string')) return 'string';
    return undefined;
}

function typeOf(schema: ZodType, meta: ConfigMeta | undefined): ConfigValueType | string {
    const explicit = isOptionMeta(meta?.cli) ? meta.cli.type : undefined;
    if (explicit) return explicit;
    const json = jsonOf(schema);
    if (!json) return 'string';
    const resolved = normalizeJsonType(json.type);
    if (resolved) return resolved;
    // A union of literals/enums resolves to strings; a mixed union is ambiguous
    // and falls back to a string flag unless `cli.type` says otherwise.
    if (Array.isArray(json.enum) && json.enum.every(item => typeof item === 'string')) {
        return 'string';
    }
    return 'string';
}

function choicesOf(schema: ZodType, meta: ConfigMeta | undefined): readonly string[] | undefined {
    if (isOptionMeta(meta?.cli) && meta.cli.choices && meta.cli.choices.length > 0) {
        return meta.cli.choices;
    }
    const json = jsonOf(schema);
    if (!json) return undefined;
    if (Array.isArray(json.enum) && json.enum.every(item => typeof item === 'string')) {
        return json.enum as string[];
    }
    const variants = (json.anyOf ?? json.oneOf) as Array<Record<string, unknown>> | undefined;
    if (variants && variants.length > 0) {
        const values = variants
            .filter(variant => variant.const !== undefined)
            .map(variant => String(variant.const));
        if (values.length === variants.length) return values;
    }
    return undefined;
}

function defaultOf(schema: ZodType, meta: ConfigMeta | undefined): unknown {
    if (isOptionMeta(meta?.cli) && meta.cli.default !== undefined) return meta.cli.default;
    const json = jsonOf(schema);
    return json?.default;
}

function defaultString(value: unknown): string | undefined {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value.join(',');
    if (typeof value === 'object') return undefined;
    return String(value);
}

function isOptionMeta(value: ConfigMeta['cli'] | undefined): value is ConfigCliOptionMeta {
    return typeof value === 'object' && value !== null;
}

/** Merge inner and outer metadata, letting the outer wrapper win. */
function mergeMeta(
    inner: ConfigMeta | undefined,
    outer: ConfigMeta | undefined
): ConfigMeta | undefined {
    if (!inner) return outer;
    if (!outer) return inner;
    return { ...inner, ...outer };
}

/** Collect metadata from every wrapper in the chain (outermost wins). */
function metaChain(schema: ZodType): ConfigMeta | undefined {
    const metas: ConfigMeta[] = [];
    let current: ZodType | undefined = schema;
    const seen = new Set<ZodType>();
    for (let depth = 0; current && depth < 32 && !seen.has(current); depth += 1) {
        seen.add(current);
        const meta = metaOf(current);
        if (meta) metas.push(meta);
        const def = zodDef(current);
        if (!def) break;
        current =
            def.innerType ??
            (def.type === 'pipe' || def.type === 'effects' ? (def.out ?? def.in) : undefined) ??
            (def.type === 'lazy' ? def.getter?.() : undefined);
    }
    let merged: ConfigMeta | undefined;
    for (const meta of metas.reverse()) merged = mergeMeta(merged, meta);
    return merged;
}

function envNameOf(meta: ConfigMeta | undefined): string | undefined {
    if (!meta || meta.envExpose === false) return undefined;
    return meta.envName ?? (typeof meta.env === 'string' ? meta.env : undefined);
}

function shortOf(meta: ConfigMeta | undefined): string | undefined {
    const short = isOptionMeta(meta?.cli) ? meta.cli.short : undefined;
    if (short) return short.startsWith('-') ? short : `-${short}`;
    return meta?.cliFlagShort ? `-${meta.cliFlagShort.replace(/^-/, '')}` : undefined;
}

function flagOf(path: string, meta: ConfigMeta | undefined): string {
    return (
        (isOptionMeta(meta?.cli) ? meta.cli.flag : undefined) ?? meta?.cliFlag ?? configFlagOf(path)
    );
}

function matchesPath(path: string, patterns: readonly string[]): boolean {
    return patterns.some(pattern => path === pattern || path.startsWith(`${pattern}.`));
}

class OptionBag {
    private readonly entries = new Map<
        string,
        { def: CliOptionDef; explicit: boolean; conflict: boolean }
    >();
    private readonly conflicted = new Set<string>();

    add(def: CliOptionDef, explicit: boolean, options: CliWalkOptions): void {
        const path = def.path ?? def.flag;
        const existing = this.entries.get(path);
        if (!existing) {
            this.entries.set(path, { def, explicit, conflict: false });
            return;
        }
        if (sameOption(existing.def, def)) return;
        if (explicit && !existing.explicit) {
            this.entries.set(path, { def, explicit, conflict: false });
            return;
        }
        if (!explicit && existing.explicit) return;
        // Two branches claim the same path with different metadata and neither
        // (or both) opted in: omit the path and report it.
        this.entries.set(path, { def: existing.def, explicit: existing.explicit, conflict: true });
        if (!this.conflicted.has(path)) {
            this.conflicted.add(path);
            options.diagnostics.push({
                scope: options.scope,
                path,
                kind: 'ambiguous-union',
                message: `ambiguous CLI path "${path}" from union branches; the option was omitted.`,
            });
        }
    }

    values(): CliOptionDef[] {
        return [...this.entries.values()].filter(entry => !entry.conflict).map(entry => entry.def);
    }
}

function sameOption(a: CliOptionDef, b: CliOptionDef): boolean {
    return (
        a.flag === b.flag &&
        a.short === b.short &&
        a.type === b.type &&
        a.description === b.description &&
        a.multiple === b.multiple &&
        a.default === b.default
    );
}

function emitLeaf(
    node: ZodType,
    pathParts: string[],
    meta: ConfigMeta | undefined,
    bag: OptionBag,
    options: CliWalkOptions
): void {
    const path = pathParts.join('.');
    if (!path) return;
    const type = typeOf(node, meta);
    const optionMeta = isOptionMeta(meta?.cli) ? meta.cli : undefined;
    // Metadata overrides (`flags`/`types`/`descriptions`) are the documented
    // low-level escape hatch and still win over schema metadata.
    const legacyFlag = options.flags?.[path];
    const legacyType = options.types?.[path];
    const legacyDescription = options.descriptions?.[path];
    const resolvedType = legacyType ?? type;
    const defaultValue = defaultOf(node, meta);
    const description = legacyDescription ?? optionMeta?.description ?? meta?.description;
    const choices = choicesOf(node, meta);
    const explicit =
        legacyFlag !== undefined ||
        legacyType !== undefined ||
        legacyDescription !== undefined ||
        isOptionMeta(meta?.cli);
    const short = shortOf(meta);
    const env = envNameOf(meta);
    const def: CliOptionDef = {
        flag: legacyFlag ?? flagOf(path, meta),
        ...(short ? { short } : {}),
        ...(env ? { env } : {}),
        type: resolvedType,
        ...(description ? { description } : {}),
        ...(meta?.secret ? { secret: true } : {}),
        ...(!meta?.secret && defaultString(defaultValue) !== undefined
            ? { default: defaultString(defaultValue) }
            : {}),
        ...(meta?.required ? { required: true } : {}),
        ...(choices && choices.length > 0 ? { choices } : {}),
        ...(optionMeta?.hidden ? { hidden: true } : {}),
        ...(resolvedType === 'array' || optionMeta?.multiple ? { multiple: true } : {}),
        ...(meta?.scope ? { scope: meta.scope } : { scope: options.scope }),
        path,
        parse: optionMeta?.parse ?? (value => parseCliValue(value, resolvedType)),
    };
    bag.add(def, explicit, options);
}

function fallbackOptions(
    scope: string,
    schema: ConfigSchema,
    bag: OptionBag,
    options: CliWalkOptions
): void {
    for (const def of collectDefinitions({ [scope]: schema })) {
        if (!def.path) continue;
        if (def.meta?.cli === false) continue;
        const optionMeta = isOptionMeta(def.meta?.cli) ? def.meta.cli : undefined;
        const resolvedType = options.types?.[def.path] ?? optionMeta?.type ?? def.type ?? 'string';
        const description =
            options.descriptions?.[def.path] ?? optionMeta?.description ?? def.description;
        const defaultStringValue = defaultString(optionMeta?.default ?? def.default);
        const short = shortOf(def.meta);
        bag.add(
            {
                flag:
                    options.flags?.[def.path] ??
                    optionMeta?.flag ??
                    def.meta?.cliFlag ??
                    configFlagOf(def.path),
                ...(short ? { short } : {}),
                ...(def.name ? { env: def.name } : {}),
                type: resolvedType,
                ...(description ? { description } : {}),
                ...(def.secret ? { secret: true } : {}),
                ...(!def.secret && defaultStringValue !== undefined
                    ? { default: defaultStringValue }
                    : {}),
                ...(def.required || optionMeta?.required ? { required: true } : {}),
                ...(optionMeta?.choices && optionMeta.choices.length > 0
                    ? { choices: optionMeta.choices }
                    : {}),
                ...(optionMeta?.hidden ? { hidden: true } : {}),
                ...(resolvedType === 'array' || optionMeta?.multiple ? { multiple: true } : {}),
                scope: def.scope || scope,
                path: def.path,
                parse: optionMeta?.parse ?? (value => parseCliValue(value, resolvedType)),
            },
            true,
            options
        );
    }
}

function walkZod(
    node: ZodType,
    pathParts: string[],
    metaOverride: ConfigMeta | undefined,
    bag: OptionBag,
    options: CliWalkOptions,
    seen: Set<ZodType>
): void {
    if (seen.has(node)) return;
    seen.add(node);
    try {
        walkZodNode(node, pathParts, metaOverride, bag, options, seen);
    } finally {
        seen.delete(node);
    }
}

function walkZodNode(
    node: ZodType,
    pathParts: string[],
    metaOverride: ConfigMeta | undefined,
    bag: OptionBag,
    options: CliWalkOptions,
    seen: Set<ZodType>
): void {
    const inner = unwrapZod(node);
    const meta = metaOverride ?? metaChain(node);
    if (meta?.cli === false) return;
    const def = zodDef(inner);
    const type = def?.type;
    const explicit = isOptionMeta(meta?.cli);

    if (type === 'object') {
        const shape = (inner as unknown as ZodLike).shape;
        if (shape) {
            for (const [key, child] of Object.entries(shape)) {
                walkZod(child, [...pathParts, key], undefined, bag, options, seen);
            }
            return;
        }
    }

    if (type === 'union' && Array.isArray(def?.options)) {
        for (const branch of def.options) {
            const unwrapped = unwrapZod(branch);
            const branchType = zodDef(unwrapped)?.type;
            if (branchType === 'object') {
                walkZod(unwrapped, pathParts, undefined, bag, options, seen);
            }
        }
        // A primitive/literal branch only becomes a flag when the field opted
        // in explicitly (eg. a boolean `--auto` switch next to an object form).
        if (explicit) emitLeaf(node, pathParts, meta, bag, options);
        return;
    }

    if (type === 'intersection') {
        if (def?.left) walkZod(def.left, pathParts, undefined, bag, options, seen);
        if (def?.right) walkZod(def.right, pathParts, undefined, bag, options, seen);
        return;
    }

    if (type === 'array') {
        const element = def?.element as ZodType | undefined;
        const elementType = element
            ? normalizeJsonType(jsonOf(unwrapZod(element))?.type)
            : undefined;
        // Scalar arrays (`z.array(z.string())`) are list flags by default;
        // arrays of objects/records/maps are skipped unless explicit.
        const scalarArray = elementType !== undefined && elementType !== 'object';
        if (explicit || scalarArray) emitLeaf(node, pathParts, meta, bag, options);
        return;
    }

    if (['record', 'map', 'set', 'tuple'].includes(type ?? '')) {
        // Records/maps/sets/tuples are skipped by default; an explicit `cli`
        // definition turns them into a scalar/list flag.
        if (explicit) emitLeaf(node, pathParts, meta, bag, options);
        return;
    }

    if (pathParts.length === 0) return;
    // Values a CLI flag cannot meaningfully express (callbacks, any/unknown,
    // dates, symbols, ...) are only exposed when a field opts in explicitly.
    if (
        [
            'function',
            'any',
            'unknown',
            'never',
            'void',
            'undefined',
            'null',
            'symbol',
            'bigint',
            'date',
            'promise',
            'custom',
            'file',
        ].includes(type ?? '')
    ) {
        if (explicit) emitLeaf(node, pathParts, meta, bag, options);
        return;
    }
    emitLeaf(node, pathParts, meta, bag, options);
}
export function cliScopeSchemas(schema: ConfigSchema): CliScopeSchema[] {
    if (Array.isArray(schema)) {
        const normalized = normalizeConfigSchema(schema);
        return [{ name: Object.keys(normalized)[0] ?? 'config', schema }];
    }
    if (isZodSchema(schema) || isSchemaType(schema)) {
        const normalized = normalizeConfigSchema(schema);
        return [{ name: Object.keys(normalized)[0] ?? 'config', schema }];
    }
    if (schema === null || typeof schema !== 'object') {
        const normalized = normalizeConfigSchema(schema);
        return [{ name: Object.keys(normalized)[0] ?? 'config', schema }];
    }
    return Object.entries(schema as Record<string, ConfigSchema>).map(([name, value]) => ({
        name,
        schema: value,
    }));
}

/** Walk one scope schema into CLI option definitions. */
export function walkScopeCliOptions(
    scope: string,
    schema: ConfigSchema,
    options: Omit<CliWalkOptions, 'scope' | 'diagnostics'>,
    diagnostics: ConfigCliDiagnostic[]
): CliOptionDef[] {
    const bag = new OptionBag();
    const state: CliWalkOptions = { ...options, scope, diagnostics };
    const parts = Array.isArray(schema) ? schema : [schema];
    for (const part of parts) {
        const seen = new Set<ZodType>();
        if (isZodSchema(part)) {
            walkZod(part, [], undefined, bag, state, seen);
        } else {
            fallbackOptions(scope, part, bag, state);
        }
    }
    return bag.values();
}

/** The metadata for a scope, including a union's object branch metadata. */
export function scopeMetaOf(schema: ConfigSchema | undefined): ConfigMeta | undefined {
    const first = Array.isArray(schema) ? schema[0] : schema;
    if (!first || !isZodSchema(first)) {
        return first && isSchemaType(first) ? metaOf(first) : undefined;
    }
    const direct = metaOf(first);
    if (direct?.cliCommand !== undefined) return direct;
    const inner = unwrapZod(first);
    const def = zodDef(inner);
    let branchMeta: ConfigMeta | undefined;
    if (def?.type === 'union' && Array.isArray(def.options)) {
        for (const branch of def.options) {
            const candidate = metaOf(unwrapZod(branch));
            if (!candidate) continue;
            branchMeta ??= candidate;
            if (candidate.cliCommand !== undefined) {
                return { ...branchMeta, ...candidate, ...direct };
            }
        }
    }
    return direct ?? branchMeta ?? metaOf(inner);
}

/** Whether a dotted path survives the include/exclude filters. */
export function keepsCliPath(
    path: string,
    options: {
        pathPrefix?: string;
        includePaths?: readonly string[];
        excludePaths?: readonly string[];
    }
): boolean {
    if (options.pathPrefix && !path.startsWith(options.pathPrefix)) return false;
    if (options.includePaths && !matchesPath(path, options.includePaths)) return false;
    if (options.excludePaths && matchesPath(path, options.excludePaths)) return false;
    return true;
}
