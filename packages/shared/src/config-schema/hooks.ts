import { z } from 'zod';

/**
 * A lifecycle-hook callback. JSON Schema cannot express functions, so the
 * generated types/docs use the hand-written `tsType` signature while the
 * runtime validator only requires a function (TS/JS configs only).
 */
function hookCallback(tsType: string, description: string) {
    return z
        .function({ input: [z.unknown()], output: z.unknown() })
        .describe(description)
        .meta({ tsType });
}

/** Lifecycle hooks, declared as functions in `dbx.config.ts` (not JSON). */
export const toolchainHooksSchema = z
    .object({
        afterLoad: hookCallback(
            '(info: { cwd: string; config: ToolchainConfig; tokens: Replacements; path?: string }) => Awaitable<void>',
            'Runs after the config is loaded and its tokens are resolved.'
        ).optional(),
        beforeSync: hookCallback(
            '(ctx: SyncContext) => Awaitable<void>',
            'Runs once before the sync tasks.'
        ).optional(),
        beforeTask: hookCallback(
            '(info: { task: SyncTask; ctx: SyncContext }) => Awaitable<void>',
            'Runs before each sync task.'
        ).optional(),
        afterTask: hookCallback(
            '(info: { task: SyncTask; ctx: SyncContext; files?: ManagedFile[] }) => Awaitable<void>',
            'Runs after each sync task, with the files it produced (if any).'
        ).optional(),
        afterSync: hookCallback(
            '(info: { cwd: string; config: ToolchainConfig; result: SyncSummary }) => Awaitable<void>',
            'Runs once after the sync tasks with the result summary.'
        ).optional(),
        afterVersion: hookCallback(
            '(info: { cwd: string; version: string; changelog?: ChangelogConfig }) => Awaitable<void>',
            'Runs after `dbx changelog` writes the new versions and changelogs.'
        ).optional(),
        onChange: hookCallback(
            '(info: { path?: string }) => Awaitable<void>',
            'Runs on every watch-triggered change.'
        ).optional(),
    })
    .describe('Lifecycle hooks (functions; TS/JS configs only). Return values are awaited.')
    .meta({ id: 'ToolchainHooks' });
