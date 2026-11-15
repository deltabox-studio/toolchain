import type { MigrationResult } from './result.js';

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
     * `files` (default) writes `.oxfmtrc.json` / `.oxlintrc.json`; `vite` merges
     * `fmt`/`lint` into `vite.config.ts` (or into `toolchain.vite` for the
     * `oxc` source).
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
