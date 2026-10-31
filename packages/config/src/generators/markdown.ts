/**
 * Config markdown generator. Renders one reference file per scope (base +
 * grouped configs) plus an index that lists the required + core configs.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Schema } from 'untyped';

import { sanitizeText, titleCase } from '@deltabox/toolchain-shared';

import { type CollectVarsOptions, collectVars, DEFAULT_ENV_PREFIX } from '../collect.js';
import {
    isSchemaType,
    isZodSchema,
    metaOf,
    normalizeConfigSchema,
    splitBaseSchema,
} from '../schema.js';
import type { ConfigEngineOptions, ConfigSchema } from '../types.js';
import { type CliFlagOptions, cliFlagLabel } from './cli.js';

export interface RenderMarkdownFrontmatter {
    options: GenerateMarkdownOptions;
}

export interface RenderMarkdownOptions extends Pick<ConfigEngineOptions, 'baseGroup'> {
    /** Output directory. Set false (or omit it) to disable writing. */
    outputDir?: string | false;
    /** Frontmatter toggle, raw body, or callback. */
    frontmatter?: boolean | string | ((ctx: RenderMarkdownFrontmatter) => string);
    /** Render every scope into one file instead of one file per scope. */
    combined?: boolean;
    /** Show env var equivalents (default true). */
    includeEnv?: boolean;
    /** Show CLI flag equivalents (default true). */
    includeCli?: boolean;
    /** Page outline (defaults to `[2, 3, 4]`). */
    outline?: number[];
    /** The scope whose env vars render as CLI flags (default `cli`). */
    cliScope?: string;
    /** Env-var prefix (default `APP_`). */
    envPrefix?: string;
    /** Label overrides for the index page. */
    labels?: { required?: string; core?: string; title?: string };
    /** A raw intro paragraph for the index page (replaces the default one). */
    intro?: string;
    /** A note shown above the required table (default: the standard sentence). */
    requiredNote?: string;
    /** A note shown above the core table (default: the standard sentence). */
    coreNote?: string;
    /** A "References" list appended to the index page. */
    references?: { label: string; href: string }[];
    /** Shorthand flags keyed by env var name (for the CLI scope). */
    shortFlags?: Record<string, string>;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectVarsOptions['envPathOf'];
    /** Emit `- **Required**` lines (default true). */
    includeRequired?: boolean;
    /** Emit `- **Deprecated**` lines (default true). */
    includeDeprecated?: boolean;
    /** Emit `**Example(s):**` blocks (default true). */
    includeExamples?: boolean;
    /** Emit `- **Since**` lines (default true). */
    includeSince?: boolean;
    /** Emit `- **See**` lines (default true). */
    includeSee?: boolean;
    /** Emit `**Remarks:**` blocks (default true). */
    includeRemarks?: boolean;
    /** Emit `- **Experimental**` lines (default true). */
    includeExperimental?: boolean;
    /** Emit `- **Alpha**` lines (default true). */
    includeAlpha?: boolean;
    /** Emit `- **Beta**` lines (default true). */
    includeBeta?: boolean;
}

export interface GenerateMarkdownOptions extends RenderMarkdownOptions {
    /** Document title (default `Configuration`). */
    title?: string;
    /** Index file name (defaults to `index.md`). */
    indexFilename?: string;
}

interface EnvVarRow {
    name: string;
    scope: string;
    description?: string;
    default?: unknown;
    required?: boolean;
    secret?: boolean;
    public?: boolean;
}

interface SchemaNode {
    type?: string | string[];
    properties?: Record<string, SchemaNode>;
    required?: string[] | boolean;
    default?: unknown;
    envDefault?: unknown;
    description?: string;
    env?: string;
    envName?: string;
    envPath?: string;
    cliFlag?: string;
    cliFlagShort?: string;
    tsType?: string;
    secret?: boolean;
    public?: boolean;
    deprecated?: boolean;
    deprecationMessage?: string;
    example?: string | string[];
    since?: string;
    see?: string | string[];
    remarks?: string;
    experimental?: boolean;
    alpha?: boolean;
    beta?: boolean;
}

interface RenderOptions extends CliFlagOptions {
    useFlags?: boolean;
    baseGroup: string;
    includeEnv?: boolean;
    includeCli?: boolean;
    includeRequired?: boolean;
    includeDeprecated?: boolean;
    includeExamples?: boolean;
    includeSince?: boolean;
    includeSee?: boolean;
    includeRemarks?: boolean;
    includeExperimental?: boolean;
    includeAlpha?: boolean;
    includeBeta?: boolean;
}

/** Normalize `example` metadata into a list of strings. */
function exampleList(example: unknown): string[] {
    if (example === undefined || example === null) return [];
    const values = Array.isArray(example) ? example : [example];
    return values.map(value => sanitizeText(String(value))).filter(Boolean);
}

/** The `- **Deprecated**` list item, with an optional message. */
function deprecatedLine(deprecated: unknown, message?: unknown): string | undefined {
    if (deprecated === undefined || deprecated === false) return undefined;
    const text = typeof message === 'string' ? sanitizeText(message.trim()) : '';
    return text ? `- **Deprecated**: ${text}` : '- **Deprecated**';
}

/** The `**Example(s):**` block (each example on its own line). */
function exampleLines(example: unknown): string[] {
    const examples = exampleList(example);
    if (examples.length === 0) return [];
    return [
        '',
        '**Example(s):**',
        '',
        ...examples.flatMap((value, i) => (i ? ['', value] : [value])),
    ];
}

interface NodeAnnotations {
    deprecated?: boolean;
    deprecationMessage?: string;
    since?: string;
    see?: string | string[];
    remarks?: string;
    experimental?: boolean;
    alpha?: boolean;
    beta?: boolean;
}

type AnnotationOptions = Pick<
    RenderOptions,
    | 'includeRequired'
    | 'includeDeprecated'
    | 'includeExamples'
    | 'includeSince'
    | 'includeSee'
    | 'includeRemarks'
    | 'includeExperimental'
    | 'includeAlpha'
    | 'includeBeta'
>;

/** The `- **Required**` item (rendered above `- **Type**`). */
function requiredLine(required: boolean, opts: AnnotationOptions): string | undefined {
    return opts.includeRequired !== false && required ? '- **Required**' : undefined;
}

/** The list items rendered between `- **Type**` and the description. */
function annotationLines(meta: NodeAnnotations, opts: AnnotationOptions): string[] {
    const lines: string[] = [];
    if (opts.includeDeprecated !== false) {
        const deprecated = deprecatedLine(meta.deprecated, meta.deprecationMessage);
        if (deprecated) lines.push(deprecated);
    }
    if (opts.includeSince !== false && typeof meta.since === 'string' && meta.since.trim()) {
        lines.push(`- **Since**: ${sanitizeText(meta.since.trim())}`);
    }
    if (opts.includeSee !== false) {
        for (const link of exampleList(meta.see)) lines.push(`- **See**: ${link}`);
    }
    if (opts.includeExperimental !== false && meta.experimental) lines.push('- **Experimental**');
    if (opts.includeAlpha !== false && meta.alpha) lines.push('- **Alpha**');
    if (opts.includeBeta !== false && meta.beta) lines.push('- **Beta**');
    return lines;
}

/** The `**Remarks:**` block (rendered after the description). */
function remarksLines(remarks: unknown, opts: AnnotationOptions): string[] {
    if (opts.includeRemarks === false) return [];
    const text = typeof remarks === 'string' ? sanitizeText(remarks.trim()) : '';
    if (!text) return [];
    return ['', '**Remarks:**', '', ...text.split('\n')];
}

function renderNode(
    schema: SchemaNode,
    title: string,
    level: string,
    opts: RenderOptions
): string[] {
    const lines = [`${level} ${title}`];
    if (schema.type === 'object' && schema.properties) {
        lines.push(...renderFields(schema, `${level}#`, opts));
        return lines;
    }
    const envName =
        typeof schema.envName === 'string'
            ? schema.envName
            : typeof schema.env === 'string'
              ? schema.env
              : undefined;
    if (opts.includeEnv !== false && envName) lines.push(`- **Env**: \`${envName}\``);
    if (opts.includeCli !== false && typeof schema.cliFlag === 'string') {
        lines.push(`- **CLI**: \`${schema.cliFlag}\``);
    }
    const required = requiredLine(schema.required === true, opts);
    if (required) lines.push(required);
    lines.push(
        `- **Type**: \`${
            schema.tsType ??
            (Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type) ??
            'any'
        }\``
    );
    lines.push(...annotationLines(schema, opts));
    if (schema.default !== undefined)
        lines.push(`- **Default**: \`${JSON.stringify(schema.default)}\``);
    if (schema.description) lines.push('', sanitizeText(schema.description));
    lines.push(...remarksLines(schema.remarks, opts));
    if (opts.includeExamples !== false) lines.push(...exampleLines(schema.example));
    return lines;
}

function renderFields(schema: SchemaNode, level: string, opts: RenderOptions): string[] {
    const lines: string[] = [];
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
        const flagEnv = child.cliFlag ?? child.envName ?? child.env;
        const title = opts.useFlags && flagEnv ? cliFlagLabel(flagEnv, opts) : `\`${key}\``;
        lines.push('', ...renderNode(child, title, level, opts));
    }
    return lines;
}

function frontmatterLines(
    options: RenderMarkdownOptions,
    title: string,
    outline: number[]
): string[] {
    const value = options.frontmatter;
    if (value === false) return [];
    const body =
        typeof value === 'function'
            ? value({ options: options as GenerateMarkdownOptions })
            : typeof value === 'string'
              ? value
              : `title: ${title}\noutline: ${JSON.stringify(outline)}`;
    return ['---', ...body.split('\n'), '---', ''];
}

/** Render the markdown reference for a single scope (base + grouped configs). */
function renderScopeMarkdown(
    scope: string,
    schema: Schema,
    options: RenderMarkdownOptions = {}
): string {
    const outline = options.outline ?? [2, 3, 4];
    const opts: RenderOptions = {
        useFlags: scope === (options.cliScope ?? 'cli'),
        baseGroup: Array.isArray(options.baseGroup)
            ? String((options.baseGroup as unknown[])[0] ?? 'base')
            : String(options.baseGroup ?? 'base'),
        ...(options.envPrefix ? { envPrefix: options.envPrefix } : {}),
        ...(options.shortFlags ? { shortFlags: options.shortFlags } : {}),
        ...(options.includeRequired !== undefined
            ? { includeRequired: options.includeRequired }
            : {}),
        ...(options.includeDeprecated !== undefined
            ? { includeDeprecated: options.includeDeprecated }
            : {}),
        ...(options.includeExamples !== undefined
            ? { includeExamples: options.includeExamples }
            : {}),
        ...(options.includeSince !== undefined ? { includeSince: options.includeSince } : {}),
        ...(options.includeSee !== undefined ? { includeSee: options.includeSee } : {}),
        ...(options.includeRemarks !== undefined ? { includeRemarks: options.includeRemarks } : {}),
        ...(options.includeExperimental !== undefined
            ? { includeExperimental: options.includeExperimental }
            : {}),
        ...(options.includeAlpha !== undefined ? { includeAlpha: options.includeAlpha } : {}),
        ...(options.includeBeta !== undefined ? { includeBeta: options.includeBeta } : {}),
    };
    const { base, groups } = splitBaseSchema(schema, opts.baseGroup);
    const title = `${titleCase(scope)} Configuration`;
    const parts: string[] = [
        ...frontmatterLines(options, title, outline),
        `# ${title}`,
        '',
        'Every setting below is configured through a config value.',
        '',
        '## Base',
        '',
        ...renderFields(base as unknown as SchemaNode, '###', opts),
    ];
    for (const [group, groupSchema] of Object.entries(
        (groups.properties ?? {}) as Record<string, Schema>
    )) {
        parts.push(
            '',
            `## ${titleCase(group)}`,
            '',
            ...renderFields(groupSchema as unknown as SchemaNode, '###', opts)
        );
    }
    return `${parts.join('\n').trim()}\n`;
}

function formatDefault(value: unknown): string {
    if (value === undefined) return '—';
    if (Array.isArray(value)) return `\`${value.join(',')}\``;
    if (typeof value === 'object') return `\`${JSON.stringify(value)}\``;
    return `\`${String(value)}\``;
}

function collectSchemaEnvVars(schema: Schema, scope: string, out: EnvVarRow[]): void {
    for (const raw of Object.values((schema.properties ?? {}) as Record<string, Schema>)) {
        const child = raw as unknown as SchemaNode;
        if (child.type === 'object' && child.properties) {
            collectSchemaEnvVars(raw, scope, out);
        } else if (child.env) {
            const envDefault = child.envDefault ?? child.default;
            out.push({
                name: child.env,
                scope,
                ...(child.description ? { description: child.description } : {}),
                ...(envDefault !== undefined ? { default: envDefault } : {}),
                ...(child.required === true ? { required: true } : {}),
                ...(child.secret ? { secret: true } : {}),
                ...(child.public ? { public: true } : {}),
            });
        }
    }
}

/** Render the index file: explains the env convention + lists required/core. */
function renderConfigIndex(schema: ConfigSchema, options: RenderMarkdownOptions = {}): string {
    const outline = options.outline ?? [2, 3, 4];
    const baseGroup = Array.isArray(options.baseGroup)
        ? String((options.baseGroup as unknown[])[0] ?? 'base')
        : String(options.baseGroup ?? 'base');
    const labels = options.labels ?? {};
    const required: EnvVarRow[] = [];
    const core: EnvVarRow[] = [];
    const scopes = normalizeConfigSchema(schema);

    for (const [scopeName, scopeSchema] of Object.entries(scopes)) {
        collectSchemaEnvVars(splitBaseSchema(scopeSchema, baseGroup).base, scopeName, core);
    }
    for (const def of collectVars(schema, options.envPrefix ?? DEFAULT_ENV_PREFIX, {
        envPathOf: options.envPathOf,
    })) {
        if (def.required && def.name) {
            required.push({
                name: def.name,
                scope: def.scope,
                ...(def.description ? { description: def.description } : {}),
                ...(def.default !== undefined ? { default: def.default } : {}),
            });
        }
    }

    const table = (rows: EnvVarRow[]) =>
        [
            '| Variable | Default | Description |',
            '| -------- | ------- | ----------- |',
            ...rows.map(
                row =>
                    `| \`${row.name}\` | ${formatDefault(row.default)} | ${(row.description ?? '')
                        .replace(/\n/g, ' ')
                        .replace(/\|/g, '\\|')} |`
            ),
        ].join('\n');

    const title = labels.title ?? 'Environment variables';
    const intro =
        options.intro ??
        `Environment variables are prefixed with \`${options.envPrefix ?? DEFAULT_ENV_PREFIX}\`.
The underscore is a path separator, so every config value has an environment
variable equivalent.`;
    const requiredNote =
        options.requiredNote ?? 'These variables have no safe default and **must** be set:';
    const coreNote = options.coreNote ?? 'The core (base) config values:';
    const references =
        options.references && options.references.length
            ? `\n## References\n\n${options.references
                  .map(ref => `- [${ref.label}](${ref.href})`)
                  .join('\n')}\n`
            : '';

    return `${frontmatterLines(options, title, outline).join('\n')}
# ${title}

${intro}

## ${labels.required ?? 'Required'}

${requiredNote}

${table(required)}

## ${labels.core ?? 'Core'}

${coreNote}

${table(core)}
${references}`;
}

/**
 * The scopes as JSON Schema for the combined reference. Zod scopes go through
 * `toJSONSchema` (which keeps unions, enums, literals and `$defs`) instead of the
 * untyped lowering, which collapses unions to `any` with a `{}` default.
 */
function jsonScopesOf(
    schema: ConfigSchema,
    scopes: Record<string, Schema>
): Record<string, Schema> {
    const toJson = (value: unknown): Schema | undefined =>
        isZodSchema(value)
            ? ((value as { toJSONSchema: (o?: object) => unknown }).toJSONSchema({
                  target: 'draft-2020-12',
              }) as Schema)
            : undefined;
    if (Array.isArray(schema)) return scopes;
    const single = toJson(schema);
    if (single) {
        const [key] = Object.keys(scopes);
        return key ? { [key]: single } : scopes;
    }
    if (isSchemaType(schema)) return scopes;
    const out: Record<string, Schema> = {};
    for (const [key, resolved] of Object.entries(scopes)) {
        const value = (schema as Record<string, unknown>)[key];
        out[key] = (!Array.isArray(value) && toJson(value)) || resolved;
    }
    return out;
}

/** Generate markdown file contents (and optionally write them). */
export function generateConfigMarkdown(
    schema: ConfigSchema,
    options: GenerateMarkdownOptions = {}
): Record<string, string> {
    const outline = options.outline ?? [2, 3, 4];
    const scopes = normalizeConfigSchema(schema);
    const contents: Record<string, string> = {};
    if (options.combined) {
        const file = options.indexFilename ?? 'index.md';
        contents[file] = renderConfigSectionsMarkdown(jsonScopesOf(schema, scopes), {
            ...options,
            outline,
        });
    } else {
        for (const [scopeName, scopeSchema] of Object.entries(scopes)) {
            contents[`${scopeName}.md`] = renderScopeMarkdown(scopeName, scopeSchema, {
                ...options,
                outline,
            });
        }
        contents[options.indexFilename ?? 'index.md'] = renderConfigIndex(schema, {
            ...options,
            outline,
        });
    }
    if (typeof options.outputDir === 'string') {
        fs.mkdirSync(options.outputDir, { recursive: true });
        for (const [file, content] of Object.entries(contents)) {
            fs.writeFileSync(path.resolve(options.outputDir, file), content, 'utf-8');
        }
    }
    return contents;
}

export interface RenderConfigFileOptions {
    /** Document title (default `Configuration`). */
    title?: string;
    /** Intro paragraph under the title. */
    intro?: string;
    /** Page outline (default `[2, 3, 4]`). */
    outline?: number[];
    /** Emit `- **Required**` lines (default true). */
    includeRequired?: boolean;
    /** Emit `- **Deprecated**` lines (default true). */
    includeDeprecated?: boolean;
    /** Emit `**Example(s):**` blocks (default true). */
    includeExamples?: boolean;
    /** Emit `- **Since**` lines (default true). */
    includeSince?: boolean;
    /** Emit `- **See**` lines (default true). */
    includeSee?: boolean;
    /** Emit `**Remarks:**` blocks (default true). */
    includeRemarks?: boolean;
    /** Emit `- **Experimental**` lines (default true). */
    includeExperimental?: boolean;
    /** Emit `- **Alpha**` lines (default true). */
    includeAlpha?: boolean;
    /** Emit `- **Beta**` lines (default true). */
    includeBeta?: boolean;
}

/** A JSON Schema (draft 2020-12) node as produced by `z.toJSONSchema`. */
interface JsonSchemaJson {
    type?: string | string[];
    properties?: Record<string, JsonSchemaJson>;
    required?: string[] | boolean;
    default?: unknown;
    description?: string;
    enum?: unknown[];
    const?: unknown;
    anyOf?: JsonSchemaJson[];
    oneOf?: JsonSchemaJson[];
    $ref?: string;
    items?: JsonSchemaJson;
    additionalProperties?: JsonSchemaJson | boolean;
    $defs?: Record<string, JsonSchemaJson>;
    deprecated?: boolean;
    deprecationMessage?: string;
    example?: string | string[];
    since?: string;
    see?: string | string[];
    remarks?: string;
    experimental?: boolean;
    alpha?: boolean;
    beta?: boolean;
}

/** The `$defs` key a `$ref` points at. */
function refNameOf(node: JsonSchemaJson): string | undefined {
    return node.$ref ? (node.$ref.split('/').pop() ?? undefined) : undefined;
}

/** Resolve a `$ref` against the schema's `$defs` (a no-op for inline nodes). */
function resolveJsonRef(
    node: JsonSchemaJson,
    defs: Record<string, JsonSchemaJson>
): JsonSchemaJson {
    const name = refNameOf(node);
    return name && defs[name] ? defs[name]! : node;
}

function jsonLiteral(value: unknown): string {
    return typeof value === 'string' ? `'${value}'` : String(value);
}

/** Resolve metadata from a node, its `$ref`, or its union members. */
function jsonNodeMeta(
    node: JsonSchemaJson,
    defs: Record<string, JsonSchemaJson>
): {
    required?: boolean;
    deprecated?: boolean;
    deprecationMessage?: string;
    example?: string | string[];
    since?: string;
    see?: string | string[];
    remarks?: string;
    experimental?: boolean;
    alpha?: boolean;
    beta?: boolean;
} {
    const resolved = resolveJsonRef(node, defs);
    let required = node.required === true || resolved.required === true ? true : undefined;
    let deprecated = node.deprecated ?? resolved.deprecated;
    let deprecationMessage = node.deprecationMessage ?? resolved.deprecationMessage;
    let example = node.example ?? resolved.example;
    let since = node.since ?? resolved.since;
    let see = node.see ?? resolved.see;
    let remarks = node.remarks ?? resolved.remarks;
    let experimental = node.experimental ?? resolved.experimental;
    let alpha = node.alpha ?? resolved.alpha;
    let beta = node.beta ?? resolved.beta;
    const variants = [
        ...(resolved.anyOf ?? node.anyOf ?? []),
        ...(resolved.oneOf ?? node.oneOf ?? []),
    ];
    for (const variant of variants) {
        const target = resolveJsonRef(variant, defs);
        required ??= variant.required === true || target.required === true ? true : undefined;
        deprecated ??= variant.deprecated ?? target.deprecated;
        deprecationMessage ??= variant.deprecationMessage ?? target.deprecationMessage;
        example ??= variant.example ?? target.example;
        since ??= variant.since ?? target.since;
        see ??= variant.see ?? target.see;
        remarks ??= variant.remarks ?? target.remarks;
        experimental ??= variant.experimental ?? target.experimental;
        alpha ??= variant.alpha ?? target.alpha;
        beta ??= variant.beta ?? target.beta;
    }
    return {
        ...(required !== undefined ? { required } : {}),
        ...(deprecated !== undefined ? { deprecated } : {}),
        ...(deprecationMessage !== undefined ? { deprecationMessage } : {}),
        ...(example !== undefined ? { example } : {}),
        ...(since !== undefined ? { since } : {}),
        ...(see !== undefined ? { see } : {}),
        ...(remarks !== undefined ? { remarks } : {}),
        ...(experimental !== undefined ? { experimental } : {}),
        ...(alpha !== undefined ? { alpha } : {}),
        ...(beta !== undefined ? { beta } : {}),
    };
}

/**
 * The `- **Type**` label for a node. Named **objects** keep their type name (and
 * are expanded below); everything else (enums, unions, arrays, primitives) is
 * rendered structurally so nested options are readable without the type table.
 */
function jsonTypeLabel(node: JsonSchemaJson, defs: Record<string, JsonSchemaJson>): string {
    if (node.$ref) {
        const resolved = resolveJsonRef(node, defs);
        if (resolved.properties || resolved.anyOf || resolved.oneOf) return refNameOf(node)!;
        return jsonTypeLabel(resolved, defs);
    }
    if (node.const !== undefined) return jsonLiteral(node.const);
    if (Array.isArray(node.enum) && node.enum.length > 0) {
        return node.enum.map(jsonLiteral).join(' | ');
    }
    const variants = node.anyOf ?? node.oneOf;
    if (variants && variants.length > 0) {
        return variants.map(variant => jsonTypeLabel(variant, defs)).join(' | ');
    }
    // An inline object (with `properties`) is documented by its fields below.
    if (node.properties) return 'object';
    const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
    if (types.includes('array')) return `Array<${jsonTypeLabel(node.items ?? {}, defs)}>`;
    if (types.includes('object')) {
        const additional = node.additionalProperties;
        if (additional && additional !== true) {
            return `Record<string, ${jsonTypeLabel(additional, defs)}>`;
        }
        return 'Record<string, unknown>';
    }
    if (types.length === 0) return 'unknown';
    return types.map(type => (type === 'integer' ? 'number' : type)).join(' | ');
}

/**
 * The nested fields to document under a node: an object's properties, the
 * merged properties of the object member(s) of a union, or an array item's
 * properties — resolving `$ref`s so named sub-schemas expand inline. A named
 * type is expanded only once per section (tracked in `seen`) so repeated
 * references don't duplicate whole blocks.
 */
function jsonChildFields(
    node: JsonSchemaJson,
    defs: Record<string, JsonSchemaJson>,
    seen: Set<string>
): { properties: Record<string, JsonSchemaJson>; required: string[] } {
    const name = refNameOf(node);
    if (name) {
        if (seen.has(name)) return { properties: {}, required: [] };
        seen.add(name);
    }
    const resolved = resolveJsonRef(node, defs);
    if (resolved.properties) {
        return {
            properties: resolved.properties,
            required: Array.isArray(resolved.required) ? resolved.required : [],
        };
    }
    const variants = resolved.anyOf ?? resolved.oneOf;
    if (variants) {
        const properties: Record<string, JsonSchemaJson> = {};
        const required = new Set<string>();
        for (const variant of variants) {
            const child = jsonChildFields(variant, defs, seen);
            Object.assign(properties, child.properties);
            for (const key of child.required) required.add(key);
        }
        return { properties, required: [...required] };
    }
    const types = Array.isArray(resolved.type)
        ? resolved.type
        : resolved.type
          ? [resolved.type]
          : [];
    if (types.includes('array') && resolved.items)
        return jsonChildFields(resolved.items, defs, seen);
    return { properties: {}, required: [] };
}

function renderJsonField(
    key: string,
    node: JsonSchemaJson,
    level: string,
    defs: Record<string, JsonSchemaJson>,
    seen: Set<string>,
    required: boolean,
    options: RenderConfigFileOptions
): string[] {
    const resolved = resolveJsonRef(node, defs);
    const meta = jsonNodeMeta(node, defs);
    const lines = [`${level} \`${key}\``];
    const requiredLineText = requiredLine(required || meta.required === true, options);
    if (requiredLineText) lines.push(requiredLineText);
    lines.push(`- **Type**: \`${jsonTypeLabel(node, defs)}\``);
    lines.push(...annotationLines(meta, options));
    const fallback = node.default ?? resolved.default;
    if (fallback !== undefined) lines.push(`- **Default**: \`${JSON.stringify(fallback)}\``);
    const description = sanitizeText(node.description ?? resolved.description ?? '');
    if (description) lines.push('', description);
    lines.push(...remarksLines(meta.remarks, options));
    if (options.includeExamples !== false) lines.push(...exampleLines(meta.example));
    const children = jsonChildFields(node, defs, seen);
    // Markdown headings only go to `######` (h6); deeper nesting keeps h6 rather
    // than emitting a literal `#######`.
    const childLevel = level.length < 6 ? `${level}#` : level;
    for (const [childKey, childNode] of Object.entries(children.properties)) {
        lines.push(
            '',
            ...renderJsonField(
                childKey,
                childNode,
                childLevel,
                defs,
                seen,
                children.required.includes(childKey),
                options
            )
        );
    }
    return lines;
}

function renderJsonFields(
    node: JsonSchemaJson,
    level: string,
    defs: Record<string, JsonSchemaJson>,
    seen: Set<string>,
    options: RenderConfigFileOptions
): string[] {
    const lines: string[] = [];
    const required = Array.isArray(node.required) ? node.required : [];
    for (const [key, child] of Object.entries(node.properties ?? {})) {
        lines.push(
            '',
            ...renderJsonField(key, child, level, defs, seen, required.includes(key), options)
        );
    }
    return lines;
}

/**
 * Render a single markdown reference for a config **file** (no environment-var
 * language): one `## \`key\`` section per schema, with its fields, types,
 * defaults and descriptions. Named sub-schemas (`$defs`) are resolved and
 * expanded inline, so nested options (`ci.changelog.versioning.target`, ...) are
 * documented too. This is what a `dbx.config.ts`-style reference is generated from.
 */
function renderConfigSectionsMarkdown(
    scopes: Record<string, Schema>,
    options: RenderConfigFileOptions & RenderMarkdownOptions = {}
): string {
    const title = options.title ?? 'Configuration';
    const parts: string[] = [
        ...frontmatterLines(options, title, options.outline ?? [2, 3, 4]),
        `# ${title}`,
        '',
    ];
    if (options.intro) parts.push(options.intro, '');
    for (const [key, schema] of Object.entries(scopes)) {
        const json = schema as unknown as JsonSchemaJson;
        const defs = json.$defs ?? {};
        // A Zod JSON Schema roots named objects at a `$ref` into `$defs`.
        const node = resolveJsonRef(json, defs);
        const meta = metaOf(node as unknown as Schema);
        parts.push(`## \`${key}\``, '');
        if (meta?.description) parts.push(meta.description, '');
        const required = requiredLine(meta?.required === true, options);
        if (required) parts.push(required, '');
        const annotations = annotationLines(meta ?? {}, options);
        if (annotations.length > 0) parts.push(...annotations, '');
        const remarks = remarksLines(meta?.remarks, options);
        if (remarks.length > 0) parts.push(...remarks, '');
        if (options.includeExamples !== false) {
            const examples = exampleLines(meta?.example);
            if (examples.length > 0) parts.push(...examples, '');
        }
        parts.push(...renderJsonFields(node, '###', defs, new Set<string>(), options), '');
    }
    return `${parts.join('\n').trim()}\n`;
}
