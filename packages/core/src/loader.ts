import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    CONFIG_FILE_NAMES,
    type DbxConfig,
    type ProjectType,
    type Replacements,
    resolveTokens,
    type ToolingConfig,
} from '@deltabox/toolchain-shared';

import { resolveProjectType } from './project-type.js';

/** A loaded tooling config plus its resolved path + replacement tokens. */
export interface LoadedConfig {
    config: ToolingConfig;
    /** The config file that was loaded (undefined when none was found). */
    path?: string;
    tokens: Replacements;
    /** The resolved project kind. */
    projectType: ProjectType;
}

/** Find the first `dbx.config.*` file at `cwd`, if any. */
export function findConfigFile(cwd: string = process.cwd()): string | undefined {
    for (const name of CONFIG_FILE_NAMES) {
        const file = path.resolve(cwd, name);
        if (fs.existsSync(file)) return file;
    }
    return undefined;
}

/** Import a config module: JSON natively, TS/JS via dynamic import (tsx fallback). */
async function importModule(file: string): Promise<unknown> {
    if (file.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
    const url = pathToFileURL(file).href;
    try {
        const mod = (await import(url)) as { default?: unknown };
        return mod.default ?? mod;
    } catch (error) {
        // Node can import TS directly in recent versions; fall back to tsx.
        try {
            const { tsImport } = await import('tsx/esm/api');
            const mod = (await tsImport(url, import.meta.url)) as { default?: unknown };
            return mod.default ?? mod;
        } catch {
            throw error;
        }
    }
}

/**
 * Load the tooling config for a project. A `dbx.config.*` file exports
 * `{ toolchain: { ...sections } }`; the `toolchain` value is unwrapped here so
 * the rest of the toolchain works with flat sections. When no config file (or no
 * `toolchain` key) exists an empty config is returned (so every task falls back
 * to its defaults).
 */
export async function loadToolingConfig(cwd: string = process.cwd()): Promise<LoadedConfig> {
    const file = findConfigFile(cwd);
    let config: ToolingConfig = {};
    if (file) {
        const loaded = await importModule(file);
        const toolchain =
            loaded && typeof loaded === 'object' ? (loaded as DbxConfig).toolchain : undefined;
        if (toolchain && typeof toolchain === 'object') config = toolchain;
    }
    const tokens = resolveTokens(config);
    await config.hooks?.afterLoad?.({ cwd, config, tokens, ...(file ? { path: file } : {}) });
    return {
        config,
        ...(file ? { path: file } : {}),
        tokens,
        projectType: resolveProjectType(cwd, config),
    };
}
