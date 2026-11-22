import fs from 'node:fs';
import path from 'node:path';

import {
    findConfigFile as findConfigFileIn,
    findParentConfigFile as findParentConfigFileIn,
    findTsconfigFile,
    loadConfigAsync,
} from '@deltabox/toolchain/config';
import {
    assertWorkspaceEnabledScope,
    collectDbxPluginDescriptors,
    CONFIG_FILE_NAMES,
    deepMerge,
    type DbxConfig,
    type DbxPluginDescriptor,
    isPlainObject,
    type PackageJson,
    type ProjectType,
    projectFromPackageJson,
    readJsonAt,
    type Replacements,
    resolveTokens,
    sectionConfig,
    sectionEnabled,
    type ToolchainConfig,
    type ToolchainLoaderConfig,
    type ToolchainProjectConfig,
} from '@deltabox/toolchain/shared';

import { resolveProjectType } from './project-type.js';
import { readGlobalEnabled } from './provider-registry.js';

export { findTsconfigFile };

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
    /** Whether the project has no `dbx.config.*` of its own but an ancestor config. */
    configless: boolean;
    /**
     * Whether the toolchain should manage this project. A config-bearing project
     * is always managed; a configless project only when configless management is
     * enabled (CLI `--configless` or `project.manageConfigless`).
     */
    managed: boolean;
    /**
     * Whether the config came from a `dbx()` Vite/Vite+ plugin. In plugin mode
     * the toolchain never manages `vite.config.*` (the plugin lives there) and
     * watches the plugin config instead.
     */
    plugin: boolean;
    /** The `vite.config.*` that carries the `dbx()` plugin, when {@link plugin}. */
    pluginPath?: string;
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
    /**
     * Override the tsconfig used to import the config file. `false` disables
     * tsconfig resolution. When omitted, the nearest `tsconfig.json` (or the
     * parent config's `loader.tsconfig`) is used.
     */
    loaderTsconfig?: string | false;
    /**
     * Manage projects without their own `dbx.config.*` by inheriting the nearest
     * ancestor config. Overrides `project.manageConfigless`. @default `false`
     */
    manageConfigless?: boolean;
    /**
     * Do not probe a `vite.config.*` for a `dbx()` plugin. Internal: the plugin
     * itself sets this when it loads the dbx config from Vite, so evaluating the
     * config cannot recurse back into itself.
     */
    skipPluginProbe?: boolean;
}

/** A short, single-line description of a thrown config error. */
function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** Find the first `dbx.config.*` file at `cwd`, if any. */
export function findConfigFile(cwd: string = process.cwd()): string | undefined {
    return findConfigFileIn({
        cwd,
        names: CONFIG_FILE_NAMES,
        locations: ['.'],
        followSymlinks: false,
    });
}

/**
 * Find the nearest ancestor `dbx.config.*` above `cwd` (never `cwd` itself).
 * The walk stops at a repository boundary (a `.git` directory) or the
 * filesystem root, so a nested project cannot inherit a config from outside its
 * repository.
 */
export function findParentConfigFile(cwd: string = process.cwd()): string | undefined {
    return findParentConfigFileIn({
        cwd,
        names: CONFIG_FILE_NAMES,
        locations: ['.'],
        followSymlinks: false,
    });
}

/** The Vite config file names, in Vite's own resolution order. */
export const VITE_CONFIG_FILE_NAMES = [
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.ts',
    'vite.config.cjs',
    'vite.config.mts',
    'vite.config.cts',
] as const;

/** Find the first `vite.config.*` at `cwd`, if any. */
export function findViteConfigFile(cwd: string = process.cwd()): string | undefined {
    return findConfigFileIn({
        cwd,
        names: VITE_CONFIG_FILE_NAMES,
        locations: ['.'],
        followSymlinks: false,
    });
}

/** A generated dbx shim loads the config from `dbx.config.*`; never re-import it. */
const GENERATED_VITE_SHIM = /Generated by @deltabox\/toolchain|resolveVite\s*[<(]/;

/** A config that plausibly imports/uses the dbx plugin. */
const DBX_PLUGIN_SOURCE =
    /@deltabox\/toolchain(?:\/vite)?['"]|vite-plugin-dbx['"]|\bdbx\s*\(|deltabox-toolchain/;

/** Whether `file` is a hand-written Vite config that uses the `dbx()` plugin. */
export function isDbxPluginConfig(file: string): boolean {
    try {
        const source = fs.readFileSync(file, 'utf-8');
        return !GENERATED_VITE_SHIM.test(source) && DBX_PLUGIN_SOURCE.test(source);
    } catch {
        return false;
    }
}

/**
 * Find the nearest ancestor `vite.config.*` that carries the `dbx()` plugin
 * above `cwd` (never `cwd` itself). This is the plugin-mode equivalent of
 * {@link findParentConfigFile}: a workspace whose only config is the Vite plugin
 * can still inherit its root's `fmt`/`lint`/`project` sections. The walk stops
 * at a repository boundary (`.git`) or the filesystem root.
 */
export function findParentPluginConfigFile(cwd: string = process.cwd()): string | undefined {
    return findParentConfigFileIn({
        cwd,
        names: VITE_CONFIG_FILE_NAMES,
        locations: ['.'],
        followSymlinks: false,
        accept: isDbxPluginConfig,
    });
}

/** Turn one plugin descriptor into a `vite`-less toolchain config. */
function descriptorConfig(descriptor: DbxPluginDescriptor): ToolchainConfig {
    const { vite: _vite, ...toolchain } = descriptor.toolchain as ToolchainConfig & {
        vite?: unknown;
    };
    return toolchain;
}

/**
 * Read the `dbx()` plugin options out of a project's `vite.config.*`.
 *
 * The config module is evaluated (not Vite itself), so inline functions/hooks
 * survive and no Vite API is imported. A generated `resolveVite` shim is skipped
 * (it reads `dbx.config.*` and would recurse), and a config without any dbx
 * reference is never imported.
 */
async function readPluginConfig(
    cwd: string,
    tsconfig: string | false,
    fresh: boolean,
    tolerant: boolean
): Promise<{ config: ToolchainConfig; path: string } | undefined> {
    try {
        // `accept` skips a generated shim or a config that never references dbx,
        // so those are never imported (a non-plugin Vite config can fail to load
        // because of optional dependencies).
        const loaded = await loadConfigAsync({
            cwd,
            names: VITE_CONFIG_FILE_NAMES,
            locations: ['.'],
            accept: isDbxPluginConfig,
            fresh,
            tsconfig,
        });
        if (!loaded?.path) return undefined;
        // A Vite config may export a promise or a function; a function receives
        // the synthetic serve env below (do not call it with no arguments).
        let exported = await (loaded.config as unknown);
        if (typeof exported === 'function') {
            // Vite config functions receive `{ command, mode, ... }`; a plugin
            // config only reads these, so a synthetic serve env is safe.
            exported = await (exported as (env: unknown) => unknown)({
                command: 'serve',
                mode: 'development',
                isSsrBuild: false,
                isPreview: false,
            });
        }
        const descriptors = collectDbxPluginDescriptors(exported);
        if (descriptors.length === 0) return undefined;
        let config: ToolchainConfig = {};
        for (const descriptor of descriptors) {
            config = mergeToolchainConfig(config, descriptorConfig(descriptor));
        }
        return { config, path: loaded.path };
    } catch (error) {
        if (tolerant) return undefined;
        throw error;
    }
}

/**
 * Resolve the tsconfig a config file is imported with. Precedence: an explicit
 * option, then the parent config's `loader.tsconfig`, then the nearest
 * `tsconfig.json` above the config file. Returns `false` when tsconfig
 * resolution is disabled (or no tsconfig exists).
 */
function resolveLoaderTsconfig(
    cwd: string,
    configFile: string | undefined,
    override: string | false | undefined,
    parentLoader: boolean | ToolchainLoaderConfig | undefined
): string | false {
    const resolve = (value: string): string => path.resolve(cwd, value);
    if (override !== undefined) return override === false ? false : resolve(override);
    const parentSetting = sectionEnabled(parentLoader)
        ? sectionConfig(parentLoader)?.tsconfig
        : undefined;
    if (parentSetting === false) return false;
    if (typeof parentSetting === 'string') return resolve(parentSetting);
    const start =
        configFile && fs.existsSync(configFile) ? path.dirname(configFile) : path.resolve(cwd);
    return findTsconfigFile(start) ?? false;
}

/**
 * Read the `toolchain` section out of a config module.
 *
 * Discovery and importing both go through the shared config loader: the exact
 * file is looked up by name and imported with its tsconfig-aware
 * native/`tsx` fallback.
 */
async function readToolchainConfig(
    file: string,
    tsconfig: string | false,
    fresh = false
): Promise<ToolchainConfig> {
    const loaded = await loadConfigAsync({
        cwd: path.dirname(file),
        names: [path.basename(file)],
        locations: ['.'],
        followSymlinks: false,
        fresh,
        tsconfig,
    });
    if (!loaded) throw new Error(`Config file not found: ${file}`);
    const resolved = await resolveConfigExport(loaded.config);
    const toolchain =
        resolved && typeof resolved === 'object' ? (resolved as DbxConfig).toolchain : undefined;
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
 * The inheritable part of a parent `project` section: the shared metadata
 * (author, license, repo, ...) without the per-project identity fields.
 */
function inheritedProject(
    project: ToolchainProjectConfig | undefined
): ToolchainProjectConfig | undefined {
    if (!project) return undefined;
    const shared = Object.fromEntries(
        Object.entries(project).filter(([key]) => !PROJECT_IDENTITY_KEYS.has(key))
    );
    return Object.keys(shared).length > 0 ? (shared as ToolchainProjectConfig) : undefined;
}

/**
 * Sections a nested config can opt into and inherit from its parent. A section
 * is only inherited when the nested config explicitly enables/configures it;
 * absent sections stay disabled for that project.
 */
const INHERITED_SECTIONS = ['fmt', 'lint', 'biome', 'changelog', 'catalogs', 'logger'] as const;

type InheritedSection = (typeof INHERITED_SECTIONS)[number];

/**
 * Merge an Oxc override (from `vite.fmt` / `vite.lint`) over the top-level
 * `fmt.oxc` / `lint.oxc`, using the same precedence as `resolveOxcFmtConfig`.
 */
function mergeOxcSetting(base: unknown, override: unknown): unknown {
    if (override === undefined) return base;
    if (override === false) return false;
    if (override === true) return base ?? true;
    if (base === undefined) return override;
    return isPlainObject(base) && isPlainObject(override) ? deepMerge(base, override) : override;
}

/**
 * The parent's effective `fmt` / `lint`, with its `vite.fmt` / `vite.lint`
 * hoisted into `fmt.oxc` / `lint.oxc`. The `vite` section itself is **never
 * inherited**; only these formatter/linter options flow down (and only when the
 * child opts into `fmt` / `lint`).
 */
function effectiveViteSection(parent: ToolchainConfig, section: 'fmt' | 'lint'): unknown {
    const base = (parent as Record<string, unknown>)[section];
    const vite = isPlainObject(parent.vite) ? (parent.vite as Record<string, unknown>) : undefined;
    const override = vite?.[section];
    if (override === undefined) return base;
    const baseObject = isPlainObject(base) ? base : {};
    return { ...baseObject, oxc: mergeOxcSetting(baseObject.oxc, override) };
}

/**
 * Merge a parent section under a child section the child explicitly opted into.
 * The child wins; `true` means "enable with the parent's options" and `false`
 * disables the section. The parent's section is only used as a base.
 */
function mergeSection(parent: unknown, child: unknown): unknown {
    if (child === undefined) return undefined;
    if (child === false) return false;
    if (parent === undefined || parent === false) return child;
    if (parent === true) return child;
    if (child === true) return parent;
    return isPlainObject(parent) && isPlainObject(child) ? deepMerge(parent, child) : child;
}

/** The parent section a nested config can inherit when it opts in. */
function parentSection(parent: ToolchainConfig, section: InheritedSection): unknown {
    return section === 'fmt' || section === 'lint'
        ? effectiveViteSection(parent, section)
        : (parent as Record<string, unknown>)[section];
}

/**
 * Merge an explicit config layer (the `dbx()` plugin options) over the config
 * already loaded for the **same** project. Unlike {@link mergeToolchainConfig}
 * this keeps the base's sections: a plugin that only sets `project` must not
 * drop the project's own `fmt`/`lint` from `dbx.config.*`.
 */
export function mergePluginLayer(base: ToolchainConfig, layer: ToolchainConfig): ToolchainConfig {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(layer)) {
        if (value === undefined) continue;
        const existing = result[key];
        result[key] =
            isPlainObject(existing) && isPlainObject(value) ? deepMerge(existing, value) : value;
    }
    return result as ToolchainConfig;
}

/**
 * Inherit the ancestor config for a **managed configless** project. Unlike a
 * nested config (where each section is strictly opt-in), the
 * `manageConfigless` / `--configless` opt-in is the explicit opt-in for the
 * whole project, so every inheritable section is copied.
 */
function inheritConfiglessConfig(parent: ToolchainConfig): ToolchainConfig {
    const result: Record<string, unknown> = { ...parent };
    // Hoist vite.fmt/lint before dropping the vite section.
    for (const section of ['fmt', 'lint'] as const) {
        const hoisted = effectiveViteSection(parent, section);
        if (hoisted !== undefined) result[section] = hoisted;
    }
    for (const key of [
        'ci',
        'tsconfig',
        'loader',
        'templates',
        'registry',
        'watch',
        'providers',
        'vite',
        'hooks',
    ]) {
        delete result[key];
    }
    const shared = inheritedProject(parent.project);
    if (shared) result.project = shared;
    else delete result.project;
    return result as ToolchainConfig;
}

/**
 * Merge an ancestor config under a project's own config. A nested config must
 * **explicitly enable/configure a section** for it to be inherited; sections it
 * omits stay disabled for that project. When it does opt in, objects are merged
 * and leaves (booleans, strings, numbers, arrays) in the child **replace** the
 * ancestor's value.
 *
 * Some sections are repository/workspace-scoped and are **never inherited**:
 * - `ci`: workflows are repository-level;
 * - `tsconfig` / `loader`: the root expands every workspace tsconfig, and the
 *   loader reads the nearest project tsconfig (see `loader.tsconfig`);
 * - `templates` / `registry` / `providers`: sources and provider policy are
 *   resolved from the root config before commands run;
 * - `watch`: watch behaviour belongs to the root `dbx watch` process;
 * - `vite`: a nested project only has the `vite` config it declares itself (so
 *   its hand-written `vite.config.*` is never overwritten). Its `vite.fmt` /
 *   `vite.lint` are hoisted into `fmt.oxc` / `lint.oxc` when the child opts into
 *   `fmt` / `lint`;
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
    const { project: parentProject } = parent;
    // Start from the child: parent-only sections are never inherited.
    const result: Record<string, unknown> = { ...child };
    for (const section of INHERITED_SECTIONS) {
        const childSection = (child as Record<string, unknown>)[section];
        if (childSection === undefined) continue;
        result[section] = mergeSection(parentSection(parent, section), childSection);
    }
    if (child.project?.inherit !== false) {
        const shared = inheritedProject(parentProject);
        if (shared) result.project = { ...shared, ...child.project };
    }
    return result as ToolchainConfig;
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
    if (options.config && options.noConfig) {
        throw new Error('`--config` and `--no-config` cannot be used together.');
    }
    const file = options.noConfig
        ? undefined
        : options.config
          ? path.isAbsolute(options.config)
              ? options.config
              : path.resolve(cwd, options.config)
          : findConfigFile(cwd);
    // An explicit `--config` is the whole config: never discover an ancestor to
    // merge under it (the option is documented as "instead of discovering one").
    const parentFile = options.noConfig || options.config ? undefined : findParentConfigFile(cwd);
    // Plugin-mode projects have no `dbx.config.*`; their root config lives in a
    // `vite.config.*` carrying the `dbx()` plugin. Use it as the parent layer so
    // a workspace still inherits the root's `fmt`/`lint`/`project` sections.
    const parentPluginFile =
        options.noConfig || options.config || parentFile
            ? undefined
            : findParentPluginConfigFile(cwd);
    const tolerant = options.tolerant ?? false;
    const fresh = options.fresh ?? false;

    let config: ToolchainConfig = {};
    let ownConfig: ToolchainConfig = {};
    let parentConfig: ToolchainConfig | undefined;
    let error: string | undefined;
    let configless = false;
    let managed = false;
    const parentTsconfig = resolveLoaderTsconfig(
        cwd,
        parentFile,
        options.loaderTsconfig,
        undefined
    );
    if (parentFile) {
        try {
            parentConfig = await readToolchainConfig(parentFile, parentTsconfig, fresh);
            config = parentConfig;
        } catch (cause) {
            if (!tolerant) throw cause;
            error = `failed to load ${parentFile}: ${errorMessage(cause)}`;
        }
    } else if (parentPluginFile) {
        try {
            const parentTsconfigPlugin = resolveLoaderTsconfig(
                cwd,
                parentPluginFile,
                options.loaderTsconfig,
                undefined
            );
            const probed = await readPluginConfig(
                path.dirname(parentPluginFile),
                parentTsconfigPlugin,
                fresh,
                tolerant
            );
            if (probed) {
                parentConfig = probed.config;
                config = parentConfig;
            }
        } catch (cause) {
            if (!tolerant) throw cause;
            error = `failed to load ${parentPluginFile}: ${errorMessage(cause)}`;
        }
    }
    // A nested config uses the parent's loader tsconfig when it does not choose
    // one itself (the loader runs before config merging, so read it directly).
    const parentLoader = parentConfig?.loader;
    let ownTsconfig = resolveLoaderTsconfig(cwd, file, options.loaderTsconfig, parentLoader);
    if (file) {
        try {
            let own = await readToolchainConfig(file, ownTsconfig, fresh);
            // A config can select a different tsconfig for the loader. Re-import
            // once with it so its imports (paths, `.js` -> `.ts`) resolve with
            // the user's chosen tsconfig. The first pass must still be loadable.
            const ownLoader = sectionEnabled(own.loader) ? sectionConfig(own.loader) : undefined;
            // Keep the parent's loader choice when the config does not set one.
            const selectedTsconfig = resolveLoaderTsconfig(
                cwd,
                file,
                options.loaderTsconfig,
                ownLoader ?? parentLoader
            );
            if (selectedTsconfig !== ownTsconfig) {
                ownTsconfig = selectedTsconfig;
                own = await readToolchainConfig(file, ownTsconfig, true);
            }
            ownConfig = own;
            managed = true;
            // Merge over the ancestor only when it actually loaded; otherwise the
            // project's own config stands alone.
            config =
                (parentFile || parentPluginFile) && !error
                    ? mergeToolchainConfig(config, own)
                    : own;
        } catch (cause) {
            if (!tolerant) throw cause;
            error = `failed to load ${file}: ${errorMessage(cause)}`;
        }
    } else if (parentConfig) {
        // A project with no config of its own is **not managed by default**. It
        // only inherits the ancestor config when configless management is opted
        // in (CLI `--configless` or `project.manageConfigless`).
        configless = true;
        managed = options.manageConfigless ?? parentConfig.project?.manageConfigless === true;
        if (managed) {
            // Inherit exactly like a child config with no sections:
            // workspace-scoped sections (`ci`, `tsconfig`, `loader`, `vite`,
            // `templates`, `registry`, `watch`, `providers`) and hooks are
            // dropped, and the parent's project identity is stripped (so
            // detection uses this project's own files and `package.json`
            // supplies `name`/`scope`/`description`).
            config = inheritConfiglessConfig(parentConfig);
        } else {
            // Not opted in: start from an empty config so nothing is inherited.
            config = {};
        }
    }

    // Plugin mode: a `dbx()` Vite plugin can carry the config inline, so no
    // `dbx.config.*` is required. The plugin config is a project-level layer
    // merged on top of whatever dbx config was found (strict opt-in sections).
    let plugin = false;
    let pluginPath: string | undefined;
    if (!options.noConfig && !options.config && !options.skipPluginProbe) {
        const probed = await readPluginConfig(cwd, ownTsconfig, fresh, tolerant);
        if (probed) {
            plugin = true;
            pluginPath = probed.path;
            if (managed) {
                config = mergePluginLayer(config, probed.config);
                ownConfig = mergePluginLayer(ownConfig, probed.config);
            } else if (parentConfig && !error) {
                config = mergeToolchainConfig(parentConfig, probed.config);
                ownConfig = probed.config;
                managed = true;
                configless = false;
            } else {
                config = probed.config;
                ownConfig = probed.config;
                managed = true;
                configless = false;
            }
        }
    }

    // When a `project` field is not defined, fall back to the project's own
    // `package.json` value (so tokens are correct without a config).
    // Config files and the Vite plugin are workspace-scoped; the global scope is
    // reserved for the CLI/programmatic API and the VS Code extension.
    assertWorkspaceEnabledScope(config, plugin ? 'vite plugin' : 'config file');
    // A global CLI switch only applies when the project config does not set
    // `enabled`; the project's own workspace value always wins.
    if (config.enabled === undefined) {
        const globalEnabled = readGlobalEnabled();
        if (globalEnabled !== undefined) {
            config = {
                ...config,
                enabled: { scope: 'global', disabled: !globalEnabled },
            };
        }
    }
    const pkg = readJsonAt<PackageJson>(cwd, 'package.json');
    const project = {
        ...(pkg ? projectFromPackageJson(pkg) : undefined),
        ...(config.project ?? undefined),
    };
    const tokens = resolveTokens({ ...config, project });
    if (!options.skipHooks) {
        await config.hooks?.afterLoad?.({
            cwd,
            config,
            tokens,
            ...(file ? { path: file } : pluginPath ? { path: pluginPath } : {}),
        });
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
        configless,
        managed,
        plugin,
        ...(pluginPath ? { pluginPath } : {}),
    };
}
