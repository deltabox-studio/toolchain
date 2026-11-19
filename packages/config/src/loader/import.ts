/**
 * Module importing for config files.
 *
 * JSON is parsed directly. JS is imported natively. TypeScript is imported
 * natively first (Node >= 22.5 strips types) and only falls back to an installed
 * transpiler (`tsx`, then `jiti`) when Node cannot load/resolve the module -
 * the fallback honours the project tsconfig so `.js` -> `.ts` specifiers and
 * path aliases resolve.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

import type { LoaderExtension } from '../types/loader.js';
import { shouldFallbackToTsx } from './tsconfig.js';

/** The loader kind for a file extension. */
export function extensionKind(file: string): LoaderExtension | undefined {
    const extension = file.slice(file.lastIndexOf('.')).toLowerCase();
    if (['.ts', '.mts', '.cts', '.tsx'].includes(extension)) return 'ts';
    if (['.js', '.mjs', '.cjs', '.jsx'].includes(extension)) return 'js';
    if (['.yaml', '.yml'].includes(extension)) return 'yaml';
    if (extension === '.json') return 'json';
    return undefined;
}

/** Options for {@link importModule}. */
export interface ImportModuleOptions {
    fresh?: boolean;
    /** The tsconfig to resolve the module with (`false` = no tsconfig). */
    tsconfig?: string | false;
}

/** Parse a JSON file, stripping a UTF-8 BOM. */
export function parseJson(file: string): unknown {
    return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
}

/**
 * Resolve a YAML parser from an installed module. `yaml` exports `parse`;
 * `js-yaml` v4 exports `load`/`safeLoad` (CJS interop may put them under
 * `default`).
 */
function yamlParser(mod: unknown): ((value: string) => unknown) | undefined {
    const candidates = [mod, (mod as { default?: unknown } | undefined)?.default];
    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object') continue;
        for (const key of ['parse', 'load', 'safeLoad'] as const) {
            const fn = (candidate as Record<string, unknown>)[key];
            if (typeof fn === 'function') return fn as (value: string) => unknown;
        }
    }
    return undefined;
}

/** Parse a YAML file through an installed `yaml`/`js-yaml`. */
export function parseYamlSync(file: string): unknown {
    const source = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
    const require = createRequire(import.meta.url);
    for (const name of ['yaml', 'js-yaml']) {
        try {
            const parse = yamlParser(require(name));
            if (parse) return parse(source);
        } catch {
            // try the next installed YAML parser
        }
    }
    throw new Error(
        `Cannot parse YAML config ${file}; install \`yaml\` or \`js-yaml\` or pass a custom loader.`
    );
}

/** Async variant of {@link parseYamlSync}. */
export async function parseYamlAsync(file: string): Promise<unknown> {
    const source = fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, '');
    for (const name of ['yaml', 'js-yaml']) {
        const mod = await import(name).catch(() => undefined);
        const parse = yamlParser(mod);
        if (parse) return parse(source);
    }
    throw new Error(
        `Cannot parse YAML config ${file}; install \`yaml\` or \`js-yaml\` or pass a custom loader.`
    );
}

/**
 * Unwrap a module's default export. `tsx`'s CJS interop can report the default
 * once or twice (`{ default: X }` / `{ default: { default: X } }`), depending on
 * the Node/module combination.
 */
export function unwrapDefault(mod: unknown): unknown {
    let value = mod;
    for (let depth = 0; depth < 3; depth++) {
        if (value && typeof value === 'object' && 'default' in value) {
            const keys = Object.keys(value);
            if (
                keys.every(
                    key => key === 'default' || key === 'module.exports' || key === '__esModule'
                )
            ) {
                value = (value as { default: unknown }).default;
                continue;
            }
        }
        break;
    }
    return value;
}

interface TsxApi {
    tsImport?: (url: string, options?: unknown) => Promise<unknown>;
}

/** Load the installed `tsx` API, if any. The specifier stays dynamic (env-overridable). */
async function loadTsx(): Promise<TsxApi | undefined> {
    const name = process.env.DBX_TS_LOADER ?? 'tsx/esm/api';
    const mod = (await import(name).catch(() => undefined)) as TsxApi | undefined;
    return mod && typeof mod.tsImport === 'function' ? mod : undefined;
}

interface JitiApi {
    createJiti?: (url: string) => { import: (file: string) => Promise<unknown> };
}

/** Load the installed `jiti` API, if any. The specifier stays dynamic (env-overridable). */
async function loadJiti(): Promise<JitiApi | undefined> {
    const name = process.env.DBX_JITI_LOADER ?? 'jiti';
    const mod = (await import(name).catch(() => undefined)) as JitiApi | undefined;
    return mod && typeof mod.createJiti === 'function' ? mod : undefined;
}

let importNonce = 0;

/**
 * Import a config module with the best available strategy.
 *
 * `fresh` drops the CJS require cache and appends a unique query to the ESM URL
 * so long-running callers (`dbx watch`) observe an edited config.
 */
export async function importModule(
    file: string,
    options: ImportModuleOptions = {}
): Promise<unknown> {
    const { fresh = false, tsconfig } = options;
    if (file.endsWith('.json')) return parseJson(file);
    if (fresh) {
        // A `.cjs` config is loaded through Node's require cache even from
        // `import()`, so drop it before re-evaluating.
        try {
            delete createRequire(import.meta.url).cache[file];
        } catch {
            // not a require-cached module
        }
    }
    const base = pathToFileURL(file).href;
    const url = fresh ? `${base}?dbx=${Date.now()}-${++importNonce}` : base;
    let mod: { default?: unknown };
    try {
        mod = (await import(url)) as { default?: unknown };
    } catch (error) {
        // Node can import TS directly in recent versions; only reach for a
        // transpiler when it genuinely cannot (see `shouldFallbackToTsx`) or a
        // relative `.js` -> `.ts`/tsconfig alias needs it. A genuine failure (an
        // unresolvable import, a throw during evaluation) must propagate.
        if (!shouldFallbackToTsx(error, file, tsconfig)) throw error;
        const tsx = await loadTsx();
        if (tsx?.tsImport) {
            const tsxOptions =
                tsconfig === undefined ? import.meta.url : { parentURL: import.meta.url, tsconfig };
            return unwrapDefault(await tsx.tsImport(url, tsxOptions));
        }
        const jiti = await loadJiti();
        if (jiti?.createJiti) {
            return unwrapDefault(await jiti.createJiti(import.meta.url).import(file));
        }
        throw error;
    }
    // `'default' in mod` (not `??`) so a `null`/`undefined` default export is
    // preserved instead of falling back to the module namespace.
    return 'default' in mod ? mod.default : mod;
}
