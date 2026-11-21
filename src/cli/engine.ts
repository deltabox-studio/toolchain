/**
 * The config engine that backs the root CLI's schema-derived commands.
 *
 * Every section is wrapped in `section(...)` so the boolean shorthand
 * (`sync: true`) and the object form both validate. Command files only add
 * their runtime-only flags; config-backed flags come from these schemas.
 */

import { createConfigEngine, type ConfigEngineCliProgram } from '@deltabox/toolchain/config';
import {
    section,
    syncConfigSchema,
    type ToolchainCommandContext,
    watchConfigSchema,
} from '@deltabox/toolchain/shared';

/** The root command scopes (only the ones with config-backed CLI flags). */
export const rootCommandSchema = {
    sync: section(syncConfigSchema),
    watch: section(watchConfigSchema),
} as const;

/** The engine `sync` / `watch` derive their flags and typed config from. */
export const rootCliEngine = createConfigEngine({
    schema: rootCommandSchema,
    envPrefix: 'DBX_',
});

/** The root program with the dbx host context fixed. */
export const rootCliProgram: ConfigEngineCliProgram<
    typeof rootCommandSchema,
    ToolchainCommandContext
> = rootCliEngine.cli.program;
