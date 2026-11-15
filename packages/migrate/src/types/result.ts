import type { MigrateTool } from './model.js';

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
