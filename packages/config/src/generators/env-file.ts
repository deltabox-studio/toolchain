/**
 * `.env` file generation from the collected config vars.
 */

import { collectDefinitions, DEFAULT_ENV_PREFIX, pathOf } from '../collect.js';
import type { ConfigDef, ConfigSchema, GenerateEnvFileOptions } from '../types/index.js';

/** Kinds that cannot be expressed as a single env value. */
const COMPLEX_KINDS = new Set(['object', 'record', 'map', 'set', 'tuple', 'unknown', 'any']);

/** The env name for a definition: its explicit name or the path convention. */
export function envNameOf(def: ConfigDef, envPrefix: string): string {
    if (def.name) return def.name;
    return `${envPrefix}${pathOf(def).replace(/\./g, '_').toUpperCase()}`;
}

/**
 * Whether a definition can be read from / written to an env var. Complex kinds
 * are never env-addressable, even when they carry an explicit `envName`: their
 * values cannot be represented and parsed back as a single env string.
 */
export function isEnvVariable(def: ConfigDef): boolean {
    if (def.meta?.envExpose === false) return false;
    return !COMPLEX_KINDS.has(def.kind ?? '');
}

function formatDefaultValue(def: ConfigDef): string {
    const value = def.default;
    if (Array.isArray(value)) return value.join(',');
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return value === undefined ? '' : String(value);
}

/**
 * Quote an env value so `dotenv` reads it back unchanged. Single quotes accept
 * `#`, spaces, double quotes and line breaks; double quotes cover a value that
 * contains a single quote. Anything with both quote kinds (or a single quote and
 * a line break) cannot be represented and is rejected explicitly.
 */
export function quoteEnvValue(value: string): string {
    if (value === '') return '';
    const needsQuotes = value.trim() !== value || /[#"'`\r\n]/.test(value);
    if (!needsQuotes) return value;
    if (!value.includes("'")) return `'${value}'`;
    if (!value.includes('"') && !/[\r\n]/.test(value)) return `"${value}"`;
    throw new Error(`Config value ${JSON.stringify(value)} cannot be represented in an env file.`);
}

/**
 * Generate `.env` content from the config schemas. Secrets and required-without-
 * default vars are emitted blank so operators fill them in.
 */
export function generateEnvFile(schema: ConfigSchema, options: GenerateEnvFileOptions = {}): string {
    const envPrefix = options.envPrefix ?? DEFAULT_ENV_PREFIX;
    const sep = options.scopeSeparator ?? '----';
    const vars = collectDefinitions(schema, { envPrefix, envPathOf: options.envPathOf }).filter(
        isEnvVariable
    );
    const scopeNames = options.scopes ?? [...new Set(vars.map(def => def.scope))];
    const filtered = vars.filter(def => {
        const name = envNameOf(def, envPrefix);
        return (
            scopeNames.includes(def.scope) &&
            (!options.include || options.include.includes(name)) &&
            !options.exclude?.includes(name)
        );
    });

    const lines: string[] = [];
    if (options.header) lines.push(options.header, '');

    let lastScope: string | undefined;
    for (const def of filtered) {
        const name = envNameOf(def, envPrefix);
        if (def.scope !== lastScope) {
            if (lastScope !== undefined) lines.push('');
            lines.push(`# ${sep} ${def.scope.toUpperCase()} ${sep}`);
            lastScope = def.scope;
        }
        if (!options.bare && def.description) {
            for (const descLine of def.description.split('\n')) lines.push(`# ${descLine}`);
        }
        const override = options.values?.[name];
        if (def.secret && override === undefined) {
            lines.push(`# ${name}=`);
        } else {
            lines.push(`${name}=${quoteEnvValue(override ?? formatDefaultValue(def))}`);
        }
    }
    if (options.extra) {
        const extra = Object.entries(options.extra)
            .filter(([name]) => !filtered.some(def => envNameOf(def, envPrefix) === name))
            .map(([name, value]) => `${name}=${value}`);
        if (extra.length) {
            lines.push('', `# ${sep} EXTRA ${sep}`, ...extra);
        }
    }
    const content = `${lines.join('\n')}\n`;
    return options.onContent?.(content) ?? content;
}
