/** Public types for config-file discovery and loading. */

import type { ZodType } from 'zod';

import type { ParseConfigOptions } from './collect.js';
import type { ConfigSchema } from './schema.js';

/** Where a resolved config came from. */
export type ConfigSourceKind = 'file' | 'package.json' | 'none';

/** A loaded config plus its origin. */
export interface LoadedConfig<T = unknown> {
    /** The config value (validated/parsed when a parser or schema was provided). */
    config: T;
    /** The absolute config file (or the `package.json`). */
    path?: string;
    /** The source kind. */
    source: ConfigSourceKind;
    /** The `package.json` key that held the config, when `source` is that. */
    key?: string;
}

/** How an ancestor-config search ends. */
export interface ConfigParentSearch {
    /** Stop after checking a directory that holds a `.git` repository marker. */
    stopAtRepoRoot?: boolean;
    /** Stop the walk before searching this directory (the search starts at the parent of `cwd`). */
    stop?: (dir: string) => boolean;
}

/** Config-file discovery options. */
export interface ConfigFileOptions {
    /** The filename without its extension, eg. `dbx.config`. */
    filename: string;
    /** Throw instead of returning `undefined` when nothing is found. */
    required?: boolean;
    /** Resolve symlinks. @default true */
    followSymlinks?: boolean;
    /** Read the config from a `package.json` key. */
    packageJson?: { enabled?: boolean; key: string };
    /** The extensions tried for {@link ConfigFileOptions.filename}. */
    allowedFileExtensions?: string[];
    /** Where to look; `path` entries may be globs. */
    commonLocation?:
        | { cwd?: string; path: string | string[] }
        | Array<{ cwd?: string; path: string | string[] }>;
    /**
     * The tsconfig used to resolve a TypeScript config (path aliases, `.js` ->
     * `.ts`). Relative paths resolve against `cwd`; `false` disables tsconfig
     * resolution.
     */
    tsconfig?: string | false;
    /**
     * Also search ancestor directories when nothing is found in
     * {@link ConfigFileOptions.commonLocation}. `true` stops at the repository
     * root (`.git`) or the filesystem root.
     */
    parent?: boolean | ConfigParentSearch;
    /** Accept a discovered file; rejected files are skipped (eg. plugin configs). */
    accept?: (file: string) => boolean;
}

/** A named loader package plus its options. */
export interface LoaderConfig {
    /** The loader module (package or path). */
    name?: string;
    /** Alias for {@link LoaderConfig.name}. */
    loader?: string;
    /** Options forwarded to the loader. */
    options?: Record<string, unknown>;
}

/** A loader module name, config or custom function. */
export type LoaderValue =
    | string
    | LoaderConfig
    | ((file: string, options?: Record<string, unknown>) => unknown | Promise<unknown>);

/** Extensions a loader can be selected for. */
export type LoaderExtension = 'js' | 'ts' | 'yaml' | 'json';

/** A loader setting: one loader or a per-extension map. */
export type LoaderSetting = LoaderValue | Partial<Record<LoaderExtension, LoaderValue>>;

/** Loader selection options. */
export interface LoaderOptions {
    /** A loader, per-extension loaders, or a list of both (first match wins). */
    loader?: LoaderSetting | LoaderSetting[];
}

/** Discovery fields shared by the object-based and parser-based loaders. */
export interface LoadConfigDiscoveryOptions {
    /** The directory to search from. @default process.cwd() */
    cwd?: string;
    /**
     * Discovery options (filename/extensions/locations/package.json). Takes
     * precedence over the flat `names`/`locations`/`packageJsonKeys` fields.
     */
    configFileOptions?: ConfigFileOptions;
    /** Config file names to try, in order. */
    names?: readonly string[];
    /** Directories to search, relative to `cwd`. */
    locations?: readonly string[];
    /** `package.json` keys to try (eg. `['toolchain']`); omit to skip. */
    packageJsonKeys?: readonly string[];
    /** Throw instead of returning `undefined` when nothing is found. */
    required?: boolean;
    /** Resolve symlinks. @default true */
    followSymlinks?: boolean;
    /** The tsconfig used to resolve a TypeScript config (see {@link ConfigFileOptions.tsconfig}). */
    tsconfig?: string | false;
    /** Also search ancestor directories when nothing is found. */
    parent?: boolean | ConfigParentSearch;
    /** Accept a discovered file; rejected files are skipped. */
    accept?: (file: string) => boolean;
}

/** Options for the object-based loader API (no parser required). */
export interface LoadConfigOptions<T = unknown>
    extends LoaderOptions, LoadConfigDiscoveryOptions, ParseConfigOptions {
    /** Validate/normalize the loaded value. */
    schema?: ZodType<T>;
    /** Values merged over the file/env/CLI result before validation. */
    overrides?: Record<string, any>;
    /** Re-evaluate an already-imported module (watch/regenerate runs). */
    fresh?: boolean;
}

/**
 * The parser-based loader options. The loaded value is resolved through
 * `parseConfig` with the passed `parser` (env + CLI by default, then
 * `overrides`, then validation), so callers do not need to call
 * `parseConfig`/`parseEnvConfig`/`parseCliConfig` themselves.
 */
export type LoadConfigFileOptions<
    P extends ConfigSchema = ConfigSchema,
    O extends Record<string, any> | null | undefined = Record<string, any> | null | undefined,
> = LoadConfigDiscoveryOptions & {
    /** Resolve the loaded value through `parseConfig`. */
    parser: P;
    /** Overrides merged over the resolved config (after env/CLI). */
    overrides?: O;
    /** Re-evaluate an already-imported module (watch/regenerate runs). */
    fresh?: boolean;
} & LoaderOptions &
    ParseConfigOptions;

/** A candidate discovered on disk (or a `package.json` key). */
export interface ConfigCandidate {
    file: string;
    value?: unknown;
    key?: string;
    kind: 'file' | 'package.json';
}
