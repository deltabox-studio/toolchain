/** A Vite/Vitest compatible alias entry. */
export interface TsconfigAlias {
    find: string | RegExp;
    replacement: string;
}

/** A `RegExp` in its JSON-safe form. */
export interface TsconfigAliasPattern {
    /** The regular-expression source (without the surrounding slashes). */
    source: string;
    /** The regular-expression flags (usually empty). */
    flags: string;
}

/** A {@link TsconfigAlias} in its JSON-safe form. */
export interface SerializedTsconfigAlias {
    /** A literal prefix, or a `RegExp` split into `{ source, flags }`. */
    find: string | TsconfigAliasPattern;
    replacement: string;
}

/** A resolved project reference. */
export interface TsconfigReference {
    /** Path to the referenced tsconfig (absolute unless `relativePaths` is true). */
    path: string;
    [key: string & {}]: unknown;
}

/** The result of `resolveTsconfig`. */
export interface ResolvedTsconfig {
    /** Vite/Vitest `resolve.alias` entries (absolute replacements unless `relativePaths` is true). */
    alias: TsconfigAlias[];
    /** Resolved `compilerOptions.paths` (absolute targets unless `relativePaths` is true). */
    paths: Record<string, string[]>;
    /** Resolved project references (absolute paths unless `relativePaths` is true). */
    references: TsconfigReference[];
    /** Whether the returned paths are relative. */
    relativePaths: boolean;
    /** Whether exact aliases are anchored regexes (default true). */
    strict: boolean;
}

export interface ResolveTsconfigOptions {
    /** Explicit tsconfig file (relative to `cwd`/`root`, or absolute). */
    tsconfig?: string;
    /** Directory used to resolve a relative `tsconfig` and to detect the config. */
    cwd?: string;
    /** Repo/workspace root (default: `cwd`). Used to detect the default config. */
    root?: string;
    /**
     * Return relative paths instead of absolute paths (default false). Paths are
     * relative to the config that defines them (its `baseUrl` for `paths`, its
     * directory for `references`), matching how TypeScript resolves them.
     */
    relativePaths?: boolean;
    /**
     * Anchor exact aliases as `^...$` regexes (default true) so a bundler never
     * resolves a module through a shorter prefix (`@acme/core` vs
     * `@acme/core-utils`). Set `false` to keep exact aliases as plain strings.
     */
    strict?: boolean;
    /** Follow `extends` (default true). */
    extends?: boolean;
    /** Deep-merged into the selected config before reading its fields. */
    overrides?: object;
}

export interface TsconfigJson {
    extends?: string | string[];
    /** Files/globs the config includes (inherited through `extends`). */
    include?: string[];
    /** Files/globs the config excludes (inherited through `extends`). */
    exclude?: string[];
    /** Explicit file list (inherited through `extends`). */
    files?: string[];
    compilerOptions?: {
        baseUrl?: string;
        rootDir?: string;
        outDir?: string;
        paths?: Record<string, string[]>;
    };
    references?: { path: string; [key: string & {}]: unknown }[];
}

export interface PrefetchTsconfigOptions {
    /** Directory used to resolve package `extends` inside remote configs. */
    packageDir?: string;
    /** Files that will be generated on this run (assumed to exist). */
    assumeFiles?: Iterable<string>;
}

/**
 * The `include` / `exclude` patterns a tsconfig effectively uses, following
 * `extends` (the nearest definition wins, the same way TypeScript resolves
 * them). Each pattern is relative to the config file that defined it, so
 * `includeDir` / `excludeDir` tell callers how to rebase them.
 */
export interface TsconfigFilePatterns {
    include?: string[];
    exclude?: string[];
    files?: string[];
    /** Directory the `include` patterns are relative to. */
    includeDir?: string;
    /** Directory the `exclude` patterns are relative to. */
    excludeDir?: string;
    /** Directory the `files` entries are relative to. */
    filesDir?: string;
}
