/**
 * `.env` file generation from the collected env vars.
 */

import { type CollectEnvVarsOptions, collectEnvVars, DEFAULT_ENV_PREFIX } from './collect.js';
import type { ConfigScopes, EnvVarDef } from './types.js';

export interface EnvFileOptions {
    /** Env vars to include (defaults to all). */
    include?: string[];
    /** Env vars to exclude. */
    exclude?: string[];
    /** Default values to inject (overrides the schema defaults). */
    values?: Record<string, string>;
    /** Comment banner placed at the top of the file. */
    header?: string;
    /** Only emit these scopes (defaults to every registered scope). */
    scopes?: string[];
    /** The env-var prefix (default `APP_`). */
    envPrefix?: string;
    /** Omit descriptions (emit bare assignments). */
    bare?: boolean;
    /** Extra raw `NAME=value` lines appended after the schema vars. */
    extra?: Record<string, string>;
    /** The characters wrapping a scope's section header (default `----`). */
    scopeSeparator?: string;
    /** Custom env-name -> dotted-path derivation. */
    envPathOf?: CollectEnvVarsOptions['envPathOf'];
}

function formatDefaultValue(def: EnvVarDef): string {
    const value = def.default;
    if (Array.isArray(value)) return value.join(',');
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object' && value !== null) return JSON.stringify(value);
    return value === undefined ? '' : String(value);
}

/**
 * Generate `.env` content from the config schemas. Secrets and required-without-
 * default vars are emitted blank so operators fill them in.
 */
export function generateEnvFile(scopes: ConfigScopes, options: EnvFileOptions = {}): string {
    const envPrefix = options.envPrefix ?? DEFAULT_ENV_PREFIX;
    const sep = options.scopeSeparator ?? '----';
    const vars = collectEnvVars(scopes, envPrefix, { envPathOf: options.envPathOf });
    const scopeNames = options.scopes ?? Object.keys(scopes);
    const filtered = vars.filter(
        def =>
            scopeNames.includes(def.scope) &&
            (!options.include || options.include.includes(def.name)) &&
            !options.exclude?.includes(def.name)
    );

    const lines: string[] = [];
    if (options.header) lines.push(options.header, '');

    let lastScope: string | undefined;
    for (const def of filtered) {
        if (def.scope !== lastScope) {
            if (lastScope !== undefined) lines.push('');
            lines.push(`# ${sep} ${def.scope.toUpperCase()} ${sep}`);
            lastScope = def.scope;
        }
        if (!options.bare && def.description) {
            for (const descLine of def.description.split('\n')) lines.push(`# ${descLine}`);
        }
        const override = options.values?.[def.name];
        if (def.secret && override === undefined) {
            lines.push(`# ${def.name}=`);
        } else {
            lines.push(`${def.name}=${override ?? formatDefaultValue(def)}`);
        }
    }
    if (options.extra) {
        const extra = Object.entries(options.extra)
            .filter(([name]) => !filtered.some(def => def.name === name))
            .map(([name, value]) => `${name}=${value}`);
        if (extra.length) {
            lines.push('', `# ${sep} EXTRA ${sep}`, ...extra);
        }
    }
    return `${lines.join('\n')}\n`;
}
