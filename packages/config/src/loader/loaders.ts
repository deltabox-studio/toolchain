/** Custom loader selection and invocation. */

import { createRequire } from 'node:module';

import type { LoaderConfig, LoaderExtension, LoaderSetting, LoaderValue } from './types.js';

/** Whether a value is a promise-like. */
export function isPromise(value: unknown): value is Promise<unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        typeof (value as { then?: unknown }).then === 'function'
    );
}

/** The loader setting that applies to a file's extension. */
export function selectLoader(
    setting: LoaderSetting | LoaderSetting[] | undefined,
    extension: LoaderExtension | undefined
): LoaderValue | undefined {
    if (setting === undefined) return undefined;
    const list = Array.isArray(setting) ? setting : [setting];
    for (const entry of list) {
        if (typeof entry === 'function' || typeof entry === 'string') return entry;
        if (!entry || typeof entry !== 'object') continue;
        if ('name' in entry || 'loader' in entry) return entry as LoaderConfig;
        if (extension && extension in entry) {
            const selected = (entry as Partial<Record<LoaderExtension, LoaderValue>>)[extension];
            if (selected !== undefined) return selected;
        }
    }
    return undefined;
}

/** Unwrap a loader module's default/named function export. */
export function moduleLoader(mod: unknown): LoaderValue | undefined {
    const value = (mod as { default?: unknown } | undefined)?.default ?? mod;
    return typeof value === 'function' ? (value as LoaderValue) : undefined;
}

function requireLoader(name: string): LoaderValue | undefined {
    try {
        const require = createRequire(import.meta.url);
        return moduleLoader(require(name));
    } catch {
        return undefined;
    }
}

async function importLoader(name: string): Promise<LoaderValue | undefined> {
    try {
        return moduleLoader(await import(name));
    } catch {
        return undefined;
    }
}

/** The options a loader config forwards to its loader. */
export function loaderOptions(setting: LoaderValue): Record<string, unknown> | undefined {
    return typeof setting === 'object' && !Array.isArray(setting)
        ? (setting as LoaderConfig).options
        : undefined;
}

/** The module name a loader setting names. */
export function loaderName(setting: LoaderValue): string | undefined {
    return typeof setting === 'string'
        ? setting
        : typeof setting === 'object' && !Array.isArray(setting)
          ? ((setting as LoaderConfig).name ?? (setting as LoaderConfig).loader)
          : undefined;
}

/** Invoke a loader synchronously (a promise result is rejected). */
export function invokeSyncLoader(file: string, setting: LoaderValue): unknown {
    if (typeof setting === 'function') {
        const value = setting(file);
        if (isPromise(value)) {
            throw new Error(
                `The custom loader returned a promise for ${file}; use \`loadConfigAsync\`.`
            );
        }
        return value;
    }
    const name = loaderName(setting);
    if (!name) throw new Error(`Invalid loader for ${file}.`);
    const loader = requireLoader(name);
    if (!loader) {
        throw new Error(`Cannot load the \`${name}\` loader synchronously for ${file}.`);
    }
    const value =
        typeof loader === 'function'
            ? loader(file, loaderOptions(setting))
            : loaderOptions(setting);
    if (isPromise(value)) {
        throw new Error(
            `The custom loader returned a promise for ${file}; use \`loadConfigAsync\`.`
        );
    }
    return value;
}

/** Invoke a loader asynchronously. */
export async function invokeAsyncLoader(file: string, setting: LoaderValue): Promise<unknown> {
    if (typeof setting === 'function') return setting(file);
    const name = loaderName(setting);
    if (!name) throw new Error(`Invalid loader for ${file}.`);
    const loader = await importLoader(name);
    if (!loader) throw new Error(`Cannot load the \`${name}\` loader for ${file}.`);
    return typeof loader === 'function'
        ? loader(file, loaderOptions(setting))
        : loaderOptions(setting);
}
