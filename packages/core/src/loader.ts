import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    CONFIG_FILE_NAMES,
    deepMerge,
    type DbxConfig,
    isPlainObject,
    type PackageJson,
    type ProjectType,
    projectFromPackageJson,
    readJsonAt,
    type Replacements,
    resolveTokens,
    type ToolchainConfig,
    type ToolchainViteConfig,
} from '@deltabox/toolchain-shared';

import { resolveProjectType } from './project-type.js';

/** A loaded tooling config plus its resolved path + replacement tokens. */
export interface LoadedConfig {
    config: ToolchainConfig;
    /** The config from this project's own file (not the inherited parent). */
    ownConfig: ToolchainConfig;
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
    /** Load this config file instead of discovering `dbx.config.*`. */
    config?: string;
    /** Ignore every config file and use defaults / CLI flags only. */
    noConfig?: boolean;
    /** Skip the config's `hooks.afterLoad` callback (metadata-only loads). */
    skipHooks?: boolean;
    /**
     * Bypass the ESM/CJS module cache. Long-running callers (eg. `dbx watch`)
     * must set this so an edited config is actually re-evaluated.
     */
    fresh?: boolean;
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

/**
 * Whether a failed native import means Node simply cannot load TypeScript
 * itself — the only case where the `tsx` fallback helps. Older Node lacks type
 * stripping (`ERR_UNKNOWN_FILE_EXTENSION`) and strip-only mode rejects syntax a
 * transpiler handles (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`).
 *
 * A genuine failure (an unresolvable import, a syntax error, a throw during
 * evaluation) must **propagate**: a fallback loader might "succeed" and yield an
 * empty config, silently hiding a broken `dbx.config.*`.
 */
function isUntranspiledError(error: unknown): boolean {
    const code = (error as { code?: unknown } | null)?.code;
    return code === 'ERR_UNKNOWN_FILE_EXTENSION' || code === 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX';
}

/**
 * Unwrap a module's default export. `tsx`'s CJS interop can report the default
 * once or twice (`{ default: X }` / `{ default: { default: X } }`), depending on
 * the Node/module combination.
 */
function unwrapDefault(mod: unknown): unknown {
    let value = mod;
    for (let depth = 0; depth < 2; depth++) {
        if (
            value &&
            typeof value === 'object' &&
            'default' in value &&
            Object.keys(value).every(key => key === 'default' || key === '__esModule')
        ) {
            value = (value as { default: unknown }).default;
        } else {
            break;
        }
    }
    return value;
}

const require = createRequire(import.meta.url);
let importNonce = 0;

/** Import a config module: JSON natively, TS/JS via dynamic import (tsx fallback). */
async function importModule(file: string, fresh = false): Promise<unknown> {
    if (file.endsWith('.json')) {
        // Strip a UTF-8 BOM: editors/PowerShell often write one, and JSON.parse
        // rejects it (the other JSON readers in the toolchain strip it too).
        return JSON.parse(fs.readFileSync(file, 'utf-8').replace(/^\uFEFF/, ''));
    }
    if (fresh) {
        // A `.cjs` config is loaded through Node's require cache even from
        // `import()`, so drop it before re-evaluating.
        try {
            delete require.cache[file];
        } catch {
            // not a require-cached module
        }
    }
    const base = pathToFileURL(file).href;
    // ESM caches by URL: a unique query is what makes `dbx watch` see an edit.
    const url = fresh ? `${base}?dbx=${Date.now()}-${++importNonce}` : base;
    try {
        const mod = (await import(url)) as { default?: unknown };
        return mod.default ?? mod;
    } catch (error) {
        // Node can import TS directly in recent versions; only reach for tsx when
        // it genuinely cannot (see {@link isUntranspiledError}).
        if (!isUntranspiledError(error)) throw error;
        const { tsImport } = await import('tsx/esm/api');
        return unwrapDefault(await tsImport(url, import.meta.url));
    }
}

/** Read the `toolchain` section out of a config module. */
async function readToolchainConfig(file: string, fresh = false): Promise<ToolchainConfig> {
    const loaded = await resolveConfigExport(await importModule(file, fresh));
    const toolchain =
        loaded && typeof loaded === 'object' ? (loaded as DbxConfig).toolchain : undefined;
    return toolchain && typeof toolchain === 'object' ? toolchain : {};
}

/**
 * Resolve a config module's export the way Vite does: await a promise, and call
 * a callback (then await its return value). This lets `defineConfig` accept
 * `{ ... }`, `Promise<{ ... }>` or `() => ({ ... }) | Promise<{ ... }>`.
 */
async function resolveConfigExport(value: unknown): Promise<unknown> {
    let resolved = await value;
    if (typeof resolved === 'function') resolved = await (resolved as () => unknown)();
    return resolved;
}

/** `project` fields that are per-project identity and are never inherited. */
const PROJECT_IDENTITY_KEYS = new Set(['name', 'scope', 'description', 'type']);

/**
 * `vite` keys that describe how a single workspace runs and are therefore not
 * inherited: `test` (that workspace's test config) and `run` (its Vite Tasks).
 * The rest of `vite` (`fmt`, `lint`, `plugins`, ...) is shared and flows down.
 */
const WORKSPACE_VITE_KEYS = new Set(['test', 'run']);

/** The inheritable part of a parent `vite` section (drops the workspace keys). */
function inheritedVite(vite: ToolchainConfig['vite']): ToolchainConfig['vite'] {
    if (!isPlainObject(vite)) return vite;
    const shared = Object.fromEntries(
        Object.entries(vite).filter(([key]) => !WORKSPACE_VITE_KEYS.has(key))
    );
    return Object.keys(shared).length > 0 ? (shared as ToolchainViteConfig) : undefined;
}

/**
 * Merge an ancestor config under a project's own config. Nested objects are
 * merged, while leaves (booleans, strings, numbers, arrays) in the child
 * **replace** the ancestor's value — so a non-root `dbx.config` can override
 * individual options of the root config (and keep the rest).
 *
 * Some sections are workspace-scoped and are **never inherited**:
 * - `ci` / the `changelog` section: workflows are repository-level;
 * - `tsconfig`: the root task expands every workspace tsconfig;
 * - `vite.test` and `vite.run`: they describe how that workspace runs;
 * - `hooks`: a parent's hooks are code and must not run for a nested sync.
 *
 * `project` is inherited **except the identity fields** (`name`, `scope`,
 * `description`, `type`): a workspace keeps its own name/description (or falls
 * back to its `package.json`), and is still detected from its own files — so a
 * root `project` never renames a workspace. The shared fields (author, license,
 * homepage, `repo`, `packageManager`, ...) flow down. `project.inherit: false`
 * disables project inheritance entirely.
 */
export function mergeToolchainConfig(
    parent: ToolchainConfig,
    child: ToolchainConfig
): ToolchainConfig {
    const {
        hooks: _hooks,
        project: parentProject,
        ci: _ci,
        changelog: _changelog,
        catalogs: _catalogs,
        tsconfig: _tsconfig,
        vite: parentVite,
        ...parentRest
    } = parent;
    let base = parentRest as ToolchainConfig;
    const vite = inheritedVite(parentVite);
    if (vite !== undefined) {
        base = { ...base, vite };
    }
    if (child.project?.inherit !== false && parentProject) {
        const shared = Object.fromEntries(
            Object.entries(parentProject).filter(([key]) => !PROJECT_IDENTITY_KEYS.has(key))
        );
        if (Object.keys(shared).length > 0) {
            base = { ...base, project: shared };
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
    const file = options.noConfig
        ? undefined
        : options.config
          ? path.isAbsolute(options.config)
              ? options.config
              : path.resolve(cwd, options.config)
          : findConfigFile(cwd);
    const parentFile = options.noConfig ? undefined : findParentConfigFile(cwd);
    const tolerant = options.tolerant ?? false;
    const fresh = options.fresh ?? false;

    let config: ToolchainConfig = {};
    let ownConfig: ToolchainConfig = {};
    let parentConfig: ToolchainConfig | undefined;
    let error: string | undefined;
    if (parentFile) {
        try {
            parentConfig = await readToolchainConfig(parentFile, fresh);
            config = parentConfig;
        } catch (cause) {
            if (!tolerant) throw cause;
            error = `failed to load ${parentFile}: ${errorMessage(cause)}`;
        }
    }
    if (file) {
        try {
            const own = await readToolchainConfig(file, fresh);
            ownConfig = own;
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
    if (!options.skipHooks) {
        await config.hooks?.afterLoad?.({ cwd, config, tokens, ...(file ? { path: file } : {}) });
    }
    // `tsconfig` is repository-scoped and not inherited, but a workspace still
    // needs the parent's custom `rootFile`/`defaultFile` names to be detected as
    // a workspace rather than a standalone project.
    const detectionConfig =
        config.tsconfig === undefined && parentConfig?.tsconfig !== undefined
            ? { ...config, tsconfig: parentConfig.tsconfig }
            : config;
    return {
        config,
        ownConfig,
        ...(file ? { path: file } : {}),
        ...(parentFile ? { parentPath: parentFile } : {}),
        ...(error ? { error } : {}),
        tokens,
        projectType: resolveProjectType(cwd, detectionConfig),
    };
}
