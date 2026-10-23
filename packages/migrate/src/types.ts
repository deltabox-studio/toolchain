/**
 * The migration model.
 *
 * A *migration* converts a project's tooling config from a source tool (Biome,
 * ESLint, Prettier, ...) to a target tool (Oxfmt / Oxlint, ie. "oxc"). Migrations
 * are pluggable: registering one here exposes it through the `dbx
 * migrate` CLI, the programmatic API and (over JSON) the VS Code extension.
 */

/** A tool a migration can read from or write to. */
export type MigrateTool =
    | 'biome'
    | 'eslint'
    | 'prettier'
    | 'dprint'
    | 'oxfmt'
    | 'oxlint'
    | 'oxc'
    | 'vite'
    | 'toolchain';

/** Where a migration writes its result. */
export type MigrateTarget = 'files' | 'vite';

export interface MigrationContext {
    /** The project root. */
    cwd: string;
    /**
     * `files` (default) writes `.oxfmtrc.json` / `.oxlintrc.json`; `vite` is
     * reserved for folding the config into `vite.config.ts`.
     */
    target?: MigrateTarget;
    /** Write the result (default false = dry-run). */
    write?: boolean;
    /** Allow network (eg. npx-based migrators). Default false. */
    online?: boolean;
    /**
     * Do not modify or remove the source tool's config file (eg. the folded
     * `vite.config.*`). Default false — the migration cleans it up.
     */
    ignoreViteConfigFile?: boolean;
    /** Do not touch the toolchain's managed/generated files. Default false. */
    ignoreManagedFiles?: boolean;
    /** Do not touch the `CHANGELOG.md`. Default false. */
    ignoreChangelog?: boolean;
}

/** A field that could not be mapped faithfully. */
export interface UnmappedItem {
    /** The source key/rule/option. */
    source: string;
    /** Why it could not be mapped. */
    reason: string;
}

/** A file a migration produces (or would produce) with its exact content. */
export interface MigrationFile {
    /** Absolute path. */
    path: string;
    /** The exact file content. */
    content: string;
}

export interface MigrationResult {
    id: string;
    from: MigrateTool;
    to: MigrateTool;
    /** Files written, or that would be written (dry-run). */
    written: string[];
    /** Files removed, or that would be removed (eg. the folded `vite.config.*`). */
    removed?: string[];
    /** The produced files with content (drives `--check`). */
    files?: MigrationFile[];
    /** The oxfmt config produced (present for formatter migrations). */
    oxfmt?: Record<string, unknown>;
    /** The oxlint config produced (present for linter migrations). */
    oxlint?: Record<string, unknown>;
    /** Source items with no target equivalent. */
    unmapped?: UnmappedItem[];
    /** Human-readable notes. */
    notes?: string[];
}

/** A pluggable config migration. */
export interface ToolchainMigration {
    /** Stable id, eg. `biome-to-oxc`. */
    id: string;
    /** The source tool. */
    from: MigrateTool;
    /** The target tool. */
    to: MigrateTool;
    /** Human-readable description. */
    description: string;
    /** Whether the source config is present in `cwd`. */
    detect: (cwd: string) => boolean;
    /** Run the migration. */
    run: (ctx: MigrationContext) => Promise<MigrationResult>;
}
