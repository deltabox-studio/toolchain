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

import { splitBaseSchema, zodToJsonSchema } from '../schema.js';
import type { ConfigScopes } from '../types.js';

/** The `generateTypes` options shared by every interface. */
const GENERATE_OPTIONS = { addExport: true, partial: true } as const;

export interface GenerateTypesOptions {
    /** Output directory. When omitted, nothing is written. */
    outputDir?: string;
    /** The base group hoisted into `<Name>Base` (default `base`). */
    baseGroup?: string;
    /**
     * Per-scope main interface name. Defaults to `<PascalScope>Config`.
     */
    interfaceNames?: Record<string, string>;
    /** Per-scope extra aliases appended after the generated interface. */
    aliases?: Record<string, string>;
    /** File extension for generated files (default `ts`). */
    extension?: string;
    /** A raw (verbatim) header prepended to every generated file. */
    header?: string;
}

/** The resolved schema for a scope (from a precomputed schema or the Zod one). */
export function resolveScopeSchema(schema: Schema | undefined, zodSchema: unknown): Schema {
    return (schema ?? zodToJsonSchema(zodSchema as never)) as Schema;
}

/** Render the generated type file content for one scope. */
export function renderConfigTypes(
    scopeName: string,
    schema: Schema,
    options: GenerateTypesOptions = {}
): string {
    const baseGroup = options.baseGroup ?? 'base';
    const interfaceName = options.interfaceNames?.[scopeName] ?? `${pascalCase(scopeName)}Config`;
    const aliases = options.aliases?.[scopeName] ?? '';
    const wrap = (body: string): string => (options.header ? `${options.header}\n\n${body}` : body);

    // A non-object root (enum, union, record, ...) is rendered as a type alias.
    if (!schema.properties) {
        const tsType = (schema as { tsType?: string }).tsType ?? 'unknown';
        return wrap(`export type ${interfaceName} = ${tsType};\n${aliases}`);
    }

    const { base, groups, hasBase } = splitBaseSchema(schema, baseGroup);
    const groupKeys = Object.keys((groups.properties ?? {}) as Record<string, unknown>);

    // Without a base group the full schema becomes the main interface directly.
    if (!hasBase) {
        return wrap(`${generateTypes(schema, { ...GENERATE_OPTIONS, interfaceName })}\n${aliases}`);
    }

    const baseInterface = generateTypes(base, {
        ...GENERATE_OPTIONS,
        interfaceName: `${interfaceName}Base`,
    });

    let mainInterface: string;
    if (groupKeys.length > 0) {
        mainInterface = generateTypes(groups, { ...GENERATE_OPTIONS, interfaceName }).replace(
            `export interface ${interfaceName} {`,
            `export interface ${interfaceName} extends ${interfaceName}Base {`
        );
    } else {
        mainInterface = `export interface ${interfaceName} extends ${interfaceName}Base {}\n`;
    }

    return wrap(`${baseInterface}\n${mainInterface}\n${aliases}`);
}

/** Render every config type file, keyed by scope name. */
export function renderAllConfigTypes(
    scopes: ConfigScopes,
    options: GenerateTypesOptions = {}
): Record<string, string> {
    return Object.fromEntries(
        Object.entries(scopes).map(([scopeName, scope]) => [
            scopeName,
            renderConfigTypes(
                scopeName,
                resolveScopeSchema(scope.jsonSchema, scope.zodSchema),
                options
            ),
        ])
    );
}

/** Generate the config type files into `outputDir`. Returns the paths written. */
export function generateConfigTypes(
    scopes: ConfigScopes,
    options: GenerateTypesOptions & { outputDir: string }
): string[] {
    const extension = options.extension ?? 'ts';
    const written: string[] = [];
    for (const [scopeName, content] of Object.entries(renderAllConfigTypes(scopes, options))) {
        const file = path.join(options.outputDir, `${scopeName}.${extension}`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content, 'utf-8');
        written.push(file);
    }
    return written;
}
