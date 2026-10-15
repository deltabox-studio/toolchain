/**
 * Config markdown generator. Renders one reference file per scope (base +
 * grouped configs) plus an index that lists the required + core configs.
 */

import fs from 'node:fs';
import path from 'node:path';

import type { Schema } from 'untyped';
import type { ZodType } from 'zod';

import { titleCase } from '@deltabox/toolchain-shared';

import { type CollectEnvVarsOptions, collectEnvVars, DEFAULT_ENV_PREFIX } from '../collect.js';
import { splitBaseSchema, zodToJsonSchema } from '../schema.js';
import type { ConfigScopes } from '../types.js';
import { type CliFlagOptions, cliFlagLabel } from './cli.js';

export interface RenderMarkdownOptions {
    /** Output directory. When omitted, nothing is written. */
    outDir?: string;
    /** Page outline (defaults to `[2, 3, 4]`). */
    outline?: number[];
    /** The base group hoisted out of the nested groups (default `base`). */
    baseGroup?: string;
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
    envPathOf?: CollectEnvVarsOptions['envPathOf'];
}

export interface GenerateMarkdownOptions extends RenderMarkdownOptions {
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
    tsType?: string;
    secret?: boolean;
    public?: boolean;
}

interface RenderOptions extends CliFlagOptions {
    useFlags?: boolean;
    baseGroup: string;
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
    if (schema.env) lines.push(`- **Env**: \`${schema.env}\``);
    lines.push(
        `- **Type**: \`${
            schema.tsType ??
            (Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type) ??
            'any'
        }\``
    );
    if (schema.default !== undefined)
        lines.push(`- **Default**: \`${JSON.stringify(schema.default)}\``);
    if (schema.description) lines.push('', schema.description);
    return lines;
}

function renderFields(schema: SchemaNode, level: string, opts: RenderOptions): string[] {
    const lines: string[] = [];
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
        const title = opts.useFlags && child.env ? cliFlagLabel(child.env, opts) : `\`${key}\``;
        lines.push('', ...renderNode(child, title, level, opts));
    }
    return lines;
}

/** Render the markdown reference for a single scope (base + grouped configs). */
export function renderScopeMarkdown(
    scope: string,
    schema: Schema,
    options: RenderMarkdownOptions = {}
): string {
    const outline = options.outline ?? [2, 3, 4];
    const opts: RenderOptions = {
        useFlags: scope === (options.cliScope ?? 'cli'),
        baseGroup: options.baseGroup ?? 'base',
        ...(options.envPrefix ? { envPrefix: options.envPrefix } : {}),
        ...(options.shortFlags ? { shortFlags: options.shortFlags } : {}),
    };
    const { base, groups } = splitBaseSchema(schema, opts.baseGroup);
    const parts: string[] = [
        '---',
        `title: ${titleCase(scope)} Configuration`,
        `outline: ${JSON.stringify(outline)}`,
        '---',
        '',
        `# ${titleCase(scope)} Configuration`,
        '',
        'Every setting below is configured through an environment variable.',
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
export function renderConfigIndex(
    scopes: ConfigScopes,
    options: RenderMarkdownOptions = {}
): string {
    const outline = options.outline ?? [2, 3, 4];
    const baseGroup = options.baseGroup ?? 'base';
    const labels = options.labels ?? {};
    const required: EnvVarRow[] = [];
    const core: EnvVarRow[] = [];

    for (const [scopeName, scope] of Object.entries(scopes)) {
        const schema = (scope.jsonSchema ?? zodToJsonSchema(scope.zodSchema)) as Schema;
        collectSchemaEnvVars(splitBaseSchema(schema, baseGroup).base, scopeName, core);
    }
    for (const def of collectEnvVars(scopes, options.envPrefix ?? DEFAULT_ENV_PREFIX, {
        envPathOf: options.envPathOf,
    })) {
        if (def.required) {
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

    return `---
title: ${title}
outline: ${JSON.stringify(outline)}
---

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

/** Generate the markdown reference (per-scope files + index) into `outDir`. */
export function generateConfigMarkdown(
    scopes: ConfigScopes,
    options: GenerateMarkdownOptions & { outDir: string }
): string[] {
    const outline = options.outline ?? [2, 3, 4];
    const files: [string, string][] = Object.entries(scopes).map(([scopeName, scope]) => [
        path.resolve(options.outDir, `${scopeName}.md`),
        renderScopeMarkdown(
            scopeName,
            (scope.jsonSchema ?? zodToJsonSchema(scope.zodSchema)) as Schema,
            { ...options, outline }
        ),
    ]);
    files.push([
        path.resolve(options.outDir, options.indexFilename ?? 'index.md'),
        renderConfigIndex(scopes, { ...options, outline }),
    ]);

    for (const [filePath, content] of files) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content, 'utf-8');
    }
    return files.map(([filePath]) => filePath);
}

/** A section of a config-file reference (its key + options schema). */
export interface ConfigFileSection {
    /** The config key, eg. `project`. */
    key: string;
    /** A short description shown under the heading. */
    description?: string;
    /** The section's options-object schema. */
    schema: ZodType;
}

export interface RenderConfigFileOptions {
    /** Document title (default `Configuration`). */
    title?: string;
    /** Intro paragraph under the title. */
    intro?: string;
    /** Page outline (default `[2, 3, 4]`). */
    outline?: number[];
}

/**
 * Render a single markdown reference for a config **file** (no environment-var
 * language): one `## \`key\`` section per schema, with its fields, types,
 * defaults and descriptions. This is what a `dbx.config.ts`-style
 * reference is generated from.
 */
export function renderConfigFileMarkdown(
    sections: ConfigFileSection[],
    options: RenderConfigFileOptions = {}
): string {
    const opts: RenderOptions = { baseGroup: 'base' };
    const title = options.title ?? 'Configuration';
    const parts: string[] = [
        '---',
        `title: ${title}`,
        `outline: ${JSON.stringify(options.outline ?? [2, 3, 4])}`,
        '---',
        '',
        `# ${title}`,
        '',
    ];
    if (options.intro) parts.push(options.intro, '');
    for (const section of sections) {
        parts.push(`## \`${section.key}\``, '');
        if (section.description) parts.push(section.description, '');
        const schema = zodToJsonSchema(section.schema) as unknown as SchemaNode;
        parts.push(...renderFields(schema, '###', opts), '');
    }
    return `${parts.join('\n').trim()}\n`;
}
