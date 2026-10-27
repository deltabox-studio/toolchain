/**
 * The migration registry.
 *
 * Registering a {@link ToolchainMigration} here exposes it through the
 * `dbx migrate` CLI and the programmatic API. Adding support for a new
 * source tool (Svgo, Stylelint, ...) is a matter of implementing the interface
 * and appending it to {@link migrations}.
 */

import { biomeToOx } from './biome.js';
import { dprintToOx } from './dprint.js';
import { eslintToOx } from './eslint.js';
import { oxcToToolchain } from './oxc.js';
import { prettierToOx } from './prettier.js';
import type {
    MigrateTool,
    MigrationContext,
    MigrationResult,
    ToolchainMigration,
} from './types.js';
import { viteToToolchain } from './vite.js';

/** Every registered migration. */
export function migrations(): ToolchainMigration[] {
    return [biomeToOx, prettierToOx, dprintToOx, eslintToOx, oxcToToolchain, viteToToolchain];
}

/** A migration summary for listings. */
export interface MigrationInfo {
    id: string;
    from: MigrateTool;
    to: MigrateTool;
    description: string;
    /** Whether the source config is present in the project. */
    detected: boolean;
}

/** Describe every migration, flagging which are detected in `cwd`. */
export function listMigrations(cwd: string): MigrationInfo[] {
    return migrations().map(migration => ({
        id: migration.id,
        from: migration.from,
        to: migration.to,
        description: migration.description,
        detected: migration.detect(cwd),
    }));
}

/** The migrations whose source config is present in `cwd`. */
export function detectMigrations(cwd: string): ToolchainMigration[] {
    return migrations().filter(migration => migration.detect(cwd));
}

/** Find a migration by id, or by source tool. */
export function findMigration(idOrFrom: string): ToolchainMigration | undefined {
    return migrations().find(migration => migration.id === idOrFrom || migration.from === idOrFrom);
}

/** Run one migration by id (or source tool name). */
export async function runMigration(
    idOrFrom: string,
    ctx: MigrationContext
): Promise<MigrationResult> {
    const migration = findMigration(idOrFrom);
    if (!migration) throw new Error(`Unknown migration "${idOrFrom}".`);
    return migration.run(ctx);
}

/** Run every migration detected in `ctx.cwd`. */
export async function runDetectedMigrations(ctx: MigrationContext): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    for (const migration of detectMigrations(ctx.cwd)) results.push(await migration.run(ctx));
    return results;
}
