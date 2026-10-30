/**
 * Config types generator. Produces `types/configuration/*.ts` from the untyped
 * JSON Schemas via untyped's `generateTypes`, so the generated types always come
 * from the same source (the Zod config schemas) and carry full jsdoc.
 *
 * The base group is emitted as a separate `<Name>Base` interface and the main
 * `<Name>Config` interface extends it, so no nested base property appears.
 */

import fs from 'node:fs';
import path from 'node:path';

import { generateTypes, type Schema } from 'untyped';

import { pascalCase } from '@deltabox/toolchain-shared';

import {
    isZodSchema,
    metaOf,
    normalizeConfigSchema,
    splitBaseSchema,
    zodToSchemaMap,
} from '../schema.js';
import type { ConfigEngineOptions, ConfigSchema } from '../types.js';

/** The `generateTypes` options shared by every interface. */
const GENERATE_OPTIONS = { addExport: true, partial: true } as const;

export interface GenerateTypesOptions extends Pick<ConfigEngineOptions, 'baseGroup'> {
    /** Output directory. `false` (or omitted) disables writing. */
    outputDir?: string | false;
    /**
     * Per-scope main interface name. Defaults to `<PascalScope>Config`.
     */
    interfaceNames?: Record<string, string>;
    /** Per-scope extra aliases appended after the generated interface. */
    aliases?: Record<string, string>;
    /**
     * Per-scope hand-written overrides: the full declaration text emitted
     * verbatim instead of a generated interface. Keyed by type name.
     */
    overrides?: Record<string, string>;
    /**
     * Import lines emitted once at the top of the file (after the header) so a
     * hand-written override can reference an imported type.
     */
    imports?: string[];
    /** File extension for generated files (default `ts`). */
    extension?: string;
    /** A raw (verbatim) header prepended to every generated file. */
    header?: string;
    /** Emit `@required` JSDoc tags (default true). */
    includeRequired?: boolean;
    /** Emit `@deprecated` JSDoc tags (default true). */
    includeDeprecated?: boolean;
    /** Emit `@example` JSDoc tags (default true). */
    includeExamples?: boolean;
    /** Emit `@since` JSDoc tags (default true). */
    includeSince?: boolean;
    /** Emit `@see` JSDoc tags (default true). */
    includeSee?: boolean;
    /** Emit `@remarks` JSDoc tags (default true). */
    includeRemarks?: boolean;
    /** Emit `@experimental` JSDoc tags (default true). */
    includeExperimental?: boolean;
    /** Emit `@alpha` JSDoc tags (default true). */
    includeAlpha?: boolean;
    /** Emit `@beta` JSDoc tags (default true). */
    includeBeta?: boolean;
    /** Show the env var equivalent in JSDoc (default true). */
    includeEnv?: boolean;
    /** Show the CLI flag equivalent in JSDoc (default true). */
    includeCli?: boolean;
}

/**
 * Drop the blank line untyped inserts between members inside a type body
 * (brace depth > 0), keeping the blank lines that separate top-level
 * declarations. Comment lines are skipped so a `{`/`}`/`[`/`]` inside a doc
 * comment never shifts the tracked depth.
 */
function stripMemberBlankLines(source: string): string {
    const out: string[] = [];
    let depth = 0;
    let inComment = false;
    for (const line of source.split('\n')) {
        const trimmed = line.trim();
        if (inComment) {
            out.push(line);
            if (trimmed.endsWith('*/')) inComment = false;
            continue;
        }
        if (trimmed.startsWith('/*')) {
            out.push(line);
            if (!trimmed.endsWith('*/')) inComment = true;
            continue;
        }
        if (trimmed === '' && depth > 0) continue;
        out.push(line);
        for (const char of line) {
            if (char === '{' || char === '(' || char === '[') depth++;
            else if ((char === '}' || char === ')' || char === ']') && depth > 0) depth--;
        }
    }
    return out.join('\n');
}

/** Generate an interface from a schema and normalize its member spacing. */
function tidyInterface(schema: Schema, interfaceName: string): string {
    return stripMemberBlankLines(generateTypes(schema, { ...GENERATE_OPTIONS, interfaceName }));
}

/**
 * Insert a `[key: string]: unknown` index signature before the closing brace of
 * a generated interface. Used for schemas that accept arbitrary keys
 * (`.catchall` / `.passthrough`), so the generated type stays open.
 */
function withIndexSignature(body: string): string {
    const close = body.lastIndexOf('}');
    if (close === -1) return body;
    return `${body.slice(0, close)}    [key: string]: unknown;\n${body.slice(close)}`;
}

/** Normalize `example` metadata into a list of strings. */
function exampleList(example: unknown): string[] {
    if (example === undefined || example === null) return [];
    const values = Array.isArray(example) ? example : [example];
    return values.map(value => String(value)).filter(Boolean);
}

/** Which JSDoc tags a generator should emit. */
type JsDocOptions = Pick<
    GenerateTypesOptions,
    | 'includeRequired'
    | 'includeDeprecated'
    | 'includeExamples'
    | 'includeSince'
    | 'includeSee'
    | 'includeRemarks'
    | 'includeExperimental'
    | 'includeAlpha'
    | 'includeBeta'
    | 'includeEnv'
    | 'includeCli'
>;

/** The JSDoc tag lines for a node's required / deprecation / example metadata. */
function jsDocTags(
    meta: {
        required?: unknown;
        deprecated?: unknown;
        deprecationMessage?: unknown;
        example?: unknown;
        since?: unknown;
        see?: unknown;
        remarks?: unknown;
        experimental?: unknown;
        alpha?: unknown;
        beta?: unknown;
    },
    options: JsDocOptions
): string[] {
    const tags: string[] = [];
    if (options.includeRequired !== false && meta.required === true) tags.push('@required');
    if (
        options.includeDeprecated !== false &&
        meta.deprecated !== undefined &&
        meta.deprecated !== false
    ) {
        const message =
            typeof meta.deprecationMessage === 'string' ? meta.deprecationMessage.trim() : '';
        tags.push(message ? `@deprecated ${message}` : '@deprecated');
    }
    if (options.includeExamples !== false) {
        for (const example of exampleList(meta.example)) {
            tags.push(`@example ${example}`);
        }
    }
    if (options.includeSince !== false && typeof meta.since === 'string' && meta.since.trim()) {
        tags.push(`@since ${meta.since.trim()}`);
    }
    if (options.includeSee !== false) {
        for (const link of exampleList(meta.see)) tags.push(`@see ${link}`);
    }
    if (
        options.includeRemarks !== false &&
        typeof meta.remarks === 'string' &&
        meta.remarks.trim()
    ) {
        tags.push(`@remarks ${meta.remarks.trim()}`);
    }
    if (options.includeExperimental !== false && meta.experimental === true) {
        tags.push('@experimental');
    }
    if (options.includeAlpha !== false && meta.alpha === true) tags.push('@alpha');
    if (options.includeBeta !== false && meta.beta === true) tags.push('@beta');
    return tags;
}

/**
 * Convert required / deprecation / example metadata into `tags` (which untyped
 * renders as JSDoc) and strip the raw keys so they are not emitted as
 * `@required true`, `@deprecated true` or a single comma-joined `@example`.
 */
function withJsDocTags(schema: Schema, options: JsDocOptions): Schema {
    const source = schema as Record<string, unknown>;
    const {
        deprecated,
        deprecationMessage,
        example,
        since,
        see,
        remarks,
        experimental,
        alpha,
        beta,
        tags: rawTags,
        ...rest
    } = source;
    const requiredMeta = source.required === true;
    const rawTagList = Array.isArray(rawTags) ? rawTags : [];
    const keptTags = rawTagList.filter(tag => {
        if (options.includeRequired === false && tag === '@required') return false;
        if (options.includeDeprecated === false && tag.startsWith('@deprecated')) return false;
        if (options.includeExamples === false && tag.startsWith('@example')) return false;
        if (options.includeSince === false && tag.startsWith('@since')) return false;
        if (options.includeSee === false && tag.startsWith('@see')) return false;
        if (options.includeRemarks === false && tag.startsWith('@remarks')) return false;
        if (options.includeExperimental === false && tag.startsWith('@experimental')) return false;
        if (options.includeAlpha === false && tag.startsWith('@alpha')) return false;
        if (options.includeBeta === false && tag.startsWith('@beta')) return false;
        return true;
    });
    const tags = [
        ...new Set([
            ...keptTags,
            ...jsDocTags(
                {
                    required: requiredMeta,
                    deprecated,
                    deprecationMessage,
                    example,
                    since,
                    see,
                    remarks,
                    experimental,
                    alpha,
                    beta,
                },
                options
            ),
        ]),
    ];
    const envName =
        typeof source.envName === 'string'
            ? source.envName
            : typeof source.env === 'string'
              ? source.env
              : '';
    if (options.includeEnv !== false && envName) tags.push(`@env ${envName}`);
    if (options.includeCli !== false && typeof source.cliFlag === 'string') {
        tags.push(`@cli ${source.cliFlag}`);
    }
    const out: Record<string, unknown> = { ...rest };
    // A boolean `required` is metadata; an array is the object's required keys.
    if (requiredMeta) delete out.required;
    if (tags.length > 0) out.tags = tags;
    if (out.properties && typeof out.properties === 'object') {
        out.properties = Object.fromEntries(
            Object.entries(out.properties as Record<string, Schema>).map(([key, child]) => [
                key,
                withJsDocTags(child, options),
            ])
        );
    }
    if (out.items && typeof out.items === 'object') {
        out.items = withJsDocTags(out.items as Schema, options);
    }
    return out as Schema;
}

/** Prepend the interface-level required/deprecated/example tags, if any. */
function withInterfaceJsDoc(body: string, schema: Schema, options: JsDocOptions): string {
    const source = schema as Record<string, unknown>;
    const tags = jsDocTags(
        {
            required: source.required,
            deprecated: source.deprecated,
            deprecationMessage: source.deprecationMessage,
            example: source.example,
            since: source.since,
            see: source.see,
            remarks: source.remarks,
            experimental: source.experimental,
            alpha: source.alpha,
            beta: source.beta,
        },
        options
    );
    if (tags.length === 0) return body;
    const doc = ['/**', ...tags.map(tag => ` * ${tag}`), ' */'].join('\n');
    return `${doc}\n${body}`;
}

/** Render the generated type file content for one scope. */
function renderConfigTypes(
    scopeName: string,
    schema: Schema,
    options: GenerateTypesOptions = {}
): string {
    const baseGroup = Array.isArray(options.baseGroup)
        ? String((options.baseGroup as unknown[])[0] ?? 'base')
        : String(options.baseGroup ?? 'base');
    const meta = metaOf(schema);
    const interfaceName =
        options.interfaceNames?.[scopeName] ??
        meta?.typeName ??
        meta?.id ??
        `${pascalCase(scopeName)}Config`;
    const aliases = options.aliases?.[scopeName] ?? '';
    const wrap = (body: string): string => (options.header ? `${options.header}\n\n${body}` : body);

    // A hand-written override replaces the generated interface verbatim.
    const override = options.overrides?.[scopeName];
    if (override !== undefined) {
        return wrap(`${override.trimEnd()}\n${aliases}`.trimEnd());
    }

    const allowExtraKeys = (schema as { allowExtraKeys?: boolean }).allowExtraKeys === true;

    // A non-object root (enum, union, record, ...) is rendered as a type alias.
    if (!schema.properties) {
        const tsType = (schema as { tsType?: string }).tsType ?? 'unknown';
        return wrap(
            `${withInterfaceJsDoc(`export type ${interfaceName} = ${tsType};`, schema, options)}\n${aliases}`
        );
    }

    const tagged = withJsDocTags(schema, options);
    const { base, groups, hasBase } = splitBaseSchema(tagged, baseGroup);
    const groupKeys = Object.keys((groups.properties ?? {}) as Record<string, unknown>);

    // Without a base group the full schema becomes the main interface directly.
    if (!hasBase) {
        let body = withInterfaceJsDoc(tidyInterface(tagged, interfaceName), schema, options);
        if (allowExtraKeys) body = withIndexSignature(body);
        return wrap(`${body}\n${aliases}`);
    }

    const baseInterface = tidyInterface(base, `${interfaceName}Base`);

    let mainInterface: string;
    if (groupKeys.length > 0) {
        mainInterface = tidyInterface(groups, interfaceName).replace(
            `export interface ${interfaceName} {`,
            `export interface ${interfaceName} extends ${interfaceName}Base {`
        );
    } else {
        mainInterface = `export interface ${interfaceName} extends ${interfaceName}Base {}\n`;
    }
    mainInterface = withInterfaceJsDoc(mainInterface, schema, options);
    if (allowExtraKeys) mainInterface = withIndexSignature(mainInterface);

    return wrap(`${baseInterface}\n${mainInterface}\n${aliases}`);
}

/** Render every config type file, keyed by scope name. */
function renderAllConfigTypes(
    schema: ConfigSchema,
    options: GenerateTypesOptions = {}
): Record<string, string> {
    if (isZodSchema(schema)) {
        return Object.fromEntries(
            Object.entries(zodToSchemaMap(schema)).map(([typeName, scopeSchema]) => [
                typeName,
                renderConfigTypes(typeName, scopeSchema, {
                    ...options,
                    interfaceNames: { [typeName]: typeName, ...options.interfaceNames },
                }),
            ])
        );
    }
    return Object.fromEntries(
        Object.entries(normalizeConfigSchema(schema)).map(([scopeName, scopeSchema]) => [
            scopeName,
            renderConfigTypes(scopeName, scopeSchema, options),
        ])
    );
}

/** Generate config type file contents (and optionally write them). */
export function generateConfigTypes(
    schema: ConfigSchema,
    options: GenerateTypesOptions = {}
): Record<string, string> {
    const extension = options.extension ?? 'ts';
    const contents = renderAllConfigTypes(schema, options);
    if (typeof options.outputDir === 'string') {
        for (const [scopeName, content] of Object.entries(contents)) {
            const file = path.join(options.outputDir, `${scopeName}.${extension}`);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, content, 'utf-8');
        }
    }
    return contents;
}
