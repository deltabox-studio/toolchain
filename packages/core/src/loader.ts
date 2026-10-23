import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    CONFIG_FILE_NAMES,
    deepMerge,
    type DbxConfig,
    type PackageJson,
    type ProjectType,
    projectFromPackageJson,
    readJsonAt,
    type Replacements,
    resolveTokens,
    type ToolchainConfig,
} from '@deltabox/toolchain-shared';

import { resolveProjectType } from './project-type.js';

/** A loaded tooling config plus its resolved path + replacement tokens. */
export interface LoadedConfig {
    config: ToolchainConfig;
    /** The config file that was loaded (undefined when none was found). */
    path?: string;
    /** The inherited ancestor config, when the loaded config overrides one. */
    parentPath?: string;
    tokens: Replacements;
    /** The resolved project kind. */
    projectType: ProjectType;
    /**
     * Set when a `dbx.config.*` file could not be imported (in tolerant mode):
     * the config fell back to an empty/parent config so unrelated commands
     * (eg. `template:list`, `providers`) still work.
     */
    error?: string;
}

export interface LoadToolchainConfigOptions {
    /**
     * Never throw when a config file fails to import: fall back to an
     * empty/parent config and record {@link LoadedConfig.error} instead. Used by
     * the CLI so a broken config does not take down unrelated commands (and the
     * VS Code tree views that drive them). Default: `false` (throw).
     */
    tolerant?: boolean;
}

/** A short, single-line description of a thrown config error. */
function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Find the first `dbx.config.*` file at `cwd`, if any. */
export function findConfigFile(cwd: string = process.cwd()): string | undefined {
    for (const name of CONFIG_FILE_NAMES) {
        const file = path.resolve(cwd, name);
        if (fs.existsSync(file)) return file;
    }
    return undefined;
}

/**
 * Find the nearest ancestor `dbx.config.*` above `cwd` (never `cwd` itself).
 * The walk stops at a repository boundary (a `.git` directory) or the
 * filesystem root, so a nested project cannot inherit a config from outside its
 * repository.
 */
export function findParentConfigFile(cwd: string = process.cwd()): string | undefined {
    const root = path.resolve(cwd);
    // A repository root has no ancestor config to inherit (its own `.git` marks
    // the boundary), so never walk above it.
    if (fs.existsSync(path.join(root, '.git'))) return undefined;
    let dir = path.dirname(root);
    for (;;) {
        const file = findConfigFile(dir);
        if (file) return file;
        if (fs.existsSync(path.join(dir, '.git'))) return undefined;
        const parent = path.dirname(dir);
        if (parent === dir) return undefined;
        dir = parent;
    }
}

/** Import a config module: JSON natively, TS/JS via dynamic import (tsx fallback). */
async function importModule(file: string): Promise<unknown> {
    if (file.endsWith('.json')) {
        // Strip a UTF-8 BOM: editors/PowerShell often write one, and JSON.parse
        // rejects it (the other JSON readers in the toolchain strip it too).
        return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
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

/** Read the `toolchain` section out of a config module. */
async function readToolchainConfig(file: string): Promise<ToolchainConfig> {
    const loaded = await importModule(file);
    const toolchain =
        loaded && typeof loaded === 'object' ? (loaded as DbxConfig).toolchain : undefined;
    return toolchain && typeof toolchain === 'object' ? toolchain : {};
}

/** `project` fields that are per-project identity and are never inherited. */
const PROJECT_IDENTITY_KEYS = new Set(['name', 'scope', 'description', 'type']);

/**
 * Merge an ancestor config under a project's own config. Nested objects are
 * merged, while leaves (booleans, strings, numbers, arrays) in the child
 * **replace** the ancestor's value — so a non-root `dbx.config` can override
 * individual options of the root config (and keep the rest).
 *
 * `project` is inherited **except the identity fields** (`name`, `scope`,
 * `description`, `type`): a workspace keeps its own name/description (or falls
 * back to its `package.json`), and is still detected from its own files — so a
 * root `project` never renames a workspace. The shared fields (author, license,
 * homepage, `repo`, `packageManager`, ...) flow down. `project.inherit: false`
 * disables project inheritance entirely. `hooks` are **not** inherited either —
 * a parent's hooks are code and must not run for a nested project's sync.
 */
export function mergeToolchainConfig(
    parent: ToolchainConfig,
    child: ToolchainConfig
): ToolchainConfig {
    const { hooks: _hooks, project: parentProject, ...parentRest } = parent;
    let base = parentRest as ToolchainConfig;
    if (child.project?.inherit !== false && parentProject) {
        const shared = Object.fromEntries(
            Object.entries(parentProject).filter(([key]) => !PROJECT_IDENTITY_KEYS.has(key))
        );
        if (Object.keys(shared).length > 0) {
            base = { ...parentRest, project: shared } as ToolchainConfig;
        }
    }
    return deepMerge(base, child) as ToolchainConfig;
}

/**
 * Load the tooling config for a project. A `dbx.config.*` file exports
 * `{ toolchain: { ...sections } }`; the `toolchain` value is unwrapped here so
 * the rest of the toolchain works with flat sections. When the project is
 * nested, the nearest ancestor `dbx.config.*` is loaded first and the project's
 * own config is merged on top (see {@link mergeToolchainConfig}). When no config
 * file (or no `toolchain` key) exists an empty config is returned (so every task
 * falls back to its defaults).
 */
export async function loadToolchainConfig(
    cwd: string = process.cwd(),
    options: LoadToolchainConfigOptions = {}
): Promise<LoadedConfig> {
    const file = findConfigFile(cwd);
    const parentFile = findParentConfigFile(cwd);
    const tolerant = options.tolerant ?? false;

    let config: ToolchainConfig = {};
    let error: string | undefined;
    if (parentFile) {
        try {
            config = await readToolchainConfig(parentFile);
        } catch (cause) {
            if (!tolerant) throw cause;
            error = `failed to load ${parentFile}: ${errorMessage(cause)}`;
        }
    }
    if (file) {
        try {
            const own = await readToolchainConfig(file);
            // Merge over the ancestor only when it actually loaded; otherwise the
            // project's own config stands alone.
            config = parentFile && !error ? mergeToolchainConfig(config, own) : own;
        } catch (cause) {
            if (!tolerant) throw cause;
            error = `failed to load ${file}: ${errorMessage(cause)}`;
        }
    }

    // When a `project` field is not defined, fall back to the project's own
    // `package.json` value (so tokens are correct without a config).
    const pkg = readJsonAt<PackageJson>(cwd, 'package.json');
    const project = {
        ...(pkg ? projectFromPackageJson(pkg) : undefined),
        ...(config.project ?? undefined),
    };
    const tokens = resolveTokens({ ...config, project });
    await config.hooks?.afterLoad?.({ cwd, config, tokens, ...(file ? { path: file } : {}) });
    return {
        config,
        ...(file ? { path: file } : {}),
        ...(parentFile ? { parentPath: parentFile } : {}),
        ...(error ? { error } : {}),
        tokens,
        projectType: resolveProjectType(cwd, config),
    };
}
