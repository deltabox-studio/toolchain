/**
 * Create a starter config file.
 *
 * The output format is inferred from the file name (or set explicitly with
 * `type`): `file` (TypeScript/JavaScript `defineConfig`), `json`, `yaml`, `env`
 * (`KEY=value` lines) or `cli` (`--flag=value` lines).
 */

import fs from 'node:fs';
import path from 'node:path';

import { deepMerge } from '@deltabox/toolchain/shared';

/** The config-file formats the scaffold can emit. */
export type ConfigFileType = 'file' | 'json' | 'yaml' | 'env' | 'cli';

/** Options for {@link createConfigFile}. */
export interface CreateConfigFileOptions {
    /** The directory to write the file to (default `process.cwd()`). */
    cwd?: string;
    /** The file name (default `dbx.config.ts`). */
    name?: string;
    /** The output format; inferred from `name` when omitted. */
    type?: ConfigFileType;
    /** Extra import lines (eg. `import { z } from 'zod';`), `file` only. */
    imports?: string[];
    /**
     * The content. A string is written verbatim (for `file` it becomes the
     * `defineConfig` argument); an object is serialized for the chosen format.
     */
    content?: string | Record<string, unknown>;
    /** Values merged under `content` (object content only). */
    defaults?: Record<string, unknown>;
    /** Values merged over `content` (object content only). */
    overrides?: Record<string, unknown>;
    /** Overwrite an existing file (default false). */
    overwrite?: boolean;
    /** The `defineConfig` import specifier (default `@deltabox/toolchain/shared`). */
    defineConfigImport?: string;
}

/** Infer the config-file format from a file name. */
export function inferConfigFileType(name: string): ConfigFileType {
    const base = path.basename(name).toLowerCase();
    if (base === '.env' || base.startsWith('.env.')) return 'env';
    const extension = path.extname(base);
    if (extension === '.json') return 'json';
    if (extension === '.yaml' || extension === '.yml') return 'yaml';
    if (['.sh', '.ps1', '.cmd', '.bat'].includes(extension)) return 'cli';
    return 'file';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

/** Render a JS/TS literal (unquoted identifier keys when possible). */
function toJsLiteral(value: unknown, indent = 0): string {
    const pad = ' '.repeat(indent);
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        const items = value.map(item => `${pad}    ${toJsLiteral(item, indent + 4)},`);
        return `[\n${items.join('\n')}\n${pad}]`;
    }
    if (isPlainObject(value)) {
        const entries = Object.entries(value);
        if (entries.length === 0) return '{}';
        const lines = entries.map(([key, item]) => {
            const rendered = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
            return `${pad}    ${rendered}: ${toJsLiteral(item, indent + 4)},`;
        });
        return `{\n${lines.join('\n')}\n${pad}}`;
    }
    return JSON.stringify(value);
}

function toYamlScalar(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'string') return JSON.stringify(value);
    return JSON.stringify(value);
}

const YAML_KEY_INDICATORS = new Set([
    '-',
    '?',
    ':',
    ',',
    '[',
    ']',
    '{',
    '}',
    '#',
    '&',
    '*',
    '!',
    '|',
    '>',
    "'",
    '"',
    '%',
    '@',
    '`',
]);

const YAML_SCALAR_KEY =
    /^(?:~|null|true|false|yes|no|on|off|\.?nan|[-+]?\.?inf|\d{4}-\d{2}-\d{2}(?:[Tt ].*)?|[+-]?(?:(?:\d[\d_]*\.?[\d_]*|\.[\d_]+)(?:e[+-]?\d+)?|0x[0-9a-f_]+|0o[0-7_]+))$/i;

/** Whether a YAML mapping key needs quoting to stay a plain scalar. */
function needsYamlKeyQuotes(key: string): boolean {
    if (key === '') return true;
    if (key.trim() !== key) return true;
    if (YAML_KEY_INDICATORS.has(key[0]!)) return true;
    if (YAML_SCALAR_KEY.test(key)) return true;
    return key.includes(': ') || key.includes(' #') || key.endsWith(':') || /[\r\n\t]/.test(key);
}

function toYamlKey(key: string): string {
    return needsYamlKeyQuotes(key) ? JSON.stringify(key) : key;
}

/** Render a small YAML document (plain objects, arrays and scalars). */
function toYaml(value: unknown, indent = 0): string {
    const pad = '  '.repeat(indent);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return value
            .map(item => {
                if (isPlainObject(item) || Array.isArray(item)) {
                    return `${pad}-\n${toYaml(item, indent + 1)}`;
                }
                return `${pad}- ${toYamlScalar(item)}`;
            })
            .join('\n');
    }
    if (isPlainObject(value)) {
        const entries = Object.entries(value);
        if (entries.length === 0) return '{}';
        return entries
            .map(([key, item]) => {
                const rendered = toYamlKey(key);
                if (isPlainObject(item) && Object.keys(item).length > 0) {
                    return `${pad}${rendered}:\n${toYaml(item, indent + 1)}`;
                }
                if (Array.isArray(item) && item.length > 0) {
                    return `${pad}${rendered}:\n${toYaml(item, indent + 1)}`;
                }
                if (isPlainObject(item) || Array.isArray(item)) {
                    return `${pad}${rendered}: ${toYaml(item)}`;
                }
                return `${pad}${rendered}: ${toYamlScalar(item)}`;
            })
            .join('\n');
    }
    return toYamlScalar(value);
}

const ENV_KEY = /^[A-Za-z_][A-Za-z0-9_.-]*$/;
const CLI_KEY = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;

/** Render a nested value as a single string (before quoting). */
function scalarText(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map(item => scalarText(item)).join(',');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

function assertSingleLine(text: string): string {
    if (/[\r\n]/.test(text)) throw new Error('Config values cannot contain line breaks.');
    return text;
}

/** Quote an env value so `dotenv` reads it back unchanged. */
function renderEnvValue(value: unknown): string {
    const text = assertSingleLine(scalarText(value));
    if (text === '') return '';
    const needsQuotes = text.trim() !== text || text.includes('#') || /^(['"`]).*\1$/.test(text);
    if (!needsQuotes) return text;
    if (!text.includes("'")) return `'${text}'`;
    if (!text.includes('"') && !/\\[nr]/.test(text)) return `"${text}"`;
    throw new Error(`Config value ${JSON.stringify(text)} cannot be represented in an env file.`);
}

/** Render a CLI value, quoting whitespace for shell safety. */
function renderCliValue(value: unknown): string {
    const text = assertSingleLine(scalarText(value));
    if (text === '') return '';
    if (/\s/.test(text)) {
        if (text.includes('"')) {
            throw new Error(
                `Config value ${JSON.stringify(text)} cannot be represented as a CLI flag.`
            );
        }
        return `"${text}"`;
    }
    return text;
}

/** Render flat `KEY=value` lines. */
function toEnvLines(value: Record<string, unknown>): string {
    return Object.entries(value)
        .map(([key, item]) => {
            if (!ENV_KEY.test(key)) throw new Error(`Invalid env key: ${JSON.stringify(key)}.`);
            return `${key}=${renderEnvValue(item)}`;
        })
        .join('\n');
}

/** Render CLI flag lines (`--flag=value`, bare `--flag` for `true`). */
function toCliLines(value: Record<string, unknown>): string {
    const lines: string[] = [];
    for (const [rawKey, item] of Object.entries(value)) {
        const key = rawKey.replace(/^-+/, '');
        if (!key) throw new Error('CLI flag keys must not be empty.');
        if (!CLI_KEY.test(key)) {
            throw new Error(`Invalid CLI flag key: ${JSON.stringify(rawKey)}.`);
        }
        if (item === false || item === null || item === undefined) continue;
        if (item === true) {
            lines.push(`--${key}`);
            continue;
        }
        for (const entry of Array.isArray(item) ? item : [item]) {
            lines.push(`--${key}=${renderCliValue(entry)}`);
        }
    }
    return lines.join('\n');
}

function mergeContent(
    defaults: Record<string, unknown> | undefined,
    content: Record<string, unknown> | undefined,
    overrides: Record<string, unknown> | undefined
): Record<string, unknown> {
    let merged = defaults ?? {};
    if (content) merged = deepMerge(merged, content);
    if (overrides) merged = deepMerge(merged, overrides);
    return merged;
}

/**
 * Check that scaffold content can be represented consistently in every format.
 * Accepts JSON scalars, `undefined`, `Date`, plain objects and arrays.
 */
function assertSerializable(value: unknown, seen = new Set<object>()): void {
    if (
        value === null ||
        value === undefined ||
        typeof value === 'string' ||
        typeof value === 'boolean'
    )
        return;
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new Error(
                'Scaffold content must be JSON-serializable: non-finite numbers are not supported.'
            );
        }
        return;
    }
    if (value instanceof Date) return;
    if (typeof value !== 'object') {
        throw new Error(
            `Scaffold content must be JSON-serializable: ${typeof value} values are not supported.`
        );
    }
    if (seen.has(value)) {
        throw new Error(
            'Scaffold content must be JSON-serializable: circular references are not supported.'
        );
    }
    seen.add(value);
    if (Array.isArray(value)) {
        for (const item of value) assertSerializable(item, seen);
    } else if (isPlainObject(value)) {
        for (const item of Object.values(value)) assertSerializable(item, seen);
    } else {
        throw new Error(
            'Scaffold content must be JSON-serializable: only plain objects, arrays, dates and JSON values are supported.'
        );
    }
    seen.delete(value);
}

function defaultValue(type: ConfigFileType): string {
    if (type === 'file') return '{ toolchain: {} }';
    if (type === 'json' || type === 'yaml') return '{}';
    return '';
}

const CONFIG_FILE_TYPES = new Set<ConfigFileType>(['file', 'json', 'yaml', 'env', 'cli']);

/** Normalize a runtime `type` option (case-insensitive) or reject it. */
function normalizeConfigType(value: unknown): ConfigFileType {
    if (typeof value === 'string') {
        const normalized = value.toLowerCase() as ConfigFileType;
        if (CONFIG_FILE_TYPES.has(normalized)) return normalized;
    }
    throw new Error(`Unknown config file type: ${JSON.stringify(value)}.`);
}

function serialize(type: ConfigFileType, value: Record<string, unknown>): string {
    switch (type) {
        case 'json':
            return JSON.stringify(value, null, 4);
        case 'yaml':
            return toYaml(value);
        case 'env':
            return toEnvLines(value);
        case 'cli':
            return toCliLines(value);
        default:
            return toJsLiteral(value);
    }
}

/** Create a config file and return its absolute path. */
export function createConfigFile(options: CreateConfigFileOptions = {}): string {
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const name = (options.name ?? 'dbx.config.ts').trim();
    if (!name || name === '.' || name === '..') {
        throw new Error('Config file name must be a file name, not a directory.');
    }
    const file = path.resolve(cwd, name);
    const relative = path.relative(cwd, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Config file must stay inside ${cwd} (got ${file}).`);
    }
    if (file === cwd || (fs.existsSync(file) && fs.statSync(file).isDirectory())) {
        throw new Error(`Config target is a directory: ${file}`);
    }
    if (fs.existsSync(file) && options.overwrite !== true) {
        throw new Error(`Config file already exists: ${file}`);
    }
    const type = normalizeConfigType(options.type ?? inferConfigFileType(name));
    const raw = typeof options.content === 'string' ? options.content.trim() : undefined;
    const objectContent = typeof options.content === 'string' ? undefined : options.content;
    const hasObject =
        objectContent !== undefined ||
        options.defaults !== undefined ||
        options.overrides !== undefined;
    let body: string;
    if (raw) {
        body = raw;
    } else if (hasObject) {
        if (objectContent) assertSerializable(objectContent);
        if (options.defaults) assertSerializable(options.defaults);
        if (options.overrides) assertSerializable(options.overrides);
        body = serialize(type, mergeContent(options.defaults, objectContent, options.overrides));
    } else {
        body = defaultValue(type);
    }
    const source = buildSource(type, body, options);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, source, 'utf-8');
    return file;
}

/** Wrap the serialized body for the chosen format. */
function buildSource(type: ConfigFileType, body: string, options: CreateConfigFileOptions): string {
    if (type === 'file') {
        const specifier = options.defineConfigImport ?? '@deltabox/toolchain/shared';
        if (specifier.trim() === '' || /['\r\n]/.test(specifier)) {
            throw new Error('`defineConfigImport` must be a non-empty module specifier.');
        }
        const imports = [
            `import { defineConfig } from '${specifier}';`,
            ...(options.imports ?? []),
        ];
        return `${imports.join('\n')}\n\nexport default defineConfig(${body});\n`;
    }
    if (type === 'json') return `${body}\n`;
    if (body.length === 0) return '';
    return `${body}\n`;
}
